# RevivePay AI — AI Decision Architecture & Fallback Mechanics

## 1. Multi-Tier Decision Hierarchy

```mermaid
flowchart TD
    A[Telemetry Input Context] --> B{LLM Daily Call Budget < 100?}
    B -- Budget Exhausted --> C[Safe Floor: Deterministic Rules Engine v2.1]
    B -- Budget Available --> D[Tier 1: Anthropic Claude 3.5 Sonnet]
    D -->|Latency > 3500ms or Rate Limit| E[Tier 2: Google Gemini 1.5 Pro Failover]
    D -->|Successful Synthesis| F[Structured Pydantic Validation]
    E -->|Successful Synthesis| F
    E -->|Secondary Provider Timeout| C
    C --> F
    F -->|Schema Valid| G{Deterministic Policy Gateway Evaluation}
    G -- Policy Passed --> H[Autonomous Recovery Action]
    G -- Policy Blocked / Overruled --> I[Human-in-the-Loop Review Queue]
```

## 2. Structured Output Schema & Bounded Tool Actions
The model returns strictly validated JSON conforming to `RootCauseAnalysisOutput`:
```json
{
  "root_cause": "temporary_bank_switch_latency",
  "confidence": 0.94,
  "evidence": [
    "Issuer HDFC switch timeout (504)",
    "Customer reliability score 98%",
    "Low transaction velocity"
  ],
  "recommended_action": "retry_payment",
  "reasoning_summary": "Transient gateway switch latency. Idempotency token verified; low-latency direct route retry recommended."
}
```

## 3. Policy Override Demonstration
When the AI proposes an action with high confidence (e.g. 94%), but the transaction amount exceeds the automated action threshold (₹10,000), the **Deterministic Policy Gateway** overrules the model and routes the case to human operators, recording `recovery.policy.overrode_ai_recommendation` in the audit ledger.
