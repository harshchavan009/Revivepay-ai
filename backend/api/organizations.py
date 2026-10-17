import logging
import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.models.all_models import Organization, User, PolicyConfig, PaymentEvent, RecoveryCase
from backend.schemas.all_schemas import (
    RazorpayConnectRequest, RazorpayConnectionStatusResponse,
    ModeToggleRequest, ModeToggleResponse, OrganizationResponse
)
from backend.services.auth_service import get_current_user, require_role, ADMIN_ROLES
from backend.services.crypto_service import CryptoService
from backend.services.audit_service import AuditService

logger = logging.getLogger("revivepay.organizations")
router = APIRouter(prefix="/organization", tags=["Organization Management"])

def _get_user_organization(current_user: User, db: Session) -> Organization:
    """Helper to retrieve user's organization with fallback provisioning."""
    org = None
    if current_user.org_id:
        org = db.query(Organization).filter(Organization.org_id == current_user.org_id).first()
    elif current_user.merchant_id:
        org = db.query(Organization).filter(Organization.org_id == current_user.merchant_id).first()
    
    if not org:
        # Fallback to first org or create dedicated org for the user
        org = db.query(Organization).first()
        if not org:
            org = Organization(
                org_id=f"org_{current_user.id or 'default'}",
                name="Primary Organization",
                slug="primary-org",
                is_test_mode=True
            )
            db.add(org)
            db.commit()
            db.refresh(org)
        current_user.org_id = org.org_id
        db.commit()
    return org

@router.get("/current", response_model=RazorpayConnectionStatusResponse)
def get_current_organization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the current organization's connection status.
    All secrets are cryptographically masked; keys are never exposed in plaintext.
    """
    org = _get_user_organization(current_user, db)
    base_url = "http://localhost:8000"
    webhook_url = f"{base_url}/api/v1/webhooks/razorpay/{org.org_id}"

    is_connected = bool(org.razorpay_key_id and org.razorpay_key_secret)
    key_masked = CryptoService.mask_secret(org.razorpay_key_id) if org.razorpay_key_id else None
    wh_masked = CryptoService.mask_secret(org.webhook_secret) if org.webhook_secret else None

    return {
        "is_connected": is_connected,
        "key_id_masked": key_masked,
        "has_key_secret": bool(org.razorpay_key_secret),
        "has_webhook_secret": bool(org.webhook_secret),
        "webhook_secret_masked": wh_masked,
        "webhook_url": webhook_url,
        "is_test_mode": org.is_test_mode,
        "org_id": org.org_id,
        "org_name": org.name
    }

@router.post("/razorpay/connect", response_model=RazorpayConnectionStatusResponse)
def connect_razorpay(
    payload: RazorpayConnectRequest,
    current_user: User = Depends(require_role(ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Connects organization to Razorpay API:
    - Encrypts key_secret and webhook_secret with AES-256-GCM authenticated cipher
    - Detects Test vs Live mode from key prefix (rzp_test_ vs rzp_live_)
    - Never returns raw secret back to client
    - Records tamper-evident audit event
    """
    org = _get_user_organization(current_user, db)

    # Validate key prefix
    clean_key_id = payload.key_id.strip()
    is_test_key = clean_key_id.startswith("rzp_test_")
    is_live_key = clean_key_id.startswith("rzp_live_")

    if not (is_test_key or is_live_key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay Key ID. Must start with 'rzp_test_' for Test Mode or 'rzp_live_' for Live Mode."
        )

    # AES-256-GCM authenticated encryption at rest
    encrypted_secret = CryptoService.encrypt(payload.key_secret.strip())
    encrypted_webhook = CryptoService.encrypt(payload.webhook_secret.strip()) if payload.webhook_secret else None

    before_state = {
        "is_connected": bool(org.razorpay_key_id),
        "is_test_mode": org.is_test_mode
    }

    org.razorpay_key_id = clean_key_id
    org.razorpay_key_secret = encrypted_secret
    if encrypted_webhook:
        org.webhook_secret = encrypted_webhook
    org.is_test_mode = is_test_key
    org.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(org)

    after_state = {
        "is_connected": True,
        "key_id_masked": CryptoService.mask_secret(clean_key_id),
        "is_test_mode": org.is_test_mode
    }

    AuditService.log_event(
        db=db,
        case_id=None,
        actor=f"{current_user.name} ({current_user.role})",
        action="organization.razorpay_connected",
        actor_type="OPERATOR",
        before_state=before_state,
        after_state=after_state,
        org_id=org.org_id,
        notes=f"Razorpay account connected in {'Test' if is_test_key else 'Live'} Mode with AES-256-GCM encrypted credentials."
    )

    base_url = "http://localhost:8000"
    webhook_url = f"{base_url}/api/v1/webhooks/razorpay/{org.org_id}"

    return {
        "is_connected": True,
        "key_id_masked": CryptoService.mask_secret(clean_key_id),
        "has_key_secret": True,
        "has_webhook_secret": bool(org.webhook_secret),
        "webhook_secret_masked": CryptoService.mask_secret(org.webhook_secret) if org.webhook_secret else None,
        "webhook_url": webhook_url,
        "is_test_mode": org.is_test_mode,
        "org_id": org.org_id,
        "org_name": org.name
    }

