import json
import logging
import datetime
import hashlib
import uuid
from typing import Optional
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.database import get_db
from backend.models.all_models import PaymentEvent, Payment, Customer, Merchant, RecoveryCase, Organization
from backend.events.taxonomy import PaymentEventType, RecoveryEventType, WebhookEventType
from backend.services.razorpay_service import RazorpayService
from backend.services.recovery_engine import RecoveryEngine
from backend.services.audit_service import AuditService
from backend.services.crypto_service import CryptoService
from backend.services.sanitizer import sanitize_text
from backend.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

MAX_WEBHOOK_PAYLOAD_BYTES = 1_048_576  # 1MB limit to protect against OOM / DoS
MAX_REPLAY_WINDOW_SECONDS = 300        # 5 minutes timestamp drift tolerance

@router.post("/razorpay")
@router.post("/v1/razorpay")
@router.post("/razorpay/{org_id}")
@router.post("/v1/razorpay/{org_id}")
async def handle_razorpay_webhook(
    request: Request,
    org_id: Optional[str] = None,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db)
):
    """
    Real Razorpay Webhook Ingestion Pipeline:
    Razorpay Test Mode -> Webhook -> FastAPI Endpoint -> HMAC-SHA256 Signature Verification -> Event Ingestion -> Idempotency -> Recovery Workflow
    """
    received_at = datetime.datetime.utcnow()
    raw_body = await request.body()

    # 1. Payload size check (prevent buffer / memory exhaustion DoS)
    if len(raw_body) > MAX_WEBHOOK_PAYLOAD_BYTES:
        logger.warning(f"Rejected oversized webhook payload: {len(raw_body)} bytes.")
        try:
            AuditService.log_event(
                db=db,
                case_id=None,
                actor="Razorpay Ingress Defense",
                actor_type="GATEWAY",
                action=WebhookEventType.WEBHOOK_PAYLOAD_OVERSIZED.value,
                policy_result="BLOCKED",
                execution_result="REJECTED_413",
                decision={"reason": "PAYLOAD_TOO_LARGE", "payload_bytes": len(raw_body)},
                notes=f"Security defense: Webhook rejected due to oversized payload ({len(raw_body)} bytes > 1MB limit)."
            )
            db.commit()
        except Exception:
            pass
        raise HTTPException(
            status_code=413,
            detail="Webhook payload exceeds maximum allowable size limit of 1MB"
        )

    body_str = raw_body.decode("utf-8") if raw_body else "{}"

    # 2. HMAC-SHA256 Signature Verification
    if not x_razorpay_signature:
        logger.warning("Rejected Razorpay webhook with missing X-Razorpay-Signature header.")
        try:
            AuditService.log_event(
                db=db,
                case_id=None,
                actor="Razorpay HMAC-SHA256 Gateway",
                actor_type="GATEWAY",
                action=WebhookEventType.WEBHOOK_SIGNATURE_INVALID.value,
                policy_result="BLOCKED",
                execution_result="REJECTED_401",
                decision={"reason": "MISSING_SIGNATURE", "security_defense": True},
                notes="Security defense: Webhook rejected due to missing X-Razorpay-Signature header. Payload dropped."
            )
            db.commit()
        except Exception:
            pass
        raise HTTPException(status_code=401, detail="Missing X-Razorpay-Signature header")

    # Gated check: 'test_signature' is strictly forbidden in production or when DEMO_MODE is False
    allow_sandbox_test_sig = settings.DEMO_MODE and settings.ENVIRONMENT.lower() != "production"

    if x_razorpay_signature == "test_signature" and not allow_sandbox_test_sig:
        logger.warning("Rejected 'test_signature' bypass attempt in production/strict mode.")
        try:
            AuditService.log_event(
                db=db,
                case_id=None,
                actor="Razorpay HMAC-SHA256 Gateway",
                actor_type="GATEWAY",
                action=WebhookEventType.WEBHOOK_SIGNATURE_INVALID.value,
                policy_result="BLOCKED",
                execution_result="REJECTED_401",
                decision={"reason": "TEST_SIGNATURE_FORBIDDEN_IN_PROD", "security_defense": True},
                notes="Security defense: Webhook rejected 'test_signature' bypass attempt in production/strict mode."
            )
            db.commit()
        except Exception:
            pass
        raise HTTPException(
            status_code=401,
            detail="Invalid Razorpay webhook signature (test bypass prohibited in production)"
        )

    # Resolve target organization tenant (from URL path or default)
    target_org = None
    if org_id:
        target_org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not target_org:
            raise HTTPException(status_code=404, detail="Webhook organization tenant not found")
    else:
        target_org = db.query(Organization).first()

    webhook_secret = None
    if target_org and target_org.webhook_secret:
        try:
            webhook_secret = CryptoService.decrypt(target_org.webhook_secret)
        except Exception:
            webhook_secret = None

    if x_razorpay_signature != "test_signature" or not allow_sandbox_test_sig:
        # Verify against global secret first, then tenant-specific secret
        is_valid = RazorpayService.verify_webhook_signature(raw_body, x_razorpay_signature, secret=settings.RAZORPAY_WEBHOOK_SECRET)
        if not is_valid and webhook_secret and webhook_secret != settings.RAZORPAY_WEBHOOK_SECRET:
            is_valid = RazorpayService.verify_webhook_signature(raw_body, x_razorpay_signature, secret=webhook_secret)

        if not is_valid:
            logger.warning("Rejected Razorpay webhook with invalid/tampered HMAC-SHA256 signature.")
            try:
                AuditService.log_event(
                    db=db,
                    case_id=None,
                    actor="Razorpay HMAC-SHA256 Gateway",
                    actor_type="GATEWAY",
                    action=WebhookEventType.WEBHOOK_VERIFICATION_REJECTED.value,
                    policy_result="BLOCKED",
                    execution_result="REJECTED_401",
                    decision={"reason": "INVALID_SIGNATURE", "security_defense": True, "signature_received": f"{x_razorpay_signature[:10]}..."},
                    notes="Security defense: Webhook rejected due to invalid/forged HMAC-SHA256 signature. Payload dropped."
                )
                db.commit()
            except Exception:
                pass
            raise HTTPException(status_code=401, detail="Invalid Razorpay webhook signature (HMAC-SHA256 verification failed)")

    # 3. Payload validation
    try:
        payload = json.loads(body_str)
        if not isinstance(payload, dict):
            raise ValueError("Payload must be a JSON object")
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON payload: must be a valid JSON object")

    # 4. Replay Window Verification
    raw_event_timestamp = payload.get("created_at") or payload.get("event_timestamp") or request.headers.get("X-Razorpay-Event-Time")
    if raw_event_timestamp is not None:
        try:
            event_ts = float(raw_event_timestamp)
            current_ts = datetime.datetime.utcnow().timestamp()
            drift = abs(current_ts - event_ts)
            if drift > MAX_REPLAY_WINDOW_SECONDS:
                if settings.ENVIRONMENT.lower() == "production" or not settings.DEMO_MODE:
                    logger.warning(f"Rejected replayed/expired webhook: timestamp drift of {drift:.1f}s exceeds {MAX_REPLAY_WINDOW_SECONDS}s.")
                    try:
                        AuditService.log_event(
                            db=db,
                            case_id=None,
                            actor="Razorpay Ingress Defense",
                            actor_type="GATEWAY",
                            action=WebhookEventType.WEBHOOK_REPLAY_BLOCKED.value,
                            policy_result="BLOCKED",
                            execution_result="REJECTED_400",
                            decision={"reason": "TIMESTAMP_DRIFT_EXCEEDED", "drift_seconds": round(drift, 1)},
                            notes=f"Security defense: Webhook timestamp drift of {drift:.1f}s exceeds replay window of {MAX_REPLAY_WINDOW_SECONDS}s."
                        )
                        db.commit()
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=400,
                        detail=f"Webhook timestamp expired or outside allowable replay window of {MAX_REPLAY_WINDOW_SECONDS}s"
                    )
        except (ValueError, TypeError):
            pass

    # Extract Razorpay canonical event identifiers
    raw_event_id = payload.get("event_id") or payload.get("id") or f"event_rzp_{hashlib.sha256(raw_body).hexdigest()[:16]}"
    provider_event_id = sanitize_text(str(raw_event_id), max_length=100, escape_html=False)
    event_type = payload.get("event", PaymentEventType.PAYMENT_FAILED.value)

    # 5. Idempotency Check: UNIQUE(provider, provider_event_id)
    provider_name = "razorpay"
    existing_event = db.query(PaymentEvent).filter(
        PaymentEvent.provider == provider_name,
        PaymentEvent.provider_event_id == provider_event_id
    ).first()

    if existing_event:
        logger.info(f"Duplicate Razorpay webhook ignored (idempotent): provider={provider_name}, provider_event_id={provider_event_id}")
        existing_case = db.query(RecoveryCase).filter(
            RecoveryCase.payment_id == existing_event.payment_id
        ).first()
        try:
            AuditService.log_event(
                db=db,
                case_id=existing_case.case_id if existing_case else None,
                actor="Razorpay Idempotency Engine",
                actor_type="GATEWAY",
                action=WebhookEventType.WEBHOOK_DUPLICATE_BLOCKED.value,
                policy_result="PASSED",
                execution_result="DUPLICATE_IGNORED",
                decision={"reason": "DUPLICATE_EVENT_ID", "provider_event_id": provider_event_id},
                notes=f"Idempotency defense: Ignored duplicate Razorpay webhook event {provider_event_id}."
            )
            db.commit()
        except Exception:
            pass
        return {
            "status": "duplicate_ignored",
            "message": "Duplicate event already processed (idempotent)",
            "provider": provider_name,
            "provider_event_id": provider_event_id,
            "payment_id": existing_event.payment_id,
            "case_id": existing_case.case_id if existing_case else None,
            "recovery_status": existing_case.recovery_status if existing_case else None,
            "processed_at": existing_event.processed_at
        }

    # 3. Extract Merchant, Organization & Payment Entity
    org_id_val = target_org.org_id if target_org else None
    is_test_mode = target_org.is_test_mode if target_org else True
    src_val = "RAZORPAY_TEST" if is_test_mode else "RAZORPAY_LIVE"
    src_desc_val = (
        "Event received from Razorpay Test environment via HTTPS Webhook"
        if is_test_mode
        else "Real-time production payment event received from Razorpay Live via HTTPS Webhook"
    )

    merchant = db.query(Merchant).first()
    if not merchant:
        merchant = Merchant(
            merchant_id="m_apex_tech_2026",
            org_id=org_id_val,
            name="Apex Cloud Technologies",
            industry="Enterprise Fintech & SaaS"
        )
        db.add(merchant)
        db.commit()
        db.refresh(merchant)

    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    provider_payment_id = payment_entity.get("id", f"pay_rzp_{uuid.uuid4().hex[:8]}")
    amount_in_inr = round(float(payment_entity.get("amount", 499900)) / 100.0, 2) if payment_entity.get("amount") is not None else 4999.0
    email = payment_entity.get("email", "customer@enterprise.in")
    contact = payment_entity.get("contact", "+919820199201")
    error_code = payment_entity.get("error_code") or "BANK_DECLINE"
    error_desc = payment_entity.get("error_description") or "Issuer bank switch timed out"

    # Non-Negotiable Rule 5: Never store PAN, CVV, or full card data.
    card_info = payment_entity.get("card") or {}
    card_network = card_info.get("network") or "CARD"
    card_last4 = card_info.get("last4")

    # Find or Create Customer
    customer = db.query(Customer).filter(Customer.email == email).first()
    if not customer:
        customer = Customer(
            customer_id=f"cust_{uuid.uuid4().hex[:8]}",
            org_id=org_id_val,
            merchant_id=merchant.merchant_id,
            external_customer_id=f"cust_ext_{uuid.uuid4().hex[:8]}",
            name=payment_entity.get("notes", {}).get("customer_name", "Ingested Customer"),
            email=email,
            account_tier="RETURNING",
            total_successful_payments=1,
            total_failed_payments=1 if "fail" in event_type else 0,
            lifetime_value=amount_in_inr,
            consent_status=True
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # Find or Create Payment
    payment = db.query(Payment).filter(
        (Payment.provider_payment_id == provider_payment_id) | 
        (Payment.payment_id == provider_payment_id)
    ).first()

    if not payment:
        payment = Payment(
            payment_id=provider_payment_id,
            org_id=org_id_val,
            merchant_id=merchant.merchant_id,
            customer_id=customer.customer_id,
            provider="razorpay",
            provider_payment_id=provider_payment_id,
            order_id=payment_entity.get("order_id", f"order_rzp_{uuid.uuid4().hex[:8]}"),
            amount=amount_in_inr,
            currency=payment_entity.get("currency", "INR"),
            payment_method=payment_entity.get("method", "card"),
            status="FAILED" if "fail" in event_type else ("SUCCESS" if "captured" in event_type else "PENDING"),
            failure_code=error_code if "fail" in event_type else None,
            failure_reason=error_desc if "fail" in event_type else None,
            failure_category="temporary_bank_failure",
            retry_count=0,
            max_retry_count=2,
            source=src_val,
            source_description=src_desc_val,
            created_at=received_at,
            updated_at=received_at
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

    # 4. Ingest PaymentEvent Entity into Database (Razorpay Provenance)
    payment_event = PaymentEvent(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        org_id=org_id_val,
        provider="razorpay",
        provider_event_id=provider_event_id,
        event_type=event_type,
        payment_id=payment.payment_id,
        source=src_val,
        source_description=src_desc_val,
        raw_webhook_body=body_str,
        signature=x_razorpay_signature,
        payload_hash=hashlib.sha256(raw_body).hexdigest() if raw_body else None,
        payload=payload,
        received_at=received_at,
        processed_at=datetime.datetime.utcnow(),
        processing_status="PROCESSED"
    )
    try:
        db.add(payment_event)
        db.commit()
        db.refresh(payment_event)
    except IntegrityError:
        db.rollback()
        logger.warning(f"Concurrent duplicate Razorpay webhook caught by DB UNIQUE constraint: provider={provider_name}, provider_event_id={provider_event_id}")
        existing_event = db.query(PaymentEvent).filter(
            PaymentEvent.provider == provider_name,
            PaymentEvent.provider_event_id == provider_event_id
        ).first()
        existing_case = db.query(RecoveryCase).filter(
            RecoveryCase.payment_id == payment.payment_id
        ).first()
        try:
            AuditService.log_event(
                db=db,
                case_id=existing_case.case_id if existing_case else None,
                actor="Razorpay Idempotency Engine",
                actor_type="GATEWAY",
                action=WebhookEventType.WEBHOOK_DUPLICATE_BLOCKED.value,
                policy_result="PASSED",
                execution_result="DUPLICATE_IGNORED",
                decision={"reason": "CONCURRENT_DUPLICATE_INTEGRITY_ERROR", "provider_event_id": provider_event_id},
                notes=f"Idempotency defense: Caught concurrent duplicate event {provider_event_id} via database unique constraint."
            )
            db.commit()
        except Exception:
            pass
        return {
            "status": "duplicate_ignored",
            "message": "Duplicate event already processed (caught by database unique constraint)",
            "provider": provider_name,
            "provider_event_id": provider_event_id,
            "payment_id": payment.payment_id,
            "case_id": existing_case.case_id if existing_case else None,
            "recovery_status": existing_case.recovery_status if existing_case else None,
            "processed_at": existing_event.processed_at if existing_event else received_at
        }

    # 5. Route to Autonomous Recovery Workflow if payment failed
    if event_type in [PaymentEventType.PAYMENT_FAILED.value, "payment.failed", "payment.declined"]:
        case = RecoveryEngine.process_payment_failure(
            db=db,
            payment=payment,
            customer=customer,
            merchant=merchant
        )
        return {
            "status": "processed",
            "provider": "razorpay",
            "provider_event_id": provider_event_id,
            "event_type": event_type,
            "payment_id": payment.payment_id,
            "case_id": case.case_id,
            "recovery_status": case.recovery_status,
            "processed_at": payment_event.processed_at
        }
    
    # If payment was captured/authorized (e.g. out-of-order recovery confirmation)
    elif event_type in [PaymentEventType.PAYMENT_CAPTURED.value, "payment.captured", "payment.authorized"]:
        payment.status = "SUCCESS"
        db.commit()
        case = db.query(RecoveryCase).filter(RecoveryCase.payment_id == payment.payment_id).first()
        if case and case.recovery_status != "RECOVERED":
            case.recovery_status = "RECOVERED"
            case.recovered_amount = payment.amount
            case.outcome_verified = True
            case.resolved_at = datetime.datetime.utcnow()
            db.commit()
        return {
            "status": "processed",
            "provider": "razorpay",
            "provider_event_id": provider_event_id,
            "event_type": event_type,
            "payment_id": payment.payment_id,
            "payment_status": "SUCCESS"
        }

    return {
        "status": "received",
        "provider": "razorpay",
        "provider_event_id": provider_event_id,
        "event_type": event_type,
        "payment_id": payment.payment_id
    }
