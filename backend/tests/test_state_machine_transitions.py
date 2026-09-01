import pytest
import datetime
import uuid
from backend.database import SessionLocal
from backend.models.all_models import RecoveryCase, Payment, Merchant, Customer
from backend.events.taxonomy import RecoveryEventType
from backend.services.recovery_engine import RecoveryEngine
from backend.services.state_machine import RecoveryStateMachine, RecoveryState

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def _create_unique_payment(db, amount=5000.0):
    merchant = db.query(Merchant).first()
    customer = db.query(Customer).first()
    unique_suffix = uuid.uuid4().hex[:8]
    payment = Payment(
        payment_id=f"pay_sm_{unique_suffix}",
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=amount,
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
    db.refresh(payment)
    return payment, customer, merchant

def test_recovery_state_machine_canonical_lifecycle(db):
    """
    Validates explicit recovery lifecycle progression through engine execution:
    NEW -> ANALYZING -> ACTION_RECOMMENDED -> AWAITING_APPROVAL -> APPROVED -> EXECUTING -> VERIFYING -> RECOVERED
    """
    payment, customer, merchant = _create_unique_payment(db, amount=12000.0)

    # Process failure through engine
    case = RecoveryEngine.process_payment_failure(db, payment, customer, merchant)
    assert case is not None
    assert case.recovery_status in ["ACTION_RECOMMENDED", "AWAITING_APPROVAL", "APPROVED", "RECOVERED"]

    # If awaiting approval, test human approval transition
    if case.recovery_status == "AWAITING_APPROVAL":
        updated_case = RecoveryEngine.approve_case(
            db=db,
            case=case,
            user_name="Senior Revenue Operator",
            notes="Manually approved via test state machine runner"
        )
        assert updated_case.approval_status == "APPROVED"

    # Execute recovery action
    exec_res = RecoveryEngine.execute_recovery_action(
        db=db,
        case=case,
        actor="Test Operator"
    )
    assert exec_res["success"] is True
    assert case.recovery_status in ["RECOVERED", "FAILED", "ESCALATED"]

def test_state_machine_standard_success_progression(db):
    """
    Direct State Machine verification for the full standard success path:
    NEW -> ANALYZING -> ACTION_RECOMMENDED -> AWAITING_APPROVAL -> APPROVED -> EXECUTING -> VERIFYING -> RECOVERED
    """
    payment, customer, _ = _create_unique_payment(db, amount=4500.0)

    case = RecoveryCase(
        case_id=f"RV-SM-SUCCESS-{uuid.uuid4().hex[:6]}",
        payment_id=payment.payment_id,
        customer_id=customer.customer_id,
        case_type="PAYMENT_FAILURE",
        amount_at_risk=4500.0,
        recovery_status="NEW",
        approval_status="PENDING",
        tat_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7)
    )
    db.add(case)
    db.commit()

    # Transition sequence
    seq = [
        RecoveryState.ANALYZING,
        RecoveryState.ACTION_RECOMMENDED,
        RecoveryState.AWAITING_APPROVAL,
        RecoveryState.APPROVED,
        RecoveryState.EXECUTING,
        RecoveryState.VERIFYING,
        RecoveryState.RECOVERED
    ]

    for next_st in seq:
        assert RecoveryStateMachine.is_valid_transition(case.recovery_status, next_st.value) is True
        case = RecoveryStateMachine.transition(
            db=db,
            case=case,
            to_state=next_st.value,
            actor="Test Suite Supervisor",
            notes=f"Progressed to {next_st.value}"
        )
        assert case.recovery_status == next_st.value

def test_state_machine_failure_and_reassessment_progression(db):
    """
    Direct State Machine verification for the failure, reassess, and stop/escalate paths:
    EXECUTING -> FAILED -> REASSESS -> STOPPED
    EXECUTING -> FAILED -> REASSESS -> ESCALATED
    """
    payment1, customer, _ = _create_unique_payment(db, amount=8500.0)
    case_fail_stop = RecoveryCase(
        case_id=f"RV-SM-FAIL-STOP-{uuid.uuid4().hex[:6]}",
        payment_id=payment1.payment_id,
        customer_id=customer.customer_id,
        case_type="PAYMENT_FAILURE",
        amount_at_risk=8500.0,
        recovery_status="EXECUTING",
        tat_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7)
    )
    db.add(case_fail_stop)
    db.commit()

    # Path 1: EXECUTING -> FAILED -> REASSESS -> STOPPED
    RecoveryStateMachine.transition(db, case_fail_stop, "FAILED", notes="Issuer gateway declined retry")
    assert case_fail_stop.recovery_status == "FAILED"

    RecoveryStateMachine.transition(db, case_fail_stop, "REASSESS", notes="Evaluating alternative recovery methods")
    assert case_fail_stop.recovery_status == "REASSESS"

    RecoveryStateMachine.transition(db, case_fail_stop, "STOPPED", notes="No further automated paths eligible. Stopped.")
    assert case_fail_stop.recovery_status == "STOPPED"

    # Path 2: EXECUTING -> FAILED -> REASSESS -> ESCALATED
    payment2, customer, _ = _create_unique_payment(db, amount=25000.0)
    case_fail_esc = RecoveryCase(
        case_id=f"RV-SM-FAIL-ESC-{uuid.uuid4().hex[:6]}",
        payment_id=payment2.payment_id,
        customer_id=customer.customer_id,
        case_type="PAYMENT_FAILURE",
        amount_at_risk=25000.0,
        recovery_status="EXECUTING",
        tat_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7)
    )
    db.add(case_fail_esc)
    db.commit()

    RecoveryStateMachine.transition(db, case_fail_esc, "FAILED", notes="Gateway timeout on high value charge")
    RecoveryStateMachine.transition(db, case_fail_esc, "REASSESS", notes="Reassessing high value dispute")
    RecoveryStateMachine.transition(db, case_fail_esc, "ESCALATED", notes="Escalated to senior merchant account manager")
    assert case_fail_esc.recovery_status == "ESCALATED"

