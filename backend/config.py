import os
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "RevivePay AI"
    API_V1_STR: str = "/api"
    # Core Cryptographic & Database Secrets (strictly loaded from environment)
    # Development fallbacks are clearly marked non-secret placeholders and rejected in production mode.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-non-secret-jwt-placeholder-key")
    CSRF_SECRET: str = os.getenv("CSRF_SECRET", "dev-non-secret-csrf-placeholder-salt")
    DEMO_USER_PASSWORD: str = os.getenv("DEMO_USER_PASSWORD", "dev-non-secret-demo-user-password")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./revivepay.db")
    
    # Razorpay Gateway Integration (Configured strictly via Environment)
    RAZORPAY_ENABLED: bool = os.getenv("RAZORPAY_ENABLED", "false").lower() in ("true", "1", "yes")
    RAZORPAY_KEY_ID: Optional[str] = os.getenv("RAZORPAY_KEY_ID", None)
    RAZORPAY_KEY_SECRET: Optional[str] = os.getenv("RAZORPAY_KEY_SECRET", None)
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = os.getenv("RAZORPAY_WEBHOOK_SECRET", None)
    
    # Session & Rate Limiting Controls
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    RATE_LIMIT_AUTH_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_AUTH_PER_MINUTE", "15"))
    RATE_LIMIT_WEBHOOK_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_WEBHOOK_PER_MINUTE", "120"))
    HIGH_VALUE_THRESHOLD: float = float(os.getenv("HIGH_VALUE_THRESHOLD", "50000.0"))
    
    # RBI Guideline Reference Framework Settings
    TAT_UPI_DAYS: int = 1
    TAT_CARD_DAYS: int = 5
    TAT_COMPENSATION_DAILY_INR: float = 100.0
    MANDATE_AFA_THRESHOLD: float = 15000.0
    DAILY_LLM_CALL_BUDGET: int = int(os.getenv("DAILY_LLM_CALL_BUDGET", "100"))
    
    # Environment Configuration
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "sandbox")
    ENVIRONMENT_LABEL: str = os.getenv("ENVIRONMENT_LABEL", "Sandbox Environment — Razorpay Test Mode")
    PUBLIC_APP_URL: str = os.getenv("PUBLIC_APP_URL", "https://demo.revivepay.ai")
    
    # LLM Settings (Multi-tier: Claude primary -> Gemini fallback -> Deterministic safety rules)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY", None)
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-1.5-pro")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://demo.revivepay.ai",
        "*"
    ]
    
    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        if url and url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    def validate_production_readiness(self) -> bool:
        """Enforces that production deployments must explicitly provide critical cryptographic secrets."""
        if self.ENVIRONMENT.lower() == "production":
            insecure_defaults = [
                "insecure-dev-secret-key-change-in-production",
                "insecure-dev-csrf-salt-change-in-production",
                "dev-non-secret-jwt-placeholder-key",
                "dev-non-secret-csrf-placeholder-salt",
                "dev-non-secret-demo-user-password",
                ""
            ]
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_defaults:
                raise ValueError("CRITICAL SECURITY CONFIGURATION ERROR: SECRET_KEY must be set in environment variables in production mode.")
            if not self.CSRF_SECRET or self.CSRF_SECRET in insecure_defaults:
                raise ValueError("CRITICAL SECURITY CONFIGURATION ERROR: CSRF_SECRET must be set in environment variables in production mode.")

            # If Razorpay integration is enabled in production, enforce all Razorpay credentials
            if self.RAZORPAY_ENABLED or self.RAZORPAY_KEY_ID or self.RAZORPAY_KEY_SECRET or self.RAZORPAY_WEBHOOK_SECRET:
                if not self.RAZORPAY_KEY_ID:
                    raise ValueError("CRITICAL SECURITY CONFIGURATION ERROR: RAZORPAY_KEY_ID is required in production when Razorpay is enabled.")
                if not self.RAZORPAY_KEY_SECRET:
                    raise ValueError("CRITICAL SECURITY CONFIGURATION ERROR: RAZORPAY_KEY_SECRET is required in production when Razorpay is enabled.")
                if not self.RAZORPAY_WEBHOOK_SECRET:
                    raise ValueError("CRITICAL SECURITY CONFIGURATION ERROR: RAZORPAY_WEBHOOK_SECRET is required in production when Razorpay is enabled.")
        return True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
settings.validate_production_readiness()
