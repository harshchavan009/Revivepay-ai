import React, { useState, useEffect } from "react";
import { CreditCard, Search, Filter, RefreshCw, X, ArrowRight, ExternalLink } from "lucide-react";
import { paymentService } from "../services";
import { Payment } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { formatINR } from "../data/mockData";

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
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#13354E] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              TRANSACTION LEDGER
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              AUDIT VERIFIED
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            <span>Payment Telemetry Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transaction records with Razorpay test mode telemetry, status codes, and error categorization.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#081B2A] border border-[#163E5C] hover:bg-[#0D283E] text-slate-200 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#081826]/90 border border-[#163E5C] space-y-3 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Payment ID (pay_89231), failure reason, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#051420] border border-[#163E5C] text-slate-200 text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-cyan-400 font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#051420] border border-[#163E5C] text-slate-300 text-xs rounded-xl px-3 py-2.5 outline-none font-sans"
            >
              <option value="ALL">All Statuses</option>
              <option value="FAILED">Failed</option>
              <option value="CAPTURED">Captured</option>
              <option value="PENDING">Pending</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#051420] border border-[#163E5C] text-slate-300 text-xs rounded-xl px-3 py-2.5 outline-none font-sans"
            >
              <option value="ALL">All Categories</option>
              <option value="BANK_DECLINE">Bank Decline</option>
              <option value="CARD_EXPIRED">Card Expired</option>
              <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
              <option value="GATEWAY_TIMEOUT">Gateway Timeout</option>
            </select>
          </div>
        </form>
      </div>

      {/* Payment Records Table */}
      <div className="bg-[#081826]/90 border border-[#163E5C] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#051420] border-b border-[#163E5C] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Payment ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount (INR)</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4">Failure Category</th>
                <th className="p-4">Card Last 4</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#13354E]/60 font-sans">
              {payments.map((p) => (
                <tr key={p.id || p.payment_id} className="hover:bg-[#0A2234]/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-100">
                    {p.payment_id}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-white">{p.customer_name || "Enterprise Customer"}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">{p.customer_email}</p>
                  </td>
                  <td className="p-4 font-bold text-white">
                    {formatINR(p.amount)}
                  </td>
                  <td className="p-4 font-mono text-slate-400 uppercase">
                    {p.payment_method}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={p.status} type="payment" />
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] text-slate-300 font-medium">
                      {(p.failure_category || "Standard").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-300">
                    {p.retry_count} / {p.max_retry_count || 3}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="px-3 py-1.5 rounded-lg bg-[#0A2234] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-semibold text-xs transition-colors"
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
          <div className="w-full max-w-lg bg-[#081826] border border-[#163E5C] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#163E5C] pb-3">
              <div>
                <h3 className="font-bold text-white text-base font-mono">{selectedPayment.payment_id}</h3>
                <p className="text-xs text-slate-400">Transaction Gateway Payload</p>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#143952]">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-white">{selectedPayment.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#143952]">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-amber-400">{formatINR(selectedPayment.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#143952]">
                <span className="text-slate-400">Payment Status:</span>
                <StatusBadge status={selectedPayment.status} type="payment" />
              </div>
              <div className="flex justify-between py-1 border-b border-[#143952]">
                <span className="text-slate-400">Failure Code:</span>
                <span className="font-mono text-rose-400 font-bold">{selectedPayment.failure_code || "BANK_DECLINE"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#143952]">
                <span className="text-slate-400">Failure Description:</span>
                <span className="text-slate-300 text-right">{selectedPayment.failure_reason || "Normal processing"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#143952]">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-mono text-slate-300 uppercase">{selectedPayment.payment_method}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-xl bg-[#0B253A] hover:bg-[#113450] text-slate-200 text-xs font-semibold"
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
