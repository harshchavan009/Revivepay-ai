import pytest
from backend.services.risk_engine import RevenueRiskEngine
from backend.services.policy_gateway import PolicyGateway
from backend.services.razorpay_service import RazorpayService
from backend.services.ai_agent import ai_service
from backend.models.all_models import RecoveryCase, Payment, Customer, PolicyConfig

def test_risk_scoring_calculation():
    score, level, breakdown = RevenueRiskEngine.calculate_risk(
        amount=4999.0,
        failure_category="temporary_bank_failure",
        total_payments=9,
        successful_payments=8,
        failed_payments=1,
        retry_count=0,
        customer_tier="RETURNING"
    )
    assert 0 <= score <= 100
    assert level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "weights" in breakdown
    assert breakdown["weights"]["value"] == 0.35
    assert breakdown["weights"]["recovery"] == 0.25

def test_policy_gateway_retry_limit():
    policy = PolicyConfig(
        max_auto_retries=2,
        max_auto_amount=10000.0,
        high_value_approval_threshold=50000.0,
        min_ai_confidence=0.85,
        allow_customer_contact=True,
        allowed_actions=["retry_payment", "create_payment_link"]
    )
    customer = Customer(
        customer_id="cust_test_1",
        merchant_id="m1",
        external_customer_id="ext_cust_1",
        name="Test Customer",
        email="test@example.com",
        consent_status=True
    )
    payment_exhausted = Payment(
        payment_id="pay_test_exhausted",
        merchant_id="m1",
        customer_id="cust_test_1",
        amount=2000.0,
        status="FAILED",
        failure_category="temporary_bank_failure",
        retry_count=2,
        max_retry_count=2
    )
    case = RecoveryCase(
        case_id="RV-TEST-01",
        payment_id="pay_test_exhausted",
        customer_id="cust_test_1",
        amount_at_risk=2000.0,
        failure_type="BANK_DECLINE"
    )

    status, checklist, reason = PolicyGateway.evaluate(
        case=case,
        payment=payment_exhausted,
        customer=customer,
        policy=policy,
        proposed_action="retry_payment",
        ai_confidence=0.90
    )
    assert status == "BLOCKED"
    assert "retries" in reason.lower()

def test_policy_gateway_permanent_failure_blocking():
    policy = PolicyConfig(
        max_auto_retries=2,
        max_auto_amount=10000.0,
        high_value_approval_threshold=50000.0,
        min_ai_confidence=0.85,
        allow_customer_contact=True,
        allowed_actions=["retry_payment", "create_payment_link", "request_payment_method_update"]
    )
    customer = Customer(
        customer_id="cust_test_2",
        merchant_id="m1",
        external_customer_id="ext_cust_2",
        name="Test Customer",
        email="test@example.com",
        consent_status=True
    )
    payment_expired = Payment(
        payment_id="pay_test_expired",
        merchant_id="m1",
        customer_id="cust_test_2",
        amount=1500.0,
        status="FAILED",
        failure_category="card_expired",
        retry_count=0,
        max_retry_count=2
    )
    case = RecoveryCase(
        case_id="RV-TEST-02",
        payment_id="pay_test_expired",
        customer_id="cust_test_2",
        amount_at_risk=1500.0,
        failure_type="CARD_EXPIRED"
    )

    status, checklist, reason = PolicyGateway.evaluate(
        case=case,
        payment=payment_expired,
        customer=customer,
        policy=policy,
        proposed_action="retry_payment",
        ai_confidence=0.92
    )
    assert status == "BLOCKED"
    assert "permanent" in reason.lower()

def test_ai_agent_deterministic_fallback():
    context = {
        "amount": 4999.0,
        "failure_category": "temporary_bank_failure",
        "successful_payments": 8,
        "failed_payments": 1,
        "retry_count": 0,
        "risk_score": 87.0
    }
    result = ai_service.analyze_root_cause(context)
    assert result.root_cause in ["temporary_bank_failure", "temporary_bank_switch_latency"]
    assert result.confidence >= 0.85
    assert len(result.evidence) >= 2
    assert result.recommended_action == "retry_payment"

def test_razorpay_webhook_signature():
    secret = "test_webhook_secret_123"
    raw_body = b'{"event":"payment.failed","payload":{"payment":{"entity":{"id":"pay_123"}}}}'
    import hmac, hashlib
    valid_sig = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    
    assert RazorpayService.verify_webhook_signature(raw_body, valid_sig, secret) is True
    assert RazorpayService.verify_webhook_signature(raw_body, "tampered_signature", secret) is False
