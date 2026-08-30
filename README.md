# ⚡ Revive AI — Autonomous Revenue Recovery & Payment Failure Resolution Platform
### *A Production-Oriented Fintech Engineering Prototype for Payment Recovery & Failure Resolution*

[![RevivePay CI Suite](https://github.com/harshchavan009/Revivepay-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/harshchavan009/Revivepay-ai/actions)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-emerald.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/tests-67%20passing-success.svg)](backend/tests/)
[![ML Model](https://img.shields.io/badge/ML%20Model-Gradient%20Boosting%20(ROC--AUC%200.81)-indigo.svg)](ml/)
[![Audit Chain](https://img.shields.io/badge/Audit%20Ledger-SHA--256%20Hash--Chained-emerald.svg)](backend/services/audit_service.py)

> **Recover Revenue Before It's Lost.**  
> Revive AI is a **production-oriented fintech engineering prototype** designed to demonstrate policy-governed autonomous revenue recovery across transient payment failures, recurring subscription dunning declines, and abandoned checkout sessions.

---

## 📖 Executive Overview

Traditional recovery systems rely on static, blind retry intervals and generic email spam. This naive approach frustrates customers, increases gateway interchange fees, triggers card-issuer fraud blocks, and accelerates customer churn.

**Revive AI** introduces an intelligent decision layer that analyzes transaction context, customer payment history, failure characteristics, empirical recovery likelihood, and merchant policies before recommending or executing a recovery action.

$$\textbf{INGEST} \longrightarrow \textbf{RISK SCORE} \longrightarrow \textbf{ML LIKELIHOOD} \longrightarrow \textbf{AI DIAGNOSIS} \longrightarrow \textbf{POLICY GATE} \longrightarrow \textbf{EXECUTE} \longrightarrow \textbf{VERIFY} \longrightarrow \textbf{AUDIT}$$

### 🎯 Core Objectives
- **Reduce Revenue Loss**: Recover up to $65\%+$ of failed payment volume through intelligent retries and optimized communication links.
- **Explainable Autonomous Actions**: Answer *what* should happen next, *why*, *whether the action is allowed by policy*, and *whether the settlement actually succeeded*.
- **Bounded Autonomy**: Separate generative AI reasoning from deterministic financial rules, ensuring the LLM cannot execute financial actions without passing strict policy gates.
- **Cryptographic Auditability**: Every decision, evaluation, and state transition is immutably recorded in a SHA-256 hash-chained ledger.
- **Genuine Gateway Integration**: End-to-end webhook ingestion with timing-safe HMAC-SHA256 signature validation in Razorpay Test Mode.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    A[Payment Declines / Webhook Ingestion] --> B[Razorpay Test Mode / HMAC-SHA256 Ingestion]
    B --> C[4-Factor Revenue Risk Engine]
    C --> D[Calibrated ML Recovery Likelihood Model]
    D --> E[Multi-Tier AI Root-Cause Reasoner]
    E --> F{Deterministic Policy & Safety Gateway}
    F -- Action Blocked --> G[Safe Escalation / Human Review Queue]
    F -- Auto-Approved (Low Risk) --> H[Execute Bounded Recovery Action]
    F -- High Value >= ₹50k / Low Confidence --> I[Human-in-the-Loop Approval Center]
    I -- Approved (Step-Up Re-Auth) --> H
    I -- Rejected --> G
    H --> J[Dedicated Outcome Verification Service]
    J -- Settlement Confirmed --> K[Mark RECOVERED & Update Revenue Metrics]
    J -- Settlement Failed --> G
    K --> L[SHA-256 Hash-Chained Cryptographic Audit Ledger]
    L --> M[Server-Sent Events (SSE) Live Broadcast Stream]
    M --> N[Executive Command Center & System Evaluation Diagnostics]
```

---

## 🚀 Key Platform Capabilities

### 1. 🧠 Multi-Tier AI Root-Cause Reasoning
Revive AI uses contextual LLMs to interpret error strings, customer tenure, gateway codes, and merchant policies into actionable structured recovery plans.
- **Structured Pydantic Validation**: Guarantees schema conformance ($100\%$ type safety); rejects malformed model outputs.
- **3-Tier Failover Hierarchy**:
  - **Tier 1 (Primary)**: Anthropic Claude 3.5 Sonnet for deep contextual reasoning.
  - **Tier 2 (Secondary)**: Google Gemini 1.5 Pro for rapid automatic failover.
  - **Tier 3 (Safe Floor)**: Local Deterministic Rules Engine for zero external dependency fail-safety.
- **Bounded Actions Only**:
  `retry_payment`, `create_payment_link`, `send_customer_notification`, `trigger_checkout_reminder`, `request_payment_method_update`, `escalate_to_merchant`, `stop_recovery`.

### 2. 📊 Deterministic Revenue Risk Scoring Engine
Before AI diagnosis, every case is evaluated by a deterministic 4-factor scoring formula ($0 \text{ to } 100$):

$$\text{Risk Score} = 0.35 \times \text{Value Factor} + 0.25 \times \text{Recovery Likelihood} + 0.20 \times \text{Customer History} + 0.20 \times \text{Failure Severity}$$

| Score Range | Risk Level | Governance Action |
| :--- | :--- | :--- |
| **0 – 29** | `LOW` | Eligible for automated autonomous execution |
| **30 – 59** | `MEDIUM` | Standard policy-guided routing |
| **60 – 79** | `HIGH` | Operator review recommended |
| **80 – 100** | `CRITICAL` | Mandatory human authorization required |

### 3. 🤖 Empirical ML Recovery Likelihood Classifier (`ml/`)
An independent machine learning pipeline trained on synthetic multi-pattern transaction telemetry estimates the empirical probability of recovery: $P(\text{recovery\_success})$.
- **Algorithm**: `CalibratedClassifierCV(GradientBoostingClassifier, cv=5, method='isotonic')`
- **10 Candidate Signals**: `transaction_amount`, `failure_category_encoded`, `payment_method_encoded`, `customer_success_rate`, `customer_failure_rate`, `retry_count`, `customer_tenure_days`, `is_subscription`, `previous_recovery_success`, `checkout_intent_score`.
- **Empirical Diagnostics**:
  - **ROC-AUC**: `0.8094`
  - **F1 Score**: `0.8702`
  - **Precision**: `0.8146` | **Recall**: `0.9341`
  - **Brier Score**: `0.1401` (Well-calibrated probability floor)

### 4. 🛡️ Deterministic Policy & Safety Gateway
Every recommended action must pass 10+ deterministic safety invariants before execution:
- `IF retry_count >= max_retries` $\rightarrow$ **BLOCK & ESCALATE**
- `IF payment_status == SUCCESS` $\rightarrow$ **BLOCK (Never retry settled payments)**
- `IF failure_type == PERMANENT` (e.g. stolen card, fraud) $\rightarrow$ **BLOCK RETRY**
- `IF customer_opted_out == TRUE` $\rightarrow$ **BLOCK CUSTOMER NOTIFICATIONS**
- `IF amount >= ₹50,000` $\rightarrow$ **REQUIRE MANDATORY STEP-UP HUMAN RE-AUTHENTICATION**
- `IF ai_confidence < 0.70` $\rightarrow$ **REQUIRE HUMAN REVIEW**

### 5. 🔎 Cryptographic SHA-256 Hash-Chained Audit Ledger
Every state transition is linked to its predecessor via cryptographic hashing:

$$\text{entry\_hash} = \text{SHA-256}(\text{previous\_hash} + \text{audit\_id} + \text{timestamp} + \text{actor} + \text{action} + \text{case\_id} + \text{notes})$$

- **Tamper Evident**: Modifying any past record breaks the cryptographic chain.
- **Verification Endpoint**: `GET /api/audit/verify-chain` verifies the entire database ledger from genesis to head in $<5\text{ms}$.

### 6. 🔬 Dedicated Outcome Verification Service
- Isolates payment settlement verification before committing `RECOVERED` state.
- Asserts provider transaction IDs, capture state, currency, and exact amount matching.
- **Recovered revenue metrics only update after verified settlement**.

### 7. ⚖️ RBI Guidance Reference Implementations (Published Guidelines)
- **Turn Around Time (TAT) Framework (RBI/2019-20/67)**: Calculates statutory auto-reversal deadlines (UPI $T+1$, Card $T+5$ working days), accrues ₹100/day statutory compensation on breaches, and auto-escalates overdue cases.
- **e-Mandate 24-Hour Pre-Debit Window**: Enforces mandatory 24-hour pre-debit notifications and processes customer opt-out cancellations.

---

## 🚦 Recovery State Machine

The backend recovery lifecycle follows 12 explicit, non-overlapping states:

```mermaid
stateDiagram-v2
    [*] --> NEW
    NEW --> ANALYZING: Ingest & Scored
    ANALYZING --> ACTION_RECOMMENDED: AI Diagnosed
    ACTION_RECOMMENDED --> AWAITING_APPROVAL: Policy High-Value / Low Conf
    ACTION_RECOMMENDED --> APPROVED: Policy Auto-Approved
    AWAITING_APPROVAL --> APPROVED: Operator Human Approval
    AWAITING_APPROVAL --> REJECTED: Operator Rejection
    APPROVED --> EXECUTING: Dispatch Action
    EXECUTING --> VERIFYING: Provider Callback
    VERIFYING --> RECOVERED: Settlement Verified
    VERIFYING --> FAILED: Provider Error / Timeout
    FAILED --> ESCALATED: Max Retries Exhausted
    FAILED --> STOPPED: Terminal Failure / Expired
    REJECTED --> STOPPED
    RECOVERED --> [*]
    ESCALATED --> [*]
    STOPPED --> [*]
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Backend API** | FastAPI 0.115, Python 3.11+, Pydantic v2, Uvicorn (ASGI) |
| **Database & ORM** | PostgreSQL 16 (Production) / SQLite (Dev), SQLAlchemy 2.0, Alembic |
| **Machine Learning** | Scikit-learn (Calibrated Gradient Boosting), NumPy, Pandas, Joblib |
| **AI Reasoning** | Multi-Tier Orchestrator: Anthropic Claude 3.5 Sonnet $\rightarrow$ Google Gemini 1.5 Pro $\rightarrow$ Deterministic Rules |
| **Gateway Integration** | Razorpay Test Mode API, HMAC-SHA256 Webhook Ingestion & Idempotency Filter |
| **Observability & Audit**| SHA-256 Hash-Chained Audit Ledger, Server-Sent Events (SSE) Live Feed, Structured Logging |
| **Containerization** | Docker, Docker Compose, Nginx (Frontend Reverse Proxy) |
| **CI / CD** | GitHub Actions (Lint, ML Calibration, Secrets Hygiene Audit, 67 Pytest Suite) |

---

## 📁 Repository Directory Structure

```text
.
├── backend/
│   ├── api/                     # FastAPI route handlers (auth, recovery, webhooks, ml)
│   ├── events/                  # Canonical event taxonomy & validator
│   ├── models/                  # 11 SQLAlchemy domain entities
│   ├── schemas/                 # Pydantic v2 response & request schemas
│   ├── services/                # Core domain business logic
│   │   ├── razorpay_service.py  # HMAC-SHA256 verification & test API client
│   │   ├── recovery_engine.py   # Recovery orchestration & state machine
│   │   ├── risk_engine.py       # 4-factor deterministic risk scorer
│   │   ├── ai_agent.py          # 3-tier multi-LLM root-cause reasoner
│   │   ├── policy_gateway.py    # Deterministic safety rules gateway
│   │   ├── outcome_verification_service.py # Settlement verification
│   │   └── audit_service.py     # SHA-256 hash-chain builder
│   ├── tests/                   # 67 Pytest backend integration tests
│   ├── database.py              # SQLAlchemy connection pooling & SessionLocal
│   ├── config.py                # Pydantic settings & environment configuration
│   └── main.py                  # FastAPI application entrypoint & middleware
├── ml/
│   ├── train.py                 # Calibrated model training script
│   ├── evaluate.py              # Model evaluation & classification report
│   ├── predict.py               # Real-time inference service
│   ├── model_registry.py        # Feature metadata & artifact paths
│   └── artifacts/               # Serialized .joblib & evaluation .json
├── alembic/                     # Alembic database migration scripts
├── src/
│   ├── components/              # Header, Sidebar, ErrorBoundary, LiveTicker
│   ├── context/                 # AuthContext, MetricsContext, ThemeContext
│   ├── pages/                   # 27 Production pages (Dashboard, Cases, etc.)
│   │   ├── DashboardPage.tsx    # Executive KPIs & real-time telemetry
│   │   ├── SystemEvaluationPage.tsx # Live ML diagnostics & playground
│   │   ├── RecoveryCasesPage.tsx# Recovery registry & TAT breach badges
│   │   ├── HardeningLogPage.tsx # Issues found and fixed log
│   │   └── ApprovalCenterPage.tsx# Human-in-the-loop review queue
│   ├── services/                # Centralized typed Axios API clients
│   └── utils/errorTracking.ts   # Client telemetry & error instrumentation
├── Dockerfile.backend           # Container configuration for FastAPI
├── Dockerfile.frontend          # Container configuration for Vite / Nginx
├── docker-compose.yml           # Multi-service stack (PostgreSQL + API + UI)
├── .github/workflows/ci.yml     # Automated CI pipeline
├── .env.example                 # Production configuration template
├── package.json                 # Node.js dependencies
└── README.md                    # Project documentation
```

---

## 🛠️ Production Hardening Log (Issues Found & Fixed)

A chronological record of genuine security, honesty, consistency, and architecture fixes implemented during platform hardening:

| Date | Category | Issue Identified | Why It Mattered (Risk / Impact) | Engineering Fix Enforced | Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Aug 2026** | **Security** | Demo Credential Exposure (Hardcoded Secret Tokens) | Plaintext credentials in client bundles expose backend APIs to credential theft and unauthorized mutation. | Migrated to server-side bcrypt (12 rounds) persona login with automated secrets hygiene scanner in CI pipeline. | `VERIFIED` |
| **Aug 2026** | **Honesty & Framing** | LIVE / TEST Label Contradiction & Provenance Ambiguity | Inconsistent labels break credibility when presenting to technical evaluators and reviewers. | Enforced strict source provenance tags (`RAZORPAY_TEST` vs. `SIMULATION`) across all models, badges, and filters. | `VERIFIED` |
| **Aug 2026** | **Data Integrity** | Case-Count Divergence (Dashboard vs. Registry Mismatch) | Two different totals for the same dataset breaks user trust in the platform's telemetry. | Unified database query with default `limit=1000` and shared `GET /api/recovery/count` canonical endpoint. | `VERIFIED` |
| **Aug 2026** | **Honesty & Framing** | Unverifiable Regulatory Badging ('RBI Certified' Copy) | RBI does not certify software products; claiming official certification creates legal and credibility risks. | Replaced marketing copy with honest educational reference implementations of RBI circulars (RBI/2019-20/67). | `VERIFIED` |
| **Aug 2026** | **Security** | High-Value Transaction Execution Without Step-Up Verification | Automated execution on transactions >= ₹50,000 without MFA creates substantial financial blast-radius risk. | Implemented mandatory Step-Up Re-Authentication (OTP/password verification) logging distinct audit events. | `VERIFIED` |

---

## 👥 Pre-Seeded Personas & RBAC

The platform includes 4 pre-configured personas with secure server-side bcrypt password verification for testing role-based access control:

| Persona | Email | Assigned Role | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Merchant Owner** | `owner@revivepay.ai` | `MERCHANT_OWNER` | Policy configuration, revenue analytics, payout views |
| **Revenue Operator** | `operator@revivepay.ai` | `REVENUE_OPERATOR` | Approve/reject cases, execute retries, simulations |
| **Support Operator** | `support@revivepay.ai` | `SUPPORT_OPERATOR` | Read-only investigation, customer communications |
| **Admin** | `admin@revivepay.ai` | `ADMIN` | Platform administration, webhook key management |

> **Note on Authentication**: Demo accounts use standard sandbox evaluation passwords seeded via environment configuration (`.env`). In production deployments, Revive AI delegates authentication to enterprise SAML 2.0 / OIDC identity providers with enforced Multi-Factor Authentication (MFA).

---

## ⚙️ Quickstart & Local Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (Optional)

### Option 1: Local Development

```bash
# 1. Clone the repository
git clone https://github.com/harshchavan009/Revivepay-ai.git
cd Revivepay-ai

# 2. Configure Environment
cp .env.example .env

# 3. Setup Python Backend Virtual Environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# 4. Train & Validate ML Recovery Model
PYTHONPATH=. python3 ml/train.py
PYTHONPATH=. python3 ml/evaluate.py

# 5. Run Database Migrations
PYTHONPATH=. alembic upgrade head

# 6. Run Test Suite (60 tests)
PYTHONPATH=. pytest backend/tests -v

# 7. Start FastAPI Backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

In a new terminal window:
```bash
# 8. Install and Start Frontend
npm install
npm run dev
```

### Option 2: Docker Compose (Full Stack with PostgreSQL)

```bash
docker compose up --build -d
```

### Application URLs:
- **Frontend Command Center**: `http://localhost:5173` (or `http://localhost` via Docker)
- **System Evaluation & ML Diagnostics**: `http://localhost:5173/evaluation`
- **Backend Swagger UI**: `http://localhost:8000/docs`
- **Live Event Stream (SSE)**: `http://localhost:8000/api/events/stream`
- **Audit Chain Verification**: `http://localhost:8000/api/audit/verify-chain`

---

## 🧪 Testing & Quality Invariants

Revive AI enforces 67 automated tests across all domain invariants:

```bash
PYTHONPATH=. pytest backend/tests/ -v -W ignore
```

### Critical Invariants Verified:
- `test_retry_count_never_exceeds_max_retries`: Strict boundary enforcement.
- `test_payment_marked_success_cannot_be_retried`: Settled payments are immutable.
- `test_recovery_case_counts_are_strictly_consistent`: Registry and dashboard counters match identically.
- `test_razorpay_hmac_sha256_verification`: Cryptographic signature verification.
- `test_step_up_auth_required_for_high_value_cases`: Transactions $\ge$ ₹50,000 enforce re-authentication.
- `test_tat_breach_detection_and_compensation_calculation`: Auto-calculates ₹100/day compensation on overdue cases.
- `test_outcome_verification_success`: Requires provider transaction reference before marking `RECOVERED`.
- `test_chaos_tampered_webhook_simulation`: Forged webhook signatures rejected with HTTP 401 and logged as security defense.

---

## 🔒 Security & Secrets Hygiene

- **Zero Plaintext Credentials in Source**: All secrets loaded from environment variables (`.env`).
- **Cryptographic Hashing**: User authentication verified via `bcrypt` ($12$ rounds).
- **Session Protection**: Short-lived JWTs ($15$ min) + httpOnly, Secure, SameSite=Strict refresh cookies.
- **CSRF Defense**: State-changing operations validate cryptographic double-submit cookies.
- **Anti-Abuse Rate Limiting**: Sliding window limiter on `/api/auth/*` ($15/\text{min}$), `/api/webhooks/*` ($120/\text{min}$), and `/api/chat` ($30/\text{min}$).
- **Security Headers**: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=31536000`.

---

## ⚖️ Operational Scope & Disclaimers

1. **Sandbox Environment**: All Razorpay gateway interactions run against **Razorpay Test Mode** (`rzp_test_...`). No real fiat currency or bank debiting occurs.
2. **Synthetic ML Evaluation Data**: The calibrated gradient boosting recovery classifier was trained and evaluated on 1,000 synthetic transaction records modeling representative banking and card-network failure patterns in the Indian payments ecosystem.
3. **Educational Reference Implementation**: References to published Reserve Bank of India (RBI) Turn Around Time (TAT) framework (RBI/2019-20/67) and e-Mandate circulars are educational reference implementations of public guidelines and do not constitute official regulatory certification.
4. **Engineering Prototype**: Revive AI is an open-source fintech engineering prototype created by **Harsh Chavan** to demonstrate enterprise-grade revenue recovery architecture.

---

## 👨‍💻 Author

**Harsh Chavan**  
*B.Tech in Computer Science Engineering (Artificial Intelligence & Machine Learning)*  
- 🐙 **GitHub**: [github.com/harshchavan009](https://github.com/harshchavan009)  
- 💼 **Project Repository**: [github.com/harshchavan009/Revivepay-ai](https://github.com/harshchavan009/Revivepay-ai)

---

## 📄 License
This project is open-sourced under the **MIT License**.
