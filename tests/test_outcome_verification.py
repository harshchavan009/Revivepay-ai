import pytest
import datetime
from backend.database import SessionLocal
from backend.models.all_models import RecoveryCase, Payment, Merchant, Customer
from backend.services.outcome_verification_service import OutcomeVerificationService

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_outcome_verification_success(db):
    """
    Asserts that a successful settlement transitions case to RECOVERED,
    sets outcome_verified=True, and updates recovered_amount correctly.
    """
    case = db.query(RecoveryCase).first()
    assert case is not None

    provider_res = {
        "status": "SUCCESS",
        "payment_id": "pay_test_outcome_ver_123",
        "recovered_amount": float(case.amount_at_risk)
    }

    result = OutcomeVerificationService.verify_recovery_outcome(
        db=db,
        case=case,
        provider_result=provider_res,
        actor="Test Verifier"
    )

    assert result["verified"] is True
    assert result["status"] == "RECOVERED"
    assert case.outcome_verified is True
    assert case.recovery_status == "RECOVERED"
    assert case.recovered_amount == float(case.amount_at_risk)
    assert case.resolved_at is not None

def test_outcome_verification_failure_blocks_recovery(db):
    """
    Asserts that an uncaptured or failed settlement transitions case to FAILED,
    does NOT set outcome_verified, and records audit block.
    """
    case = db.query(RecoveryCase).first()
    assert case is not None

    provider_res = {
        "status": "FAILED",
        "error": "GATEWAY_TIMEOUT",
        "recovered_amount": 0.0
    }

    result = OutcomeVerificationService.verify_recovery_outcome(
        db=db,
        case=case,
        provider_result=provider_res,
        actor="Test Verifier"
    )

    assert result["verified"] is False
    assert result["status"] == "FAILED"
    assert case.outcome_verified is False
    assert case.recovery_status == "FAILED"
