import React from "react";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Sliders } from "lucide-react";
import { PolicyCheckItem } from "../../types";
import { StatusBadge } from "../StatusBadge";

interface PolicyChecklistCardProps {
  status: string;
  checklist: PolicyCheckItem[];
}

export const PolicyChecklistCard: React.FC<PolicyChecklistCardProps> = ({ status, checklist }) => {
  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Deterministic Policy & Safety Gateway</h3>
            <p className="text-[11px] text-slate-400">Enforces Merchant Limits, Consent & Action Guardrails</p>
          </div>
        </div>
        <StatusBadge status={status} type="policy" />
      </div>

      <div className="space-y-2">
        {checklist && checklist.length > 0 ? (
          checklist.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border flex items-start justify-between gap-3 text-xs transition-colors ${
                item.passed
                  ? "bg-slate-900/40 border-slate-800/80 text-slate-300"
                  : "bg-rose-950/20 border-rose-500/30 text-rose-300"
              }`}
            >
              <div className="flex items-start gap-2">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-slate-200">{item.description}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.details}</p>
                </div>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                  item.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {item.passed ? "PASSED" : "FAILED"}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 italic">No policy rules evaluated.</p>
        )}
      </div>
    </div>
  );
};
