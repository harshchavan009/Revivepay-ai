import pytest
import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.main import app
from backend.database import SessionLocal
from backend.models.all_models import (
    Organization, User, Merchant, Customer, Payment, RecoveryCase,
    PolicyConfig, AuditLog, Subscription, AbandonedCheckout
)
from backend.services.auth_service import (
    create_access_token, get_password_hash, create_email_verification_token
)
from backend.services.totp_service import (
    generate_totp_secret, get_current_totp_code
)
from backend.services.audit_service import AuditService

client = TestClient(app)

@pytest.fixture(scope="module")
def tenant_fixture():
    db: Session = SessionLocal()
    try:
        # Create Org Alpha
        org_alpha = db.query(Organization).filter(Organization.org_id == "org_alpha").first()
        if not org_alpha:
            org_alpha = Organization(
                org_id="org_alpha",
                name="Alpha Logistics Technologies",
                slug="alpha-logistics-2026",
                is_test_mode=True
            )
            db.add(org_alpha)
            # Compatibility merchant
            db.add(Merchant(merchant_id="org_alpha", org_id="org_alpha", name="Alpha Logistics"))
            db.commit()

        # Create Org Beta
        org_beta = db.query(Organization).filter(Organization.org_id == "org_beta").first()
        if not org_beta:
            org_beta = Organization(
                org_id="org_beta",
                name="Beta Cloud SaaS",
                slug="beta-cloud-2026",
                is_test_mode=True
            )
            db.add(org_beta)
            # Compatibility merchant
            db.add(Merchant(merchant_id="org_beta", org_id="org_beta", name="Beta Cloud"))
            db.commit()

        # Users in Org Alpha
        pw_hash = get_password_hash("AlphaSecret123!")
        user_alpha_owner = db.query(User).filter(User.email == "owner@alpha.io").first()
        if not user_alpha_owner:
            user_alpha_owner = User(
                id="user_alpha_owner",
                email="owner@alpha.io",
                name="Alice Alpha",
                hashed_password=pw_hash,
                role="OWNER",
                org_id="org_alpha",
                merchant_id="org_alpha",
                is_active=True,
                is_verified=True
            )
            db.add(user_alpha_owner)

        user_alpha_operator = db.query(User).filter(User.email == "operator@alpha.io").first()
        if not user_alpha_operator:
            user_alpha_operator = User(
                id="user_alpha_operator",
                email="operator@alpha.io",
                name="Alan Operator",
                hashed_password=pw_hash,
                role="OPERATOR",
                org_id="org_alpha",
                merchant_id="org_alpha",
                is_active=True,
                is_verified=True
            )
            db.add(user_alpha_operator)

        user_alpha_viewer = db.query(User).filter(User.email == "viewer@alpha.io").first()
        if not user_alpha_viewer:
            user_alpha_viewer = User(
                id="user_alpha_viewer",
                email="viewer@alpha.io",
                name="Victor Viewer",
                hashed_password=pw_hash,
                role="VIEWER",
                org_id="org_alpha",
                merchant_id="org_alpha",
                is_active=True,
                is_verified=True
            )
            db.add(user_alpha_viewer)

        # Users in Org Beta
        user_beta_owner = db.query(User).filter(User.email == "owner@beta.io").first()
        if not user_beta_owner:
            user_beta_owner = User(
                id="user_beta_owner",
                email="owner@beta.io",
                name="Bob Beta",
                hashed_password=pw_hash,
                role="OWNER",
                org_id="org_beta",
                merchant_id="org_beta",
                is_active=True,
                is_verified=True
            )
            db.add(user_beta_owner)

        user_beta_operator = db.query(User).filter(User.email == "operator@beta.io").first()
        if not user_beta_operator:
            user_beta_operator = User(
                id="user_beta_operator",
                email="operator@beta.io",
                name="Brian Operator",
                hashed_password=pw_hash,
                role="OPERATOR",
                org_id="org_beta",
                merchant_id="org_beta",
                is_active=True,
                is_verified=True
            )
            db.add(user_beta_operator)

        db.commit()

        # Seed Domain Records for Org Alpha
        cust_alpha = db.query(Customer).filter(Customer.customer_id == "cust_alpha_01").first()
        if not cust_alpha:
            cust_alpha = Customer(
                customer_id="cust_alpha_01",
                org_id="org_alpha",
                merchant_id="org_alpha",
                external_customer_id="ext_alpha_01",
                name="Alpha VIP Client",
                email="vip@alphaclient.com"
            )
            db.add(cust_alpha)

        pay_alpha = db.query(Payment).filter(Payment.payment_id == "pay_alpha_01").first()
        if not pay_alpha:
            pay_alpha = Payment(
                payment_id="pay_alpha_01",
                org_id="org_alpha",
                merchant_id="org_alpha",
                customer_id="cust_alpha_01",
                amount=12000.0,
                currency="INR",
                status="FAILED",
                failure_reason="temporary_bank_failure"
            )
            db.add(pay_alpha)

        case_alpha = db.query(RecoveryCase).filter(RecoveryCase.case_id == "case_alpha_01").first()
        if not case_alpha:
            case_alpha = RecoveryCase(
                case_id="case_alpha_01",
                org_id="org_alpha",
                payment_id="pay_alpha_01",
                customer_id="cust_alpha_01",
                amount_at_risk=12000.0,
                currency="INR",
                failure_type="BANK_DECLINE",
                recovery_status="AWAITING_APPROVAL",
                approval_status="PENDING",
                approval_required=True,
                recommended_action="retry_payment"
            )
            db.add(case_alpha)

        sub_alpha = db.query(Subscription).filter(Subscription.subscription_id == "sub_alpha_01").first()
        if not sub_alpha:
            sub_alpha = Subscription(
                id="sub_alpha_pk",
                subscription_id="sub_alpha_01",
                org_id="org_alpha",
                customer_id="cust_alpha_01",
                amount=8500.0,
                currency="INR"
            )
            db.add(sub_alpha)

        chk_alpha = db.query(AbandonedCheckout).filter(AbandonedCheckout.checkout_id == "chk_alpha_01").first()
        if not chk_alpha:
            chk_alpha = AbandonedCheckout(
                id="chk_alpha_pk",
                checkout_id="chk_alpha_01",
                org_id="org_alpha",
                customer_name="Alpha Cart Lead",
                customer_email="lead@alpha.io",
                total_value=6500.0,
                currency="INR"
            )
            db.add(chk_alpha)

        audit_alpha = db.query(AuditLog).filter(AuditLog.case_id == "case_alpha_01").first()
        if not audit_alpha:
            audit_alpha = AuditService.log_event(
                db=db,
                case_id="case_alpha_01",
                actor="System Ingress",
                action="payment.failed",
                notes="Confidential Alpha transaction telemetry",
                org_id="org_alpha"
            )

        tokens = {
            "alpha_owner": create_access_token({"sub": "owner@alpha.io", "role": "OWNER", "org_id": "org_alpha"}),
            "alpha_operator": create_access_token({"sub": "operator@alpha.io", "role": "OPERATOR", "org_id": "org_alpha"}),
            "alpha_viewer": create_access_token({"sub": "viewer@alpha.io", "role": "VIEWER", "org_id": "org_alpha"}),
            "beta_owner": create_access_token({"sub": "owner@beta.io", "role": "OWNER", "org_id": "org_beta"}),
            "beta_operator": create_access_token({"sub": "operator@beta.io", "role": "OPERATOR", "org_id": "org_beta"}),
        }

        yield {
            "tokens": tokens,
            "case_alpha_id": "case_alpha_01",
            "pay_alpha_id": "pay_alpha_01",
            "sub_alpha_id": "sub_alpha_01",
            "chk_alpha_id": "chk_alpha_01"
        }
    finally:
        db.close()


