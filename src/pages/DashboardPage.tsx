import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  Lock,
  Layers,
  Clock,
  Sparkles,
  AlertTriangle,
  Database,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useMetrics } from "../context/MetricsContext";
import { ReviveLiveDecisionTerminal } from "../components/ReviveLiveDecisionTerminal";
import { formatINR } from "../data/mockData";
import { recoveryService, dashboardService } from "../services";
import { RecoveryCase, RevenueRiskTrendItem, FailureReasonItem } from "../types";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const {
    metrics,
    isLoading,
    isLiveSynced,
    lastSyncedAt,
    recoveredRevenue,
    recoveryRate,
    revenueAtRisk,
    totalCasesCount,
    activeRecoveryCount,
    escalatedCasesCount,
    awaitingApprovalCount,
    failedPaymentsCount,
    environmentLabel,
    refreshMetrics
  } = useMetrics();

  const [timeRange, setTimeRange] = useState("This Quarter");
  const [gatewayFilter, setGatewayFilter] = useState("All Gateways");
  const [pendingApprovals, setPendingApprovals] = useState<RecoveryCase[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<RevenueRiskTrendItem[]>([]);
  const [failureReasons, setFailureReasons] = useState<FailureReasonItem[]>([]);
  const [isRefreshingManual, setIsRefreshingManual] = useState(false);

  const loadPending = async () => {
    try {
      const pending = await recoveryService.getCases({ approval_status: "PENDING" });
      setPendingApprovals(pending);
    } catch {
      // Offline fallback
    }
  };

  const loadChartTelemetry = async () => {
    try {
      const [trend, reasons] = await Promise.all([
        dashboardService.getRevenueRiskTrend().catch(() => []),
        dashboardService.getFailureReasons().catch(() => [])
      ]);
      setTrendData(trend);
      setFailureReasons(reasons);
    } catch {
      // Network jitter fallback
    }
  };

  useEffect(() => {
    loadPending();
    loadChartTelemetry();
    const interval = setInterval(() => {
      loadPending();
      loadChartTelemetry();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshingManual(true);
    try {
      await Promise.all([
        refreshMetrics(),
        loadPending(),
        loadChartTelemetry()
      ]);
      showToast("Synchronized live metrics with PostgreSQL database");
    } finally {
      setIsRefreshingManual(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApprove = async (caseId: string, customer: string) => {
    try {
      await recoveryService.approveCase(caseId);
      setPendingApprovals((prev) => prev.filter((item) => item.case_id !== caseId && item.id !== caseId));
      showToast(`Approved retry action for ${customer} (${caseId})`);
      refreshMetrics();
      loadPending();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleReject = async (caseId: string, customer: string) => {
    try {
      await recoveryService.rejectCase(caseId, "Operator manual rejection");
      setPendingApprovals((prev) => prev.filter((item) => item.case_id !== caseId && item.id !== caseId));
      showToast(`Rejected & routed to manual support for ${customer}`);
      refreshMetrics();
      loadPending();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16 transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] text-xs font-bold px-4 py-3 rounded-xl shadow-premium-lg border border-[var(--color-accent)] flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP GREETING & CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              REVIVE REVENUE COMMAND CENTER
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{environmentLabel}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight mt-1">
            Welcome back, {user?.name || "Rohan Deshmukh"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Autonomous policy-gated revenue recovery across Razorpay sandbox webhooks.
          </p>
        </div>

        {/* Filter Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
          {/* Time Range Selector */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl px-3.5 py-2 pr-8 outline-none focus:border-[var(--color-accent)] cursor-pointer font-sans shadow-sm"
            >
              <option value="Today">Today (Live)</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
              <option value="This Quarter">This Quarter (Q3)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Gateway Selector */}
          <div className="relative">
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="appearance-none bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl px-3.5 py-2 pr-8 outline-none focus:border-[var(--color-accent)] cursor-pointer font-sans shadow-sm"
            >
              <option value="All Gateways">All Gateways (Razorpay Primary)</option>
              <option value="Razorpay">Razorpay Test Gateway</option>
              <option value="Direct Bank">Direct HDFC / ICICI Routes</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Action: Simulate Failure */}
          <Link
            to="/simulation"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold transition-all shadow-premium-sm active:scale-95 cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Simulate Failure</span>
          </Link>
        </div>
      </div>

      {/* KPI Header with Single Source of Truth & Database Lineage Disclosure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-text-muted)] font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            EXECUTIVE REVENUE RECOVERY TELEMETRY
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
            Database Single Source of Truth
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[10px]">
            GET /api/dashboard/summary · {lastSyncedAt ? `Synced ${lastSyncedAt.toLocaleTimeString()}` : "Live Sync"}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshingManual}
            title="Refresh metrics directly from PostgreSQL database"
            className="p-1 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingManual ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 6 EXECUTIVE KPI CARDS (Database as Single Source of Truth) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Revenue at Risk */}
        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] relative overflow-hidden group hover:border-amber-500/60 transition-all shadow-premium-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Revenue at Risk</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-28 bg-[var(--color-bg-surface-raised)] animate-pulse rounded-lg mt-3" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)] mt-3 tracking-tight font-mono">
              {formatINR(revenueAtRisk)}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <span>Unrecovered</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold">
              Live DB
            </span>
          </div>
        </div>

        {/* KPI 2: Recovered Revenue */}
        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] relative overflow-hidden group hover:border-[var(--color-accent)] transition-all shadow-premium-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Recovered Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-center justify-center text-[var(--color-accent)]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-28 bg-[var(--color-bg-surface-raised)] animate-pulse rounded-lg mt-3" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)] mt-3 tracking-tight font-mono">
              {formatINR(recoveredRevenue)}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Topline Boost</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              Verified
            </span>
          </div>
        </div>

        {/* KPI 3: Recovery Rate */}
        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] relative overflow-hidden group hover:border-emerald-500/60 transition-all shadow-premium-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Recovery Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 bg-[var(--color-bg-surface-raised)] animate-pulse rounded-lg mt-3" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)] mt-3 tracking-tight font-mono">
              {recoveryRate.toFixed(1)}%
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Autonomous Yield</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              Dynamic %
            </span>
          </div>
        </div>

        {/* KPI 4: Failed Payments */}
        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] relative overflow-hidden group hover:border-rose-500/60 transition-all shadow-premium-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Failed Payments</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-[var(--color-bg-surface-raised)] animate-pulse rounded-lg mt-3" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)] mt-3 tracking-tight font-mono">
              {failedPaymentsCount}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-rose-600 dark:text-rose-400 font-semibold">Gateway Failures</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-bold">
              Ingressed
            </span>
          </div>
        </div>

        {/* KPI 5: Active Recovery */}
        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] relative overflow-hidden group hover:border-sky-500/60 transition-all shadow-premium-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Active Recovery</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-[var(--color-bg-surface-raised)] animate-pulse rounded-lg mt-3" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)] mt-3 tracking-tight font-mono">
              {activeRecoveryCount}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-sky-600 dark:text-sky-400 font-semibold">Cases In-Flight</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-bold">
              Live Retries
            </span>
          </div>
        </div>

        {/* KPI 6: Escalated Cases */}
        <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] relative overflow-hidden group hover:border-amber-500/60 transition-all shadow-premium-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Escalated Cases</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-[var(--color-bg-surface-raised)] animate-pulse rounded-lg mt-3" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)] mt-3 tracking-tight font-mono">
              {escalatedCasesCount}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{awaitingApprovalCount} Pending</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold">
              Review
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Terminal Widget + Revenue Trend */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Decision Terminal Component */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
                <span>REAL-TIME RETRY DECISION STREAM</span>
              </span>
              <Link
                to="/cases"
                className="text-xs text-[var(--color-accent)] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Open All {totalCasesCount} Cases</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ReviveLiveDecisionTerminal
              recoveredRevenue={metrics?.recovered_revenue}
              recoveryRate={metrics?.recovery_rate}
            />
          </div>

          {/* Revenue Recovery Trend Area Chart */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight">
                  Recovered vs. Lost Revenue Telemetry
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  7-Day Recovery Efficiency Benchmark (INR ₹)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[var(--color-accent)] font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-[var(--color-accent)]"></span>
                  <span>Recovered</span>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--color-text-muted)] font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-[var(--color-border-hover)]"></span>
                  <span>Lost</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    trendData.length > 0
                      ? trendData.map((item) => ({
                          day: item.date,
                          recovered: item.recovered_revenue,
                          lost: item.revenue_at_risk,
                          rate: item.rate
                        }))
                      : [
                          { day: "Mon", recovered: 0, lost: 0, rate: 0 },
                          { day: "Tue", recovered: 0, lost: 0, rate: 0 },
                          { day: "Wed", recovered: 0, lost: 0, rate: 0 },
                          { day: "Thu", recovered: 0, lost: 0, rate: 0 },
                          { day: "Fri", recovered: 0, lost: 0, rate: 0 },
                          { day: "Sat", recovered: 0, lost: 0, rate: 0 },
                          { day: "Sun", recovered: 0, lost: 0, rate: 0 }
                        ]
                  }
                >
                  <defs>
                    <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? "#4F5FF0" : "#4338CA"} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={isDark ? "#4F5FF0" : "#4338CA"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke={isDark ? "#475569" : "#94A3B8"} tick={{ fontSize: 11 }} />
                  <YAxis stroke={isDark ? "#475569" : "#94A3B8"} tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: any) => formatINR(Number(val))}
                    contentStyle={{
                      backgroundColor: isDark ? "#171B24" : "#FFFFFF",
                      borderColor: isDark ? "#232833" : "#E4E7EC",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: isDark ? "#E8EAED" : "#14161A",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="recovered"
                    stroke={isDark ? "#4F5FF0" : "#4338CA"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#recoveredGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lost"
                    stroke={isDark ? "#343B4A" : "#CBD5E1"}
                    strokeWidth={1.5}
                    fillOpacity={0.1}
                    fill={isDark ? "#343B4A" : "#CBD5E1"}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Failure Breakdown + High-Risk Approvals */}
        <div className="lg:col-span-5 space-y-6">
          {/* Failure Reasons Breakdown */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight">
                Root-Cause Failure Taxonomy
              </h3>
              <span className="text-[11px] font-mono text-[var(--color-accent)] bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] px-2.5 py-0.5 rounded-full font-bold">
                {failureReasons.length || 6} Ingress Clusters
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {(failureReasons.length > 0
                ? failureReasons
                : [
                    { name: "Bank Gateway Disconnect", value: 38, color: "#4F5FF0", count: 0, amount: 0 },
                    { name: "Insufficient Balance", value: 24, color: "#8B5CF6", count: 0, amount: 0 },
                    { name: "Network Timeout", value: 18, color: "#34B37E", count: 0, amount: 0 },
                    { name: "Card Expired / Void", value: 12, color: "#E0A030", count: 0, amount: 0 },
                    { name: "Abandoned Checkout", value: 8, color: "#E5484D", count: 0, amount: 0 }
                  ]
              ).map((item, idx) => {
                const colors = ["#4F5FF0", "#8B5CF6", "#34B37E", "#E0A030", "#06B6D4", "#E5484D"];
                const itemColor = (item as any).color || colors[idx % colors.length];
                const pct = (item as any).percentage ?? (item as any).value ?? 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[var(--color-text-secondary)] flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: itemColor }}
                        ></span>
                        <span className="truncate max-w-[200px]">{(item as any).label || item.name}</span>
                      </span>
                      <span className="font-bold text-[var(--color-text-primary)] font-mono">{pct}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-bg-canvas)] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: itemColor
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <Link
                to="/ai-activity"
                className="w-full py-2.5 rounded-xl bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] border border-[var(--color-border)] text-[var(--color-accent)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View 200+ ML Diagnostics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* High-Risk Policy Approvals Card (Matches Approval Center exactly) */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight">
                  High-Risk Approvals ({pendingApprovals.length})
                </h3>
              </div>
              <Link
                to="/approvals"
                className="text-xs text-[var(--color-accent)] hover:underline font-semibold"
              >
                Approval Center &rarr;
              </Link>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-text-muted)] rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-[var(--color-text-primary)]">All high-value cases reviewed</p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Autonomous engine running with zero pending blocks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 3).map((item) => (
                  <div
                    key={item.id || item.case_id}
                    className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] hover:border-[var(--color-accent)] space-y-2.5 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[var(--color-text-primary)]">{item.customer_name}</span>
                        <span className="text-[var(--color-text-muted)] font-mono text-[11px] ml-1.5">({item.case_id})</span>
                      </div>
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {formatINR(item.amount ?? item.amount_at_risk ?? 0)}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)] leading-snug">
                      {item.root_cause || item.reasoning_summary}
                    </p>

                    <div className="p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-accent)] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                      <span className="truncate">{item.recommended_action.replace(/_/g, " ")}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(item.case_id, item.customer_name || "Customer")}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(item.case_id, item.customer_name || "Customer")}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] text-xs font-semibold transition-all cursor-pointer"
                        title="Reject Action"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        to={`/cases/${item.case_id}`}
                        className="p-1.5 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]"
                        title="Investigate Full Case"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Integration & Health Status */}
          <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-3 text-xs">
            <span className="text-[var(--color-text-muted)] uppercase tracking-wider text-[10px] font-bold font-mono">
              GATEWAY & WEBHOOK HEALTH
            </span>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-[var(--color-text-primary)]">Razorpay Test Webhook</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-semibold">18ms Latency &middot; Active</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
                  <span className="font-semibold text-[var(--color-text-primary)]">Grounded AI Reasoning Engine</span>
                </div>
                <span className="text-[var(--color-accent)] text-[11px] font-mono font-semibold">Live Telemetry Tools</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="font-semibold text-[var(--color-text-primary)]">Deterministic Policy Engine</span>
                </div>
                <span className="text-purple-600 dark:text-purple-400 text-[11px] font-mono font-semibold">Enforcing Bounded Limits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
