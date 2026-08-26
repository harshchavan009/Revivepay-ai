import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldAlert, CreditCard, User, X, ArrowRight } from "lucide-react";
import { recoveryService, paymentService } from "../services";
import { RecoveryCase, Payment } from "../types";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        isOpen ? onClose() : document.getElementById("search-trigger")?.click();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && query.trim().length > 1) {
      recoveryService.getCases({ search: query }).then(setCases);
      paymentService.getPayments({ search: query }).then(setPayments);
    } else {
      setCases([]);
      setPayments([]);
    }
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#0B0F19] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search by Case ID (RV-10291), Payment (pay_89231), customer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm outline-none font-sans"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Links & Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {query.trim().length <= 1 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Navigation</p>
              <div className="space-y-1">
                <button
                  onClick={() => handleSelect("/cases/RV-10291")}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-left hover:bg-blue-900/40 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="font-semibold text-slate-100">Featured Demo: RV-10291</p>
                      <p className="text-[11px] text-slate-400">₹4,999 • Temporary Bank Failure • Returning Customer</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                </button>
                <button
                  onClick={() => handleSelect("/approvals")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 text-left transition-colors text-xs text-slate-300"
                >
                  <span>Approval Center (12 Pending)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() => handleSelect("/simulation")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 text-left transition-colors text-xs text-slate-300"
                >
                  <span>Simulation Center (7 Live Scenarios)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          )}

          {/* Case Results */}
          {cases.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Recovery Cases ({cases.length})
              </p>
              <div className="space-y-1">
                {cases.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/cases/${c.case_id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 text-left transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 font-mono">{c.case_id}</span>
                          <div className="text-right">
                          <span className="text-emerald-400 font-semibold">₹{(c.amount ?? c.amount_at_risk ?? 0).toLocaleString()}</span>
                          <span className="block text-[10px] text-slate-500 capitalize">{c.recovery_status.toLowerCase()}</span>
                        </div>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {c.risk_level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{c.customer_name} • {c.root_cause || c.failure_type}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Results */}
          {payments.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Payments ({payments.length})
              </p>
              <div className="space-y-1">
                {payments.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(`/payments`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 text-left transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-200">{p.payment_id}</span>
                          <span className="text-slate-300">₹{p.amount.toLocaleString()}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/60 text-red-400 border border-red-800/40 font-mono">
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{p.customer_name} • {p.failure_reason || "Payment"}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
