import React from "react";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { PolicyCheckItem } from "../../types";
import { StatusBadge } from "../StatusBadge";

interface PolicyChecklistCardProps {
  status: string;
  checklist: PolicyCheckItem[];
}

export const PolicyChecklistCard: React.FC<PolicyChecklistCardProps> = ({ status, checklist }) => {
  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-premium-sm space-y-5 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)] text-sm">Deterministic Policy & Safety Gateway</h3>
            <p className="text-[11px] text-[var(--color-text-secondary)]">Enforces Merchant Limits, Consent & Action Guardrails</p>
          </div>
        </div>
        <StatusBadge status={status} type="policy" />
      </div>

      <div className="space-y-2">
        {checklist && checklist.length > 0 ? (
          checklist.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs transition-colors ${
                item.passed
                  ? "bg-[var(--color-bg-canvas)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">{item.description}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">{item.details}</p>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                  item.passed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                }`}
              >
                {item.passed ? "PASSED" : "FAILED"}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] italic">No policy rules evaluated.</p>
        )}
      </div>
    </div>
  );
};
