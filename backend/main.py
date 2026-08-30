import os
import time
import logging
from collections import defaultdict
from typing import Dict, List
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from backend.config import settings
from backend.database import engine, Base
from backend.api import api_router
from backend.seed_data import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("revivepay")

# Database schema initialization
# In production, schema migrations are explicitly managed via Alembic (`alembic upgrade head`).
# In local development / test environments with SQLite, create schema if not present.
if settings.ENVIRONMENT != "production" or "sqlite" in settings.DATABASE_URL:
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RevivePay AI",
    description="Production-Oriented Fintech Engineering Prototype for Autonomous Revenue Recovery & Payment Failure Resolution",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# =========================================================
# 1. RATE LIMITING ENGINE (In-Memory Sliding Window)
# =========================================================
class SlidingWindowRateLimiter:
    def __init__(self):
        # Maps key -> list of request timestamps
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        now = time.time()
        window_start = now - window_seconds
        # Clean older entries
        self.requests[key] = [t for t in self.requests[key] if t > window_start]
        
        if len(self.requests[key]) >= max_requests:
            return False
        
        self.requests[key].append(now)
        return True

rate_limiter = SlidingWindowRateLimiter()

# =========================================================
# 2. SECURITY HEADERS & RATE LIMITING MIDDLEWARE
# =========================================================
@app.middleware("http")
async def security_and_rate_limiting_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path

    # Rate Limiting: /api/auth/* (exempting /environment)
    if path.startswith("/api/auth") and path != "/api/auth/environment":
        key = f"auth:{client_ip}"
        if not rate_limiter.is_allowed(key, max_requests=settings.RATE_LIMIT_AUTH_PER_MINUTE):
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too Many Requests: Rate limit exceeded on authentication routes (15 req/min). Please try again later.",
                    "error_code": "AUTH_RATE_LIMIT_EXCEEDED"
                },
                headers={"Retry-After": "60"}
            )

    # Rate Limiting: /api/webhooks/*
    elif path.startswith("/api/webhooks"):
        key = f"webhook:{client_ip}"
        if not rate_limiter.is_allowed(key, max_requests=settings.RATE_LIMIT_WEBHOOK_PER_MINUTE):
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too Many Requests: Rate limit exceeded on webhook ingestion (120 req/min).",
                    "error_code": "WEBHOOK_RATE_LIMIT_EXCEEDED"
                },
                headers={"Retry-After": "60"}
            )

    # Rate Limiting: AI Reasoning & Simulation Endpoints (/api/chat, /api/simulation, /api/agent)
    elif path.startswith("/api/chat") or path.startswith("/api/simulation") or path.startswith("/api/agent"):
        key = f"ai:{client_ip}"
        if not rate_limiter.is_allowed(key, max_requests=30):
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too Many Requests: Rate limit exceeded on AI reasoning & simulation routes (30 req/min). Please try again shortly.",
                    "error_code": "AI_RATE_LIMIT_EXCEEDED"
                },
                headers={"Retry-After": "60"}
            )

    response = await call_next(request)

    # Mandatory Security Hardening Headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https:; "
        "connect-src 'self' http: https: ws: wss:; "
        "frame-ancestors 'none';"
    )

    return response

# Set up CORS for all dev and production origins with Safari WebKit compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://[::1]:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://demo.revivepay.ai"
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes under /api
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    logger.info("⚡ Starting RevivePay AI Autonomous Revenue Engine...")
    try:
        seed_database()
    except Exception as e:
        logger.error(f"Error seeding database: {e}")

@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "revivepay-api",
        "version": "1.0.0",
        "security_controls": {
            "jwt_access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "refresh_token_cookie_enabled": True,
            "step_up_auth_threshold_inr": settings.HIGH_VALUE_THRESHOLD,
            "rate_limiting_enabled": True,
            "security_headers_enforced": True
        }
    }

# =========================================================
# UNIFIED FULL-STACK STATIC MOUNT & SPA FALLBACK ROUTER
# =========================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
dist_dir = os.path.join(project_root, "dist")
if not os.path.exists(dist_dir):
    dist_dir = os.path.join(os.getcwd(), "dist")

if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_spa(full_path: str):
        # Allow FastAPI API and Swagger routes to pass through
        if full_path.startswith("api/") or full_path in ["api", "docs", "openapi.json", "redoc", "health"]:
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        # Check if requesting a direct static file from dist
        requested_file = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(requested_file):
            return FileResponse(requested_file)

        # Fallback to SPA index.html
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        
        return JSONResponse(status_code=404, content={"detail": "dist/index.html not found"})
else:
    @app.get("/")
    def root():
        return {
            "service": "revivepay-api",
            "name": "RevivePay AI",
            "tagline": "Recover Revenue Before It's Lost.",
            "status": "online",
            "note": "Run npm run build to serve the unified frontend directly from this port."
        }
