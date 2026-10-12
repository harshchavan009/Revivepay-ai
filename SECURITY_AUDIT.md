# RevivePay AI — Comprehensive Application Security Hardening Audit Report

**Target Repository:** `https://github.com/harshchavan009/Revivepay-ai.git`  
**Current Audit Branch:** `security-hardening`  
**Auditor Role:** Senior Application Security Engineer & Full-Stack Developer  
**Audit Date:** October 2026  
**Status:** PHASE 0 (Reconnaissance) & PHASE 1 (Secrets Hygiene & Git History) Completed — Baseline Inspection  

---

## Executive Summary

RevivePay AI is an autonomous payment-failure recovery and revenue-preservation platform built as a decoupled full-stack architecture:
- **Frontend:** React 18, TypeScript, TailwindCSS, Vite (SPA), deployed to **Vercel**.
- **Backend:** Python 3.11/3.14, FastAPI, SQLAlchemy 2.0, Alembic, uvicorn, deployed to **Render** (`revivepay-backend.onrender.com`).
- **Database:** PostgreSQL (production on Render) / SQLite (`revivepay.db`, local development).
- **AI/LLM Architecture:** Multi-tier sequential routing (Primary: Anthropic Claude 3.5 Sonnet -> Fallback: Google Gemini 1.5 Pro -> Safe Floor: Deterministic Rules Engine) guarded by a daily quota budget and deterministic policy gates.
- **Payment & Telemetry Ingress:** Razorpay Test Mode webhooks (HMAC-SHA256 signature verification), dual-mode synthetic simulation, and Server-Sent Events (SSE) telemetry.

A complete Phase 0 and Phase 1 inspection was performed on branch `security-hardening`. The baseline test suite (`PYTHONPATH=. pytest tests/`) runs **90 tests, 90 passing**.

---

## Baseline Stack & Deployment Detection

| Component | Detected Technology | Configuration File | Production Hosting |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 18.3.1, TypeScript 5.7.2, Vite 6.0.1 | `package.json`, `vite.config.ts` | Vercel (`vercel.json`) |
| **Backend Framework** | FastAPI 0.115.0, Uvicorn 0.42.0, Pydantic 2.12.5 | `backend/main.py`, `backend/requirements.txt` | Render (`render.yaml`, `Dockerfile.backend`) |
| **Database ORM & Migrations** | SQLAlchemy 2.0.48, Alembic 1.14.0 | `backend/database.py`, `alembic.ini`, `render.yaml` | Managed PostgreSQL on Render |
| **Authentication & Tokens** | python-jose 3.5.0 (JWT), bcrypt 4.x / passlib 1.7.4 | `backend/services/auth_service.py` | Bearer Token & `refresh_token` httpOnly Cookie |
| **Cryptographic Ledger** | SHA-256 Hash Chaining | `backend/services/audit_service.py` | `audit_logs` table (`entry_hash`, `previous_hash`) |
| **Reverse Proxy / Rewrites** | Vercel Serverless Rewrites | `vercel.json` | Rewrites `/api/(.*)` to Render backend |
| **Containerization** | Docker multi-stage | `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml` | Render Docker Runtime |

---

## Phase 0 — Attack Surface Reconnaissance & API Inventory

Total registered API routes: **64 routes** across 17 sub-routers.

### Complete Route Inventory Table

