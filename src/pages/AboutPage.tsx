import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";
import { Footer } from "../components/Footer";
import { useMetrics } from "../context/MetricsContext";

export const AboutPage: React.FC = () => {
  const { recoveryRate } = useMetrics();
  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] font-sans flex flex-col justify-between selection:bg-[var(--color-accent)] selection:text-white">
      {/* Top Navigation */}
      <header className="h-16 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] px-6 flex items-center justify-between sticky top-0 z-30 shadow-premium-sm backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shadow-premium-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5">
            <span>revive</span>
            <span className="text-[var(--color-accent)] text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)]">
              AI
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Pricing
          </Link>
          <Link to="/security" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Security
          </Link>
          <Link to="/status" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Status
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all"
          >
            Launch Console
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OUR MISSION</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Eliminating involuntary payment failures for modern digital commerce.
          </h1>
          <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
            Every day, high-growth Indian businesses lose crores in revenue to transient bank switch outages, card expiry, and checkout friction. RevivePay turns payment failures into automated recovery pipelines without customer friction.
          </p>
        </div>

        {/* Milestones Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-center space-y-1 shadow-premium-sm">
            <span className="font-mono text-3xl font-extrabold text-[var(--color-accent)]">{recoveryRate.toFixed(1)}%</span>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">Autonomous Recovery Rate</p>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-center space-y-1 shadow-premium-sm">
            <span className="font-mono text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">200+</span>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">ML Signals Ingested</p>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-center space-y-1 shadow-premium-sm">
            <span className="font-mono text-3xl font-extrabold text-purple-600 dark:text-purple-400">&lt;14ms</span>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">Telemetry Decision Latency</p>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-center space-y-1 shadow-premium-sm">
            <span className="font-mono text-3xl font-extrabold text-amber-600 dark:text-amber-400">100%</span>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">Deterministic Guardrail Safety</p>
          </div>
        </div>

        {/* Philosophy & Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
            <div className="p-3 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] w-fit border border-[var(--color-accent-border)]">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Intelligent Timing Signals</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Legacy dunning sends blind retries on fixed hourly intervals that trigger issuer penalty fees. RevivePay uses 200+ telemetry signals to calculate the customer’s precise liquidity window.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Ramp-Grade Policy Gates</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Every autonomous decision is governed by explicit merchant rules. High-value transactions or sensitive enterprise accounts are automatically gated for human operator review.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit border border-purple-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Cryptographic Audit Ledger</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              All telemetry, policy evaluations, and payment captures are permanently recorded in an immutable SHA-256 hash chain that guarantees end-to-end auditability and compliance.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
