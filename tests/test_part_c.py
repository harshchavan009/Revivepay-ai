import pytest
import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.all_models import AuditLog
from backend.events.taxonomy import WebhookEventType
from backend.database import SessionLocal

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_chaos_tampered_webhook_simulation(db_session):
    """
    C.1 Test: Asserts that Chaos Test scenario in Simulation Lab triggers
    tampered webhook defense and records an immutable audit event.
    """
    res = client.post("/api/simulation/trigger", json={"scenario": "chaos_tampered_webhook"})
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "REJECTED_401"
    assert data["risk_level"] == "CRITICAL"
    assert "HMAC-SHA256 signature verification failed" in data["message"]
    assert data["case_id"] is None

    # Verify audit event in DB
    defense_log = db_session.query(AuditLog).filter(
        AuditLog.action == WebhookEventType.WEBHOOK_VERIFICATION_REJECTED.value
    ).first()
    assert defense_log is not None
    assert defense_log.actor_type == "GATEWAY"
    assert defense_log.policy_result == "BLOCKED"
    assert defense_log.execution_result == "REJECTED_401"


def test_real_tampered_webhook_ingress_rejection(db_session):
    """
    C.1 Test: Asserts that real POST to /api/webhooks/razorpay with forged signature
    returns HTTP 401 and logs defense audit event.
    """
    tampered_payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_tampered_test_999",
                    "amount": 2500000,
                    "currency": "INR",
                    "status": "failed",
                    "error_code": "TAMPERED_INJECTION"
                }
            }
        }
    }

    res = client.post(
        "/api/webhooks/razorpay",
        data=json.dumps(tampered_payload),
        headers={
            "Content-Type": "application/json",
            "X-Razorpay-Signature": "forged_sha256_signature_hex_bad_hash"
        }
    )
    assert res.status_code == 401
    assert "Invalid Razorpay webhook signature" in res.json()["detail"]

    # Verify audit log was recorded
    audit_entry = db_session.query(AuditLog).filter(
        AuditLog.action == WebhookEventType.WEBHOOK_VERIFICATION_REJECTED.value
    ).all()
    assert len(audit_entry) > 0
