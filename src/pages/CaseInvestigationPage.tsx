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

  const handleApprove = async (notes?: string) => {
    if (!caseData) return;
    setIsExecuting(true);
    try {
      await recoveryService.approveCase(caseData.id || caseData.case_id, notes);
      setIsApprovalOpen(false);
      setExecutionMessage("Case approved by operator. Autonomous action executed.");
      await loadCaseData();
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
        <div className="flex items-center gap-3 text-sm text-slate-400 font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>Loading case investigation telemetry...</span>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-100">Recovery Case Not Found</h2>
        <p className="text-xs text-slate-400">Could not find record for case '{caseId}'</p>
        <Link to="/cases" className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold">
          Return to All Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/cases")}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recovery Queue</span>
        </button>

        <div className="flex items-center gap-2">
          {caseData.case_id === "RV-10291" && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Flagship Demo Flow</span>
            </span>
          )}
          <button
            onClick={loadCaseData}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Refresh telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Success Notification Banner on Execution */}
      {executionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{executionMessage}</span>
          </div>
          <button onClick={() => setExecutionMessage(null)} className="text-emerald-400 hover:text-emerald-200 text-xs">
            Dismiss
          </button>
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
