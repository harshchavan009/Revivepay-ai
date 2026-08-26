import React from "react";
import { RiskLevel } from "../types";

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showScore = false }) => {
  const normalizedLevel = (level || "MEDIUM").toUpperCase();

  const styles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    LOW: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    MEDIUM: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      dot: "bg-amber-400",
    },
    HIGH: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/30",
      dot: "bg-orange-400",
    },
    CRITICAL: {
      bg: "bg-red-500/15",
      text: "text-red-400",
      border: "border-red-500/30",
      dot: "bg-red-500 animate-pulse",
    },
  };

  const style = styles[normalizedLevel] || styles.MEDIUM;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      <span>{normalizedLevel}</span>
      {showScore && score !== undefined && (
        <span className="text-slate-400 font-mono text-[10px] ml-0.5">({Math.round(score)})</span>
      )}
    </span>
  );
};
