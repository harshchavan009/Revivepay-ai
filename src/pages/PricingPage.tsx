import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Zap,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Footer } from "../components/Footer";
import { formatINR } from "../data/mockData";
import { useMetrics } from "../context/MetricsContext";

export const PricingPage: React.FC = () => {
  const { recoveryRate } = useMetrics();
  const [monthlyFailedRevenue, setMonthlyFailedRevenue] = useState<number>(500000);
  const rateMultiplier = (recoveryRate || 52.7) / 100;
  const estimatedRecovery = Math.round(monthlyFailedRevenue * rateMultiplier);
  const reviveFee = Math.round(estimatedRecovery * 0.015);
  const netMerchantGain = estimatedRecovery - reviveFee;

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
          <Link to="/about" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            About
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

      {/* Main Pricing Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] text-xs font-mono font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>VALUE-ALIGNED PRICING</span>
          </div>
          <h1 className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Pay only for revenue we successfully recover.
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            No upfront setup fees. No long-term contracts. 100% aligned with your recovered bottom line.
          </p>
        </div>

        {/* Pricing Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Plan */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-6 shadow-premium-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Starter</span>
                <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">Free Beta</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">For early startups and pilot integrations</p>
              </div>

              <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2.5 text-xs text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Up to ₹2,00,000 monthly recovered revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Native Razorpay Webhook Ingestion</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Basic 200+ ML timing heuristics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Simulation lab access</span>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] font-bold text-xs border border-[var(--color-border)] text-center transition-colors block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Growth Plan (Highlighted) */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface-raised)] border-2 border-[var(--color-accent)] space-y-6 shadow-premium-lg relative flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-extrabold uppercase font-mono shadow-sm">
              Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-wider">Growth</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <h3 className="text-3xl font-extrabold text-[var(--color-text-primary)] font-mono">1.5%</h3>
                  <span className="text-xs text-[var(--color-text-secondary)]">of recovered revenue</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">For high-growth SaaS, subscription & D2C brands</p>
              </div>

              <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2.5 text-xs text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                  <span className="text-[var(--color-text-primary)] font-semibold">Unlimited recovered volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                  <span>200+ ML Signals Real-Time Model</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                  <span>WhatsApp & SMS 1-Click Recovery Links</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                  <span>Ramp-Style Human Approval Center</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                  <span>Cryptographic Audit Trail & Chain</span>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-extrabold text-xs text-center shadow-premium-sm transition-all block"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-6 shadow-premium-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Enterprise</span>
                <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">Custom Tier</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">For multi-gateway enterprise merchants</p>
              </div>

              <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2.5 text-xs text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Volume-based custom percentage (down to 0.75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Custom Gateway Adapters (Stripe, PayU, Billdesk)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Dedicated VPC / On-Premise Deployment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>99.99% Guaranteed SLA with 24/7 Phone Support</span>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] font-bold text-xs border border-[var(--color-border)] text-center transition-colors block"
            >
              Contact Enterprise Sales
            </Link>
          </div>
        </div>

        {/* Interactive ROI Calculator */}
        <div id="roi-calculator" className="p-8 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-6 shadow-premium-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Interactive ROI Value Calculator</h3>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Calculate your projected recovered revenue and net margin expansion with RevivePay AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
            <div className="space-y-4">
              <label className="text-xs font-semibold text-[var(--color-text-primary)] flex justify-between">
                <span>Monthly Failed Payment Volume:</span>
                <span className="font-mono text-[var(--color-accent)] font-bold">{formatINR(monthlyFailedRevenue)}</span>
              </label>
              <input
                type="range"
                min="50000"
                max="5000000"
                step="50000"
                value={monthlyFailedRevenue}
                onChange={(e) => setMonthlyFailedRevenue(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                <span>₹50,000</span>
                <span>₹25,00,000</span>
                <span>₹50,00,000</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-text-secondary)]">Projected Revenue Recovered ({recoveryRate.toFixed(1)}%):</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(estimatedRecovery)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-text-secondary)]">RevivePay Fee (1.5% success fee):</span>
                <span className="font-mono text-[var(--color-text-secondary)]">- {formatINR(reviveFee)}</span>
              </div>
              <div className="pt-2 border-t border-[var(--color-border-subtle)] flex justify-between text-sm">
                <span className="font-bold text-[var(--color-text-primary)]">Net Monthly Revenue Saved:</span>
                <span className="font-mono font-extrabold text-[var(--color-accent)] text-base">{formatINR(netMerchantGain)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
