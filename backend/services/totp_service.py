import base64
import hashlib
import hmac
import secrets
import struct
import time
from typing import Optional
from urllib.parse import quote

# RFC 6238 TOTP Implementation (SHA-1, 30s interval, 6-digit output)
TIME_STEP_SECONDS = 30
CODE_DIGITS = 6

def generate_totp_secret(num_bytes: int = 20) -> str:
    """Generates a random RFC 3548 Base32-encoded secret string (default 160 bits)."""
    random_bytes = secrets.token_bytes(num_bytes)
    return base64.b32encode(random_bytes).decode("utf-8").replace("=", "")

def get_totp_uri(secret: str, email: str, issuer: str = "RevivePay AI") -> str:
    """Generates standard otpauth:// URL for authenticator apps (Google Authenticator, Authy, 1Password)."""
    clean_secret = secret.replace(" ", "").upper()
    encoded_issuer = quote(issuer)
    encoded_email = quote(email)
    return f"otpauth://totp/{encoded_issuer}:{encoded_email}?secret={clean_secret}&issuer={encoded_issuer}&algorithm=SHA1&digits=6&period=30"

def get_hotp_code(secret: str, counter: int) -> str:
    """Computes RFC 4226 HOTP code for a given counter value."""
    # Ensure correct Base32 padding
    clean_secret = secret.replace(" ", "").upper()
    padding_needed = (8 - len(clean_secret) % 8) % 8
    clean_secret += "=" * padding_needed
    key = base64.b32decode(clean_secret, casefold=True)

    # 8-byte big-endian counter
    msg = struct.pack(">Q", counter)
    h = hmac.new(key, msg, hashlib.sha1).digest()

    # Dynamic truncation (RFC 4226 Section 5.3)
    offset = h[-1] & 0x0F
    code_int = struct.unpack(">I", h[offset:offset + 4])[0] & 0x7FFFFFFF
    code_str = str(code_int % (10 ** CODE_DIGITS))
    return code_str.zfill(CODE_DIGITS)

def get_current_totp_code(secret: str, timestamp: Optional[float] = None) -> str:
    """Computes current 6-digit TOTP code for the given secret."""
    ts = timestamp if timestamp is not None else time.time()
    counter = int(ts // TIME_STEP_SECONDS)
    return get_hotp_code(secret, counter)

def verify_totp_code(secret: str, code: str, window: int = 1, timestamp: Optional[float] = None) -> bool:
    """
    Timing-safe verification of TOTP code against current time step +/- window steps (default +/- 30s).
    """
    if not secret or not code:
        return False
    clean_code = str(code).strip()
    if len(clean_code) != CODE_DIGITS or not clean_code.isdigit():
        return False

    ts = timestamp if timestamp is not None else time.time()
    current_counter = int(ts // TIME_STEP_SECONDS)

    # Check intervals [current - window, current + window]
    is_valid = False
    for step in range(-window, window + 1):
        expected_code = get_hotp_code(secret, current_counter + step)
        if hmac.compare_digest(clean_code, expected_code):
            is_valid = True
            break
    return is_valid
