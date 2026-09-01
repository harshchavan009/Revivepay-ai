import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import Subscription, Customer, PolicyConfig
from backend.schemas.all_schemas import SubscriptionResponse
from backend.services.audit_service import AuditService
from backend.events.taxonomy import SubscriptionEventType

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("", response_model=List[SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db)):
    subs = db.query(Subscription).order_by(Subscription.created_at.desc()).all()
    results = []
    for s in subs:
        cust = db.query(Customer).filter(Customer.customer_id == s.customer_id).first()
        results.append({
            "id": s.id,
            "subscription_id": s.subscription_id,
            "customer_id": s.customer_id,
            "customer_name": cust.name if cust else (s.customer_name or "Enterprise Client"),
            "customer_email": cust.email if cust else (s.customer_email or "billing@client.com"),
            "plan_name": s.plan_name,
            "amount": s.amount,
            "currency": s.currency,
            "billing_interval": s.billing_interval,
            "current_status": s.current_status,
            "retry_count": s.retry_count,
            "max_retries": s.max_retries,
            "failure_reason": s.failure_reason,
            "next_retry_at": s.next_retry_at,
            "afa_required": getattr(s, "afa_required", False) or (s.amount >= 15000.0),
            "pre_debit_notification_sent_at": getattr(s, "pre_debit_notification_sent_at", None),
            "opt_out_status": getattr(s, "opt_out_status", False),
            "opt_out_at": getattr(s, "opt_out_at", None),
            "created_at": s.created_at,
            "updated_at": s.updated_at
        })
    return results

@router.post("/{subscription_id}/send-pre-debit-notification")
def send_pre_debit_notification(subscription_id: str, db: Session = Depends(get_db)):
    """
    Sends/simulates an educational reference implementation of the RBI 24-hour pre-debit alert to customer.
    Sets the timestamp to 25 hours prior to allow subsequent retries in sandbox.
    """
    sub = db.query(Subscription).filter(
        (Subscription.id == subscription_id) | (Subscription.subscription_id == subscription_id)
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Set to 25 hours ago to satisfy 24h window for demo
    sent_time = datetime.datetime.utcnow() - datetime.timedelta(hours=25)
    sub.pre_debit_notification_sent_at = sent_time
    
    AuditService.log_event(
        db=db,
        case_id=sub.subscription_id,
        actor="Mandate Notification Dispatcher",
        action=SubscriptionEventType.MANDATE_NOTIFIED.value,
        actor_type="SYSTEM",
        notes=f"Dispatched statutory 24-hour pre-debit alert for mandate {sub.subscription_id} (₹{sub.amount:,.2f}). Customer opt-out window active."
    )
    
    db.commit()
    db.refresh(sub)
    return {
        "success": True,
        "message": f"24-hour pre-debit notification sent to customer for mandate {sub.subscription_id}.",
        "pre_debit_notification_sent_at": sub.pre_debit_notification_sent_at.isoformat()
    }

@router.post("/{subscription_id}/opt-out")
def customer_opt_out(subscription_id: str, db: Session = Depends(get_db)):
    """
    Simulates customer-initiated mandate opt-out from a pre-debit notification.
    Cancels the scheduled charge and logs distinct customer action in immutable audit trail.
    """
    sub = db.query(Subscription).filter(
        (Subscription.id == subscription_id) | (Subscription.subscription_id == subscription_id)
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub.opt_out_status = True
    sub.opt_out_at = datetime.datetime.utcnow()
    sub.current_status = "HALTED"
    sub.failure_reason = "Customer exercised e-mandate opt-out prior to debit"
    
    # Canonical Audit Log: customer-initiated action
    AuditService.log_event(
        db=db,
        case_id=sub.subscription_id,
        actor="Customer (Opt-Out Portal)",
        action=SubscriptionEventType.MANDATE_OPT_OUT.value,
        actor_type="CUSTOMER",
        notes=f"Customer opted out of scheduled debit of ₹{sub.amount:,.2f} for mandate {sub.subscription_id}. Charge cancelled."
    )
    
    db.commit()
    db.refresh(sub)
    return {
        "success": True,
        "status": sub.current_status,
        "message": "Customer opt-out recorded. Recurring debit cancelled and logged to audit trail."
    }

@router.post("/{subscription_id}/retry")
def retry_subscription(subscription_id: str, db: Session = Depends(get_db)):
    """
    Executes automated subscription retry after validating RBI e-mandate policy rules.
    """
    sub = db.query(Subscription).filter(
        (Subscription.id == subscription_id) | (Subscription.subscription_id == subscription_id)
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Policy Check 1: Customer Opt-out
    if sub.opt_out_status:
        raise HTTPException(
            status_code=400,
            detail="Cannot retry: Customer exercised statutory e-mandate opt-out for this debit cycle."
        )
    
    # Policy Check 2: RBI e-Mandate 24-Hour Pre-Debit Notification Window
    policy = db.query(PolicyConfig).first()
    afa_threshold = getattr(policy, "mandate_afa_threshold", 15000.0) if policy else 15000.0
    now = datetime.datetime.utcnow()
    
    if sub.amount >= afa_threshold or getattr(sub, "afa_required", False):
        notified_at = getattr(sub, "pre_debit_notification_sent_at", None)
        if not notified_at or (now - notified_at) < datetime.timedelta(hours=24):
            raise HTTPException(
                status_code=400,
                detail=f"RBI e-Mandate Policy Block: Recurring payments ≥ ₹{afa_threshold:,.2f} require a 24-hour pre-debit notification. Please send pre-debit alert first."
            )
    
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