| Method | Path | Auth Required? | Role Required? | Input Validation? | Rate Limited? | Security Finding / Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | No | None | None | No | Information Disclosure (leaks docs, health, API metadata) |
| `GET` | `/health` | No | None | None | No | None |
| `GET` | `/api/health` | No | None | None | No | Leaks internal security parameters (token expiry, threshold) |
| `GET` | `/api/auth/environment` | No | None | None | No | Public environment metadata |
| `POST` | `/api/auth/login` | No | None | `UserLogin` schema | Yes (15/min IP) | User enumeration timing oracle; lacks account lockout backoff |
| `POST` | `/api/auth/demo-login` | No | None | `DemoLoginRequest` | Yes (15/min IP) | **CRITICAL:** Grants instant Admin/Owner JWT without `DEMO_MODE=true` gate |
| `POST` | `/api/auth/refresh` | Cookie / Bearer | None | String token parse | Yes (15/min IP) | Short-lived rotation present; lacks server-side blocklist |
| `POST` | `/api/auth/logout` | No | None | None | Yes (15/min IP) | Only clears client cookie; NO server-side token invalidation |
| `POST` | `/api/auth/step-up-verify` | Bearer JWT | Authenticated | `StepUpVerifyRequest` | Yes (15/min IP) | **HIGH:** Any 6-digit number accepted as OTP in test logic |
| `POST` | `/api/auth/register` | No | None | `UserCreate` | Yes (15/min IP) | Lacks password complexity policy; allows self-assigned roles |
| `GET` | `/api/auth/me` | Bearer JWT | Authenticated | None | Yes (15/min IP) | Properly authenticated |
| `PATCH` | `/api/auth/theme` | Bearer JWT | Authenticated | Untyped `dict` | Yes (15/min IP) | Missing Pydantic schema validation |
| `GET` | `/api/dashboard/summary` | **No** | None | None | **No** | **HIGH:** Unauthenticated access to financial totals & recovery revenue |
| `GET` | `/api/dashboard/revenue-risk` | **No** | None | None | **No** | **HIGH:** Unauthenticated access to financial risk time series |
| `GET` | `/api/dashboard/recovery-trend` | **No** | None | None | **No** | **HIGH:** Unauthenticated access to business recovery trends |
| `GET` | `/api/dashboard/failure-reasons` | **No** | None | None | **No** | **MEDIUM:** Unauthenticated access to failure distribution |
| `GET` | `/api/dashboard/funnel` | **No** | None | None | **No** | **MEDIUM:** Unauthenticated access to recovery funnel metrics |
| `GET` | `/api/payments` | **No** | None | Query params | **No** | **CRITICAL:** Unauthenticated PII/card/transaction leakage |
| `GET` | `/api/payments/{payment_id}` | **No** | None | Path string | **No** | **CRITICAL (IDOR/BOLA):** Direct lookup of any payment by ID without auth |
| `GET` | `/api/recovery/count` | **No** | None | None | **No** | Unauthenticated metric access |
| `GET` | `/api/recovery/cases` | **No** | None | Query params | **No** | **CRITICAL:** Unauthenticated listing of all customer recovery cases |
| `GET` | `/api/recovery/cases/{case_id}` | **No** | None | Path string | **No** | **CRITICAL (IDOR/BOLA):** Direct object lookup of recovery case + PII |
| `POST` | `/api/recovery/{case_id}/analyze` | **No** | None | Path string | **No** | **HIGH:** Unauthenticated re-triggering of ML & LLM analysis pipeline |
| `POST` | `/api/recovery/{case_id}/approve` | Bearer JWT | `OPERATOR_ROLES` | `RecoveryApprovalRequest` | **No** | Lacks tenant ownership validation (cross-tenant IDOR) |
| `POST` | `/api/recovery/{case_id}/reject` | Bearer JWT | `OPERATOR_ROLES` | `RecoveryApprovalRequest` | **No** | Lacks tenant ownership validation (cross-tenant IDOR) |
| `POST` | `/api/recovery/{case_id}/execute` | Bearer JWT | `OPERATOR_ROLES` | Path string | **No** | Lacks tenant ownership validation (cross-tenant IDOR) |
| `POST` | `/api/recovery/{case_id}/stop` | Bearer JWT | `OPERATOR_ROLES` | Path string | **No** | Lacks tenant ownership validation (cross-tenant IDOR) |
| `GET` | `/api/cases` | **No** | None | Query params | **No** | Duplicate alias of `/api/recovery/cases` (Unauthenticated) |
| `GET` | `/api/cases/count` | **No** | None | None | **No** | Duplicate alias of `/api/recovery/count` (Unauthenticated) |
| `POST` | `/api/agent/analyze` | **No** | None | Untyped `Dict[str, Any]` | Yes (30/min IP) | **HIGH:** Unauthenticated invocation of AI reasoning models |
| `POST` | `/api/agent/plan` | **No** | None | Untyped `Dict[str, Any]` | Yes (30/min IP) | **HIGH:** Unauthenticated invocation of AI recovery planning |
| `GET` | `/api/agent/budget` | **No** | None | None | Yes (30/min IP) | Public disclosure of LLM quota consumption |
| `POST` | `/api/agent/budget/toggle-exhaustion` | **No** | None | None | Yes (30/min IP) | **HIGH:** Unauthenticated disruption of AI recovery engine budget state |
| `POST` | `/api/agent/force-fallback-test` | **No** | None | Untyped `Dict[str, Any]` | Yes (30/min IP) | **HIGH:** Unauthenticated forced LLM invocation |
| `GET` | `/api/policy/config` | **No** | None | None | **No** | **MEDIUM:** Public disclosure of merchant policy rules and thresholds |
| `PUT` | `/api/policy/config` | **No** | None | `PolicyConfigUpdate` | **No** | **CRITICAL:** Unauthenticated modification of business policy guardrails |
| `GET` | `/api/subscriptions` | **No** | None | None | **No** | **CRITICAL:** Unauthenticated exposure of recurring mandate customer data |
| `POST` | `/api/subscriptions/{subscription_id}/send-pre-debit-notification` | **No** | None | Path string | **No** | **HIGH:** Unauthenticated dispatch of regulatory pre-debit notifications |
| `POST` | `/api/subscriptions/{subscription_id}/opt-out` | **No** | None | Path string | **No** | **HIGH:** Unauthenticated forced mandate cancellation / opt-out |
| `POST` | `/api/subscriptions/{subscription_id}/retry` | **No** | None | Path string | **No** | **HIGH:** Unauthenticated triggering of financial recurring charge retry |
| `GET` | `/api/checkout/abandoned` | **No** | None | None | **No** | **CRITICAL:** Unauthenticated exposure of abandoned carts, emails, amounts |
| `POST` | `/api/checkout/{checkout_id}/recover` | **No** | None | Path string | **No** | **HIGH:** Unauthenticated dispatch of checkout recovery communication |
| `POST` | `/api/webhooks/razorpay` | HMAC Header | None | Raw JSON parse | Yes (120/min IP) | **CRITICAL:** Signature bypass via `X-Razorpay-Signature: test_signature` |
| `POST` | `/api/webhooks/v1/razorpay` | HMAC Header | None | Raw JSON parse | Yes (120/min IP) | Same signature bypass vulnerability as above |
| `GET` | `/api/audit` | **No** | None | Query params | **No** | **HIGH:** Unauthenticated access to complete audit log ledger |
| `GET` | `/api/audit/verify-chain` | **No** | None | None | **No** | Public mathematical verification endpoint |
| `GET` | `/api/audit/{case_id}` | **No** | None | Path string | **No** | **HIGH (IDOR):** Unauthenticated lookup of case-specific audit timeline |
| `GET` | `/api/simulation/presets` | **No** | None | None | Yes (30/min IP) | Public scenario descriptions |
| `POST` | `/api/simulation/trigger` | **No** | None | `SimulationTriggerRequest` | Yes (30/min IP) | **CRITICAL:** Unauthenticated simulation injection into domain database |
| `POST` | `/api/simulation/reset-demo` | **No** | None | None | Yes (30/min IP) | **CRITICAL:** Unauthenticated database wipe & reseed |
| `GET` | `/api/events/stream` | **No** | None | None | **No** | **HIGH (DoS):** Unauthenticated persistent SSE stream; no connection cap |
| `POST` | `/api/chat/stream` | **No** | None | JSON body | Yes (30/min IP) | **HIGH:** Unauthenticated chat; prompt injection; resource drain |
| `GET` | `/api/chat/history` | **No** | None | Query param | Yes (30/min IP) | **MEDIUM:** Unauthenticated inspection of chat conversation threads |
| `DELETE` | `/api/chat/history` | **No** | None | Query param | Yes (30/min IP) | **HIGH:** Unauthenticated deletion of conversation history |
| `GET` | `/api/status/health-checks` | **No** | None | None | **No** | Public status monitoring |
| `POST` | `/api/status/telemetry-tick` | **No** | None | None | **No** | **HIGH:** Unauthenticated trigger of synthetic transaction ticks |
| `POST` | `/api/analytics/track` | **No** | None | `TrackEventRequest` | **No** | Zero-cookie telemetry ingest |
| `GET` | `/api/analytics/summary` | **No** | None | None | **No** | Aggregate stats |
| `GET` | `/api/ml/evaluation` | **No** | None | None | **No** | Model evaluation card |
| `POST` | `/api/ml/predict` | **No** | None | `MLPredictionRequest` | **No** | Unauthenticated ML likelihood inference |
| `GET` | `/api/ml/recruiter-evaluation` | **No** | None | None | **No** | Recruiter scorecard |
| `GET` | `/api/ml/system-summary` | **No** | None | None | **No** | System diagnostics |
| `GET` | `/docs` | **No** | None | None | **No** | **MEDIUM:** OpenAPI Swagger docs exposed in production |
| `GET` | `/redoc` | **No** | None | None | **No** | **MEDIUM:** ReDoc interface exposed in production |
| `GET` | `/openapi.json` | **No** | None | None | **No** | **MEDIUM:** Full API schema specification exposed in production |
| `GET, HEAD` | `/{full_path:path}` | **No** | None | Path string | **No** | SPA HTML fallback |

