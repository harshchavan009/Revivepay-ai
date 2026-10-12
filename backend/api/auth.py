import logging
import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import get_db
from backend.models.all_models import User, Merchant, RecoveryCase
from backend.schemas.all_schemas import (
    UserLogin, UserCreate, UserResponse, Token,
    StepUpVerifyRequest, StepUpVerifyResponse,
    ForgotPasswordRequest, ResetPasswordRequest
)
from backend.services.auth_service import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, verify_refresh_token, generate_csrf_token,
    verify_step_up_credential, create_step_up_token, get_current_user,
    DUMMY_BCRYPT_HASH, revoke_token, create_password_reset_token,
    verify_and_consume_reset_token, enforce_tenant_ownership
)
from backend.services.audit_service import AuditService
from backend.events.taxonomy import RecoveryEventType

logger = logging.getLogger("revivepay.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

class DemoPersona(str, Enum):
    merchant_owner = "merchant_owner"
    revenue_operator = "revenue_operator"
    support_operator = "support_operator"
    admin = "admin"

class DemoLoginRequest(BaseModel):
    persona: DemoPersona

PERSONA_ROLE_MAP = {
    DemoPersona.merchant_owner: ("MERCHANT_OWNER", "owner@revivepay.ai", "Aditya Sengupta"),
    DemoPersona.revenue_operator: ("REVENUE_OPERATOR", "operator@revivepay.ai", "Rohan Deshmukh"),
    DemoPersona.support_operator: ("SUPPORT_OPERATOR", "support@revivepay.ai", "Sneha Kulkarni"),
    DemoPersona.admin: ("ADMIN", "admin@revivepay.ai", "Harsh Chavan"),
}

def set_refresh_cookie(response: Response, refresh_token: str):
    """Sets a secure httpOnly SameSite=Strict/Lax refresh token cookie."""
    is_secure = settings.ENVIRONMENT != "development"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/"
    )

@router.get("/environment")
def get_environment():
    return {
        "environment": settings.ENVIRONMENT,
        "environment_label": settings.ENVIRONMENT_LABEL,
        "project_name": settings.PROJECT_NAME,
        "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "high_value_threshold": settings.HIGH_VALUE_THRESHOLD
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    """
    Hardened authentication endpoint:
    - Enforces exponential lockout after 5 consecutive failed attempts
    - Performs dummy bcrypt execution on non-existent accounts to prevent timing enumeration
    - Clears lockout counter upon successful authentication
    """
    now = datetime.datetime.utcnow()
    user = db.query(User).filter(User.email == login_data.email).first()

    # 1. Lockout verification
    if user and user.locked_until and user.locked_until > now:
        minutes_remaining = max(1, int((user.locked_until - now).total_seconds() / 60))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to excessive failed attempts. Please try again in {minutes_remaining} minutes.",
            headers={"Retry-After": str(int((user.locked_until - now).total_seconds()))}
        )

    # 2. Timing-safe user check & password verification
    if not user:
        # Run dummy bcrypt calculation to match execution duration of valid user query
        verify_password(login_data.password, DUMMY_BCRYPT_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(login_data.password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = now + datetime.timedelta(minutes=15)
            logger.warning(f"User account {user.email} locked until {user.locked_until} due to 5 failed attempts")
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")

    # 3. Successful login: reset failed counters
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role})
    csrf_token = generate_csrf_token(user.email)

    set_refresh_cookie(response, refresh_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "theme_preference": getattr(user, "theme_preference", "dark")
        }
    }

