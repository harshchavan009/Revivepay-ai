import os
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "RevivePay AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "revivepay_enterprise_fintech_jwt_secret_key_2026_x892"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./revivepay.db"
    
    # Razorpay Test Mode
    RAZORPAY_KEY_ID: str = "rzp_test_revivepay2026"
    RAZORPAY_KEY_SECRET: str = "secret_revivepay_fintech_test"
    RAZORPAY_WEBHOOK_SECRET: str = "whsec_revivepay_test_webhook_2026"
    
    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # gemini, openai, anthropic, or deterministic_fallback
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-1.5-pro"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
