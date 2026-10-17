import hmac
import hashlib
import json
import uuid
import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.main import app
from backend.database import SessionLocal
from backend.models.all_models import (
    Organization, User, Merchant, Customer, Payment, RecoveryCase,
    PaymentEvent, PolicyConfig, AuditLog
)
from backend.services.crypto_service import CryptoService
from backend.services.auth_service import create_access_token
from backend.services.policy_gateway import PolicyGateway

client = TestClient(app)

@pytest.fixture(scope="module")
def razorpay_fixture():
    db: Session = SessionLocal()
    try:
        # Create dedicated test organization for Razorpay tests
        org = db.query(Organization).filter(Organization.org_id == "org_rzp_test").first()
        if not org:
            org = Organization(
                org_id="org_rzp_test",
                name="Razorpay Test Corp",
                slug="rzp-test-corp",
                is_test_mode=True,
                webhook_secret=CryptoService.encrypt("test_tenant_whsec_99998888")
            )
            db.add(org)
            db.commit()

        # Create Owner User
        user_owner = db.query(User).filter(User.email == "rzp_owner@testcorp.in").first()
        if not user_owner:
            user_owner = User(
                email="rzp_owner@testcorp.in",
                name="Razorpay Owner",
                role="OWNER",
                org_id="org_rzp_test",
                hashed_password="placeholder-hashed",
                is_active=True
            )
            db.add(user_owner)
            db.commit()

        # Create Viewer User
        user_viewer = db.query(User).filter(User.email == "rzp_viewer@testcorp.in").first()
        if not user_viewer:
            user_viewer = User(
                email="rzp_viewer@testcorp.in",
                name="Razorpay Viewer",
                role="VIEWER",
                org_id="org_rzp_test",
                hashed_password="placeholder-hashed",
                is_active=True
            )
            db.add(user_viewer)
            db.commit()

        owner_token = create_access_token({"sub": user_owner.email, "role": "OWNER", "org_id": "org_rzp_test"})
        viewer_token = create_access_token({"sub": user_viewer.email, "role": "VIEWER", "org_id": "org_rzp_test"})

        yield {
            "org_id": "org_rzp_test",
            "owner_token": owner_token,
            "viewer_token": viewer_token,
            "tenant_webhook_secret": "test_tenant_whsec_99998888"
        }
    finally:
        db.close()


def test_crypto_service_aes_256_gcm_encrypt_decrypt_tamper():
    """Validates AES-256-GCM encryption, authenticated decryption, and tamper resistance."""
    secret = "rzp_live_secret_key_confidential_999"
    ciphertext = CryptoService.encrypt(secret)
    assert ciphertext is not None
    assert ciphertext.startswith("aes-gcm:")
    assert secret not in ciphertext

    # Decrypt
    decrypted = CryptoService.decrypt(ciphertext)
    assert decrypted == secret

    # Tamper detection
    tampered = ciphertext[:-4] + "AAAA"
    with pytest.raises(ValueError, match="invalid key or tampered ciphertext"):
        CryptoService.decrypt(tampered)


def test_crypto_service_mask_secret():
    """Validates that secrets are masked safely without returning plaintext."""
    assert CryptoService.mask_secret("rzp_test_1234567890ABCD") == "rzp_test_••••••••ABCD"
    assert CryptoService.mask_secret("rzp_live_9876543210WXYZ") == "rzp_live_••••••••WXYZ"
    assert "••••••••" in CryptoService.mask_secret("super_confidential_secret")
    assert CryptoService.mask_secret("") == ""


