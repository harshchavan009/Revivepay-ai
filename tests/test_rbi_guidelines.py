import datetime
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models.all_models import RecoveryCase, Payment, Customer, Merchant, Subscription, AuditLog, PolicyConfig
from backend.services.recovery_engine import RecoveryEngine
from backend.services.policy_gateway import PolicyGateway
from backend.services.ai_agent import ai_service
from backend.events.taxonomy import SubscriptionEventType, RecoveryEventType
from backend.config import settings

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_tat_deadline_computation_at_case_creation(db):
    """
    Verifies that TAT deadline is computed accurately based on payment rail:
    - UPI: T+1 day
    - Card/NEFT: T+5 business days (7 calendar days)
    """
    merchant = db.query(Merchant).first()
    customer = db.query(Customer).first()
    now = datetime.datetime.utcnow()

    # Test UPI rail
    upi_payment = Payment(
        payment_id="pay_test_upi_tat_01",
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=1999.0,
        currency="INR",
        payment_method="upi",
        status="FAILED",
        failure_category="temporary_bank_failure",
        failure_code="UPI_TIMEOUT",
        failure_reason="UPI PSP switch timeout",
        retry_count=0
    )
    db.add(upi_payment)
    db.commit()
    db.refresh(upi_payment)

    upi_case = RecoveryEngine.process_payment_failure(db, upi_payment, customer, merchant)
    assert upi_case.tat_deadline is not None
    # Within ~1 day of now
    time_diff_upi = (upi_case.tat_deadline - now).total_seconds()
    assert 80000 <= time_diff_upi <= 90000 # ~24 hours

    # Test Card rail
    card_payment = Payment(
        payment_id="pay_test_card_tat_01",
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=4999.0,
        currency="INR",
        payment_method="card",
        status="FAILED",
        failure_category="temporary_bank_failure",
        failure_code="CARD_TIMEOUT",
        failure_reason="Issuer gateway timeout",
        retry_count=0
    )
    db.add(card_payment)
    db.commit()
    db.refresh(card_payment)

    card_case = RecoveryEngine.process_payment_failure(db, card_payment, customer, merchant)
    assert card_case.tat_deadline is not None
    time_diff_card = (card_case.tat_deadline - now).total_seconds()
    assert 550000 <= time_diff_card <= 650000 # ~7 days

