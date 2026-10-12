from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any, Optional
from backend.schemas.all_schemas import RootCauseAnalysisOutput, RecoveryDecisionOutput
from backend.services.ai_agent import ai_service
from backend.config import settings

router = APIRouter(prefix="/agent", tags=["AI Recovery Agent"])

@router.post("/analyze", response_model=RootCauseAnalysisOutput)
def analyze_payment_failure(context: Dict[str, Any] = Body(...), force_provider: Optional[str] = None):
    return ai_service.analyze_root_cause(context, force_provider=force_provider)

@router.post("/plan", response_model=RecoveryDecisionOutput)
def decide_recovery_plan(context: Dict[str, Any] = Body(...), force_provider: Optional[str] = None):
    return ai_service.decide_recovery_plan(context, force_provider=force_provider)

@router.get("/budget")
def get_ai_budget():
    """Returns current daily LLM call budget utilization & failover status."""
    return ai_service.get_budget_status()

@router.post("/budget/toggle-exhaustion")
def toggle_ai_budget_exhaustion():
    """Toggles daily LLM call budget between normal and exhausted (for reviewer demo)."""
    if settings.ENVIRONMENT.lower() == "production" and not settings.DEMO_MODE:
        raise HTTPException(
            status_code=403,
            detail="Simulated LLM budget exhaustion is disabled in production environment"
        )
    return ai_service.toggle_exhaust_budget()

@router.post("/force-fallback-test")
def force_gemini_fallback_test(context: Optional[Dict[str, Any]] = None):
    """Explicit test trigger simulating primary provider timeout and routing to Gemini 1.5 Pro."""
    if settings.ENVIRONMENT.lower() == "production" and not settings.DEMO_MODE:
        raise HTTPException(
            status_code=403,
            detail="Forced fallback testing is disabled in production environment"
        )
    test_ctx = context or {
        "case_id": "RV-FALLBACK-TEST",
        "payment_id": "pay_test_fallback",
        "customer_name": "Vikram Seth",
        "customer_tier": "VIP",
        "amount": 28500.0,
        "failure_category": "temporary_bank_failure",
        "failure_code": "GATEWAY_TIMEOUT_504",
        "failure_reason": "Issuer bank switch unresponsive after 3500ms",
        "successful_payments": 12,
        "failed_payments": 1,
        "retry_count": 0,
        "risk_score": 38.0
    }
    return ai_service.analyze_root_cause(test_ctx, force_provider="gemini")
