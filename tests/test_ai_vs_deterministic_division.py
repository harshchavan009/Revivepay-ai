import pytest
import datetime
import uuid
from backend.database import SessionLocal
from backend.models.all_models import (
    Merchant, Customer, Payment, RecoveryCase, PolicyConfig, Subscription, AuditLog
)
from backend.services.ai_agent import AIAgentService, DeterministicFallbackAgent, ALLOWED_TOOLS
from backend.services.risk_engine import RevenueRiskEngine
from backend.services.policy_gateway import PolicyGateway
from backend.services.state_machine import RecoveryStateMachine
from backend.services.audit_service import AuditService
from backend.services.outcome_verification_service import OutcomeVerificationService
from backend.services.recovery_engine import RecoveryEngine

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

# =========================================================================
# SPHERE 1: AI RESPONSIBILITIES
# 1. Root-cause diagnosis
# 2. Reasoning
# 3. Recovery recommendation
# 4. Explanation
# 5. Customer-message generation
# =========================================================================

def test_ai_layer_generates_all_five_responsibilities():
    """
    Asserts that the AI Layer strictly and completely fulfills its 5 core responsibilities:
    1. Root-cause diagnosis (root_cause)
    2. Reasoning (reasoning_summary)
    3. Recovery recommendation (recommended_action in ALLOWED_TOOLS)
    4. Explanation (explanation)
    5. Customer-message generation (customer_message)
    """
    ai_service = AIAgentService()
    context = {
        "case_id": "RV-TEST-AI-001",
        "payment_id": "pay_test_001",
        "customer_name": "Rohan Sharma",
        "customer_tier": "VIP",
        "amount": 14999.0,
        "payment_method": "upi",
        "failure_category": "temporary_bank_failure",
        "failure_code": "BANK_SWITCH_LATENCY",
        "failure_reason": "National payment switch timeout during VPA validation",
        "successful_payments": 8,
        "failed_payments": 1,
        "retry_count": 0,
        "risk_score": 28.5
    }

    result = ai_service.analyze_root_cause(context)

    # 1. Root-cause diagnosis
    assert result.root_cause is not None
    assert len(result.root_cause) > 0
    assert result.root_cause in ["temporary_bank_switch_latency", "network_handshake_timeout", "pre_salary_liquidity_dip"]

    # 2. Reasoning
    assert result.reasoning_summary is not None
    assert "Rohan Sharma" in result.reasoning_summary or "14,999" in result.reasoning_summary

    # 3. Recovery recommendation
    assert result.recommended_action in ALLOWED_TOOLS

    # 4. Explanation (Operator Review)
    assert result.explanation is not None
    assert len(result.explanation) > 10
    assert "Rohan Sharma" in result.explanation or "switch" in result.explanation.lower()

    # 5. Customer-message generation
    assert result.customer_message is not None
    assert "Rohan Sharma" in result.customer_message or "payment" in result.customer_message.lower()
    assert "14,999" in result.customer_message or "held" in result.customer_message.lower() or "delay" in result.customer_message.lower()


def test_ai_customer_messages_tailored_by_failure_type():
    """
    Verifies that AI generates empathetic, tailored customer messages matching
    different payment failure modes (Card Expired vs. Balance Dip vs. Cart Drop).
    """
    agent = DeterministicFallbackAgent()

    # Case A: Card Token Expired
    ctx_expired = {
        "case_id": "RV-EXP-01",
        "customer_name": "Priya Patel",
        "customer_tier": "VIP",
        "amount": 2499.0,
        "payment_method": "card",
        "failure_category": "card_expired",
        "failure_code": "EXPIRED_CARD",
        "failure_reason": "Card token void",
        "successful_payments": 12,
        "failed_payments": 1,
        "retry_count": 0,
        "risk_score": 35.0
    }
    res_expired = agent.analyze_root_cause(ctx_expired)
    assert res_expired.recommended_action == "request_payment_method_update"
    assert "expired" in res_expired.customer_message.lower()
    assert "update" in res_expired.customer_message.lower()

    # Case B: Insufficient Funds on High Value
    ctx_balance = {
        "case_id": "RV-BAL-02",
        "customer_name": "Ananya Roy",
        "customer_tier": "STANDARD",
        "amount": 65000.0,
        "payment_method": "netbanking",
        "failure_category": "insufficient_funds",
        "failure_code": "51",
        "failure_reason": "Insufficient funds in account",
        "successful_payments": 2,
        "failed_payments": 1,
        "retry_count": 0,
        "risk_score": 60.0
    }
    res_balance = agent.analyze_root_cause(ctx_balance)
    assert res_balance.recommended_action == "create_payment_link"
    assert "upi" in res_balance.customer_message.lower() or "alternate" in res_balance.customer_message.lower()

    # Case C: Checkout Abandonment
    ctx_cart = {
        "case_id": "RV-CART-03",
        "customer_name": "Karan Kapoor",
        "customer_tier": "RETURNING",
        "amount": 3999.0,
        "payment_method": "upi",
        "failure_category": "checkout_abandonment",
        "failure_code": "USER_DROPPED",
        "failure_reason": "Session dropped before OTP input",
        "successful_payments": 4,
        "failed_payments": 0,
        "retry_count": 0,
        "risk_score": 20.0
    }
    res_cart = agent.analyze_root_cause(ctx_cart)
    assert res_cart.recommended_action == "trigger_checkout_reminder"
    assert "cart" in res_cart.customer_message.lower()