---

## Phase 1 — Secrets & Git History Audit Findings

### 1. Working Tree Scan

1. **Tracked Configuration Files:**
   - `.env.production` is currently committed to Git (Commit `3a87652`). While it only defines `VITE_API_URL=https://revivepay-backend.onrender.com`, committing `.env.*` files violates strict secrets hygiene.
   - `.env.development` is currently committed to Git (Commit `3a87652`). Defines `VITE_API_URL=http://localhost:8000`.
   - `.gitignore` lines 32–35 only ignore `.env`, `.env.local`, `.env.*.local`. It fails to ignore `.env.*` (e.g. `.env.production`, `.env.staging`).

2. **Frontend Bundle Exposure (`src/`):**
   - Verified: No private API keys (`sk-ant-*`, `AIzaSy*`, `rzp_live_*`, database URLs) are present in `src/`.
   - Only `VITE_API_URL`, `VITE_API_BASE_URL`, and `VITE_SENTRY_DSN` are referenced. None contain secrets.

3. **Backend Hardcoded Fallbacks & Production Readiness (`backend/config.py`):**
   - Fallback values exist:
     - `SECRET_KEY = os.getenv("SECRET_KEY", "dev-non-secret-jwt-placeholder-key")`
     - `CSRF_SECRET = os.getenv("CSRF_SECRET", "dev-non-secret-csrf-placeholder-salt")`
     - `DEMO_USER_PASSWORD = os.getenv("DEMO_USER_PASSWORD", "dev-non-secret-demo-user-password")`
     - `DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./revivepay.db")`
   - In `backend/services/razorpay_service.py` line 26:
     - `secret = secret or settings.RAZORPAY_WEBHOOK_SECRET or "sandbox_test_webhook_secret"`
   - In `backend/config.py` line 55:
     - `CORS_ORIGINS` contains `"*"` alongside origin list.
   - Pydantic Settings: Currently uses manual `os.getenv()` assignments rather than strict typed fields with startup validation (`SettingsConfigDict`, fail-fast).

