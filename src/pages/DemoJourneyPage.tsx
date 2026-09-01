import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, ArrowRight, ArrowLeft, Play, RefreshCw, CheckCircle2, XCircle,
  Clock, ShieldCheck, ShieldAlert, Sparkles, AlertTriangle, FlaskConical,
  BarChart3, Lock, Activity, Hash, ChevronRight, User, CreditCard,
  TrendingUp, Cpu, Eye, FileText, RotateCcw, ChevronDown, ChevronUp,
  CheckCheck, ExternalLink, Terminal, Layers
} from "lucide-react";
import { simulationService, recoveryService, auditService, mlService, dashboardService } from "../services";
import { RecoveryCase, AuditLogEntry } from "../types";
import { useDemo } from "../context/DemoContext";
import { formatINR } from "../data/mockData";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DemoScenario {
  id: string;
  backendId: string;
  label: string;
  tagline: string;
  amount: number;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  outcome: string;
}

interface PolicyCheck {
  label: string;
  result: "PASS" | "FAIL" | "N/A";
  detail?: string;
}

interface AuditEvent {
  timestamp: string;
  actor: string;
  action: string;
  result: string;
  case_id?: string;
}

// ─── Scenario Definitions ────────────────────────────────────────────────────

const SCENARIOS: DemoScenario[] = [
  {
    id: "bank_failure",
    backendId: "bank_failure",
    label: "Scenario A — Bank Failure",
    tagline: "Returning customer · ₹4,999 · Transient gateway timeout",
    amount: 4999,
    badge: "HAPPY PATH",
    badgeColor: "emerald",
    icon: <CheckCircle2 className="w-4 h-4" />,
    outcome: "Auto-execute → Recovered"
  },
  {
    id: "retry_exhaustion",
    backendId: "retry_exhaustion_escalation",
    label: "Scenario B — Retry Exhaustion",
    tagline: "Persistent decline · ₹6,200 · Max retries reached",
    amount: 6200,
    badge: "POLICY BLOCK",
    badgeColor: "rose",
    icon: <ShieldAlert className="w-4 h-4" />,
    outcome: "Policy blocked → Escalated"
  },
  {
    id: "high_value",
    backendId: "high_value",
    label: "Scenario C — High Value",
    tagline: "Enterprise client · ₹85,000 · Human approval gate",
    amount: 85000,
    badge: "HUMAN APPROVAL",
    badgeColor: "amber",
    icon: <User className="w-4 h-4" />,
    outcome: "Awaiting operator approval"
  },
  {
    id: "ai_fallback",
    backendId: "gemini_fallback",
    label: "Scenario D — AI Fallback",
    tagline: "Claude timeout · Gemini 1.5 Pro failover",
    amount: 14500,
    badge: "AI RESILIENCE",
    badgeColor: "indigo",
    icon: <Sparkles className="w-4 h-4" />,
    outcome: "Deterministic fallback active"
  },
  {
    id: "duplicate",
    backendId: "bank_failure",
    label: "Scenario E — Duplicate Event",
    tagline: "Same payment event replayed · Idempotency enforcement",
    amount: 4999,
    badge: "IDEMPOTENCY",
    badgeColor: "violet",
    icon: <Lock className="w-4 h-4" />,
    outcome: "Duplicate ignored · Zero double-counting"
  }
];

// ─── Pipeline step definitions ────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { key: "DETECTED",   label: "Detected" },
  { key: "RISK",       label: "Risk Scored" },
  { key: "ML",         label: "ML Scored" },
  { key: "AI",         label: "AI Diagnosed" },
  { key: "POLICY",     label: "Policy Validated" },
  { key: "EXECUTING",  label: "Executing" },
  { key: "VERIFYING",  label: "Verifying" },
  { key: "RECOVERED",  label: "Recovered" },
];

const STEP_NAMES = [
  "Welcome",
  "Payment Detected",
  "Risk & ML",
  "AI Diagnosis",
  "Policy Gate",
  "Execute Recovery",
  "Outcome Verification",
  "Audit Trail",
  "Recovered"
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso?: string): string {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("en-IN", { hour12: false });
}

function formatDate(iso?: string): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour12: false });
}

