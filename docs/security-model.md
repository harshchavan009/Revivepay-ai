# RevivePay AI — Security & Threat Model

## 1. Defense-in-Depth Architecture

| Layer | Threat Mitigated | Defensive Control Enforced |
| :--- | :--- | :--- |
| **Ingress & Perimeter** | Forged webhook payloads, replay attacks, volumetric abuse | Timing-safe HMAC-SHA256 verification, sliding-window rate limiters ($120/\text{min}$ webhooks, $15/\text{min}$ auth). |
| **Authentication & RBAC** | Credential theft, unauthorized privilege escalation | `bcrypt` (12 rounds), short-lived JWT access tokens (15m), httpOnly SameSite=Strict refresh cookies (7d), role-based permissions. |
| **High-Value Governance** | Unauthorized high-value financial actions | Step-Up Re-Authentication enforced on all cases $\ge ₹50,000$. |
| **Generative AI Safety** | Prompt injection, hallucinated transactions | Strict Pydantic output validation, bounded action whitelist, deterministic policy gateway between model and execution. |
| **Ledger Integrity** | History tampering, unauthorized state alterations | SHA-256 hash-chained cryptographic ledger with genesis-to-head verification endpoint (`/api/audit/verify-chain`). |
| **Data Secrets Hygiene** | Token leaks in frontend bundles, hardcoded source credentials | Zero secrets in client builds, verified by automated CI scanner (`scripts/audit_secrets.py`). |

## 2. Cryptographic Audit Chain Formulation

$$\text{entry\_hash}_i = \text{SHA-256}(\text{entry\_hash}_{i-1} + \text{audit\_id} + \text{timestamp} + \text{actor} + \text{action} + \text{case\_id} + \text{notes})$$
