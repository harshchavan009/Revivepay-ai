import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, ShieldAlert, UserCheck, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { recoveryService } from "../services";
import { RecoveryCase } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { ActionBadge } from "../components/ActionBadge";
import { ConfidenceGauge } from "../components/ConfidenceGauge";
import { ApprovalActionModal } from "../components/investigation/ApprovalActionModal";
import { EventSourceBadge } from "../components/EventSourceBadge";

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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <span>Human-in-the-Loop Approval Center</span>
          </h1>
          <p className="text-xs text-slate-400">
            Ramp-style review queue for high-value transactions, low model confidence, and policy-gated recovery actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
            {pendingCases.length} Approvals Pending
          </span>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 text-xs">Dismiss</button>
        </div>
      )}

      {/* Pending Approval Cards Grid */}
      {pendingCases.length === 0 ? (
        <div className="p-12 text-center bg-[#0B0F19] border border-slate-800 rounded-xl space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-slate-100 text-base">Approval Queue Clean</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All high-risk and policy-gated recovery cases have been reviewed. New items will automatically appear when policy conditions require human authorization.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingCases.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-xl relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-100 text-base">{c.case_id}</span>
                    <EventSourceBadge source={c.source} size="sm" />
                    <RiskBadge level={c.risk_level} score={c.risk_score} showScore />
                  </div>
                  <p className="text-xs text-slate-300 font-medium pt-1">{c.customer_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Amount at Risk</span>
                  <span className="font-mono font-extrabold text-lg text-amber-400">
                    ₹{(c.amount ?? c.amount_at_risk ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* AI Diagnosis Summary */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">AI Proposed Action:</span>
                  <ActionBadge action={c.recommended_action} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Model Confidence:</span>
                  <ConfidenceGauge confidence={c.ai_confidence} />
                </div>
                <div className="text-slate-300 pt-1 leading-relaxed">
                  <span className="text-slate-400 font-semibold">Reasoning: </span>
                  {c.reasoning_summary || "Historical recoverability assessment completed."}
                </div>
              </div>

              {/* Evidence Pills */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Grounded Evidence:</span>
                <div className="space-y-1">
                  {c.evidence?.slice(0, 2).map((ev, i) => (
                    <div key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span className="truncate">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <Link
                  to={`/cases/${c.case_id}`}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Full Investigation</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCase(c)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/40 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Review & Act</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
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
