from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.all_schemas import DashboardSummaryResponse
from backend.services.metrics_service import MetricsService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_summary(db: Session = Depends(get_db)):
    return MetricsService.get_dashboard_summary(db)

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
