import pytest
import uuid
from sqlalchemy import func
from backend.database import SessionLocal
from backend.models.all_models import (
    Merchant, Customer, Payment, PaymentEvent, RecoveryCase,
    AgentDecision, RecoveryAction, PolicyEvaluation, Approval,
    AuditLog, Notification, PolicyConfig
)
from backend.services.policy_gateway import PolicyGateway
from backend.services.recovery_engine import RecoveryEngine
from backend.services.metrics_service import MetricsService

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_retry_count_never_exceeds_max_retries(db_session):
    """
    INVARIANT 1: retry_count <= maximum_allowed_retries (Never allow 3 / 2)
    """
    payments = db_session.query(Payment).all()
    assert len(payments) > 0
    for p in payments:
        max_allowed = p.max_retry_count or 2
        assert p.retry_count <= max_allowed, f"Payment {p.payment_id} has retry_count {p.retry_count} > max {max_allowed}"

    # Test RecoveryEngine execution blocking when max retries is reached
    uid = uuid.uuid4().hex[:8]
    test_payment = Payment(
        payment_id=f"pay_inv_retry_{uid}",
        merchant_id=payments[0].merchant_id,
        customer_id=payments[0].customer_id,
        amount=1500.0,
        status="FAILED",
        failure_category="temporary_bank_failure",
        retry_count=2,
        max_retry_count=2
    )
    db_session.add(test_payment)
    db_session.commit()

    test_case = RecoveryCase(
        case_id=f"RV-INV-{uid}",
        payment_id=test_payment.payment_id,
        customer_id=test_payment.customer_id,
        amount_at_risk=1500.0,
        currency="INR",
        failure_type="BANK_DECLINE",
        recommended_action="retry_payment",
        policy_status="PASSED"
    )
    db_session.add(test_case)
    db_session.commit()

    # Execute recovery action on already-exhausted payment
    result = RecoveryEngine.execute_recovery_action(db_session, test_case, actor="Test Operator")
    assert result["success"] is False
    assert result["status"] == "ESCALATED"
    assert test_payment.retry_count == 2, "Retry count must not increment past max_retries!"

def test_payment_marked_success_cannot_be_retried(db_session):
    """
    INVARIANT 2: A payment marked SUCCESS must not remain eligible for automatic retry.
    """
    merchant = db_session.query(Merchant).first()
    customer = db_session.query(Customer).first()
    policy = db_session.query(PolicyConfig).first()
    uid = uuid.uuid4().hex[:8]

    success_payment = Payment(
        payment_id=f"pay_inv_succ_{uid}",
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=2500.0,
        status="SUCCESS",
        failure_category="temporary_bank_failure",
        retry_count=1,
        max_retry_count=2
    )
    db_session.add(success_payment)
    db_session.commit()

    case = RecoveryCase(
        case_id=f"RV-SUCC-{uid}",
        payment_id=success_payment.payment_id,
        customer_id=customer.customer_id,
        amount_at_risk=2500.0,
        currency="INR",
        failure_type="BANK_DECLINE",
        recommended_action="retry_payment"
    )
    db_session.add(case)
    db_session.commit()

    # 1. Policy Gateway should BLOCK retry on SUCCESS payment
    status, checklist, reason = PolicyGateway.evaluate(
        case=case,
        payment=success_payment,
        customer=customer,
        policy=policy,
        proposed_action="retry_payment",
        ai_confidence=0.95
    )
    assert status == "BLOCKED"
    assert any(rule["rule"] == "payment_not_already_succeeded" and not rule["passed"] for rule in checklist)

    # 2. Recovery Engine execution guard
    result = RecoveryEngine.execute_recovery_action(db_session, case, actor="Autonomous Engine")
    assert result["status"] == "RECOVERED"
    assert success_payment.retry_count == 1, "Retry count must not change on already-settled payment"

def test_recovered_case_invariants(db_session):
    """
    INVARIANT 3: A case marked RECOVERED must have:
    - recovered_amount > 0
    - resolved_at != None
    - outcome_verified = True
    """
    recovered_cases = db_session.query(RecoveryCase).filter(RecoveryCase.recovery_status == "RECOVERED").all()
    assert len(recovered_cases) > 0
    for rc in recovered_cases:
        assert rc.recovered_amount > 0, f"Case {rc.case_id} marked RECOVERED but has 0 recovered_amount"
        assert rc.resolved_at is not None, f"Case {rc.case_id} marked RECOVERED but resolved_at is null"
        assert rc.outcome_verified is True, f"Case {rc.case_id} marked RECOVERED but outcome_verified is False"

