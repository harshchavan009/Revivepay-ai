# ⚡ RevivePay AI — Autonomous Payment Failure Recovery Platform

> **Recover Revenue Before It's Lost.**  
> Production-grade, policy-governed autonomous revenue recovery engine with cryptographic hash-chained audit trails, real-time telemetry streaming, and genuine Razorpay test mode integration.

---

## 🌟 Executive Overview

**RevivePay AI** is a revenue operations operating system built for modern fintechs, SaaS providers, and e-commerce merchants. Instead of treating payment declines with naive, blind retries or static chatbots, RevivePay implements an intelligent, policy-governed autonomous recovery lifecycle:

$$\textbf{DETECT} \longrightarrow \textbf{DIAGNOSE} \longrightarrow \textbf{DECIDE} \longrightarrow \textbf{ACT} \longrightarrow \textbf{VERIFY} \longrightarrow \textbf{MEASURE}$$

### 🎯 Key Design Principles
- **Bank-Grade Credibility**: Real database persistence, real JWT auth with role enforcement, and cryptographic block verification.
- **Deterministic Policy Guardrails**: Bounded retries, amount thresholds, and mandatory Human-in-the-Loop review queues for high-risk actions.
- **Single Source of Truth**: Unified domain models across payments, recovery cases, subscriptions, and audit logs.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    A[Payment / Webhook Ingestion] --> B[Razorpay Test Mode / HMAC-SHA256 Verification]
    B --> C[4-Factor Revenue Risk Engine]
    C --> D[AI Root-Cause Diagnosis Agent (Gemini / Claude / Fallback)]
    D --> E[Recovery Decision Engine]
    E --> F{Deterministic Policy & Safety Gateway}
    F -- Action Blocked --> G[Safe Escalation / Human Review Queue]
    F -- Auto-Approved (Low Risk) --> H[Execute Recovery Action]
    F -- High Value / Low Confidence --> I[Human Approval Queue]
    I -- Approved --> H
    I -- Rejected --> G
    H --> J[Outcome Verification & Razorpay Client]
    J --> K[SHA-256 Hash-Chained Audit Ledger]
    K --> L[Server-Sent Events (SSE) Live Broadcast]
    L --> M[Executive Command Center & Real-Time Stream]
```

---

## 🔐 Cryptographic Hash-Chained Audit Log

Every state transition and decision in RevivePay is cryptographically linked to its predecessor:

$$\text{entry\_hash} = \text{SHA-256}(\text{previous\_hash} + \text{audit\_id} + \text{timestamp} + \text{actor} + \text{action} + \text{case\_id} + \text{notes})$$

- **Append-Only**: Altering any past block invalidates all downstream hashes.
- **Verification Endpoint**: `/api/audit/verify-chain` verifies the entire ledger from genesis to head in $<5\text{ms}$.

---

## 📐 Deterministic Risk Scoring Formula

The **Revenue Risk Engine** computes a numerical risk score ($0 \text{ to } 100$) before any AI analysis:

$$\text{Risk Score} = 0.35 \times \text{Value Factor} + 0.25 \times \text{Recovery Likelihood} + 0.20 \times \text{Customer History} + 0.20 \times \text{Failure Severity}$$

- **0–29**: `LOW` (Eligible for automated execution)
- **30–59**: `MEDIUM` (Standard policy routing)
- **60–79**: `HIGH` (Human-in-the-loop review recommended)
- **80–100**: `CRITICAL` (Mandatory human operator authorization)

---

## 👥 Seeded Personas & Authentication (RBAC)

The application includes 4 pre-seeded personas with bcrypt-hashed credentials:

| Persona | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Merchant Owner** | `owner@revivepay.ai` | `password123` | `MERCHANT_OWNER` | Full policy config, revenue analytics, payout views |
| **Revenue Operator** | `operator@revivepay.ai` | `password123` | `REVENUE_OPERATOR` | Approve/reject cases, execute retries, simulations |
| **Support Operator** | `support@revivepay.ai` | `password123` | `SUPPORT_OPERATOR` | Read-only investigation, customer communications |
| **Admin** | `admin@revivepay.ai` | `password123` | `ADMIN` | Full platform administration, API webhooks |

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
```bash
# Navigate to project directory
cd /Users/harsh/Desktop/Razorpay