# =========================================================================
# SPHERE 2: DETERMINISTIC CODE RESPONSIBILITIES
# 1. Risk score (pure math)
# 2. Retry limits (max retries)
# 3. Amount limits (₹10k/₹50k threshold)
# 4. Consent (DPDP compliance)
# 5. Permissions (RBAC)
# 6. Allowed actions (whitelists)
# 7. Approval rules (policy gate)
# 8. State transitions (FSM)
# 9. Audit (tamper-evident hash chain)
# 10. Outcome verification (bank confirmation)
# =========================================================================

def test_deterministic_risk_score_is_pure_mathematics():
    """
    Validates that the Risk Score is calculated deterministically via mathematical weights,
    not by stochastic LLM generation. Repeated runs produce identical float scores.
    """
    score1, level1, factors1 = RevenueRiskEngine.calculate_risk(
        amount=25000.0,
        failure_category="temporary_bank_failure",
        total_payments=12,
        successful_payments=10,
        failed_payments=2,
        retry_count=1,
        customer_tier="VIP"
    )
    score2, level2, factors2 = RevenueRiskEngine.calculate_risk(
        amount=25000.0,
        failure_category="temporary_bank_failure",
        total_payments=12,
        successful_payments=10,
        failed_payments=2,
        retry_count=1,
        customer_tier="VIP"
    )

    assert score1 == score2
    assert level1 == level2
    assert factors1 == factors2
    assert isinstance(score1, float)
    assert 0.0 <= score1 <= 100.0


def test_deterministic_retry_limits_override_ai(db):
    """
    Validates that when retry_count >= max_retries, deterministic PolicyGateway
    BLOCKS the retry, even if the AI recommends 'retry_payment' with 99% confidence.
    """
    policy = db.query(PolicyConfig).first()
    if not policy:
        policy = PolicyConfig(
            merchant_id="merch_test",
            max_auto_retries=2,
            max_auto_amount=10000.0,
            high_value_approval_threshold=50000.0,
            min_ai_confidence=0.80,
            allow_customer_contact=True,
            allowed_actions=["retry_payment", "create_payment_link"]
        )
        db.add(policy)
        db.commit()

    payment = Payment(
        payment_id="pay_retry_limit_test",
        merchant_id="merch_test",
        customer_id="cust_test",
        amount=1500.0,
        status="FAILED",
        failure_category="temporary_bank_failure",
        retry_count=2  # Limit reached!
    )
    case = RecoveryCase(
        case_id="RV-RETRY-LIMIT-TEST",
        payment_id="pay_retry_limit_test",
        amount_at_risk=1500.0,
        recovery_status="ANALYZING"
    )
    customer = Customer(
        customer_id="cust_test",
        merchant_id="merch_test",
        external_customer_id="ext_test",
        name="Test Customer",
        email="test@enterprise.com",
        consent_status=True
    )

    # AI recommends retry_payment with 0.99 confidence
    status, checklist, reason = PolicyGateway.evaluate(
        case=case,
        payment=payment,
        customer=customer,
        policy=policy,
        proposed_action="retry_payment",
        ai_confidence=0.99
    )

    assert status == "BLOCKED"
    assert any("max limit" in item["details"].lower() or "exhausted" in item["details"].lower() for item in checklist)
    assert "retries exhausted" in reason.lower()


