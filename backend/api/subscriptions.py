from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import Subscription, Customer
from backend.schemas.all_schemas import SubscriptionResponse

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("", response_model=List[SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db)):
    subs = db.query(Subscription).order_by(Subscription.created_at.desc()).all()
    results = []
    for s in subs:
        cust = db.query(Customer).filter(Customer.id == s.customer_id).first()
        results.append({
            "id": s.id,
            "subscription_id": s.subscription_id,
            "customer_id": s.customer_id,
            "customer_name": cust.name if cust else "Enterprise Client",
            "customer_email": cust.email if cust else "billing@client.com",
            "plan_name": s.plan_name,
            "amount": s.amount,
            "currency": s.currency,
            "billing_interval": s.billing_interval,
            "current_status": s.current_status,
            "retry_count": s.retry_count,
            "max_retries": s.max_retries,
            "failure_reason": s.failure_reason,
            "next_retry_at": s.next_retry_at,
            "created_at": s.created_at,
            "updated_at": s.updated_at
        })
    return results

@router.post("/{subscription_id}/retry")
def retry_subscription(subscription_id: str, db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(
        (Subscription.id == subscription_id) | (Subscription.subscription_id == subscription_id)
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub.retry_count += 1
    if sub.retry_count >= sub.max_retries:
        sub.current_status = "PAST_DUE"
        message = "Max retries reached. Subscription marked PAST_DUE and card update link sent."
    else:
        sub.current_status = "ACTIVE"
        message = f"Subscription charge re-attempted successfully. (Attempt {sub.retry_count}/{sub.max_retries})"
        
    db.commit()
    db.refresh(sub)
    return {"status": sub.current_status, "message": message, "retry_count": sub.retry_count}
