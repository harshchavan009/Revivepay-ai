import json
import hmac
import hashlib
import uuid
import datetime
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models.all_models import Payment, PaymentEvent, RecoveryCase, Notification, Merchant, Customer
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

def test_same_webhook_twice_first_processed_second_ignored(db):
    """
    Validates Core Idempotency Invariant:
    Same webhook twice
           ↓
    First  → processed
    Second → ignored
    """
    secret = settings.RAZORPAY_WEBHOOK_SECRET or "sandbox_test_webhook_secret"
    suffix = uuid.uuid4().hex[:8]
    event_id = f"event_rzp_idem_{suffix}"
    pay_id = f"pay_rzp_idem_{suffix}"
    email = f"customer_{suffix}@enterprise.in"

    payload = {
        "event_id": event_id,
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_id,
                    "amount": 499900,
                    "currency": "INR",
                    "method": "card",
                    "email": email,
                    "error_code": "BANK_DECLINE",
                    "error_description": "Issuer switch network timeout (504)"
                }
            }
        }
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = generate_signature(raw_bytes, secret)

    # 1. FIRST DELIVERY -> PROCESSED
    resp1 = client.post(
        "/api/webhooks/razorpay",
        data=raw_bytes,
        headers={"X-Razorpay-Signature": sig}
    )
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["status"] == "processed"
    assert data1["provider"] == "razorpay"
    assert data1["provider_event_id"] == event_id
    assert data1["payment_id"] == pay_id
    assert data1["case_id"] is not None
    created_case_id = data1["case_id"]

    # 2. SECOND DELIVERY -> IGNORED SAFELY
    resp2 = client.post(
        "/api/webhooks/razorpay",
        data=raw_bytes,
        headers={"X-Razorpay-Signature": sig}
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["status"] == "duplicate_ignored"
    assert data2["provider"] == "razorpay"
    assert data2["provider_event_id"] == event_id
    assert data2["case_id"] == created_case_id

    # 3. VERIFY DATABASE INVARIANT: UNIQUE(provider, provider_event_id)
    events_in_db = db.query(PaymentEvent).filter(
        PaymentEvent.provider == "razorpay",
        PaymentEvent.provider_event_id == event_id
    ).all()
    assert len(events_in_db) == 1, "Violated: duplicate PaymentEvent record inserted"

def test_never_second_recovery_case_created(db):
    """
    Validates Invariant:
    Second webhook NEVER creates a second recovery case.
    UNIQUE(payment_id) and idempotency guards prevent duplicate workflows.
    """
    secret = settings.RAZORPAY_WEBHOOK_SECRET or "sandbox_test_webhook_secret"
    suffix = uuid.uuid4().hex[:8]
    event_id = f"event_rzp_norec_{suffix}"
    pay_id = f"pay_rzp_norec_{suffix}"

    payload = {
        "event_id": event_id,
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_id,
                    "amount": 899900,
                    "currency": "INR",
                    "method": "card",
                    "email": f"cust_{suffix}@test.com",
                    "error_code": "NETWORK_ERROR",
                    "error_description": "Timeout contacting bank"
                }
            }
        }
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = generate_signature(raw_bytes, secret)

    # Deliver 5 times in succession
    for i in range(5):
        r = client.post(
            "/api/webhooks/razorpay",
            data=raw_bytes,
            headers={"X-Razorpay-Signature": sig}
        )
        assert r.status_code == 200
        if i == 0:
            assert r.json()["status"] == "processed"
        else:
            assert r.json()["status"] == "duplicate_ignored"

    # Exactly 1 recovery case must exist for this payment
    cases = db.query(RecoveryCase).filter(RecoveryCase.payment_id == pay_id).all()
    assert len(cases) == 1, f"Expected exactly 1 RecoveryCase, but found {len(cases)}"

