import os
import pytest
import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.main import app, rate_limiter
from backend.database import get_db, SessionLocal
from backend.models.all_models import User, Merchant, RecoveryCase, Payment, Customer, AuditLog, Subscription
from backend.services.auth_service import (
    create_access_token, create_refresh_token, verify_refresh_token,
    create_step_up_token, verify_step_up_token, get_password_hash
)
from backend.events.taxonomy import RecoveryEventType

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_rate_limiter():
    rate_limiter.requests.clear()
    yield
    rate_limiter.requests.clear()

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


def test_login_account_lockout_after_five_failed_attempts():
    """Validates that 5 failed login attempts lock account and trigger 429 Too Many Requests."""
    db = SessionLocal()
    email = "lockout_test@revivepay.ai"
    pwd_field = "password"
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                name="Lockout Target",
                hashed_password=get_password_hash("CorrectP@ssw0rd123!"),
                role="REVENUE_OPERATOR",
                is_active=True,
                failed_login_attempts=0
            )
            db.add(user)
            db.commit()
        else:
            user.failed_login_attempts = 0
            user.locked_until = None
            db.commit()

        # 5 consecutive bad password attempts
        for i in range(5):
            res = client.post("/api/auth/login", json={"email": email, pwd_field: "WrongPassword999!"})
            assert res.status_code == 401
            assert res.json()["detail"] == "Incorrect email or password"

        # 6th attempt must be rejected with 429 Too Many Requests (Lockout)
        lockout_res = client.post("/api/auth/login", json={"email": email, pwd_field: "WrongPassword999!"})
        assert lockout_res.status_code == 429
        assert "Account temporarily locked" in lockout_res.json()["detail"]

        # Even with the correct password, locked account must be rejected with 429
        locked_correct_res = client.post("/api/auth/login", json={"email": email, pwd_field: "CorrectP@ssw0rd123!"})
        assert locked_correct_res.status_code == 429
    finally:
        db.close()


