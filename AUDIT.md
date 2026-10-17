# RevivePay AI — Production Readiness & Security Audit Report (Phase 1)

> **Document Type:** Production Readiness, Security & Compliance Audit  
> **Status:** AUDIT COMPLETE — ZERO CODE MODIFICATIONS IN THIS PHASE  
> **Repository:** `Revivepay-ai`  
> **Date:** October 18, 2026  
> **Target Scope:** Turn RevivePay AI from a demo/prototype into a production-grade, multi-tenant B2B SaaS for payment-failure recovery.

---

## Executive Summary

RevivePay AI was built as an institutional fintech engineering prototype demonstrating deterministic policy-gated payment recovery, HMAC-SHA256 webhook ingestion, cryptographic hash-chain audit logging, and multi-tier LLM reasoning. While the foundation exhibits strong architectural principles, transitioning into a production-grade B2B SaaS requires remediating significant architectural gaps:
1. **Pervasive Mock Data & Hardcoded Fallbacks:** Hardcoded fallback datasets in `src/data/mockData.ts`, `src/services/index.ts`, `src/pages/AnalyticsPage.tsx`, and `backend/api/status.py` violate the zero-fake-data non-negotiable rule.
2. **Missing Server-Side Authentication & Tenant Boundary:** More than 20 API endpoints lack mandatory server-side authentication (`get_current_user`), relying on `get_current_user_optional` which defaults to permitting global cross-tenant access.
3. **Multi-Tenancy Isolation Deficits:** Models like `Subscription`, `AbandonedCheckout`, `AuditLog`, `PaymentEvent`, and `WebhookEvent` lack direct `org_id` / `merchant_id` foreign keys, and PostgreSQL Row-Level Security (RLS) is not yet active.
4. **Unencrypted Credentials at Rest:** Gateway keys (`razorpay_key_id`, `razorpay_key_secret`) are stored in plaintext columns on the `merchants` table rather than encrypted with AES-256-GCM using a master KMS/env key.
5. **Float-Based Currency Math:** Currency values are represented and summed using standard floating-point numbers (`Float`) instead of integer paise.
6. **Regulatory Compliance Badge Misalignments:** Unsubstantiated claims referencing SOC-2, ISO 27001, and RBI certifications appear in marketing and architecture copy.
7. **Legacy Palette Residuals:** Isolated components and views still use ad-hoc `orange-*`, `amber-*`, and legacy `cyan` aliases rather than strict tokenized institutional indigo/blue design tokens.

The exhaustive findings across the seven mandatory audit dimensions are detailed below with exact file paths and line numbers.

---

## 1. Hard-Coded or Mock Values (File & Line)

### 1.1 Frontend Mock Data & Synthetic Datasets

| File | Line(s) | Description of Hard-Coded / Mock Value |
| :--- | :--- | :--- |
| `src/data/mockData.ts` | 28–489 | `SHARED_CASES`: 10 hardcoded mock recovery cases featuring invented corporate entities (Zerodha Broking Ltd, Freshworks Technologies, Swiggy Partner Ops, Postman Inc India, Meesho Sellers Network, CloudNine Health Systems). |
| `src/data/mockData.ts` | 494–506 | `SHARED_METRICS`: Hardcoded metrics (`revenue_at_risk: 680876.55`, `recovered_revenue: 617534.34`, `recovery_rate: 47.6%`, `failed_payments_count: 290`, `active_recovery_count: 42`, `escalated_cases_count: 16`, `awaiting_approval_count: 27`, `total_cases_count: 124`, `average_recovery_time_minutes: 3.8`, `retry_success_rate: 68.4%`, `autonomous_recovery_rate: 62.0%`). |
| `src/data/mockData.ts` | 511–620 | `SHARED_SUBSCRIPTIONS`: 6 hardcoded subscriptions for invented corporate customers with fabricated amounts and next retry timestamps. |
| `src/data/mockData.ts` | 625–645 | `SHARED_PAYMENTS`: Mock payments ledger synthesized from `SHARED_CASES`. |
| `src/data/mockData.ts` | 650–697 | `SHARED_ABANDONED_CARTS`: Invented abandoned carts with celebrity names ("Karan Johar", "Pooja Hegde", "Rahul Dravid") and hardcoded amounts (₹85,000, ₹24,000, ₹45,000). |
| `src/data/cases.ts` | 3–4 | `initialDashboardMetrics = SHARED_METRICS` and `initialCases = SHARED_CASES` exported for UI consumption. |

### 1.2 Frontend Service Fallback Responses (`src/services/index.ts`)

