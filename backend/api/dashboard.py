from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import User
from backend.schemas.all_schemas import DashboardSummaryResponse
from backend.services.metrics_service import MetricsService
from backend.services.auth_service import get_current_user_optional

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_summary(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    merchant_id = current_user.merchant_id if current_user and current_user.role != "ADMIN" and current_user.merchant_id else None
    return MetricsService.get_dashboard_summary(db, merchant_id=merchant_id)

@router.get("/revenue-risk")
def get_revenue_risk(db: Session = Depends(get_db)):
    return MetricsService.get_revenue_risk_trend(db)

@router.get("/recovery-trend")
def get_recovery_trend(db: Session = Depends(get_db)):
    return MetricsService.get_revenue_risk_trend(db)

@router.get("/failure-reasons")
def get_failure_reasons(db: Session = Depends(get_db)):
    return MetricsService.get_failure_reasons(db)

@router.get("/funnel")
def get_recovery_funnel(db: Session = Depends(get_db)):
    return MetricsService.get_recovery_funnel(db)
