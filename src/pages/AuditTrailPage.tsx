import React, { useState, useEffect } from "react";
import { History, Search, RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle, Lock, Link2 } from "lucide-react";
import { auditService } from "../services";
import { AuditLogEntry } from "../types";

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [actorSearch, setActorSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainResult, setChainResult] = useState<{
    valid: boolean;
    total_blocks: number;
    genesis_hash: string;
    head_hash: string;
    status: string;
  } | null>(null);

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

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    try {
      const result = await auditService.verifyChain();
      setChainResult(result);
    } finally {
      setVerifyingChain(false);
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
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#13354E] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              IMMUTABLE AUDIT RECORD
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              SHA-256 HASH CHAINED
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Audit & Compliance Governance Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically linked, tamper-evident audit ledger capturing actors, policy evaluations, and payment capture outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleVerifyChain}
            disabled={verifyingChain}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-98 disabled:opacity-50"
          >
            {verifyingChain ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>{verifyingChain ? "Verifying Ledger..." : "Verify Hash Chain"}</span>
          </button>

          <button
            onClick={loadLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#081B2A] border border-[#163E5C] hover:bg-[#0D283E] text-slate-200 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Verification Banner */}
      {chainResult && (
        <div className={`p-4 rounded-2xl border ${chainResult.valid ? "bg-emerald-950/40 border-emerald-500/40" : "bg-rose-950/40 border-rose-500/40"} space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {chainResult.valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
              <span className="font-bold text-sm text-white">
                {chainResult.valid ? "Cryptographic Chain Verified Valid" : "Audit Chain Verification Failed"}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {chainResult.total_blocks} Blocks Validated
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Zero-Knowledge Integrity Check</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">
            <div className="p-2 rounded-lg bg-[#041018] border border-[#163E5C]/60 truncate">
              <span className="text-slate-500 mr-2">GENESIS HASH:</span>
              <span className="text-cyan-300">{chainResult.genesis_hash}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#041018] border border-[#163E5C]/60 truncate">
              <span className="text-slate-500 mr-2">HEAD HASH:</span>
              <span className="text-emerald-300">{chainResult.head_hash}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#081826]/90 border border-[#163E5C] space-y-3 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by actor name (Operator, AI Agent, Policy Gateway)..."
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              className="w-full bg-[#051420] border border-[#163E5C] text-slate-200 text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-cyan-400 font-sans"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#051420] border border-[#163E5C] text-slate-300 text-xs rounded-xl px-3 py-2.5 outline-none font-sans"
          >
            <option value="ALL">All Event Actions</option>
            <option value="payment.failed">payment.failed</option>
            <option value="recovery.ai.diagnosed">recovery.ai.diagnosed</option>
            <option value="recovery.risk.scored">recovery.risk.scored</option>
            <option value="recovery.policy.passed">recovery.policy.passed</option>
            <option value="recovery.action.executed">recovery.action.executed</option>
            <option value="recovery.verified">recovery.verified</option>
            <option value="recovery.approved">recovery.approved</option>
            <option value="recovery.rejected">recovery.rejected</option>
            <option value="recovery.escalated">recovery.escalated</option>
          </select>
        </form>
      </div>

      {/* Audit Table */}
      <div className="bg-[#081826]/90 border border-[#163E5C] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#051420] border-b border-[#163E5C] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Timestamp (IST)</th>
                <th className="p-4">Case ID</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Notes & Reasoning</th>
                <th className="p-4">Policy Result</th>
                <th className="p-4">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#13354E]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    <span>Loading immutable audit ledger...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-sans">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#0C2438] transition-colors">
                    <td className="p-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </td>
                    <td className="p-4">
                      {log.case_id ? (
                        <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                          {log.case_id}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">-</span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-200">
                      {log.actor || log.actor_id || "System"}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#0A2235] text-cyan-300 font-bold border border-cyan-500/30">
                        {log.action || log.event_type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 max-w-xs truncate" title={log.notes || ""}>
                      {log.notes || "Canonical state transition recorded"}
                    </td>
                    <td className="p-4">
                      {log.policy_result === "PASSED" || log.policy_result === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          PASSED
                        </span>
                      ) : log.policy_result === "BLOCKED" || log.policy_result === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          BLOCKED
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {log.policy_result || "N/A"}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                        log.execution_result === "SUCCESS" || log.execution_result === "RECOVERED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : log.execution_result === "FAILED" || log.execution_result === "STOPPED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      }`}>
                        {log.execution_result || "COMPLETED"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