def test_org_b_cannot_read_org_a_case_detail(tenant_fixture):
    """Test 1: Tenant B attempting to read Tenant A's recovery case gets 404 Not Found."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['beta_operator']}"}
    res = client.get(f"/api/v1/recovery/cases/{tenant_fixture['case_alpha_id']}", headers=headers)
    assert res.status_code == 404, f"Expected 404 Not Found, got {res.status_code}: {res.text}"


def test_org_b_case_list_excludes_org_a_data(tenant_fixture):
    """Test 2: Tenant B listing recovery cases never sees any cases belonging to Tenant A."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['beta_operator']}"}
    res = client.get("/api/v1/recovery/cases", headers=headers)
    assert res.status_code == 200
    cases = res.json()
    case_ids = [c["id"] for c in cases]
    assert tenant_fixture["case_alpha_id"] not in case_ids, "Leak: Tenant A's case appeared in Tenant B's case list!"


def test_org_b_cannot_read_org_a_payment(tenant_fixture):
    """Test 3: Tenant B reading Tenant A's payment ID directly gets 404 Not Found."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['beta_operator']}"}
    res = client.get(f"/api/v1/payments/{tenant_fixture['pay_alpha_id']}", headers=headers)
    assert res.status_code == 404, f"Expected 404 Not Found, got {res.status_code}: {res.text}"


def test_org_b_payment_list_excludes_org_a_payments(tenant_fixture):
    """Test 4: Tenant B listing payments never sees any payments belonging to Tenant A."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['beta_operator']}"}
    res = client.get("/api/v1/payments", headers=headers)
    assert res.status_code == 200
    payments = res.json()
    pay_ids = [p["payment_id"] for p in payments]
    assert tenant_fixture["pay_alpha_id"] not in pay_ids, "Leak: Tenant A's payment appeared in Tenant B's list!"


