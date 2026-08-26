import React, { useState, useEffect } from "react";
import { Activity, BrainCircuit, ShieldCheck, Zap, RefreshCw, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { auditService } from "../services";
import { AuditLogEntry } from "../types";

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
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#13354E] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              200+ ML SIGNALS DIAGNOSTICS
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>STREAMING ACTIVE</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span>Autonomous AI Activity & Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live telemetry of payment failure detections, AI diagnoses, policy gateway validations, and revenue capture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadActivity}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#081B2A] border border-[#163E5C] hover:bg-[#0D283E] text-slate-200 text-xs font-semibold self-start sm:self-auto transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stream Cards */}
      <div className="bg-[#081826]/90 border border-[#163E5C] rounded-2xl p-6 shadow-xl space-y-3">
        {logs.map((log, idx) => (
          <div
            key={log.id || idx}
            className="p-4 rounded-xl bg-[#051420] border border-[#143952] hover:border-cyan-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{log.action}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#0B253A] text-cyan-300 font-mono border border-cyan-500/30">
                    {log.actor}
                  </span>
                </div>
                <p className="text-slate-300">{log.notes || "Autonomous pipeline action logged."}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 text-[11px] text-slate-400">
              <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()} IST</span>
              {log.case_id && (
                <Link
                  to={`/cases/${log.case_id}`}
                  className="px-3 py-1.5 rounded-lg bg-[#0B253A] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-semibold transition-colors"
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
