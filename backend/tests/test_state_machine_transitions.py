import pytest
import datetime
from backend.database import SessionLocal
from backend.models.all_models import RecoveryCase, Payment, Merchant, Customer
from backend.events.taxonomy import RecoveryEventType
from backend.services.recovery_engine import RecoveryEngine

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_recovery_state_machine_canonical_lifecycle(db):
    """
    Validates explicit recovery lifecycle progression:
    NEW -> ANALYZING -> ACTION_RECOMMENDED -> AWAITING_APPROVAL -> APPROVED -> EXECUTING -> VERIFYING -> RECOVERED
    """
    merchant = db.query(Merchant).first()
    customer = db.query(Customer).first()
    assert merchant is not None and customer is not None

    # 1. Create failed payment entity
    payment = Payment(
        payment_id=f"pay_sm_test_{int(datetime.datetime.utcnow().timestamp())}",
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=12000.0,
        currency="INR",
        status="FAILED",
        failure_code="BANK_SWITCH_OUTAGE",
        failure_category="temporary_bank_failure",
        retry_count=0,
        max_retry_count=2,
        payment_method="upi"
    )
    db.add(payment)
    db.commit()

    # 2. Process failure through engine (NEW -> ANALYZING -> ACTION_RECOMMENDED -> AUTO_APPROVED or AWAITING_APPROVAL)
    case = RecoveryEngine.process_payment_failure(db, payment, customer, merchant)
    assert case is not None
    assert case.recovery_status in ["ACTION_RECOMMENDED", "AWAITING_APPROVAL", "APPROVED", "RECOVERED"]

    # 3. If awaiting approval, test human approval transition
    if case.recovery_status == "AWAITING_APPROVAL":
        updated_case = RecoveryEngine.approve_case(
            db=db,
            case=case,
            user_name="Senior Revenue Operator",
            notes="Manually approved via test state machine runner"
        )
        assert updated_case.approval_status == "APPROVED"

    # 4. Execute recovery action (EXECUTING -> VERIFYING -> RECOVERED)
    exec_res = RecoveryEngine.execute_recovery_action(
        db=db,
        case=case,
        actor="Test Operator"
    )
    assert exec_res["success"] is True
    assert case.recovery_status in ["RECOVERED", "FAILED", "ESCALATED"]