| File | Line(s) | Description of Hard-Coded / Mock Value |
| :--- | :--- | :--- |
| `src/services/index.ts` | 128–137 | `authService.getEnvironment`: Catch block returns mock environment details (`audit_chain_length: 512`, `rbi_framework_active: true`, `tat_framework: "RBI/2019-20/67 Harmonisation of TAT"`). |
| `src/services/index.ts` | 209–218 | `authService.switchPersona`: Catch block synthesizes mock user object with `token: "mock_jwt_token"`. |
| `src/services/index.ts` | 258–274 | `paymentService.getPayments`: Catch block filters and returns `SHARED_PAYMENTS`. |
| `src/services/index.ts` | 284–300 | `recoveryService.getCases`: Catch block filters and returns `SHARED_CASES`. |
| `src/services/index.ts` | 307–308 | `recoveryService.getCaseById`: Catch block searches and returns case from `SHARED_CASES`. |
| `src/services/index.ts` | 316–317 | `recoveryService.analyzeCase`: Catch block returns `SHARED_CASES[0]`. |
| `src/services/index.ts` | 380–400 | `policyService.getConfig`: Catch block returns hardcoded fallback configuration (`merchant_id: "m_rzp_test_001"`). |
| `src/services/index.ts` | 407–427 | `policyService.updateConfig`: Catch block returns synthesized policy configuration. |
| `src/services/index.ts` | 437 | `subscriptionService.getSubscriptions`: Catch block returns `SHARED_SUBSCRIPTIONS`. |
| `src/services/index.ts` | 460 | `checkoutService.getAbandonedCheckouts`: Catch block returns `SHARED_ABANDONED_CARTS`. |
| `src/services/index.ts` | 479–521 | `auditService.getLogs`: Catch block returns 4 fabricated audit log entries (`aud_01` to `aud_04`). |
| `src/services/index.ts` | 528–550 | `auditService.getCaseAuditLogs`: Catch block returns 2 fabricated case audit log entries. |
| `src/services/index.ts` | 557–564 | `auditService.verifyChain`: Catch block returns fake cryptographic verification (`valid: true`, `total_blocks: 119`, hardcoded genesis/head SHA-256 hashes). |
| `src/services/index.ts` | 574–607 | `simulationService.getPresets`: Catch block returns 4 hardcoded simulation preset objects. |
| `src/services/index.ts` | 620–649 | `simulationService.triggerSimulation`: Catch block synthesizes fake simulation result with randomized `RV-` case ID and fake audit events. |
| `src/services/index.ts` | 663–690 | `mlService.getEvaluationMetrics`: Catch block returns hardcoded model evaluation metrics (`roc_auc: 0.8094`, `f1_score: 0.8702`, static confusion matrix). |
| `src/services/index.ts` | 698–735 | `mlService.getSystemSummary`: Catch block returns hardcoded benchmark throughput (`events_processed: 1248`, `recovery_rate: "45.0%"`). |
| `src/services/index.ts` | 742–778 | `mlService.getRecruiterEvaluation`: Catch block returns static benchmark numbers and hardcoded ASCII evaluation string. |
| `src/services/index.ts` | 797–808 | `mlService.predictLikelihood`: Catch block returns hardcoded probability `0.824` (`82.4%`). |
| `src/services/index.ts` | 818–828 | `agentService.getBudget`: Catch block returns hardcoded budget (`used: 42`, `total: 100`, `remaining: 58`). |
| `src/services/index.ts` | 835–845 | `agentService.toggleBudget`: Catch block returns hardcoded exhausted budget (`used: 100`). |
| `src/services/index.ts` | 852–866 | `agentService.forceFallbackTest`: Catch block returns synthetic fallback diagnosis referencing fake customer "Vikram Seth". |

### 1.3 Page-Level Hardcoded Statistics, Metrics & Test Data

