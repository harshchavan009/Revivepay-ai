import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Search, RefreshCw, ChevronLeft, ChevronRight, Zap, FlaskConical, ArrowRight } from "lucide-react";
import { recoveryService, dashboardService } from "../services";
import { RecoveryCase } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { StatusBadge } from "../components/StatusBadge";
import { ActionBadge } from "../components/ActionBadge";
import { EventSourceBadge } from "../components/EventSourceBadge";
import { formatINR } from "../data/mockData";

export const RecoveryCasesPage: React.FC = () => {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL"); // ALL, RAZORPAY_TEST, SIMULATION
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);

  const loadCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recoveryService.getCases({
        status: statusFilter,
        search: search.trim() || undefined
      });
      setCases(data);
      setCurrentPage(1);
    } catch (err: any) {
      setError("Failed to fetch recovery cases from backend. Telemetry connection unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCases();
  };

  const filteredCases = cases.filter((c) => {
    if (sourceFilter === "ALL") return true;
    if (sourceFilter === "RAZORPAY_TEST") return c.source === "RAZORPAY_TEST" || !c.source;
    if (sourceFilter === "SIMULATION") return c.source === "SIMULATION";
    return true;
  });

  // Calculate pagination slice
  const totalItems = filteredCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCases = filteredCases.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              CASE INVESTIGATION QUEUE
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              {cases.length} Total Cases
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Recovery Case Registry</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Autonomous queue with strict event provenance tracking between Real Gateway Test Events and Synthetic Simulations.
          </p>
        </div>

        <button
          onClick={loadCases}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer shadow-premium-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--color-accent)]" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter & Provenance Segment Bar */}
      <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
        {/* Source Provenance Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <span className="font-bold text-[var(--color-text-primary)]">Event Provenance:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSourceFilter("ALL"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sourceFilter === "ALL"
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              All Events ({cases.length})
            </button>
            <button
              onClick={() => { setSourceFilter("RAZORPAY_TEST"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceFilter === "RAZORPAY_TEST"
                  ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500 shadow-sm"
                  : "bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <Zap className="w-3 h-3 text-indigo-500" />
              <span>Razorpay Test Ingress ({cases.filter((c) => c.source === "RAZORPAY_TEST" || !c.source).length})</span>
            </button>
            <button
              onClick={() => { setSourceFilter("SIMULATION"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceFilter === "SIMULATION"
                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500 shadow-sm"
                  : "bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <FlaskConical className="w-3 h-3 text-amber-500" />
              <span>Simulation Lab ({cases.filter((c) => c.source === "SIMULATION").length})</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Case ID, Customer Name, Failure Type, or Amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-xl px-3 py-2.5 outline-none font-sans cursor-pointer"
          >
            <option value="ALL">All Recovery Statuses</option>
            <option value="NEW">New Ingress</option>
            <option value="ANALYZING">Analyzing Telemetry</option>
            <option value="ACTION_RECOMMENDED">Action Recommended</option>
            <option value="AWAITING_APPROVAL">Awaiting Operator Sign-off</option>
            <option value="RECOVERED">Recovered Successfully</option>
            <option value="STOPPED">Stopped / Blocked</option>
          </select>
        </form>
      </div>

      {/* Error Alert Banner with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 shadow-premium-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadCases}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Cases Data Table with Desktop/Mobile Views */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-premium-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-bg-canvas)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4 pl-6">Case ID</th>
                <th className="p-4">Provenance</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Risk Level</th>
                <th className="p-4">Failure Diagnosis</th>
                <th className="p-4">Recommended Action</th>
                <th className="p-4">Policy Gate</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] font-sans">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4 pl-6"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-14"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4 pr-6 text-right"><div className="h-6 bg-[var(--color-bg-surface-hover)] rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-[var(--color-text-muted)] font-sans">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-[var(--color-text-primary)] text-sm">No recovery cases found</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">No cases match the active filter criteria or search query.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("ALL");
                          setSourceFilter("ALL");
                          setSearch("");
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-semibold text-xs cursor-pointer hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCases.map((c) => (
                  <tr key={c.case_id || c.id} className="hover:bg-[var(--color-bg-surface-hover)] transition-colors">
                    <td className="p-4 pl-6">
                      <Link
                        to={`/cases/${c.case_id}`}
                        className="font-mono font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                      >
                        <span>{c.case_id}</span>
                        {c.case_id === "RV-10291" && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono font-bold border border-amber-500/30">
                            DEMO
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="p-4">
                      <EventSourceBadge source={c.source} size="sm" />
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-[var(--color-text-primary)]">{c.customer_name || "Enterprise Customer"}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{c.customer_tier || "STANDARD"}</p>
                    </td>
                    <td className="p-4 font-bold text-[var(--color-text-primary)] font-mono">
                      {formatINR(c.amount ?? c.amount_at_risk ?? 0)}
                    </td>
                    <td className="p-4">
                      <RiskBadge level={c.risk_level} score={c.risk_score} showScore />
                    </td>
                    <td className="p-4 font-medium text-[var(--color-text-secondary)] max-w-[160px] truncate">
                      {c.root_cause || c.failure_type || "Gateway Decline"}
                    </td>
                    <td className="p-4">
                      <ActionBadge action={c.recommended_action} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={c.policy_status} type="policy" />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={c.recovery_status} />
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link
                        to={`/cases/${c.case_id}`}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-canvas)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-accent)] font-semibold text-[11px] transition-colors inline-block border border-[var(--color-border-subtle)]"
                      >
                        Investigate →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-[var(--color-border-subtle)]">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-24"></div>
                <div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-36"></div>
                <div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-48"></div>
              </div>
            ))
          ) : paginatedCases.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-muted)] font-sans">
              No recovery cases match your filters.
            </div>
          ) : (
            paginatedCases.map((c) => (
              <div key={c.case_id || c.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[var(--color-accent)]">{c.case_id}</span>
                  <span className="font-mono font-bold text-xs text-[var(--color-text-primary)]">
                    {formatINR(c.amount ?? c.amount_at_risk ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{c.customer_name || "Enterprise Customer"}</p>
                    <p className="text-[10px] font-mono text-[var(--color-text-muted)]">{c.customer_tier || "STANDARD"}</p>
                  </div>
                  <RiskBadge level={c.risk_level} score={c.risk_score} showScore />
                </div>

                <div className="text-xs text-[var(--color-text-secondary)]">
                  <span className="font-medium">{c.root_cause || c.failure_type || "Gateway Decline"}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <ActionBadge action={c.recommended_action} />
                  <StatusBadge status={c.policy_status} type="policy" />
                  <StatusBadge status={c.recovery_status} />
                </div>

                <div className="pt-2 border-t border-[var(--color-border-subtle)] flex justify-end">
                  <Link
                    to={`/cases/${c.case_id}`}
                    className="w-full py-2 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold text-xs text-center border border-[var(--color-accent-border)] flex items-center justify-center gap-1.5"
                  >
                    <span>Inspect Case Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Real Pagination Footer */}
        <div className="p-4 bg-[var(--color-bg-canvas)] border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <span>
              Showing <strong className="text-[var(--color-text-primary)]">{totalItems === 0 ? 0 : startIndex + 1}</strong>–<strong className="text-[var(--color-text-primary)]">{endIndex}</strong> of <strong className="text-[var(--color-text-primary)]">{totalItems}</strong> cases
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-2 py-1 text-xs outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 font-mono text-xs text-[var(--color-text-primary)]">
              <span>Page</span>
              <strong className="px-2 py-1 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                {currentPage}
              </strong>
              <span>of {totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
