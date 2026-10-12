import re
import logging
from contextvars import ContextVar
from typing import Optional

# Request ID Context Variable for async correlation
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

def get_request_id() -> str:
    """Returns the current request ID from context or default '-'."""
    return request_id_ctx.get()

def set_request_id(req_id: str) -> None:
    """Sets the current request ID in context."""
    request_id_ctx.set(req_id)

# Regex patterns for sensitive data masking in logs
SENSITIVE_PATTERNS = [
    # 1. Bearer / JWT Tokens
    (re.compile(r"(?i)(bearer\s+)[A-Za-z0-9_\-\.]{15,}\b"), r"\1[REDACTED_TOKEN]"),
    # 2. Token / Session fields in JSON or key-value pairs
    (re.compile(r"""(?i)(["']?(?:access_token|refresh_token|jwt|session_token|csrf_token|step_up_token)["']?\s*[:=]\s*["']?)[A-Za-z0-9_\-\.]{15,}(["']?)"""), r"\1[REDACTED_TOKEN]\2"),
    # 3. Password / Secret fields in JSON or key-value pairs
    (re.compile(r"""(?i)(["']?(?:password|hashed_password|secret|secret_key|csrf_secret|api_key|razorpay_secret|webhook_secret)["']?\s*[:=]\s*["']?)([^"',\s\r\n]{3,})(["']?)"""), r"\1[REDACTED_SECRET]\3"),
    # 4. Known Vendor API Keys (Anthropic, Google Gemini, Razorpay)
    (re.compile(r"\bsk-ant-[a-zA-Z0-9_\-]{20,}\b"), "[REDACTED_ANTHROPIC_KEY]"),
    (re.compile(r"\bAIzaSy[a-zA-Z0-9_\-]{25,}\b"), "[REDACTED_GEMINI_KEY]"),
    (re.compile(r"\brzp_(?:test|live)_[a-zA-Z0-9]{14,}\b"), "[REDACTED_RAZORPAY_KEY]"),
    # 5. Credit / Debit Primary Account Numbers (13 to 19 digits)
    (re.compile(r"\b(?:\d[ -]*?){13,19}\b"), "[REDACTED_CARD_NUMBER]")
]

def redact_sensitive_text(text: str) -> str:
    """
    Masks passwords, authorization tokens, provider API keys,
    and payment card numbers in text logs before emission.
    """
    if not isinstance(text, str) or not text:
        return text

    sanitized = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    return sanitized

class SensitiveDataLoggingFilter(logging.Filter):
    """
    Python logging filter that attaches correlation request_id
    and scrubs sensitive credentials from log messages and arguments.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        # Attach request_id if not already present
        if not hasattr(record, "request_id") or record.request_id == "-":
            record.request_id = get_request_id()

        # Sanitize main message
        if isinstance(record.msg, str):
            record.msg = redact_sensitive_text(record.msg)

        # Sanitize arguments tuple/dict if present
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: redact_sensitive_text(str(v)) if isinstance(v, str) else v for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple(redact_sensitive_text(str(a)) if isinstance(a, str) else a for a in record.args)

        return True
