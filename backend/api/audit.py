from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import AuditLog, RecoveryCase, Payment, User
from backend.schemas.all_schemas import AuditLogResponse
from backend.services.auth_service import get_current_user_optional, enforce_tenant_ownership
from backend.services.sanitizer import escape_sql_like

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    case_id: Optional[str] = Query(None, max_length=100),
    action: Optional[str] = Query(None, max_length=100),
    actor: Optional[str] = Query(None, max_length=100),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    
    if current_user and current_user.role != "ADMIN":
        user_tenant = current_user.org_id or current_user.merchant_id
        if user_tenant:
            query = query.filter(
                (AuditLog.org_id == user_tenant) |
                (AuditLog.recovery_case.has(RecoveryCase.org_id == user_tenant)) |
                (AuditLog.recovery_case.has(RecoveryCase.payment.has(Payment.merchant_id == user_tenant)))
            )

    if case_id:
        c = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id).first()
        if c:
            case_tenant = c.org_id or (c.payment.merchant_id if c.payment else None)
            enforce_tenant_ownership(current_user, case_tenant, is_mutation=False)
            query = query.filter(AuditLog.case_id == c.case_id)
        else:
            query = query.filter(AuditLog.case_id == case_id)
            
    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)
    if actor and actor != "ALL":
        actor_fmt = f"%{escape_sql_like(actor)}%"
        query = query.filter(AuditLog.actor.ilike(actor_fmt))

    return query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()

@router.get("/verify-chain")
def verify_audit_chain(db: Session = Depends(get_db)):
    from backend.services.audit_service import AuditService
    return AuditService.verify_chain(db)

@router.get("/{case_id}", response_model=List[AuditLogResponse])
def get_case_audit_logs(
    case_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    c = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Recovery case not found")
        
    case_tenant = c.org_id or (c.payment.merchant_id if c.payment else None)
    enforce_tenant_ownership(current_user, case_tenant, is_mutation=False)
    
    from backend.services.audit_service import AuditService
    return AuditService.get_logs_for_case(db, c.case_id)
