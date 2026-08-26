import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Sliders, CheckCircle2 } from "lucide-react";

export const DemoTourBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-b border-blue-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="font-semibold text-slate-100 mr-2">Enterprise Recovery Pipeline:</span>
          <span className="text-slate-400 hidden sm:inline">
            <span className="text-blue-400 font-mono">DETECT</span> → <span className="text-indigo-400 font-mono">DIAGNOSE</span> → <span className="text-purple-400 font-mono">DECIDE</span> → <span className="text-emerald-400 font-mono">ACT</span> → <span className="text-cyan-400 font-mono">VERIFY</span> → <span className="text-amber-400 font-mono">MEASURE</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/cases/RV-10291"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white border border-blue-500/40 font-medium text-[11px] transition-colors"
        >
          <span>1. Inspect Case RV-10291</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
        <Link
          to="/simulation"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium text-[11px] transition-colors"
        >
          <span>2. Run Simulation</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
