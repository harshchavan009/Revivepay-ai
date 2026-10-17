from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.all_models import PolicyConfig, Merchant, Organization, User
from backend.schemas.all_schemas import PolicyConfigResponse, PolicyConfigUpdate
from backend.services.auth_service import require_role, get_current_user_optional, enforce_tenant_ownership

router = APIRouter(prefix="/policy", tags=["Policy Engine"])

POLICY_ADMIN_ROLES = ["OWNER", "ADMIN", "MERCHANT_OWNER"]

@router.get("/config", response_model=PolicyConfigResponse)
def get_policy_config(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    tenant_id = (current_user.org_id or current_user.merchant_id) if current_user else None

    if tenant_id:
        policy = db.query(PolicyConfig).filter(
            (PolicyConfig.org_id == tenant_id) | (PolicyConfig.merchant_id == tenant_id)
        ).first()
    else:
        policy = db.query(PolicyConfig).first()

    if not policy:
        if tenant_id:
            policy = PolicyConfig(org_id=tenant_id, merchant_id=tenant_id)
        else:
            merchant = db.query(Merchant).first()
            if not merchant:
                merchant = Merchant(name="Apex Cloud Services", industry="Fintech & SaaS")
                db.add(merchant)
                db.commit()
                db.refresh(merchant)
            policy = PolicyConfig(org_id=merchant.merchant_id, merchant_id=merchant.merchant_id)
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy

@router.put("/config", response_model=PolicyConfigResponse)
def update_policy_config(
    config_in: PolicyConfigUpdate,
    current_user: User = Depends(require_role(POLICY_ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    tenant_id = current_user.org_id or current_user.merchant_id
    if current_user.role == "ADMIN" and not tenant_id:
        policy = db.query(PolicyConfig).first()
    else:
        policy = db.query(PolicyConfig).filter(
            (PolicyConfig.org_id == tenant_id) | (PolicyConfig.merchant_id == tenant_id)
        ).first()

    if not policy:
        policy = PolicyConfig(org_id=tenant_id, merchant_id=tenant_id)
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
    if config_in.mandate_afa_threshold is not None:
        policy.mandate_afa_threshold = config_in.mandate_afa_threshold
    if config_in.tat_auto_escalate is not None:
        policy.tat_auto_escalate = config_in.tat_auto_escalate
    if config_in.allowed_actions is not None:
        policy.allowed_actions = config_in.allowed_actions

    db.commit()
    db.refresh(policy)
    return policy
