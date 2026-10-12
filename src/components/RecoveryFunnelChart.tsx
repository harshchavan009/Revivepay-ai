import React from "react";
import { ArrowDown, CheckCircle2 } from "lucide-react";

interface FunnelStage {
  stage: string;
  count: number;
  dropoff: string;
}

interface RecoveryFunnelChartProps {
  data: FunnelStage[];
}

export const RecoveryFunnelChart: React.FC<RecoveryFunnelChartProps> = ({ data }) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const percentage = Math.round((item.count / maxCount) * 100);
        return (
          <div key={item.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--color-text-secondary)]">{item.stage}</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[var(--color-text-primary)] font-bold">{item.count}</span>
                {idx > 0 && (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 rounded border border-rose-500/20">
                    -{item.dropoff}
                  </span>
                )}
              </div>
            </div>
            <div className="h-4 w-full bg-[var(--color-bg-canvas)] rounded overflow-hidden p-0.5 border border-[var(--color-border-subtle)]">
              <div
                className={`h-full rounded transition-all duration-300 ${
                  idx === data.length - 1
                    ? "bg-emerald-600"
                    : "bg-[var(--color-accent)]"
                }`}
                style={{ width: `${Math.max(8, percentage)}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
