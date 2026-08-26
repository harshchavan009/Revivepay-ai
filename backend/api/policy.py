from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import PolicyConfig, Merchant
from backend.schemas.all_schemas import PolicyConfigResponse, PolicyConfigUpdate

router = APIRouter(prefix="/policy", tags=["Policy Engine"])

@router.get("/config", response_model=PolicyConfigResponse)
def get_policy_config(db: Session = Depends(get_db)):
    merchant = db.query(Merchant).first()
    if not merchant:
        merchant = Merchant(name="Apex Cloud Services", industry="Fintech & SaaS")
        db.add(merchant)
        db.commit()
        db.refresh(merchant)
        
    policy = db.query(PolicyConfig).filter(PolicyConfig.merchant_id == merchant.id).first()
    if not policy:
        policy = PolicyConfig(merchant_id=merchant.id)
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy

@router.put("/config", response_model=PolicyConfigResponse)
def update_policy_config(config_in: PolicyConfigUpdate, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).first()
    policy = db.query(PolicyConfig).filter(PolicyConfig.merchant_id == merchant.id).first()
    if not policy:
        policy = PolicyConfig(merchant_id=merchant.id)
        db.add(policy)
        db.commit()
        db.refresh(policy)

    if config_in.max_auto_retries is not None:
        policy.max_auto_retries = config_in.max_auto_retries
    if config_in.max_auto_amount is not None:
        policy.max_auto_amount = config_in.max_auto_amount
    if config_in.high_value_approval_threshold is not None:
        policy.high_value_approval_threshold = config_in.high_value_approval_threshold
    if config_in.min_ai_confidence is not None:
        policy.min_ai_confidence = config_in.min_ai_confidence
    if config_in.allow_customer_contact is not None:
        policy.allow_customer_contact = config_in.allow_customer_contact
    if config_in.recovery_time_window_hours is not None:
        policy.recovery_time_window_hours = config_in.recovery_time_window_hours
    if config_in.allowed_actions is not None:
        policy.allowed_actions = config_in.allowed_actions

    db.commit()
    db.refresh(policy)
    return policy
