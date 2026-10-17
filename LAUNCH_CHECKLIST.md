# RevivePay AI — Production Commercial Launch Checklist

This document details the mandatory legal, regulatory, gateway, infrastructure, and operational actions required before transitioning RevivePay AI from Sandbox/Test Mode to commercial Live Production traffic.

---

## 1. Regulatory, Statutory & Legal Compliance

- [ ] **DPDP Act 2023 Statutory Privacy Review**
  - Engage certified Indian privacy legal counsel to review and approve `/privacy` and `/terms`.
  - Appoint and formally publish the **Data Protection Officer (DPO)** and **Grievance Officer** details:
    - *Full Name & Designation:* To be appointed by board resolution.
    - *Official Email:* `grievance@revivepay.ai`
    - *Physical Address:* Registered office address in India.
  - Formally verify that Section 6 (Consent Architecture) and Section 12 (Right to Erasure & Portability) meet statutory requirements.
- [ ] **RBI Digital Payment Security Controls & E-Mandate Compliance**
  - Verify compliance with RBI Master Directions on Digital Payment Security Controls (RBI/2020-21/74).
  - Review 24-hour pre-debit SMS/Email notification rules for recurring e-mandates (RBI/2020-21/70).
  - Verify that raw 16-digit Card Numbers (PANs), CVVs, and Netbanking credentials remain **100% out-of-scope** (handled entirely by Razorpay Token Vault).
- [ ] **Statutory Terms of Service Sign-Off**
  - Legal review of commercial SLA terms, limitation of liability, and jurisdiction clauses under the Information Technology Act, 2000.
  - Removal of the draft disclaimer banner from `/terms`, `/privacy`, and `/security` once legal approval is granted.

---

## 2. Razorpay Gateway & Partner Integration

- [ ] **Razorpay Technology Partner Program Registration**
  - Apply for and execute official Razorpay Technology Partner Agreement.
  - Transition from sandbox test keys (`rzp_test_...`) to production live credentials (`rzp_live_...`).
- [ ] **Production Webhook Verification & Endpoint Configuration**
  - Register production webhook URL `https://api.revivepay.ai/api/v1/webhooks/razorpay/{org_id}` with Razorpay Dashboard.
  - Generate a cryptographically strong, random production webhook secret (minimum 32 bytes) stored via AES-256-GCM.
  - Verify timing-safe HMAC-SHA256 signature verification over all live ingress events.
- [ ] **Replay Defense & Clock Drift Tuning**
  - Validate production server NTP time synchronization (< 100ms drift) to guarantee the 300-second replay window defense (`MAX_REPLAY_WINDOW_SECONDS = 300`).

---

## 3. Infrastructure, Cryptography & Database Hardening

- [ ] **Production Database Migration to Managed PostgreSQL**
  - Deploy High-Availability Managed PostgreSQL (AWS RDS / GCP Cloud SQL / Neon) with Multi-AZ failover.
  - Apply all Alembic migrations through `7b8c91f034ee_004_dpdp_compliance_and_security.py`.
  - Verify PostgreSQL Row-Level Security (RLS) enforcement across all tenant tables (`organizations`, `recovery_cases`, `payments`, `audit_logs`).
- [ ] **Hardware Security Module (HSM) / Cloud KMS Key Management**
  - Transition `ENCRYPTION_MASTER_KEY` from environment variables to an HSM/KMS-managed key (AWS KMS / GCP Cloud KMS / HashiCorp Vault).
  - Implement automated key rotation schedules for envelope encryption.
- [ ] **Continuous Secrets Scanning & CI Enforcement**
  - Ensure `.github/workflows/ci.yml` blocks any pull request introducing plaintext secrets via `gitleaks`.
  - Audit existing commits and ensure `scripts/audit_secrets.py` reports zero leaked credentials.
- [ ] **Edge Security, TLS & DDoS Protection**
  - Deploy behind Cloudflare / CloudFront with TLS 1.3 enforced, HSTS preload, and strict Content Security Policy (CSP).
  - Configure WAF IP rate limiting (120 req/min for public routes, 600 req/min for authenticated APIs).

---

## 4. External Services & Communications

- [ ] **Transactional Email Provider Connection**
  - Replace console OTP logging with production transactional email dispatch (SendGrid / AWS SES / Postmark).
  - Configure SPF, DKIM, and DMARC DNS records for `revivepay.ai` domain to guarantee inbox delivery of password reset and 2FA emails.
- [ ] **WhatsApp Business Platform / SMS Gateway Integration**
  - Connect official WhatsApp Business API account (Meta Cloud API / Gupshup / Twilio) for 1-click UPI recovery links.
  - Register registered message templates with Meta/TRAI adhering to DLT commercial communication regulations.

---

## 5. Reliability, Observability & Incident Response

- [ ] **Monitoring & Real-Time Alerting**
  - Configure Datadog / Prometheus / Sentry monitoring on `/health` endpoint.
  - Alert on P1 conditions:
    - Webhook signature failure spike (> 5 invalid signatures in 5 minutes).
    - Database query latency exceeding 250ms.
    - Audit ledger chain verification failure.
    - Consecutive AI agent timeouts triggering fallback rules.
- [ ] **Operator Escalation Protocol**
  - Establish on-call rota for Human-in-the-Loop review queues (cases exceeding ₹10,000 threshold).
  - Train operations personnel on manual approval procedures, policy overrides, and customer grievance handling.

---

## 6. Corporate Identity & Public Transparency

- [ ] **Corporate Registration Disclosures**
  - Update website footer with registered Indian Private Limited company name, Corporate Identification Number (CIN), and registered office.
  - Ensure accurate non-affiliation disclaimer is prominently displayed:
    > *"RevivePay is an independent software application designed to integrate with payment gateways including Razorpay. RevivePay is not affiliated with, sponsored by, or endorsed by Razorpay Software Private Limited."*
- [ ] **Customer Support Desk Activation**
  - Activate dedicated support desk mailbox at `support@revivepay.ai`.
  - Maintain public 24-business-hour response SLA commitment.

---

*Checklist verified and maintained by RevivePay AI Engineering Team.*
