from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.all_schemas import SimulationTriggerRequest, SimulationResponse
from backend.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulation", tags=["Simulation Center"])

@router.get("/presets")
def get_simulation_presets():
    return [
        {
            "id": "bank_failure",
            "title": "Temporary Bank Network Glitch",
            "tagline": "Returning customer • ₹4,999 • Transient 504 Timeout",
            "description": "Simulates an established customer whose card charge fails due to an issuer bank switch timeout. AI detects temporary failure, policy passes, and single automated retry successfully recovers revenue.",
            "type": "happy_path",
            "default_amount": 4999.0
        },
        {
            "id": "invalid_card",
            "title": "Permanent Invalid / Expired Card",
            "tagline": "Standard customer • ₹2,499 • Card Token Void",
            "description": "Simulates a permanent card failure. Deterministic policy gateway safely blocks automated retry attempts and triggers a secure card update link.",
            "type": "policy_block",
            "default_amount": 2499.0
        },
        {
            "id": "high_value",
            "title": "High-Value Enterprise Transaction",
            "tagline": "Enterprise client • ₹85,000 • High-Value Tier",
            "description": "Simulates a failure exceeding the ₹50,000 merchant auto-threshold. Policy routes case to Human-in-the-Loop Approval Queue for operator authorization.",
            "type": "human_approval",
            "default_amount": 85000.0
        },
        {
            "id": "subscription_failure",
            "title": "Recurring Subscription Dunning",
            "tagline": "SaaS Pro Plan • ₹14,999 • Insufficient Funds",
            "description": "Simulates recurring subscription debit failure. System computes intelligent retry schedule and issues customer updater notice.",
            "type": "subscription",
            "default_amount": 14999.0
        },
        {
            "id": "checkout_abandonment",
            "title": "High-Intent Cart Drop",
            "tagline": "Developer Pro • ₹6,999 • Intent Score 91%",
            "description": "Simulates abandoned checkout with high purchase intent. Triggers personalized non-intrusive reminder with saved cart state.",
            "type": "checkout",
            "default_amount": 6999.0
        },
        {
            "id": "retry_exhaustion_escalation",
            "title": "Retry Exhaustion & Safe Escalation",
            "tagline": "Persistent decline • ₹6,200 • Max Retries Reached",
            "description": "Demonstrates safe failure handling. When retry limit (2/2) is reached, automated actions are blocked and case escalates to operator review.",
            "type": "escalation",
            "default_amount": 6200.0
        }
    ]

@router.post("/trigger", response_model=SimulationResponse)
def trigger_simulation(req: SimulationTriggerRequest, db: Session = Depends(get_db)):
    return SimulationService.trigger_scenario(
        db=db,
        scenario=req.scenario,
        custom_amount=req.amount,
        customer_type=req.customer_type or "returning",
        payment_method=req.payment_method or "card"
    )

@router.post("/reset-demo")
def reset_demo_dataset():
    """
    Resets the entire sandbox database back to pristine seeded state,
    re-generating all mock cases, payments, and immutable cryptographic ledger blocks.
    """
    from backend.seed_data import seed_database
    seed_database(force_reseed=True)
    return {
        "success": True,
        "message": "Demo sandbox dataset successfully reset to baseline state with verified genesis ledger.",
        "environment": "Razorpay Test Mode Sandbox"
    }
