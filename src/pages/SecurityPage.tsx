import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Key,
  Cpu,
  RefreshCw,
  FileCode,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Server,
  Layers,
  Terminal,
  Activity
} from "lucide-react";
import { Footer } from "../components/Footer";

export const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] font-sans flex flex-col justify-between transition-colors">
      {/* Top Header */}
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-[var(--color-accent)] font-bold text-sm hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs text-[var(--color-text-secondary)]">
            <span className="hidden sm:inline">Engineering Whitepaper</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              SOC-2 Aligned Access Controls
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 flex-1">
        {/* Title & Badge */}
        <div className="space-y-3 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] font-mono text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SECURITY, GOVERNANCE & ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Security Architecture & Technical Controls
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            An honest, engineering-first specification of the cryptographic verification, role-based authorization, high-value governance, and deterministic safety mechanisms active in RevivePay AI.
          </p>
        </div>

        {/* Section 1: Webhook HMAC-SHA256 Verification */}
        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
              <Key className="w-5 h-5 text-[var(--color-accent)] shrink-0" />
              <span>1. Cryptographic HMAC-SHA256 Webhook Ingestion</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              TIMING-SAFE
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            All incoming payment failure and settlement webhooks received at <code className="font-mono text-[var(--color-accent)] bg-[var(--color-bg-canvas)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)]">POST /api/webhooks/razorpay</code> are cryptographically verified using HMAC-SHA256 over the raw payload body.
          </p>
          <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] font-mono text-[11px] text-[var(--color-text-secondary)] space-y-1">
            <p className="text-[var(--color-text-primary)] font-bold">Verification Invariant:</p>
            <p>expected_sig = HMAC_SHA256(webhook_secret, raw_payload_bytes).hexdigest()</p>
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">assert hmac.compare_digest(expected_sig, x_razorpay_signature) == True</p>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Missing headers or tampered payload bytes immediately abort with <code className="font-mono text-rose-500 font-bold">HTTP 401 Unauthorized</code> before any transaction state or database record is updated.
          </p>
        </section>

        {/* Section 2: Server-Side RBAC Enforcement */}
        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>2. Server-Side Role-Based Access Control (RBAC)</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              JWT SCOPES
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Authorization is strictly enforced in the FastAPI backend service dependencies, not merely hidden in the UI. Every route requiring mutation verifies the caller's verified role:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">Admin & Revenue Operator</span>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Authorized to trigger policy evaluations, sign off on manual approvals, execute retries, and run chaos simulations.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">Support Operator (Read-Only)</span>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Restricted to read-only customer investigation. Mutation attempts return <code className="font-mono text-rose-500 font-bold">HTTP 403 Forbidden</code>.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: High-Value Step-Up Governance */}
        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-amber-500 shrink-0" />
              <span>3. Step-Up Re-Authentication for High-Value Operations</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              ≥ ₹50,000 GATE
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Transactions with amount at risk <strong className="text-[var(--color-text-primary)]">≥ ₹50,000</strong> trigger a mandatory Step-Up Re-Authentication checkpoint. The operator must re-enter their credentials or 6-digit MFA OTP code via an interactive dialog before an approval payload is accepted.
          </p>
          <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-1.5 pl-2 font-mono">
            <li>Approvals without a verified step-up token are rejected with <strong className="text-rose-500">HTTP 400 Bad Request</strong>.</li>
            <li>Successful step-up events emit canonical event <code className="text-emerald-600 dark:text-emerald-400 font-bold">recovery.approval.stepup_verified</code>.</li>
            <li>Recorded with operator email, timestamp, and case reference into the cryptographic audit ledger.</li>
          </ul>
        </section>

        {/* Section 4: SHA-256 Cryptographic Hash Chaining */}
        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>4. SHA-256 Hash-Chained Immutable Audit Ledger</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              BLOCKCHAIN-INSPIRED
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Every audit entry in RevivePay is mathematically linked to its immediate predecessor using a SHA-256 block hash formula:
          </p>
          <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] font-mono text-[11px] text-[var(--color-text-secondary)] space-y-1">
            <p>entry_hash = SHA-256(prev_hash + audit_id + timestamp + actor + action + case_id + notes)</p>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            The ledger can be verified in real time from Genesis to Head via <code className="font-mono text-[var(--color-accent)] bg-[var(--color-bg-canvas)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)]">GET /api/audit/verify-chain</code>. Any retroactive database modification invalidates all subsequent block hashes and triggers immediate alerts.
          </p>
        </section>

        {/* Section 5: Deterministic Policy Floor & Multi-Tier AI */}
        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-purple-500 shrink-0" />
              <span>5. Deterministic Policy Floor & Multi-Tier AI Provider</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              SAFE FLOOR
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            RevivePay eliminates single-vendor AI dependencies and black-box failures through sequential 3-tier fallback routing:
          </p>
          <div className="space-y-2 pt-1 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] flex items-center justify-between">
              <span className="text-[var(--color-text-primary)] font-bold">1. Primary Tier: Anthropic Claude 3.5 Sonnet</span>
              <span className="text-[10px] text-[var(--color-accent)]">Deep Diagnostic</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] flex items-center justify-between">
              <span className="text-[var(--color-text-primary)] font-bold">2. Fallback Tier: Google Gemini 1.5 Pro</span>
              <span className="text-[10px] text-amber-500">Secondary Route</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] flex items-center justify-between">
              <span className="text-[var(--color-text-primary)] font-bold">3. Safe Floor: Deterministic Rules Engine</span>
              <span className="text-[10px] text-emerald-500">100% Uptime Guarantee</span>
            </div>
          </div>
        </section>

        {/* Section 6: Transport Security & Anti-Abuse Rate Limiting */}
        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-blue-500 shrink-0" />
              <span>6. Rate Limiting, CSP & HTTP Security Headers</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              ANTI-ABUSE
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            All API and static responses enforce strict security headers and rate limits:
          </p>
          <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-1 pl-2 font-mono">
            <li><strong className="text-[var(--color-text-primary)]">Rate Limiting:</strong> 15 req/min on <code className="text-[var(--color-accent)]">/api/auth/*</code>; 120 req/min on <code className="text-[var(--color-accent)]">/api/webhooks/*</code>.</li>
            <li><strong className="text-[var(--color-text-primary)]">Content-Security-Policy (CSP):</strong> Prevents unauthorized script injections.</li>
            <li><strong className="text-[var(--color-text-primary)]">X-Frame-Options: DENY:</strong> Blocks iframe clickjacking.</li>
            <li><strong className="text-[var(--color-text-primary)]">Strict-Transport-Security:</strong> 1-year preload HSTS transport encryption.</li>
            <li><strong className="text-[var(--color-text-primary)]">X-Content-Type-Options: nosniff:</strong> Prevents MIME-confusion attacks.</li>
          </ul>
        </section>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[var(--color-text-secondary)] font-mono">
          <span>RevivePay Autonomous Revenue Engine • Version 1.0</span>
          <Link to="/dashboard" className="text-[var(--color-accent)] hover:underline font-bold">
            Enter Command Center →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
