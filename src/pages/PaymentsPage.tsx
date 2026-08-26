import React, { useState, useEffect } from "react";
import { CreditCard, Search, Filter, RefreshCw, X, ArrowRight, ExternalLink } from "lucide-react";
import { paymentService } from "../services";
import { Payment } from "../types";
import { StatusBadge } from "../components/StatusBadge";

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await paymentService.getPayments({
        status: statusFilter,
        failure_category: categoryFilter,
        search: search.trim() || undefined
      });
      setPayments(data);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <span>Payment Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Stripe-grade transaction records with Razorpay test mode telemetry and error categorization.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Payment ID (pay_89231), failure reason, error code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="FAILED">Failed</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none font-mono"
            >
              <option value="ALL">All Categories</option>
              <option value="temporary_bank_failure">Bank Timeout</option>
              <option value="insufficient_funds">Insufficient Funds</option>
              <option value="card_expired">Card Expired</option>
              <option value="checkout_drop">Cart Drop</option>
            </select>
          </div>
        </form>
      </div>

      {/* Payment Records Table */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3.5">Payment ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Amount (INR)</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Failure Category</th>
                <th className="p-3.5">Retry Count</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-200">
                    {p.payment_id}
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-200">{p.customer_name || "Enterprise Customer"}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">{p.customer_email}</p>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-100">
                    ₹{p.amount.toLocaleString()}
                  </td>
                  <td className="p-3.5 font-mono text-slate-400 uppercase">
                    {p.payment_method}
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={p.status} type="payment" />
                  </td>
                  <td className="p-3.5">
                    <span className="text-[11px] text-slate-300 font-medium capitalize">
                      {p.failure_category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {p.retry_count} / 2
                  </td>
                  <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                    {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Drawer Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0B0F19] border border-slate-700 rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base font-mono">{selectedPayment.payment_id}</h3>
                <p className="text-xs text-slate-400">Transaction Gateway Payload</p>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-200">{selectedPayment.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Amount:</span>
                <span className="font-mono font-bold text-amber-400">₹{selectedPayment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Payment Status:</span>
                <StatusBadge status={selectedPayment.status} type="payment" />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Failure Code:</span>
                <span className="font-mono text-rose-400 font-bold">{selectedPayment.failure_code || "NONE"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Failure Reason:</span>
                <span className="text-slate-300 text-right">{selectedPayment.failure_reason || "Normal processing"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-mono text-slate-300 uppercase">{selectedPayment.payment_method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Retry Attempts:</span>
                <span className="font-mono text-slate-300">{selectedPayment.retry_count}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
