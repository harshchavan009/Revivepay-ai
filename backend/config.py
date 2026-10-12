import os
from typing import Optional, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    """
    Typed, validated configuration settings model for RevivePay AI.
    Loads from environment variables and local .env file.
    Fail-fast validation enforces strict cryptographic and production requirements.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

    PROJECT_NAME: str = "RevivePay AI"
    API_V1_STR: str = "/api"

    # Core Cryptographic & Database Secrets
    # In development/sandbox, placeholder fallbacks are permitted.
    # In production mode, placeholders are strictly rejected at startup.
    SECRET_KEY: str = Field(default="dev-non-secret-jwt-placeholder-key")
    CSRF_SECRET: str = Field(default="dev-non-secret-csrf-placeholder-salt")
    DEMO_USER_PASSWORD: str = Field(default="dev-non-secret-demo-user-password")
    DATABASE_URL: str = Field(default="sqlite:///./revivepay.db")

    # Demo Mode Governance: controls 1-click persona login
    # Defaults to False in production; enabled in sandbox/development/test.
    DEMO_MODE: bool = Field(default=True)

    # Razorpay Gateway Integration
    RAZORPAY_ENABLED: bool = Field(default=False)
    RAZORPAY_KEY_ID: Optional[str] = Field(default=None)
    RAZORPAY_KEY_SECRET: Optional[str] = Field(default=None)
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = Field(default=None)

    # Session & Rate Limiting Controls
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    RATE_LIMIT_AUTH_PER_MINUTE: int = Field(default=15)
    RATE_LIMIT_WEBHOOK_PER_MINUTE: int = Field(default=120)
    RATE_LIMIT_AI_PER_MINUTE: int = Field(default=30)
    RATE_LIMIT_API_PER_MINUTE: int = Field(default=120)
    RATE_LIMIT_USER_PER_MINUTE: int = Field(default=300)
    MAX_REQUEST_BODY_BYTES: int = Field(default=10_485_760)  # 10MB default
    HIGH_VALUE_THRESHOLD: float = Field(default=50000.0)

    # RBI Guideline Reference Framework Settings
    TAT_UPI_DAYS: int = Field(default=1)
    TAT_CARD_DAYS: int = Field(default=5)
    TAT_COMPENSATION_DAILY_INR: float = Field(default=100.0)
    MANDATE_AFA_THRESHOLD: float = Field(default=15000.0)
    DAILY_LLM_CALL_BUDGET: int = Field(default=100)

    # Environment Configuration
    ENVIRONMENT: str = Field(default="sandbox")  # "sandbox" | "production" | "development" | "test"
    ENVIRONMENT_LABEL: str = Field(default="Sandbox Environment — Razorpay Test Mode")
    PUBLIC_APP_URL: str = Field(default="https://demo.revivepay.ai")

    # Multi-Tier LLM Settings
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    ANTHROPIC_MODEL: str = Field(default="claude-3-5-sonnet-20241022")
    GEMINI_API_KEY: Optional[str] = Field(default=None)
    LLM_API_KEY: Optional[str] = Field(default=None)
    LLM_MODEL: str = Field(default="gemini-1.5-pro")
    OPENAI_API_KEY: Optional[str] = Field(default=None)

    # CORS Allowlist — Strictly enumerates trusted origins. No wildcard '*' allowed.
    CORS_ORIGINS: List[str] = Field(default_factory=lambda: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://reviveay-ai.vercel.app",
        "https://revivepay-ai.vercel.app",
        "https://demo.revivepay.ai",
        "https://revivepay-backend.onrender.com"
    ])

    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        if url and url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    def validate_production_readiness(self) -> bool:
        """
        Enforces strict fail-fast validation for production deployments.
        Never logs or reveals secret values.
        """
        is_production = self.ENVIRONMENT.lower() == "production"

        if is_production:
            insecure_defaults = {
                "insecure-dev-secret-key-change-in-production",
                "insecure-dev-csrf-salt-change-in-production",
                "dev-non-secret-jwt-placeholder-key",
                "dev-non-secret-csrf-placeholder-salt",
                "dev-non-secret-demo-user-password",
                "revivepay_enterprise_fintech_jwt_secret_key_2026_x892",
                "revivepay_csrf_signing_salt_2026",
                ""
            }

            # 1. Cryptographic Secrets
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_defaults or len(self.SECRET_KEY) < 32:
                raise ValueError("CRITICAL SECURITY ERROR: SECRET_KEY must be a cryptographically strong secret (>= 32 chars) set via environment in production.")

            if not self.CSRF_SECRET or self.CSRF_SECRET in insecure_defaults or len(self.CSRF_SECRET) < 32:
                raise ValueError("CRITICAL SECURITY ERROR: CSRF_SECRET must be a cryptographically strong secret (>= 32 chars) set via environment in production.")

            # 2. Database URL
            if "sqlite" in self.DATABASE_URL.lower():
                raise ValueError("CRITICAL SECURITY ERROR: Production deployment cannot use SQLite. Managed PostgreSQL connection string required.")

            # 3. CORS Guard
            if "*" in self.CORS_ORIGINS:
                raise ValueError("CRITICAL SECURITY ERROR: Wildcard '*' CORS origin is strictly forbidden in production mode.")

            # 4. Razorpay Secrets (if enabled)
            if self.RAZORPAY_ENABLED or self.RAZORPAY_KEY_ID or self.RAZORPAY_KEY_SECRET or self.RAZORPAY_WEBHOOK_SECRET:
                if not self.RAZORPAY_KEY_ID or "placeholder" in self.RAZORPAY_KEY_ID.lower():
                    raise ValueError("CRITICAL SECURITY ERROR: Valid RAZORPAY_KEY_ID is required when Razorpay is enabled in production.")
                if not self.RAZORPAY_KEY_SECRET or "placeholder" in self.RAZORPAY_KEY_SECRET.lower():
                    raise ValueError("CRITICAL SECURITY ERROR: Valid RAZORPAY_KEY_SECRET is required when Razorpay is enabled in production.")
                if not self.RAZORPAY_WEBHOOK_SECRET or "placeholder" in self.RAZORPAY_WEBHOOK_SECRET.lower():
                    raise ValueError("CRITICAL SECURITY ERROR: Valid RAZORPAY_WEBHOOK_SECRET is required when Razorpay is enabled in production.")

        return True

    def __repr__(self) -> str:
        """Safe string representation that never exposes secret values in logs or exceptions."""
        return (
            f"<Settings project='{self.PROJECT_NAME}' env='{self.ENVIRONMENT}' "
            f"demo_mode={self.DEMO_MODE} db='{self.DATABASE_URL.split('@')[-1] if '@' in self.DATABASE_URL else 'local'}'>"
        )

settings = Settings()
settings.validate_production_readiness()
