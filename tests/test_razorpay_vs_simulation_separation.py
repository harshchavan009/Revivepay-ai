import json
import hmac
import hashlib
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models.all_models import Payment, PaymentEvent, RecoveryCase, AuditLog, Merchant, Customer
from backend.services.razorpay_service import RazorpayService
from backend.services.recovery_engine import RecoveryEngine
from backend.config import settings

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def generate_signature(payload_bytes: bytes, secret: str) -> str:
    return hmac.new(
        key=secret.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

def test_razorpay_test_mode_ingress_flow(db):
    """
    Validates the Real Razorpay Test Flow:
    Razorpay Test Mode -> HTTPS Webhook -> Signature Verification -> Idempotency -> Event Storage -> Recovery Pipeline
    """
    secret = settings.RAZORPAY_WEBHOOK_SECRET or "sandbox_test_webhook_secret"
    unique_suffix = uuid.uuid4().hex[:8]
    event_id = f"event_rzp_test_{unique_suffix}"
    pay_id = f"pay_rzp_test_{unique_suffix}"
    email = f"customer_{unique_suffix}@enterprise.in"

    payload = {
        "event_id": event_id,
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_id,
                    "amount": 549900,
                    "currency": "INR",
                    "method": "card",
                    "email": email,
                    "error_code": "BANK_DECLINE",
                    "error_description": "Issuer switch network failure"
                }
            }
        }
    }
    raw_bytes = json.dumps(payload).encode("utf-8")

    # 1. Signature Verification: Tampered signature MUST be rejected with HTTP 401
    bad_sig_resp = client.post(
        "/api/webhooks/razorpay",
        data=raw_bytes,
        headers={"X-Razorpay-Signature": "tampered_signature_hex_12345"}
    )
    assert bad_sig_resp.status_code == 401
    assert "Invalid Razorpay webhook signature" in bad_sig_resp.json()["detail"]

    # 2. Signature Verification: Valid HMAC-SHA256 signature is accepted
    valid_sig = generate_signature(raw_bytes, secret)
    resp1 = client.post(
        "/api/webhooks/razorpay",
        data=raw_bytes,
        headers={"X-Razorpay-Signature": valid_sig}
    )
    assert resp1.status_code == 200
    res1_data = resp1.json()
    assert res1_data["status"] == "processed"
    assert res1_data["provider"] == "razorpay"
    assert res1_data["case_id"] is not None

    # 3. Idempotency Check: Replaying the exact same event_id must return duplicate_ignored
    resp_replay = client.post(
        "/api/webhooks/razorpay",
        data=raw_bytes,
        headers={"X-Razorpay-Signature": valid_sig}
    )
    assert resp_replay.status_code == 200
    assert resp_replay.json()["status"] == "duplicate_ignored"

    # 4. Event Storage Verification: PaymentEvent stored with RAZORPAY_TEST source
    event_records = db.query(PaymentEvent).filter(
        PaymentEvent.provider == "razorpay",
        PaymentEvent.provider_event_id == event_id
    ).all()
    assert len(event_records) == 1, "Idempotency invariant violated: multiple event records found"
    stored_event = event_records[0]
    assert stored_event.source == "RAZORPAY_TEST"
    assert stored_event.signature == valid_sig
    assert stored_event.processing_status == "PROCESSED"

    # 5. Recovery Pipeline Verification: RecoveryCase created with RAZORPAY_TEST source
    stored_case = db.query(RecoveryCase).filter(RecoveryCase.payment_id == pay_id).first()
    assert stored_case is not None
    assert stored_case.source == "RAZORPAY_TEST"
    assert "Razorpay Test" in stored_case.source_description
    assert stored_case.recovery_status in ["ACTION_RECOMMENDED", "AWAITING_APPROVAL", "APPROVED", "AUTO_APPROVED"]

    # 6. Audit Trail: Case creation and lifecycle events reflect Razorpay Test provenance
    case_audit = db.query(AuditLog).filter(
        AuditLog.case_id == stored_case.case_id,
        AuditLog.action.in_(["recovery.case.created", "case.created"])
    ).first()
    assert case_audit is not None
    assert case_audit.actor == "Razorpay Ingestion Engine"
    assert case_audit.actor_type == "GATEWAY"
    assert case_audit.source == "RAZORPAY_TEST"

