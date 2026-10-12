import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Sliders, CheckCircle2 } from "lucide-react";

export const DemoTourBanner: React.FC = () => {
  return (
    <div className="bg-[var(--color-bg-surface-raised)] border-b border-[var(--color-border)] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="font-semibold text-[var(--color-text-primary)] mr-2">Enterprise Recovery Pipeline:</span>
          <span className="text-[var(--color-text-muted)] hidden sm:inline">
            <span className="text-[var(--color-accent)] font-mono">DETECT</span> → <span className="text-[var(--color-accent)] font-mono">DIAGNOSE</span> → <span className="text-purple-600 dark:text-purple-400 font-mono">DECIDE</span> → <span className="text-emerald-600 dark:text-emerald-400 font-mono">ACT</span> → <span className="text-cyan-600 dark:text-cyan-400 font-mono">VERIFY</span> → <span className="text-amber-600 dark:text-amber-400 font-mono">MEASURE</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/cases/RV-10291"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--color-accent-subtle)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-accent)] border border-[var(--color-accent-border)] font-medium text-[11px] transition-colors"
        >
          <span>1. Inspect Case RV-10291</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
        <Link
          to="/simulation"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] font-medium text-[11px] transition-colors"
        >
          <span>2. Run Simulation</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