def test_org_b_cannot_view_org_a_audit_logs(tenant_fixture):
    """Test 5: Tenant B querying audit logs by Tenant A's case ID gets 404 Not Found or zero results."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['beta_operator']}"}
    res = client.get(f"/api/v1/audit/{tenant_fixture['case_alpha_id']}", headers=headers)
    assert res.status_code in [404, 200]
    if res.status_code == 200:
        assert len(res.json()) == 0, "Leak: Tenant B accessed Tenant A's audit trail!"


def test_org_b_cannot_mutate_org_a_case_approve(tenant_fixture):
    """Test 6: Tenant B attempting to approve Tenant A's recovery action gets 403 Forbidden."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['beta_operator']}"}
    res = client.post(
        f"/api/v1/recovery/{tenant_fixture['case_alpha_id']}/approve",
        headers=headers,
        json={"action": "APPROVE"}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"


def test_org_b_cannot_mutate_org_a_case_reject(tenant_fixture):
    """Test 7: Tenant B attempting to reject Tenant A's recovery action gets 403 Forbidden."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['beta_operator']}"}
    res = client.post(
        f"/api/v1/recovery/{tenant_fixture['case_alpha_id']}/reject",
        headers=headers,
        json={"action": "REJECT", "rejection_reason": "Cross-tenant intrusion attempt"}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"


def test_org_b_cannot_mutate_org_a_subscription(tenant_fixture):
    """Test 8: Tenant B attempting to dispatch notification for Tenant A's subscription gets 403 Forbidden."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['beta_operator']}"}
    res = client.post(
        f"/api/v1/subscriptions/{tenant_fixture['sub_alpha_id']}/send-pre-debit-notification",
        headers=headers
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"


def test_org_b_cannot_mutate_org_a_checkout(tenant_fixture):
    """Test 9: Tenant B attempting to recover Tenant A's checkout session gets 403 Forbidden."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['beta_operator']}"}
    res = client.post(
        f"/api/v1/checkout/{tenant_fixture['chk_alpha_id']}/recover",
        headers=headers
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"


def test_viewer_role_can_read_own_case(tenant_fixture):
    """Test 10: User with VIEWER role can read cases within their own organization."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['alpha_viewer']}"}
    res = client.get(f"/api/v1/recovery/cases/{tenant_fixture['case_alpha_id']}", headers=headers)
    assert res.status_code == 200, f"Expected 200 OK for viewer, got {res.status_code}: {res.text}"
    assert res.json()["id"] == tenant_fixture["case_alpha_id"]


def test_viewer_role_blocked_from_approving_case(tenant_fixture):
    """Test 11: User with VIEWER role attempting to approve a case is blocked with 403 Forbidden."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['alpha_viewer']}"}
    res = client.post(
        f"/api/v1/recovery/{tenant_fixture['case_alpha_id']}/approve",
        headers=headers,
        json={"action": "APPROVE"}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"
    assert "Viewer role is read-only" in res.json().get("detail", "") or "Insufficient permissions" in res.json().get("detail", "")


def test_viewer_role_blocked_from_updating_policy(tenant_fixture):
    """Test 12: User with VIEWER role attempting to update policy config is blocked with 403 Forbidden."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['alpha_viewer']}"}
    res = client.put(
        "/api/v1/policy/config",
        headers=headers,
        json={"max_auto_amount": 25000.0}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"


def test_viewer_role_blocked_from_triggering_simulation(tenant_fixture):
    """Test 13: User with VIEWER role attempting to trigger simulation is blocked with 403 Forbidden."""
    headers = {"Authorization": f"Bearer {tenant_fixture['tokens']['alpha_viewer']}"}
    res = client.post(
        "/api/v1/simulation/trigger",
        headers=headers,
        json={"scenario": "bank_failure", "amount": 4999.0}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"


def test_real_registration_and_email_verification():
    """Test 14 & 15: Real user registration, organization provisioning, and email verification token flow."""
    db: Session = SessionLocal()
    reg_email = f"lead_{int(datetime.datetime.utcnow().timestamp())}@fintechcorp.in"
    try:
        # 1. Register new organization
        res = client.post("/api/v1/auth/register", json={
            "email": reg_email,
            "name": "Priya Nair",
            "password": "ProductionSafe2026!#",
            "org_name": "Nair Cloud Payments"
        })
        assert res.status_code == 200, f"Registration failed: {res.text}"
        data = res.json()
        assert data["email"] == reg_email
        assert data["role"] == "OWNER"
        assert data["org_id"] is not None
        assert data["is_verified"] is False

        # 2. Verify token generation in database
        user = db.query(User).filter(User.email == reg_email).first()
        assert user is not None
        token = create_email_verification_token(db, user)
        assert len(token) > 20

        # 3. Verify email with single-use token
        v_res = client.post("/api/v1/auth/verify-email", json={"token": token})
        assert v_res.status_code == 200
        assert v_res.json()["status"] == "success"

        # 4. Token re-use is strictly blocked
        v_res2 = client.post("/api/v1/auth/verify-email", json={"token": token})
        assert v_res2.status_code == 400

        # 5. User is now marked is_verified = True in DB
        db.refresh(user)
        assert user.is_verified is True
    finally:
        db.close()


def test_totp_mfa_full_lifecycle():
    """Test 16 & 17: Multi-Factor Authentication (TOTP) setup, verify, login gate, and validation."""
    db: Session = SessionLocal()
    mfa_email = f"mfa_{int(datetime.datetime.utcnow().timestamp())}@securesaas.in"
    pw = "MfaPassword2026!@"
    try:
        # Create user
        user = User(
            id=f"user_mfa_{int(datetime.datetime.utcnow().timestamp())}",
            email=mfa_email,
            name="MFA Test User",
            hashed_password=get_password_hash(pw),
            role="OPERATOR",
            org_id="org_alpha",
            merchant_id="org_alpha",
            is_active=True,
            is_verified=True,
            mfa_enabled=False
        )
        db.add(user)
        db.commit()

        login_token = create_access_token({"sub": mfa_email, "role": "OPERATOR", "org_id": "org_alpha"})
        auth_header = {"Authorization": f"Bearer {login_token}"}

        # 1. Setup MFA
        setup_res = client.post("/api/v1/auth/mfa/setup", headers=auth_header)
        assert setup_res.status_code == 200
        secret = setup_res.json()["secret"]
        assert len(secret) >= 16
        assert "otpauth://" in setup_res.json()["otpauth_url"]

        # 2. Verify with valid TOTP code
        current_code = get_current_totp_code(secret)
        verify_res = client.post("/api/v1/auth/mfa/verify", headers=auth_header, json={"code": current_code})
        assert verify_res.status_code == 200
        assert verify_res.json()["status"] == "success"

        # 3. Next login triggers MFA challenge
        login_res = client.post("/api/v1/auth/login", json={"email": mfa_email, "password": pw})
        assert login_res.status_code == 200
        body = login_res.json()
        assert body["mfa_required"] is True
        assert body["access_token"] is None
        assert body["mfa_token"] is not None

        # 4. MFA validation with invalid code fails
        val_fail = client.post("/api/v1/auth/mfa/validate", json={
            "mfa_token": body["mfa_token"],
            "totp_code": "000000"
        })
        assert val_fail.status_code == 401

        # 5. MFA validation with valid code succeeds
        val_success = client.post("/api/v1/auth/mfa/validate", json={
            "mfa_token": body["mfa_token"],
            "totp_code": get_current_totp_code(secret)
        })
        assert val_success.status_code == 200
        assert val_success.json()["access_token"] is not None
        assert val_success.json()["user"]["mfa_enabled"] is True
    finally:
        db.close()


def test_demo_login_permanently_disabled(monkeypatch):
    """Test 18: Demo login endpoint is disabled with 403 Forbidden when DEMO_MODE is False."""
    from backend.config import settings
    monkeypatch.setattr(settings, "DEMO_MODE", False)
    res = client.post("/api/v1/auth/demo-login", json={"persona": "admin"})
    assert res.status_code == 403
    assert "disabled" in res.json().get("detail", "").lower()
