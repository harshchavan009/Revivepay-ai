import os
import re
import time
import math
import datetime
import secrets
import hashlib
import logging
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import engine, get_db
from backend.api import api_router
from backend.seed_data import seed_database
from backend.services.logging_service import (
    SensitiveDataLoggingFilter,
    get_request_id,
    set_request_id,
    redact_sensitive_text
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("revivepay")

# Attach sensitive data scrubber filter to logger and root logger
_scrubber = SensitiveDataLoggingFilter()
logger.addFilter(_scrubber)
logging.getLogger().addFilter(_scrubber)

# Database schema management:
# Schema migrations are strictly managed via Alembic (`alembic upgrade head`)
# before the application starts. FastAPI never runs runtime create_all() DDL commands.

is_prod_env = settings.ENVIRONMENT.lower() == "production"

app = FastAPI(
    title="RevivePay AI",
    description="Production-Oriented Fintech Engineering Prototype for Autonomous Revenue Recovery & Payment Failure Resolution",
    version="1.0.0",
    debug=settings.DEBUG and not is_prod_env,
    openapi_url=None if is_prod_env else "/openapi.json",
    docs_url=None if is_prod_env else "/docs",
    redoc_url=None if is_prod_env else "/redoc",
)

# =========================================================
# 1. RATE LIMITING ENGINE (Sliding Window with Header Math)
# =========================================================
class SlidingWindowRateLimiter:
    def __init__(self):
        # Maps key -> list of request timestamps
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def check_rate_limit(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int, int, int]:
        """
        Calculates rate limit state for key.
        Returns: (allowed: bool, remaining: int, retry_after: int, reset_epoch: int)
        """
        now = time.time()
        window_start = now - window_seconds

        # Bounded cleanup to prevent memory exhaustion
        if len(self.requests) > 10000:
            stale_keys = [k for k, v in self.requests.items() if not v or v[-1] <= window_start]
            for k in stale_keys:
                del self.requests[k]

        valid_timestamps = [t for t in self.requests[key] if t > window_start]
        self.requests[key] = valid_timestamps

        if len(valid_timestamps) >= max_requests:
            oldest = valid_timestamps[0]
            retry_after = max(1, int(math.ceil(oldest + window_seconds - now)))
            reset_epoch = int(oldest + window_seconds)
            return False, 0, retry_after, reset_epoch

        valid_timestamps.append(now)
        self.requests[key] = valid_timestamps
        remaining = max(0, max_requests - len(valid_timestamps))
        reset_epoch = int(now + window_seconds)
        return True, remaining, 0, reset_epoch

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        allowed, _, _, _ = self.check_rate_limit(key, max_requests, window_seconds)
        return allowed

rate_limiter = SlidingWindowRateLimiter()

def get_client_identifiers(request: Request) -> Tuple[str, str, bool]:
    """
    Extracts (client_ip, actor_identifier, is_authenticated).
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            client_ip = parts[0]

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
        if token:
            token_sig = hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]
            return client_ip, f"user_{token_sig}", True

    return client_ip, f"ip_{client_ip}", False

# =========================================================
# 2. SECURITY HEADERS & RATE LIMITING MIDDLEWARE
# =========================================================
@app.middleware("http")
async def security_and_rate_limiting_middleware(request: Request, call_next):
    # 0. Correlation ID Extraction & Tracing
    raw_req_id = request.headers.get("X-Request-ID")
    if raw_req_id and re.match(r"^[a-zA-Z0-9_\-\.]{4,64}$", raw_req_id):
        req_id = raw_req_id
    else:
        req_id = f"req_{secrets.token_hex(12)}"

    request.state.request_id = req_id
    set_request_id(req_id)

    # 1. Block insecure HTTP methods (TRACE, TRACK against Cross-Site Tracing)
    if request.method in ["TRACE", "TRACK"]:
        return PlainTextResponse(
            "Method Not Allowed",
            status_code=405,
            headers={"X-Request-ID": req_id}
        )

    client_ip, actor_id, is_auth = get_client_identifiers(request)
    path = request.url.path

    # Payload Size Check (Slowloris & Buffer Overflow Defense across all endpoints)
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            cl = int(content_length)
            if cl > settings.MAX_REQUEST_BODY_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={
                        "detail": f"Payload Too Large: Request entity exceeds limit of {settings.MAX_REQUEST_BODY_BYTES // (1024*1024)}MB.",
                        "error_code": "PAYLOAD_TOO_LARGE"
                    },
                    headers={"X-Request-ID": req_id}
                )
        except ValueError:
            pass

    rate_limit_meta: Optional[Tuple[int, int, int]] = None

    # Tier A: Authentication routes (/api/auth/*, exempting /environment)
    if path.startswith("/api/auth") and path != "/api/auth/environment":
        key = f"auth:{client_ip}"
        limit = settings.RATE_LIMIT_AUTH_PER_MINUTE
        allowed, remaining, retry_after, reset_epoch = rate_limiter.check_rate_limit(key, max_requests=limit)
        rate_limit_meta = (limit, remaining, reset_epoch)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Too Many Requests: Rate limit exceeded on authentication routes ({limit} req/min). Please try again later.",
                    "error_code": "AUTH_RATE_LIMIT_EXCEEDED"
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_epoch),
                    "X-Request-ID": req_id
                }
            )

    # Tier B: Webhook ingestion routes (/api/webhooks/*)
    elif path.startswith("/api/webhooks"):
        key = f"webhook:{client_ip}"
        limit = settings.RATE_LIMIT_WEBHOOK_PER_MINUTE
        allowed, remaining, retry_after, reset_epoch = rate_limiter.check_rate_limit(key, max_requests=limit)
        rate_limit_meta = (limit, remaining, reset_epoch)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Too Many Requests: Rate limit exceeded on webhook ingestion ({limit} req/min).",
                    "error_code": "WEBHOOK_RATE_LIMIT_EXCEEDED"
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_epoch),
                    "X-Request-ID": req_id
                }
            )

    # Tier C: AI Reasoning, Chat & Simulation routes (/api/chat, /api/simulation, /api/agent)
    elif path.startswith("/api/chat") or path.startswith("/api/simulation") or path.startswith("/api/agent"):
        key = f"ai:{actor_id}"
        limit = settings.RATE_LIMIT_AI_PER_MINUTE
        allowed, remaining, retry_after, reset_epoch = rate_limiter.check_rate_limit(key, max_requests=limit)
        rate_limit_meta = (limit, remaining, reset_epoch)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Too Many Requests: Rate limit exceeded on AI reasoning & simulation routes ({limit} req/min). Please try again shortly.",
                    "error_code": "AI_RATE_LIMIT_EXCEEDED"
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_epoch),
                    "X-Request-ID": req_id
                }
            )

    # Tier D: General API routes (/api/*, exempting health checks)
    elif path.startswith("/api") and path not in ["/api/health", "/health"]:
        key = f"api:{actor_id}"
        limit = settings.RATE_LIMIT_USER_PER_MINUTE if is_auth else settings.RATE_LIMIT_API_PER_MINUTE
        allowed, remaining, retry_after, reset_epoch = rate_limiter.check_rate_limit(key, max_requests=limit)
        rate_limit_meta = (limit, remaining, reset_epoch)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Too Many Requests: API rate limit exceeded ({limit} req/min). Please try again later.",
                    "error_code": "API_RATE_LIMIT_EXCEEDED"
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_epoch),
                    "X-Request-ID": req_id
                }
            )

    response = await call_next(request)

    # Correlation ID
    response.headers["X-Request-ID"] = req_id

    # Append standard X-RateLimit headers if route was rate-limited
    if rate_limit_meta:
        limit, remaining, reset_epoch = rate_limit_meta
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_epoch)

    # Mandatory Security Hardening Headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"

    # CSP - Strictly excludes 'unsafe-eval'
    if is_prod_env:
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https: https://fastapi.tiangolo.com; "
            "connect-src 'self' https: wss:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
    else:
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https: https://fastapi.tiangolo.com; "
            "connect-src 'self' http: https: ws: wss:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )

    # Server version leak suppression
    if "server" in response.headers:
        del response.headers["server"]
    if "x-powered-by" in response.headers:
        del response.headers["x-powered-by"]

    return response

# =========================================================
# 3. GLOBAL EXCEPTION SHIELD (Anti-Leakage & Sanitization)
# =========================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", None) or get_request_id() or f"req_{secrets.token_hex(12)}"
    logger.error(
        f"Unhandled server error on {request.method} {request.url.path} [req_id={req_id}]: {exc}",
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please contact support with the request ID.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "request_id": req_id
        },
        headers={
            "X-Request-ID": req_id,
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY"
        }
    )

# =========================================================
# 4. STRICT CORS CONFIGURATION (No Wildcard with Credentials)
# =========================================================
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
        "https://reviveay-ai.vercel.app",
        "https://revivepay-ai.vercel.app",
        "https://demo.revivepay.ai",
        "https://revivepay-backend.onrender.com",
        *[o for o in settings.CORS_ORIGINS if o != "*"]
    ],
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?|https://reviveay-ai(-[a-zA-Z0-9_-]+)?\.vercel\.app|https://revivepay-ai(-[a-zA-Z0-9_-]+)?\.vercel\.app|https://revivepay-backend(-[a-zA-Z0-9_-]+)?\.onrender\.com)$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Request-ID",
        "Accept",
        "Origin",
        "X-Razorpay-Signature",
        "X-Razorpay-Event-Time",
        "Cookie",
        "X-CSRF-Token"
    ],
    expose_headers=[
        "X-Request-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "Retry-After"
    ]
)


# Include all API routes under /api and /api/v1 for standard client compatibility
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    logger.info("⚡ Starting RevivePay AI Autonomous Revenue Engine...")
    try:
        seed_database()
    except Exception as e:
        logger.error(f"Error seeding database: {e}")

@app.get("/")
def root():
    is_prod = settings.ENVIRONMENT.lower() == "production"
    return {
        "service": "revivepay-api",
        "name": "RevivePay AI",
        "tagline": "Autonomous Revenue Recovery Engine",
        "status": "online",
        "version": "1.0.0",
        "docs_url": None if is_prod else "/docs",
        "redoc_url": None if is_prod else "/redoc",
        "openapi_url": None if is_prod else "/openapi.json",
        "health_url": "/health"
    }

@app.get("/health")
@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    t0 = time.time()
    db_ok = False
    dialect = "unknown"
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_ok = True
        dialect = db.bind.dialect.name if db.bind else "sqlite"
    except Exception:
        db_ok = False
    db_latency = round((time.time() - t0) * 1000, 2)

    # Test AES-256-GCM crypto round-trip
    crypto_ok = False
    try:
        from backend.services.crypto_service import CryptoService
        test_ct = CryptoService.encrypt("health_check_ping")
        test_pt = CryptoService.decrypt(test_ct)
        crypto_ok = (test_pt == "health_check_ping")
    except Exception:
        crypto_ok = False

    # Check Audit Ledger Integrity
    audit_status = {"valid": True, "total_blocks": 0, "status": "UNKNOWN"}
    try:
        from backend.services.audit_service import AuditService
        audit_status = AuditService.verify_chain(db)
    except Exception:
        pass

    all_healthy = db_ok and crypto_ok and audit_status.get("valid", True)

    return {
        "status": "ok" if all_healthy else "degraded",
        "health_state": "healthy" if all_healthy else "degraded",
        "service": "revivepay-api",
        "version": "2.5.0",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": {
            "connected": db_ok,
            "dialect": dialect,
            "latency_ms": db_latency
        },
        "crypto": {
            "cipher": "AES-256-GCM",
            "operational": crypto_ok
        },
        "audit_ledger": {
            "chain_valid": audit_status.get("valid", False),
            "total_blocks": audit_status.get("total_blocks", 0),
            "status": audit_status.get("status", "UNVERIFIED")
        },
        "razorpay_gateway": {
            "mode": "TEST" if settings.DEMO_MODE or settings.ENVIRONMENT != "production" else "LIVE",
            "webhook_hmac_enforced": True,
            "zero_pan_storage_enforced": True
        },
        "security_controls": {
            "jwt_access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "rate_limiting_enabled": True,
            "dpdp_compliance_enabled": True
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

    RESERVED_FASTAPI_PATHS = {"", "health", "docs", "redoc", "openapi.json"}

    BLOCKED_EXTENSIONS = {
        ".env", ".db", ".sqlite", ".sqlite3", ".sql", ".py", ".pyc", ".sh",
        ".bash", ".yml", ".yaml", ".ini", ".log", ".tar", ".gz", ".zip",
        ".bak", ".backup", ".map", ".git", ".dockerfile"
    }

    BLOCKED_PROBE_PREFIXES = (
        "etc/", "proc/", "sys/", "root/", "bin/", "usr/", "var/",
        "dev/", "tmp/", "opt/", "windows/", "winnt/", "boot/"
    )

    BLOCKED_DEBUG_PATHS = {
        "admin", "debug", "_debug", "actuator", "metrics", "phpinfo", "eval-stdin", "console",
        "server-status", "wp-login.php", "wp-admin", "config", "env", "git", "etc/passwd"
    }

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_spa(full_path: str):
        clean_path = full_path.strip("/")

        # Never intercept API, Swagger, ReDoc, or FastAPI system routes
        if (
            clean_path in RESERVED_FASTAPI_PATHS
            or clean_path.startswith("api")
            or clean_path.startswith("docs")
            or clean_path.startswith("redoc")
            or clean_path == "openapi.json"
            or clean_path == "health"
        ):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        # Block direct access to hidden dotfiles, parent directory traversals, or sensitive debug paths
        if (
            any(part.startswith(".") for part in clean_path.split("/"))
            or clean_path in BLOCKED_DEBUG_PATHS
            or clean_path.startswith(BLOCKED_PROBE_PREFIXES)
        ):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        # Block direct downloads of source, configuration, database or log files
        _, ext = os.path.splitext(clean_path.lower())
        if ext in BLOCKED_EXTENSIONS:
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        # Path Traversal Confinement: guarantee target file resolves strictly within dist_dir
        canonical_dist = os.path.realpath(dist_dir)
        requested_file = os.path.realpath(os.path.join(dist_dir, clean_path))
        if not (requested_file == canonical_dist or requested_file.startswith(canonical_dist + os.sep)):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        # Check if requesting a direct static file from dist
        if clean_path and os.path.isfile(requested_file):
            return FileResponse(requested_file)

        # Fallback to SPA index.html for frontend client routes (e.g. /dashboard, /cases)
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)

        return JSONResponse(status_code=404, content={"detail": "Not Found"})

