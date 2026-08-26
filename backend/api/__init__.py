from fastapi import APIRouter
from backend.api.auth import router as auth_router
from backend.api.dashboard import router as dashboard_router
from backend.api.payments import router as payments_router
from backend.api.recovery import router as recovery_router
from backend.api.agent import router as agent_router
from backend.api.policy import router as policy_router
from backend.api.subscriptions import router as subscriptions_router
from backend.api.checkout import router as checkout_router
from backend.api.webhooks import router as webhooks_router
from backend.api.audit import router as audit_router
from backend.api.simulation import router as simulation_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(payments_router)
api_router.include_router(recovery_router)
api_router.include_router(agent_router)
api_router.include_router(policy_router)
api_router.include_router(subscriptions_router)
api_router.include_router(checkout_router)
api_router.include_router(webhooks_router)
api_router.include_router(audit_router)
api_router.include_router(simulation_router)
