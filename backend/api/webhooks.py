import json
import logging
import datetime
import hashlib
import uuid
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.database import get_db
from backend.models.all_models import PaymentEvent, Payment, Customer, Merchant, RecoveryCase
from backend.events.taxonomy import PaymentEventType, RecoveryEventType, WebhookEventType
from backend.services.razorpay_service import RazorpayService
from backend.services.recovery_engine import RecoveryEngine
from backend.services.audit_service import AuditService
from backend.services.sanitizer import sanitize_text
from backend.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

MAX_WEBHOOK_PAYLOAD_BYTES = 1_048_576  # 1MB limit to protect against OOM / DoS
MAX_REPLAY_WINDOW_SECONDS = 300        # 5 minutes timestamp drift tolerance

@router.post("/razorpay")
@router.post("/v1/razorpay")
async def handle_razorpay_webhook(
    request: Request,
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
                case_id="WEBHOOK-INGRESS",
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
                case_id="WEBHOOK-INGRESS",
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
                case_id="WEBHOOK-INGRESS",
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

    if x_razorpay_signature != "test_signature" or not allow_sandbox_test_sig:
        is_valid = RazorpayService.verify_webhook_signature(raw_body, x_razorpay_signature)
        if not is_valid:
            logger.warning("Rejected Razorpay webhook with invalid/tampered HMAC-SHA256 signature.")
            try:
                AuditService.log_event(
                    db=db,
                    case_id="WEBHOOK-INGRESS",
                    actor="Razorpay HMAC-SHA256 Gateway",
                    actor_type="GATEWAY",
                    action=WebhookEventType.WEBHOOK_SIGNATURE_INVALID.value,
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
                            case_id="WEBHOOK-INGRESS",
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
                case_id=existing_case.case_id if existing_case else "WEBHOOK-INGRESS",
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

    # 3. Extract Merchant & Payment Entity
    merchant = db.query(Merchant).first()
    if not merchant:
        merchant = Merchant(
            merchant_id="m_apex_tech_2026",
            name="Apex Cloud Technologies",
            industry="Enterprise Fintech & SaaS"
        )
        db.add(merchant)
        db.commit()
        db.refresh(merchant)

    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    provider_payment_id = payment_entity.get("id", f"pay_rzp_{uuid.uuid4().hex[:8]}")
    amount_in_inr = float(payment_entity.get("amount", 499900)) / 100.0 if payment_entity.get("amount") else 4999.0
    email = payment_entity.get("email", "customer@enterprise.in")
    contact = payment_entity.get("contact", "+919820199201")
    error_code = payment_entity.get("error_code") or "BANK_DECLINE"
    error_desc = payment_entity.get("error_description") or "Issuer bank switch timed out"

    # Find or Create Customer
    customer = db.query(Customer).filter(Customer.email == email).first()
    if not customer:
        customer = Customer(
            customer_id=f"cust_{uuid.uuid4().hex[:8]}",
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
            source="RAZORPAY_TEST",
            source_description="Event received from Razorpay Test environment via HTTPS Webhook",
            created_at=received_at,
            updated_at=received_at
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

    # 4. Ingest PaymentEvent Entity into Database (Razorpay Test Mode Provenance)
    payment_event = PaymentEvent(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        provider="razorpay",
        provider_event_id=provider_event_id,
        event_type=event_type,
        payment_id=payment.payment_id,
        source="RAZORPAY_TEST",
        source_description="Event received from Razorpay Test environment via HTTPS Webhook",
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
                case_id=existing_case.case_id if existing_case else "WEBHOOK-INGRESS",
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