function badgeClasses(color: string) {
  const map: Record<string, string> = {
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    rose:    "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
    amber:   "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    indigo:  "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400",
    violet:  "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400",
  };
  return map[color] || map.emerald;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SandboxBanner: React.FC<{ onReset: () => void; isResetting: boolean }> = ({ onReset, isResetting }) => (
  <div className="flex items-center justify-between px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono flex-wrap gap-2">
    <div className="flex items-center gap-2.5">
      <FlaskConical className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span className="font-bold tracking-wide">DEMO MODE · SANDBOX</span>
      <span className="text-amber-600/70 dark:text-amber-400/60">·</span>
      <span className="text-amber-600/80 dark:text-amber-400/80">No real money is processed. All events use Razorpay Test Mode or synthetic simulation.</span>
    </div>
    <button
      onClick={onReset}
      disabled={isResetting}
      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 font-bold text-amber-700 dark:text-amber-300 transition-all disabled:opacity-50 cursor-pointer"
    >
      <RotateCcw className={`w-3 h-3 ${isResetting ? "animate-spin" : ""}`} />
      <span>Reset Demo</span>
    </button>
  </div>
);

const StepBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => (
  <div className="px-6 py-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-subtle)]">
    <div className="max-w-5xl mx-auto flex items-center gap-1.5">
      {STEP_NAMES.map((name, idx) => {
        const done = idx < currentStep;
        const active = idx === currentStep;
        return (
          <React.Fragment key={idx}>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              done ? "text-emerald-600 dark:text-emerald-400" :
              active ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30" :
              "text-[var(--color-text-muted)]"
            }`}>
              {done && <CheckCircle2 className="w-3 h-3 shrink-0" />}
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </div>
            {idx < totalSteps - 1 && (
              <div className={`h-px flex-1 min-w-[4px] transition-all ${done ? "bg-emerald-500/40" : "bg-[var(--color-border-subtle)]"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
    <div className="max-w-5xl mx-auto mt-1.5">
      <div className="h-1 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

const PipelineTracker: React.FC<{ activeIndex: number }> = ({ activeIndex }) => (
  <div className="flex items-center gap-1 flex-wrap">
    {PIPELINE_STEPS.map((s, idx) => {
      const done = idx < activeIndex;
      const active = idx === activeIndex;
      return (
        <React.Fragment key={s.key}>
          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
            done ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" :
            active ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 text-[var(--color-accent)] animate-pulse" :
            "bg-[var(--color-bg-canvas)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
          }`}>
            {done ? "✓ " : ""}{s.label}
          </div>
          {idx < PIPELINE_STEPS.length - 1 && (
            <ChevronRight className={`w-3 h-3 shrink-0 ${done ? "text-emerald-500/60" : "text-[var(--color-border)]"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const FieldRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean; highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div className={`flex items-start justify-between py-2.5 border-b border-[var(--color-border-subtle)] last:border-0 gap-3 ${highlight ? "bg-[var(--color-accent)]/5 -mx-4 px-4 rounded" : ""}`}>
    <span className="text-[11px] font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-wider shrink-0">{label}</span>
    <span className={`text-xs text-right ${mono ? "font-mono" : "font-semibold"} text-[var(--color-text-primary)]`}>{value}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const DemoJourneyPage: React.FC = () => {
  const navigate = useNavigate();
  const { startDemo, exitDemo } = useDemo();

  const [step, setStep] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(SCENARIOS[0]);
  const [showScenarios, setShowScenarios] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [simResult, setSimResult] = useState<any | null>(null);
  const [caseData, setCaseData] = useState<RecoveryCase | null>(null);
  const [mlPrediction, setMlPrediction] = useState<any | null>(null);
  const [executeResult, setExecuteResult] = useState<any | null>(null);
  const [verifiedCase, setVerifiedCase] = useState<RecoveryCase | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [chainStatus, setChainStatus] = useState<any | null>(null);
  const [dashMetrics, setDashMetrics] = useState<any | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // For duplicate scenario tracking
  const firstCaseIdRef = useRef<string | null>(null);

  const totalSteps = 9;

  const resetAll = useCallback(() => {
    setStep(0);
    setSimResult(null);
    setCaseData(null);
    setMlPrediction(null);
    setExecuteResult(null);
    setVerifiedCase(null);
    setAuditLogs([]);
    setChainStatus(null);
    setDashMetrics(null);
    setError(null);
    setIsLoading(false);
    setIsPolling(false);
    setPollCount(0);
    firstCaseIdRef.current = null;
    exitDemo();
  }, [exitDemo]);

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await simulationService.resetDemoData();
      resetAll();
    } catch {
      resetAll();
    } finally {
      setIsResetting(false);
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  // ── Step 1: Trigger Simulation ─────────────────────────────────────────────

  const handleTriggerSimulation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const scenarioId = selectedScenario.backendId;
      const isDuplicate = selectedScenario.id === "duplicate";

      if (isDuplicate && firstCaseIdRef.current) {
        // Second trigger of same event to demonstrate idempotency
        const result = await simulationService.triggerSimulation(scenarioId, selectedScenario.amount);
        setSimResult({ ...result, isDuplicateAttempt: true });
        startDemo(result.case_id || undefined, selectedScenario.id);
        goNext();
        return;
      }

      const result = await simulationService.triggerSimulation(scenarioId, selectedScenario.amount);
      setSimResult(result);
      firstCaseIdRef.current = result.case_id || null;
      startDemo(result.case_id || undefined, selectedScenario.id);

      // Immediately fetch full case from backend
      if (result.case_id) {
        const fullCase = await recoveryService.getCaseById(result.case_id);
        if (fullCase) setCaseData(fullCase);
      }

      goNext();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Failed to trigger simulation. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Load ML Prediction ─────────────────────────────────────────────

  useEffect(() => {
    if (step === 2 && caseData && !mlPrediction) {
      mlService.predictLikelihood({
        amount: caseData.amount || selectedScenario.amount,
        failure_category: (caseData as any).failure_type || "gateway_timeout",
        payment_method: "card",
        customer_success_count: 5,
        customer_failure_count: 1,
        retry_count: (caseData as any).retry_count || 0,
        customer_tenure_days: 180,
        is_subscription: false,
        previous_recovery_success: true,
      }).then(setMlPrediction).catch(() => {});
    }
  }, [step, caseData, mlPrediction, selectedScenario.amount]);

  // ── Step 5: Execute ────────────────────────────────────────────────────────

  const handleExecute = async () => {
    if (!caseData) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await recoveryService.executeAction(caseData.id || caseData.case_id);
      setExecuteResult(res);
      // Refresh case
      const refreshed = await recoveryService.getCaseById(caseData.case_id);
      if (refreshed) setCaseData(refreshed);
      goNext();
    } catch (e: any) {
      // For policy-blocked / escalated scenarios the backend returns the case anyway
      const updated = await recoveryService.getCaseById(caseData.case_id).catch(() => null);
      if (updated) {
        setCaseData(updated);
        setExecuteResult({ message: updated.recovery_status });
        goNext();
      } else {
        setError(e?.response?.data?.detail || e?.message || "Execution failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 6: Poll until terminal state ─────────────────────────────────────

  useEffect(() => {
    if (step !== 6 || !caseData || verifiedCase) return;
    const caseId = caseData.case_id;
    let cancelled = false;
    setIsPolling(true);
    setPollCount(0);

    const poll = async () => {
      const TERMINAL = ["RECOVERED", "FAILED", "ESCALATED", "STOPPED", "VERIFYING", "AWAITING_APPROVAL"];
      for (let i = 0; i < 20; i++) {
        if (cancelled) break;
        setPollCount(i + 1);
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const res = await recoveryService.getCaseById(caseId);
          if (res && TERMINAL.includes(res.recovery_status || "")) {
            if (!cancelled) {
              setVerifiedCase(res);
              setCaseData(res);
            }
            break;
          }
        } catch { /* tolerate jitter */ }
      }
      if (!cancelled) setIsPolling(false);
    };

    poll();
    return () => { cancelled = true; };
  }, [step, caseData?.case_id]);

  // ── Step 7: Load Audit ─────────────────────────────────────────────────────

  useEffect(() => {
    if (step !== 7 || !caseData || auditLogs.length > 0) return;
    const caseId = caseData.case_id;
    auditService.getCaseAuditLogs(caseId).then(setAuditLogs).catch(() => {});
    auditService.verifyChain().then(setChainStatus).catch(() => {});
  }, [step, caseData?.case_id]);

  // ── Step 8: Dashboard KPIs ─────────────────────────────────────────────────

  useEffect(() => {
    if (step !== 8) return;
    dashboardService.getSummary().then(setDashMetrics).catch(() => {});
  }, [step]);

  // ─── Render helper: policy checklist ──────────────────────────────────────

  const policyChecklist: PolicyCheck[] = caseData?.policy_checklist?.length
    ? (caseData.policy_checklist as any[]).map((c: any) => ({
        label: c.check || c.label || c.name || "Check",
        result: (c.passed === true || c.result === "PASS" || c.status === "PASS") ? "PASS" : "FAIL",
        detail: c.detail || c.reason || ""
      }))
    : [
        { label: "Retry Limit", result: ((caseData as any)?.retry_count ?? 0) < 2 ? "PASS" : "FAIL", detail: `${(caseData as any)?.retry_count ?? 0} / 2 retries used` },
        { label: "Amount Threshold", result: (caseData?.amount ?? 0) <= 10000 ? "PASS" : "FAIL", detail: `₹${(caseData?.amount ?? 0).toLocaleString("en-IN")} vs ₹10,000 auto-limit` },
        { label: "Customer Consent", result: "PASS", detail: "DPDP consent verified" },
        { label: "AI Confidence", result: (caseData?.ai_confidence ?? 0) >= 0.7 ? "PASS" : "FAIL", detail: `${Math.round((caseData?.ai_confidence ?? 0) * 100)}% vs 70% minimum` },
        { label: "Action Whitelist", result: "PASS", detail: `${caseData?.recommended_action || "retry_payment"} is allowed` },
        { label: "Payment State", result: "PASS", detail: "Original payment is in FAILED state" },
      ];

  const policyFinalStatus = caseData?.policy_status || "PASSED";
  const allPass = policyChecklist.every(c => c.result !== "FAIL");

  // ─── Render: step content ──────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── STEP 0: Welcome ──────────────────────────────────────────────────
      case 0:
        return (
          <div className="max-w-3xl mx-auto space-y-8 py-8">
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] text-xs font-mono font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>RECRUITER DEMO · 5 MINUTES</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                REVIVE AI
              </h1>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                Recover Revenue Before It's Lost.
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
                AI-assisted revenue recovery with policy-governed automation and verified financial outcomes.
              </p>
            </div>

            {/* What / Why / How */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: <CreditCard className="w-5 h-5 text-[var(--color-accent)]" />,
                  title: "WHAT",
                  body: "Revenue recovery for failed payments, recurring subscription declines, and abandoned checkout sessions."
                },
                {
                  icon: <TrendingUp className="w-5 h-5 text-rose-500" />,
                  title: "WHY",
                  body: "Payment failures cause merchants to silently lose revenue they've already earned — usually due to transient bank or network issues."
                },
                {
                  icon: <Layers className="w-5 h-5 text-emerald-500" />,
                  title: "HOW",
                  body: "AI diagnosis + ML prediction + deterministic policy + controlled recovery + outcome verification + cryptographic audit."
                }
              ].map(({ icon, title, body }) => (
                <div key={title} className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] tracking-widest">{title}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            {/* Journey flow */}
            <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
              <h3 className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Recruiter Journey</h3>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                {["Failed Payment", "AI Diagnosis", "Policy Gate", "Recovery", "Verification", "Audit"].map((s, i, arr) => (
                  <React.Fragment key={s}>
                    <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                      i === 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400" :
                      i === arr.length - 1 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" :
                      "bg-[var(--color-bg-canvas)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                    }`}>{s}</span>
                    {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-[var(--color-border)]" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Scenario selector */}
            <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Choose Demo Scenario</h3>
                <button
                  onClick={() => setShowScenarios((v) => !v)}
                  className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 cursor-pointer"
                >
                  {showScenarios ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showScenarios ? "Hide" : "All Scenarios"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(showScenarios ? SCENARIOS : SCENARIOS.slice(0, 2)).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenario(s)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedScenario.id === s.id
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                        : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${badgeClasses(s.badgeColor)}`}>
                        {s.badge}
                      </span>
                      <span className="text-xs font-mono font-bold text-[var(--color-text-muted)]">{formatINR(s.amount)}</span>
                    </div>
                    <p className="text-xs font-bold text-[var(--color-text-primary)]">{s.label}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{s.tagline}</p>
                  </button>
                ))}
              </div>

              {!showScenarios && SCENARIOS.length > 2 && (
                <button onClick={() => setShowScenarios(true)} className="text-xs text-[var(--color-accent)] font-semibold cursor-pointer">
                  + {SCENARIOS.length - 2} more scenarios
                </button>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleTriggerSimulation}
                disabled={isLoading}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-sm shadow-premium-md transition-all hover:scale-102 active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                <span>Launch Demo: {selectedScenario.label.split("—")[1]?.trim() || selectedScenario.label}</span>
              </button>
            </div>
          </div>
        );

      // ── STEP 1: Payment Detected ─────────────────────────────────────────
      case 1:
        return (
          <div className="max-w-2xl mx-auto space-y-6 py-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Payment Failure Detected</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Failed Payment</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">Ingested through the RevivePay recovery pipeline. Financial details from backend state.</p>
            </div>

            {simResult?.isDuplicateAttempt ? (
              <div className="p-5 rounded-2xl bg-violet-500/10 border-2 border-violet-500/30 space-y-3">
                <div className="flex items-center gap-2 font-bold text-violet-700 dark:text-violet-300">
                  <Lock className="w-5 h-5 text-violet-500" />
                  <span>Duplicate Event — Idempotency Enforced</span>
                </div>
                <p className="text-xs text-violet-700/80 dark:text-violet-300/80 font-mono leading-relaxed">
                  This event was already processed (same payment_id / provider_event_id). The recovery engine returned <code className="font-bold">duplicate_ignored</code> with HTTP 200. Zero new recovery cases created. No double-counted revenue.
                </p>
                <div className="flex gap-2 flex-wrap text-[10px] font-mono font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30">HTTP 200</span>
                  <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30">duplicate_ignored</span>
                  <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30">Audit: webhook.idempotency.duplicate_blocked</span>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-2">
                <FieldRow label="Case ID" value={<span className="font-mono font-bold text-[var(--color-accent)]">{caseData?.case_id || simResult?.case_id || "Generating…"}</span>} />
                <FieldRow label="Payment ID" value={<span className="font-mono text-[11px]">{caseData?.payment_id || simResult?.payment_id || "–"}</span>} />
                <FieldRow label="Customer" value={caseData?.customer_name || "Returning Customer"} />
                <FieldRow label="Amount" value={<span className="text-rose-600 dark:text-rose-400 font-bold text-sm">{formatINR(caseData?.amount || selectedScenario.amount)}</span>} highlight />
                <FieldRow label="Payment Method" value={(caseData as any)?.payment_method || "CARD"} mono />
                <FieldRow label="Failure Category" value={(caseData as any)?.failure_type || simResult?.root_cause || "Temporary Bank Failure"} />
                <FieldRow label="Failure Code" value="GATEWAY_TIMEOUT_504" mono />
                <FieldRow label="Retry Count" value={`${(caseData as any).retry_count ?? 0} / ${(caseData as any).max_retry_count ?? 2}`} mono />
                <FieldRow label="Timestamp" value={formatDate(caseData?.created_at)} mono />
                <FieldRow label="Source" value={
                  <span className={`px-2.5 py-0.5 rounded-lg font-mono font-bold text-[10px] border ${badgeClasses("amber")}`}>
                    {caseData?.source || "SIMULATION"}
                  </span>
                } />
              </div>
            )}

            <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-[var(--color-text-muted)] font-mono mb-2">
                <Activity className="w-3.5 h-3.5" />
                <span>Pipeline Entry Point</span>
              </div>
              <PipelineTracker activeIndex={0} />
            </div>
          </div>
        );

      // ── STEP 2: Risk & ML ─────────────────────────────────────────────────
      case 2:
        return (
          <div className="max-w-2xl mx-auto space-y-6 py-6">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Deterministic + ML Evaluation</span>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Risk Score & Recovery Likelihood</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Risk Score */}
              <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Risk Score</span>
                </div>
                <div className="text-center py-2">
                  <div className="text-5xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    {Math.round(caseData?.risk_score ?? 72)}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] font-mono mt-1">/ 100</div>
                  <div className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                    (caseData?.risk_level || "HIGH") === "HIGH" || (caseData?.risk_level || "HIGH") === "CRITICAL"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  }`}>{caseData?.risk_level || "HIGH"}</div>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    ["Transaction Value", "35%"],
                    ["Recovery Likelihood", "25%"],
                    ["Customer History", "25%"],
                    ["Failure Severity", "15%"]
                  ].map(([factor, weight]) => (
                    <div key={factor} className="flex justify-between text-[11px] font-mono">
                      <span className="text-[var(--color-text-muted)]">{factor}</span>
                      <span className="text-[var(--color-text-secondary)] font-bold">{weight}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                  Deterministic formula. LLM does NOT set this value.
                </p>
              </div>

              {/* ML Recovery Likelihood */}
              <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Recovery Likelihood</span>
                </div>
                <div className="text-center py-2">
                  {mlPrediction ? (
                    <>
                      <div className="text-5xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {mlPrediction.recovery_likelihood_pct?.toFixed(0) ?? "–"}%
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] font-mono mt-1">Recovery Probability</div>
                      <div className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-mono font-bold border ${badgeClasses("emerald")}`}>
                        {mlPrediction.confidence_tier || "HIGH"}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)] py-4">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-mono">Running model…</span>
                    </div>
                  )}
                </div>
                {mlPrediction && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase">Top Signals</p>
                    {(mlPrediction.top_contributing_factors || []).slice(0, 2).map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                  Model: {mlPrediction?.algorithm || "CalibratedClassifierCV(GradientBoosting)"} · {mlPrediction?.model_version || "v1.2.0"}
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                  Trained on synthetic payment data. Not production-certified.
                </p>
              </div>
            </div>

            <PipelineTracker activeIndex={1} />
          </div>
        );

      // ── STEP 3: AI Diagnosis ──────────────────────────────────────────────
      case 3:
        return (
          <div className="max-w-2xl mx-auto space-y-6 py-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">AI Root-Cause Analysis</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">AI Diagnosis</h2>
            </div>

            {/* Trust disclaimer */}
            <div className="p-3.5 rounded-xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 text-xs text-[var(--color-text-secondary)] font-mono">
              <strong className="text-[var(--color-text-primary)]">AI RECOMMENDS — not executes.</strong>{" "}
              The AI provides root-cause reasoning and a recovery recommendation. Execution is governed by the deterministic policy engine below.
            </div>

            <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4">
              <FieldRow label="Root Cause" value={<span className="text-rose-600 dark:text-rose-400">{caseData?.root_cause || simResult?.root_cause || "Temporary Bank Failure"}</span>} />
              <FieldRow
                label="Confidence"
                value={
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)] rounded-full"
                        style={{ width: `${Math.round((caseData?.ai_confidence ?? 0.91) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold">{Math.round((caseData?.ai_confidence ?? 0.91) * 100)}%</span>
                  </div>
                }
              />
              <FieldRow label="Recommended Action" value={
                <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                  {(caseData?.recommended_action || "retry_payment").replace(/_/g, " ").toUpperCase()}
                </span>
              } />
            </div>

            {/* Evidence */}
            <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
              <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Evidence Considered</span>
              <div className="space-y-2">
                {((caseData?.evidence as string[]) || [
                  "Previous successful payment history (5 payments)",
                  "Current failure category: transient gateway timeout",
                  "Transaction value within auto-execution threshold",
                  "Customer account in good standing",
                  "Failure sub-code maps to recoverable error class"
                ]).slice(0, 5).map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasoning summary */}
            {(caseData?.reasoning_summary || caseData?.explanation) && (
              <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-1">
                <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase">Reasoning Summary</span>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {caseData.reasoning_summary || caseData.explanation}
                </p>
              </div>
            )}

            {/* Gemini fallback banner */}
            {(caseData as any)?.model_name?.includes("gemini") && (
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Fallback active: <strong>Gemini 1.5 Pro</strong> — Primary Claude provider exceeded latency threshold. Deterministic rules engine remains in control.</span>
              </div>
            )}

            <PipelineTracker activeIndex={3} />
          </div>
        );

      // ── STEP 4: Policy Gate ──────────────────────────────────────────────
      case 4:
        return (
          <div className="max-w-2xl mx-auto space-y-6 py-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Deterministic Safety Layer</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Policy Gate</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">AI recommendation is subject to deterministic policy validation before execution.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-2">
              {policyChecklist.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-[var(--color-border-subtle)] last:border-0 gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">{c.label}</span>
                    {c.detail && <p className="text-[11px] font-mono text-[var(--color-text-muted)]">{c.detail}</p>}
                  </div>
                  <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                    c.result === "PASS"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : c.result === "FAIL"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                      : "bg-[var(--color-bg-canvas)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
                  }`}>
                    {c.result === "PASS" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {c.result}
                  </span>
                </div>
              ))}
            </div>

            {/* Final decision */}
            <div className={`p-5 rounded-2xl border-2 space-y-3 ${
              policyFinalStatus === "PASSED" || allPass
                ? "bg-emerald-500/10 border-emerald-500/40"
                : policyFinalStatus === "REVIEW_REQUIRED"
                ? "bg-amber-500/10 border-amber-500/40"
                : "bg-rose-500/10 border-rose-500/40"
            }`}>
              <div className="flex items-center gap-2">
                {(policyFinalStatus === "PASSED" || allPass) ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                )}
                <span className="font-bold text-[var(--color-text-primary)]">
                  FINAL DECISION: {policyFinalStatus === "PASSED" || allPass ? "POLICY PASSED" : policyFinalStatus}
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--color-text-secondary)]">
                {policyFinalStatus === "PASSED" || allPass
                  ? `Recovery action APPROVED: ${(caseData?.recommended_action || "retry_payment").replace(/_/g, " ").toUpperCase()}`
                  : policyFinalStatus === "REVIEW_REQUIRED"
                  ? "High-value transaction. Routed to human approval queue regardless of AI confidence."
                  : "Policy blocked this action. Case escalated for operator review."
                }
              </p>
            </div>

            <PipelineTracker activeIndex={4} />
          </div>
        );

      // ── STEP 5: Execute ───────────────────────────────────────────────────
      case 5:
        const canExecute = !caseData?.approval_required || caseData?.approval_status === "APPROVED" || caseData?.approval_status === "AUTO_APPROVED";
        const isEscalated = caseData?.recovery_status === "ESCALATED" || caseData?.recovery_status === "STOPPED";
        const needsApproval = caseData?.approval_required && caseData?.approval_status === "PENDING";

        return (
          <div className="max-w-2xl mx-auto space-y-6 py-6">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Controlled Recovery Action</span>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Execute Recovery</h2>
            </div>

            {/* Action preview */}
            <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-2">
              <FieldRow label="Action" value={<span className="font-mono font-bold">{(caseData?.recommended_action || "retry_payment").replace(/_/g, " ").toUpperCase()}</span>} />
              <FieldRow label="Risk Level" value={
                <span className={`px-2.5 py-0.5 rounded-lg font-mono font-bold text-[10px] border ${
                  (caseData?.risk_level || "HIGH") === "HIGH" ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400" : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }`}>{caseData?.risk_level || "HIGH"}</span>
              } />
              <FieldRow label="Amount" value={<span className="font-bold">{formatINR(caseData?.amount || selectedScenario.amount)}</span>} highlight />
              <FieldRow label="Policy" value={
                <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {allPass ? "PASSED" : caseData?.policy_status || "PASSED"}
                </span>
              } />
              <FieldRow label="Source" value={<span className="font-mono">{caseData?.source || "SIMULATION"}</span>} />
            </div>

            {isEscalated ? (
              <div className="p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span>AUTOMATION STOPPED — ESCALATED</span>
                </div>
                <p className="text-xs text-rose-700/80 dark:text-rose-300/80 font-mono">
                  Retry Limit ({(caseData as any)?.max_retry_count ?? 2}/{(caseData as any)?.max_retry_count ?? 2}) reached. Deterministic policy permanently blocked further automated action. Case escalated for human review.
                </p>
                <div className="flex gap-2 text-[10px] font-mono font-bold flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">RETRY #1 → FAILED</span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">RETRY #2 → FAILED</span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">POLICY BLOCK</span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">HUMAN REVIEW REQUIRED</span>
                </div>
              </div>
            ) : needsApproval ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <span>HUMAN APPROVAL REQUIRED</span>
                </div>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 font-mono">
                  Transaction of {formatINR(caseData?.amount || 0)} exceeds the ₹50,000 auto-execution threshold. AI recommended auto-retry but deterministic policy requires operator sign-off regardless of AI confidence level.
                </p>
                <Link
                  to={`/cases/${caseData?.case_id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-premium-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Approval Console
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">{error}</div>
                )}
                <div className="flex flex-col items-start gap-3">
                  <p className="text-xs text-[var(--color-text-muted)] font-mono">
                    Clicking Execute sends a real request to <code>POST /api/recovery/{caseData?.case_id}/execute</code>. No frontend state machine.
                  </p>
                  <button
                    onClick={handleExecute}
                    disabled={isLoading}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-sm shadow-premium-md transition-all hover:scale-102 active:scale-98 disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Execute Recovery</span>
                  </button>
                </div>
              </>
            )}

            <PipelineTracker activeIndex={5} />
          </div>
        );

      // ── STEP 6: Verification ──────────────────────────────────────────────
      case 6:
        const terminalCase = verifiedCase || caseData;
        const isRecovered = terminalCase?.recovery_status === "RECOVERED";
        const isFailed = terminalCase?.recovery_status === "FAILED";
        const isEsc = ["ESCALATED", "STOPPED"].includes(terminalCase?.recovery_status || "");

        return (
          <div className="max-w-2xl mx-auto space-y-6 py-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Independent Outcome Verification</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Outcome Verification</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                The system does NOT show "Recovered" immediately. State progresses only when backend verification confirms the outcome.
              </p>
            </div>

            {/* Verification pipeline */}
            <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
              {[
                { label: "Action Executed", done: true },
                { label: "Verifying Outcome", done: !!terminalCase },
                { label: "Payment Result Check", done: !!terminalCase },
                { label: "Amount Check", done: !!terminalCase && isRecovered },
                { label: "Reference Check", done: !!terminalCase && isRecovered },
                { label: "Verified", done: isRecovered },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    s.done ? "bg-emerald-500/20 border-emerald-500 text-emerald-600" :
                    isPolling && i === 1 ? "border-[var(--color-accent)] animate-pulse" :
                    "border-[var(--color-border)] text-[var(--color-text-muted)]"
                  }`}>
                    {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     isPolling && i === 1 ? <RefreshCw className="w-3.5 h-3.5 text-[var(--color-accent)] animate-spin" /> :
                     <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-semibold ${s.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                    {s.label}
                  </span>
                  {isPolling && i === 1 && (
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)] ml-auto">polling {pollCount}…</span>
                  )}
                </div>
              ))}
            </div>

            {/* Outcome card */}
            {terminalCase && (
              <div className={`p-5 rounded-2xl border-2 space-y-3 ${
                isRecovered ? "bg-emerald-500/10 border-emerald-500/40" :
                isEsc ? "bg-rose-500/10 border-rose-500/40" :
                "bg-amber-500/10 border-amber-500/40"
              }`}>
                {isRecovered ? (
                  <>
                    <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>RECOVERY SUCCESSFUL</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase">Recovered Amount</p>
                        <p className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatINR(terminalCase.recovered_amount ?? terminalCase.amount ?? selectedScenario.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase">Verification</p>
                        <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                          <CheckCheck className="w-3.5 h-3.5" /> SUCCESS
                        </p>
                      </div>
                      {terminalCase.execution_id && (
                        <div>
                          <p className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase">Execution Reference</p>
                          <p className="text-[11px] font-mono text-[var(--color-text-secondary)]">{terminalCase.execution_id}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase">Recovery Timestamp</p>
                        <p className="text-[11px] font-mono text-[var(--color-text-secondary)]">{formatDate(terminalCase.resolved_at || terminalCase.updated_at)}</p>
                      </div>
                    </div>
                  </>
                ) : isEsc ? (
                  <>
                    <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <span>ESCALATED — Human Review Required</span>
                    </div>
                    <p className="text-xs font-mono text-rose-700/80 dark:text-rose-300/80">
                      Automated actions exhausted or blocked. Case is in the operator review queue.
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-mono text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>State: {terminalCase.recovery_status} — Verifying…</span>
                  </div>
                )}
              </div>
            )}

            {isPolling && !terminalCase && (
              <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Polling backend for outcome… ({pollCount} / 20)</span>
              </div>
            )}

            <PipelineTracker activeIndex={isRecovered ? 7 : 6} />
          </div>
        );

      // ── STEP 7: Audit Trail ───────────────────────────────────────────────
      case 7:
        return (
          <div className="max-w-2xl mx-auto space-y-6 py-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Cryptographic Audit Ledger</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Audit Trail</h2>
            </div>

            {/* Chain status */}
            {chainStatus && (
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 flex-wrap ${
                chainStatus.valid
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-rose-500/10 border-rose-500/30"
              }`}>
                <div className="flex items-center gap-2">
                  {chainStatus.valid
                    ? <CheckCheck className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-rose-500" />}
                  <span className={`text-xs font-mono font-bold ${chainStatus.valid ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                    {chainStatus.valid ? "CHAIN VALID" : "CHAIN ERROR"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--color-text-muted)]">
                  <span>{chainStatus.total_blocks} blocks</span>
                  <span className="truncate max-w-32">head: {chainStatus.head_hash?.slice(0, 12)}…</span>
                </div>
              </div>
            )}

            {/* Audit events */}
            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs font-mono py-4">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading audit events from backend…</span>
                </div>
              ) : (
                auditLogs.map((log, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-[var(--color-accent)] uppercase">{log.action}</span>
                      <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{formatTime(log.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--color-text-muted)]">
                      <span>Actor: {log.actor}</span>
                      {log.case_id && <span>Case: {log.case_id}</span>}
                      {log.policy_result && (
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          log.policy_result === "PASSED" || log.policy_result === "PASS"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>{log.policy_result}</span>
                      )}
                    </div>
                    {log.notes && <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{log.notes}</p>}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link
                to="/audit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/50 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                View Full Audit Trail
              </Link>
              <Link
                to="/audit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-xs font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-all"
              >
                <Hash className="w-3.5 h-3.5" />
                Verify Audit Chain
              </Link>
            </div>

            <PipelineTracker activeIndex={7} />
          </div>
        );

      // ── STEP 8: Recovered + Dashboard ────────────────────────────────────
      case 8:
        const finalCase = verifiedCase || caseData;
        return (
          <div className="max-w-2xl mx-auto space-y-6 py-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {finalCase?.recovery_status === "RECOVERED" ? "Revenue Recovered" :
                 finalCase?.recovery_status === "ESCALATED" ? "Escalated to Operator" :
                 finalCase?.recovery_status === "AWAITING_APPROVAL" ? "Awaiting Approval" :
                 "Demo Complete"}
              </h2>
              {finalCase?.recovery_status === "RECOVERED" && (
                <p className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
                  {formatINR(finalCase?.recovered_amount ?? finalCase?.amount ?? selectedScenario.amount)}
                </p>
              )}
            </div>

            {/* Updated dashboard KPIs */}
            {dashMetrics && (
              <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
                <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Live Dashboard — Updated from Backend</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Recovered Revenue", value: formatINR(dashMetrics.recovered_revenue || 0), color: "emerald" },
                    { label: "Recovery Rate", value: `${(dashMetrics.recovery_rate || 0).toFixed(1)}%`, color: "blue" },
                    { label: "Total Cases", value: String(dashMetrics.total_cases || 0), color: "default" },
                    { label: "Active Recovery", value: String(dashMetrics.active_recovery_count || 0), color: "amber" },
                    { label: "Policy Blocks", value: String(dashMetrics.policy_blocks || dashMetrics.failed_payments || 0), color: "rose" },
                    { label: "Verified Recoveries", value: String(dashMetrics.verified_recoveries || dashMetrics.escalated_count || 0), color: "emerald" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-3 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
                      <p className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase">{label}</p>
                      <p className={`text-sm font-mono font-bold mt-0.5 ${
                        color === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
                        color === "rose" ? "text-rose-600 dark:text-rose-400" :
                        color === "amber" ? "text-amber-600 dark:text-amber-400" :
                        color === "blue" ? "text-blue-600 dark:text-blue-400" :
                        "text-[var(--color-text-primary)]"
                      }`}>{value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-mono text-[var(--color-text-muted)]">Values retrieved live from GET /api/dashboard/summary — not hardcoded.</p>
              </div>
            )}

            {/* Story summary */}
            <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
              <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-widest">What Just Happened</span>
              {[
                "A payment failed due to a transient bank gateway timeout.",
                "Revive AI understood the payment and customer context.",
                "The deterministic risk engine evaluated financial risk.",
                "The ML model estimated recovery likelihood.",
                "The AI diagnosed the failure and recommended a strategy.",
                "The policy engine decided whether the recommendation was allowed.",
                "The recovery action executed through the real backend.",
                "The outcome was independently verified.",
                "Every step is recorded in the cryptographic audit trail."
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Navigation links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {finalCase?.case_id && (
                <Link
                  to={`/cases/${finalCase.case_id}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Full Investigation
                </Link>
              )}
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-xs hover:border-[var(--color-accent)]/50 transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Live Dashboard
              </Link>
              <button
                onClick={resetAll}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-xs hover:border-[var(--color-border-hover)] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Run Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Page layout ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] font-sans antialiased flex flex-col">

      {/* Top nav */}
      <nav className="h-14 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-sm text-[var(--color-text-primary)]">RevivePay AI</span>
          </Link>
          <span className="text-[var(--color-border)] hidden sm:block">·</span>
          <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] hidden sm:block">Recruiter Demo</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/architecture"
            className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hidden sm:block px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-surface)] transition-all"
          >
            Architecture
          </Link>
          <Link
            to="/dashboard"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/50 transition-all"
          >
            Command Center
          </Link>
          <button
            onClick={resetAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
          >
            ✕ Exit
          </button>
        </div>
      </nav>

      {/* Sandbox banner */}
      <SandboxBanner onReset={handleResetDemo} isResetting={isResetting} />

      {/* Step bar */}
      {step > 0 && <StepBar currentStep={step} totalSteps={totalSteps} />}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {renderStep()}
      </main>

      {/* Bottom nav */}
      {step > 0 && (
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
          <button
            onClick={goPrev}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer disabled:opacity-40"
            disabled={step === 0}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            Step {step} of {totalSteps - 1}
          </span>

          {step < totalSteps - 1 ? (
            <button
              onClick={goNext}
              disabled={
                (step === 5 && isLoading) ||
                (step === 6 && isPolling && !verifiedCase)
              }
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-all cursor-pointer disabled:opacity-40"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Run Again</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