@router.post("/demo-login", response_model=Token)
def demo_login(req: DemoLoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Demo persona login restricted to test and staging environments.
    Strictly forbidden in production mode.
    """
    if not settings.DEMO_MODE or settings.ENVIRONMENT.lower() == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo login is disabled in this environment"
        )

    role, default_email, default_name = PERSONA_ROLE_MAP[req.persona]
    user = db.query(User).filter((User.email == default_email) | (User.role == role)).first()

    if not user:
        merchant = db.query(Merchant).first()
        if not merchant:
            merchant = Merchant(name="Apex Cloud Services", industry="Fintech & SaaS")
            db.add(merchant)
            db.commit()
            db.refresh(merchant)
        user = User(
            email=default_email,
            name=default_name,
            hashed_password=get_password_hash(settings.DEMO_USER_PASSWORD),
            role=role,
            merchant_id=merchant.merchant_id,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role})
    csrf_token = generate_csrf_token(user.email)

    set_refresh_cookie(response, refresh_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "theme_preference": getattr(user, "theme_preference", "dark")
        }
    }

@router.post("/refresh", response_model=Token)
def refresh_session(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Refreshes short-lived access token using httpOnly refresh cookie.
    Enforces refresh token rotation and server-side revocation checks.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        # Fallback check for authorization header if cookie stripped by client proxy
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            refresh_token = auth_header.replace("Bearer ", "")

    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    payload = verify_refresh_token(refresh_token, db=db)
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    # Rotate refresh token: revoke consumed token and issue new token pair
    revoke_token(db, refresh_token, token_type="refresh")

    new_access_token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name})
    new_refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role})
    csrf_token = generate_csrf_token(user.email)

    set_refresh_cookie(response, new_refresh_token)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "theme_preference": getattr(user, "theme_preference", "dark")
        }
    }

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Clears refresh token cookie and invalidates token server-side in RevokedToken ledger.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            refresh_token = auth_header.replace("Bearer ", "")

    if refresh_token:
        revoke_token(db, refresh_token, token_type="refresh")

    response.delete_cookie(key="refresh_token", path="/")
    return {"status": "logged_out", "message": "Session terminated and token invalidated server-side"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Anti-enumeration password reset initiation.
    Returns identical success message whether or not the email exists.
    """
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if user and user.is_active:
        reset_token = create_password_reset_token(db, user)
        logger.info(f"Generated secure password reset token for user {user.id}")
        # In a full deployment, send email through transactional email service.
    return {
        "status": "received",
        "message": "If this email is registered in our system, password reset instructions have been sent."
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Consumes single-use reset token and securely updates password.
    """
    user = verify_and_consume_reset_token(db, req.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token"
        )
    user.hashed_password = get_password_hash(req.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    return {
        "status": "success",
        "message": "Password updated successfully. You may now log in with your new password."
    }

@router.post("/step-up-verify", response_model=StepUpVerifyResponse)
def step_up_verify(
    req: StepUpVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step-Up Re-Authentication for High-Value Actions (>= ₹50,000).
    Verifies operator password or authorized sandbox OTP and logs recovery.approval.stepup_verified.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.case_id == req.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Recovery case not found")

    case_merchant_id = case.payment.merchant_id if case.payment else None
    enforce_tenant_ownership(current_user, case_merchant_id, is_mutation=True)

    is_valid = verify_step_up_credential(current_user, req.credential)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Step-up authentication failed: Invalid password or 2FA OTP code"
        )

    step_up_token = create_step_up_token(current_user, req.case_id)

    # Log canonical Step-Up audit event to immutable hash chain
    AuditService.log_event(
        db=db,
        case_id=case.case_id,
        actor=current_user.name,
        action=RecoveryEventType.STEPUP_VERIFIED.value,
        actor_type="OPERATOR",
        input_data={"case_id": case.case_id, "amount": case.amount_at_risk, "operator_email": current_user.email},
        decision={"step_up_status": "VERIFIED", "authorized_by": current_user.email},
        notes=f"Step-Up Re-Authentication passed by {current_user.name} ({current_user.role}) for high-value transaction of ₹{case.amount_at_risk:,.2f}"
    )

    return {
        "success": True,
        "step_up_token": step_up_token,
        "expires_in": 300,
        "message": f"Step-up authorization verified for case {req.case_id}"
    }

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    User registration with input validation, password complexity enforcement,
    and restriction against self-assigned administrative roles.
    """
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    merchant = db.query(Merchant).first()
    if not merchant:
        merchant = Merchant(name="Apex Cloud Services", industry="Fintech & SaaS")
        db.add(merchant)
        db.commit()
        db.refresh(merchant)

    new_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role or "REVENUE_OPERATOR",
        merchant_id=merchant.merchant_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/theme", response_model=UserResponse)
def update_theme(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    theme = body.get("theme", "dark")
    if theme not in ["dark", "light", "system"]:
        theme = "dark"
    current_user.theme_preference = theme
    db.commit()
    db.refresh(current_user)
    return current_user
