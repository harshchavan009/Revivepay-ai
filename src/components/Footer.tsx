import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Activity,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Terminal,
  Heart
} from "lucide-react";
import { useMetrics } from "../context/MetricsContext";

export const Footer: React.FC = () => {
  const { recoveryRate } = useMetrics();

  return (
    <footer className="w-full bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] font-sans text-xs transition-colors">
      {/* Top CTA Banner */}
      <div className="max-w-7xl mx-auto px-6 py-10 border-b border-[var(--color-border-subtle)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
              Autonomous Revenue Protection
            </span>
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
            Ready to recover up to {recoveryRate.toFixed(1)}% of failed payments?
          </h3>
          <p className="text-[var(--color-text-secondary)] text-xs">
            Deploy RevivePay in under 10 minutes with native Razorpay test mode webhooks.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all cursor-pointer"
          >
            Launch Live Demo
          </Link>
          <Link
            to="/pricing"
            className="px-5 py-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] font-semibold text-xs transition-colors cursor-pointer"
          >
            View Pricing
          </Link>
        </div>
      </div>

      {/* Main Column Links */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand & Security Stamp */}
        <div className="col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-2.5 group">
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
          <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed max-w-sm">
            Autonomous revenue recovery engine for India's payment ecosystem. Powered by 200+ ML timing signals and deterministic policy guardrails.
          </p>

          <div className="flex items-center gap-2.5 pt-2 flex-wrap">
            <Link
              to="/security"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-[10px] font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent-border)] transition-colors"
              title="Built with SOC-2-aligned access controls"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>SOC-2 Aligned</span>
            </Link>
            <Link
              to="/security"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-[10px] font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent-border)] transition-colors"
              title="PCI-DSS-informed data handling patterns"
            >
              <Lock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>PCI-DSS Informed</span>
            </Link>
            <Link
              to="/status"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>100% Uptime</span>
            </Link>
          </div>
        </div>

        {/* Product Column */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)] font-mono">
            Product
          </h4>
          <ul className="space-y-2 text-[var(--color-text-secondary)]">
            <li>
              <Link to="/changelog" className="text-[var(--color-accent)] font-semibold hover:underline flex items-center gap-1">
                <span>Engineering Notes</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] font-bold">ADR</span>
              </Link>
            </li>
            <li>
              <Link to="/security" className="hover:text-[var(--color-accent)] transition-colors">
                Security Specification
              </Link>
            </li>
            <li>
              <Link to="/#how-it-works" className="hover:text-[var(--color-accent)] transition-colors">
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/#signals-engine" className="hover:text-[var(--color-accent)] transition-colors">
                200+ ML Signals
              </Link>
            </li>
            <li>
              <Link to="/#roi-calculator" className="hover:text-[var(--color-accent)] transition-colors">
                ROI Calculator
              </Link>
            </li>
            <li>
              <Link to="/#comparison" className="hover:text-[var(--color-accent)] transition-colors">
                Vs Legacy Dunning
              </Link>
            </li>
            <li>
              <Link to="/simulation" className="hover:text-[var(--color-accent)] transition-colors">
                Simulation Lab
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-[var(--color-accent)] transition-colors">
                Pricing Plans
              </Link>
            </li>
          </ul>
        </div>

        {/* Company & Trust Column */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)] font-mono">
            Company
          </h4>
          <ul className="space-y-2 text-[var(--color-text-secondary)]">
            <li>
              <Link to="/about" className="hover:text-[var(--color-accent)] transition-colors">
                About RevivePay
              </Link>
            </li>
            <li>
              <Link to="/security" className="hover:text-[var(--color-accent)] transition-colors">
                Security & Trust
              </Link>
            </li>
            <li>
              <Link to="/status" className="hover:text-[var(--color-accent)] transition-colors">
                System Status
              </Link>
            </li>
            <li>
              <Link to="/audit" className="hover:text-[var(--color-accent)] transition-colors">
                Audit Ledger
              </Link>
            </li>
            <li>
              <Link to="/notifications" className="hover:text-[var(--color-accent)] transition-colors">
                Incident Feed
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Governance */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)] font-mono">
            Governance
          </h4>
          <ul className="space-y-2 text-[var(--color-text-secondary)]">
            <li>
              <Link to="/policies" className="hover:text-[var(--color-accent)] transition-colors">
                Policy Guardrails
              </Link>
            </li>
            <li>
              <Link to="/security" className="hover:text-[var(--color-accent)] transition-colors">
                RBI e-Mandate Framework
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-[var(--color-accent)] transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-[var(--color-accent)] transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/settings" className="hover:text-[var(--color-accent)] transition-colors">
                Webhook Settings
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="max-w-7xl mx-auto px-6 py-6 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--color-text-secondary)]">
        <div>
          © {new Date().getFullYear()} RevivePay AI Inc. All rights reserved. Razorpay Partner Network.
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
            <span>v2.4 Production</span>
          </span>
          <span>•</span>
          <span>SHA-256 HMAC Verified</span>
        </div>
      </div>
    </footer>
  );
};
