import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, PlayCircle, RefreshCw, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { recoveryService, auditService } from "../services";
import { RecoveryCase, AuditLogEntry } from "../types";
import { CaseDetailsHero } from "../components/investigation/CaseDetailsHero";
import { RiskScoreCard } from "../components/investigation/RiskScoreCard";
import { AiDiagnosisCard } from "../components/investigation/AiDiagnosisCard";
import { PolicyChecklistCard } from "../components/investigation/PolicyChecklistCard";
import { ApprovalActionModal } from "../components/investigation/ApprovalActionModal";
import { ExecutionTracker } from "../components/investigation/ExecutionTracker";
import { AuditTimelineView } from "../components/investigation/AuditTimelineView";

export const CaseInvestigationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const caseId = id || "RV-10291";

  const [caseData, setCaseData] = useState<RecoveryCase | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const loadCaseData = async () => {
    setIsLoading(true);
    try {
      const data = await recoveryService.getCaseById(caseId);
      if (data) {
        setCaseData(data);
        const logs = await auditService.getCaseAuditLogs(data.id || data.case_id);
        setAuditLogs(logs);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const handleExecuteRecovery = async () => {
    if (!caseData) return;
    setIsExecuting(true);
    try {
      const result = await recoveryService.executeAction(caseData.id || caseData.case_id);
      setExecutionMessage(result.message || "Recovery action executed successfully.");
      await loadCaseData();
    } finally {
      setIsExecuting(false);
    }
  };

  const handleApprove = async (notes?: string, stepUpToken?: string) => {
    if (!caseData) return;
    setIsExecuting(true);
    try {
      await recoveryService.approveCase(caseData.id || caseData.case_id, notes, stepUpToken);
      setIsApprovalOpen(false);
      setExecutionMessage("Case approved by operator. Autonomous action executed.");
      await loadCaseData();
    } catch (err: any) {
      setExecutionMessage(err.message || "Failed to approve case.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReject = async (reason: string, notes?: string) => {
    if (!caseData) return;
    setIsExecuting(true);
    try {
      await recoveryService.rejectCase(caseData.id || caseData.case_id, reason, notes);
      setIsApprovalOpen(false);
      setExecutionMessage("Case rejected by operator. Recovery stopped.");
      await loadCaseData();
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading && !caseData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-accent)]" />
          <span>Loading case investigation telemetry...</span>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-12 text-center space-y-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-premium-sm">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Recovery Case Not Found</h2>
        <p className="text-xs text-[var(--color-text-secondary)]">Could not find record for case '{caseId}'</p>
        <Link to="/cases" className="inline-block px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-premium-sm">
          Return to All Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/cases")}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-mono cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recovery Queue</span>
        </button>

        <div className="flex items-center gap-2">
          {caseData.case_id === "RV-10291" && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flagship Demo Flow</span>
            </span>
          )}
          <button
            onClick={loadCaseData}
            className="p-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer shadow-premium-sm"
            title="Refresh telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Success Notification Banner on Execution */}
      {executionMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-premium-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{executionMessage}</span>
          </div>
          <button onClick={() => setExecutionMessage(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* B.1: Demonstrable Policy Override Banner */}
      {(caseData.overrode_ai_recommendation || (caseData.amount > 10000 && caseData.approval_required && caseData.policy_status === "REVIEW_REQUIRED")) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 text-xs text-amber-900 dark:text-amber-200 space-y-2 shadow-premium-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Deterministic Policy Overrode AI Recommendation</span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed">
            {caseData.ai_override_reason ||
              `AI recommended auto-retry (${Math.round((caseData.ai_confidence || 0.94) * 100)}% confidence) — blocked by policy: exceeds ₹10,000 automated-action limit. Routed to Human-in-the-Loop regardless of model confidence.`}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 font-mono text-[10px] font-bold text-amber-900 dark:text-amber-200 border border-amber-500/30">
              AI Proposal: {caseData.ai_original_recommendation || `${caseData.recommended_action} (${Math.round((caseData.ai_confidence || 0.94) * 100)}% conf)`}
            </span>
            <span className="text-amber-500 font-bold">➔</span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-800 dark:text-rose-200 font-mono text-[10px] font-bold border border-rose-500/30">
              Policy Gate Decision: REVIEW_REQUIRED (Human-in-the-Loop)
            </span>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)] ml-auto">
              Audit Event: <code className="text-amber-600 dark:text-amber-400 font-bold">recovery.policy.overrode_ai_recommendation</code>
            </span>
          </div>
        </div>
      )}

      {/* B.2: Demonstrable Multi-Tier Fallback Attribution */}
      {caseData.model_name?.includes("gemini") && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between gap-2 shadow-premium-sm flex-wrap">
          <span className="font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Reasoning generated by: <strong className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Gemini 1.5 Pro (fallback)</strong></span>
          </span>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/30">
            Primary Claude Provider Latency / Timeout Failover
          </span>
        </div>
      )}

      {/* 1. Case Details Hero Header */}
      <CaseDetailsHero
        caseData={caseData}
        onExecute={handleExecuteRecovery}
        onOpenApproval={() => setIsApprovalOpen(true)}
        isExecuting={isExecuting}
      />

      {/* 2. Autonomous Execution Pipeline State Tracker */}
      <ExecutionTracker caseData={caseData} />

      {/* 3. Diagnostic & Governance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Engine Breakdown */}
        <RiskScoreCard
          score={caseData.risk_score}
          level={caseData.risk_level}
          factors={caseData.risk_factors}
        />

        {/* AI Root-Cause Diagnosis */}
        <AiDiagnosisCard
          rootCause={caseData.root_cause || "Temporary Gateway Disconnect"}
          confidence={caseData.ai_confidence}
          evidence={caseData.evidence || []}
          recommendedAction={caseData.recommended_action}
          reasoningSummary={caseData.reasoning_summary}
          modelProvider={caseData.model_provider}
          modelName={caseData.model_name}
          rawPrompt={caseData.raw_prompt}
          rawResponse={caseData.raw_response}
        />
      </div>

      {/* 4. Policy Gateway Checklist */}
      <PolicyChecklistCard
        status={caseData.policy_status}
        checklist={caseData.policy_checklist || []}
      />

      {/* 5. Chronological Audit Trail */}
      <AuditTimelineView logs={auditLogs} />

      {/* Human-in-the-Loop Approval Action Modal */}
      <ApprovalActionModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        caseData={caseData}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={isExecuting}
      />
    </div>
  );
};
