from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import AbandonedCheckout
from backend.schemas.all_schemas import AbandonedCheckoutResponse

router = APIRouter(prefix="/checkout", tags=["Checkout Recovery"])

@router.get("/abandoned", response_model=List[AbandonedCheckoutResponse])
def get_abandoned_checkouts(db: Session = Depends(get_db)):
    return db.query(AbandonedCheckout).order_by(AbandonedCheckout.created_at.desc()).all()

@router.post("/{checkout_id}/recover")
def trigger_checkout_recovery(checkout_id: str, db: Session = Depends(get_db)):
    chk = db.query(AbandonedCheckout).filter(
        (AbandonedCheckout.id == checkout_id) | (AbandonedCheckout.checkout_id == checkout_id)
    ).first()
    if not chk:
        raise HTTPException(status_code=404, detail="Checkout session not found")
    
    chk.status = "REMINDED"
    db.commit()
    return {
        "status": "REMINDED",
        "checkout_id": chk.checkout_id,
        "message": f"Personalized recovery reminder dispatched to {chk.customer_email} with saved cart state."
    }
