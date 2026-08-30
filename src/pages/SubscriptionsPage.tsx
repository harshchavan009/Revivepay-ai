import React, { useState, useEffect } from "react";
import { Repeat, RefreshCw, AlertTriangle, CheckCircle2, CreditCard, ArrowRight, Zap, ShieldAlert, Bell, UserX, ShieldCheck } from "lucide-react";
import { subscriptionService } from "../services";
import { SubscriptionItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { formatINR } from "../data/mockData";

export const SubscriptionsPage: React.FC = () => {
  const [subs, setSubs] = useState<SubscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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
    setActionInProgress(subId);
    try {
      const res = await subscriptionService.retrySubscription(subId);
      setActiveMessage(res.message);
      await loadSubs();
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || "Error retrying subscription";
      alert("Policy Gateway Block: " + msg);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSendPreDebitAlert = async (subId: string) => {
    setActionInProgress(subId);
    try {
      const res = await subscriptionService.sendPreDebitNotification(subId);
      setActiveMessage(res.message);
      await loadSubs();
    } catch (e: any) {
      alert("Error dispatching pre-debit alert: " + (e.response?.data?.detail || e.message));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOptOut = async (subId: string) => {
    if (!confirm("Simulate customer exercising their statutory right to opt-out of this recurring charge?")) return;
    setActionInProgress(subId);
    try {
      const res = await subscriptionService.optOutSubscription(subId);
      setActiveMessage(res.message);
      await loadSubs();
    } catch (e: any) {
      alert("Error registering customer opt-out: " + (e.response?.data?.detail || e.message));
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              SUBSCRIPTION DUNNING & E-MANDATE ENGINE
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
            Reference implementation of RBI e-Mandate rules: 24-hour pre-debit customer notifications, AFA thresholds, and opt-out controls.
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

      {/* RBI e-Mandate Framework Notice Card */}
      <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-start gap-3 shadow-premium-sm">
        <ShieldCheck className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[var(--color-text-primary)]">
            Reference Implementation: RBI e-Mandate & AFA Framework
          </p>
          <p className="text-[11px] leading-relaxed">
            Subscriptions ≥ ₹15,000 mandate an Additional Factor of Authentication (AFA) and require a 24-hour advance pre-debit alert window before any automated retry is permitted to fire. Customers can opt-out directly from alerts.
          </p>
        </div>
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
                <th className="p-4">Mandate Tier</th>
                <th className="p-4">Pre-Debit Notice (24h)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Retries</th>
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
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-12"></div></td>
                    <td className="p-4 pr-6 text-right"><div className="h-6 bg-[var(--color-bg-surface-hover)] rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[var(--color-text-muted)] font-sans">
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
                subs.map((s) => {
                  const isAfa = Boolean(s.afa_required || (s.amount ?? 0) >= 15000);
                  const isNotified = Boolean(s.pre_debit_notification_sent_at);
                  const isOptedOut = Boolean(s.opt_out_status);

                  return (
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
                        {isAfa ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            AFA Required (₹15k+)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                            Standard Mandate
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isOptedOut ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            Customer Opted Out
                          </span>
                        ) : isNotified ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>24h Alert Sent (Valid)</span>
                          </span>
                        ) : isAfa ? (
                          <button
                            onClick={() => handleSendPreDebitAlert(s.id || s.subscription_id)}
                            disabled={actionInProgress === (s.id || s.subscription_id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono hover:bg-amber-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Bell className="w-3 h-3" />
                            <span>Send 24h Alert</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-[var(--color-text-muted)]">N/A (&lt;₹15k)</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={s.current_status || "ACTIVE"} type="recovery" />
                      </td>
                      <td className="p-4 font-mono text-[var(--color-text-secondary)]">
                        {s.retry_count ?? 0} / {s.max_retries ?? 3}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isOptedOut ? (
                            <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px] font-semibold">
                              Cancelled (Opt-Out)
                            </span>
                          ) : s.current_status === "PAST_DUE" ? (
                            <>
                              <button
                                onClick={() => handleRetry(s.id || s.subscription_id)}
                                disabled={actionInProgress === (s.id || s.subscription_id)}
                                className="px-3 py-1.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Smart Retry</span>
                              </button>
                              <button
                                onClick={() => handleOptOut(s.id || s.subscription_id)}
                                title="Simulate customer opting out of this recurring charge"
                                className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-rose-500/10 hover:border-rose-500/30 text-[var(--color-text-muted)] hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mandate Active</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* C.3: Pre-Debit Failure Prevention Footer */}
          <div className="p-3.5 bg-[var(--color-bg-canvas)] border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                <strong>Pre-Debit Failure Prevention:</strong> Enforces statutory 24-hour pre-debit notifications and auto-pauses dunning upon customer opt-out — eliminating bank mandate revocations and involuntary churn before debit failure occurs.
              </span>
            </div>
            <span className="font-mono text-[10px] text-[var(--color-text-muted)]">RBI e-Mandate Framework</span>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {subs.map((s) => {
          const isAfa = Boolean(s.afa_required || (s.amount ?? 0) >= 15000);
          const isNotified = Boolean(s.pre_debit_notification_sent_at);
          const isOptedOut = Boolean(s.opt_out_status);

          return (
            <div key={s.id || s.subscription_id} className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-xs text-[var(--color-accent)]">{s.subscription_id}</span>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">{s.customer_name || "Enterprise Client"}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{s.plan_name}</p>
                </div>
                <span className="font-bold text-sm text-[var(--color-text-primary)] font-mono">{formatINR(s.amount)}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)] text-xs">
                <StatusBadge status={s.current_status} type="recovery" />
                {isAfa && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    AFA Tier
                  </span>
                )}
                {isOptedOut && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Opted Out
                  </span>
                )}
              </div>

              {s.current_status === "PAST_DUE" && !isOptedOut && (
                <div className="pt-2 flex items-center gap-2 justify-end">
                  {!isNotified && isAfa && (
                    <button
                      onClick={() => handleSendPreDebitAlert(s.id || s.subscription_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono border border-amber-500/30"
                    >
                      Send 24h Alert
                    </button>
                  )}
                  <button
                    onClick={() => handleRetry(s.id || s.subscription_id)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm"
                  >
                    Smart Retry
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
