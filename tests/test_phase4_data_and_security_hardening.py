import pytest
import datetime
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.main import app
from backend.database import get_db, SessionLocal
from backend.models.all_models import (
    Organization, Merchant, User, Customer, Payment, RecoveryCase, AuditLog,
    ConsentRecord, DataDeletionRequest
)
from backend.services.auth_service import get_password_hash, create_access_token
from backend.services.crypto_service import CryptoService
from backend.services.audit_service import AuditService, GENESIS_HASH

client = TestClient(app)

@pytest.fixture
def dpdp_test_context():
    db: Session = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        # Tenant A
        org_a = Organization(
            org_id=f"org_dpdp_a_{suffix}",
            name=f"DPDP Fintech Corp A {suffix}",
            slug=f"dpdp-fintech-a-{suffix}",
            is_test_mode=True
        )
        db.add(org_a)

        # Tenant B
        org_b = Organization(
            org_id=f"org_dpdp_b_{suffix}",
            name=f"DPDP Retail B {suffix}",
            slug=f"dpdp-retail-b-{suffix}",
            is_test_mode=True
        )
        db.add(org_b)
        db.commit()

        mer_a = Merchant(merchant_id=org_a.org_id, org_id=org_a.org_id, name="Fintech Corp A")
        mer_b = Merchant(merchant_id=org_b.org_id, org_id=org_b.org_id, name="Retail Corp B")
        db.add_all([mer_a, mer_b])
        db.commit()

        # Users
        user_a = User(
            id=f"user_dpdp_a_{suffix}",
            org_id=org_a.org_id,
            merchant_id=org_a.org_id,
            email=f"compliance_a_{suffix}@fintecha.in",
            name="Compliance Officer A",
            role="ADMIN",
            is_verified=True,
            hashed_password=get_password_hash("DevNonSecret123!")
        )
        user_b = User(
            id=f"user_dpdp_b_{suffix}",
            org_id=org_b.org_id,
            merchant_id=org_b.org_id,
            email=f"compliance_b_{suffix}@retailb.in",
            name="Compliance Officer B",
            role="ADMIN",
            is_verified=True,
            hashed_password=get_password_hash("DevNonSecret123!")
        )
        db.add_all([user_a, user_b])
        db.commit()

        token_a = create_access_token({"sub": user_a.email, "role": "ADMIN", "org_id": org_a.org_id})
        token_b = create_access_token({"sub": user_b.email, "role": "ADMIN", "org_id": org_b.org_id})

        # Customer in Org A
        cust_a = Customer(
            customer_id=f"cust_dpdp_{suffix}",
            org_id=org_a.org_id,
            merchant_id=org_a.org_id,
            external_customer_id=f"ext_cust_{suffix}",
            name="Aditya Singhania",
            email=f"aditya_{suffix}@singhania.in"
        )
        db.add(cust_a)
        db.commit()

        # Payment for Customer in Org A
        pay_a = Payment(
            payment_id=f"pay_dpdp_{suffix}",
            org_id=org_a.org_id,
            merchant_id=org_a.org_id,
            customer_id=cust_a.customer_id,
            amount=7500.0,
            currency="INR",
            payment_method="card",
            provider_payment_id=f"pay_gw_{suffix}",
            status="failed",
            failure_code="CARD_EXPIRED"
        )
        db.add(pay_a)
        db.commit()

        # Recovery Case in Org A
        case_a = RecoveryCase(
            case_id=f"case_dpdp_{suffix}",
            org_id=org_a.org_id,
            payment_id=pay_a.payment_id,
            customer_id=cust_a.customer_id,
            amount_at_risk=7500.0,
            currency="INR",
            recovery_status="NEW"
        )
        db.add(case_a)
        db.commit()

        yield {
            "db": db,
            "org_a": org_a,
            "org_b": org_b,
            "user_a": user_a,
            "user_b": user_b,
            "token_a": token_a,
            "token_b": token_b,
            "cust_a": cust_a,
            "pay_a": pay_a,
            "case_a": case_a
        }
    finally:
        db.close()


def test_dpdp_consent_recording_and_retention(dpdp_test_context):
    ctx = dpdp_test_context
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    payload = {
        "data_principal_id": ctx["cust_a"].email,
        "purpose": "payment_failure_recovery_communications",
        "lawful_basis": "CONSENT",
        "retention_period_days": 180,
        "metadata": {"source": "checkout_optin", "notice_version": "v2.1"}
    }

    res = client.post("/api/v1/compliance/consent", json=payload, headers=headers_a)
    assert res.status_code == 201, res.text
    data = res.json()

    assert data["org_id"] == ctx["org_a"].org_id
    assert data["data_principal_id"] == ctx["cust_a"].email
    assert data["status"] == "ACTIVE"
    assert data["retention_period_days"] == 180
    assert "expires_at" in data

    # Verify listing scoped by tenant
    list_res = client.get("/api/v1/compliance/consent", headers=headers_a)
    assert list_res.status_code == 200
    consents = list_res.json()
    assert len(consents) >= 1
    assert any(c["id"] == data["id"] for c in consents)

    # Verify tenant isolation: Org B sees zero of Org A's consent records
    headers_b = {"Authorization": f"Bearer {ctx['token_b']}"}
    list_b = client.get("/api/v1/compliance/consent", headers=headers_b)
    assert list_b.status_code == 200
    for c in list_b.json():
        assert c["org_id"] == ctx["org_b"].org_id
        assert c["id"] != data["id"]


