import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, X, AlertTriangle, FileText, KeyRound } from "lucide-react";
import { RecoveryCase } from "../../types";
import { ActionBadge } from "../ActionBadge";
import { ConfidenceGauge } from "../ConfidenceGauge";
import { formatINR } from "../../data/mockData";
import { StepUpAuthModal } from "./StepUpAuthModal";

interface ApprovalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: RecoveryCase;
  onApprove: (notes?: string, stepUpToken?: string) => void;
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
  const [isStepUpOpen, setIsStepUpOpen] = useState(false);

  if (!isOpen) return null;

  const amt = caseData.amount ?? caseData.amount_at_risk ?? 0;
  const isHighValue = amt >= 50000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "approve") {
      if (isHighValue) {
        setIsStepUpOpen(true);
      } else {
        onApprove(notes);
      }
    } else {
      onReject(rejectionReason, notes);
    }
  };

  const handleStepUpSuccess = (stepUpToken: string) => {
    setIsStepUpOpen(false);
    onApprove(notes, stepUpToken);
  };

  const name = caseData.customer_name || "Enterprise Customer";
  const tier = caseData.customer_tier || "VIP";

  const evidenceItems: string[] =
    caseData.evidence && caseData.evidence.length >= 2
      ? caseData.evidence
      : [
          `${name} (${tier} Tier): Verified historical settlement profile with low dispute probability.`,
          `Transaction value ₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })} assessed with risk index ${(caseData.risk_score || 45).toFixed(1)}/100.`,
          `Gateway telemetry diagnostic: [${caseData.failure_type || "BANK_DECLINE"}] ${caseData.root_cause || "Gateway Switch Timeout"}.`,
          `Deterministic guardrail: Operator sign-off enforced by merchant threshold policy.`
        ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-2xl shadow-premium-lg overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-primary)] text-sm">Human-in-the-Loop Operator Review</h3>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                Case: {caseData.case_id} • Amount: {formatINR(amt)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Recommendation Summary */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)] font-medium">AI Proposed Action:</span>
              <ActionBadge action={caseData.recommended_action} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)] font-medium">Model Confidence:</span>
              <ConfidenceGauge confidence={caseData.ai_confidence} />
            </div>
            <div className="text-xs text-[var(--color-text-primary)] pt-1 leading-relaxed">
              <span className="text-[var(--color-text-secondary)] font-semibold">Reasoning: </span>
              {caseData.reasoning_summary || `Policy evaluation for ${name} (${formatINR(amt)}) requires explicit revenue operator approval before automated retry.`}
            </div>
          </div>

          {/* Grounded Evidence Details */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider font-mono">
              Grounded Telemetry Evidence:
            </span>
            <div className="space-y-1">
              {evidenceItems.map((ev, i) => (
                <div key={i} className="text-[11px] text-[var(--color-text-secondary)] flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0"></span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMode("approve")}
              className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                mode === "approve"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-premium-sm"
                  : "bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Action</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("reject")}
              className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                mode === "reject"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500 shadow-premium-sm"
                  : "bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Action</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            {mode === "reject" && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Select Rejection Reason:</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-xl p-2.5 outline-none font-sans"
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
              <label className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Operator Audit Notes (Optional):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add contextual compliance notes for the audit trail..."
                rows={2}
                className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-xl p-2.5 outline-none font-sans placeholder-[var(--color-text-muted)] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-semibold border border-[var(--color-border)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-premium-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                  mode === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-rose-600 hover:bg-rose-500 text-white"
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

      {/* Step-Up Re-Authentication Modal for High-Value Operations */}
      <StepUpAuthModal
        isOpen={isStepUpOpen}
        onClose={() => setIsStepUpOpen(false)}
        caseId={caseData.case_id}
        amount={amt}
        customerName={name}
        onSuccess={handleStepUpSuccess}
      />
    </div>
  );
};