| File | Line(s) | Description of Hard-Coded / Mock Value |
| :--- | :--- | :--- |
| `src/pages/LandingPage.tsx` | 37–43 | Hardcoded ROI calculator default parameters (`monthlyRevenue = 2500000`, `failRate = 7.5`, fallback `recoveryRateEst = 52.7%`). |
| `src/pages/LandingPage.tsx` | 51, 57, 63, 69, 75 | Unsubstantiated marketing telemetry claims: "48 Signals", "52 Signals", "36 Signals", "42 Signals", "24 Signals" ("200+ Signals Engine"). |
| `src/pages/LandingPage.tsx` | 387 | Hardcoded inference latency claim `< 28ms`. |
| `src/pages/LandingPage.tsx` | 497 | Hardcoded simulated topline boost `+4.8%`. |
| `src/pages/PricingPage.tsx` | 19–23 | Hardcoded ROI calculation state (`monthlyFailedRevenue = 500000`, fallback rate `52.7%`, fee `1.5%`). |
| `src/pages/PricingPage.tsx` | 97, 137 | Marketing claims: "Basic 200+ ML timing heuristics", "200+ ML Signals Real-Time Model". |
| `src/pages/PricingPage.tsx` | 174, 177, 186 | Unsubstantiated feature claims: "down to 0.75%", "Custom Gateway Adapters (Stripe, PayU, Billdesk)", "99.99% Guaranteed SLA with 24/7 Phone Support". |
| `src/pages/AnalyticsPage.tsx` | 11–50 | `VOLUME_DATA_BY_RANGE`: 4 complete tables of fabricated daily/monthly figures across 7D, 30D, 90D, and YTD (including line 26: `{ day: "Aug 16", current: 78000, previous: 51000, rate: 65.4 }`). |
| `src/pages/AnalyticsPage.tsx` | 67 | Hardcoded fallback yield rate `rate = 64.7%`. |
| `src/pages/DashboardPage.tsx` | 169 | Hardcoded greeting fallback username: `"Rohan Deshmukh"`. |
| `src/pages/DashboardPage.tsx` | 655 | Hardcoded status and latency string: `"18ms Latency · Active"`. |
| `src/pages/CaseInvestigationPage.tsx` | 17 | Hardcoded fallback case identifier: `"RV-10291"`. |
| `src/pages/ApprovalCenterPage.tsx` | 61–71 | `getEvidenceList`: Hardcoded synthetic evidence sentences generated via string interpolation when real evidence has < 2 items. |
| `src/pages/SettingsPage.tsx` | 58–75 | Hardcoded test webhook injection payload containing fake customer `vikram.sharma@enterprise.in`, phone `+919820144829`, amount `499900`. |
| `src/pages/SettingsPage.tsx` | 168, 201 | Hardcoded latency telemetry: `Mean Latency: 380ms`, `Mean Latency: 410ms`. |
| `src/pages/StatusPage.tsx` | 93–126 | Hardcoded fallback component statuses with static latencies (`14.2`, `210.0`, `6.8`, `12.0`, `9.1`) and static uptimes (`99.99%`, `99.98%`, `100.0%`). |
| `src/pages/StatusPage.tsx` | 176 | Hardcoded uptime statement: `Real-time uptime: 99.98% over past 90 days`. |
| `src/pages/AboutPage.tsx` | 76, 80 | Hardcoded marketing metrics: `200+ ML Signals Ingested`, `<14ms Gateway Verification Latency`. |
| `src/pages/SystemEvaluationPage.tsx` | 86–90 | Hardcoded fallback ML metrics (`roc_auc: 0.8094`, `f1_score: 0.8702`, `precision: 0.8146`, `recall: 0.9341`, `brier_score: 0.1401`). |
| `src/pages/SystemEvaluationPage.tsx` | 92–104 | Hardcoded fallback feature importances dictionary. |
| `src/components/ReviveHeroPreview.tsx` | 68 | Hardcoded stat: `+4.8% Added to Topline`. |
| `src/components/ReviveHeroPreview.tsx` | 100–149 | Hardcoded example transaction rows (`TXN_8841`, `TXN_8847`, `TXN_8852`, `RECOVERED ₹32,400`). |
| `src/components/KeyMetricsAcceptanceView.tsx` | 17–43 | `mockChartData`: 25 hardcoded dates and baseline yields. |
| `src/components/KeyMetricsAcceptanceView.tsx` | 57–67 | "Download CSV" exports `mockChartData` instead of real database records. |
| `src/components/SystemEvaluationRecruiterCard.tsx` | 80–92, 107–119 | Hardcoded benchmark statistics (`events_processed: 1248`, `recovery_rate: "45.0%"`). |
| `src/components/Footer.tsx` | 95 | Hardcoded status pill: `100% Test Sandbox Health`. |
| `src/components/Footer.tsx` | 228–239 | Sub-footer copy explicitly stating: "Privacy Note: This is an engineering portfolio demo. ... Built for Razorpay test mode exploration." (Must be replaced with production B2B SaaS legal footer). |

### 1.4 Backend Mock Datasets & Synthetic Generators

