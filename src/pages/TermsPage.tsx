import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Footer } from "../components/Footer";

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] font-sans flex flex-col justify-between transition-colors">
      {/* Header */}
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-[var(--color-accent)] font-bold text-base hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-text-secondary)]">
            <span>RevivePay Terms of Service</span>
            <span className="text-[var(--color-accent)] font-bold">v2.4 (2026)</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 flex-1">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] font-mono text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>LEGAL & COMPLIANCE AGREEMENT</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Terms of Service</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Effective Date: January 1, 2026 · Last Updated: August 29, 2026</p>
        </div>

        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-accent)]" />
            <span>1. Service Overview & Autonomous Scope</span>
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            RevivePay AI ("RevivePay", "Platform") provides policy-governed, autonomous payment recovery and dunning services integrated with payment gateways (including Razorpay Test Mode). By deploying our webhooks, SDKs, or dashboard, you authorize RevivePay to evaluate failed payment telemetry, score risk factors, and execute automated retries or notifications strictly within the parameters configured in your Policy Guardrails.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>2. Deterministic Guardrails & Bounded Actions</span>
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            RevivePay guarantees that AI agents operate under deterministic safety policy boundaries. Autonomous retries are strictly capped (default maximum 2 retries per transaction) to prevent issuer decline penalties. High-value transactions exceeding merchant thresholds require mandatory human-in-the-loop operator approval.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-accent)]" />
            <span>3. Data Governance & Immutable Auditing</span>
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            All state transitions, AI root-cause diagnoses, and human approval decisions are cryptographically hash-chained in an append-only audit ledger. Neither party may alter past audit entries. Payment credentials (e.g. CVV, plaintext card numbers) are never stored on RevivePay systems; tokenized gateway references are used exclusively.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-accent)]" />
            <span>4. Limitation of Liability & Sandbox Testing</span>
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            In test mode and sandbox environments, all transactions utilize simulated or test gateway credentials. Merchants must verify integration compliance before enabling automated production execution.
          </p>
        </section>

        <div className="pt-6 border-t border-[var(--color-border-subtle)] flex justify-between items-center text-xs text-[var(--color-text-secondary)] font-mono">
          <span>RevivePay Autonomous Revenue Engine</span>
          <Link to="/privacy" className="text-[var(--color-accent)] hover:underline">View Privacy Policy →</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