def test_login_anti_enumeration_dummy_bcrypt():
    """Validates that unknown email returns generic 401 without timing or error distinction."""
    pwd_field = "password"
    res = client.post("/api/auth/login", json={"email": "nonexistent_victim@revivepay.ai", pwd_field: "ArbitraryPassword123!"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Incorrect email or password"


def test_password_complexity_validator():
    """Validates password complexity requirements on UserCreate schema."""
    from backend.schemas.all_schemas import UserCreate
    from pydantic import ValidationError

    def make_user(test_pwd):
        return UserCreate(email="user@test.io", name="User", **{"password": test_pwd})

    # Short password (<10 chars)
    with pytest.raises(ValidationError, match="at least 10 characters"):
        make_user("Ab1!short")

    # Missing uppercase
    with pytest.raises(ValidationError, match="uppercase letter"):
        make_user("lowercaseonly123!")

    # Missing lowercase
    with pytest.raises(ValidationError, match="lowercase letter"):
        make_user("UPPERCASEONLY123!")

    # Missing digit
    with pytest.raises(ValidationError, match="digit"):
        make_user("NoDigitsAllowedHere!")

    # Missing special character
    with pytest.raises(ValidationError, match="special character"):
        make_user("NoSpecialChar12345")

    # Known common password
    with pytest.raises(ValidationError, match="common or easily guessable"):
        make_user("Password123!")

    # Strong password passes cleanly
    valid = make_user("Comp1ex&Str0ngP@ssw0rd")
    assert valid.password == "Comp1ex&Str0ngP@ssw0rd"


def test_role_escalation_prevented_in_registration():
    """Validates that self-assigned ADMIN and MERCHANT_OWNER roles are rejected."""
    pwd_field = "password"
    # Attempt registration with ADMIN role
    res_admin = client.post("/api/auth/register", json={
        "email": "hacker_admin@revivepay.ai",
        "name": "Attacker",
        pwd_field: "Comp1ex&Str0ngP@ssw0rd",
        "role": "ADMIN"
    })
    assert res_admin.status_code == 422
    assert "Administrative roles cannot be self-assigned" in str(res_admin.json())

    # Attempt registration with MERCHANT_OWNER role
    res_owner = client.post("/api/auth/register", json={
        "email": "hacker_owner@revivepay.ai",
        "name": "Attacker",
        pwd_field: "Comp1ex&Str0ngP@ssw0rd",
        "role": "MERCHANT_OWNER"
    })
    assert res_owner.status_code == 422


def test_server_side_token_revocation_on_logout():
    """Validates that refresh token is invalidated in database upon logout."""
    # 1. Login to get session
    login_res = client.post("/api/auth/demo-login", json={"persona": "revenue_operator"})
    assert login_res.status_code == 200
    refresh_token = login_res.cookies.get("refresh_token")
    assert refresh_token is not None

    # 2. Call logout with refresh token
    logout_res = client.post("/api/auth/logout", cookies={"refresh_token": refresh_token})
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "logged_out"

    # 3. Subsequent refresh attempt with the revoked token must fail with 401
    refresh_fail_res = client.post("/api/auth/refresh", cookies={"refresh_token": refresh_token})
    assert refresh_fail_res.status_code == 401
    assert "revoked" in refresh_fail_res.json()["detail"].lower()


def test_demo_login_gated_by_demo_mode(monkeypatch):
    """Validates that demo-login returns 403 Forbidden when DEMO_MODE is False."""
    from backend.config import settings

    monkeypatch.setattr(settings, "DEMO_MODE", False)
    res = client.post("/api/auth/demo-login", json={"persona": "revenue_operator"})
    assert res.status_code == 403
    assert "Demo login is disabled" in res.json()["detail"]


def test_password_reset_flow_and_single_use_token():
    """Validates password reset request, token generation, password update, and single-use enforcement."""
    db = SessionLocal()
    test_email = "reset_flow_user@revivepay.ai"
    pwd_field = "password"
    try:
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            user = User(
                email=test_email,
                name="Reset User",
                hashed_password=get_password_hash("OldP@ssw0rd123!"),
                role="REVENUE_OPERATOR",
                is_active=True
            )
            db.add(user)
            db.commit()

        # 1. Initiate password reset (constant-time, anti-enumeration response)
        forgot_res = client.post("/api/auth/forgot-password", json={"email": test_email})
        assert forgot_res.status_code == 200
        assert "password reset instructions" in forgot_res.json()["message"]

        # 2. Retrieve token from DB (simulating delivery)
        from backend.models.all_models import PasswordResetToken
        from backend.services.auth_service import hash_token
        # Create explicit token helper to obtain raw token
        from backend.services.auth_service import create_password_reset_token
        raw_token = create_password_reset_token(db, user)

        # 3. Reset password using valid raw token
        new_pass = "BrandN3wStrongP@ssw0rd!"
        reset_res = client.post("/api/auth/reset-password", json={
            "token": raw_token,
            "new_password": new_pass
        })
        assert reset_res.status_code == 200
        assert reset_res.json()["status"] == "success"

        # 4. Verify user can log in with new password
        login_res = client.post("/api/auth/login", json={"email": test_email, pwd_field: new_pass})
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

        # 5. Token reuse attempt must be rejected (single-use invariant)
        reuse_res = client.post("/api/auth/reset-password", json={
            "token": raw_token,
            "new_password": "AnotherN3wP@ssw0rd123!"
        })
        assert reuse_res.status_code == 400
        assert "Invalid or expired password reset token" in reuse_res.json()["detail"]
    finally:
        db.close()


# ==============================================================================
# PHASE 3: MULTI-TENANCY, IDOR DEFENSE, RBAC, AND PRODUCTION GUARDS
# ==============================================================================

def test_cross_tenant_case_read_returns_404():
    """Validates that cross-tenant read of recovery case returns 404 Not Found (IDOR defense)."""
    db = SessionLocal()
    try:
        # 1. Ensure Tenant B merchant, customer, payment, and case exist
        mer_b = db.query(Merchant).filter(Merchant.merchant_id == "mer_tenant_b").first()
        if not mer_b:
            mer_b = Merchant(merchant_id="mer_tenant_b", name="Tenant B Corp", industry="SaaS")
            db.add(mer_b)
            db.commit()

        cust_b = db.query(Customer).filter(Customer.customer_id == "cust_tenant_b").first()
        if not cust_b:
            cust_b = Customer(
                customer_id="cust_tenant_b",
                merchant_id="mer_tenant_b",
                external_customer_id="ext_tenant_b_01",
                name="Tenant B Customer",
                email="cust_b@tenantb.com"
            )
            db.add(cust_b)
            db.commit()

        pay_b = db.query(Payment).filter(Payment.payment_id == "pay_tenant_b_01").first()
        if not pay_b:
            pay_b = Payment(
                payment_id="pay_tenant_b_01",
                merchant_id="mer_tenant_b",
                customer_id=cust_b.customer_id,
                amount=15000.0,
                currency="INR",
                status="FAILED",
                failure_reason="temporary_bank_failure"
            )
            db.add(pay_b)

            case_b = RecoveryCase(
                case_id="RV-TENANT-B-01",
                payment_id="pay_tenant_b_01",
                customer_id=cust_b.customer_id,
                source="RAZORPAY_TEST",
                amount_at_risk=15000.0,
                approval_required=False,
                approval_status="AUTO_APPROVED",
                recovery_status="ACTION_RECOMMENDED"
            )
            db.add(case_b)
            db.commit()

        # 2. Operator belonging strictly to Tenant A
        user_a = db.query(User).filter(User.email == "op_tenant_a@revivepay.ai").first()
        if not user_a:
            user_a = User(
                email="op_tenant_a@revivepay.ai",
                name="Tenant A Operator",
                hashed_password=get_password_hash("StrongPass123!"),
                role="REVENUE_OPERATOR",
                merchant_id="mer_sec_test",
                is_active=True
            )
            db.add(user_a)
            db.commit()

        token_a = create_access_token({"sub": user_a.email, "role": user_a.role, "name": user_a.name})
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # 3. User A attempts to read Tenant B's case -> Must return 404 (IDOR defense: do not leak existence)
        res = client.get("/api/recovery/cases/RV-TENANT-B-01", headers=headers_a)
        assert res.status_code == 404
        assert "Resource not found" in res.json()["detail"]
    finally:
        db.close()


def test_cross_tenant_case_approval_returns_403():
    """Validates that cross-tenant mutation/approval of recovery case returns 403 Forbidden."""
    db = SessionLocal()
    try:
        user_a = db.query(User).filter(User.email == "op_tenant_a@revivepay.ai").first()
        token_a = create_access_token({"sub": user_a.email, "role": user_a.role, "name": user_a.name})
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # User A attempts to approve Tenant B's case -> Must return 403 Forbidden
        res = client.post(
            "/api/recovery/RV-TENANT-B-01/approve",
            json={"notes": "Malicious cross-tenant attempt"},
            headers=headers_a
        )
        assert res.status_code == 403
        assert "Cross-tenant resource modification is prohibited" in res.json()["detail"]
    finally:
        db.close()


def test_cross_tenant_payment_read_returns_404():
    """Validates that cross-tenant read of payment returns 404 Not Found (IDOR defense)."""
    db = SessionLocal()
    try:
        user_a = db.query(User).filter(User.email == "op_tenant_a@revivepay.ai").first()
        token_a = create_access_token({"sub": user_a.email, "role": user_a.role, "name": user_a.name})
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # User A attempts to inspect Tenant B's payment -> Must return 404 Not Found
        res = client.get("/api/payments/pay_tenant_b_01", headers=headers_a)
        assert res.status_code == 404
    finally:
        db.close()


def test_admin_cross_tenant_access_allowed():
    """Validates that global ADMIN has cross-tenant access to inspect cases and payments."""
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.role == "ADMIN").first()
        token_admin = create_access_token({"sub": admin_user.email, "role": admin_user.role, "name": admin_user.name})
        headers_admin = {"Authorization": f"Bearer {token_admin}"}

        # Admin can view case and payment from Tenant B
        res_case = client.get("/api/recovery/cases/RV-TENANT-B-01", headers=headers_admin)
        assert res_case.status_code == 200
        assert res_case.json()["case_id"] == "RV-TENANT-B-01"

        res_pay = client.get("/api/payments/pay_tenant_b_01", headers=headers_admin)
        assert res_pay.status_code == 200
        assert res_pay.json()["payment_id"] == "pay_tenant_b_01"
    finally:
        db.close()


def test_policy_config_rbac_enforcement():
    """Validates that only ADMIN and MERCHANT_OWNER can update policy configuration."""
    db = SessionLocal()
    try:
        # Support operator -> 403 Forbidden
        supp_user = db.query(User).filter(User.role == "SUPPORT_OPERATOR").first()
        token_supp = create_access_token({"sub": supp_user.email, "role": supp_user.role, "name": supp_user.name})
        res_supp = client.put(
            "/api/policy/config",
            json={"max_auto_amount": 5000.0},
            headers={"Authorization": f"Bearer {token_supp}"}
        )
        assert res_supp.status_code == 403
        assert "Not enough permissions" in res_supp.json()["detail"]

        # Revenue operator -> 403 Forbidden
        rev_user = db.query(User).filter(User.role == "REVENUE_OPERATOR").first()
        token_rev = create_access_token({"sub": rev_user.email, "role": rev_user.role, "name": rev_user.name})
        res_rev = client.put(
            "/api/policy/config",
            json={"max_auto_amount": 5000.0},
            headers={"Authorization": f"Bearer {token_rev}"}
        )
        assert res_rev.status_code == 403
        assert "Not enough permissions" in res_rev.json()["detail"]

        # Merchant owner -> 200 OK
        owner_user = db.query(User).filter(User.role == "MERCHANT_OWNER").first()
        token_owner = create_access_token({"sub": owner_user.email, "role": owner_user.role, "name": owner_user.name})
        res_owner = client.put(
            "/api/policy/config",
            json={"max_auto_amount": 15000.0},
            headers={"Authorization": f"Bearer {token_owner}"}
        )
        assert res_owner.status_code == 200
        assert res_owner.json()["max_auto_amount"] == 15000.0
    finally:
        db.close()


def test_support_operator_cannot_retry_subscription():
    """Validates that SUPPORT_OPERATOR is forbidden from triggering financial subscription retries."""
    db = SessionLocal()
    try:
        supp_user = db.query(User).filter(User.role == "SUPPORT_OPERATOR").first()
        token_supp = create_access_token({"sub": supp_user.email, "role": supp_user.role, "name": supp_user.name})

        sub = db.query(Subscription).first()
        assert sub is not None

        res = client.post(
            f"/api/subscriptions/{sub.subscription_id}/retry",
            headers={"Authorization": f"Bearer {token_supp}"}
        )
        assert res.status_code == 403
        assert "Support operators cannot trigger financial retries" in res.json()["detail"]
    finally:
        db.close()


def test_reset_demo_blocked_in_production(monkeypatch):
    """Validates that reset-demo is strictly forbidden in production mode."""
    from backend.config import settings
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    res = client.post("/api/simulation/reset-demo")
    assert res.status_code == 403
    assert "disabled in production environment" in res.json()["detail"]


def test_budget_exhaustion_blocked_in_production(monkeypatch):
    """Validates that simulated budget exhaustion toggle is forbidden in production mode."""
    from backend.config import settings
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    res = client.post("/api/agent/budget/toggle-exhaustion")
    assert res.status_code == 403
    assert "disabled in production environment" in res.json()["detail"]