| File | Line(s) | Description of Hard-Coded / Mock Value |
| :--- | :--- | :--- |
| `backend/api/analytics.py` | 22–33 | `PrivacyAnalyticsStore`: Seeds fabricated baseline counts for the month (1,280 unique sessions, 3,420 page views on `/`, 4,850 on `/dashboard`, 840 on `investigate_case`). |
| `backend/api/status.py` | 40, 48, 49, 56, 57, 64, 72, 80, 81 | Hardcoded component latency numbers and static uptime percentages (e.g. `latency_ms: 14.2`, `uptime_pct: 99.99`). |
| `backend/api/status.py` | 90 | Hardcoded `overall_uptime_pct: 99.98`. |
| `backend/api/ml_evaluation.py` | 79 | Default fallback rate `recovery_rate_pct = ... if total_cases > 0 else 45.0`. |
| `backend/api/ml_evaluation.py` | 92 | Hardcoded `"recovery_rate": "45.0%"`. |
| `backend/seed_data.py` | 64–80 | Hardcoded initial seed users with pre-assigned demo accounts (`owner@revivepay.ai`, `operator@revivepay.ai`, `support@revivepay.ai`, `admin@revivepay.ai`) and shared `DEMO_USER_PASSWORD`. |
| `backend/seed_data.py` | 130–930 | Generates synthetic transactions and cases with invented customer names and simulated dates. |

---

## 2. Unauthenticated Routes & APIs

The following table lists every backend endpoint that either completely lacks authentication dependencies or uses the permissive `get_current_user_optional` fallback (which permits cross-tenant reads and mutations when unauthenticated):

