import datetime
import hashlib
import hmac
import os
import bcrypt
import secrets
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import get_db
from backend.models.all_models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Pre-computed dummy bcrypt hash to guarantee constant-time evaluation during user enumeration defense
DUMMY_BCRYPT_HASH = "$2b$12$e80yqVb0Gj6jQyv1Cq4f/uF2QO7pYyR9QG7XfV9O9H5kM6mF1QW2q"

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
    from backend.models.all_models import RevokedToken
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
    from backend.models.all_models import RevokedToken
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
    In production mode: strictly requires user account password.
    Arbitrary 6-digit numbers are strictly prohibited.
    """
    if not credential:
        return False
    cred_clean = credential.strip()

    # Sandbox authorized test OTP (gated by DEMO_MODE & non-production)
    if settings.DEMO_MODE and settings.ENVIRONMENT.lower() != "production":
        if cred_clean in ["782910"]:
            return True

    # User account password
    return verify_password(cred_clean, user.hashed_password)

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
    from backend.models.all_models import PasswordResetToken
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
    from backend.models.all_models import PasswordResetToken
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

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None or payload.get("type") == "refresh":
            raise credentials_exception
        if is_token_revoked(db, token):
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_role(allowed_roles: list):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions for this operation"
            )
        return current_user
    return role_checker