def test_state_machine_auto_approved_success_progression(db):
    """
    Direct State Machine verification for the autonomous low-risk path:
    NEW -> ANALYZING -> ACTION_RECOMMENDED -> AUTO_APPROVED -> EXECUTING -> VERIFYING -> RECOVERED
    """
    payment, customer, _ = _create_unique_payment(db, amount=2000.0)

    case = RecoveryCase(
        case_id=f"RV-SM-AUTO-{uuid.uuid4().hex[:6]}",
        payment_id=payment.payment_id,
        customer_id=customer.customer_id,
        case_type="PAYMENT_FAILURE",
        amount_at_risk=2000.0,
        recovery_status="NEW",
        tat_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7)
    )
    db.add(case)
    db.commit()

    seq = [
        RecoveryState.ANALYZING,
        RecoveryState.ACTION_RECOMMENDED,
        RecoveryState.AUTO_APPROVED,
        RecoveryState.EXECUTING,
        RecoveryState.VERIFYING,
        RecoveryState.RECOVERED
    ]

    for next_st in seq:
        assert RecoveryStateMachine.is_valid_transition(case.recovery_status, next_st.value) is True
        case = RecoveryStateMachine.transition(
            db=db,
            case=case,
            to_state=next_st.value,
            actor="Autonomous Engine",
            notes=f"Autonomous step {next_st.value}"
        )
        assert case.recovery_status == next_st.value

def test_state_machine_rejection_path(db):
    """
    Verifies human operator rejection path and terminal state invariants:
    NEW -> ANALYZING -> ACTION_RECOMMENDED -> AWAITING_APPROVAL -> REJECTED
    """
    payment, customer, _ = _create_unique_payment(db, amount=15000.0)

    case = RecoveryCase(
        case_id=f"RV-SM-REJ-{uuid.uuid4().hex[:6]}",
        payment_id=payment.payment_id,
        customer_id=customer.customer_id,
        case_type="PAYMENT_FAILURE",
        amount_at_risk=15000.0,
        recovery_status="NEW",
        tat_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7)
    )
    db.add(case)
    db.commit()

    RecoveryStateMachine.transition(db, case, "ANALYZING")
    RecoveryStateMachine.transition(db, case, "ACTION_RECOMMENDED")
    RecoveryStateMachine.transition(db, case, "AWAITING_APPROVAL")
    RecoveryStateMachine.transition(db, case, "REJECTED", notes="Operator declined action due to customer request")
    assert case.recovery_status == "REJECTED"

    # REJECTED is terminal
    assert RecoveryStateMachine.is_valid_transition("REJECTED", "EXECUTING") is False
    assert RecoveryStateMachine.is_valid_transition("REJECTED", "RECOVERED") is False
    with pytest.raises(ValueError):
        RecoveryStateMachine.transition(db, case, "EXECUTING")

def test_state_machine_illegal_transition_rejections(db):
    """
    Verifies that invalid or out-of-order transitions are strictly rejected by the supervisor.
    """
    payment, customer, _ = _create_unique_payment(db, amount=1000.0)

    case = RecoveryCase(
        case_id=f"RV-SM-ILLEGAL-{uuid.uuid4().hex[:6]}",
        payment_id=payment.payment_id,
        customer_id=customer.customer_id,
        case_type="PAYMENT_FAILURE",
        amount_at_risk=1000.0,
        recovery_status="RECOVERED",
        tat_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7)
    )
    db.add(case)
    db.commit()

    # Terminal state RECOVERED cannot transition back to NEW or ANALYZING
    assert RecoveryStateMachine.is_valid_transition("RECOVERED", "NEW") is False
    assert RecoveryStateMachine.is_valid_transition("RECOVERED", "ANALYZING") is False
    assert RecoveryStateMachine.is_valid_transition("RECOVERED", "EXECUTING") is False

    with pytest.raises(ValueError, match="Invalid state transition"):
        RecoveryStateMachine.transition(db, case, "NEW")


def test_state_machine_executing_cannot_transition_to_action_recommended(db):
    """
    Regression Test: Ensures that EXECUTING cannot transition directly to ACTION_RECOMMENDED.
    Valid lifecycle from EXECUTING must only lead to VERIFYING, RECOVERED, FAILED, or ESCALATED.
    A failed retry must follow: EXECUTING -> FAILED -> REASSESS -> ACTION_RECOMMENDED.
    """
    # 1. State machine graph check
    assert RecoveryStateMachine.is_valid_transition("EXECUTING", "ACTION_RECOMMENDED") is False

    # 2. Database entity transition check
    payment, customer, _ = _create_unique_payment(db, amount=3000.0)
    case = RecoveryCase(
        case_id=f"RV-SM-NO-EXEC-AR-{uuid.uuid4().hex[:6]}",
        payment_id=payment.payment_id,
        customer_id=customer.customer_id,
        case_type="PAYMENT_FAILURE",
        amount_at_risk=3000.0,
        recovery_status="EXECUTING",
        tat_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7)
    )
    db.add(case)
    db.commit()

    with pytest.raises(ValueError, match="Invalid state transition: Cannot transition recovery case from 'EXECUTING' to 'ACTION_RECOMMENDED'"):
        RecoveryStateMachine.transition(db, case, "ACTION_RECOMMENDED")
