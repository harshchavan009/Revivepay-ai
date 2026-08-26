import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  Cpu,
  BarChart3,
  CheckCircle2,
  PlayCircle,
  TrendingUp,
  CreditCard,
  Building2,
  ChevronDown,
  Activity,
  Calculator,
  RefreshCw,
  Sliders,
  Clock,
  Check,
  Server,
  ArrowUpRight,
  CircleDot
} from "lucide-react";
import { ReviveHeroPreview } from "../components/ReviveHeroPreview";
import { AskMeAnythingDrawer } from "../components/AskMeAnythingDrawer";
import { formatINR } from "../data/mockData";

export const LandingPage: React.FC = () => {
  // ROI Calculator state in INR (₹)
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(2500000); // ₹25 Lakhs
  const [failRate, setFailRate] = useState<number>(7.5);
  const recoveryRateEst = 0.652; // 65.2% benchmark

  const failedRevenue = (monthlyRevenue * failRate) / 100;
  const recoveredMonthly = failedRevenue * recoveryRateEst;
  const recoveredAnnual = recoveredMonthly * 12;

  // Active Signal Tab in 200+ Signals Engine
  const [activeSignalTab, setActiveSignalTab] = useState<number>(0);

  const signalCategories = [
    {
      title: "Bank & Issuer Telemetry",
      count: "48 Signals",
      desc: "Real-time authorization switch uptime across HDFC, ICICI, SBI, Axis Bank, and card networks.",
      points: ["Historical decline patterns by BIN", "Current switch queue latency", "Peak authorization success windows", "Sub-code mapping (e.g. 05, 51, 61, 91)"]
    },
    {
      title: "Customer Funding Patterns",
      count: "52 Signals",
      desc: "Detects monthly salary credit dates, corporate payroll schedules, and account replenishment cycles.",
      points: ["Typical direct deposit day (28th-5th)", "Previous retry recovery timestamp analysis", "Weekend vs weekday settlement behavior", "Overdraft risk prediction"]
    },
    {
      title: "Gateway Health & Cascading",
      count: "36 Signals",
      desc: "Dynamic multi-gateway orchestration between Razorpay, direct bank nodes, and fallback routes.",
      points: ["Live gateway endpoint error rates", "3DS vs frictionless conversion rates", "Alternate route retry failovers", "Token vault freshness"]
    },
    {
      title: "Risk & Velocity Governance",
      count: "42 Signals",
      desc: "Enforces strict merchant policies, fraud scoring thresholds, and card velocity cooling periods.",
      points: ["Cardholder velocity limits", "High-value manual operator escalation (> ₹50,000)", "Permanent failure blacklist filtering", "Deterministic immutable audit logs"]
    },
    {
      title: "Omnichannel Dunning Timing",
      count: "24 Signals",
      desc: "Smart multi-touch communication via WhatsApp, SMS, and Email timed to user active hours.",
      points: ["WhatsApp read receipt heuristics", "1-Click localized UPI intent links", "Pre-dunning expiration alerts", "Tokenized frictionless update portals"]
    }
  ];

  return (
    <div className="min-h-screen bg-[#041018] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,165,233,0.12),rgba(255,255,255,0))] pointer-events-none" />

      {/* TOP NAVIGATION BAR */}
      <nav className="h-20 border-b border-[#133248]/80 bg-[#041018]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF5E3A] via-[#FF7A59] to-[#FFA07A] flex items-center justify-center shadow-lg shadow-orange-950/40 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5 leading-none">
                <span>RevivePay</span>
                <span className="text-cyan-400 text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                  AI
                </span>
              </span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                Policy-Gated Recovery
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#signals-engine" className="hover:text-white transition-colors">
              200+ ML Signals
            </a>
            <a href="#roi-calculator" className="hover:text-white transition-colors">
              ROI Calculator
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Comparison
            </a>
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Razorpay Test Sandbox Ready</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold">
          <Link
            to="/login"
            className="text-slate-300 hover:text-white transition-colors hidden md:flex items-center gap-1 font-medium"
          >
            <span>Sign In</span>
          </Link>

          <Link
            to="/cases/RV-10291"
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-slate-600/80 hover:border-slate-400 bg-[#0A1D2C] hover:bg-[#102B40] text-slate-200 transition-all font-medium text-xs sm:text-sm flex items-center gap-1.5"
          >
            <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Demo Case</span>
          </Link>

          <Link
            to="/dashboard"
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-cyan-950/40 transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm font-bold"
          >
            Open Command Center
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-16 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Description & CTAs */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left">
            {/* Top Pill (Honest Technical Framing) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium tracking-wide">
              <CircleDot className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>POLICY-GATED AUTONOMOUS PAYMENT RECOVERY</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Stop Losing Revenue <br />
              You've{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-teal-300 to-cyan-400">
                Already
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-teal-300 to-cyan-400">
                Earned
              </span>
            </h1>

            {/* Subheadline & Description */}
            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              <p className="font-medium text-slate-200">
                A failed payment usually isn't a lost customer — just money that didn't go through. Revive recovers that revenue through bounded, intelligent retries.
              </p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Integrated with Razorpay's billing engine and webhook stream, Revive makes context-aware retry decisions rather than dumb cron loops. It analyzes 200+ signals per failure to time every retry safely — with strict merchant limits, human approvals for high-value cases, and an immutable audit trail.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/cases/RV-10291"
                className="flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#00ADB5] hover:bg-[#00C4CD] text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(0,173,181,0.35)] transition-all hover:scale-105 active:scale-95 group"
              >
                <span>Launch Interactive Demo Case</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/simulation"
                className="flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#081B2A] hover:bg-[#0E2A40] border border-[#164264] text-slate-200 font-semibold text-sm transition-all hover:border-slate-400 group"
              >
                <span>Simulation Lab</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Honest Technical Highlights Banner */}
            <div className="pt-4 border-t border-[#133248]/80 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Razorpay Test Mode Sandbox</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Zero Black-Box Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>100% Auditable Ledger</span>
              </div>
            </div>
          </div>

          {/* Right Column: Simplified Marketing Preview */}
          <div className="lg:col-span-6">
            <ReviveHeroPreview />
          </div>
        </div>
      </section>

      {/* SECTION 2: PROBLEM STATEMENT (Honest Architectural Context) */}
      <section id="how-it-works" className="py-16 px-4 sm:px-8 border-y border-[#133248]/60 bg-[#061420]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              THE REVENUE RECOVERY GAP
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why Blind Fixed Retries Cause Surcharges and Customer Churn
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Merchants lose significant revenue every day to transient bank switch glitches, expired cards, and checkout abandonment. Most legacy billing systems blindly retry on fixed dates (e.g. 24h, 48h, 72h), exhausting attempts and burning cardholder goodwill. Revive provides bounded, intelligent execution with policy guardrails.
            </p>
          </div>

          {/* 3 Interactive Cards with Visual Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-[#091D2D] border border-[#173F5E] space-y-4 hover:border-cyan-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Root-Cause Diagnosis</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Classifies 15+ failure reasons deterministically: Insufficient Funds, Expired Card, Bank Switch Disconnect, 3DS Auth Drop, or Velocity Cap.
              </p>
              <Link
                to="/cases/RV-10291"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                <span>Inspect Demo Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-[#091D2D] border border-[#173F5E] space-y-4 hover:border-cyan-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">200+ ML Signals Timing</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Calculates the exact window of peak cardholder liquidity based on payroll cycles, time zone heuristics, and bank switch reliability models.
              </p>
              <Link
                to="/simulation"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <span>Test in Simulation Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-[#091D2D] border border-[#173F5E] space-y-4 hover:border-cyan-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Strict Policy Governance</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Ramp-grade safety rules ensure AI acts autonomously only within strict merchant limits. High-value amounts route to human operators with full audit trails.
              </p>
              <Link
                to="/approvals"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300"
              >
                <span>View Approval Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 200+ SIGNALS ENGINE EXPLORER */}
      <section id="signals-engine" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            MULTI-SIGNAL RECOVERY INTELLIGENCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Revive Reads 200+ Signals to Time Every Retry
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Gateways only see isolated transaction errors. Revive joins gateway telemetry with subscriber billing history, recurring invoice cycles, and banking health.
          </p>
        </div>

        {/* Interactive Signal Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Tab Selectors */}
          <div className="lg:col-span-5 space-y-2.5">
            {signalCategories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSignalTab(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeSignalTab === idx
                    ? "bg-[#092233] border-cyan-500/60 shadow-lg shadow-cyan-950/50 text-white"
                    : "bg-[#061724] border-[#13354E] hover:border-[#1E4D70] text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">{cat.title}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                    {cat.count}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cat.desc}</p>
              </button>
            ))}
          </div>

          {/* Right: Active Tab Breakdown Display */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-[#081A28] border border-[#174161] shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#174161] pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase font-bold">
                  SIGNAL VECTOR #{activeSignalTab + 1}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {signalCategories[activeSignalTab].title}
                </h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Active in Risk Engine v1.2
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {signalCategories[activeSignalTab].desc}
            </p>

            <div className="space-y-3">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Telemetry Features Evaluated:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {signalCategories[activeSignalTab].points.map((pt, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3 rounded-lg bg-[#051420] border border-[#143952] flex items-start gap-2 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#174161] flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Inference Latency: &lt; 28ms</span>
              <Link
                to="/policy"
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Customize Policy Rules</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: INTERACTIVE ROI CALCULATOR (INR FORMATTING) */}
      <section id="roi-calculator" className="py-20 px-4 sm:px-8 border-y border-[#133248]/60 bg-[#061522]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              REVENUE RECOVERY ROI CALCULATOR
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Estimate Recoverable Revenue for Your Business
            </h2>
            <p className="text-slate-400 text-sm">
              Adjust your monthly processed volume (INR) and payment failure rate to estimate recovered revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Left: Interactive Sliders */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-[#091D2D] border border-[#173F5E] space-y-6">
              {/* Slider 1: Monthly Processed Revenue */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Monthly Processed Volume (MRR/GMV)</span>
                  <span className="font-bold text-cyan-400 text-sm">
                    {formatINR(monthlyRevenue)}
                  </span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="20000000"
                  step="100000"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                  className="w-full h-2 bg-[#051420] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>₹2 Lakhs</span>
                  <span>₹1 Crore</span>
                  <span>₹2 Crores+</span>
                </div>
              </div>

              {/* Slider 2: Payment Decline Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Average Payment Decline Rate</span>
                  <span className="font-bold text-cyan-400 text-sm">{failRate}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={failRate}
                  onChange={(e) => setFailRate(Number(e.target.value))}
                  className="w-full h-2 bg-[#051420] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1%</span>
                  <span>7.5% (Avg)</span>
                  <span>20%</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#051420] border border-[#13354E] space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Revenue at Risk:</span>
                  <span className="text-rose-400 font-bold">
                    {formatINR(failedRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Benchmark AI Recovery Rate:</span>
                  <span className="text-emerald-400 font-bold">65.2%</span>
                </div>
              </div>
            </div>

            {/* Right: Results Display */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#092233] to-[#061622] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 space-y-6 text-center">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                ESTIMATED RECOVERED REVENUE
              </span>

              <div className="space-y-1">
                <p className="text-4xl sm:text-5xl font-extrabold text-cyan-300 tracking-tight">
                  {formatINR(recoveredMonthly)}
                  <span className="text-lg font-sans text-slate-400 font-normal"> / mo</span>
                </p>
                <p className="text-lg font-bold text-emerald-400">
                  +{formatINR(recoveredAnnual)} annual topline boost
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-lg bg-[#04111B] border border-[#143B57]">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Topline Added</p>
                  <p className="text-base font-bold text-white">+4.8%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#04111B] border border-[#143B57]">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Integration</p>
                  <p className="text-base font-bold text-emerald-400">Razorpay Ready</p>
                </div>
              </div>

              <Link
                to="/cases/RV-10291"
                className="w-full py-3.5 rounded-full bg-[#00ADB5] hover:bg-[#00C4CD] text-slate-950 font-bold text-sm shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <span>Test Recovery on Demo Case</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: DUMB RETRIES VS REVIVE AI COMPARISON */}
      <section id="comparison" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            FEATURE COMPARISON
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Traditional Fixed Retries vs. Revive AI
          </h2>
          <p className="text-slate-400 text-sm">
            Deterministic policies replace blind cron jobs with safe, context-aware retry execution.
          </p>
        </div>

        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#14364D] text-slate-400 font-mono">
                <th className="py-4 px-4 font-semibold">Capability</th>
                <th className="py-4 px-4 font-semibold text-rose-400">Fixed Schedule Dunning</th>
                <th className="py-4 px-4 font-semibold text-cyan-400 bg-cyan-950/40 rounded-t-lg">
                  Revive AI Autonomous
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14364D]/60 text-slate-200">
              {[
                {
                  cap: "Retry Execution Timing",
                  dumb: "Fixed clock intervals (24h, 48h, 72h)",
                  revive: "Dynamic timing based on 200+ signals"
                },
                {
                  cap: "Bank Switch Outage Handling",
                  dumb: "Retries during active outages, wasting attempts",
                  revive: "Listens to switch latency & pauses until switch heals"
                },
                {
                  cap: "Salary & Payday Alignment",
                  dumb: "Ignored — retries middle of month when empty",
                  revive: "Aligns retries with payroll credit windows"
                },
                {
                  cap: "Expired Card Intelligence",
                  dumb: "Retries dead card repeatedly causing fees",
                  revive: "Halts retries immediately & triggers 1-click update"
                },
                {
                  cap: "Multi-Gateway Cascade",
                  dumb: "Single gateway lock-in",
                  revive: "Automatic failover across backup direct routes"
                },
                {
                  cap: "Human-in-the-Loop Governance",
                  dumb: "None (black box)",
                  revive: "Strict policy approval gates for high-value cases"
                }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-[#071927]/60 transition-colors">
                  <td className="py-4 px-4 font-medium text-slate-300">{row.cap}</td>
                  <td className="py-4 px-4 text-slate-400">{row.dumb}</td>
                  <td className="py-4 px-4 font-semibold text-cyan-300 bg-cyan-950/20">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span>{row.revive}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 6: BOTTOM CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-8 border-t border-[#133248]/80 bg-gradient-to-b from-[#061522] to-[#041018] text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#FF5E3A] via-[#FF7A59] to-cyan-400 flex items-center justify-center shadow-2xl shadow-orange-950/50">
            <Zap className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Stop Losing Revenue <br />
            You've Already Earned?
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Test the bounded AI recovery engine with Razorpay test mode or try the simulation lab.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/cases/RV-10291"
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#00ADB5] hover:bg-[#00C4CD] text-slate-950 font-bold text-sm shadow-[0_0_30px_rgba(0,173,181,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Demo Case RV-10291</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#091E2E] hover:bg-[#0E2C42] border border-[#164160] text-slate-200 font-semibold text-sm transition-all"
            >
              <span>Open Executive Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#133248]/60 bg-[#030C13] py-12 px-4 sm:px-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#FF5E3A] to-[#FFA07A] flex items-center justify-center text-white font-bold text-xs">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-300 text-sm">RevivePay AI</span>
            <span className="text-slate-600">&middot;</span>
            <span>Autonomous Revenue Recovery for Fintech & SaaS</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <Link to="/cases" className="hover:text-white transition-colors">
              Recovery Cases
            </Link>
            <Link to="/simulation" className="hover:text-white transition-colors">
              Simulation Lab
            </Link>
            <Link to="/policy" className="hover:text-white transition-colors">
              Policy Guardrails
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Razorpay Test Sandbox & HMAC Signature Ingress</span>
          </div>
        </div>
      </footer>

      {/* BOTTOM-LEFT TEST MODE BADGE */}
      <div className="fixed bottom-6 left-6 z-40 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081826]/90 border border-[#153B57] text-slate-300 text-[11px] backdrop-blur-md shadow-xl">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-mono">Razorpay Sandbox Active</span>
      </div>

      {/* BOTTOM-RIGHT FLOATING "ASK ME ANYTHING" DRAWER */}
      <AskMeAnythingDrawer />
    </div>
  );
};