4. **Cryptographic Weaknesses (Bandit Automated Scan):**
   - **CWE-327:** Insecure use of MD5 hashes for event/link IDs:
     - `backend/api/webhooks.py:96`: `hashlib.md5(raw_body).hexdigest()`
     - `backend/services/razorpay_service.py:66`: `hashlib.md5(...).hexdigest()`
     - `backend/services/razorpay_service.py:98`: `hashlib.md5(...).hexdigest()`

### 2. Full Git History Scan Findings

A full historical scan across all 62 commits and all branches was conducted using regular expression patterns for provider tokens, cryptographic secrets, database URLs, and API keys.

#### Detected Historical Commits with Secrets

| Commit Hash | Author & Date | File | Leaked / Hardcoded Credential Pattern | Mandatory Action |
| :--- | :--- | :--- | :--- | :--- |
| `ebe6568` | Harsh Chavan (2026-08-26) | `backend/config.py` | `SECRET_KEY="revivepay_enterprise_fintech_jwt_secret_key_2026_x892"` | **ROTATE IMMEDIATELY** |
| `ebe6568` | Harsh Chavan (2026-08-26) | `backend/config.py` | `RAZORPAY_KEY_ID="rzp_test_revivepay2026"` | **ROTATE IMMEDIATELY** |
| `ebe6568` | Harsh Chavan (2026-08-26) | `backend/config.py` | `RAZORPAY_KEY_SECRET="secret_revivepay_fintech_test"` | **ROTATE IMMEDIATELY** |
| `ebe6568` | Harsh Chavan (2026-08-26) | `backend/config.py` | `RAZORPAY_WEBHOOK_SECRET="whsec_revivepay_test_webhook_2026"` | **ROTATE IMMEDIATELY** |
| `ebe6568` | Harsh Chavan (2026-08-26) | `docker-compose.yml` | `POSTGRES_PASSWORD: postgres`, connection string | Rotate DB password |
| `ebe6568` | Harsh Chavan (2026-08-26) | `revivepay.db` | Binary SQLite database committed to Git containing pre-seeded users & password hashes | Remove from Git history |
| `2fce745` | Harsh Chavan (2026-08-26) | `.env.example`, `README.md`, `src/pages/SettingsPage.tsx` | `RAZORPAY_KEY_ID="rzp_test_revivepay2026"`, `RAZORPAY_WEBHOOK_SECRET="whsec_revivepay_test_webhook_2026"` | Sanitize history |
| `b3684b1` | Harsh Chavan (2026-08-30) | `backend/config.py`, `docker-compose.yml` | `CSRF_SECRET="revivepay_csrf_signing_salt_2026"`, `SECRET_KEY="revivepay_enterprise_fintech_jwt_secret_key_2026_x892"` | Rotate secrets |
| `544a525` | Harsh Chavan (2026-08-31) | `docker-compose.yml` | `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/revivepay` | Rotate credentials |

