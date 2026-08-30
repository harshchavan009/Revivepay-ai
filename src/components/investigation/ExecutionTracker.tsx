import React from "react";
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { RecoveryCase } from "../../types";

interface ExecutionTrackerProps {
  caseData: RecoveryCase;
}

export const ExecutionTracker: React.FC<ExecutionTrackerProps> = ({ caseData }) => {
  const steps = [
    { label: "1. Risk Scored", key: "risk", complete: true },
    { label: "2. AI Diagnosed", key: "ai", complete: true },
    { label: "3. Policy Validated", key: "policy", complete: true },
    {
      label: "4. Approval / Auto-Auth",
      key: "auth",
      complete: caseData.approval_status !== "PENDING" && caseData.approval_status !== "REJECTED",
      current: caseData.approval_status === "PENDING",
      failed: caseData.approval_status === "REJECTED"
    },
    {
      label: "5. Gateway Execution",
      key: "exec",
      complete: caseData.execution_status === "COMPLETED",
      current: caseData.execution_status === "EXECUTING" || caseData.execution_status === "QUEUED",
      failed: caseData.execution_status === "FAILED"
    },
    {
      label: "6. Outcome Verified",
      key: "verified",
      complete: caseData.recovery_status === "RECOVERED",
      failed: caseData.recovery_status === "FAILED" || caseData.recovery_status === "ESCALATED"
    }
  ];

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-premium-sm space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[var(--color-text-primary)] text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
          <span>Autonomous Execution Pipeline State</span>
        </h3>
        <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
          State: <span className="text-[var(--color-text-primary)] font-bold">{caseData.execution_status}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border flex flex-col justify-between text-xs transition-all ${
              s.complete
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : s.current
                ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 animate-pulse"
                : s.failed
                ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                : "bg-[var(--color-bg-canvas)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[var(--color-text-muted)] font-bold">Step {idx + 1}</span>
              {s.complete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : s.current ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              ) : s.failed ? (
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              )}
            </div>
            <p className="font-bold text-[11px] truncate">{s.label.split(". ")[1]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
