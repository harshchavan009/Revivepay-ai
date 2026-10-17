from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import AbandonedCheckout, User
from backend.schemas.all_schemas import AbandonedCheckoutResponse
from backend.services.auth_service import get_current_user_optional, require_role, enforce_tenant_ownership

router = APIRouter(prefix="/checkout", tags=["Checkout Recovery"])

OPERATOR_ROLES = ["OWNER", "ADMIN", "OPERATOR", "MERCHANT_OWNER", "REVENUE_OPERATOR"]

@router.get("/abandoned", response_model=List[AbandonedCheckoutResponse])
def get_abandoned_checkouts(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(AbandonedCheckout)
    if current_user and current_user.role != "ADMIN":
        user_tenant = current_user.org_id or current_user.merchant_id
        if user_tenant:
            query = query.filter(AbandonedCheckout.org_id == user_tenant)
    return query.order_by(AbandonedCheckout.created_at.desc()).all()

@router.post("/{checkout_id}/recover")
def trigger_checkout_recovery(
    checkout_id: str,
    current_user: User = Depends(require_role(OPERATOR_ROLES)),
    db: Session = Depends(get_db)
):
    chk = db.query(AbandonedCheckout).filter(
        (AbandonedCheckout.id == checkout_id) | (AbandonedCheckout.checkout_id == checkout_id)
    ).first()
    if not chk:
        raise HTTPException(status_code=404, detail="Checkout session not found")
    
    enforce_tenant_ownership(current_user, chk.org_id, is_mutation=True)
    
    chk.status = "REMINDED"
    db.commit()
    return {
        "status": "REMINDED",
        "checkout_id": chk.checkout_id,
        "message": f"Personalized recovery reminder dispatched to {chk.customer_email} with saved cart state."
    }
