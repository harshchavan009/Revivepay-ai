import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  RotateCw,
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  Layers,
  Clock,
  ChevronDown,
  Activity,
  Zap,
  Download,
  Filter,
  Check,
  X,
  ExternalLink,
  Users,
  Building2,
  Lock,
  CircleDot
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { ReviveLiveDecisionTerminal } from "../components/ReviveLiveDecisionTerminal";
import { SHARED_CASES, SHARED_METRICS, formatINR } from "../data/mockData";

const RECOVERY_CHART_DATA = [
  { day: "Mon", recovered: 18400, lost: 4200, rate: 64 },
  { day: "Tue", recovered: 22100, lost: 5100, rate: 66 },
  { day: "Wed", recovered: 19800, lost: 4800, rate: 63 },
  { day: "Thu", recovered: 28400, lost: 6200, rate: 69 },
  { day: "Fri", recovered: 34200, lost: 7100, rate: 72 },
  { day: "Sat", recovered: 16500, lost: 3900, rate: 62 },
  { day: "Sun", recovered: 14200, lost: 3400, rate: 61 }
];

const FAILURE_REASON_DATA = [
  { name: "Insufficient Funds", value: 38, color: "#06B6D4" },
  { name: "Expired Card / Mandate", value: 24, color: "#8B5CF6" },
  { name: "Bank Switch Outage", value: 18, color: "#10B981" },
  { name: "3DS Auth Failure", value: 12, color: "#F59E0B" },
  { name: "Velocity Cap", value: 8, color: "#EF4444" }
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("This Quarter");
  const [gatewayFilter, setGatewayFilter] = useState("All Gateways");
  
  // Single Source of Truth for Pending Approvals
  const [approvals, setApprovals] = useState(() =>
    SHARED_CASES.filter((c) => c.approval_status === "PENDING")
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recoveredTotal, setRecoveredTotal] = useState(142605);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApprove = (id: string, customer: string) => {
    setApprovals((prev) => prev.filter((item) => item.case_id !== id && item.id !== id));
    showToast(`Approved retry action for ${customer} (${id})`);
    setRecoveredTotal((prev) => prev + 4999);
  };

  const handleReject = (id: string, customer: string) => {
    setApprovals((prev) => prev.filter((item) => item.case_id !== id && item.id !== id));
    showToast(`Rejected & routed to manual support for ${customer}`);
  };

  const activeCasesCount = SHARED_CASES.filter(
    (c) => c.recovery_status !== "RECOVERED" && c.recovery_status !== "STOPPED"
  ).length;

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#081F30] text-slate-100 text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-cyan-500/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP GREETING & CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#13354E] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              REVIVE REVENUE COMMAND CENTER
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>RAZORPAY TEST MODE ACTIVE</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Welcome back, {user?.name || "Rohan Deshmukh"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
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
              className="appearance-none bg-[#081B2A] border border-[#163E5C] text-slate-200 rounded-xl px-3 py-2 pr-8 outline-none focus:border-cyan-400 cursor-pointer font-sans"
            >
              <option value="Today">Today (Live)</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
              <option value="This Quarter">This Quarter (Q3)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Gateway Selector */}
          <div className="relative">
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="appearance-none bg-[#081B2A] border border-[#163E5C] text-slate-200 rounded-xl px-3 py-2 pr-8 outline-none focus:border-cyan-400 cursor-pointer font-sans"
            >
              <option value="All Gateways">All Gateways (Razorpay Primary)</option>
              <option value="Razorpay">Razorpay Test Gateway</option>
              <option value="Direct Bank">Direct HDFC / ICICI Routes</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Action: Simulate Failure */}
          <Link
            to="/simulation"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold transition-all shadow-md shadow-cyan-950/50 active:scale-95"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Simulate Failure Ingress</span>
          </Link>
        </div>
      </div>

      {/* TOP 4 EXECUTIVE KPI CARDS (Single Shared Source of Truth) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Recovered Revenue (Hero Metric) */}
        <div className="p-5 rounded-2xl bg-[#081826]/90 border border-cyan-500/40 relative overflow-hidden group hover:border-cyan-500 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Recovered Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            {formatINR(recoveredTotal)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-cyan-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4.8% topline boost</span>
            </span>
            <span className="text-slate-500 font-mono">INR ₹</span>
          </div>
        </div>

        {/* KPI 2: Autonomous Recovery Rate */}
        <div className="p-5 rounded-2xl bg-[#081826]/90 border border-[#163E5C] relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">AI Recovery Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            65.2%
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% vs. fixed</span>
            </span>
            <span className="text-slate-500 font-mono">{SHARED_CASES.length} cases tracked</span>
          </div>
        </div>

        {/* KPI 3: Involuntary Churn Prevented */}
        <div className="p-5 rounded-2xl bg-[#081826]/90 border border-[#163E5C] relative overflow-hidden group hover:border-purple-500/50 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Prevented MRR Churn</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            {formatINR(48200)}<span className="text-sm font-normal text-slate-400">/mo</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-purple-400 font-bold">142 subscribers saved</span>
            <span className="text-slate-500">zero manual intervention</span>
          </div>
        </div>

        {/* KPI 4: Active Recovery Cases (Matches Registry) */}
        <div className="p-5 rounded-2xl bg-[#081826]/90 border border-[#163E5C] relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cases In Registry</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            {SHARED_CASES.length} Total
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-cyan-400 font-bold">{activeCasesCount} in-flight</span>
            <span className="text-amber-400 font-bold">{approvals.length} pending review</span>
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
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>REAL-TIME RETRY DECISION STREAM</span>
              </span>
              <Link
                to="/cases"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Open All {SHARED_CASES.length} Cases</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ReviveLiveDecisionTerminal />
          </div>

          {/* Revenue Recovery Trend Area Chart */}
          <div className="p-6 rounded-2xl bg-[#081826]/90 border border-[#163E5C] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Recovered vs. Lost Revenue Telemetry
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  7-Day Recovery Efficiency Benchmark (INR ₹)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
                  <span>Recovered (₹)</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-slate-600"></span>
                  <span>Lost (₹)</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={RECOVERY_CHART_DATA}>
                  <defs>
                    <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: any) => formatINR(Number(val))}
                    contentStyle={{
                      backgroundColor: "#051420",
                      borderColor: "#163E5C",
                      borderRadius: "0.75rem",
                      fontSize: "12px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="recovered"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#recoveredGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lost"
                    stroke="#475569"
                    strokeWidth={1.5}
                    fillOpacity={0.1}
                    fill="#475569"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Failure Breakdown + High-Risk Approvals */}
        <div className="lg:col-span-5 space-y-6">
          {/* Failure Reasons Breakdown */}
          <div className="p-6 rounded-2xl bg-[#081826]/90 border border-[#163E5C] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">
                Root-Cause Failure Taxonomy
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-500/30 px-2 py-0.5 rounded">
                15+ Categories
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {FAILURE_REASON_DATA.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span>{item.name}</span>
                    </span>
                    <span className="font-bold text-slate-200">{item.value}%</span>
                  </div>
                  <div className="w-full bg-[#051420] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to="/ai-activity"
                className="w-full py-2.5 rounded-xl bg-[#0B2235] hover:bg-[#102F48] border border-[#174567] text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View 200+ ML Diagnostics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* High-Risk Policy Approvals Card (Matches Approval Center exactly) */}
          <div className="p-6 rounded-2xl bg-[#081826]/90 border border-[#163E5C] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  High-Risk Approvals ({approvals.length})
                </h3>
              </div>
              <Link
                to="/approvals"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
              >
                Approval Center &rarr;
              </Link>
            </div>

            {approvals.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-[#051420] border border-[#143B57]">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-200">All high-value cases reviewed</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Autonomous engine running with zero pending blocks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#061826] border border-[#153E5C] hover:border-[#1E547C] space-y-2.5 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{item.customer_name}</span>
                        <span className="text-slate-500 font-mono text-[11px] ml-1.5">({item.case_id})</span>
                      </div>
                      <span className="font-bold text-amber-400">{formatINR(item.amount)}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-snug">{item.root_cause || item.reasoning_summary}</p>

                    <div className="p-2 rounded bg-[#0A2234] border border-[#163E5C] text-[11px] text-cyan-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{item.recommended_action.replace(/_/g, " ")}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(item.case_id, item.customer_name || "Customer")}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(item.case_id, item.customer_name || "Customer")}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        to={`/cases/${item.case_id}`}
                        className="p-1.5 rounded-lg bg-[#0A2234] text-slate-300 hover:text-white"
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
          <div className="p-5 rounded-2xl bg-[#081826]/90 border border-[#163E5C] shadow-xl space-y-3 text-xs">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold font-mono">
              GATEWAY & WEBHOOK HEALTH
            </span>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#061826] border border-[#143B57]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-semibold text-slate-200">Razorpay Test Webhook</span>
                </div>
                <span className="text-emerald-400 text-[11px] font-mono">18ms Latency &middot; Active</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#061826] border border-[#143B57]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span className="font-semibold text-slate-200">Claude 3.5 Sonnet Engine</span>
                </div>
                <span className="text-cyan-400 text-[11px] font-mono">Connected via Server ENV</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#061826] border border-[#143B57]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span className="font-semibold text-slate-200">Deterministic Policy Engine</span>
                </div>
                <span className="text-purple-300 text-[11px] font-mono">Enforcing Bounded Limits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
