import React from "react";
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
  PlayCircle
} from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <nav className="h-16 border-b border-slate-800/80 bg-[#080C15]/80 backdrop-blur sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-900/30 ring-1 ring-white/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">RevivePay AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono font-bold">
            ENTERPRISE
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link to="/cases/RV-10291" className="text-slate-400 hover:text-white transition-colors hidden sm:inline">
            Interactive Demo
          </Link>
          <Link to="/simulation" className="text-slate-400 hover:text-white transition-colors hidden sm:inline">
            Simulation Lab
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-900/30 transition-all"
          >
            Launch Command Center
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-medium animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>AUTONOMOUS REVENUE RECOVERY FOR MODERN FINTECH & SAAS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
          Recover Revenue <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
            Before It's Lost.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Stop bleeding revenue to transient bank switch glitches, expired cards, and abandoned checkout flows.
          RevivePay combines AI-native root-cause diagnosis with strict deterministic policy governance.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/cases/RV-10291"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-blue-950/50 transition-all hover:scale-105 active:scale-95"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch 5-Minute Killer Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
          >
            <span>Open Executive Dashboard</span>
          </Link>
        </div>

        {/* 6-Step Workflow Preview */}
        <div className="pt-16 max-w-5xl mx-auto text-left">
          <div className="p-1 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700/60 shadow-2xl overflow-hidden">
            <div className="bg-[#0B0F19] rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                  The Core Architectural Paradigm
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Zero Black-Box Risk
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                {[
                  { step: "DETECT", desc: "Razorpay webhook / event ingestion", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
                  { step: "DIAGNOSE", desc: "Deterministic risk scoring & AI root-cause", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
                  { step: "DECIDE", desc: "Evidence-backed tool action selection", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
                  { step: "ACT", desc: "Policy gated auto-retry or approval", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
                  { step: "VERIFY", desc: "Gateway payment outcome check", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
                  { step: "MEASURE", desc: "Real-time metrics & audit logs", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
                ].map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border flex flex-col justify-between ${item.color}`}>
                    <span className="font-mono font-black text-sm">{item.step}</span>
                    <p className="text-[11px] text-slate-300 mt-2 leading-tight">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="p-6 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
            <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">Stripe-Level Financial Rigor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full transaction ledger, real-time KPI aggregations, coherent INR monetary tracking, and test mode Razorpay gateway integration.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
            <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">Ramp-Grade Policy Controls</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic safeguards: max retry limits, automatic action amount caps, permanent failure blocking, and human operator approval routing.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
            <div className="p-2 w-fit rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">Linear-Dense Operational UX</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rich investigation screens, keyboard-accessible command palette (`Cmd+K`), live streaming AI activity feed, and immutable audit logs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