| HTTP Method | Route / Endpoint | File & Line | Current Auth Status | Security Impact / Risk |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | `backend/api/dashboard.py:12` | `get_current_user_optional` | Unauthenticated callers receive aggregate summary metrics across ALL merchants. |
| `GET` | `/api/dashboard/revenue-risk` | `backend/api/dashboard.py:20` | **NONE** | Unauthenticated callers access revenue risk trend data across all merchants. |
| `GET` | `/api/dashboard/recovery-trend` | `backend/api/dashboard.py:24` | **NONE** | Unauthenticated callers access recovery trend data across all merchants. |
| `GET` | `/api/dashboard/failure-reasons` | `backend/api/dashboard.py:28` | **NONE** | Unauthenticated callers access category breakdown of all failed payments. |
| `GET` | `/api/dashboard/funnel` | `backend/api/dashboard.py:32` | **NONE** | Unauthenticated callers access full recovery pipeline stage counts. |
| `GET` | `/api/payments` | `backend/api/payments.py:12` | `get_current_user_optional` | Unauthenticated callers can list all payments, amounts, customer names, and failure codes. |
| `GET` | `/api/payments/{payment_id}` | `backend/api/payments.py:66` | `get_current_user_optional` | Unauthenticated callers can view individual transaction details. |
| `GET` | `/api/recovery/count` | `backend/api/recovery.py:80` | `get_current_user_optional` | Unauthenticated callers can view total case count. |
| `GET` | `/api/recovery/cases` | `backend/api/recovery.py:91` | `get_current_user_optional` | Unauthenticated callers can list all recovery cases with customer names, root causes, and risk scores. |
| `GET` | `/api/recovery/cases/{case_id}` | `backend/api/recovery.py:123` | `get_current_user_optional` | Unauthenticated callers can view full case details. |
| `POST` | `/api/recovery/{case_id}/analyze` | `backend/api/recovery.py:139` | `get_current_user_optional` | Unauthenticated callers can trigger LLM re-analysis of recovery cases. |
| `GET` | `/api/audit` | `backend/api/audit.py:12` | `get_current_user_optional` | Unauthenticated callers can query the immutable audit ledger across all tenants. |
| `GET` | `/api/audit/verify-chain` | `backend/api/audit.py:49` | **NONE** | Unauthenticated callers can trigger SHA-256 ledger verification. |
| `GET` | `/api/audit/{case_id}` | `backend/api/audit.py:54` | `get_current_user_optional` | Unauthenticated callers can read audit history for any case. |
| `GET` | `/api/policy/config` | `backend/api/policy.py:13` | `get_current_user_optional` | Unauthenticated callers can inspect merchant policy rules and retry thresholds. |
| `GET` | `/api/subscriptions` | `backend/api/subscriptions.py:15` | `get_current_user_optional` | Unauthenticated callers can inspect customer recurring plans and billing status. |
| `POST` | `/api/subscriptions/{sub_id}/send-pre-debit-notification` | `backend/api/subscriptions.py:53` | `get_current_user_optional` | Unauthenticated callers can trigger pre-debit notifications. |
| `POST` | `/api/subscriptions/{sub_id}/opt-out` | `backend/api/subscriptions.py:93` | **NONE** | Anyone can opt out customer subscriptions without authentication. |
| `POST` | `/api/subscriptions/{sub_id}/retry` | `backend/api/subscriptions.py:128` | **NONE** | Anyone can trigger subscription retry actions without authentication. |
| `GET` | `/api/checkout/abandoned` | `backend/api/checkout.py:10` | **NONE** | Public unauthenticated access to customer cart contents, emails, and dropoff values. |
| `POST` | `/api/checkout/{checkout_id}/recover` | `backend/api/checkout.py:14` | **NONE** | Anyone can trigger recovery dispatch for any checkout session. |
| `POST` | `/api/agent/analyze` | `backend/api/agent.py:9` | **NONE** | Unauthenticated LLM invocation endpoint; susceptible to quota exhaustion and financial DoS. |
| `POST` | `/api/agent/plan` | `backend/api/agent.py:13` | **NONE** | Unauthenticated LLM invocation endpoint. |
| `GET` | `/api/agent/budget` | `backend/api/agent.py:17` | **NONE** | Public access to internal AI budget utilization. |
| `POST` | `/api/agent/budget/toggle-exhaustion` | `backend/api/agent.py:22` | **NONE** | Anyone can toggle budget exhaustion in sandbox/demo mode. |
| `POST` | `/api/agent/force-fallback-test` | `backend/api/agent.py:32` | **NONE** | Anyone can force Gemini fallback tests. |
| `POST` | `/api/chat/stream` | `backend/api/chat.py:20` | **NONE** | Public unauthenticated SSE streaming chatbot; consumes LLM credits. |
| `GET` | `/api/chat/history` | `backend/api/chat.py:50` | **NONE** | Public access to read chat transcripts by session identifier. |
| `DELETE` | `/api/chat/history` | `backend/api/chat.py:77` | **NONE** | Public ability to delete chat sessions. |
| `GET` | `/api/simulation/presets` | `backend/api/simulation.py:11` | **NONE** | Public access to simulation scenarios. |
| `POST` | `/api/simulation/trigger` | `backend/api/simulation.py:88` | **NONE** | Public unauthenticated injection of synthetic transactions into the domain engine. |
| `POST` | `/api/simulation/reset-demo` | `backend/api/simulation.py:98` | **NONE** | Public unauthenticated database wipe and re-seed (only checks `ENVIRONMENT != production`). |
| `GET` | `/api/ml/evaluation` | `backend/api/ml_evaluation.py:30` | **NONE** | Public access to ML training and test metrics. |
| `POST` | `/api/ml/predict` | `backend/api/ml_evaluation.py:41` | **NONE** | Public access to real-time recovery likelihood inference model. |
| `GET` | `/api/ml/recruiter-evaluation` | `backend/api/ml_evaluation.py:121` | **NONE** | Public access to scorecard metrics. |
| `GET` | `/api/ml/system-summary` | `backend/api/ml_evaluation.py:128` | **NONE** | Public access to system diagnostics. |
| `POST` | `/api/status/telemetry-tick` | `backend/api/status.py:100` | **NONE** | Public trigger generating synthetic failures and mutations in the database. |
| `GET` | `/api/events/stream` | `backend/api/events_stream.py:14` | **NONE** | Public SSE connection receiving live transaction telemetry and customer names. |
| `POST` | `/api/auth/demo-login` | `backend/api/auth.py:139` | **NONE** | Passwordless 1-click login issuing valid JWTs with Owner/Admin roles. |

---

## 3. Secrets in Code & Git History

### 3.1 In Active Working Tree

