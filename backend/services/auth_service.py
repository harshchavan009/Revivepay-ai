import datetime
import hashlib
import hmac
import os
import bcrypt
import secrets
from typing import Optional, Dict, Any, List
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import get_db
from backend.models.all_models import User, EmailVerificationToken, PasswordResetToken, RevokedToken

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

# Pre-computed dummy bcrypt hash to guarantee constant-time evaluation during user enumeration defense
DUMMY_BCRYPT_HASH = "$2b$12$e80yqVb0Gj6jQyv1Cq4f/uF2QO7pYyR9QG7XfV9O9H5kM6mF1QW2q"

# Role definitions & legacy backward compatibility normalization
CANONICAL_ROLES = ["OWNER", "ADMIN", "OPERATOR", "VIEWER"]
ADMIN_ROLES = ["OWNER", "ADMIN", "MERCHANT_OWNER"]
OPERATOR_ROLES = ["OWNER", "ADMIN", "OPERATOR", "MERCHANT_OWNER", "REVENUE_OPERATOR"]
ALL_ROLES = ["OWNER", "ADMIN", "OPERATOR", "VIEWER", "MERCHANT_OWNER", "REVENUE_OPERATOR", "SUPPORT_OPERATOR"]
ROLE_MAP = {
    "MERCHANT_OWNER": "OWNER",
    "REVENUE_OPERATOR": "OPERATOR",
    "SUPPORT_OPERATOR": "VIEWER",
    "OWNER": "OWNER",
    "ADMIN": "ADMIN",
    "OPERATOR": "OPERATOR",
    "VIEWER": "VIEWER"
}

def normalize_role(role: Optional[str]) -> str:
    """Normalizes legacy or current role name to canonical B2B SaaS role."""
    if not role:
        return "OPERATOR"
    return ROLE_MAP.get(role, role)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Timing-safe password verification supporting bcrypt and salted SHA-256."""
    try:
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
        parts = hashed_password.split("$")
        if len(parts) == 3 and parts[0] == "sha256":
            salt, hash_val = parts[1], parts[2]
            computed = hashlib.sha256((salt + plain_password).encode("utf-8")).hexdigest()
            return hmac.compare_digest(computed, hash_val)
    except Exception:
        pass
    return False

def get_password_hash(password: str) -> str:
    """Hashes password using bcrypt with standard cost factor."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8")[:72], salt)
    return hashed.decode("utf-8")

def hash_token(token: str) -> str:
    """Returns SHA-256 digest of a token string for safe database lookup."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def revoke_token(db: Session, token: str, token_type: str = "refresh", expires_at: Optional[datetime.datetime] = None) -> None:
    """Records a token hash into the server-side revocation ledger."""
    t_hash = hash_token(token)
    existing = db.query(RevokedToken).filter(RevokedToken.token_hash == t_hash).first()
    if not existing:
        db.add(RevokedToken(
            token_hash=t_hash,
            token_type=token_type,
            expires_at=expires_at
        ))
        db.commit()

def is_token_revoked(db: Session, token: str) -> bool:
    """Checks whether a token has been explicitly revoked server-side."""
    t_hash = hash_token(token)
    return db.query(RevokedToken).filter(RevokedToken.token_hash == t_hash).first() is not None

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Creates a short-lived 15-minute JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "type": "access",
        "jti": secrets.token_hex(16)
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Creates a 7-day refresh token with a unique jti for secure cookie storage."""
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "jti": secrets.token_hex(16)
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def create_mfa_pending_token(user: User) -> str:
    """Creates a short-lived 5-minute token allowing the user to complete MFA verification."""
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    to_encode = {
        "sub": user.email,
        "user_id": user.id,
        "type": "mfa_pending",
        "exp": expire,
        "jti": secrets.token_hex(16)
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def verify_mfa_pending_token(token: str, db: Session) -> User:
    """Validates mfa_pending token and returns the target user."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "mfa_pending":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type for MFA validation")
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired MFA session")

def verify_refresh_token(token: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """Validates refresh token and ensures it has not been revoked server-side."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type for refresh")
        if db is not None and is_token_revoked(db, token):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

def generate_csrf_token(email: str) -> str:
    """Generates a cryptographic HMAC CSRF token bound to the user email."""
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d")
    raw = f"{email}:{timestamp}:{settings.CSRF_SECRET}"
    return hmac.new(settings.CSRF_SECRET.encode(), raw.encode(), hashlib.sha256).hexdigest()[:32]

def verify_csrf_token(email: str, token: str) -> bool:
    """Verifies timing-safe HMAC CSRF token."""
    if not token or not email:
        return False
    expected = generate_csrf_token(email)
    return hmac.compare_digest(expected, token)

def verify_step_up_credential(user: User, credential: str) -> bool:
    """
    Validates step-up re-authentication using user password or authorized sandbox OTP.
    In sandbox mode: allows '782910' (reference OTP) or valid user account password.
    In production mode: strictly requires user account password or TOTP.
    """
    if not credential:
        return False
    cred_clean = credential.strip()

    # Sandbox authorized test OTP (gated by DEMO_MODE & non-production)
    if settings.DEMO_MODE and settings.ENVIRONMENT.lower() != "production":
        if cred_clean in ["782910"]:
            return True

    # Check user password
    if verify_password(cred_clean, user.hashed_password):
        return True

    # If MFA is enabled on user, check TOTP code
    if getattr(user, "mfa_enabled", False) and getattr(user, "mfa_secret", None):
        from backend.services.totp_service import verify_totp_code
        if verify_totp_code(user.mfa_secret, cred_clean):
            return True

    return False

