import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, ArrowLeft, CheckCircle2, Server } from "lucide-react";
import { Footer } from "../components/Footer";

export const PrivacyPage: React.FC = () => {
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
            <span>RevivePay Privacy Governance</span>
            <span className="text-emerald-500 font-bold">PCI-DSS-Informed Architecture</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 flex-1">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>DATA PROTECTION & PCI-DSS-INFORMED ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Effective Date: January 1, 2026 · Technical Reference: PCI-DSS v4.0 Handling Standards</p>
        </div>

        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--color-accent)]" />
            <span>1. Zero Primary Account Number (PAN) Retention</span>
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            RevivePay never receives, processes, or stores unencrypted 16-digit primary account numbers (PAN), CVV security codes, or card PINs. All payment transactions are executed via tokenized payment identifiers and secure redirect tokens through authorized gateways (e.g. Razorpay).
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-500" />
            <span>2. Ingress Telemetry & Webhook Processing</span>
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            When webhook events are ingested, RevivePay captures only metadata required for failure analysis: transaction amount, currency, error reason codes, customer email/name, and masked card network labels (e.g. Visa ···· 4242). Webhooks are validated using HMAC-SHA256 signatures before entering the event pipeline.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-accent)]" />
            <span>3. Customer Consent & Communication</span>
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Automated recovery prompts (via Email, SMS, or WhatsApp) are only dispatched when customer communication consent is active. Customers may opt-out from automated payment link reminders at any time, immediately halting automated recovery cycles.
          </p>
        </section>

        <div className="pt-6 border-t border-[var(--color-border-subtle)] flex justify-between items-center text-xs text-[var(--color-text-secondary)] font-mono">
          <span>RevivePay Autonomous Revenue Engine</span>
          <Link to="/terms" className="text-[var(--color-accent)] hover:underline">View Terms of Service →</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
