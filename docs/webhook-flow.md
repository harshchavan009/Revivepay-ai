# RevivePay AI — Razorpay Webhook Ingress & Verification Flow

## 1. Webhook Processing Architecture

```mermaid
sequenceDiagram
    autonumber
    participant Gateway as Razorpay Gateway (Test Mode)
    participant Ingress as FastAPI Webhook Ingress (/api/webhooks/razorpay)
    participant Crypto as Timing-Safe HMAC-SHA256 Validator
    participant DB as PostgreSQL Database
    participant Engine as Recovery Engine Pipeline

    Gateway->>Ingress: POST /api/webhooks/razorpay (Headers: X-Razorpay-Signature)
    Ingress->>Crypto: verify_webhook_signature(raw_body, signature, secret)
    alt Invalid / Forged Signature
        Crypto-->>Ingress: False
        Ingress->>DB: Log Audit (webhook.verification.rejected)
        Ingress-->>Gateway: HTTP 401 Unauthorized (Payload Discarded)
    else Signature Valid
        Crypto-->>Ingress: True
        Ingress->>DB: Check Idempotency: UNIQUE(provider, provider_event_id)
        alt Duplicate Event Found
            DB-->>Ingress: Existing PaymentEvent record
            Ingress-->>Gateway: HTTP 200 OK (duplicate_ignored)
        else Fresh Event
            Ingress->>DB: Persist PaymentEvent & Payment entity
            Ingress->>Engine: trigger_recovery_pipeline(case)
            Engine-->>Ingress: Initialized Case (NEW)
            Ingress-->>Gateway: HTTP 200 OK (Event Processed)
        end
    end
```

## 2. Key Security Properties
- **Timing-Safe Equality**: Uses `hmac.compare_digest()` to prevent timing attack vulnerabilities.
- **Idempotency Guarantee**: `provider_event_id` deduplication guarantees exactly one case created per webhook event.
- **Defense Audit Trail**: All rejected signatures emit immutable audit events (`webhook.verification.rejected`) logging perimeter defense in real-time.
