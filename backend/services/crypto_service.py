import os
import base64
import hashlib
import logging
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from backend.config import settings

logger = logging.getLogger("revivepay.crypto")

def _get_master_key() -> bytes:
    """
    Derives or extracts a 256-bit (32-byte) AES key from environment configuration.
    Uses ENCRYPTION_MASTER_KEY if configured, or cryptographically hashes SECRET_KEY with SHA-256.
    """
    master_env = getattr(settings, "ENCRYPTION_MASTER_KEY", None)
    if master_env and len(master_env) == 64: # hex-encoded 32 bytes
        try:
            return bytes.fromhex(master_env)
        except Exception:
            pass
    elif master_env and len(master_env) == 44: # base64-encoded 32 bytes
        try:
            return base64.b64decode(master_env)
        except Exception:
            pass
    elif master_env and len(master_env) >= 32:
        return master_env.encode("utf-8")[:32]
    
    # Fallback deterministic derivation from SECRET_KEY
    return hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()

class CryptoService:
    """
    Production-grade AES-256-GCM Authenticated Encryption Service.
    Secures API credentials, webhook secrets, and sensitive tokens at rest.
    Guarantees both confidentiality and tamper-evident authentication tags.
    """

    @classmethod
    def encrypt(cls, plaintext: Optional[str]) -> Optional[str]:
        """
        Encrypts plaintext with AES-256-GCM using a cryptographically secure 96-bit random nonce.
        Returns: base64-encoded string containing (nonce + ciphertext + auth_tag).
        """
        if not plaintext:
            return None
        
        # Guard: If already encrypted in valid format, don't double encrypt
        if plaintext.startswith("aes-gcm:"):
            return plaintext

        key = _get_master_key()
        aesgcm = AESGCM(key)
        nonce = os.urandom(12) # 96-bit nonce
        
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
        payload = nonce + ciphertext
        encoded = base64.b64encode(payload).decode("utf-8")
        return f"aes-gcm:{encoded}"

    @classmethod
    def decrypt(cls, ciphertext_str: Optional[str]) -> Optional[str]:
        """
        Decrypts an AES-256-GCM ciphertext payload.
        Verifies authenticity tag and recovers plaintext.
        Raises ValueError if ciphertext is tampered with or corrupted.
        """
        if not ciphertext_str:
            return None

        # If not encrypted with prefix, return as-is (e.g. unencrypted dev legacy)
        if not ciphertext_str.startswith("aes-gcm:"):
            return ciphertext_str

        raw_payload = ciphertext_str[len("aes-gcm:"):]
        try:
            payload = base64.b64decode(raw_payload)
            if len(payload) < 28: # 12 bytes nonce + 16 bytes tag minimum
                raise ValueError("Ciphertext payload is truncated")
            
            nonce = payload[:12]
            actual_ciphertext = payload[12:]
            
            key = _get_master_key()
            aesgcm = AESGCM(key)
            decrypted_bytes = aesgcm.decrypt(nonce, actual_ciphertext, None)
            return decrypted_bytes.decode("utf-8")
        except Exception as e:
            logger.error(f"Decryption failed: integrity check or authentication tag mismatch: {e}")
            raise ValueError("Decryption failed: invalid key or tampered ciphertext")

    @classmethod
    def mask_secret(cls, secret: Optional[str]) -> str:
        """
        Generates a secure display mask for client browsers and logs.
        Never returns full secret.
        Examples:
        - rzp_test_sample_key -> rzp_test_••••••••ABCD
        - whsec_sample_key -> whsec_••••987
        - short string -> ••••••••
        """
        if not secret:
            return ""
        
        # If encrypted, decrypt temporarily to create mask
        effective = cls.decrypt(secret) if secret.startswith("aes-gcm:") else secret
        if not effective:
            return ""

        if len(effective) <= 6:
            return "••••••••"
        
        prefix = ""
        for p in ["rzp_test_", "rzp_live_", "whsec_"]:
            if effective.startswith(p):
                prefix = p
                effective = effective[len(p):]
                break

        last4 = effective[-4:] if len(effective) >= 4 else effective[-2:]
        return f"{prefix}••••••••{last4}"

    @classmethod
    def mask_email(cls, email: Optional[str]) -> str:
        """
        Masks an email address for privacy and PII protection in logs.
        Example: vikram.sharma@enterprise.in -> v***a@enterprise.in
        """
        if not email or "@" not in email:
            return ""
        local_part, domain = email.split("@", 1)
        if len(local_part) <= 2:
            masked_local = f"{local_part[0]}***"
        else:
            masked_local = f"{local_part[0]}***{local_part[-1]}"
        return f"{masked_local}@{domain}"

    @classmethod
    def mask_phone(cls, phone: Optional[str]) -> str:
        """
        Masks a telephone number for privacy and PII protection in logs.
        Example: +919820144829 -> +9198*****829
        """
        if not phone:
            return ""
        clean = phone.strip()
        if len(clean) <= 6:
            return "******"
        prefix = clean[:4]
        suffix = clean[-3:]
        return f"{prefix}*****{suffix}"
