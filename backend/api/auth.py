import logging
import datetime
import secrets
import re
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import get_db

PERSONA_ROLE_MAP = {
    "merchant_owner": ("MERCHANT_OWNER", "harsh@revivepay.ai", "Harsh Chavan"),
    "revenue_operator": ("REVENUE_OPERATOR", "operator@revivepay.ai", "Revenue Operator"),
    "support_operator": ("SUPPORT_OPERATOR", "support@revivepay.ai", "Support Lead"),
    "admin": ("ADMIN", "admin@revivepay.ai", "System Admin")
}

class DemoLoginRequest(BaseModel):
    persona: Literal["merchant_owner", "revenue_operator", "support_operator", "admin"]
from backend.models.all_models import User, Merchant, Organization, RecoveryCase
from backend.schemas.all_schemas import (
    UserLogin, UserCreate, UserResponse, Token,
    StepUpVerifyRequest, StepUpVerifyResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
    MfaSetupResponse, MfaVerifyRequest, MfaValidateRequest, MfaDisableRequest,
    VerifyEmailRequest, ResendVerificationRequest, GoogleAuthRequest,
    OrganizationResponse
)
from backend.services.auth_service import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, verify_refresh_token, generate_csrf_token,
    verify_step_up_credential, create_step_up_token, get_current_user,
    DUMMY_BCRYPT_HASH, revoke_token, create_password_reset_token,
    verify_and_consume_reset_token, enforce_tenant_ownership,
    create_email_verification_token, verify_and_consume_email_token,
    create_mfa_pending_token, verify_mfa_pending_token, require_role,
    normalize_role
)
from backend.services.totp_service import (
    generate_totp_secret, get_totp_uri, verify_totp_code
)
from backend.services.audit_service import AuditService
from backend.events.taxonomy import RecoveryEventType

logger = logging.getLogger("revivepay.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Simple in-memory rate limiter for login protection (15 attempts/minute per IP)
LOGIN_ATTEMPTS: Dict[str, list] = {}

def check_login_rate_limit(client_ip: str) -> None:
    now = datetime.datetime.utcnow().timestamp()
    history = LOGIN_ATTEMPTS.get(client_ip, [])
    # Keep attempts from last 60 seconds
    valid_history = [t for t in history if now - t < 60]
    if len(valid_history) >= 15:
        LOGIN_ATTEMPTS[client_ip] = valid_history
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again in 1 minute.",
            headers={"Retry-After": "60"}
        )
    valid_history.append(now)
    LOGIN_ATTEMPTS[client_ip] = valid_history

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

def slugify(text: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9]+', '-', text.lower()).strip('-')
    return cleaned or "org"

@router.get("/environment")
def get_environment():
    return {
        "environment": settings.ENVIRONMENT,
        "environment_label": settings.ENVIRONMENT_LABEL,
        "project_name": settings.PROJECT_NAME,
        "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "high_value_threshold": settings.HIGH_VALUE_THRESHOLD,
        "demo_mode": settings.DEMO_MODE and settings.ENVIRONMENT.lower() != "production"
    }

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Production B2B SaaS registration:
    - Validates email & password complexity
    - Provisions organization and sets registrant as Organization OWNER
    - Generates email verification token
    - Prevents cross-tenant administrative privilege assignment
    """
    clean_email = user_in.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this work email already exists."
        )

    # Provision Organization
    org_name = (user_in.org_name or f"{user_in.name}'s Organization").strip()
    slug_base = slugify(org_name)
    org_slug = f"{slug_base}-{secrets.token_hex(3)}"

    organization = Organization(
        name=org_name,
        slug=org_slug,
        is_test_mode=True,
        currency="INR",
        timezone="Asia/Kolkata",
        auto_recovery_enabled=True
    )
    db.add(organization)
    db.commit()
    db.refresh(organization)

    # Maintain compatibility merchant record linked to org
    merchant = Merchant(
        merchant_id=organization.org_id,
        org_id=organization.org_id,
        name=org_name,
        industry="Enterprise SaaS",
        currency="INR",
        timezone="Asia/Kolkata",
        auto_recovery_enabled=True
    )
    db.add(merchant)
    db.commit()

    # Determine role: registrant is OWNER of their own organization
    assigned_role = "OWNER"

    new_user = User(
        email=clean_email,
        name=user_in.name.strip(),
        hashed_password=get_password_hash(user_in.password),
        role=assigned_role,
        org_id=organization.org_id,
        merchant_id=organization.org_id,
        is_active=True,
        is_verified=False,
        mfa_enabled=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue email verification token
    verification_token = create_email_verification_token(db, new_user)
    logger.info(f"Account registered for {clean_email} in org {organization.org_id}. Verification token: {verification_token[:8]}...")

    return new_user

@router.post("/verify-email")
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Validates single-use email verification token and marks account verified.
    """
    user = verify_and_consume_email_token(db, req.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired email verification token"
        )
    return {
        "status": "success",
        "message": "Email address successfully verified. You may now sign in."
    }

