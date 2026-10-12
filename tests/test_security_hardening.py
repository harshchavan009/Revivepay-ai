import os
import pytest
import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.main import app, rate_limiter
from backend.database import get_db, SessionLocal
from backend.models.all_models import User, Merchant, RecoveryCase, Payment, Customer, AuditLog
from backend.services.auth_service import (
    create_access_token, create_refresh_token, verify_refresh_token,
    create_step_up_token, verify_step_up_token, get_password_hash
)
from backend.events.taxonomy import RecoveryEventType

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    db = SessionLocal()
    try:
        merchant = db.query(Merchant).first()
        if not merchant:
            merchant = Merchant(merchant_id="mer_sec_test", name="Security Test Merchant", industry="Fintech")
            db.add(merchant)
            db.commit()

        # Seed high-value and low-value cases
        cust = db.query(Customer).first()
        if not cust:
            cust = Customer(
                customer_id="cust_sec_01",
                merchant_id="mer_sec_test",
                external_customer_id="ext_sec_01",
                name="Security Test Customer",
                email="security@customer.io",
                account_tier="VIP"
            )
            db.add(cust)
            db.commit()

        pay_high = db.query(Payment).filter(Payment.payment_id == "pay_sec_high_01").first()
        if not pay_high:
            pay_high = Payment(
                payment_id="pay_sec_high_01",
                merchant_id=merchant.merchant_id,
                customer_id=cust.customer_id,
                amount=75000.0,
                currency="INR",
                status="FAILED",
                failure_reason="temporary_bank_failure"
            )
            db.add(pay_high)

            case_high = RecoveryCase(
                case_id="RV-HIGH-SEC-01",
                payment_id="pay_sec_high_01",
                customer_id=cust.customer_id,
                source="RAZORPAY_TEST",
                amount_at_risk=75000.0,
                approval_required=True,
                approval_status="PENDING",
                recovery_status="AWAITING_APPROVAL"
            )
            db.add(case_high)

        pay_low = db.query(Payment).filter(Payment.payment_id == "pay_sec_low_01").first()
        if not pay_low:
            pay_low = Payment(
                payment_id="pay_sec_low_01",
                merchant_id=merchant.merchant_id,
                customer_id=cust.customer_id,
                amount=12000.0,
                currency="INR",
                status="FAILED",
                failure_reason="temporary_bank_failure"
            )
            db.add(pay_low)

            case_low = RecoveryCase(
                case_id="RV-LOW-SEC-01",
                payment_id="pay_sec_low_01",
                customer_id=cust.customer_id,
                source="RAZORPAY_TEST",
                amount_at_risk=12000.0,
                approval_required=True,
                approval_status="PENDING",
                recovery_status="AWAITING_APPROVAL"
            )
            db.add(case_low)

        db.commit()
    finally:
        db.close()