def test_simulation_lab_ingress_flow(db):
    """
    Validates the Simulation Flow:
    Simulation Button -> Backend Simulation Endpoint -> Same Recovery Pipeline
    """
    # Trigger simulation endpoint
    resp = client.post(
        "/api/simulation/trigger",
        json={
            "scenario": "bank_failure",
            "amount": 7500.0,
            "customer_type": "returning",
            "payment_method": "card"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "SIMULATION"
    assert data["case_id"] is not None

    case_id = data["case_id"]
    payment_id = data["payment_id"]

    # 1. Verify Payment entity has SIMULATION source
    sim_payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    assert sim_payment is not None
    assert sim_payment.source == "SIMULATION"
    assert "Synthetic" in sim_payment.source_description

    # 2. Verify PaymentEvent entity has SIMULATION source
    sim_event = db.query(PaymentEvent).filter(PaymentEvent.payment_id == payment_id).first()
    assert sim_event is not None
    assert sim_event.source == "SIMULATION"
    assert "Synthetic" in sim_event.source_description

    # 3. Verify RecoveryCase entity has SIMULATION source
    sim_case = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id).first()
    assert sim_case is not None
    assert sim_case.source == "SIMULATION"
    assert "Synthetic" in sim_case.source_description

    # 4. Verify AuditLog entity has SIMULATION source
    sim_audit = db.query(AuditLog).filter(
        AuditLog.case_id == case_id,
        AuditLog.action.in_(["recovery.case.created", "case.created"])
    ).first()
    assert sim_audit is not None
    assert sim_audit.actor == "Simulation Ingestion Node"
    assert sim_audit.actor_type == "SYSTEM"
    assert sim_audit.source == "SIMULATION"

def test_both_flows_converge_on_exact_same_recovery_pipeline(db):
    """
    Validates Architectural Invariant:
    Both RAZORPAY_TEST and SIMULATION execute through the exact same RecoveryEngine domain pipeline:
    - Root cause analysis
    - Multi-factor risk engine
    - Deterministic policy gateway
    - Finite state machine supervisor
    - Action execution and outcome verification
    """
    merchant = db.query(Merchant).first()
    customer = db.query(Customer).first()
    uid1 = uuid.uuid4().hex[:6]
    uid2 = uuid.uuid4().hex[:6]

    # Flow A: Payment from Razorpay Test Ingress
    rzp_payment = Payment(
        payment_id=f"pay_pipe_rzp_{uid1}",
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=3500.0,
        currency="INR",
        status="FAILED",
        failure_code="BANK_SWITCH_OUTAGE",
        failure_category="temporary_bank_failure",
        retry_count=0,
        max_retry_count=2,
        source="RAZORPAY_TEST",
        source_description="Event received from Razorpay Test environment via HTTPS Webhook"
    )
    db.add(rzp_payment)

    # Flow B: Payment from Simulation Lab
    sim_payment = Payment(
        payment_id=f"pay_pipe_sim_{uid2}",
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=3500.0,
        currency="INR",
        status="FAILED",
        failure_code="BANK_SWITCH_OUTAGE",
        failure_category="temporary_bank_failure",
        retry_count=0,
        max_retry_count=2,
        source="SIMULATION",
        source_description="Synthetic event generated by RevivePay Simulation Engine"
    )
    db.add(sim_payment)
    db.commit()

    # Both route through the EXACT same engine method: RecoveryEngine.process_payment_failure
    case_rzp = RecoveryEngine.process_payment_failure(db, rzp_payment, customer, merchant)
    case_sim = RecoveryEngine.process_payment_failure(db, sim_payment, customer, merchant)

    # Invariant 1: Identical diagnostic reasoning structure
    assert case_rzp.recommended_action == case_sim.recommended_action
    assert case_rzp.policy_status == case_sim.policy_status
    assert case_rzp.recovery_status == case_sim.recovery_status

    # Invariant 2: Clear, honest separation of provenance
    assert case_rzp.source == "RAZORPAY_TEST"
    assert case_sim.source == "SIMULATION"
    assert case_rzp.source != case_sim.source

    # Invariant 3: Both can be executed via the exact same RecoveryEngine.execute_recovery_action
    res_rzp = RecoveryEngine.execute_recovery_action(db, case_rzp, actor="Supervisor")
    res_sim = RecoveryEngine.execute_recovery_action(db, case_sim, actor="Supervisor")

    assert res_rzp["status"] in ["RECOVERED", "FAILED", "ESCALATED", "ACTION_RECOMMENDED"]
    assert res_sim["status"] in ["RECOVERED", "FAILED", "ESCALATED", "ACTION_RECOMMENDED"]
