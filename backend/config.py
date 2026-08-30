import os
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "RevivePay AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "revivepay_enterprise_fintech_jwt_secret_key_2026_x892"
    CSRF_SECRET: str = "revivepay_csrf_signing_salt_2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Short-lived 15 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # 7-day httpOnly refresh cookie
    
    # Rate Limiting & High-Value Governance
    RATE_LIMIT_AUTH_PER_MINUTE: int = 15
    RATE_LIMIT_WEBHOOK_PER_MINUTE: int = 120
    HIGH_VALUE_THRESHOLD: float = 50000.0
    
    # Database
    DATABASE_URL: str = "sqlite:///./revivepay.db"
    
    # Environment Configuration
    ENVIRONMENT: str = "sandbox"  # sandbox | production
    ENVIRONMENT_LABEL: str = "Sandbox Environment — Razorpay Test Mode"
    PUBLIC_APP_URL: str = "https://demo.revivepay.ai"

    # Razorpay Test Mode
    RAZORPAY_KEY_ID: str = "rzp_test_revivepay2026"
    RAZORPAY_KEY_SECRET: str = "secret_revivepay_fintech_test"
    RAZORPAY_WEBHOOK_SECRET: str = "whsec_revivepay_test_webhook_2026"
    
    # LLM Settings (Multi-tier: Claude primary -> Gemini fallback -> Deterministic safety rules)
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    GEMINI_API_KEY: Optional[str] = None
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-1.5-pro"
    OPENAI_API_KEY: Optional[str] = None
    
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

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