| File | Line(s) | Secret / Placeholder Finding | Remediation Required |
| :--- | :--- | :--- | :--- |
| `backend/config.py` | 25 | `SECRET_KEY = "dev-non-secret-jwt-placeholder-key"` (fallback default) | Enforce non-empty cryptographically random secret in all environments; fail startup if missing. |
| `backend/config.py` | 26 | `CSRF_SECRET = "dev-non-secret-csrf-placeholder-salt"` (fallback default) | Enforce non-empty secret; fail startup if missing. |
| `backend/config.py` | 27 | `DEMO_USER_PASSWORD = "dev-non-secret-demo-user-password"` | Remove demo user password entirely; remove hardcoded users. |
| `.env` | 7–9 | `SECRET_KEY`, `CSRF_SECRET`, `DEMO_USER_PASSWORD` set to dev placeholder values. | Replace with strong env-specific secrets; never commit `.env`. |
| `backend/services/razorpay_service.py` | 33 | `effective_secret = "sandbox_test_webhook_secret"` fallback default when `RAZORPAY_WEBHOOK_SECRET` is unset. | Remove hardcoded secret fallback; reject verification if secret is unconfigured. |
| `backend/api/webhooks.py` | 83–86 | `x_razorpay_signature == "test_signature"` signature bypass check. | Eliminate `"test_signature"` bypass; verify HMAC-SHA256 signature for all environments. |
| `backend/models/all_models.py` | 27–28 | `razorpay_key_id = Column(String(100))` and `razorpay_key_secret = Column(String(100))` stored in plaintext. | Encrypt with AES-256-GCM before storing in DB; never expose `key_secret` to frontend. |

### 3.2 In Git History (Historical Commits)

A scan of git commit revisions revealed historical credentials committed prior to security sanitization:

| Commit Hash | Commit Date | Files Affected | Credentials Detected in Historical Revisions | Status & Action |
| :--- | :--- | :--- | :--- | :--- |
| `ebe6568` | 2026-08-26 | `revivepay.db` | Binary SQLite database committed to Git containing pre-seeded users and password hashes. | DB removed from git tracking; historical hashes must be considered invalid. |
| `2fce745` | 2026-08-26 | `.env.example`, `README.md`, `SettingsPage.tsx` | Historical test keys: `RAZORPAY_KEY_ID="rzp_test_revivepay2026"`, `RAZORPAY_WEBHOOK_SECRET="whsec_revivepay_test_webhook_2026"`. | Keys sanitized in working tree; rotate any keys that were active. |
| `b3684b1` | 2026-08-30 | `backend/config.py`, `docker-compose.yml` | Historical secrets: `SECRET_KEY="revivepay_enterprise_fintech_jwt_secret_key_2026_x892"`, `CSRF_SECRET="revivepay_csrf_signing_salt_2026"`. | Secrets replaced with placeholders in working tree; all JWT secrets must be rotated. |
| `544a525` | 2026-08-31 | `docker-compose.yml` | Historical database password: `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/revivepay`. | Default dev credentials sanitized. |

---

## 4. Places Storing or Logging Sensitive Payment Data

| File | Line(s) | Component / Table | Sensitivity & Exposure Finding |
| :--- | :--- | :--- | :--- |
| `backend/models/all_models.py` | 27–28 | `merchants` table | `razorpay_key_id` and `razorpay_key_secret` are stored in plaintext without column encryption. |
| `backend/models/all_models.py` | 110, 113 | `payment_events` table | `raw_webhook_body = Column(Text)` and `payload = Column(JSON)` store raw, unscrubbed Razorpay webhook payloads containing customer PII (email, phone, billing address) without encryption. |
| `backend/models/all_models.py` | 47 | `customers` table | `email = Column(String(255))` stored unencrypted. |
| `backend/models/all_models.py` | 394 | `subscriptions` table | `customer_email = Column(String(255))` stored unencrypted. |
| `backend/models/all_models.py` | 421 | `abandoned_checkouts` table | `customer_email = Column(String(255))` and cart item names stored unencrypted. |
| `backend/models/all_models.py` | 437 | `webhook_events` table | `payload = Column(JSON)` stores raw unencrypted webhook payloads. |
| `backend/api/webhooks.py` | 227–228 | Webhook Ingestion | Extracts `email` and `contact` (+91 phone) directly from Razorpay payload and persists into `Customer` without hashing or masking. |
| `backend/services/logging_service.py` | 18–31 | Log Scrubber Filter | Scrubber scrubs 13-19 digit card numbers, tokens, and passwords, but does NOT mask customer email addresses or phone numbers from application logs. |
| `backend/services/chat_engine.py` | 66 | Chatbot Context Tool | Injects customer email addresses into LLM context and user-facing tool outputs. |
| `backend/api/checkout.py` | 27 | Checkout Recovery API | Logs customer email address in plain string: `f"Personalized recovery reminder dispatched to {chk.customer_email}..."`. |

---

## 5. Missing Input Validation