@router.post("/razorpay/disconnect")
def disconnect_razorpay(
    current_user: User = Depends(require_role(ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Disconnects Razorpay account and securely deletes stored encrypted credentials.
    """
    org = _get_user_organization(current_user, db)
    before_state = {
        "is_connected": bool(org.razorpay_key_id),
        "key_id_masked": CryptoService.mask_secret(org.razorpay_key_id)
    }

    org.razorpay_key_id = None
    org.razorpay_key_secret = None
    org.webhook_secret = None
    org.updated_at = datetime.datetime.utcnow()
    db.commit()

    AuditService.log_event(
        db=db,
        case_id=None,
        actor=f"{current_user.name} ({current_user.role})",
        action="organization.razorpay_disconnected",
        actor_type="OPERATOR",
        before_state=before_state,
        after_state={"is_connected": False},
        org_id=org.org_id,
        notes="Razorpay credentials disconnected and purged from tenant storage."
    )

    return {
        "status": "disconnected",
        "is_connected": False,
        "message": "Razorpay account successfully disconnected."
    }

@router.post("/mode/toggle", response_model=ModeToggleResponse)
def toggle_mode(
    payload: ModeToggleRequest,
    current_user: User = Depends(require_role(ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Toggles organization operating mode between Test Mode and Live Mode.
    Restricted to Organization OWNER and ADMIN.
    """
    org = _get_user_organization(current_user, db)
    before_mode = org.is_test_mode
    target_mode = payload.is_test_mode

    # Validation: If switching to Live Mode, require a live key (or prompt)
    if not target_mode and org.razorpay_key_id and org.razorpay_key_id.startswith("rzp_test_"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot switch to Live Mode while using a Razorpay Test Key ('rzp_test_...'). Please connect a valid Live Key ('rzp_live_...')."
        )

    org.is_test_mode = target_mode
    org.updated_at = datetime.datetime.utcnow()
    db.commit()

    AuditService.log_event(
        db=db,
        case_id=None,
        actor=f"{current_user.name} ({current_user.role})",
        action="organization.mode_toggled",
        actor_type="OPERATOR",
        before_state={"is_test_mode": before_mode},
        after_state={"is_test_mode": target_mode},
        org_id=org.org_id,
        notes=f"Tenant operating mode switched from {'Test' if before_mode else 'Live'} to {'Test' if target_mode else 'Live'} Mode."
    )

    mode_label = "TEST MODE" if target_mode else "LIVE MODE"
    banner_message = (
        "You are running in Razorpay Test Mode. All payment events, recovery simulations, and dunning notifications operate on sandbox data without debiting live customer accounts."
        if target_mode
        else "LIVE MODE ACTIVE: Production payment failure recovery is active. Automated retries and customer recovery links interact with real cardholders and live payment networks."
    )

    return {
        "is_test_mode": target_mode,
        "mode_label": mode_label,
        "banner_message": banner_message
    }

@router.get("/onboarding-status")
def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Provides real onboarding progress for new organizations:
    1. Connect Razorpay account
    2. Add webhook endpoint
    3. Configure policy limits
    4. Invite team members
    5. Ingest first test event
    """
    org = _get_user_organization(current_user, db)
    
    step_connect = bool(org.razorpay_key_id and org.razorpay_key_secret)
    step_webhook = bool(org.webhook_secret) or db.query(PaymentEvent).filter(PaymentEvent.org_id == org.org_id).count() > 0
    step_policy = db.query(PolicyConfig).filter(PolicyConfig.org_id == org.org_id).first() is not None
    step_team = db.query(User).filter(User.org_id == org.org_id).count() > 1
    step_event = db.query(RecoveryCase).filter(RecoveryCase.org_id == org.org_id).count() > 0

    steps = [
        {"id": "connect_razorpay", "title": "Connect Razorpay Account", "completed": step_connect, "description": "Provide your Razorpay API Key and Secret (AES-256 encrypted at rest)."},
        {"id": "setup_webhook", "title": "Configure Webhook Endpoint", "completed": step_webhook, "description": "Paste your RevivePay webhook URL into your Razorpay Dashboard."},
        {"id": "configure_policy", "title": "Set Policy Guardrails", "completed": step_policy, "description": "Establish auto-retry limits, high-value thresholds, and quiet hours."},
        {"id": "invite_team", "title": "Invite Team & Assign Roles", "completed": step_team, "description": "Collaborate with Revenue Operators and Admins with strict RBAC."},
        {"id": "first_event", "title": "Ingest First Payment Failure", "completed": step_event, "description": "Receive a live or test failed payment webhook to initiate autonomous recovery."}
    ]

    completed_count = sum(1 for s in steps if s["completed"])
    progress_percentage = int((completed_count / len(steps)) * 100)

    return {
        "org_id": org.org_id,
        "org_name": org.name,
        "is_test_mode": org.is_test_mode,
        "progress_percentage": progress_percentage,
        "completed_steps": completed_count,
        "total_steps": len(steps),
        "steps": steps
    }