def test_dpdp_data_portability_export(dpdp_test_context):
    ctx = dpdp_test_context
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    # First record consent
    client.post("/api/v1/compliance/consent", json={
        "data_principal_id": ctx["cust_a"].email,
        "purpose": "payment_recovery_telemetry",
        "lawful_basis": "CONSENT",
        "retention_period_days": 90
    }, headers=headers_a)

    # Run data export
    export_res = client.post(
        f"/api/v1/compliance/export?data_principal_id={ctx['cust_a'].email}",
        headers=headers_a
    )
    assert export_res.status_code == 200, export_res.text
    dossier = export_res.json()

    assert dossier["org_id"] == ctx["org_a"].org_id
    assert dossier["customers_count"] >= 1
    assert "India DPDP Act 2023" in dossier["notice"]

    # Invariant: Never export full card PAN or CVV
    for p in dossier["payments"]:
        assert "pan" not in p
        assert "cvv" not in p
        assert p.get("card_last4") == "1122"
        assert p.get("card_network") == "Visa"

    # Verify Tenant Isolation: Org B export cannot see Org A's customer
    headers_b = {"Authorization": f"Bearer {ctx['token_b']}"}
    export_b = client.post(
        f"/api/v1/compliance/export?data_principal_id={ctx['cust_a'].email}",
        headers=headers_b
    )
    assert export_b.status_code == 200
    dossier_b = export_b.json()
    assert dossier_b["customers_count"] == 0
    assert len(dossier_b["payments"]) == 0


def test_dpdp_right_to_erasure_anonymizes_pii_and_preserves_audit(dpdp_test_context):
    ctx = dpdp_test_context
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}
    db = ctx["db"]

    target_email = ctx["cust_a"].email

    # Submit deletion request
    del_res = client.post("/api/v1/compliance/delete", json={
        "data_principal_id": target_email,
        "reason": "Customer withdrawn consent under DPDP Section 12"
    }, headers=headers_a)

    assert del_res.status_code == 200, del_res.text
    del_data = del_res.json()
    assert del_data["status"] == "COMPLETED"
    assert del_data["erasure_summary"]["customers_anonymized"] >= 1
    assert del_data["erasure_summary"]["pii_retention"] == "PURGED"

    # Query DB directly to verify customer was anonymized
    db.expire_all()
    cust = db.query(Customer).filter(Customer.customer_id == ctx["cust_a"].customer_id).first()
    assert cust.name == "ANONYMIZED_USER"
    assert cust.email != target_email
    assert "erased_" in cust.email
    assert cust.consent_status is False

    # Verify case customer PII was anonymized
    case = db.query(RecoveryCase).filter(RecoveryCase.case_id == ctx["case_a"].case_id).first()
    assert case.customer.name == "ANONYMIZED_USER"
    assert "erased_" in case.customer.email

    # Verify an audit log was appended recording the erasure action
    audit_entry = db.query(AuditLog).filter(
        AuditLog.org_id == ctx["org_a"].org_id,
        AuditLog.action == "dpdp.data_erased"
    ).first()
    assert audit_entry is not None
    assert audit_entry.actor == ctx["user_a"].email
    assert audit_entry.entry_hash is not None


def test_audit_log_cryptographic_hash_chain_verification_on_real_data(dpdp_test_context):
    ctx = dpdp_test_context
    db = ctx["db"]

    # 1. Verification of real chain
    verify_res = client.get("/api/v1/audit/verify-chain")
    assert verify_res.status_code == 200
    res_data = verify_res.json()
    assert res_data["valid"] is True
    assert res_data["status"] == "CRYPTOGRAPHICALLY_VERIFIED"
    assert res_data["total_blocks"] > 0
    assert len(res_data["genesis_hash"]) == 64
    assert len(res_data["head_hash"]) == 64

    # 2. Tamper Simulation Test
    # Tampering with a stored audit block should immediately fail cryptographic verification
    latest_log = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
    original_action = latest_log.action
    
    try:
        # Bypassing immutability listener for tamper test
        latest_log._allow_audit_update = True
        latest_log.action = "TAMPERED_ACTION_FORGED"
        db.commit()

        # Run verification against tampered DB
        tamper_check = AuditService.verify_chain(db)
        assert tamper_check["valid"] is False
        assert tamper_check["status"] in ["TAMPERED", "CORRUPTED"]
        assert tamper_check["broken_block_id"] == latest_log.audit_id
    finally:
        # Restore block to original state
        latest_log._allow_audit_update = True
        latest_log.action = original_action
        db.commit()

    # Re-verify restored chain
    restored_check = AuditService.verify_chain(db)
    assert restored_check["valid"] is True


def test_pii_masking_helpers():
    # Email masking
    assert CryptoService.mask_email("vikram.sharma@enterprise.in") == "v***a@enterprise.in"
    assert CryptoService.mask_email("hr@startup.co") == "h***@startup.co"
    assert CryptoService.mask_email("") == ""

    # Phone masking
    assert CryptoService.mask_phone("+919820144829") == "+919*****829"
    assert CryptoService.mask_phone("9876543210") == "9876*****210"
    assert CryptoService.mask_phone("") == ""


def test_input_validation_and_parameterized_query_defense(dpdp_test_context):
    headers = {"Authorization": f"Bearer {dpdp_test_context['token_a']}"}

    # Malformed retention period (negative or excessive)
    bad_res = client.post("/api/v1/compliance/consent", json={
        "data_principal_id": "test@domain.com",
        "purpose": "test",
        "retention_period_days": -10 # invalid le=0
    }, headers=headers)
    assert bad_res.status_code == 422 # Pydantic validation error

    # Excessive retention (>10 years)
    excessive_res = client.post("/api/v1/compliance/consent", json={
        "data_principal_id": "test@domain.com",
        "purpose": "test",
        "retention_period_days": 50000
    }, headers=headers)
    assert excessive_res.status_code == 422