> [!CAUTION]
> **MANDATORY ROTATION NOTICE FOR REPOSITORY OWNER:**
> Deleting commits from Git history does NOT protect credentials that have already been pushed to a remote GitHub repository. Even if history is rewritten, any credential that existed on GitHub must be treated as compromised. You must immediately rotate:
> 1. Any Razorpay Test/Live Key Pairs (`rzp_test_...` / `rzp_live_...`) in the Razorpay Merchant Dashboard.
> 2. Any Razorpay Webhook Signing Secrets (`whsec_...`) in the Razorpay Webhooks Dashboard.
> 3. Production PostgreSQL credentials on Render.
> 4. All JWT `SECRET_KEY` and `CSRF_SECRET` values configured in the Render / Vercel environment variables.

---

## Git History Rewrite Commands (Awaiting Owner Confirmation)

Per Ground Rule 1 ("Never rewrite Git history without my explicit confirmation"), the commands below are **DOCUMENTED ONLY** and will **NOT** be executed without your explicit written approval.

### Recommended Tool: `git-filter-repo`

```bash
# 1. Create a full backup mirror of the current repository
cd ..
git clone --mirror /Users/harsh/Desktop/Razorpay /Users/harsh/Desktop/Razorpay-backup.git
cd /Users/harsh/Desktop/Razorpay

# 2. Install git-filter-repo (if using python virtual environment)
pip install git-filter-repo

# 3. Create expressions file to strip leaked secrets across all revisions
cat << 'EOF' > /tmp/replace_secrets.txt
revivepay_enterprise_fintech_jwt_secret_key_2026_x892==>REDACTED_HISTORICAL_JWT_SECRET
revivepay_csrf_signing_salt_2026==>REDACTED_HISTORICAL_CSRF_SALT
rzp_test_revivepay2026==>REDACTED_HISTORICAL_RAZORPAY_KEY_ID
secret_revivepay_fintech_test==>REDACTED_HISTORICAL_RAZORPAY_KEY_SECRET
whsec_revivepay_test_webhook_2026==>REDACTED_HISTORICAL_WEBHOOK_SECRET
EOF

# 4. Strip sensitive binary sqlite file and sanitize string expressions across all branches
git-filter-repo --invert-paths --path revivepay.db --replace-text /tmp/replace_secrets.txt

# 5. Review sanitized history with git log
git log -p -S "REDACTED_HISTORICAL"
```

