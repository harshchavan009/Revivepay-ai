import React from "react";
import { Sparkles } from "lucide-react";

interface ConfidenceGaugeProps {
  confidence: number; // 0.0 to 1.0 or 0 to 100
  size?: "sm" | "md" | "lg";
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ confidence, size = "md" }) => {
  const percentage = confidence <= 1.0 ? Math.round(confidence * 100) : Math.round(confidence);

  const getColor = () => {
    if (percentage >= 85) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (percentage >= 70) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    return "text-rose-400 border-rose-500/40 bg-rose-500/10";
  };

  const getBarColor = () => {
    if (percentage >= 85) return "bg-emerald-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono font-bold text-xs ${getColor()}`}>
        <Sparkles className="w-3 h-3" />
        <span>{percentage}%</span>
      </div>
      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
