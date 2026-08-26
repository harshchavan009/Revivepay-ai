import React from "react";
import { Sparkles, BrainCircuit, CheckCircle2, ShieldAlert } from "lucide-react";
import { ConfidenceGauge } from "../ConfidenceGauge";
import { ActionBadge } from "../ActionBadge";

interface AiDiagnosisCardProps {
  rootCause: string;
  confidence: number;
  evidence: string[];
  recommendedAction: string;
  reasoningSummary?: string;
}

export const AiDiagnosisCard: React.FC<AiDiagnosisCardProps> = ({
  rootCause,
  confidence,
  evidence,
  recommendedAction,
  reasoningSummary,
}) => {
  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">AI Root-Cause & Recovery Agent</h3>
            <p className="text-[11px] text-slate-400">Structured LLM Inference with Evidence Grounding</p>
          </div>
        </div>
        <ConfidenceGauge confidence={confidence} />
      </div>

      {/* Root Cause & Recommendation Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 space-y-1">
          <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Diagnosed Root Cause</p>
          <p className="font-bold text-slate-100 text-sm">{rootCause || "Temporary Bank Gateway Disconnect"}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 space-y-1">
          <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Recommended Tool Action</p>
          <div className="pt-0.5">
            <ActionBadge action={recommendedAction} />
          </div>
        </div>
      </div>

      {/* Structured Evidence Checklist */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Evidence-Based Factual Grounding:
        </p>
        <div className="space-y-1.5">
          {evidence && evidence.length > 0 ? (
            evidence.map((ev, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-slate-300 p-2 rounded bg-slate-900/60 border border-slate-800/80"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{ev}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No evidence items available.</p>
          )}
        </div>
      </div>

      {/* Contextual Reasoning Summary */}
      {reasoningSummary && (
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-100">AI Reasoning: </span>
          {reasoningSummary}
        </div>
      )}
    </div>
  );
};
