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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span>Real-Time Autonomous Activity Stream</span>
          </h1>
          <p className="text-xs text-slate-400">
            Live telemetry of payment failure detections, AI diagnoses, policy gateway validations, and revenue capture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Streaming Live
          </span>
          <button
            onClick={loadActivity}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stream Cards */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        {logs.map((log, idx) => (
          <div
            key={log.id || idx}
            className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-100">{log.action}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    {log.actor}
                  </span>
                </div>
                <p className="text-slate-300">{log.notes || "Autonomous pipeline action logged."}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 font-mono text-[11px] text-slate-400">
              <span>{new Date(log.timestamp).toLocaleTimeString()} IST</span>
              {log.case_id && (
                <Link
                  to={`/cases/${log.case_id}`}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white font-medium transition-colors"
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
