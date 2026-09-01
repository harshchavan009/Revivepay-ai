import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models.all_models import AuditLog, RecoveryCase, Payment
from backend.events.taxonomy import RecoveryEventType
from backend.services.ai_agent import ai_service
from backend.services.simulation_service import SimulationService

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_simulation_policy_override_scenario(db_session):
    """
    B.1 Test: Asserts that Policy Override scenario creates a case where AI proposes retry (94% conf)
    but Deterministic Policy Gateway overrides to REVIEW_REQUIRED due to threshold limit,
    logging the distinct canonical audit event 'recovery.policy.overrode_ai_recommendation'.
    """
    res = client.post("/api/simulation/trigger", json={"scenario": "policy_override"})
    assert res.status_code == 200
    data = res.json()

    assert data["overrode_ai_recommendation"] is True
    assert data["ai_confidence"] >= 0.90
    assert data["policy_status"] == "REVIEW_REQUIRED"
    assert data["recovery_status"] == "AWAITING_APPROVAL"
    assert "₹10,000" in data["ai_override_reason"]

    # Verify audit log entry in database
    override_log = db_session.query(AuditLog).filter(
        AuditLog.case_id == data["case_id"],
        AuditLog.action == RecoveryEventType.POLICY_OVERRODE_AI.value
    ).first()
    assert override_log is not None
    assert override_log.actor_type == "GATEWAY"
    assert override_log.decision["rule_triggered"] == "MAX_AUTOMATED_AMOUNT_EXCEEDED"


def test_simulation_gemini_fallback_scenario(db_session):
    """
    B.2 Test: Asserts that Multi-Tier Fallback simulation records model_name as Gemini 1.5 Pro fallback.
    """
    res = client.post("/api/simulation/trigger", json={"scenario": "gemini_fallback"})
    assert res.status_code == 200
    data = res.json()

    assert "gemini-1.5-pro" in data["model_name"]
    assert "fallback" in data["model_name"]

    # Verify case record and agent decision has model_name
    case = db_session.query(RecoveryCase).filter(RecoveryCase.case_id == data["case_id"]).first()
    assert case is not None
    assert case.agent_decisions[0].model_provider == "google"
    assert "gemini-1.5-pro" in case.agent_decisions[0].model_name


def test_ai_agent_forced_gemini_fallback_direct():
    """
    B.2 Test: Asserts direct call with force_provider='gemini' returns reasoning attribution to Gemini.
    """
    context = {
        "case_id": "RV-UNIT-GEMINI",
        "payment_id": "pay_gemini_01",
        "customer_name": "Radhika Merchant",
        "customer_tier": "VIP",
        "amount": 25000.0,
        "failure_category": "temporary_bank_failure",
        "failure_code": "ISSUER_504",
        "successful_payments": 10,
        "failed_payments": 0,
        "retry_count": 0,
        "risk_score": 35.0
    }
    result = ai_service.analyze_root_cause(context, force_provider="gemini")
    assert result.model_provider == "google"
    assert "gemini-1.5-pro" in result.model_name
    assert len(result.evidence) >= 2


def test_ai_budget_status_and_exhaustion_toggle():
    """
    B.3 Test: Asserts AI budget endpoint returns call metrics and toggling triggers deterministic fallback mode.
    """
    # 1. Check budget status
    res = client.get("/api/agent/budget")
    assert res.status_code == 200
    data = res.json()
    assert "used" in data
    assert "total" in data
    assert "deterministic_fallback_active" in data

    # 2. Toggle exhaustion
    toggle_res = client.post("/api/agent/budget/toggle-exhaustion")
    assert toggle_res.status_code == 200
    toggle_data = toggle_res.json()
    assert toggle_data["is_exhausted"] is True
    assert toggle_data["deterministic_fallback_active"] is True

    # 3. Analyze failure while budget is exhausted -> Safe floor rules engine
    context = {
        "case_id": "RV-UNIT-BUDGET-EXHAUSTED",
        "amount": 4999.0,
        "failure_category": "temporary_bank_failure",
        "successful_payments": 5,
        "failed_payments": 1,
        "retry_count": 0,
        "risk_score": 45.0
    }
    fallback_res = ai_service.analyze_root_cause(context)
    assert "budget" in fallback_res.reasoning_summary.lower() or "deterministic" in fallback_res.reasoning_summary.lower()

    # 4. Restore budget
    restore_res = client.post("/api/agent/budget/toggle-exhaustion")
    assert restore_res.status_code == 200
    restore_data = restore_res.json()
    assert restore_data["deterministic_fallback_active"] is False
