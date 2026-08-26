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
              <span className="font-semibold text-slate-300">{item.stage}</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-100 font-bold">{item.count}</span>
                {idx > 0 && (
                  <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1 rounded">
                    -{item.dropoff}
                  </span>
                )}
              </div>
            </div>
            <div className="h-4 w-full bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded transition-all duration-700 ${
                  idx === data.length - 1
                    ? "bg-gradient-to-r from-emerald-600 to-teal-400"
                    : "bg-gradient-to-r from-blue-600 to-indigo-500"
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