def test_organization_connect_flow_encrypts_keys_at_rest(razorpay_fixture):
    """Validates connecting Razorpay encrypts keys at rest with AES-256-GCM and never exposes raw secret."""
    headers = {"Authorization": f"Bearer {razorpay_fixture['owner_token']}"}
    payload = {
        "key_id": "rzp_test_12345678abcdef",
        "key_secret": "raw_secret_key_never_show_browser_1234",
        "webhook_secret": "whsec_custom_tenant_secret_5678"
    }

    res = client.post("/api/v1/organization/razorpay/connect", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["is_connected"] is True
    assert data["has_key_secret"] is True
    assert data["has_webhook_secret"] is True
    assert data["key_id_masked"] == "rzp_test_••••••••cdef"
    assert data["is_test_mode"] is True
    # Crucial security guarantee: raw secret NEVER returned in response
    assert "raw_secret_key" not in json.dumps(data)

    # Verify directly in Database: keys are stored encrypted at rest
    db = SessionLocal()
    try:
        org = db.query(Organization).filter(Organization.org_id == razorpay_fixture["org_id"]).first()
        assert org.razorpay_key_secret.startswith("aes-gcm:")
        assert "raw_secret_key" not in org.razorpay_key_secret
        assert org.webhook_secret.startswith("aes-gcm:")

        # Decrypt with CryptoService verifies plaintext match
        assert CryptoService.decrypt(org.razorpay_key_secret) == "raw_secret_key_never_show_browser_1234"
        assert CryptoService.decrypt(org.webhook_secret) == "whsec_custom_tenant_secret_5678"
    finally:
        db.close()


def test_organization_connect_invalid_key_prefix_rejected(razorpay_fixture):
    """Validates that keys without 'rzp_test_' or 'rzp_live_' prefix are rejected."""
    headers = {"Authorization": f"Bearer {razorpay_fixture['owner_token']}"}
    res = client.post("/api/v1/organization/razorpay/connect", json={
        "key_id": "invalid_key_format_1234",
        "key_secret": "some_secret_12345"
    }, headers=headers)
    assert res.status_code == 400
    assert "Invalid Razorpay Key ID" in res.json()["detail"]


def test_viewer_cannot_connect_or_disconnect_razorpay(razorpay_fixture):
    """Validates RBAC: VIEWER role cannot modify Razorpay credentials."""
    headers = {"Authorization": f"Bearer {razorpay_fixture['viewer_token']}"}
    res = client.post("/api/v1/organization/razorpay/connect", json={
        "key_id": "rzp_test_12345678abcdef",
        "key_secret": "raw_secret_key_1234"
    }, headers=headers)
    assert res.status_code == 403

    res_disc = client.post("/api/v1/organization/razorpay/disconnect", headers=headers)
    assert res_disc.status_code == 403


def test_mode_toggle_requires_live_key_for_live_mode(razorpay_fixture):
    """Validates that switching to Live Mode is blocked if current key is a Test Key."""
    headers = {"Authorization": f"Bearer {razorpay_fixture['owner_token']}"}
    res = client.post("/api/v1/organization/mode/toggle", json={"is_test_mode": False}, headers=headers)
    assert res.status_code == 400
    assert "Cannot switch to Live Mode while using a Razorpay Test Key" in res.json()["detail"]


def test_organization_onboarding_status_checklist(razorpay_fixture):
    """Validates onboarding checklist computation."""
    headers = {"Authorization": f"Bearer {razorpay_fixture['owner_token']}"}
    res = client.get("/api/v1/organization/onboarding-status", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "steps" in data
    assert len(data["steps"]) == 5
    assert data["steps"][0]["id"] == "connect_razorpay"
    assert data["steps"][0]["completed"] is True
    assert data["progress_percentage"] >= 20


def test_tenant_specific_webhook_signature_and_idempotency(razorpay_fixture):
    """
    Validates:
    1. Tenant webhook endpoint /api/v1/webhooks/razorpay/{org_id}
    2. Signature verified using tenant's decrypted AES-256 secret
    3. Idempotency: Duplicate delivery returns duplicate_ignored and creates no second case
    4. Entities (Payment, Customer, RecoveryCase) inherit tenant org_id
    """
    org_id = razorpay_fixture["org_id"]
    secret = "whsec_custom_tenant_secret_5678"
    unique_suffix = uuid.uuid4().hex[:8]
    event_id = f"evt_tenant_{unique_suffix}"
    pay_id = f"pay_tenant_{unique_suffix}"

    payload = {
        "entity": "event",
        "event_id": event_id,
        "event": "payment.failed",
        "created_at": int(datetime.datetime.utcnow().timestamp()),
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_id,
                    "amount": 750000, # ₹7,500.00
                    "currency": "INR",
                    "status": "failed",
                    "order_id": f"order_tenant_{unique_suffix}",
                    "method": "card",
                    "email": f"cust_{unique_suffix}@rzptest.in",
                    "contact": "+919988776655",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Payment failed at bank switch",
                    "card": {
                        "id": f"card_{unique_suffix}",
                        "entity": "card",
                        "name": "Customer Name",
                        "last4": "4242",
                        "network": "Visa",
                        "type": "credit"
                    }
                }
            }
        }
    }

    raw_body = json.dumps(payload).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    # 1. Send genuine webhook
    res1 = client.post(
        f"/api/v1/webhooks/razorpay/{org_id}",
        data=raw_body,
        headers={"X-Razorpay-Signature": sig}
    )
    assert res1.status_code == 200, res1.text
    data1 = res1.json()
    assert data1["status"] == "processed"
    assert data1["payment_id"] == pay_id
    case_id_1 = data1["case_id"]

    # Verify DB records are tenant-isolated
    db = SessionLocal()
    try:
        pay = db.query(Payment).filter(Payment.payment_id == pay_id).first()
        assert pay is not None
        assert pay.org_id == org_id
        assert pay.amount == 7500.0

        case = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id_1).first()
        assert case is not None
        assert case.org_id == org_id

        # 2. Replay duplicate event: Must be ignored idempotently (zero duplicate case created)
        res2 = client.post(
            f"/api/v1/webhooks/razorpay/{org_id}",
            data=raw_body,
            headers={"X-Razorpay-Signature": sig}
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["status"] == "duplicate_ignored"
        assert data2["case_id"] == case_id_1

        total_cases = db.query(RecoveryCase).filter(RecoveryCase.payment_id == pay_id).count()
        assert total_cases == 1, "Duplicate webhook must never create a second recovery case!"
    finally:
        db.close()


def test_tampered_tenant_webhook_signature_rejected(razorpay_fixture):
    """Validates that a tampered webhook body or forged signature is rejected with 401."""
    org_id = razorpay_fixture["org_id"]
    payload = {"event": "payment.failed", "event_id": f"evt_fake_{uuid.uuid4().hex[:6]}"}
    raw_body = json.dumps(payload).encode("utf-8")

    res = client.post(
        f"/api/v1/webhooks/razorpay/{org_id}",
        data=raw_body,
        headers={"X-Razorpay-Signature": "forged_invalid_signature_hex"}
    )
    assert res.status_code == 401
    assert "Invalid Razorpay webhook signature" in res.json()["detail"]


def test_no_pan_or_cvv_stored_in_database(razorpay_fixture):
    """
    Non-Negotiable Rule 5: Never store PAN, CVV, or full card data.
    Inspect database columns and raw webhook entities.
    """
    db = SessionLocal()
    try:
        # Check Payments table: make sure no PAN or CVV columns exist
        pay_cols = [c.name for c in Payment.__table__.columns]
        assert "pan" not in pay_cols
        assert "cvv" not in pay_cols
        assert "card_number" not in pay_cols
        assert "full_card" not in pay_cols

        # Check Customers table
        cust_cols = [c.name for c in Customer.__table__.columns]
        assert "pan" not in cust_cols
        assert "cvv" not in cust_cols
    finally:
        db.close()


def test_deterministic_policy_engine_overrides_llm():
    """
    Rule 4 of Phase 3: The LLM may only suggest; the deterministic policy engine decides.
    Tests that a high amount automatically requires approval regardless of high AI confidence.
    """
    case = RecoveryCase(
        case_id="RV-TEST-POLICY-01",
        amount_at_risk=75000.0,
        risk_score=20.0,
        risk_level="LOW"
    )
    payment = Payment(
        payment_id="pay_test_policy_01",
        amount=75000.0,
        currency="INR",
        status="FAILED",
        retry_count=0,
        failure_category="temporary_bank_failure"
    )
    customer = Customer(
        customer_id="cust_test_policy_01",
        merchant_id="merchant_test",
        external_customer_id="ext_cust_01",
        name="Test Corp",
        email="corp@test.in",
        account_tier="VIP"
    )
    policy = PolicyConfig(
        max_auto_amount=10000.0,
        high_value_approval_threshold=50000.0,
        max_auto_retries=3,
        allowed_actions=["retry_payment", "create_payment_link"]
    )

    # Even with 100% AI confidence, transaction exceeding max_auto_amount requires review
    status, checklist, reason = PolicyGateway.evaluate(
        case=case,
        payment=payment,
        customer=customer,
        policy=policy,
        proposed_action="retry_payment",
        ai_confidence=1.0 # Maximum possible confidence
    )

    assert status == "REVIEW_REQUIRED", "High-value transaction must strictly require human operator review!"
    auto_amt_rule = next(r for r in checklist if r["rule"] == "auto_action_amount_limit")
    assert auto_amt_rule["passed"] is False
