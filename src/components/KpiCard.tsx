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
    brand: "border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-[#0B0F19] text-blue-400",
    success: "border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-[#0B0F19] text-emerald-400",
    warning: "border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-[#0B0F19] text-amber-400",
    danger: "border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-[#0B0F19] text-rose-400",
    neutral: "border-slate-800/90 bg-[#0B0F19] text-slate-400",
  };

  const iconBgStyles = {
    brand: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
    neutral: "bg-slate-800/80 text-slate-300 border border-slate-700/50",
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all hover:border-slate-700/90 relative overflow-hidden shadow-lg ${
        variantStyles[variant]
      } ${highlight ? "ring-1 ring-blue-500/40" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${iconBgStyles[variant]}`}>
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