| File | Line(s) | Endpoint / Function | Missing Validation Description |
| :--- | :--- | :--- | :--- |
| `backend/api/checkout.py` | 14 | `POST /checkout/{checkout_id}/recover` | `checkout_id` path parameter lacks format/regex validation; endpoint takes no request body schema. |
| `backend/api/subscriptions.py` | 53, 93, 128 | `POST /subscriptions/{subscription_id}/*` | `subscription_id` is an unbounded string parameter with no validation regex; endpoints lack Pydantic body schemas. |
| `backend/api/agent.py` | 9, 13 | `POST /agent/analyze`, `POST /agent/plan` | Endpoints accept untyped `Dict[str, Any] = Body(...)` rather than strict Pydantic schemas validating fields, amounts, and bounds. |
| `backend/api/agent.py` | 32 | `POST /agent/force-fallback-test` | Accepts arbitrary unvalidated `Optional[Dict[str, Any]]`. |
| `backend/api/payments.py` | 14–15 | `GET /payments` | `status` and `failure_category` are unvalidated strings (not validated against domain taxonomy enums). |
| `backend/api/recovery.py` | 93–95 | `GET /recovery/cases` | `status`, `risk_level`, and `approval_status` are unvalidated strings. |
| `backend/api/recovery.py` | 253 | `POST /recovery/{case_id}/stop` | Takes no request body schema and no reason payload. |
| `backend/api/simulation.py` | 89 | `POST /simulation/trigger` | `SimulationTriggerRequest.scenario` has no regex or enum validation against allowed presets. |
| `src/pages/LoginPage.tsx` | 57 | Registration Form | Allows client to submit arbitrary `role` parameter during registration without server-side permission checks. |
| Multiple Frontend Pages | Various | Amount Input Fields | Currency amounts are parsed as standard JavaScript floats without paise-safe integer rounding or boundary constraints. |

---

## 6. Missing Tests

The repository has 148 backend pytest tests (`pytest tests/`), but critical production verification tests are completely missing:

1. **Strict Multi-Tenancy Isolation Tests:** Zero tests proving Org A cannot access or mutate Org B's data across:
   - Recovery Cases (`GET /api/recovery/cases`, `GET /api/recovery/cases/{id}`)
   - Payments (`GET /api/payments`, `GET /api/payments/{id}`)
   - Subscriptions (`GET /api/subscriptions`)
   - Abandoned Checkouts (`GET /api/checkout/abandoned`)
   - Audit Logs (`GET /api/audit`, `GET /api/audit/{id}`)
   - Policy Configurations (`GET /api/policy/config`, `PUT /api/policy/config`)
   - Live Event Stream (`/api/events/stream`)
2. **MFA (TOTP) Verification Tests:** Zero tests for time-based one-time password (TOTP) secret generation, QR generation, token verification, and recovery codes.
3. **Email Verification & Password Reset Tests:** Zero tests verifying single-use, time-bound email verification and password reset token lifecycle.
4. **AES-256-GCM Key Encryption at Rest Tests:** Zero tests validating encryption and decryption of merchant Razorpay credentials.
5. **Test Mode vs. Live Mode Per-Organization Tests:** Zero tests validating that test mode events are isolated from live mode metrics.
6. **DPDP Act 2023 Compliance Tests:** Zero tests validating per-organization data export (JSON/CSV) and statutory erasure request flows.
7. **Integer Math (Paise Safety) Tests:** Zero tests verifying that financial calculations strictly use integer paise without floating-point drift.
8. **Frontend Unit & Component Tests:** Zero frontend tests in the repository (no Vitest / Jest configuration or test files exist).

---

## 7. Pages Still Using Old Orange / Teal Palette

The institutional design system requires a unified, high-contrast **indigo/blue** palette (`--color-accent: #2563EB`, `--color-bg-canvas: #0B0F17`, `--color-bg-surface: #111827`). The following files and lines still use old `orange-*`, `amber-*`, or legacy `cyan` color values:

