import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Check,
  X,
  Clock,
  Zap,
  Sparkles,
  Sliders,
  AlertTriangle,
  PlayCircle,
  FileCheck2,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { formatINR } from "../data/mockData";
import { useMetrics } from "../context/MetricsContext";

interface SimulationScenario {
  id: string;
  name: string;
  badge: string;
  amount: number;
  failureReason: string;
  failureCode: string;
  aiDiagnosis: string;
  policyDecision: string;
  policyNote: string;
  actionTaken: string;
  finalStatus: "RECOVERED" | "AWAITING_APPROVAL" | "NUDGE_SENT";
  hashChainVerified: boolean;
}

const DEMO_SCENARIOS: SimulationScenario[] = [
  {
    id: "bank_glitch",
    name: "Bank Switch Outage",
    badge: "Automated Gateway Retry",
    amount: 8499,
    failureReason: "National switch timeout (504 Gateway Timeout)",
    failureCode: "BANK_SWITCH_OUTAGE",
    aiDiagnosis: "Temporary bank switch degradation. 92% recovery probability on retry.",
    policyDecision: "PASSED: Amount ₹8,499 under ₹10,000 auto-retry threshold",
    policyNote: "Deterministic Policy: Automated single retry with exponential backoff approved.",
    actionTaken: "Scheduled smart retry during peak bank clearing window (+14 mins)",
    finalStatus: "RECOVERED",
    hashChainVerified: true
  },
  {
    id: "high_value_override",
    name: "High-Value Enterprise Order",
    badge: "Human-in-the-Loop Override",
    amount: 85000,
    failureReason: "High-ticket card authorization timeout",
    failureCode: "ISSUER_HIGH_VALUE_TIMEOUT",
    aiDiagnosis: "AI proposed immediate auto-retry (94% confidence)",
    policyDecision: "OVERRULED: Amount ₹85,000 exceeds ₹10,000 automated limit",
    policyNote: "Deterministic Policy: AI recommendation overrode. Routed to human operator.",
    actionTaken: "Escalated to Operator Approval Queue (zero risk of automated over-charge)",
    finalStatus: "AWAITING_APPROVAL",
    hashChainVerified: true
  },
  {
    id: "expired_card",
    name: "Expired Card / Mandate",
    badge: "WhatsApp 1-Click Pay",
    amount: 3499,
    failureReason: "Card validity token expired",
    failureCode: "CARD_EXPIRED",
    aiDiagnosis: "Permanent card decline. Retries blocked to prevent issuer fee penalty.",
    policyDecision: "BLOCKED: Retries prohibited on permanent decline codes",
    policyNote: "Deterministic Policy: Dispatched tokenized 1-click UPI update link via WhatsApp.",
    actionTaken: "Customer completed instant UPI deep-link payment on smartphone",
    finalStatus: "NUDGE_SENT",
    hashChainVerified: true
  }
];

export const ReviveHeroPreview: React.FC = () => {
  const { recoveredRevenue, recoveryRate, environmentLabel } = useMetrics();
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const activeScenario = DEMO_SCENARIOS[selectedScenarioIndex];

  return (
    <div className="relative rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-5 sm:p-6 shadow-premium-md backdrop-blur-xl transition-all duration-300 font-sans">
      {/* Sample Data Disclaimer Banner */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-[var(--color-text-primary)]">
            RevivePay Pipeline Simulator
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold">
          Interactive Demonstration (Sample Data)
        </span>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="mb-4">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2 flex items-center justify-between">
          <span>Explore Recovery Scenarios:</span>
          <span className="text-[var(--color-accent)] font-semibold">Click to inspect</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
          {DEMO_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => setSelectedScenarioIndex(idx)}
              className={`px-2.5 py-2 rounded-md text-[11px] font-bold transition-all text-left flex flex-col justify-between cursor-pointer ${
                selectedScenarioIndex === idx
                  ? "bg-[var(--color-bg-surface-raised)] text-[var(--color-accent)] shadow-sm border border-[var(--color-border)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <span className="truncate">{sc.name}</span>
              <span className="text-[9px] font-mono text-[var(--color-text-muted)] mt-0.5">₹{sc.amount.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Execution Flow Box */}
      <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-3.5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]">
              {activeScenario.badge}
            </span>
            <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
              ₹{activeScenario.amount.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
            {activeScenario.failureCode}
          </span>
        </div>

        {/* Step 1: Ingestion & Root Cause */}
        <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Root-Cause Diagnosis</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold">Processed</span>
          </div>
          <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
            {activeScenario.aiDiagnosis}
          </p>
        </div>

        {/* Step 2: Policy Engine Evaluation */}
        <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Deterministic Policy Gateway</span>
            </span>
            <span className="text-[var(--color-accent)] font-mono text-[10px] font-semibold">Guardrail Enforced</span>
          </div>
          <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
            {activeScenario.policyDecision}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] italic">
            {activeScenario.policyNote}
          </p>
        </div>

        {/* Step 3: Action & Outcome */}
        <div className="p-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[var(--color-text-secondary)] flex items-center gap-1.5">
              {activeScenario.finalStatus === "RECOVERED" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              {activeScenario.finalStatus === "AWAITING_APPROVAL" && <UserCheck className="w-3.5 h-3.5 text-amber-500" />}
              {activeScenario.finalStatus === "NUDGE_SENT" && <Zap className="w-3.5 h-3.5 text-blue-500" />}
              <span>Orchestrated Recovery Action</span>
            </span>
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                activeScenario.finalStatus === "RECOVERED"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : activeScenario.finalStatus === "AWAITING_APPROVAL"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              }`}
            >
              {activeScenario.finalStatus}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
            {activeScenario.actionTaken}
          </p>
        </div>
      </div>

      {/* Footer Link & Integrity Stamp */}
      <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>SHA-256 Chained Block Created</span>
        </div>
        <Link
          to="/simulation"
          className="text-[var(--color-accent)] hover:underline font-semibold flex items-center gap-1"
        >
          <span>Open Full Simulation Lab</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
