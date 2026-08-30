import uuid
import pytest
from backend.services.ai_agent import (
    AIAgentService, DeterministicFallbackAgent, ClaudeLLMProvider, GeminiLLMProvider
)
from backend.schemas.all_schemas import RootCauseAnalysisOutput, RecoveryDecisionOutput
from backend.database import SessionLocal
from backend.models.all_models import AgentDecision, RecoveryCase, Merchant, Customer, Payment
from backend.services.recovery_engine import RecoveryEngine

def test_deterministic_rules_engine_direct():
    """Test that DeterministicFallbackAgent generates contextual reasoning and raw logs."""
    agent = DeterministicFallbackAgent()
    context = {
        "case_id": "RV-TEST-001",
        "payment_id": "pay_test_123",
        "customer_name": "Rohan Sharma",
        "customer_tier": "ENTERPRISE",
        "amount": 14999.0,
        "payment_method": "card",
        "failure_category": "temporary_bank_failure",
        "failure_code": "BANK_DECLINE",
        "failure_reason": "Issuer bank switch timed out",
        "successful_payments": 5,
        "failed_payments": 1,
        "retry_count": 0,
        "risk_score": 25.0
    }

    result = agent.analyze_root_cause(context)
    assert isinstance(result, RootCauseAnalysisOutput)
    assert result.model_provider == "deterministic_rules_engine"
    assert result.model_name == "rules-engine-v2.1"
    assert result.confidence >= 0.8
    assert "Rohan Sharma" in str(result.evidence)
    assert "14,999.00" in str(result.reasoning_summary)
    assert result.raw_prompt is not None
    assert result.raw_response is not None
    assert result.recommended_action in ["retry_payment", "create_payment_link", "send_customer_notification", "escalate_to_merchant"]

def test_ai_agent_service_graceful_fallback():
    """Test that AIAgentService falls back safely to deterministic rules engine when LLM keys fail or are absent."""
    service = AIAgentService()
    # Force fake/failing credentials
    service.claude = ClaudeLLMProvider(api_key="fake_invalid_claude_key")
    service.gemini = GeminiLLMProvider(api_key="fake_invalid_gemini_key")

    context = {
        "case_id": "RV-FALLBACK-99",
        "customer_name": "Ananya Patel",
        "amount": 4999.0,
        "payment_method": "upi",
        "failure_category": "network_timeout",
        "failure_code": "GATEWAY_TIMEOUT",
        "failure_reason": "UPI switch timed out",
        "successful_payments": 2,
        "failed_payments": 0,
        "retry_count": 0,
        "risk_score": 15.0
    }

    result = service.analyze_root_cause(context)
    assert isinstance(result, RootCauseAnalysisOutput)
    assert result.model_provider == "deterministic_rules_engine"
    assert "Ananya Patel" in str(result.reasoning_summary)

def test_recovery_engine_persists_raw_ai_telemetry():
    """Test that RecoveryEngine saves raw prompt and raw response to AgentDecision entity."""
    db = SessionLocal()
    try:
        merchant = db.query(Merchant).first()
        if not merchant:
            merchant = Merchant(merchant_id="m_test", name="Test Merchant", industry="SaaS", currency="INR", timezone="Asia/Kolkata")
            db.add(merchant)
            db.commit()

        customer_uuid = uuid.uuid4().hex[:6]
        customer = Customer(
            customer_id=f"c_test_{customer_uuid}",
            external_customer_id=f"cust_test_{customer_uuid}",
            merchant_id=merchant.merchant_id,
            name="Deepika Padukone",
            email="deepika@enterprise.in",
            account_tier="ENTERPRISE",
            total_successful_payments=10,
            total_failed_payments=0
        )
        db.add(customer)
        db.commit()

        payment = Payment(
            payment_id=f"pay_test_{uuid.uuid4().hex[:6]}",
            merchant_id=merchant.merchant_id,
            customer_id=customer.customer_id,
            amount=2500.0,
            currency="INR",
            payment_method="upi",
            status="failed",
            failure_code="BANK_DECLINE",
            failure_reason="Issuer bank switch timed out",
            failure_category="temporary_bank_failure",
            source="RAZORPAY_TEST"
        )
        db.add(payment)
        db.commit()

        case = RecoveryEngine.process_payment_failure(db=db, payment=payment, customer=customer, merchant=merchant)
        assert case is not None

        # Verify AgentDecision has prompt_raw and response_raw
        decision = db.query(AgentDecision).filter(AgentDecision.case_id == case.case_id).first()
        assert decision is not None
        assert decision.prompt_raw is not None
        assert decision.response_raw is not None
        assert decision.reasoning_narrative is not None
        assert decision.model_provider in ["anthropic", "google", "deterministic_rules_engine"]
    finally:
        db.close()
