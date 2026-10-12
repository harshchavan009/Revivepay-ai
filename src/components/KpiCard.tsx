import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  variant?: "brand" | "success" | "warning" | "danger" | "neutral";
  highlight?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = "neutral",
  highlight = false,
}) => {
  const variantStyles = {
    brand: "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-accent)]",
    success: "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-emerald-600 dark:text-emerald-400",
    warning: "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-amber-600 dark:text-amber-400",
    danger: "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-rose-600 dark:text-rose-400",
    neutral: "border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]",
  };

  const iconBgStyles = {
    brand: "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30",
    neutral: "bg-[var(--color-bg-canvas)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]",
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all hover:border-[var(--color-border-hover)] relative overflow-hidden shadow-premium-sm ${
        variantStyles[variant]
      } ${highlight ? "ring-1 ring-[var(--color-accent)]" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-md ${iconBgStyles[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">{value}</div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-mono font-medium ${
              trend.isPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};
