import React, { useState, useEffect } from "react";
import { Activity, BrainCircuit, ShieldCheck, Zap, RefreshCw, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { auditService } from "../services";
import { AuditLogEntry } from "../types";
import { formatTimeSafe } from "../utils/dateUtils";

export const AiActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivity = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getLogs({ limit: 40 });
      setLogs(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
    const timer = setInterval(loadActivity, 8000);
    return () => clearInterval(timer);
  }, []);

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
            Live telemetry of payment failure detections, AI diagnoses, policy gateway validations, and revenue capture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadActivity}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer shadow-premium-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--color-accent)]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stream Cards */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-premium-sm space-y-3">
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
