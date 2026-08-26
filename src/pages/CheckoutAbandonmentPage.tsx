import React, { useState, useEffect } from "react";
import { ShoppingCart, RefreshCw, Sparkles, Send, CheckCircle2, ArrowRight } from "lucide-react";
import { checkoutService } from "../services";
import { AbandonedCart } from "../types";
import { StatusBadge } from "../components/StatusBadge";

export const CheckoutAbandonmentPage: React.FC = () => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadCarts = async () => {
    setIsLoading(true);
    try {
      const data = await checkoutService.getAbandonedCheckouts();
      setCarts(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCarts();
  }, []);

  const handleRecover = async (chkId: string) => {
    try {
      const res = await checkoutService.recoverCheckout(chkId);
      setMessage(res.message);
      await loadCarts();
    } catch (e: any) {
      alert("Error sending cart recovery reminder: " + e.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <span>Checkout Abandonment Recovery</span>
          </h1>
          <p className="text-xs text-slate-400">
            High-intent purchase recovery with personalized non-intrusive incentives and saved cart states.
          </p>
        </div>

        <button
          onClick={loadCarts}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-400 text-xs">Dismiss</button>
        </div>
      )}

      {/* Carts Table */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3.5">Session ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Cart Items</th>
                <th className="p-3.5">Total Value</th>
                <th className="p-3.5">Intent Score</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Recovery Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {carts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-200">
                    {c.checkout_id}
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-200">{c.customer_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.customer_email}</p>
                  </td>
                  <td className="p-3.5 text-slate-300 max-w-[200px] truncate">
                    {c.cart_items?.map((item) => `${item.name} (${item.qty}x)`).join(", ") || "Cart items"}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-emerald-400">
                    ₹{c.total_value.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-100">{Math.round(c.intent_score)}/100</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                        HIGH
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={c.status} type="recovery" />
                  </td>
                  <td className="p-3.5 text-right">
                    {c.status === "ABANDONED" ? (
                      <button
                        onClick={() => handleRecover(c.id || c.checkout_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Reminder</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-mono text-[11px] font-semibold">Reminder Sent</span>
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