| File | Line(s) | Palette Element | Current Usage & Required Token Fix |
| :--- | :--- | :--- | :--- |
| `src/components/ActionBadge.tsx` | 24 | `text-orange-600 dark:text-orange-400` | Used for `request_payment_method_update`. Must be replaced with semantic warning/indigo token. |
| `src/pages/SimulationCenterPage.tsx` | 82–84, 152–154, 162, 165, 170, 220 | `amber-500`, `amber-600`, `amber-800`, `amber-900` | Ad-hoc amber background and text classes; must use `var(--color-warning)` and `var(--color-warning-subtle)`. |
| `src/pages/DashboardPage.tsx` | 247, 250, 262, 265, 367, 370, 382, 383, 569, 600 | `amber-500`, `amber-600`, `amber-400` | KPI card borders, pending approval badges, pulse indicators. Must use design system tokens. |
| `src/pages/PrivacyPage.tsx` | 184 | `bg-amber-500/10 text-amber-700` | DPO contact card styling; must use design tokens. |
| `src/pages/PolicyConfigPage.tsx` | 89–90, 131, 142 | `amber-500`, `accent-amber-500` | Policy threshold slider and warning badge; must use design tokens. |
| `src/pages/EngineeringNotesPage.tsx` | 144, 159, 245 | `text-amber-500` | Architecture note highlights. |
| `src/pages/HardeningLogPage.tsx` | 130 | `bg-amber-500/10 text-amber-800` | Security event badge styling. |
| `src/pages/SubscriptionsPage.tsx` | 236, 259, 341, 352 | `amber-500/10`, `text-amber-800` | Past-due subscription badge styling. |
| `src/pages/SecurityPage.tsx` | 114, 117, 174 | `text-amber-500`, `bg-amber-500/10` | Key rotation icon and secondary route badges. |
| `src/pages/AiActivityPage.tsx` | 98, 99, 149, 151 | `bg-amber-500/20`, `bg-amber-400` | Policy block badge and budget bar progress color. |
| `src/pages/ApprovalCenterPage.tsx` | 83, 84, 98, 156 | `bg-amber-500/10`, `text-amber-600` | High-value approval badge and amounts. |
| `src/pages/ArchitecturePage.tsx` | 293, 312, 316, 538 | `bg-amber-500`, `text-amber-500` | Pipeline stage indicators and sequence badges. |
| `src/pages/NotificationsPage.tsx` | 61 | `bg-amber-500/10 text-amber-600` | Notification item badge styling. |
| `src/pages/TermsPage.tsx` | 256 | `text-amber-500` | Limitation of liability icon. |
| `src/index.css` | 86–87, 172–173 | `--accent-cyan: var(--color-accent);` | Legacy backward-compatibility CSS variable aliases referencing old cyan identity. |

---

## 8. Regulatory Claims & Badge Accuracy Audit

Non-Negotiable Rule 3 states:
> *"Never claim compliance we don't have. Do not show PCI-DSS, SOC 2, ISO 27001 or RBI badges. Instead, write accurately: 'Card data is handled entirely by Razorpay. RevivePay never sees or stores card numbers.'"*

The audit identified the following non-compliant claims in copy and UI that must be updated:

| File | Line(s) | Current Non-Compliant Claim / Badge | Required Production-Accurate Copy |
| :--- | :--- | :--- | :--- |
| `src/pages/ArchitecturePage.tsx` | 200 | "Built with SOC-2-aligned access controls and PCI-DSS-informed data handling audit trail." | "Card data is handled entirely by Razorpay. RevivePay never sees or stores card numbers. Access controls enforce least-privilege role boundaries." |
| `src/pages/ArchitecturePage.tsx` | 582 | `<span>SOC-2 & PCI-DSS-Informed Architecture</span>` | `<span>Zero-Cardholder Data Architecture (Zero-PAN)</span>` |
| `src/pages/SecurityPage.tsx` | 34 | "SOC-2 Aligned Access Controls" | "Role-Based Access Controls with Least-Privilege Enforcement" |
| `src/components/GuidedTour.tsx` | 96 | "Instant compliance export for SOC-2 and regulatory audits" | "One-click audit trail export for internal security reviews" |
| `src/pages/PrivacyPage.tsx` | 74 | "Governance Reference: DPDP Act 2023, RBI Master Direction on Digital Payment Security Controls, PCI-DSS v4.0." | "Governance Reference: DPDP Act 2023. Card processing handled entirely by Razorpay." |
| `src/pages/PrivacyPage.tsx` | 133 | "in accordance with PCI-DSS v4.0 Handling Standards and RBI Tokenisation Mandates" | "Card data is handled entirely by Razorpay. RevivePay never sees or stores card numbers." |
| `src/pages/TermsPage.tsx` | 229 | "maintaining strict PCI-DSS v4.0 tokenized scope." | "Card data is handled entirely by Razorpay. RevivePay never sees or stores card numbers." |
| `backend/models/all_models.py` | 299 | "Enforces write-once, append-only regulatory compliance (RBI / ISO 27001)" | "Enforces write-once, append-only cryptographic hash-chain integrity" |

---

## Conclusion & Phase Transition

The audit confirms:
- **Zero code changes were executed during Phase 1.**
- All 7 mandatory audit dimensions have been thoroughly scanned and cataloged.
- The project is ready to proceed to **Phase 2: Real Auth and Multi-Tenancy**.
