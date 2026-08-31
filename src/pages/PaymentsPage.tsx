import React, { useState, useEffect } from "react";
import { CreditCard, Search, RefreshCw, X, ChevronLeft, ChevronRight, ArrowRight, Eye } from "lucide-react";
import { paymentService } from "../services";
import { Payment } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { formatINR } from "../data/mockData";
import { formatDateSafe } from "../utils/dateUtils";

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const [error, setError] = useState<string | null>(null);

  const loadPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await paymentService.getPayments({
        status: statusFilter,
        failure_category: categoryFilter,
        search: search.trim() || undefined
      });
      setPayments(data);
      setCurrentPage(1);
    } catch (err: any) {
      setError("Failed to fetch payment telemetry records from backend. Gateway connection unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayments();
  };

  // Pagination slice
  const totalItems = payments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedPayments = payments.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              TRANSACTION LEDGER
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              {payments.length} Transactions
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Payment Telemetry Ledger</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Transaction records with Razorpay test mode telemetry, status codes, and error categorization.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer shadow-premium-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--color-accent)]" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Payment ID (pay_20001), customer name, or failure reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-xl px-3 py-2.5 outline-none font-sans cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="FAILED">FAILED</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="AUTHORIZED">AUTHORIZED</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-xl px-3 py-2.5 outline-none font-sans cursor-pointer"
            >
              <option value="ALL">All Failure Categories</option>
              <option value="temporary_bank_failure">Temporary Bank Failure</option>
              <option value="insufficient_funds">Insufficient Funds</option>
              <option value="card_expired">Card Expired</option>
              <option value="invalid_card_details">Invalid Card Details</option>
              <option value="fraud_security_block">Security Block</option>
            </select>
          </div>
        </form>
      </div>

      {/* Error Alert Banner with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 shadow-premium-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadPayments}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Payments Data Table */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-premium-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-bg-canvas)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4 pl-6">Payment ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4">Failure Category</th>
                <th className="p-4">Retries</th>
                <th className="p-4">Timestamp (IST)</th>
                <th className="p-4 pr-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] font-sans">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4 pl-6"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-12"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-12"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-20"></div></td>
                    <td className="p-4 pr-6 text-right"><div className="h-6 bg-[var(--color-bg-surface-hover)] rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[var(--color-text-muted)] font-sans">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-[var(--color-text-primary)] text-sm">No payment records found</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">No payment telemetry events match your filter options or search term.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("ALL");
                          setCategoryFilter("ALL");
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
                paginatedPayments.map((p) => (
                  <tr key={p.id || p.payment_id} className="hover:bg-[var(--color-bg-surface-hover)] transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-[var(--color-accent)]">
                      {p.payment_id}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-[var(--color-text-primary)]">{p.customer_name || "Enterprise Customer"}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{p.customer_email || "billing@enterprise.in"}</p>
                    </td>
                    <td className="p-4 font-bold text-[var(--color-text-primary)] font-mono">
                      {formatINR(p.amount ?? 0)}
                    </td>
                    <td className="p-4 font-mono text-[var(--color-text-secondary)] uppercase">
                      {p.payment_method || "CARD"}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={p.status || "FAILED"} type="payment" />
                    </td>
                    <td className="p-4 text-[var(--color-text-secondary)] max-w-xs truncate font-mono text-[11px]">
                      {(p.failure_category || "transient_gateway_latency").replace(/_/g, " ")}
                    </td>
                    <td className="p-4 font-mono text-[var(--color-text-muted)]">
                      {Math.min(p.retry_count ?? 0, p.max_retry_count ?? 2)} / {p.max_retry_count ?? 2}
                    </td>
                    <td className="p-4 font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                      {formatDateSafe(p.created_at, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="p-4 pr-6 text-right font-mono">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-accent)] font-semibold text-xs border border-[var(--color-border-subtle)] cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Card-View Fallback */}
        <div className="block md:hidden divide-y divide-[var(--color-border-subtle)]">
          {paginatedPayments.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-muted)] text-xs">
              No payments found matching filters.
            </div>
          ) : (
            paginatedPayments.map((p) => (
              <div key={p.id || p.payment_id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-[var(--color-text-primary)]">{p.payment_id || "PAY-UNKNOWN"}</span>
                  <span className="font-bold text-sm text-[var(--color-text-primary)] font-mono">{formatINR(p.amount ?? 0)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{p.customer_name || "Customer"}</p>
                    <p className="text-[10px] font-mono text-[var(--color-text-muted)]">{p.customer_email || "billing@enterprise.in"}</p>
                  </div>
                  <StatusBadge status={p.status || "FAILED"} type="payment" />
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border-subtle)]">
                  <span className="font-mono uppercase">{p.payment_method || "CARD"} • {(p.failure_category || "General").replace(/_/g, " ")}</span>
                  <button
                    onClick={() => setSelectedPayment(p)}
                    className="px-3 py-1 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold text-xs border border-[var(--color-accent-border)] flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Payload</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[var(--color-bg-canvas)] border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <span>
              Showing <strong className="text-[var(--color-text-primary)]">{totalItems === 0 ? 0 : startIndex + 1}</strong>–<strong className="text-[var(--color-text-primary)]">{endIndex}</strong> of <strong className="text-[var(--color-text-primary)]">{totalItems}</strong> transactions
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
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Payment Details Drawer Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-2xl shadow-premium-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <div>
                <h3 className="font-bold text-[var(--color-text-primary)] text-base font-mono">{selectedPayment.payment_id || "PAY-UNKNOWN"}</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Transaction Gateway Payload</p>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-secondary)]">Amount:</span>
                <span className="font-bold font-mono text-[var(--color-text-primary)]">{formatINR(selectedPayment.amount ?? 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-secondary)]">Customer:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{selectedPayment.customer_name || "Customer"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-secondary)]">Payment Method:</span>
                <span className="font-mono text-[var(--color-text-primary)] uppercase">{selectedPayment.payment_method || "CARD"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-secondary)]">Status:</span>
                <StatusBadge status={selectedPayment.status || "FAILED"} type="payment" />
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-secondary)]">Failure Reason:</span>
                <span className="text-rose-600 dark:text-rose-400 font-medium">{selectedPayment.failure_reason || "None"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-secondary)]">Retries Executed:</span>
                <span className="font-mono text-[var(--color-text-primary)]">
                  {Math.min(selectedPayment.retry_count ?? 0, selectedPayment.max_retry_count ?? 2)} of {selectedPayment.max_retry_count ?? 2}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--color-text-secondary)]">Timestamp:</span>
                <span className="font-mono text-[var(--color-text-muted)]">{formatDateSafe(selectedPayment.created_at)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border-subtle)] flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-xl bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold border border-[var(--color-border)] cursor-pointer shadow-sm"
              >
                Close Payload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
