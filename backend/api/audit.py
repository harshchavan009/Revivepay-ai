from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import AuditLog, RecoveryCase, Payment, User
from backend.schemas.all_schemas import AuditLogResponse
from backend.services.auth_service import get_current_user_optional, enforce_tenant_ownership

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    case_id: Optional[str] = None,
    action: Optional[str] = None,
    actor: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = 0,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    
    if current_user and current_user.role != "ADMIN" and current_user.merchant_id:
        query = query.join(
            RecoveryCase, AuditLog.case_id == RecoveryCase.case_id, isouter=True
        ).join(
            Payment, RecoveryCase.payment_id == Payment.payment_id, isouter=True
        ).filter(Payment.merchant_id == current_user.merchant_id)

    if case_id:
        c = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id).first()
        if c:
            if current_user and current_user.role != "ADMIN" and current_user.merchant_id:
                case_merchant = c.payment.merchant_id if c.payment else None
                enforce_tenant_ownership(current_user, case_merchant, is_mutation=False)
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
def get_case_audit_logs(
    case_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    c = db.query(RecoveryCase).filter(RecoveryCase.case_id == case_id).first()
    if c:
        case_merchant = c.payment.merchant_id if c.payment else None
        enforce_tenant_ownership(current_user, case_merchant, is_mutation=False)
        target_id = c.case_id
    else:
        if current_user and current_user.role != "ADMIN" and current_user.merchant_id:
            raise HTTPException(status_code=404, detail="Recovery case not found")
        target_id = case_id
        
    return db.query(AuditLog).filter(AuditLog.case_id == target_id).order_by(AuditLog.timestamp.asc()).all()
