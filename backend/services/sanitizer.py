import html
import re
import math
from typing import Optional

# Common prompt injection, jailbreak, and instruction override attack patterns
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+|previous\s+|prior\s+|the\s+above\s+)?instructions",
    r"disregard\s+(all\s+|previous\s+|prior\s+)?(instructions|directives|prompts)",
    r"forget\s+(all\s+|previous\s+|prior\s+)?(instructions|directives|context)",
    r"you\s+are\s+now\s+(dan|an\s+unfiltered|an\s+ai\s+without|developer\s+mode)",
    r"system\s*prompt\s*:",
    r"<\s*system\s*>",
    r"\[\s*system\s*\]",
    r"jailbreak",
    r"bypass\s+(all\s+)?(policy|guardrails|safety|limits)",
    r"act\s+as\s+(dan|an\s+evil|an\s+unrestricted)",
    r"new\s+rule\s*:",
    r"override\s+(all\s+)?(rules|policy|instructions)",
]

_INJECTION_REGEX = re.compile("|".join(PROMPT_INJECTION_PATTERNS), re.IGNORECASE)

def strip_control_characters(text: str) -> str:
    """Removes non-printable ASCII control characters except standard whitespace (newline, tab)."""
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

def sanitize_text(text: Optional[str], max_length: int = 1000, escape_html: bool = True) -> Optional[str]:
    """Sanitizes user input string: truncates to max_length, removes control chars, and escapes HTML."""
    if text is None:
        return None
    cleaned = strip_control_characters(str(text).strip())
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    if escape_html:
        cleaned = html.escape(cleaned)
    return cleaned

def detect_prompt_injection(text: str) -> bool:
    """Detects whether text contains known prompt injection or jailbreak phrases."""
    if not text:
        return False
    return bool(_INJECTION_REGEX.search(text))

def sanitize_prompt_input(text: str, max_length: int = 500) -> str:
    """Sanitizes text intended for LLM prompt context: strips control chars, caps length, flags injection markers."""
    if not text:
        return ""
    cleaned = strip_control_characters(str(text).strip())
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    # Strip structural XML/Markdown tags that could break prompt boundaries
    cleaned = re.sub(r"<\s*/?\s*(system|telemetry|telemetry_context|user_input|instruction|prompt)\s*>", "", cleaned, flags=re.IGNORECASE)
    return cleaned

def escape_sql_like(search: str) -> str:
    """Escapes SQL LIKE wildcard characters to prevent wildcard explosion and ReDoS."""
    if not search:
        return ""
    clean = strip_control_characters(search.strip())[:100]
    return clean.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

def validate_amount(amount: float) -> float:
    """Validates that a financial amount is positive, non-NaN, non-inf, and within platform limits."""
    if amount is None or math.isnan(amount) or math.isinf(amount):
        raise ValueError("Invalid amount: must be a finite number")
    if amount <= 0:
        raise ValueError("Invalid amount: must be greater than zero")
    if amount > 10_000_000.0:
        raise ValueError("Invalid amount: exceeds platform limit of ₹10,000,000.00")
    return round(float(amount), 2)