def test_awaiting_approval_case_invariants(db_session):
    """
    INVARIANT 4: A case marked AWAITING_APPROVAL must have:
    - approval_required = True
    - approval_status = PENDING
    """
    pending_cases = db_session.query(RecoveryCase).filter(RecoveryCase.recovery_status == "AWAITING_APPROVAL").all()
    assert len(pending_cases) > 0
    for pc in pending_cases:
        assert pc.approval_required is True, f"Case {pc.case_id} is AWAITING_APPROVAL but approval_required is False"
        assert pc.approval_status == "PENDING", f"Case {pc.case_id} is AWAITING_APPROVAL but approval_status is {pc.approval_status}"
        assert pc.recovered_amount == 0.0

def test_executed_action_has_traceable_domain_entities(db_session):
    """
    INVARIANT 5: An action marked EXECUTED must create RecoveryAction entity and AuditLog.
    """
    merchant = db_session.query(Merchant).first()
    customer = db_session.query(Customer).first()
    uid = uuid.uuid4().hex[:8]

    p = Payment(
        payment_id=f"pay_trace_{uid}",
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=3000.0,
        status="FAILED",
        failure_category="temporary_bank_failure",
        retry_count=0,
        max_retry_count=2
    )
    db_session.add(p)
    db_session.commit()

    case = RecoveryCase(
        case_id=f"RV-TRACE-{uid}",
        payment_id=p.payment_id,
        customer_id=customer.customer_id,
        amount_at_risk=3000.0,
        currency="INR",
        failure_type="BANK_DECLINE",
        recommended_action="retry_payment",
        policy_status="PASSED"
    )
    db_session.add(case)
    db_session.commit()

    result = RecoveryEngine.execute_recovery_action(db_session, case, actor="Rohan Deshmukh (Operator)")
    assert result["action_id"] is not None

    # Check RecoveryAction entity
    rec_act = db_session.query(RecoveryAction).filter(RecoveryAction.case_id == case.case_id).first()
    assert rec_act is not None
    assert rec_act.requested_by == "Rohan Deshmukh (Operator)"

    # Check audit log
    audits = db_session.query(AuditLog).filter(AuditLog.case_id == case.case_id).all()
    assert len(audits) > 0
    assert any(a.event_type in ["recovery.verified", "PAYMENT_RECOVERED"] for a in audits)

def test_all_11_domain_entities_present(db_session):
    """
    DOMAIN CHECK: Verify all 11 domain entities are populated in DB.
    """
    assert db_session.query(Merchant).count() > 0
    assert db_session.query(Customer).count() > 0
    assert db_session.query(Payment).count() > 0
    assert db_session.query(PaymentEvent).count() > 0
    assert db_session.query(RecoveryCase).count() > 0
    assert db_session.query(AgentDecision).count() > 0
    assert db_session.query(RecoveryAction).count() > 0
    assert db_session.query(PolicyEvaluation).count() > 0
    assert db_session.query(Approval).count() > 0
    assert db_session.query(AuditLog).count() > 0
    assert db_session.query(Notification).count() > 0

def test_metrics_strictly_derived_from_db(db_session):
    """
    INVARIANT 7: Every displayed metric must be derived from the same underlying database records.
    """
    summary = MetricsService.get_dashboard_summary(db_session)
    
    # Calculate directly via SQL
    db_risk_sum = db_session.query(func.sum(RecoveryCase.amount_at_risk)).filter(
        RecoveryCase.recovery_status.in_([
            "NEW", "ANALYZING", "ACTION_RECOMMENDED", "AWAITING_APPROVAL", "APPROVED", "EXECUTING", "FAILED", "ESCALATED"
        ])
    ).scalar() or 0.0

    db_recovered_sum = db_session.query(func.sum(RecoveryCase.recovered_amount)).filter(
        RecoveryCase.recovery_status == "RECOVERED"
    ).scalar() or 0.0

    assert summary["revenue_at_risk"] == round(db_risk_sum, 2)
    assert summary["recovered_revenue"] == round(db_recovered_sum, 2)