def test_never_second_notification_dispatched(db):
    """
    Validates Invariant:
    Second webhook NEVER triggers a second notification.
    """
    secret = settings.RAZORPAY_WEBHOOK_SECRET or "sandbox_test_webhook_secret"
    suffix = uuid.uuid4().hex[:8]
    event_id = f"event_rzp_notif_{suffix}"
    pay_id = f"pay_rzp_notif_{suffix}"
    email = f"notif_test_{suffix}@test.com"

    payload = {
        "event_id": event_id,
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_id,
                    "amount": 250000,
                    "currency": "INR",
                    "method": "card",
                    "email": email,
                    "error_code": "CARD_EXPIRED",
                    "error_description": "Card token void"
                }
            }
        }
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = generate_signature(raw_bytes, secret)

    # First delivery
    r1 = client.post("/api/webhooks/razorpay", data=raw_bytes, headers={"X-Razorpay-Signature": sig})
    assert r1.status_code == 200
    case_id = r1.json()["case_id"]

    # Initial notification dispatched for case
    case = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id).first()
    notif = Notification(
        notification_id=f"notif_{suffix}",
        case_id=case_id,
        customer_id=case.customer_id,
        channel="email",
        template="payment_recovery_link_v1",
        message="Recovery notification dispatched",
        status="DELIVERED",
        sent_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()

    notif_count_after_first = db.query(Notification).filter(Notification.case_id == case_id).count()
    assert notif_count_after_first == 1, "Expected 1 notification after initial dispatch"

    # Second delivery of the same webhook
    r2 = client.post("/api/webhooks/razorpay", data=raw_bytes, headers={"X-Razorpay-Signature": sig})
    assert r2.status_code == 200
    assert r2.json()["status"] == "duplicate_ignored"

    # Invariant check: Notification count MUST remain exactly 1
    notif_count_after_second = db.query(Notification).filter(Notification.case_id == case_id).count()
    assert notif_count_after_second == 1, "Idempotency failure: second notification was created!"

def test_never_double_counted_revenue(db):
    """
    Validates Invariant:
    Second webhook NEVER causes double-counted recovered revenue.
    """
    secret = settings.RAZORPAY_WEBHOOK_SECRET or "sandbox_test_webhook_secret"
    suffix = uuid.uuid4().hex[:8]
    event_id = f"event_rzp_rev_{suffix}"
    pay_id = f"pay_rzp_rev_{suffix}"
    amount_inr = 6500.0

    # 1. Check baseline dashboard revenue
    summary_before = client.get("/api/dashboard/summary").json()
    baseline_recovered = summary_before["recovered_revenue"]

    # 2. First failure webhook ingested and recovered
    payload = {
        "event_id": event_id,
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_id,
                    "amount": int(amount_inr * 100),
                    "currency": "INR",
                    "method": "card",
                    "email": f"revenue_test_{suffix}@test.com",
                    "error_code": "BANK_DECLINE",
                    "error_description": "Network timeout"
                }
            }
        }
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = generate_signature(raw_bytes, secret)

    r1 = client.post("/api/webhooks/razorpay", data=raw_bytes, headers={"X-Razorpay-Signature": sig})
    assert r1.status_code == 200
    case_id = r1.json()["case_id"]

    # Execute recovery to successfully recover this payment
    case = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id).first()
    pay = db.query(Payment).filter(Payment.payment_id == pay_id).first()
    pay.status = "SUCCESS"
    case.recovery_status = "RECOVERED"
    case.recovered_amount = amount_inr
    case.outcome_verified = True
    db.commit()

    # Verify dashboard shows baseline + amount_inr
    summary_after_recovery = client.get("/api/dashboard/summary").json()
    expected_new_revenue = baseline_recovered + amount_inr
    assert abs(summary_after_recovery["recovered_revenue"] - expected_new_revenue) < 0.01

    # 3. REPLAY THE EXACT SAME WEBHOOK (Second Delivery)
    r2 = client.post("/api/webhooks/razorpay", data=raw_bytes, headers={"X-Razorpay-Signature": sig})
    assert r2.status_code == 200
    assert r2.json()["status"] == "duplicate_ignored"

    # 4. Invariant: Recovered revenue must NOT increase (NEVER double-counted!)
    summary_after_replay = client.get("/api/dashboard/summary").json()
    assert abs(summary_after_replay["recovered_revenue"] - expected_new_revenue) < 0.01, (
        f"Revenue double-counted! Expected {expected_new_revenue}, found {summary_after_replay['recovered_revenue']}"
    )

def test_database_unique_constraint_enforcement(db):
    """
    Validates Database Level Defense:
    Direct SQL attempt to insert duplicate (provider, provider_event_id)
    must fail with IntegrityError at the DB engine level.
    """
    suffix = uuid.uuid4().hex[:8]
    event_id = f"event_direct_db_uq_{suffix}"
    pay_id = f"pay_direct_db_uq_{suffix}"

    # Insert initial payment
    p = Payment(
        payment_id=pay_id,
        merchant_id="m_apex_tech_2026",
        customer_id="cust_test",
        amount=1000.0,
        currency="INR",
        status="FAILED",
        source="RAZORPAY_TEST"
    )
    db.add(p)
    db.commit()

    # Insert first payment event
    pe1 = PaymentEvent(
        event_id=f"evt_1_{suffix}",
        provider="razorpay",
        provider_event_id=event_id,
        event_type="payment.failed",
        payment_id=pay_id,
        source="RAZORPAY_TEST"
    )
    db.add(pe1)
    db.commit()

    # Attempt to insert second payment event with SAME (provider, provider_event_id)
    pe2 = PaymentEvent(
        event_id=f"evt_2_{suffix}",
        provider="razorpay",
        provider_event_id=event_id,
        event_type="payment.failed",
        payment_id=pay_id,
        source="RAZORPAY_TEST"
    )
    db.add(pe2)

    with pytest.raises(Exception):
        db.commit()

    db.rollback()
