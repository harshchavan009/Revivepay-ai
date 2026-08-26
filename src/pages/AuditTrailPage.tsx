import React, { useState, useEffect } from "react";
import { History, Search, RefreshCw, Filter, ShieldCheck, Download } from "lucide-react";
import { auditService } from "../services";
import { AuditLogEntry } from "../types";

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [actorSearch, setActorSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getLogs({
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        actor: actorSearch.trim() || undefined
      });
      setLogs(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Audit & Compliance Governance Trail</span>
          </h1>
          <p className="text-xs text-slate-400">
            Immutable, tamper-evident audit record capturing actors, decisions, and outcomes.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by actor name (Operator, AI Agent, Policy Gateway)..."
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none font-sans"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none font-mono"
          >
            <option value="ALL">All Event Actions</option>
            <option value="EVENT_DETECTED">EVENT_DETECTED</option>
            <option value="RISK_SCORED">RISK_SCORED</option>
            <option value="AI_DIAGNOSED">AI_DIAGNOSED</option>
            <option value="POLICY_VALIDATED">POLICY_VALIDATED</option>
            <option value="ACTION_EXECUTED">ACTION_EXECUTED</option>
            <option value="PAYMENT_RECOVERED">PAYMENT_RECOVERED</option>
            <option value="ESCALATED">ESCALATED</option>
          </select>
        </form>
      </div>

      {/* Audit Table */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3.5">Timestamp (IST)</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Policy Result</th>
                <th className="p-3.5">Execution Result</th>
                <th className="p-3.5">Audit Summary & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3.5 font-medium text-slate-200 whitespace-nowrap">
                    {l.actor}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-blue-400 whitespace-nowrap">
                    {l.action}
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    {l.policy_result ? (
                      <span className={l.policy_result === "PASSED" ? "text-emerald-400" : "text-rose-400"}>
                        {l.policy_result}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    {l.execution_result ? (
                      <span className={l.execution_result === "SUCCESS" ? "text-emerald-400" : "text-amber-400"}>
                        {l.execution_result}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-300 max-w-md truncate">
                    {l.notes || JSON.stringify(l.decision || l.input_data || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
