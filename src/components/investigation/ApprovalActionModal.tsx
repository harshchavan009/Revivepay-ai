import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, X, AlertTriangle } from "lucide-react";
import { RecoveryCase } from "../../types";
import { ActionBadge } from "../ActionBadge";
import { ConfidenceGauge } from "../ConfidenceGauge";

interface ApprovalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: RecoveryCase;
  onApprove: (notes?: string) => void;
  onReject: (reason: string, notes?: string) => void;
  isLoading?: boolean;
}

export const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  isOpen,
  onClose,
  caseData,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("Suspected merchant fraud or unusual pattern");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "approve") {
      onApprove(notes);
    } else {
      onReject(rejectionReason, notes);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0B0F19] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Human-in-the-Loop Operator Review</h3>
              <p className="text-[11px] text-slate-400 font-mono">Case: {caseData.case_id} • Amount: ₹{(caseData.amount ?? caseData.amount_at_risk ?? 0).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Recommendation Summary */}
        <div className="p-4 space-y-3">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">AI Proposed Action:</span>
              <ActionBadge action={caseData.recommended_action} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Model Confidence:</span>
              <ConfidenceGauge confidence={caseData.ai_confidence} />
            </div>
            <div className="text-xs text-slate-300 pt-1">
              <span className="text-slate-400">Reasoning: </span>
              {caseData.reasoning_summary || "High recoverability identified from historical payment performance."}
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMode("approve")}
              className={`p-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                mode === "approve"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-md"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Action</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("reject")}
              className={`p-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                mode === "reject"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500 shadow-md"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Action</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            {mode === "reject" && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Select Rejection Reason:</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none font-sans"
                >
                  <option value="Suspected merchant fraud or unusual pattern">Suspected merchant fraud or unusual pattern</option>
                  <option value="Customer requested cancellation offline">Customer requested cancellation offline</option>
                  <option value="Exceeds current operator authorization limit">Exceeds current operator authorization limit</option>
                  <option value="Duplicate payment confirmed on alternate bank account">Duplicate payment confirmed on alternate bank account</option>
                  <option value="Dispute / chargeback risk flagged">Dispute / chargeback risk flagged</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Operator Audit Notes (Optional):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add contextual compliance notes for the audit trail..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none font-sans placeholder-slate-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                  mode === "approve"
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40"
                }`}
              >
                {isLoading
                  ? "Processing..."
                  : mode === "approve"
                  ? "Confirm & Execute Action"
                  : "Reject & Close Case"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
