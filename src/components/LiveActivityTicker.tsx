import React, { useState, useEffect } from "react";
import { Zap, CheckCircle, ShieldAlert, RefreshCw, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ActivityItem {
  id: string;
  time: string;
  type: "recovered" | "analyzed" | "escalated" | "retry";
  text: string;
  amount?: string;
  caseId?: string;
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { id: "1", time: "Just now", type: "recovered", text: "Autonomous recovery executed for pay_89231", amount: "+₹4,999", caseId: "RV-10291" },
  { id: "2", time: "2m ago", type: "analyzed", text: "AI root-cause diagnosed 504 gateway timeout", amount: "₹18,500", caseId: "RV-10295" },
  { id: "3", time: "4m ago", type: "retry", text: "Smart retry dispatched with 30s backoff", amount: "₹2,499", caseId: "RV-10292" },
  { id: "4", time: "7m ago", type: "escalated", text: "Retry limit (2/2) reached; escalated to operator", amount: "₹6,200", caseId: "RV-10294" },
  { id: "5", time: "11m ago", type: "recovered", text: "Customer completed checkout via recovery link", amount: "+₹6,999", caseId: "chk_70001" },
];

export const LiveActivityTicker: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SAMPLE_ACTIVITIES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = SAMPLE_ACTIVITIES[index];

  return (
    <div className="bg-[#0A0E18] border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-300">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] font-semibold tracking-wider uppercase shrink-0 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
          Live Stream
        </div>

        <div className="flex items-center gap-2 truncate">
          <span className="text-slate-500 text-[11px] shrink-0 font-mono">{current.time}:</span>
          <span className="text-slate-200 truncate">{current.text}</span>
          {current.amount && (
            <span className={`font-mono font-semibold shrink-0 ${current.amount.startsWith("+") ? "text-emerald-400" : "text-amber-400"}`}>
              {current.amount}
            </span>
          )}
        </div>
      </div>

      <Link
        to="/ai-activity"
        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 font-medium shrink-0 ml-4 transition-colors"
      >
        <span>View Full Stream</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
};