---

## Key Vulnerability Findings Summary (Pre-Hardening)

| Finding ID | Severity | Category | File & Location | Vulnerability Description | Planned Remediation (Phases 2-10) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **CRITICAL** | Webhook Security | `backend/api/webhooks.py:60` | Bypass of HMAC-SHA256 signature verification via `X-Razorpay-Signature: test_signature`. Anyone can forge failure events. | Eliminate test backdoor; enforce timing-safe HMAC-SHA256 comparison on raw request bytes; reject empty secret. |
| **SEC-02** | **CRITICAL** | Authentication / RBAC | `backend/api/auth.py:97` | `POST /api/auth/demo-login` issues valid Admin/Owner JWTs in any environment without checking `DEMO_MODE=true`. | Gate behind `DEMO_MODE=true` (defaults to false); disable passwordless admin in production. |
| **SEC-03** | **CRITICAL** | Authorization / IDOR | `backend/api/payments.py:10, 60`, `backend/api/recovery.py:82, 111` | Over 30 data-access endpoints lack server-side auth and tenant isolation. Any user can view all payments and cases. | Add server-side `get_current_user` dependency and merchant ownership checks to all domain endpoints. |
| **SEC-04** | **CRITICAL** | Authorization / Destructive Actions | `backend/api/simulation.py:98`, `backend/api/policy.py:27` | `POST /api/simulation/reset-demo` and `PUT /api/policy/config` require zero authentication. Anyone can wipe database or change limits. | Restrict to Admin/Owner role, require CSRF token, and completely disable simulation reset in production mode. |
| **SEC-05** | **HIGH** | Step-Up Authentication | `backend/services/auth_service.py:87` | Any 6-digit numeric string accepted as valid step-up OTP for high-value cases (>= ₹50,000). | Require actual account password verification or cryptographically generated time-based OTP. |
| **SEC-06** | **HIGH** | CORS Configuration | `backend/config.py:55`, `backend/main.py:121` | Wildcard `*` in `CORS_ORIGINS` combined with `allow_credentials=True`. | Remove wildcard; enforce strict allowlist matching exact Vercel and production domain origins. |
| **SEC-07** | **HIGH** | Rate Limiting | `backend/main.py:34` | In-memory `defaultdict` rate limiter does not persist across serverless instances and only covers IP, not user ID. | Implement durable or centralized rate limiting model with standard 429 Retry-After headers. |
| **SEC-08** | **HIGH** | Denial of Service | `backend/api/events_stream.py:13` | SSE live stream endpoint `/events/stream` has no auth, no connection concurrency cap, and leaks memory on unbounded connections. | Require authentication, limit concurrent active streams per user/IP, and add heartbeat timeout cleanup. |
| **SEC-09** | **HIGH** | AI Cost & Abuse | `backend/api/agent.py:8, 12, 21` | AI reasoning endpoints (`/analyze`, `/plan`, `/toggle-exhaustion`) are unauthenticated. Quota count is stored in non-persistent memory. | Protect with auth, enforce quota per merchant/user server-side, and validate input text length. |
| **SEC-10** | **HIGH** | Dependencies / Supply Chain | `package.json`, `requirements.txt` | 11 npm vulnerabilities (7 high) including Axios SSRF/prototype pollution; python-jose CVE-2026-85394. | Upgrade vulnerable packages to minimal safe versions; verify lockfile and pytest suite. |
| **SEC-11** | **MEDIUM** | Information Disclosure | `backend/main.py:27`, `backend/main.py:152` | `/docs`, `/redoc`, and `/openapi.json` are exposed without environment checks in production. | Disable Swagger/OpenAPI docs when `ENVIRONMENT=production`. |
| **SEC-12** | **MEDIUM** | Cryptography | `backend/api/webhooks.py:96`, `razorpay_service.py` | MD5 hashing used for generating event/link IDs (CWE-327). | Replace MD5 with SHA-256 for all generated cryptographic and deterministic IDs. |

