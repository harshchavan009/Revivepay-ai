import React from "react";
import { Gauge, Info } from "lucide-react";
import { RiskBadge } from "../RiskBadge";

interface RiskScoreCardProps {
  score: number;
  level: string;
  factors?: any;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ score, level, factors }) => {
  const valueFactor = factors?.transaction_value_factor ?? 72.0;
  const recoveryFactor = factors?.recovery_likelihood_factor ?? 20.0;
  const historyFactor = factors?.customer_history_factor ?? 11.1;
  const severityFactor = factors?.failure_severity_factor ?? 25.0;

  const items = [
    { label: "Transaction Value", weight: "35%", value: valueFactor, color: "bg-[var(--color-accent)]" },
    { label: "Recovery Likelihood", weight: "25%", value: recoveryFactor, color: "bg-emerald-500" },
    { label: "Customer History Risk", weight: "20%", value: historyFactor, color: "bg-purple-500" },
    { label: "Failure Severity", weight: "20%", value: severityFactor, color: "bg-amber-500" },
  ];

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-premium-sm space-y-5 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)] text-sm">Deterministic Revenue Risk Engine</h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] font-mono">Formula: 0.35·V + 0.25·R + 0.20·H + 0.20·S</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400">{Math.round(score)}</span>
          <span className="text-xs text-[var(--color-text-muted)] font-mono">/100</span>
          <RiskBadge level={level} />
        </div>
      </div>

      {/* 4 Factor Breakdown Bars */}
      <div className="space-y-3 pt-1">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)] font-medium">
                {item.label} <span className="text-[var(--color-text-muted)] font-mono">({item.weight})</span>
              </span>
              <span className="font-mono font-bold text-[var(--color-text-primary)]">{Math.round(item.value)}/100</span>
            </div>
            <div className="h-2 w-full bg-[var(--color-bg-canvas)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                style={{ width: `${Math.min(100, Math.max(5, item.value))}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] flex items-start gap-2">
        <Info className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
        <span>
          Risk score is calculated deterministically before AI agent analysis to prevent hallucinated scores and enforce predictable policy routing.
        </span>
      </div>
    </div>
  );
};
