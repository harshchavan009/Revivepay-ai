import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Cpu,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Terminal,
  Layers,
  Sparkles,
  Server,
  Code2,
  RefreshCw,
  GitBranch,
  KeyRound,
  FileCheck,
  Check,
  Clock,
  ExternalLink
} from "lucide-react";
import { Footer } from "../components/Footer";

interface AgentStep {
  stepNumber: number;
  title: string;
  shortDesc: string;
  actor: string;
  inputPayload: string;
  outputPayload: string;
  guarantees: string[];
}

const AGENT_STEPS: AgentStep[] = [
  {
    stepNumber: 1,
    title: "1. Ingest & Verify",
    shortDesc: "Webhook payload ingestion with HMAC-SHA256 signature verification and idempotency validation.",
    actor: "Razorpay Ingestion Node",
    inputPayload: `POST /api/webhooks/razorpay
X-Razorpay-Signature: d29...8f4
{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "id": "pay_89231",
      "amount": 499900,
      "error_code": "BANK_DECLINE"
    }
  }
}`,
    outputPayload: `CanonicalEvent {
  event_type: "payment.failed",
  amount: 4999.00,
  currency: "INR",
  source: "RAZORPAY_TEST",
  payload_hash: "sha256_created_9f82...",
  hmac_verified: true
}`,
    guarantees: [
      "HMAC-SHA256 cryptographic verification prevents spoofed webhook ingress.",
      "Idempotency cache ensures duplicate webhook retries are deduplicated.",
      "Event payload is mapped into RevivePay's canonical event taxonomy."
    ]
  },
  {
    stepNumber: 2,
    title: "2. Signal Extraction",
    shortDesc: "Evaluates 200+ telemetry signals across banking switch uptime, payroll windows, and customer history.",
    actor: "RevivePay Multi-Signal Engine",
    inputPayload: `CustomerContext {
  customer_id: "cust_vikram_1001",
  tier: "VIP",
  historical_success_rate: 88.9%,
  last_recovery_timestamp: "2026-08-25T09:14:00Z"
}`,
    outputPayload: `TelemetrySignals {
  bank_switch_latency_ms: 1420,
  issuer_bin_decline_velocity: 0.18,
  predicted_liquidity_window: "2026-08-29T09:00:00Z",
  computed_risk_score: 87.0
}`,
    guarantees: [
      "Real-time authorization switch queue monitoring across HDFC, ICICI, SBI, and Axis.",
      "Customer salary credit cycles (28th–5th) calculated from lifetime billing dates.",
      "Card velocity limits enforced to prevent issuer account freezes."
    ]
  },
  {
    stepNumber: 3,
    title: "3. AI Diagnostic Reasoning",
    shortDesc: "Structured LLM inference with strict JSON Schema output mapping root-cause and recovery strategy.",
    actor: "Revive AI Diagnostic Agent (Claude 3.5 / Gemini)",
    inputPayload: `PromptInput {
  model: "claude-3-5-sonnet",
  context: { amount: 4999.0, failure: "temporary_bank_failure", score: 87.0 }
}`,
    outputPayload: `{
  "root_cause": "temporary_bank_switch_latency",
  "confidence": 0.91,
  "recommended_action": "retry_payment",
  "reasoning": "Transient issuer gateway error resolved; safe for single automated retry."
}`,
    guarantees: [
      "Structured output constrained to strict Pydantic / TypeScript schemas.",
      "Zero free-form text execution: model can only choose from 7 whitelisted tools.",
      "Dual model fallback: Claude 3.5 Sonnet primary → Gemini 1.5 Pro standby."
    ]
  },
  {
    stepNumber: 4,
    title: "4. Deterministic Policy Gate",
    shortDesc: "Hard code boundaries evaluate invariant safety rules before any recovery action can execute.",
    actor: "RevivePay Policy Gateway",
    inputPayload: `PolicyChecklistRequest {
  action: "retry_payment",
  amount: 4999.00,
  confidence: 0.91,
  merchant_auto_limit: 10000.00
}`,
    outputPayload: `PolicyEvaluation {
  action_whitelisted: PASSED,
  max_retries_within_limit: PASSED (1 of 2),
  amount_within_auto_cap: PASSED (₹4,999 <= ₹10,000),
  confidence_floor_passed: PASSED (91% >= 85%),
  decision: "PASSED"
}`,
    guarantees: [
      "Zero-hallucination guarantee: AI recommendations cannot bypass deterministic code.",
      "Strict retry cap (max 2 attempts) enforced across all gateways.",
      "Transactions > ₹50,000 automatically routed to Human-in-the-Loop approval queue."
    ]
  },
  {
    stepNumber: 5,
    title: "5. Autonomous Action Dispatch",
    shortDesc: "Dispatches optimal recovery action via payment gateway API or 1-Click customer outreach.",
    actor: "RevivePay Execution Orchestrator",
    inputPayload: `DispatchAction {
  case_id: "RV-10291",
  target_tool: "retry_payment",
  route: "razorpay_direct_node",
  backoff_seconds: 30
}`,
    outputPayload: `GatewayResponse {
  payment_id: "pay_89231_retry_1",
  status: "SUCCESS",
  authorization_code: "AUTH_89231_OK",
  captured_amount: 4999.00
}`,
    guarantees: [
      "Exponential backoff with jitter prevents gateway switch congestion.",
      "1-Click WhatsApp payment links generated with time-limited JWT tokens.",
      "Multi-gateway cascading automatically fails over to backup direct routes."
    ]
  },
  {
    stepNumber: 6,
    title: "6. Webhook Reconciliation",
    shortDesc: "Listens for payment captured webhook confirmation and verifies settlement outcome.",
    actor: "Outcome Verification Node",
    inputPayload: `WebhookInbound {
  event: "payment.captured",
  payment_id: "pay_89231",
  status: "captured",
  amount: 499900
}`,
    outputPayload: `OutcomeState {
  case_id: "RV-10291",
  outcome_verified: true,
  recovered_amount: 4999.00,
  recovery_status: "RECOVERED"
}`,
    guarantees: [
      "Guarantees that a case is ONLY marked 'RECOVERED' upon definitive gateway confirmation.",
      "Reconciles partial captures, currency conversions, and gateway fee deductions.",
      "Closes active dunning channels immediately upon settlement."
    ]
  },
  {
    stepNumber: 7,
    title: "7. Cryptographic Audit Ledger",
    shortDesc: "Appends the verified transition to the SHA-256 hash-chained immutable audit ledger.",
    actor: "RevivePay Cryptographic Ledger",
    inputPayload: `AppendAuditEntry {
  case_id: "RV-10291",
  prev_hash: "e3b0c44298fc1c149afbf4c8996fb924...",
  event: "recovery.verified",
  timestamp: "2026-08-29T19:38:12Z"
}`,
    outputPayload: `AuditEntry {
  audit_id: "aud_9f821b",
  current_hash: "a4f89d31b0284e9c8f...",
  chain_valid: true
}`,
    guarantees: [
      "Mathematically linked SHA-256 hash chain prevents retroactive log tampering.",
      "Built with SOC-2-aligned access controls and PCI-DSS-informed data handling audit trail.",
      "Live verification endpoint flags any broken hash pointers instantly."
    ]
  }
];

