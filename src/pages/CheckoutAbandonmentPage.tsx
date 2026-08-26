import React, { useState, useEffect } from "react";
import { ShoppingCart, RefreshCw, Sparkles, Send, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { checkoutService } from "../services";
import { AbandonedCart } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { formatINR } from "../data/mockData";

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
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#13354E] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              CHECKOUT DROPOFF INTELLIGENCE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              UPI 1-CLICK DISPATCH
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-cyan-400" />
            <span>Checkout Abandonment Recovery</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            High-intent purchase recovery with personalized non-intrusive incentives and saved cart states.
          </p>
        </div>

        <button
          onClick={loadCarts}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#081B2A] border border-[#163E5C] hover:bg-[#0D283E] text-slate-200 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-[#082338] border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Carts Table */}
      <div className="bg-[#081826]/90 border border-[#163E5C] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#051420] border-b border-[#163E5C] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Session ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Cart Items</th>
                <th className="p-4">Cart Value</th>
                <th className="p-4">Intent Score</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Recovery Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#13354E]/60 font-sans">
              {carts.map((c) => (
                <tr key={c.id || c.checkout_id} className="hover:bg-[#0A2234]/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-white">
                    {c.checkout_id}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-white">{c.customer_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.customer_email}</p>
                  </td>
                  <td className="p-4 text-slate-300 max-w-[220px] truncate">
                    {c.cart_items?.map((item) => `${item.name} (${item.qty}x)`).join(", ") || "Pro License"}
                  </td>
                  <td className="p-4 font-bold text-white">
                    {formatINR(c.total_value)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{Math.round(c.intent_score)}/100</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                        HIGH
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={c.status} type="recovery" />
                  </td>
                  <td className="p-4 text-right">
                    {c.status === "RECOVERED" ? (
                      <span className="text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Recovered</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRecover(c.id || c.checkout_id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95 ml-auto"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send WhatsApp Link</span>
                      </button>
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
