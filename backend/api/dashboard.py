from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import User
from backend.schemas.all_schemas import DashboardSummaryResponse
from backend.services.metrics_service import MetricsService
from backend.services.auth_service import get_current_user_optional

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_tenant_id(current_user: Optional[User]) -> Optional[str]:
    if not current_user or current_user.role == "ADMIN":
        return None
    return current_user.org_id or current_user.merchant_id

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_summary(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    tenant_id = get_tenant_id(current_user)
    return MetricsService.get_dashboard_summary(db, merchant_id=tenant_id)

@router.get("/revenue-risk")
def get_revenue_risk(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    tenant_id = get_tenant_id(current_user)
    return MetricsService.get_revenue_risk_trend(db, merchant_id=tenant_id)

@router.get("/recovery-trend")
def get_recovery_trend(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    tenant_id = get_tenant_id(current_user)
    return MetricsService.get_revenue_risk_trend(db, merchant_id=tenant_id)

@router.get("/failure-reasons")
def get_failure_reasons(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    tenant_id = get_tenant_id(current_user)
    return MetricsService.get_failure_reasons(db, merchant_id=tenant_id)

@router.get("/funnel")
def get_recovery_funnel(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    tenant_id = get_tenant_id(current_user)
    return MetricsService.get_recovery_funnel(db, merchant_id=tenant_id)
