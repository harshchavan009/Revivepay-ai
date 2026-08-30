import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Cpu,
  Lock,
  Layers,
  ArrowLeft,
  KeyRound,
  FileCode,
  Terminal,
  Activity,
  CheckCircle2,
  ChevronRight,
  Database,
  ArrowUpRight,
  ArrowRight
} from "lucide-react";
import { Footer } from "../components/Footer";

export const EngineeringNotesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("loop");

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] font-sans flex flex-col justify-between selection:bg-[var(--color-accent)] selection:text-white transition-colors">
      {/* Header */}
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
          <Link to="/status" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            System Status
          </Link>
          <Link to="/security" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Security Specification
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all"
          >
            Launch Console
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 space-y-10 w-full">
        {/* Title */}
        <div className="space-y-3 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] font-mono text-xs font-bold">
            <FileCode className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL DECISION RECORDS (ADR)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Engineering Notes & System Architecture
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            A comprehensive engineering postmortem and technical specification explaining key design choices: our 7-stage autonomous lifecycle, deterministic safety boundaries, dual-mode ingestion, and cryptographic integrity guarantees.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] pb-2 overflow-x-auto">
          {[
            { id: "loop", label: "1. 7-Stage Agent Loop" },
            { id: "policy", label: "2. Deterministic Policy Gate" },
            { id: "ingestion", label: "3. Dual-Mode Ingestion" },
            { id: "ledger", label: "4. Hash-Chained Audit Ledger" },
            { id: "multitier", label: "5. Multi-Tier AI Provider" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[var(--color-accent)] text-white shadow-premium-sm"
                  : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section 1: 7-Stage Autonomous Loop */}
        {activeTab === "loop" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[var(--color-accent)]" />
                <span>The 7-Stage Autonomous Revenue Lifecycle</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Rather than treating payment failures as binary dropoffs, RevivePay executes a strict 7-stage state machine that transitions every declined transaction into a verified resolution.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {[
                  { step: "Stage 1: INGEST", desc: "Webhook received via HMAC-SHA256 signature verification or Simulation Lab trigger." },
                  { step: "Stage 2: NORMALIZE", desc: "Maps bank gateway error codes (e.g. BAD_REQUEST_PAYMENT_TIMED_OUT, 05, 51, 91) to canonical taxonomy." },
                  { step: "Stage 3: RISK SCORE", desc: "Calculates a deterministic 4-factor composite risk score (0-100) weighting amount, history, and severity." },
                  { step: "Stage 4: AI DIAGNOSIS", desc: "Multi-tier LLM engine (Claude 3.5 Sonnet / Gemini 1.5 Pro) synthesizes telemetry into root-cause narrative." },
                  { step: "Stage 5: POLICY GATE", desc: "Deterministic safety checks evaluate retry bounds, high-value thresholds, and whitelist rules." },
                  { step: "Stage 6: SAFE EXECUTE", desc: "Auto-executes approved recovery tools or routes to Human-in-the-Loop review queue with Step-Up auth." },
                  { step: "Stage 7: HASH LOG", desc: "Appends the decision, raw prompt, model response, and latency into the SHA-256 audit ledger." }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
                    <span className="text-xs font-mono font-bold text-[var(--color-accent)]">{item.step}</span>
                    <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Section 2: Deterministic Policy Gate */}
        {activeTab === "policy" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Why a Deterministic Policy Layer Sits Between the LLM and Execution</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Large Language Models are probabilistic by nature. In financial technology and payment settlement, non-deterministic hallucinations can cause catastrophic duplicate charges, compliance breaches, or unauthorized payouts.
              </p>

              <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-2 font-mono text-xs">
                <p className="text-[var(--color-text-primary)] font-bold">Hard Deterministic Guardrails:</p>
                <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 text-[11px]">
                  <li><strong className="text-[var(--color-text-primary)]">Max Retry Bound:</strong> Strictly enforces <code className="text-amber-500">retry_count &lt; 2</code>. Once reached, further retries are mathematically blocked.</li>
                  <li><strong className="text-[var(--color-text-primary)]">High-Value Threshold (₹50,000):</strong> Any action $\ge$ ₹50,000 forces Human-in-the-Loop review with mandatory Step-Up Re-Authentication.</li>
                  <li><strong className="text-[var(--color-text-primary)]">Whitelisted Actions Only:</strong> Only 7 predefined idempotent tools (<code className="text-[var(--color-accent)]">retry_payment</code>, <code className="text-[var(--color-accent)]">switch_gateway_route</code>, etc.) can execute.</li>
                  <li><strong className="text-[var(--color-text-primary)]">Settled Invariant Lock:</strong> If a payment is already marked <code className="text-emerald-500">SUCCESS</code>, subsequent retry execution is permanently locked.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Content Section 3: Dual-Mode Ingestion */}
        {activeTab === "ingestion" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Dual-Mode Ingestion: Real Webhooks vs. Synthetic Chaos</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                RevivePay operates dual ingestion pathways with strict database-level provenance isolation:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">1. Razorpay Test Mode Webhooks</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                      RAZORPAY_TEST
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    Genuine HTTP webhook events from real Razorpay test accounts verified via HMAC-SHA256 signatures. Tagged with <code className="font-mono text-emerald-600 dark:text-emerald-400">source: RAZORPAY_TEST</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">2. Chaos Simulation Lab</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                      SIMULATION
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    Synthetic chaos scenarios (HDFC switch downtime, payroll spikes) for safe operator training without touching live accounts. Tagged with <code className="font-mono text-purple-600 dark:text-purple-400">source: SIMULATION</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Section 4: Hash-Chained Audit Ledger */}
        {activeTab === "ledger" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" />
                <span>Cryptographic SHA-256 Hash-Chained Audit Ledger</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Traditional relational database logs can be silently edited with SQL <code className="font-mono text-[var(--color-accent)]">UPDATE</code> statements. RevivePay adopts blockchain-inspired hash chaining to provide mathematically verifiable tamper detection.
              </p>

              <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-2 font-mono text-xs">
                <p className="text-emerald-600 dark:text-emerald-400 font-bold">SHA-256 Block Formula:</p>
                <p className="text-[11px] text-[var(--color-text-primary)]">
                  entry_hash = SHA256(prev_hash + audit_id + timestamp + actor + action + case_id + notes)
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] pt-1">
                  1-Click Verification API: <code className="text-[var(--color-accent)]">GET /api/audit/verify-chain</code> verifies the entire chain from Genesis to Head in &lt; 5ms.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section 5: Multi-Tier AI Provider */}
        {activeTab === "multitier" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
                <span>Multi-Tier AI Provider Resilience (Claude $\rightarrow$ Gemini $\rightarrow$ Safe Floor)</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                To guarantee zero downtime and eliminate vendor lock-in, RevivePay implements dynamic multi-tier sequential fallback:
              </p>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] flex items-center justify-between">
                  <div>
                    <span className="text-[var(--color-text-primary)] font-bold">1. Primary: Anthropic Claude 3.5 Sonnet</span>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">High-reasoning prompt synthesis with telemetry evidence extraction.</p>
                  </div>
                  <span className="text-[10px] text-[var(--color-accent)] font-bold">PRIMARY</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] flex items-center justify-between">
                  <div>
                    <span className="text-[var(--color-text-primary)] font-bold">2. Fallback: Google Gemini 1.5 Pro</span>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">Auto-activated on Claude rate limit or upstream latency.</p>
                  </div>
                  <span className="text-[10px] text-amber-500 font-bold">SECONDARY</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] flex items-center justify-between">
                  <div>
                    <span className="text-[var(--color-text-primary)] font-bold">3. Safe Floor: Deterministic Rules Engine</span>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">Zero-network deterministic rule engine ensuring 100% offline uptime.</p>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold">SAFE FLOOR</span>
                </div>
              </div>

              {/* B.4: Architecture Decision — Model Choice Rationale */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-2 text-xs text-[var(--color-text-secondary)]">
                <p className="font-bold text-[var(--color-text-primary)]">Architecture Rationale: Multi-Tier LLMs vs. Static Classification</p>
                <p className="leading-relaxed text-[11px]">
                  Payment failure telemetry in India's banking ecosystem is inherently heterogeneous, unstandardized, and constantly evolving across issuer switches and mandate limits. A fixed classification model or fine-tuned weights degrades rapidly as banks alter internal error payloads. <strong>Claude 3.5 Sonnet</strong> was selected as primary reasoner for multi-step contextual synthesis across noisy logs, with <strong>Google Gemini 1.5 Pro</strong> providing automatic sub-second failover on latency spikes. Crucially, deterministic policy gates sit between LLM reasoning and execution, ensuring model hallucinations cannot trigger unauthorized financial retries.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Link */}
        <div className="pt-6 border-t border-[var(--color-border-subtle)] flex justify-between items-center text-xs text-[var(--color-text-secondary)] font-mono">
          <span>RevivePay Engineering ADRs • Updated August 2026</span>
          <Link to="/dashboard" className="text-[var(--color-accent)] hover:underline font-bold flex items-center gap-1">
            <span>Explore Live Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
