import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Check,
  X,
  Clock,
  Zap,
  Sparkles
} from "lucide-react";
import { formatINR } from "../data/mockData";

export const ReviveHeroPreview: React.FC = () => {
  return (
    <div className="relative rounded-2xl bg-[#081520]/95 border border-[#14364D] p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-[#1E4E6E] font-sans">
      {/* Ambient background glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between border-b border-[#14364D]/80 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block"></span>
          </div>
          <span className="ml-2 text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <span className="font-semibold text-white">Revive</span>
            <span className="text-slate-500">&middot;</span>
            <span className="text-slate-400">Payment Recovery Preview</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine Active</span>
        </div>
      </div>

      {/* 3 Metric Cards Grid (INR figures) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-4">
        {/* Metric 1 */}
        <div className="p-3 rounded-xl bg-[#0B1E2D]/90 border border-[#173B54]">
          <p className="text-[11px] font-medium text-slate-400 leading-tight">
            Recovered Revenue
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
            {formatINR(142605)}
          </p>
          <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-0.5 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>quarter-to-date</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-3 rounded-xl bg-[#0B1E2D]/90 border border-[#173B54]">
          <p className="text-[11px] font-medium text-slate-400 leading-tight">
            Added to Topline
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
            +4.8%
          </p>
          <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-0.5 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>vs. fixed dunning</span>
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-3 rounded-xl bg-[#0B1E2D]/90 border border-[#173B54]">
          <p className="text-[11px] font-medium text-slate-400 leading-tight">
            Recovery Rate
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
            65.2%
          </p>
          <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-0.5 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>retried invoices</span>
          </p>
        </div>
      </div>

      {/* Static Marketing Showcase Rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
            RETRY DECISION EXAMPLES
          </span>
          <span className="text-[10px] text-slate-500 font-mono">200+ ML Signals</span>
        </div>

        {/* Row 1: Insufficient funds payday scheduling */}
        <div className="p-3 rounded-lg bg-[#091D2C]/80 border border-[#143952] text-xs space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-slate-300">TXN_8841 &middot; INV-20471</span>
            <span className="text-rose-400 flex items-center gap-1 font-medium">
              <X className="w-3 h-3" />
              <span>Declined: Insufficient Funds</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-300 text-[11px]">
            <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>Retry scheduled: Friday 09:00 AM (Payroll deposit cycle)</span>
          </div>
        </div>

        {/* Row 2: Expired card dunning */}
        <div className="p-3 rounded-lg bg-[#091D2C]/80 border border-[#143952] text-xs space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-slate-300">TXN_8847 &middot; INV-20486</span>
            <span className="text-amber-400 flex items-center gap-1 font-medium">
              <X className="w-3 h-3" />
              <span>Declined: Expired Card</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Retries paused &middot; 1-Click WhatsApp card update link dispatched</span>
          </div>
        </div>

        {/* Row 3: Instant network recovery */}
        <div className="p-3 rounded-lg bg-[#092233]/90 border border-emerald-500/30 text-xs space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-slate-300">TXN_8852 &middot; INV-20491</span>
            <span className="text-rose-400 flex items-center gap-1 font-medium">
              <X className="w-3 h-3" />
              <span>Declined: Bank Switch Glitch</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Instant retry routed via HDFC backup direct pipe</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[9px] flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
              <span>RECOVERED ₹32,400</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer link to interactive studio */}
      <div className="mt-4 pt-3 border-t border-[#14364D]/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Razorpay Test Mode Sandbox Integration</span>
        </div>
        <Link
          to="/dashboard"
          className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
        >
          <span>Open Interactive Command Center</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
