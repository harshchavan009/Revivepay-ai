import React, { useState, useEffect } from "react";
import { Repeat, RefreshCw, AlertTriangle, CheckCircle2, CreditCard, ArrowRight, Zap } from "lucide-react";
import { subscriptionService } from "../services";
import { SubscriptionItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { formatINR } from "../data/mockData";

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
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#13354E] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              SUBSCRIPTION DUNNING ENGINE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              MANDATE RECOVERY
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Repeat className="w-6 h-6 text-cyan-400" />
            <span>Recurring Subscription Recovery</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Intelligent dunning cycles, automatic e-mandate retry backoff, and card update request workflows.
          </p>
        </div>

        <button
          onClick={loadSubs}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#081B2A] border border-[#163E5C] hover:bg-[#0D283E] text-slate-200 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Table</span>
        </button>
      </div>

      {activeMessage && (
        <div className="p-3.5 rounded-xl bg-[#082338] border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeMessage}</span>
          </div>
          <button onClick={() => setActiveMessage(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-[#081826]/90 border border-[#163E5C] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#051420] border-b border-[#163E5C] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Subscription ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Plan Name</th>
                <th className="p-4">Recurring Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Retry Count</th>
                <th className="p-4">Failure Reason</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#13354E]/60 text-slate-200 font-sans">
              {subs.map((s) => (
                <tr key={s.id || s.subscription_id} className="hover:bg-[#0A2234]/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-100">
                    {s.subscription_id}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-white">{s.customer_name || "Enterprise Client"}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.customer_email}</p>
                  </td>
                  <td className="p-4 font-medium text-slate-300">
                    {s.plan_name}
                  </td>
                  <td className="p-4 font-bold text-white">
                    {formatINR(s.amount)} <span className="text-[10px] text-slate-400 font-normal">/{s.billing_interval}</span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={s.current_status} type="recovery" />
                  </td>
                  <td className="p-4 font-mono text-slate-300">
                    {s.retry_count} / {s.max_retries}
                  </td>
                  <td className="p-4 text-slate-400 max-w-[200px] truncate">
                    {s.failure_reason || "None (Mandate active)"}
                  </td>
                  <td className="p-4 text-right">
                    {s.current_status === "PAST_DUE" ? (
                      <button
                        onClick={() => handleRetry(s.id || s.subscription_id)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow transition-all active:scale-95 flex items-center gap-1 ml-auto"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Smart Retry</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mandate Active</span>
                      </span>
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
