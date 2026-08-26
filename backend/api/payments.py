from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import Payment, Customer
from backend.schemas.all_schemas import PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentResponse])
def get_payments(
    status: Optional[str] = None,
    failure_category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Payment)
    if status and status != "ALL":
        query = query.filter(Payment.status == status)
    if failure_category and failure_category != "ALL":
        query = query.filter(Payment.failure_category == failure_category)
    if search:
        query = query.filter(
            (Payment.payment_id.ilike(f"%{search}%")) |
            (Payment.failure_code.ilike(f"%{search}%")) |
            (Payment.failure_reason.ilike(f"%{search}%"))
        )
    
    payments = query.order_by(Payment.created_at.desc()).offset(offset).limit(limit).all()
    
    results = []
    for p in payments:
        cust = db.query(Customer).filter(Customer.customer_id == p.customer_id).first()
        results.append({
            "payment_id": p.payment_id,
            "merchant_id": p.merchant_id,
            "customer_id": p.customer_id,
            "customer_name": cust.name if cust else "Enterprise Customer",
            "customer_email": cust.email if cust else "unknown@email.com",
            "provider": p.provider or "razorpay",
            "provider_payment_id": p.provider_payment_id,
            "order_id": p.order_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "payment_method": p.payment_method,
            "failure_code": p.failure_code,
            "failure_reason": p.failure_reason,
            "failure_category": p.failure_category,
            "retry_count": p.retry_count,
            "max_retry_count": p.max_retry_count or 2,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        })
    return results

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment_by_id(payment_id: str, db: Session = Depends(get_db)):
    p = db.query(Payment).filter(
        Payment.payment_id == payment_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    cust = db.query(Customer).filter(Customer.customer_id == p.customer_id).first()
    return {
        "payment_id": p.payment_id,
        "merchant_id": p.merchant_id,
        "customer_id": p.customer_id,
        "customer_name": cust.name if cust else "Enterprise Customer",
        "customer_email": cust.email if cust else "unknown@email.com",
        "provider": p.provider or "razorpay",
        "provider_payment_id": p.provider_payment_id,
        "order_id": p.order_id,
        "amount": p.amount,
        "currency": p.currency,
        "status": p.status,
        "payment_method": p.payment_method,
        "failure_code": p.failure_code,
        "failure_reason": p.failure_reason,
        "failure_category": p.failure_category,
        "retry_count": p.retry_count,
        "max_retry_count": p.max_retry_count or 2,
        "created_at": p.created_at,
        "updated_at": p.updated_at
    }
