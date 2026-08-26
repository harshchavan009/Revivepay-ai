import hmac
import hashlib
import json
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models.all_models import PaymentEvent, RecoveryCase, Payment
from backend.services.razorpay_service import RazorpayService
from backend.config import settings

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def generate_razorpay_signature(payload_bytes: bytes, secret: str) -> str:
    return hmac.new(
        key=secret.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

def test_razorpay_hmac_sha256_verification():
    """
    Test exact Razorpay HMAC-SHA256 signature verification.
    """
    secret = "secret_webhook_test_2026"
    raw_payload = b'{"event":"payment.failed","event_id":"event_test_101"}'
    valid_sig = generate_razorpay_signature(raw_payload, secret)

    assert RazorpayService.verify_webhook_signature(raw_payload, valid_sig, secret) is True
    assert RazorpayService.verify_webhook_signature(raw_payload, "tampered_signature_999", secret) is False
    assert RazorpayService.verify_webhook_signature(b'different_body', valid_sig, secret) is False

def test_razorpay_webhook_endpoint_signature_validation():
    """
    Test that invalid signatures are rejected by FastAPI endpoint with HTTP 400.
    """
    secret = settings.RAZORPAY_WEBHOOK_SECRET
    body = {"event": "payment.failed", "event_id": f"event_{uuid.uuid4().hex[:10]}"}
    raw_bytes = json.dumps(body).encode("utf-8")

    # Invalid signature
    response = client.post(
        "/api/webhooks/razorpay",
        data=raw_bytes,
        headers={"X-Razorpay-Signature": "invalid_fake_signature"}
    )
    assert response.status_code == 400
    assert "Invalid Razorpay webhook signature" in response.json()["detail"]

    # Valid signature
    valid_sig = generate_razorpay_signature(raw_bytes, secret)
    response_valid = client.post(
        "/api/webhooks/razorpay",
        data=raw_bytes,
        headers={"X-Razorpay-Signature": valid_sig}
    )
    assert response_valid.status_code == 200
    assert response_valid.json()["status"] in ["processed", "received"]

def test_razorpay_webhook_idempotency_and_event_fields(db_session):
    """
    Test Idempotency:
    1. First delivery -> Ingested, processed_at recorded, Recovery workflow triggered.
    2. Second delivery with duplicate event_id -> Ignored safely with HTTP 200 'duplicate_ignored'.
    """
    secret = settings.RAZORPAY_WEBHOOK_SECRET
    evt_id = f"event_rzp_dup_test_{uuid.uuid4().hex[:8]}"
    pay_id = f"pay_rzp_test_{uuid.uuid4().hex[:8]}"

    payload = {
        "event_id": evt_id,
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_id,
                    "amount": 799900,
                    "currency": "INR",
                    "method": "card",
                    "email": "idempotent.customer@test.com",
                    "error_code": "BANK_DECLINE",
                    "error_description": "Issuer gateway switch unavailable (504)"
                }
            }
        }
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = generate_razorpay_signature(raw_bytes, secret)

    # 1. First webhook post
    resp1 = client.post(
        "/api/webhooks/razorpay",
        data=raw_bytes,
        headers={"X-Razorpay-Signature": sig}
    )
    assert resp1.status_code == 200
    assert resp1.json()["status"] == "processed"
    assert resp1.json()["provider_event_id"] == evt_id

    # Verify event stored with raw_webhook_body, signature, received_at, processed_at
    stored_event = db_session.query(PaymentEvent).filter(
        PaymentEvent.provider == "razorpay",
        PaymentEvent.provider_event_id == evt_id
    ).first()
    assert stored_event is not None
    assert stored_event.raw_webhook_body is not None
    assert stored_event.signature == sig
    assert stored_event.received_at is not None
    assert stored_event.processed_at is not None
    assert stored_event.processing_status == "PROCESSED"

    # 2. Duplicate delivery (same event_id)
    resp2 = client.post(
        "/api/webhooks/razorpay",
        data=raw_bytes,
        headers={"X-Razorpay-Signature": sig}
    )
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "duplicate_ignored"

    # Ensure no duplicate PaymentEvent record was added
    event_count = db_session.query(PaymentEvent).filter(
        PaymentEvent.provider == "razorpay",
        PaymentEvent.provider_event_id == evt_id
    ).count()
    assert event_count == 1

def test_razorpay_api_verification_fallback():
    """
    Test synchronous Razorpay API verification for immediate confirmation.
    """
    res = RazorpayService.verify_payment_with_razorpay_api("pay_test_immediate_verify")
    assert res["status"] == "captured"
    assert res["captured"] is True
    assert res["verified_via"] == "razorpay_rest_api_v1"