def create_step_up_token(user: User, case_id: str) -> str:
    """Creates a 5-minute signed token proving step-up verification for a specific case."""
    to_encode = {
        "sub": user.email,
        "user_id": user.id,
        "case_id": case_id,
        "step_up": True,
        "type": "step_up",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def verify_step_up_token(token: str, user: User, case_id: str) -> bool:
    """Validates step-up verification token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return (
            payload.get("sub") == user.email and
            payload.get("case_id") == case_id and
            payload.get("step_up") is True and
            payload.get("type") == "step_up"
        )
    except JWTError:
        return False

def create_password_reset_token(db: Session, user: User) -> str:
    """Generates a single-use, 15-minute expiring, SHA-256 hashed password reset token."""
    raw_token = secrets.token_urlsafe(32)
    t_hash = hash_token(raw_token)
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    record = PasswordResetToken(
        user_id=user.id,
        token_hash=t_hash,
        expires_at=expires,
        used=False
    )
    db.add(record)
    db.commit()
    return raw_token

def verify_and_consume_reset_token(db: Session, raw_token: str) -> Optional[User]:
    """Verifies that a password reset token is valid, unexpired, and unused, then marks it consumed."""
    t_hash = hash_token(raw_token)
    now = datetime.datetime.utcnow()
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == t_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now
    ).first()
    if not record:
        return None
    record.used = True
    user = db.query(User).filter(User.id == record.user_id).first()
    db.commit()
    return user

def create_email_verification_token(db: Session, user: User) -> str:
    """Generates a single-use, 24-hour expiring, SHA-256 hashed email verification token."""
    raw_token = secrets.token_urlsafe(32)
    t_hash = hash_token(raw_token)
    expires = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    record = EmailVerificationToken(
        user_id=user.id,
        token_hash=t_hash,
        expires_at=expires,
        used=False
    )
    db.add(record)
    db.commit()
    return raw_token

def verify_and_consume_email_token(db: Session, raw_token: str) -> Optional[User]:
    """Verifies email verification token, consumes it, and marks user as verified."""
    t_hash = hash_token(raw_token)
    now = datetime.datetime.utcnow()
    record = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token_hash == t_hash,
        EmailVerificationToken.used == False,
        EmailVerificationToken.expires_at > now
    ).first()
    if not record:
        return None
    record.used = True
    user = db.query(User).filter(User.id == record.user_id).first()
    if user:
        user.is_verified = True
    db.commit()
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None or payload.get("type") in ["refresh", "mfa_pending"]:
            raise credentials_exception
        if is_token_revoked(db, token):
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extracts authenticated user from Bearer token if provided.
    Returns None if no token is passed.
    Raises 401 Unauthorized if an invalid, expired, or revoked token is provided.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None or payload.get("type") in ["refresh", "mfa_pending"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if is_token_revoked(db, token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_role(allowed_roles: List[str]):
    """
    Enforces server-side role check with canonical role mapping.
    Roles: OWNER, ADMIN, OPERATOR, VIEWER.
    """
    norm_allowed = {normalize_role(r) for r in allowed_roles}
    # Keep raw names for direct match
    for r in allowed_roles:
        norm_allowed.add(r)

    def role_checker(current_user: User = Depends(get_current_user)):
        user_norm = normalize_role(current_user.role)
        if user_norm not in norm_allowed and current_user.role not in norm_allowed:
            if user_norm == "VIEWER":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions: Viewer role is read-only"
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions for this operation"
            )
        return current_user
    return role_checker

def get_current_tenant_org_id(current_user: Optional[User]) -> Optional[str]:
    """Returns effective tenant org_id for the current user."""
    if not current_user:
        return None
    return current_user.org_id or current_user.merchant_id

def verify_tenant_access(
    current_user: Optional[User],
    resource_tenant_id: Optional[str]
) -> bool:
    """
    Evaluates whether the current user has authorization to access a resource
    belonging to resource_tenant_id (org_id or merchant_id).
    """
    if current_user is None:
        if settings.ENVIRONMENT.lower() == "production" and not settings.DEMO_MODE:
            return False
        return True

    # Global omni-tenant superadmin
    if current_user.role == "ADMIN":
        return True

    # If resource has no tenant specified
    if not resource_tenant_id:
        return True

    user_org = current_user.org_id or current_user.merchant_id
    return user_org == resource_tenant_id

def enforce_tenant_ownership(
    current_user: Optional[User],
    resource_tenant_id: Optional[str],
    is_mutation: bool = False
) -> None:
    """
    Enforces multi-tenant isolation and defends against IDOR/BOLA attacks.
    - Read operations return 404 Not Found upon tenant mismatch (preventing cross-tenant existence enumeration).
    - Mutating operations return 403 Forbidden upon tenant mismatch.
    """
    if not verify_tenant_access(current_user, resource_tenant_id):
        if is_mutation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cross-tenant resource modification is prohibited"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