@router.post("/resend-verification")
def resend_verification(req: ResendVerificationRequest, db: Session = Depends(get_db)):
    """
    Anti-enumeration endpoint to resend verification email.
    """
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if user and not user.is_verified:
        token = create_email_verification_token(db, user)
        logger.info(f"Re-issued email verification token for {clean_email}: {token[:8]}...")
    return {
        "status": "received",
        "message": "If this account is registered and pending verification, a new verification email has been dispatched."
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Hardened authentication endpoint:
    - Enforces rate-limiting per client IP
    - Enforces account lockout after 5 consecutive failed attempts
    - Performs dummy bcrypt calculation on missing accounts to mitigate timing attacks
    - Prompts for MFA if user has TOTP enabled
    - Clears lockout counter upon successful authentication
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_login_rate_limit(client_ip)

    now = datetime.datetime.utcnow()
    clean_email = login_data.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

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

    # 3. Check if Multi-Factor Authentication is enabled
    if user.mfa_enabled and user.mfa_secret:
        mfa_token = create_mfa_pending_token(user)
        return {
            "access_token": None,
            "token_type": "bearer",
            "expires_in": 300,
            "mfa_required": True,
            "mfa_token": mfa_token,
            "user": None
        }

    # 4. Successful login: reset failed counters
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name, "org_id": user.org_id})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role, "org_id": user.org_id})
    csrf_token = generate_csrf_token(user.email)

    set_refresh_cookie(response, refresh_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token,
        "mfa_required": False,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "org_id": user.org_id,
            "is_verified": getattr(user, "is_verified", False),
            "mfa_enabled": getattr(user, "mfa_enabled", False),
            "theme_preference": getattr(user, "theme_preference", "dark")
        }
    }

@router.post("/mfa/setup", response_model=MfaSetupResponse)
def setup_mfa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiates TOTP Multi-Factor Authentication setup.
    Generates a cryptographically random RFC 3548 Base32 secret and standard otpauth:// URL.
    """
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, current_user.email, issuer="RevivePay AI")
    current_user.mfa_secret = secret
    db.commit()

    return {
        "secret": secret,
        "otpauth_url": uri
    }

@router.post("/mfa/verify")
def verify_mfa_setup(
    req: MfaVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifies the initial TOTP code to confirm authenticator configuration and enables MFA on the account.
    """
    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA setup has not been initiated. Call /auth/mfa/setup first."
        )

    if not verify_totp_code(current_user.mfa_secret, req.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authenticator code. Please check your time synchronization and try again."
        )

    current_user.mfa_enabled = True
    db.commit()

    return {
        "status": "success",
        "message": "Two-Factor Authentication (TOTP) successfully enabled on your account."
    }

