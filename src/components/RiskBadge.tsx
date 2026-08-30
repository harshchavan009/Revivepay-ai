import React from "react";
import { RiskLevel } from "../types";
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert } from "lucide-react";

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showScore = false }) => {
  const normalizedLevel = (level || "MEDIUM").toUpperCase();

  const getConfig = () => {
    switch (normalizedLevel) {
      case "LOW":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-700 dark:text-emerald-300",
          border: "border-emerald-500/30",
          icon: <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        };
      case "HIGH":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-800 dark:text-amber-300",
          border: "border-amber-500/30",
          icon: <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
        };
      case "CRITICAL":
        return {
          bg: "bg-rose-500/10",
          text: "text-rose-700 dark:text-rose-300",
          border: "border-rose-500/30",
          icon: <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
        };
      case "MEDIUM":
      default:
        return {
          bg: "bg-[var(--color-accent-subtle)]",
          text: "text-[var(--color-accent)]",
          border: "border-[var(--color-accent-border)]",
          icon: <AlertOctagon className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
        };
    }
  };

  const config = getConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon}
      <span>{normalizedLevel}</span>
      {showScore && score !== undefined && (
        <span className="opacity-80 font-mono text-[10px] ml-0.5">({Math.round(score)})</span>
      )}
    </span>
  );
};
