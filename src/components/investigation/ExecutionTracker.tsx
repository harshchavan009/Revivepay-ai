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
    <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Autonomous Execution Pipeline State</span>
        </h3>
        <span className="text-[11px] font-mono text-slate-400">
          State: <span className="text-slate-200 font-bold">{caseData.execution_status}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border flex flex-col justify-between text-xs transition-all ${
              s.complete
                ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                : s.current
                ? "bg-amber-950/20 border-amber-500/40 text-amber-300 animate-pulse"
                : s.failed
                ? "bg-rose-950/20 border-rose-500/40 text-rose-300"
                : "bg-slate-900/40 border-slate-800 text-slate-500"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] text-slate-500">Step {idx + 1}</span>
              {s.complete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : s.current ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : s.failed ? (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-slate-600" />
              )}
            </div>
            <p className="font-semibold text-[11px] truncate">{s.label.split(". ")[1]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