def test_deterministic_amount_limits_override_ai(db):
    """
    Validates that when amount > max_auto_amount (₹10,000), deterministic PolicyGateway
    marks status as REVIEW_REQUIRED, preventing autonomous execution even if AI confidence is 99%.
    """
    policy = PolicyConfig(
        merchant_id="merch_amt_test",
        max_auto_retries=2,
        max_auto_amount=10000.0,
        high_value_approval_threshold=50000.0,
        min_ai_confidence=0.80,
        allow_customer_contact=True,
        allowed_actions=["retry_payment", "create_payment_link"]
    )
    payment = Payment(
        payment_id="pay_amt_test",
        merchant_id="merch_amt_test",
        customer_id="cust_amt_test",
        amount=25000.0,  # Exceeds ₹10,000!
        status="FAILED",
        failure_category="temporary_bank_failure",
        retry_count=0
    )
    case = RecoveryCase(
        case_id="RV-AMT-TEST",
        payment_id="pay_amt_test",
        amount_at_risk=25000.0,
        recovery_status="ANALYZING"
    )
    customer = Customer(
        customer_id="cust_amt_test",
        merchant_id="merch_amt_test",
        external_customer_id="ext_amt_test",
        name="Enterprise Client",
        email="client@enterprise.com",
        consent_status=True
    )

    status, checklist, reason = PolicyGateway.evaluate(
        case=case,
        payment=payment,
        customer=customer,
        policy=policy,
        proposed_action="retry_payment",
        ai_confidence=0.98
    )

    assert status == "REVIEW_REQUIRED"
    assert any("exceeds auto limit" in item["details"].lower() for item in checklist)


def test_deterministic_consent_blocks_ai_outreach(db):
    """
    Validates that if customer consent_status is False (RBI DPDP compliance),
    PolicyGateway BLOCKS any AI-proposed customer notification or payment link.
    """
    policy = PolicyConfig(
        merchant_id="merch_consent_test",
        max_auto_retries=2,
        max_auto_amount=10000.0,
        high_value_approval_threshold=50000.0,
        min_ai_confidence=0.80,
        allow_customer_contact=True,
        allowed_actions=["send_customer_notification", "create_payment_link"]
    )
    payment = Payment(
        payment_id="pay_consent_test",
        merchant_id="merch_consent_test",
        customer_id="cust_opt_out",
        amount=4500.0,
        status="FAILED",
        failure_category="insufficient_funds",
        retry_count=0
    )
    case = RecoveryCase(
        case_id="RV-CONSENT-TEST",
        payment_id="pay_consent_test",
        amount_at_risk=4500.0,
        recovery_status="ANALYZING"
    )
    customer = Customer(
        customer_id="cust_opt_out",
        merchant_id="merch_consent_test",
        external_customer_id="ext_opt_out",
        name="Opted Out User",
        email="optout@test.com",
        consent_status=False  # Consent Withheld!
    )

    status, checklist, reason = PolicyGateway.evaluate(
        case=case,
        payment=payment,
        customer=customer,
        policy=policy,
        proposed_action="create_payment_link",
        ai_confidence=0.95
    )

    assert status == "BLOCKED"
    assert "consent" in reason.lower()


def test_deterministic_state_transitions_and_outcome_verification(db):
    """
    Validates that the AI cannot declare a case RECOVERED.
    Only the deterministic OutcomeVerificationService inspecting real payment capture
    can verify and move the state machine to RECOVERED.
    """
    suffix = uuid.uuid4().hex[:6]
    cust = Customer(
        customer_id=f"cust_outcome_{suffix}",
        merchant_id=f"merch_outcome_{suffix}",
        external_customer_id=f"ext_outcome_{suffix}",
        name="Outcome Test User",
        email=f"outcome_{suffix}@test.com",
        consent_status=True
    )
    db.add(cust)
    db.commit()

    case = RecoveryCase(
        case_id=f"RV-OUTCOME-{suffix}",
        payment_id=f"pay_outcome_{suffix}",
        customer_id=f"cust_outcome_{suffix}",
        amount_at_risk=8900.0,
        recovery_status="NEW"
    )
    db.add(case)
    db.commit()

    # Step 1: Follow canonical FSM transitions
    RecoveryStateMachine.transition(db=db, case=case, to_state="ANALYZING", actor="System")
    RecoveryStateMachine.transition(db=db, case=case, to_state="ACTION_RECOMMENDED", actor="RevivePay AI")
    RecoveryStateMachine.transition(db=db, case=case, to_state="AUTO_APPROVED", actor="Policy Gateway")
    RecoveryStateMachine.transition(db=db, case=case, to_state="EXECUTING", actor="Execution Engine")
    RecoveryStateMachine.transition(db=db, case=case, to_state="VERIFYING", actor="Execution Engine")

    # Step 2: In VERIFYING, case is not recovered until bank capture verified
    assert case.recovery_status == "VERIFYING"
    assert case.outcome_verified is False
    assert case.recovered_amount == 0.0

    # Step 3: Direct gateway verification via OutcomeVerificationService
    provider_result = {
        "status": "CAPTURED",
        "recovered_amount": 8900.0,
        "payment_id": "pay_outcome_test"
    }
    outcome = OutcomeVerificationService.verify_recovery_outcome(
        db=db,
        case=case,
        provider_result=provider_result
    )

    assert outcome["verified"] is True
    assert case.outcome_verified is True
    assert case.recovered_amount == 8900.0
    assert case.recovery_status == "RECOVERED"
    assert case.recovery_status == "RECOVERED"