def test_tat_breach_detection_and_compensation_calculation(db):
    """
    Verifies that overdue cases are flagged as BREACHED, statutory accrued compensation
    is calculated at ₹100/day, and cases auto-escalate to the human approval queue.
    """
    merchant = db.query(Merchant).first()
    customer = db.query(Customer).first()
    now = datetime.datetime.utcnow()

    # Create a simulated payment and case with past TAT deadline (3 days overdue)
    past_dl = now - datetime.timedelta(days=3)
    p = Payment(
        payment_id="pay_test_tat_breached_01",
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=3500.0,
        currency="INR",
        status="FAILED",
        failure_category="temporary_bank_failure",
        retry_count=0
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    case = RecoveryCase(
        case_id="RV-TAT-BREACH-01",
        payment_id=p.payment_id,
        customer_id=customer.customer_id,
        amount_at_risk=3500.0,
        risk_score=45.0,
        risk_level="LOW",
        recovery_status="NEW",
        policy_status="PASSED",
        tat_deadline=past_dl,
        tat_status="ON_TRACK",
        accrued_compensation_inr=0.0
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Run TAT background monitor
    breached = RecoveryEngine.check_and_update_tat_statuses(db)
    db.refresh(case)

    assert case.tat_status == "BREACHED"
    assert case.accrued_compensation_inr >= 300.0 # At least ₹100 x 3 days
    assert case.policy_status == "REVIEW_REQUIRED"
    assert case.approval_required is True
    assert case.recovery_status == "AWAITING_APPROVAL"

def test_rbi_emandate_pre_debit_notification_enforcement(db):
    """
    Verifies that recurring subscription charges ≥ ₹15,000 are blocked by PolicyGateway
    if the 24-hour pre-debit customer notification window has not elapsed.
    """
    # Create subscription ≥ 15,000 with NO notification sent
    sub = Subscription(
        subscription_id="sub_test_emandate_01",
        customer_id="cust_test_01",
        plan_name="Enterprise Scale",
        amount=18000.0,
        currency="INR",
        current_status="PAST_DUE",
        afa_required=True,
        pre_debit_notification_sent_at=None
    )
    db.add(sub)
    db.commit()

    # Direct retry should be rejected with 400 Bad Request
    res = client.post(f"/api/subscriptions/{sub.subscription_id}/retry")
    assert res.status_code == 400
    assert "24-hour pre-debit" in res.json()["detail"]

    # Send statutory 24-hour pre-debit notification
    notify_res = client.post(f"/api/subscriptions/{sub.subscription_id}/send-pre-debit-notification")
    assert notify_res.status_code == 200
    assert notify_res.json()["success"] is True

    # Now retry should pass policy and execute
    retry_res = client.post(f"/api/subscriptions/{sub.subscription_id}/retry")
    assert retry_res.status_code == 200
    assert retry_res.json()["status"] == "ACTIVE"

def test_rbi_emandate_customer_opt_out_cancellation_and_audit(db):
    """
    Verifies that a customer opt-out cancels the recurring charge and logs a distinct
    customer-initiated action in the immutable audit ledger.
    """
    sub = Subscription(
        subscription_id="sub_test_opt_out_01",
        customer_id="cust_test_02",
        plan_name="Developer Plan",
        amount=4999.0,
        currency="INR",
        current_status="ACTIVE",
        afa_required=False,
        opt_out_status=False
    )
    db.add(sub)
    db.commit()

    # Trigger customer opt-out
    res = client.post(f"/api/subscriptions/{sub.subscription_id}/opt-out")
    assert res.status_code == 200
    assert res.json()["success"] is True

    db.refresh(sub)
    assert sub.opt_out_status is True
    assert sub.current_status == "HALTED"

    # Verify audit log record
    log = db.query(AuditLog).filter(
        AuditLog.case_id == sub.subscription_id,
        AuditLog.action == SubscriptionEventType.MANDATE_OPT_OUT.value
    ).first()
    assert log is not None
    assert log.actor_type == "CUSTOMER"

    # Subsequent retry attempts must be strictly blocked
    blocked_retry = client.post(f"/api/subscriptions/{sub.subscription_id}/retry")
    assert blocked_retry.status_code == 400
    assert "opt-out" in blocked_retry.json()["detail"].lower()

def test_daily_llm_call_budget_fallback():
    """
    Verifies that when the daily LLM call quota is reached, AIAgentService gracefully
    falls back to the Deterministic Rules Engine and includes the fallback notice.
    """
    # Temporarily set call budget to 0 to simulate quota exhaustion
    ai_service.daily_calls_count = 100
    ai_service.current_day = datetime.date.today()

    context = {
        "case_id": "RV-BUDGET-TEST",
        "payment_id": "pay_budget_test",
        "customer_name": "Test Client",
        "customer_tier": "VIP",
        "amount": 4999.0,
        "payment_method": "card",
        "failure_category": "temporary_bank_failure",
        "failure_code": "504",
        "failure_reason": "Timeout",
        "successful_payments": 5,
        "failed_payments": 0,
        "retry_count": 0,
        "risk_score": 30.0
    }

    result = ai_service.analyze_root_cause(context)
    assert result is not None
    assert result.model_provider == "deterministic_rules_engine"
    assert "budget" in result.reasoning_summary.lower() or "deterministic" in result.reasoning_summary.lower()

def test_reset_demo_data_endpoint():
    """
    Verifies that POST /api/simulation/reset-demo successfully reseeds the sandbox database.
    """
    res = client.post("/api/simulation/reset-demo")
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "reset to baseline" in res.json()["message"]
