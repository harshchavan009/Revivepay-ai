from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import AuditLog, RecoveryCase
from backend.schemas.all_schemas import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    case_id: Optional[str] = None,
    action: Optional[str] = None,
    actor: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if case_id:
        c = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id).first()
        if c:
            query = query.filter(AuditLog.case_id == c.case_id)
        else:
            query = query.filter(AuditLog.case_id == case_id)
            
    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)
    if actor and actor != "ALL":
        query = query.filter(AuditLog.actor.ilike(f"%{actor}%"))

    return query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()

@router.get("/verify-chain")
def verify_audit_chain(db: Session = Depends(get_db)):
    from backend.services.audit_service import AuditService
    return AuditService.verify_chain(db)

@router.get("/{case_id}", response_model=List[AuditLogResponse])
def get_case_audit_logs(case_id: str, db: Session = Depends(get_db)):
    c = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id).first()
    target_id = c.case_id if c else case_id
    return db.query(AuditLog).filter(AuditLog.case_id == target_id).order_by(AuditLog.timestamp.asc()).all()
