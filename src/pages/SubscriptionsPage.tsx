import React, { useState, useEffect } from "react";
import { Repeat, RefreshCw, AlertTriangle, CheckCircle2, CreditCard, ArrowRight } from "lucide-react";
import { subscriptionService } from "../services";
import { SubscriptionItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";

export const SubscriptionsPage: React.FC = () => {
  const [subs, setSubs] = useState<SubscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const loadSubs = async () => {
    setIsLoading(true);
    try {
      const data = await subscriptionService.getSubscriptions();
      setSubs(data);
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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-400" />
            <span>Recurring Subscription Recovery</span>
          </h1>
          <p className="text-xs text-slate-400">
            Intelligent dunning cycles, automatic recurring retry backoff, and card update request workflows.
          </p>
        </div>

        <button
          onClick={loadSubs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {activeMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeMessage}</span>
          </div>
          <button onClick={() => setActiveMessage(null)} className="text-indigo-400 text-xs">Dismiss</button>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3.5">Subscription ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5">Recurring Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Retry Attempt</th>
                <th className="p-3.5">Failure Reason</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {subs.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-200">
                    {s.subscription_id}
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-200">{s.customer_name || "Enterprise Client"}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.customer_email}</p>
                  </td>
                  <td className="p-3.5 font-medium text-slate-300">
                    {s.plan_name}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-100">
                    ₹{s.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/{s.billing_interval}</span>
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={s.current_status} type="recovery" />
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {s.retry_count} / {s.max_retries}
                  </td>
                  <td className="p-3.5 text-slate-400 max-w-[180px] truncate">
                    {s.failure_reason || "None (Mandate active)"}
                  </td>
                  <td className="p-3.5 text-right">
                    {s.current_status === "PAST_DUE" ? (
                      <button
                        onClick={() => handleRetry(s.id || s.subscription_id)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                      >
                        Smart Retry
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-mono text-[11px] font-semibold">Active</span>
                    )}
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