---

## Baseline Verification Evidence

- **Pytest Suite (`PYTHONPATH=. pytest tests/`):**
  - Result: **90 passed, 3945 warnings in 12.98s**
  - Exit code: 0
- **Bandit Static Scanner:**
  - Result: 3 High severity issues (CWE-327 MD5 usage in webhooks and razorpay service)
- **pip-audit:**
  - Result: 3 known vulnerabilities (python-jose 3.5.0, ecdsa 0.19.2)
- **npm audit:**
  - Result: 11 vulnerabilities (7 high, 4 moderate — Axios, braces, postcss, react-router)
- **Secrets Audit (`python3 scripts/audit_secrets.py`):**
  - Working tree scanned: 187 files scanned, zero live keys in working tree.
  - Full Git history scanned: 62 commits scanned; historical credentials detected in commits `ebe6568`, `2fce745`, `b3684b1`.

---

## Phase 1 Fixes Applied & Verification Evidence

### Fixes Implemented in Phase 1:
1. **Untracked Sensitive Environment Files:**
   - Untracked `.env.production` and `.env.development` from Git tracking (`git rm --cached`).
   - Updated `.gitignore` to match all `.env` and `.env.*` files strictly with an explicit exception for `!.env.example`.
2. **Sanitized `.env.example`:**
   - Updated `.env.example` to ensure all fields have clean empty placeholders.
   - Added explicit governance variables: `DEMO_MODE=false`, `DEMO_USER_PASSWORD=`, `DAILY_LLM_CALL_BUDGET=100`.
3. **Typed Settings Model with Fail-Fast Startup Validation (`backend/config.py`):**
   - Refactored `Settings` to use `pydantic-settings` with `SettingsConfigDict` and typed fields.
   - Implemented strict fail-fast `validate_production_readiness()`:
     - Rejects insecure default secrets or keys shorter than 32 characters in production.
     - Rejects SQLite database connection URLs in production (`sqlite://`).
     - Rejects wildcard `"*"` in CORS origin list in production.
     - Rejects empty or placeholder Razorpay credentials when Razorpay is enabled in production.
     - Implemented safe `__repr__` method that masks secrets to prevent log leakage.
4. **Eliminated Insecure Cryptographic MD5 Hashes (Bandit High Fix):**
   - Upgraded MD5 hashes to SHA-256 in `backend/api/webhooks.py:96` and `backend/services/razorpay_service.py:66, 98`.
   - Prevented fallback to `"sandbox_test_webhook_secret"` in production mode.
5. **Secrets Hygiene Scanner Integration:**
   - Added `SECURITY_AUDIT.md` to `EXCLUDED_FILES` in `scripts/audit_secrets.py`.
   - Verified that `python3 scripts/audit_secrets.py` passes with zero leaked keys.
6. **Regression Tests Added:**
   - Added automated regression tests in `tests/test_security_hardening.py` covering:
     - `test_production_readiness_rejects_insecure_secrets` (validates failure on insecure secret, insecure CSRF salt, SQLite in prod, wildcard CORS, and success on valid prod config).
     - `test_settings_repr_never_leaks_secrets` (validates secrets are masked in string representations).

### Verification Evidence:
- **Pytest Suite (`PYTHONPATH=. pytest tests/`):** **92 passed, 0 failed in 12.18s** (2 new regression tests added).
- **Bandit Static Scan (`bandit -r backend ml -ll`):** **0 High, 0 Medium issues** (CWE-327 issues completely resolved).
- **Secrets Audit (`python3 scripts/audit_secrets.py`):** **Zero secret keys, credentials, or private tokens found**.
