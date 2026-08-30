import React, { useState, useEffect } from "react";
import { History, Search, RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { auditService } from "../services";
import { AuditLogEntry } from "../types";
import { formatDateSafe } from "../utils/dateUtils";

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
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await auditService.getLogs({
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        actor: actorSearch.trim() || undefined
      });
      setLogs(data);
    } catch (err: any) {
      setError("Failed to fetch cryptographic audit ledger from backend. Connection unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    try {
      const result = await auditService.verifyChain();
      setChainResult(result);
    } catch (err: any) {
      alert("Error verifying cryptographic ledger: " + err.message);
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
    <div className="space-y-6 pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              IMMUTABLE AUDIT RECORD
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>SHA-256 HASH CHAINED</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <History className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Audit & Compliance Governance Trail</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Cryptographically linked, tamper-evident audit ledger capturing actors, policy evaluations, and payment capture outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleVerifyChain}
            disabled={verifyingChain}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-premium-sm transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold transition-colors cursor-pointer shadow-premium-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--color-accent)]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Verification Banner */}
      {chainResult && (
        <div className={`p-5 rounded-2xl border ${chainResult.valid ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200" : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"} space-y-3 shadow-premium-sm animate-in fade-in`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {chainResult.valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              )}
              <span className="font-bold text-sm text-[var(--color-text-primary)]">
                {chainResult.valid ? "Cryptographic Chain Verified Valid" : "Audit Chain Verification Failed"}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                {chainResult.total_blocks} Blocks Validated
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Zero-Knowledge Integrity Check</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] font-mono text-[var(--color-text-secondary)] pt-1">
            <div className="p-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] truncate">
              <span className="text-[var(--color-text-muted)] mr-2 font-bold">GENESIS HASH:</span>
              <span className="text-[var(--color-accent)]">{chainResult.genesis_hash}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] truncate">
              <span className="text-[var(--color-text-muted)] mr-2 font-bold">HEAD HASH:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{chainResult.head_hash}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by actor name (Operator, AI Agent, Policy Gateway)..."
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-xl px-3 py-2.5 outline-none font-sans cursor-pointer"
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

      {/* Error Alert Banner with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 shadow-premium-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadLogs}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-premium-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-bg-canvas)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4 pl-6">Timestamp (IST)</th>
                <th className="p-4">Case ID</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Notes & Reasoning</th>
                <th className="p-4">Policy Result</th>
                <th className="p-4 pr-6">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] font-sans">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4 pl-6"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-40"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4 pr-6"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[var(--color-text-muted)] font-sans">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-[var(--color-text-primary)] text-sm">No audit logs found</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">No cryptographic ledger records match your actor search or event action filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setActionFilter("ALL");
                          setActorSearch("");
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-semibold text-xs cursor-pointer hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--color-bg-surface-hover)] transition-colors">
                    <td className="p-4 pl-6 font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                      {formatDateSafe(log.timestamp, {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </td>
                    <td className="p-4">
                      {log.case_id ? (
                        <span className="font-mono font-bold text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-2.5 py-0.5 rounded border border-[var(--color-accent-border)]">
                          {log.case_id}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)] font-mono">-</span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-[var(--color-text-primary)]">
                      {log.actor || log.actor_id || "System"}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-[var(--color-bg-canvas)] text-[var(--color-accent)] font-bold border border-[var(--color-border-subtle)]">
                        {log.action || log.event_type}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--color-text-secondary)] max-w-xs truncate" title={log.notes || ""}>
                      {log.notes || "Canonical state transition recorded"}
                    </td>
                    <td className="p-4">
                      {log.policy_result === "PASSED" || log.policy_result === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          PASSED
                        </span>
                      ) : log.policy_result === "BLOCKED" || log.policy_result === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          BLOCKED
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-canvas)] px-2 py-0.5 rounded border border-[var(--color-border-subtle)]">
                          {log.policy_result || "N/A"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                        log.execution_result === "SUCCESS" || log.execution_result === "RECOVERED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : log.execution_result === "FAILED" || log.execution_result === "STOPPED"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]"
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

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-bold text-[var(--color-accent)]">{log.case_id || "System Event"}</span>
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                {formatDateSafe(log.timestamp, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">{log.actor || "System"} &middot; <span className="font-mono text-[var(--color-accent)]">{log.action || log.event_type}</span></p>
            <p className="text-xs text-[var(--color-text-secondary)]">{log.notes || "Canonical state transition recorded"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
