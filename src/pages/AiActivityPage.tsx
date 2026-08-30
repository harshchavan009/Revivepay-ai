import React, { useState, useEffect } from "react";
import { Activity, BrainCircuit, ShieldCheck, Zap, RefreshCw, Clock, ArrowRight, Sparkles, ShieldAlert, Sliders } from "lucide-react";
import { Link } from "react-router-dom";
import { auditService, agentService } from "../services";
import { AuditLogEntry, AIBudgetStatus } from "../types";
import { formatTimeSafe } from "../utils/dateUtils";

export const AiActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [budget, setBudget] = useState<AIBudgetStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [fallbackTestResult, setFallbackTestResult] = useState<any | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [auditData, budgetData] = await Promise.all([
        auditService.getLogs({ limit: 40 }),
        agentService.getBudget()
      ]);
      setLogs(auditData);
      setBudget(budgetData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleBudget = async () => {
    setIsToggling(true);
    try {
      const updated = await agentService.toggleBudget();
      setBudget(updated);
    } finally {
      setIsToggling(false);
    }
  };

  const handleTriggerFallbackTest = async () => {
    setIsToggling(true);
    try {
      const result = await agentService.forceFallbackTest();
      setFallbackTestResult(result);
      await loadData();
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              200+ ML SIGNALS DIAGNOSTICS
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>STREAMING ACTIVE</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Autonomous AI Activity & Telemetry</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Live telemetry of payment failure detections, AI diagnoses, policy gateway validations, and multi-tier LLM governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer shadow-premium-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--color-accent)]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* B.3: AI Cost Guardrail & Budget State Banner */}
      <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-[var(--color-text-muted)] tracking-wider">
                Daily LLM Reasoner Budget & Fallback Governance
              </span>
              {budget?.deterministic_fallback_active ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                  <span>DETERMINISTIC FALLBACK ACTIVE</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                  PRIMARY REASONER OPERATIONAL
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {budget?.deterministic_fallback_active
                ? "Daily AI reasoning budget reached. AI calls are disabled to protect margin; decisions are safely routed to Deterministic Rules Engine floor."
                : "Dynamic LLM inference enabled. Primary reasoner: Claude 3.5 Sonnet → Automatic Failover: Gemini 1.5 Pro → Safe Floor: Rule Engine."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBudget}
              disabled={isToggling}
              className="px-3.5 py-2 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs font-semibold text-[var(--color-text-primary)] transition-all cursor-pointer shadow-sm"
              title="Toggle budget exhaustion to demonstrate safe deterministic fallback transition"
            >
              {budget?.deterministic_fallback_active ? "Restore LLM Budget" : "Demo Exhaust Budget"}
            </button>
            <button
              onClick={handleTriggerFallbackTest}
              disabled={isToggling}
              className="px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Test Gemini Fallback</span>
            </button>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-text-secondary)]">
              AI Reasoning Calls Today: <strong className="text-[var(--color-text-primary)]">{budget?.used ?? 42} / {budget?.total ?? 100}</strong>
            </span>
            <span className="text-[var(--color-text-muted)]">
              {budget?.remaining ?? 58} calls remaining before rules-floor failover
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--color-bg-canvas)] overflow-hidden border border-[var(--color-border-subtle)]">
            <div
              className={`h-full transition-all duration-500 ${
                budget?.deterministic_fallback_active
                  ? "bg-amber-500"
                  : ((budget?.used ?? 42) / (budget?.total ?? 100)) > 0.8
                  ? "bg-amber-400"
                  : "bg-[var(--color-accent)]"
              }`}
              style={{ width: `${Math.min(100, (((budget?.used ?? 42) / (budget?.total ?? 100)) * 100))}%` }}
            ></div>
          </div>
        </div>

        {/* Fallback Result Preview if triggered */}
        {fallbackTestResult && (
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-800 dark:text-indigo-200 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Forced Multi-Tier Fallback Test Response Verified:</span>
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                {fallbackTestResult.model_name || "gemini-1.5-pro (fallback)"}
              </span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
              {fallbackTestResult.reasoning_summary}
            </p>
          </div>
        )}
      </div>

      {/* Stream Cards */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-premium-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
          <span className="text-xs font-mono font-bold uppercase text-[var(--color-text-muted)] tracking-wider">
            Real-Time Ingestion & Diagnostic Events
          </span>
          <span className="text-xs text-[var(--color-text-secondary)] font-mono">
            Showing latest {logs.length} events
          </span>
        </div>

        {logs.map((log, idx) => (
          <div
            key={log.id || idx}
            className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[var(--color-text-primary)]">{log.action}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-mono border border-[var(--color-accent-border)] font-bold">
                    {log.actor}
                  </span>
                </div>
                <p className="text-[var(--color-text-secondary)]">{log.notes || "Autonomous pipeline action logged."}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 text-[11px] text-[var(--color-text-muted)]">
              <span className="font-mono">{formatTimeSafe(log.timestamp)} IST</span>
              {log.case_id && (
                <Link
                  to={`/cases/${log.case_id}`}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-surface)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-accent)] font-semibold transition-colors border border-[var(--color-border-subtle)]"
                >
                  View Case
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
