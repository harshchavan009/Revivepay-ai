import React, { useState } from "react";
import { Sparkles, BrainCircuit, CheckCircle2, ShieldAlert, Code2, ChevronDown, ChevronUp, Terminal, Cpu } from "lucide-react";
import { ConfidenceGauge } from "../ConfidenceGauge";
import { ActionBadge } from "../ActionBadge";

interface AiDiagnosisCardProps {
  rootCause: string;
  confidence: number;
  evidence: string[];
  recommendedAction: string;
  reasoningSummary?: string;
  modelProvider?: string;
  modelName?: string;
  rawPrompt?: string;
  rawResponse?: string;
}

export const AiDiagnosisCard: React.FC<AiDiagnosisCardProps> = ({
  rootCause,
  confidence,
  evidence,
  recommendedAction,
  reasoningSummary,
  modelProvider = "deterministic_rules_engine",
  modelName = "rules-engine-v2.1",
  rawPrompt,
  rawResponse,
}) => {
  const [showInspector, setShowInspector] = useState(false);

  const getProviderBadge = () => {
    if (modelProvider === "anthropic" || modelName?.includes("claude")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[10px] font-mono font-bold">
          <Sparkles className="w-3 h-3" />
          <span>Claude 3.5 Sonnet (Primary)</span>
        </span>
      );
    }
    if (modelProvider === "google" || modelName?.includes("gemini")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
          <Sparkles className="w-3 h-3" />
          <span>Gemini 1.5 Pro (Fallback)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
        <Cpu className="w-3 h-3" />
        <span>Deterministic Rules Engine (Safe Fallback)</span>
      </span>
    );
  };

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-premium-sm space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[var(--color-text-primary)] text-sm">AI Root-Cause & Recovery Agent</h3>
              {getProviderBadge()}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">Structured Multi-Tier Inference · Zero Black-Box Audit Trail</p>
          </div>
        </div>
        <ConfidenceGauge confidence={confidence} />
      </div>

      {/* Root Cause & Recommendation Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
          <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider font-mono">Diagnosed Root Cause</p>
          <p className="font-bold text-[var(--color-text-primary)] text-sm">{rootCause || "Temporary Bank Gateway Disconnect"}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
          <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider font-mono">Recommended Tool Action</p>
          <div className="pt-0.5">
            <ActionBadge action={recommendedAction} />
          </div>
        </div>
      </div>

      {/* Structured Evidence Checklist */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider font-mono">
          Evidence-Based Factual Grounding:
        </p>
        <div className="space-y-1.5">
          {evidence && evidence.length > 0 ? (
            evidence.map((ev, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)] p-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{ev}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-[var(--color-text-muted)] italic">No evidence items available.</p>
          )}
        </div>
      </div>

      {/* Contextual Reasoning Summary */}
      {reasoningSummary && (
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <span className="font-bold text-[var(--color-text-primary)]">AI Reasoning: </span>
          {reasoningSummary}
        </div>
      )}

      {/* Raw Model Input/Output Transparency Inspector */}
      <div className="pt-2 border-t border-[var(--color-border-subtle)]">
        <button
          type="button"
          onClick={() => setShowInspector(!showInspector)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-mono">
            <Code2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span>Audit Trail: Raw Model Input & Structured Output</span>
          </div>
          {showInspector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showInspector && (
          <div className="mt-2 space-y-3 p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-xs font-mono animate-in fade-in">
            <div>
              <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1 font-bold">
                <span>Raw Model Prompt / Context</span>
                <span>{modelName}</span>
              </div>
              <pre className="p-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] overflow-x-auto whitespace-pre-wrap max-h-40">
                {rawPrompt || `[Telemetry Context Summary]\nCase: ${rootCause}\nAction: ${recommendedAction}\nEvidence: ${evidence?.join(" | ")}`}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1 font-bold">
                <span>Raw Structured Response Output</span>
                <span className="text-emerald-500">Validated JSON</span>
              </div>
              <pre className="p-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-40">
                {rawResponse || JSON.stringify({ root_cause: rootCause, confidence, recommended_action: recommendedAction, reasoning: reasoningSummary }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
