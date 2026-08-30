import React, { useState, useEffect } from "react";
import { ShoppingCart, RefreshCw, Send, CheckCircle2, ArrowRight, Zap, ShieldAlert } from "lucide-react";
import { checkoutService } from "../services";
import { AbandonedCart } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { formatINR } from "../data/mockData";

export const CheckoutAbandonmentPage: React.FC = () => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCarts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await checkoutService.getAbandonedCheckouts();
      setCarts(data);
    } catch (err: any) {
      setError("Failed to fetch abandoned checkout sessions from backend. Cart intelligence service unavailable.");
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
    <div className="space-y-6 pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              CHECKOUT DROPOFF INTELLIGENCE
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              {carts.length} Tracked Sessions
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Checkout Dropoff & 1-Click Recovery</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Real-time intent-scored checkout abandonment with 1-click WhatsApp payment link generation.
          </p>
        </div>

        <button
          onClick={loadCarts}
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
            onClick={loadCarts}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Active Toast Notification */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-premium-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs font-bold cursor-pointer">
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
                <th className="p-4 pl-6">Session ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Cart Items</th>
                <th className="p-4">Cart Value</th>
                <th className="p-4">Intent Score</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Recovery Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] font-sans">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4 pl-6"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-36"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-14"></div></td>
                    <td className="p-4"><div className="h-4 bg-[var(--color-bg-surface-hover)] rounded w-16"></div></td>
                    <td className="p-4 pr-6 text-right"><div className="h-6 bg-[var(--color-bg-surface-hover)] rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : carts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[var(--color-text-muted)] font-sans">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-[var(--color-text-primary)] text-sm">No abandoned checkouts</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">All checkout sessions completed successfully without dropoffs.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                carts.map((c) => (
                  <tr key={c.id || c.checkout_id} className="hover:bg-[var(--color-bg-surface-hover)] transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-[var(--color-text-primary)]">
                      {c.checkout_id || c.id || "CHK-UNKNOWN"}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-[var(--color-text-primary)]">{c.customer_name || "Customer"}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{c.customer_email || "Email unavailable"}</p>
                    </td>
                    <td className="p-4 text-[var(--color-text-secondary)] max-w-[220px] truncate">
                      {c.cart_items && c.cart_items.length > 0
                        ? c.cart_items.map((item) => `${item?.name || "Item"} (${item?.qty || 1}x)`).join(", ")
                        : "Item details unavailable"}
                    </td>
                    <td className="p-4 font-bold text-[var(--color-text-primary)] font-mono">
                      {formatINR(c.total_value ?? 0)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[var(--color-text-primary)] font-mono">{Math.round(c.intent_score ?? 85)}/100</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                          HIGH
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={c.status || "ABANDONED"} type="recovery" />
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {c.status === "RECOVERED" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Recovered</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRecover(c.id || c.checkout_id)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 ml-auto cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send 1-Click Link</span>
                        </button>
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
        {carts.map((c) => (
          <div key={c.id || c.checkout_id} className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono font-bold text-xs text-[var(--color-text-primary)]">{c.checkout_id || c.id || "CHK-UNKNOWN"}</span>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">{c.customer_name || "Customer"}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{c.customer_email || "Email unavailable"}</p>
              </div>
              <span className="font-bold text-sm text-[var(--color-text-primary)] font-mono">{formatINR(c.total_value ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-subtle)] text-xs">
              <StatusBadge status={c.status || "ABANDONED"} type="recovery" />
              {c.status !== "RECOVERED" && (
                <button
                  onClick={() => handleRecover(c.id || c.checkout_id)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm"
                >
                  Send Recovery Link
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