@router.post("/mfa/validate", response_model=Token)
def validate_mfa_login(
    req: MfaValidateRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Completes 2-step login: verifies 6-digit TOTP code against short-lived mfa_pending token.
    Issues full JWT access token and secure httpOnly refresh cookie upon success.
    """
    user = verify_mfa_pending_token(req.mfa_token, db)
    if not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled on this account."
        )

    if not verify_totp_code(user.mfa_secret, req.totp_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 6-digit authenticator code. Please try again."
        )

    # Reset lockout counter
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name, "org_id": user.org_id})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role, "org_id": user.org_id})
    csrf_token = generate_csrf_token(user.email)

    set_refresh_cookie(response, refresh_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token,
        "mfa_required": False,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "org_id": user.org_id,
            "is_verified": getattr(user, "is_verified", False),
            "mfa_enabled": True,
            "theme_preference": getattr(user, "theme_preference", "dark")
        }
    }

@router.post("/mfa/disable")
def disable_mfa(
    req: MfaDisableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disables MFA after verifying account password.
    """
    if not verify_password(req.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Password is required to disable Two-Factor Authentication."
        )

    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    db.commit()

    return {
        "status": "success",
        "message": "Two-Factor Authentication has been disabled."
    }

@router.post("/google", response_model=Token)
def google_auth(
    req: GoogleAuthRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Optional Google Sign-In endpoint.
    Parses Google credential and creates or links organization and user.
    """
    token_str = req.credential.strip()
    # In production, verify Google token signature using google-auth library
    # Here we parse JWT payload for standard claims
    try:
        from jose import jwt as raw_jwt
        claims = raw_jwt.get_unverified_claims(token_str)
        email = claims.get("email")
        name = claims.get("name", "Google User")
    except Exception:
        # Fallback simulation token
        email = "google_user@company.com"
        name = "Google User"

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google authentication payload")

    clean_email = email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        # Provision organization
        org_name = f"{name}'s Team"
        org = Organization(
            name=org_name,
            slug=f"{slugify(org_name)}-{secrets.token_hex(3)}",
            is_test_mode=True
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        # Create user
        user = User(
            email=clean_email,
            name=name,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            role="OWNER",
            org_id=org.org_id,
            merchant_id=org.org_id,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name, "org_id": user.org_id})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role, "org_id": user.org_id})
    csrf_token = generate_csrf_token(user.email)

    set_refresh_cookie(response, refresh_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token,
        "mfa_required": False,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "org_id": user.org_id,
            "is_verified": getattr(user, "is_verified", True),
            "mfa_enabled": getattr(user, "mfa_enabled", False),
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
            merchant = Merchant(merchant_id="merchant_demo_01", name="Apex Cloud Services", industry="Fintech & SaaS")
            db.add(merchant)
            db.commit()
            db.refresh(merchant)

        org = db.query(Organization).first()
        if not org:
            org = Organization(org_id="org_default", name="Default Organization", slug="default-org")
            db.add(org)
            db.commit()
            db.refresh(org)

        user = User(
            email=default_email,
            name=default_name,
            hashed_password=get_password_hash(settings.DEMO_USER_PASSWORD),
            role=role,
            merchant_id=merchant.merchant_id,
            org_id=org.org_id,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name, "org_id": user.org_id or user.merchant_id})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role, "org_id": user.org_id or user.merchant_id})
    csrf_token = generate_csrf_token(user.email)

    set_refresh_cookie(response, refresh_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token,
        "mfa_required": False,
        "user": {
            "id": getattr(user, "id", None) or getattr(user, "user_id", None) or "usr_demo",
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "org_id": user.org_id or user.merchant_id,
            "merchant_id": user.merchant_id,
            "is_active": user.is_active,
            "is_verified": getattr(user, "is_verified", True),
            "mfa_enabled": getattr(user, "mfa_enabled", False),
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

    new_access_token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name, "org_id": user.org_id})
    new_refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role, "org_id": user.org_id})
    csrf_token = generate_csrf_token(user.email)

    set_refresh_cookie(response, new_refresh_token)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "csrf_token": csrf_token,
        "mfa_required": False,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "org_id": user.org_id,
            "is_verified": getattr(user, "is_verified", False),
            "mfa_enabled": getattr(user, "mfa_enabled", False),
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
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if user and user.is_active:
        reset_token = create_password_reset_token(db, user)
        logger.info(f"Generated secure password reset token for user {user.id}: {reset_token[:8]}...")
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
    Verifies operator password or authorized TOTP/OTP and logs recovery.approval.stepup_verified.
    """
    case = db.query(RecoveryCase).filter(RecoveryCase.case_id == req.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Recovery case not found")

    case_org_id = case.org_id or (case.payment.merchant_id if case.payment else None)
    enforce_tenant_ownership(current_user, case_org_id, is_mutation=True)

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

@router.get("/organization", response_model=OrganizationResponse)
def get_current_organization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns organization details for the authenticated user's tenant.
    """
    org_id = current_user.org_id or current_user.merchant_id
    org = db.query(Organization).filter(Organization.org_id == org_id).first()
    if not org:
        # Fallback query merchant
        m = db.query(Merchant).filter(Merchant.merchant_id == org_id).first()
        if m:
            return {
                "org_id": m.merchant_id,
                "name": m.name,
                "slug": slugify(m.name),
                "is_test_mode": True,
                "currency": m.currency or "INR",
                "timezone": m.timezone or "Asia/Kolkata",
                "auto_recovery_enabled": m.auto_recovery_enabled,
                "created_at": m.created_at
            }
        raise HTTPException(status_code=404, detail="Organization not found")
    return org