export const ArchitecturePage: React.FC = () => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const activeStep = AGENT_STEPS[activeStepIdx];

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] font-sans flex flex-col justify-between transition-colors">
      {/* Header */}
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-premium-sm text-white">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="font-bold text-lg tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5">
                <span>RevivePay</span>
                <span className="text-[var(--color-accent)] text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)]">
                  AI
                </span>
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)] pl-4 border-l border-[var(--color-border-subtle)]">
              <span>System Architecture & Engineering Specification</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-premium-sm transition-all"
            >
              Open Command Center
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12 flex-1">
        {/* Hero Title & Recruiter Briefing Note */}
        <div className="space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] font-mono text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>FINTECH ENGINEERING SPECIFICATION · AGENTIC ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] tracking-tight leading-tight">
            How RevivePay Executes Policy-Gated Autonomous Recovery
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            RevivePay replaces dumb, blind dunning cron loops with a 7-stage autonomous agent loop. Built with strict deterministic policy guardrails, cryptographic SHA-256 hash chaining, and real-time Razorpay webhook verification.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero Frontend Secret Leakage</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Deterministic Policy Invariants</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>SHA-256 Hash Chain Integrity</span>
            </span>
          </div>
        </div>

        {/* INTERVIEW-READINESS ARTIFACT: Why a Deterministic Policy Layer */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-accent-border)] shadow-premium-md space-y-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Why a Deterministic Policy Layer, Not Just an LLM?
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold border border-[var(--color-accent-border)]">
              Core Design Invariant
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            The LLM proposes and reasons based on multi-signal telemetry, but a bounded, auditable rules engine (hard retry caps, approval thresholds, confidence floors) has the final say on execution — because payment actions need to be explainable and mathematically safe even if the model's output is unpredictable.
          </p>
          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Max 2 automated retries</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>≥ ₹50,000 Step-Up approval gate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>85% minimum confidence floor</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>7 whitelisted execution tools</span>
            </span>
          </div>
        </div>

        {/* REFERENCE IMPLEMENTATION: RBI GUIDELINE INTEGRATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: RBI TAT Framework */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                RBI Turn Around Time (TAT) Framework
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold">
                RBI/2019-20/67
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Reference implementation of RBI's Turn Around Time and customer compensation framework for failed transactions (RBI/2019-20/67). This is a working model of the published guideline, not a certified compliance system.
            </p>
            <div className="text-[11px] font-mono text-[var(--color-text-muted)] space-y-1 pt-2 border-t border-[var(--color-border-subtle)]">
              <p>• UPI Rail: Auto-reversal deadline T+1 working day</p>
              <p>• Card / NEFT: Auto-reversal deadline T+5 working days</p>
              <p>• ₹100/day statutory penalty accrued for overdue cases</p>
              <p>• Overdue cases automatically escalated to human approval</p>
            </div>
          </div>

          {/* Card 2: RBI e-Mandate Framework */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-500 shrink-0" />
              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                RBI e-Mandate & AFA Framework
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold">
                e-Mandate Guidance
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Reference implementation of RBI's e-mandate framework for recurring payments, enforcing 24-hour pre-debit notifications and Additional Factor Authentication (AFA) setup thresholds. This models published guidance, not a certified integration with NPCI's actual mandate registry.
            </p>
            <div className="text-[11px] font-mono text-[var(--color-text-muted)] space-y-1 pt-2 border-t border-[var(--color-border-subtle)]">
              <p>• Subscriptions ≥ ₹15,000 mandate initial AFA setup</p>
              <p>• Strict 24-hour pre-debit alert window before auto-retry</p>
              <p>• Simulated customer opt-out logged to immutable audit ledger</p>
              <p>• Backend enforces window verification on all dunning retries</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: INTERACTIVE 7-STAGE AGENT LOOP */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-[var(--color-accent)]" />
                <span>The 7-Stage Autonomous Agent Loop</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Click any stage to inspect real input payloads, deterministic guardrails, and cryptographic outputs.
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--color-accent)] font-bold">
              Stage {activeStepIdx + 1} of {AGENT_STEPS.length}
            </span>
          </div>

          {/* Stepper Buttons Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {AGENT_STEPS.map((step, idx) => (
              <button
                key={step.stepNumber}
                onClick={() => setActiveStepIdx(idx)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeStepIdx === idx
                    ? "bg-[var(--color-accent-subtle)] border-[var(--color-accent)] shadow-premium-sm text-[var(--color-text-primary)]"
                    : "bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[var(--color-text-secondary)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs">Step 0{step.stepNumber}</span>
                  {activeStepIdx === idx && (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
                  )}
                </div>
                <p className="text-xs font-bold mt-1 text-[var(--color-text-primary)] truncate">{step.title.split(". ")[1]}</p>
              </button>
            ))}
          </div>

          {/* Detailed Active Step Inspector Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
              <div>
                <span className="text-[10px] font-mono text-[var(--color-accent)] uppercase tracking-wider font-bold">
                  STAGE SPECIFICATION
                </span>
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mt-0.5">
                  {activeStep.title}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{activeStep.shortDesc}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-bold">
                  Actor: <strong className="text-[var(--color-text-primary)]">{activeStep.actor}</strong>
                </span>
              </div>
            </div>

            {/* Input & Output Code Blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Telemetry */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider font-bold block">
                  Input Telemetry / Context:
                </span>
                <pre className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-[11px] font-mono text-slate-300 dark:text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{activeStep.inputPayload}</code>
                </pre>
              </div>

              {/* Output Transformation */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[var(--color-accent)] uppercase tracking-wider font-bold block">
                  Deterministic Execution / State Transition:
                </span>
                <pre className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-accent-border)] text-[11px] font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto leading-relaxed">
                  <code>{activeStep.outputPayload}</code>
                </pre>
              </div>
            </div>

            {/* Architectural Guarantees */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider font-bold block">
                Stage Invariants & Safety Guarantees:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeStep.guarantees.map((g, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THREE-TIER MODEL ROUTING TOPOLOGY */}
        <section className="space-y-6">
          <div className="border-b border-[var(--color-border-subtle)] pb-4">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[var(--color-accent)]" />
              <span>Multi-Model Routing & Deterministic Safety Layer</span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              How Revive balances complex diagnostic reasoning latency against zero-hallucination safety policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Model */}
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  PRIMARY AGENT
                </span>
                <span className="text-xs font-mono text-[var(--color-text-muted)]">Mean: 380ms</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Claude 3.5 Sonnet</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  Deep multi-factor root-cause analysis. Evaluates subtle correlation between recurring dunning attempts and corporate payroll schedules.
                </p>
              </div>
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-1.5 font-mono pt-2 border-t border-[var(--color-border-subtle)]">
                <li>• Strict JSON Schema response format</li>
                <li>• 0.2 temperature for deterministic output</li>
                <li>• Outputs case-grounded evidence bullets</li>
              </ul>
            </div>

            {/* Standby Fallback */}
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold border border-[var(--color-accent-border)]">
                  HOT STANDBY
                </span>
                <span className="text-xs font-mono text-[var(--color-text-muted)]">Mean: 410ms</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Google Gemini 1.5 Pro</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  High-throughput structured classification engine with automatic fallback triggering if primary API times out or rate limits.
                </p>
              </div>
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-1.5 font-mono pt-2 border-t border-[var(--color-border-subtle)]">
                <li>• 100% schema parity with primary</li>
                <li>• Sub-500ms timeout circuit breaker</li>
                <li>• Verified live API connection</li>
              </ul>
            </div>

            {/* Deterministic Rule Engine */}
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/30">
                  SAFETY INVARIANT
                </span>
                <span className="text-xs font-mono text-emerald-500 font-bold">&lt; 1ms Latency</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Deterministic Gateway</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  Hard policy boundary that cannot be bypassed. Validates confidence floor, merchant retry caps, and human operator escalation rules.
                </p>
              </div>
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-1.5 font-mono pt-2 border-t border-[var(--color-border-subtle)]">
                <li>• Zero-hallucination execution floor</li>
                <li>• Max 2 retries per transaction</li>
                <li>• ₹50,000 threshold enforces operator review</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 3: CRYPTOGRAPHIC SHA-256 AUDIT LEDGER */}
        <section className="p-8 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-6 shadow-premium-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
                <Lock className="w-3.5 h-3.5" />
                <span>TAMPER-EVIDENT LEDGER</span>
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
                Cryptographic SHA-256 Hash Chaining
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Every state transition is chained to the previous entry hash pointer: <code className="text-[var(--color-accent)] font-mono">H_n = SHA256(H_prev + timestamp + actor + action + payload)</code>.
              </p>
            </div>
            <Link
              to="/audit"
              className="px-4 py-2 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-primary)] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Explore Live Audit Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1.5">
              <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Append-Only Integrity</span>
              </span>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Log entries cannot be modified or deleted. Any alteration of past records breaks the subsequent mathematical hash chain.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1.5">
              <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[var(--color-accent)]" />
                <span>HMAC Webhook Provenance</span>
              </span>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Webhook origins are validated via HMAC-SHA256 signatures before entering the event queue, preventing unauthorized injection.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1.5">
              <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>SOC-2 & PCI-DSS-Informed Architecture</span>
              </span>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Zero cardholder PAN or CVV retention. Tokenized gateway identifiers with role-based operator governance.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: RECRUITER & STAFF ENGINEER QUICK LINKS */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-[var(--color-bg-surface)] to-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-premium-md">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
              Explore the Codebase & Interactive Sandbox
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xl">
              Inspect the live 22 pytest test suite, real-time FastAPI SSE stream, and simulation lab in action.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/cases/RV-10291"
              className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Inspect Demo Case RV-10291</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/simulation"
              className="px-5 py-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] font-semibold text-xs transition-colors cursor-pointer"
            >
              <span>Simulation Lab</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
