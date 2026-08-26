from fastapi import APIRouter, Body
from typing import Dict, Any
from backend.schemas.all_schemas import RootCauseAnalysisOutput, RecoveryDecisionOutput
from backend.services.ai_agent import ai_service

router = APIRouter(prefix="/agent", tags=["AI Recovery Agent"])

@router.post("/analyze", response_model=RootCauseAnalysisOutput)
def analyze_payment_failure(context: Dict[str, Any] = Body(...)):
    return ai_service.analyze_root_cause(context)

@router.post("/plan", response_model=RecoveryDecisionOutput)
def decide_recovery_plan(context: Dict[str, Any] = Body(...)):
    return ai_service.decide_recovery_plan(context)