def test_security_headers_enforced():
    """Validates that all mandatory HTTP security headers are present on responses."""
    res = client.get("/health")
    assert res.status_code == 200
    headers = res.headers
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert "Strict-Transport-Security" in headers
    assert "max-age=31536000" in headers["Strict-Transport-Security"]
    assert "Content-Security-Policy" in headers
    assert "default-src 'self'" in headers["Content-Security-Policy"]
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_short_lived_token_and_refresh_cookie():
    """Validates 15-minute access token and httpOnly refresh cookie creation and exchange."""
    # 1. Login
    login_res = client.post("/api/auth/demo-login", json={"persona": "revenue_operator"})
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["expires_in"] == 15 * 60
    assert "csrf_token" in data

    # Verify refresh cookie
    cookies = login_res.cookies
    assert "refresh_token" in cookies
    refresh_token = cookies["refresh_token"]

    # 2. Exchange refresh token for fresh access token
    refresh_res = client.post(
        "/api/auth/refresh",
        cookies={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 200
    refresh_data = refresh_res.json()
    assert "access_token" in refresh_data
    assert refresh_data["user"]["role"] == "REVENUE_OPERATOR"


def test_rate_limiting_on_auth_routes():
    """Validates that exceeding 15 auth requests within window returns 429 Too Many Requests."""
    # Reset limiter for clean testing
    rate_limiter.requests.clear()

    for i in range(15):
        res = client.post("/api/auth/demo-login", json={"persona": "revenue_operator"})
        assert res.status_code == 200, f"Request {i+1} failed"

    # 16th request must trigger 429
    blocked_res = client.post("/api/auth/demo-login", json={"persona": "revenue_operator"})
    assert blocked_res.status_code == 429
    assert blocked_res.json()["error_code"] == "AUTH_RATE_LIMIT_EXCEEDED"
    assert blocked_res.headers.get("Retry-After") == "60"

    # Clear rate limiter after test
    rate_limiter.requests.clear()


def test_step_up_auth_required_for_high_value_cases():
    """Validates that cases >= ₹50,000 require step-up re-authentication before approval."""
    # Login as operator
    login_res = client.post("/api/auth/demo-login", json={"persona": "revenue_operator"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Attempt to approve ₹75,000 case without step-up token -> Rejection 400
    reject_res = client.post(
        "/api/recovery/RV-HIGH-SEC-01/approve",
        json={"action": "APPROVE", "notes": "Unauthorized direct approval"},
        headers=headers
    )
    assert reject_res.status_code == 400
    assert "Step-up re-authentication is required" in reject_res.json()["detail"]

    # 2. Perform step-up re-authentication with valid OTP
    step_up_res = client.post(
        "/api/auth/step-up-verify",
        json={"case_id": "RV-HIGH-SEC-01", "credential": "782910"},
        headers=headers
    )
    assert step_up_res.status_code == 200
    step_up_data = step_up_res.json()
    assert step_up_data["success"] is True
    step_up_token = step_up_data["step_up_token"]

    # 3. Approve with verified step-up token -> 200 OK
    approve_res = client.post(
        "/api/recovery/RV-HIGH-SEC-01/approve",
        json={"action": "APPROVE", "notes": "Authorized with MFA OTP", "step_up_token": step_up_token},
        headers=headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["approval_status"] == "APPROVED"

    # 4. Verify canonical audit event was written to the immutable ledger
    db = SessionLocal()
    try:
        step_up_log = db.query(AuditLog).filter(
            AuditLog.case_id == "RV-HIGH-SEC-01",
            AuditLog.action == RecoveryEventType.STEPUP_VERIFIED.value
        ).first()
        assert step_up_log is not None
        assert step_up_log.actor_type == "OPERATOR"
    finally:
        db.close()


def test_low_value_case_approves_without_step_up():
    """Validates that cases < ₹50,000 do not require step-up re-authentication."""
    login_res = client.post("/api/auth/demo-login", json={"persona": "revenue_operator"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Approve ₹12,000 case directly
    approve_res = client.post(
        "/api/recovery/RV-LOW-SEC-01/approve",
        json={"action": "APPROVE", "notes": "Standard value approval"},
        headers=headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["approval_status"] == "APPROVED"


def test_production_readiness_rejects_insecure_secrets():
    """Validates that Settings.validate_production_readiness fails fast on insecure secrets in production."""
    from backend.config import Settings
    
    # 1. Insecure default SECRET_KEY must raise ValueError
    prod_insecure = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="dev-non-secret-jwt-placeholder-key",
        CSRF_SECRET="a" * 32,
        DATABASE_URL="postgresql://user:pass@localhost:5432/db"
    )
    with pytest.raises(ValueError, match="SECRET_KEY"):
        prod_insecure.validate_production_readiness()

    # 2. Insecure default CSRF_SECRET must raise ValueError
    prod_insecure_csrf = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        CSRF_SECRET="insecure-dev-csrf-salt-change-in-production",
        DATABASE_URL="postgresql://user:pass@localhost:5432/db"
    )
    with pytest.raises(ValueError, match="CSRF_SECRET"):
        prod_insecure_csrf.validate_production_readiness()

    # 3. SQLite database in production must raise ValueError
    prod_sqlite = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        CSRF_SECRET="b" * 32,
        DATABASE_URL="sqlite:///./revivepay.db"
    )
    with pytest.raises(ValueError, match="SQLite"):
        prod_sqlite.validate_production_readiness()

    # 4. Wildcard CORS origin in production must raise ValueError
    prod_cors = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        CSRF_SECRET="b" * 32,
        DATABASE_URL="postgresql://user:pass@localhost:5432/db",
        CORS_ORIGINS=["*"]
    )
    with pytest.raises(ValueError, match="CORS"):
        prod_cors.validate_production_readiness()

    # 5. Valid production settings must pass cleanly
    prod_valid = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="x" * 64,
        CSRF_SECRET="y" * 64,
        DATABASE_URL="postgresql://user:pass@localhost:5432/db",
        CORS_ORIGINS=["https://demo.revivepay.ai"]
    )
    assert prod_valid.validate_production_readiness() is True


def test_settings_repr_never_leaks_secrets():
    """Validates that repr(settings) masks secret values and never logs them."""
    from backend.config import settings
    rep = repr(settings)
    assert settings.SECRET_KEY not in rep or len(settings.SECRET_KEY) < 5
    assert settings.CSRF_SECRET not in rep or len(settings.CSRF_SECRET) < 5
    assert "SECRET_KEY" not in rep
