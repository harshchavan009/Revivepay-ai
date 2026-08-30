# ⚡ RevivePay AI — Autonomous Payment Failure Recovery Platform

[![RevivePay CI Suite](https://github.com/harshchavan009/Revivepay-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/harshchavan009/Revivepay-ai/actions)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-emerald.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/tests-60%20passing-success.svg)](backend/tests/)
[![ML Model](https://img.shields.io/badge/ML%20Model-Gradient%20Boosting%20(ROC--AUC%200.81)-indigo.svg)](ml/)

> **Recover Revenue Before It's Lost.**  
> Production-grade, policy-governed autonomous revenue recovery engine with empirical ML recovery likelihood modeling, cryptographic hash-chained audit trails, real-time telemetry streaming, reference implementations of published RBI guidelines, and genuine Razorpay test mode integration.

---

## 🌟 Executive Overview

**RevivePay AI** is an open-source engineering project by **Harsh Chavan** exploring autonomous financial recovery architectures. Instead of treating payment declines with naive, blind retries, RevivePay implements an intelligent, policy-governed autonomous recovery lifecycle:

$$\textbf{INGEST} \longrightarrow \textbf{RISK SCORE} \longrightarrow \textbf{ML LIKELIHOOD} \longrightarrow \textbf{AI DIAGNOSIS} \longrightarrow \textbf{POLICY GATE} \longrightarrow \textbf{EXECUTE} \longrightarrow \textbf{VERIFY} \longrightarrow \textbf{AUDIT}$$

### 🎯 Key Design Principles
- **Bank-Grade Credibility**: Real database persistence, real JWT auth with role enforcement, and cryptographic block verification.
- **Calibrated ML Likelihood Model**: Real scikit-learn Gradient Boosting Classifier predicting $P(\text{recovery\_success})$ with isotonic probability calibration (ROC-AUC: 0.81, F1: 0.87).
- **Dedicated Outcome Verification**: Isolated settlement verification service enforcing amount matching and provider transaction ID integrity before committing recovery.
- **Deterministic Policy Guardrails**: Bounded retries, amount thresholds, and mandatory Human-in-the-Loop review queues for high-risk actions.
- **RBI Guidance Reference Implementation**: Working reference implementations of RBI Turn Around Time (RBI/2019-20/67) ₹100/day compensation framework and e-Mandate 24-hour pre-debit notifications.
- **Single Source of Truth**: Unified domain models across payments, recovery cases, subscriptions, and audit logs.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    A[Payment / Webhook Ingestion] --> B[Razorpay Test Mode / HMAC-SHA256 Verification]
    B --> C[4-Factor Revenue Risk Engine]
    C --> D[Calibrated ML Recovery Likelihood Model]
    D --> E[Multi-Tier AI Root-Cause Reasoner]
    E --> F{Deterministic Policy & Safety Gateway}
    F -- Action Blocked --> G[Safe Escalation / Human Review Queue]
    F -- Auto-Approved (Low Risk) --> H[Execute Recovery Action]
    F -- High Value / Low Confidence --> I[Human Approval Queue]
    I -- Approved (Step-Up Auth >= ₹50k) --> H
    I -- Rejected --> G
    H --> J[Dedicated Outcome Verification Service]
    J -- Settlement Verified --> K[Mark RECOVERED & Update Revenue Metrics]
    J -- Verification Failed --> G
    K --> L[SHA-256 Hash-Chained Cryptographic Audit Ledger]
    L --> M[Server-Sent Events (SSE) Live Broadcast]
    M --> N[Executive Command Center & System Evaluation View]
```

---

## 🤖 Machine Learning Recovery Likelihood Engine (`ml/`)

RevivePay incorporates a calibrated Machine Learning classifier predicting the empirical probability of payment recovery:

- **Model Architecture**: `CalibratedClassifierCV(GradientBoostingClassifier, cv=5, method='isotonic')`
- **Candidate Features (10 signals)**:
  1. `transaction_amount` (INR)
  2. `failure_category_encoded` (Switch outage, network timeout, insufficient funds, expired card)
  3. `payment_method_encoded` (UPI, Card, Netbanking, Wallet, EMI)
  4. `customer_success_rate` & `customer_failure_rate`
  5. `retry_count` (Current attempt number)
  6. `customer_tenure_days`
  7. `is_subscription` (Recurring mandate vs one-off checkout)
  8. `previous_recovery_success` (Historical dunning response)
  9. `checkout_intent_score` (Cart engagement intensity)
- **Empirical Test Metrics**:
  - **ROC-AUC Score**: `0.8094`
  - **F1 Score**: `0.8702`
  - **Precision**: `0.8146` | **Recall**: `0.9341`
  - **Brier Calibration Score**: `0.1401` (Well-calibrated probability floor)

---

## 🔐 Cryptographic Hash-Chained Audit Log

Every state transition and decision in RevivePay is cryptographically linked to its predecessor:

$$\text{entry\_hash} = \text{SHA-256}(\text{previous\_hash} + \text{audit\_id} + \text{timestamp} + \text{actor} + \text{action} + \text{case\_id} + \text{notes})$$

- **Append-Only**: Altering any past block invalidates all downstream hashes.
- **Verification Endpoint**: `/api/audit/verify-chain` verifies the entire ledger from genesis to head in $<5\text{ms}$.

---

## 📐 Deterministic Risk Scoring Formula

The **Revenue Risk Engine** computes a numerical risk score ($0 \text{ to } 100$) combining transaction impact and ML recoverability:

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
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (Optional for containerized PostgreSQL)

### 1. Local Development Setup
```bash
# Clone the repository
git clone https://github.com/harshchavan009/Revivepay-ai.git
cd Revivepay-ai

# Environment Setup
cp .env.example .env

# Install Backend Dependencies
python3 -m pip install -r backend/requirements.txt

# Run ML Model Training & Evaluation
PYTHONPATH=. python3 ml/train.py
PYTHONPATH=. python3 ml/evaluate.py

# Run Database Migrations via Alembic
PYTHONPATH=. alembic upgrade head

# Run Backend Test Suite (60 tests)
PYTHONPATH=. pytest backend/tests -v

# Start FastAPI Backend Server
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
npm install
npm run build
npm run dev
```

### 3. Docker Compose (Full Stack with PostgreSQL)
```bash
docker compose up --build -d
```

The application will be accessible at:
- **Frontend Dashboard**: `http://localhost:5173` (or `http://localhost` via Docker)
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`
- **System Evaluation & ML Diagnostics**: `http://localhost:5173/evaluation`
- **Live Event Stream (SSE)**: `http://localhost:8000/api/events/stream`
- **Cryptographic Audit Check**: `http://localhost:8000/api/audit/verify-chain`

---

## 🔒 Security Hardening & Enterprise Governance

1. **Short-Lived JWTs & Secure Session Lifecycle**: 15-minute access tokens + 7-day httpOnly refresh cookies with automated renewal.
2. **Step-Up Re-Authentication**: Actions $\ge$ ₹50,000 require password/MFA re-verification before approval, logged as `recovery.approval.stepup_verified`.
3. **Rate Limiting Controls**: Sliding-window limiter on `/api/auth/*` (15/min), `/api/webhooks/*` (120/min), and `/api/chat` (30/min).
4. **Timing-Safe HMAC-SHA256 Webhooks**: `hmac.compare_digest` cryptographic signature verification on Razorpay events.
5. **Database Idempotency**: Strict deduplication preventing duplicate event ingestion or execution.

---

## ⚖️ Honest Disclaimers & Limitations
- **Sandbox Environment**: All Razorpay interactions utilize Razorpay Test Mode keys (`rzp_test_...`). No real fiat currency or bank debiting occurs.
- **Reference Implementation**: References to published RBI Turn Around Time (TAT) and e-Mandate circulars are educational reference implementations of public guidelines and do not constitute regulatory endorsement or certification.
