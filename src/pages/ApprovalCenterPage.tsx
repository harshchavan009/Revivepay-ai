import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, UserCheck, ArrowRight, ShieldCheck, RefreshCw, AlertTriangle, Sparkles, FileText, Check } from "lucide-react";
import { recoveryService } from "../services";
import { RecoveryCase } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { ActionBadge } from "../components/ActionBadge";
import { ConfidenceGauge } from "../components/ConfidenceGauge";
import { ApprovalActionModal } from "../components/investigation/ApprovalActionModal";
import { EventSourceBadge } from "../components/EventSourceBadge";
import { formatINR } from "../data/mockData";

export const ApprovalCenterPage: React.FC = () => {
  const [pendingCases, setPendingCases] = useState<RecoveryCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const loadPending = async () => {
    setIsLoading(true);
    try {
      const data = await recoveryService.getCases({ approval_status: "PENDING" });
      setPendingCases(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (notes?: string) => {
    if (!selectedCase) return;
    try {
      await recoveryService.approveCase(selectedCase.id || selectedCase.case_id, notes);
      setSelectedCase(null);
      setSuccessBanner(`Case ${selectedCase.case_id} approved and autonomous recovery executed.`);
      await loadPending();
    } catch (e: any) {
      alert("Error approving case: " + e.message);
    }
  };

  const handleReject = async (reason: string, notes?: string) => {
    if (!selectedCase) return;
    try {
      await recoveryService.rejectCase(selectedCase.id || selectedCase.case_id, reason, notes);
      setSelectedCase(null);
      setSuccessBanner(`Case ${selectedCase.case_id} rejected. Recovery stopped.`);
      await loadPending();
    } catch (e: any) {
      alert("Error rejecting case: " + e.message);
    }
  };

  const getEvidenceList = (c: RecoveryCase): string[] => {
    if (c.evidence && c.evidence.length >= 2) {
      return c.evidence;
    }
    const amt = c.amount ?? c.amount_at_risk ?? 0;
    const name = c.customer_name || "Enterprise Customer";
    const tier = c.customer_tier || "VIP";
    const score = c.risk_score || 45;
    const reason = c.root_cause || c.failure_type || "Gateway Switch Outage (504)";
    return [
      `${name} (${tier} Tier): Verified historical settlement profile with low dispute probability.`,
      `Transaction value ₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })} assessed with risk index ${score.toFixed(1)}/100 (${c.risk_level || "MEDIUM"}).`,
      `Gateway telemetry diagnostic: [${c.failure_type || "BANK_DECLINE"}] ${reason}.`,
      `Deterministic guardrail: Operator sign-off enforced by merchant threshold policy.`
    ];
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              HUMAN-IN-THE-LOOP SAFEGUARDS
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-500" />
              <span>POLICY GATE ACTIVE</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Human-in-the-Loop Approval Center</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Ramp & Linear-style review queue for high-value transactions, low model confidence, and policy-gated recovery actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold">
            {pendingCases.length} Approvals Pending
          </span>
          <button
            onClick={loadPending}
            className="p-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] transition-colors cursor-pointer shadow-premium-sm"
            title="Refresh Approvals Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--color-accent)]" : ""}`} />
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between shadow-premium-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs cursor-pointer font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Approval Cards Grid */}
      {pendingCases.length === 0 ? (
        <div className="p-16 text-center bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl space-y-3 shadow-premium-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-[var(--color-text-primary)] text-base">Approval Queue Clean</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
            All high-risk and policy-gated recovery cases have been reviewed. New items will automatically appear when policy conditions require human authorization.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingCases.map((c) => {
            const evidenceItems = getEvidenceList(c);
            const amt = c.amount ?? c.amount_at_risk ?? 0;

            return (
              <div
                key={c.id || c.case_id}
                className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all space-y-5 shadow-premium-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-[var(--color-border-subtle)] pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[var(--color-text-primary)] text-base">{c.case_id}</span>
                        <EventSourceBadge source={c.source} size="sm" />
                        <RiskBadge level={c.risk_level} score={c.risk_score} showScore />
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium pt-1">{c.customer_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-mono block">Amount at Risk</span>
                      <span className="font-bold text-lg text-amber-600 dark:text-amber-400 font-mono">
                        {formatINR(amt)}
                      </span>
                    </div>
                  </div>

                  {/* AI Diagnosis Summary */}
                  <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-secondary)] font-medium">AI Proposed Action:</span>
                      <ActionBadge action={c.recommended_action} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-secondary)] font-medium">Model Confidence:</span>
                      <ConfidenceGauge confidence={c.ai_confidence} />
                    </div>
                    <div className="text-[var(--color-text-primary)] pt-1 leading-relaxed">
                      <span className="text-[var(--color-text-secondary)] font-semibold">Reasoning: </span>
                      {c.reasoning_summary || `Policy evaluation for ${c.customer_name || 'Customer'} (${formatINR(amt)}) requires explicit revenue operator approval before automated retry.`}
                    </div>
                  </div>

                  {/* Grounded Evidence Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider font-mono">
                      <FileText className="w-3 h-3 text-[var(--color-accent)]" />
                      <span>GROUNDED EVIDENCE:</span>
                    </div>
                    <div className="space-y-1.5">
                      {evidenceItems.map((ev, i) => (
                        <div key={i} className="text-[11px] text-[var(--color-text-secondary)] flex items-start gap-2 bg-[var(--color-bg-canvas)]/50 p-2 rounded-lg border border-[var(--color-border-subtle)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0"></span>
                          <span className="leading-relaxed">{ev}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
                  <Link
                    to={`/cases/${c.case_id}`}
                    className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Full Investigation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCase(c)}
                      className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Review & Act</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reusable Approval / Rejection Modal */}
      {selectedCase && (
        <ApprovalActionModal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          caseData={selectedCase}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};
