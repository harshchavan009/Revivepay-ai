import React, { useState, useEffect } from "react";
import { Repeat, RefreshCw, AlertTriangle, CheckCircle2, CreditCard, ArrowRight, Zap, ShieldAlert } from "lucide-react";
import { subscriptionService } from "../services";
import { SubscriptionItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { formatINR } from "../data/mockData";

export const SubscriptionsPage: React.FC = () => {
  const [subs, setSubs] = useState<SubscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSubs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await subscriptionService.getSubscriptions();
      setSubs(data);
    } catch (err: any) {
      setError("Failed to fetch subscription records from backend. Gateway connection unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubs();
  }, []);

  const handleRetry = async (subId: string) => {
    try {
      const res = await subscriptionService.retrySubscription(subId);
      setActiveMessage(res.message);
      await loadSubs();
    } catch (e: any) {
      alert("Error retrying subscription: " + e.message);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              SUBSCRIPTION DUNNING ENGINE
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              {subs.length} Active Mandates
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Subscription Retries & Dunning</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Synchronized webhook retries, automated grace period dunning, and token renewal workflows.
          </p>
        </div>

        <button
          onClick={loadSubs}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer shadow-premium-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--color-accent)]" : ""}`} />
          <span>Refresh</span>
        </button>
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
            onClick={loadSubs}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Active Toast Notification */}
      {activeMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-premium-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{activeMessage}</span>
          </div>
          <button onClick={() => setActiveMessage(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-premium-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-bg-canvas)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4 pl-6">Subscription ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Plan Name</th>
                <th className="p-4">Recurring Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Retry Count</th>
                <th className="p-4">Failure Reason</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] font-sans">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4 pl-6"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-12"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-24"></div></td>
                    <td className="p-4 pr-6 text-right"><div className="h-6 bg-[var(--color-bg-surface-hover)] rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[var(--color-text-muted)] font-sans">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-[var(--color-text-primary)] text-sm">No subscription mandates found</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">All recurring billing mandates are current with zero active dunning cases.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.id || s.subscription_id} className="hover:bg-[var(--color-bg-surface-hover)] transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-[var(--color-accent)]">
                      {s.subscription_id}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-[var(--color-text-primary)]">{s.customer_name || "Enterprise Client"}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{s.customer_email || "billing@enterprise.in"}</p>
                    </td>
                    <td className="p-4 font-medium text-[var(--color-text-secondary)]">
                      {s.plan_name || "Enterprise Plan"}
                    </td>
                    <td className="p-4 font-bold text-[var(--color-text-primary)] font-mono">
                      {formatINR(s.amount ?? 0)} <span className="text-[10px] text-[var(--color-text-muted)] font-normal font-sans">/{s.billing_interval || "month"}</span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={s.current_status || "ACTIVE"} type="recovery" />
                    </td>
                    <td className="p-4 font-mono text-[var(--color-text-secondary)]">
                      {s.retry_count ?? 0} / {s.max_retries ?? 3}
                    </td>
                    <td className="p-4 text-[var(--color-text-secondary)] max-w-[200px] truncate">
                      {s.failure_reason || "None (Mandate active)"}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {s.current_status === "PAST_DUE" ? (
                        <button
                          onClick={() => handleRetry(s.id || s.subscription_id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Smart Retry</span>
                        </button>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mandate Active</span>
                        </span>
                      )}
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
        {subs.map((s) => (
          <div key={s.id || s.subscription_id} className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono font-bold text-xs text-[var(--color-accent)]">{s.subscription_id}</span>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">{s.customer_name || "Enterprise Client"}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{s.plan_name}</p>
              </div>
              <span className="font-bold text-sm text-[var(--color-text-primary)] font-mono">{formatINR(s.amount)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-subtle)] text-xs">
              <StatusBadge status={s.current_status} type="recovery" />
              {s.current_status === "PAST_DUE" && (
                <button
                  onClick={() => handleRetry(s.id || s.subscription_id)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm"
                >
                  Smart Retry
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