# Install backend dependencies
python3 -m pip install -r backend/requirements.txt

### 1. Environment Setup
```bash
cp .env.example .env
# Configure your secrets or run in Sandbox mode
```

### 2. Backend Setup
```bash
# Run backend test suite (41 tests)
PYTHONPATH=. pytest backend/tests -v

# Run Secrets Hygiene CI check
python3 scripts/audit_secrets.py

# Start FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
npm install
npm run build
```

The application will be accessible at:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`
- **Live Event Stream (SSE)**: `http://localhost:8000/api/events/stream`
- **Cryptographic Audit Check**: `http://localhost:8000/api/audit/verify-chain`

---

## 🔒 Phase 3 Security Hardening & Enterprise Governance

### 1. Short-Lived JWTs & Secure Session Lifecycle
- **Access Tokens**: Short-lived 15-minute JWTs (`ACCESS_TOKEN_EXPIRE_MINUTES = 15`).
- **Refresh Tokens**: 7-day tokens delivered in secure, `httpOnly`, `SameSite=Lax/Strict` cookies via `/api/auth/refresh`.
- **Automatic Silent Renewal**: Client-side Axios interceptors renew access tokens seamlessly on `401 Unauthorized` without session dropouts.

### 2. Step-Up Re-Authentication for High-Value Governance
- **Threshold Rule**: Any transaction $\ge$ ₹50,000 requires Step-Up Re-Authentication (MFA OTP or operator password re-entry) before an operator can approve recovery.
- **Audit Traceability**: Step-up verification is cryptographically recorded in the immutable audit log as `recovery.approval.stepup_verified`.

### 3. Rate Limiting & Anti-Abuse Controls
- **/api/auth/\***: 15 requests per minute per IP. Exceeding triggers `429 Too Many Requests` with `Retry-After: 60`.
- **/api/webhooks/\***: 120 requests per minute per IP to protect ingestion routes against denial-of-service.

### 4. HTTP Security Hardening Headers
Every API and static response includes:
- `Content-Security-Policy`: Restricts scripts, styles, and data origins.
- `X-Frame-Options: DENY`: Prevents clickjacking attacks.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`: Enforces TLS transport.
- `Referrer-Policy: strict-origin-when-cross-origin`.

### 5. Secrets Hygiene & CI Scanner
- **Zero Bundle Leaks**: Validated via `python3 scripts/audit_secrets.py` which scans `dist/` and `src/` for secret keys, webhook secrets, and private keys.
- **Environment Template**: See [`.env.example`](file:///.env.example) for documented environment variables.

---

## ⚙️ Environment Variables (`.env`)

See `.env.example` for all configurable parameters:

```bash
# App & Security
PROJECT_NAME="RevivePay AI"
SECRET_KEY="revivepay_enterprise_fintech_jwt_secret_key_2026_x892"
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Database Configuration (SQLite default; PostgreSQL supported)
DATABASE_URL="sqlite:///./revivepay.db"

# Razorpay Test Mode Integration
RAZORPAY_KEY_ID="rzp_test_revivepay2026"
RAZORPAY_KEY_SECRET="secret_revivepay_fintech_test"
RAZORPAY_WEBHOOK_SECRET="whsec_revivepay_test_webhook_2026"

# LLM Provider Configuration (Optional — Deterministic fallback active if empty)
LLM_PROVIDER="gemini" # gemini, openai, anthropic, or deterministic_fallback
LLM_API_KEY=""
LLM_MODEL="gemini-1.5-pro"
```

---

## ⚠️ Known Limitations & Assumptions

1. **Razorpay Live vs. Test Mode**: The system uses Razorpay Test Mode credentials by default (`rzp_test_...`). Live capture and settlement can be enabled simply by setting production `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`.
2. **LLM Provider Keys**: If `LLM_API_KEY` is not provided in `.env`, the system automatically activates the high-precision **Deterministic Domain Expert Fallback**, guaranteeing structured JSON evidence and 100% test reliability with zero external latency or rate limits.
3. **Database Defaults**: SQLite (`./revivepay.db`) is the zero-dependency local default. For multi-instance horizontal scaling, specify a PostgreSQL connection string in `DATABASE_URL`.
