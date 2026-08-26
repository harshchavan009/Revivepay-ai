import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatINR } from "../data/mockData";

interface ActivityItem {
  id: string;
  time: string;
  type: "recovered" | "analyzed" | "escalated" | "retry" | "webhook" | "approval";
  text: string;
  amount?: string;
  caseId?: string;
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  { id: "1", time: "Just now", type: "recovered", text: "Autonomous recovery executed for pay_89231 (HDFC Switch Restored)", amount: "+₹4,999", caseId: "RV-10291" },
  { id: "2", time: "1m ago", type: "analyzed", text: "AI root-cause diagnosed 504 gateway timeout · Auto-rerouted via Axis Bank", amount: "₹18,500", caseId: "RV-10295" },
  { id: "3", time: "3m ago", type: "retry", text: "Smart retry dispatched for monthly payroll credit window", amount: "₹12,499", caseId: "RV-10292" },
  { id: "4", time: "5m ago", type: "escalated", text: "High-value enterprise tier payment escalated to operator for policy approval", amount: "₹65,200", caseId: "RV-10294" },
  { id: "5", time: "8m ago", type: "recovered", text: "Customer completed checkout via 1-Click WhatsApp recovery token", amount: "+₹6,999", caseId: "chk_70001" },
  { id: "6", time: "11m ago", type: "recovered", text: "Instant retry triggered on issuer timeout · Recovered successfully", amount: "+₹45,000", caseId: "RV-10293" }
];

export const LiveActivityTicker: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [index, setIndex] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Connect to Real Backend Server-Sent Events (SSE) Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events/stream");

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.addEventListener("case_created", (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          const data = parsed.data || parsed;
          const newAct: ActivityItem = {
            id: `evt_${Date.now()}`,
            time: "Just now",
            type: "analyzed",
            text: `AI evaluated ${data.failure_type || "failure"} for ${data.customer_name || "Customer"} · Action: ${data.recommended_action || "retry_payment"}`,
            amount: data.amount ? formatINR(data.amount) : undefined,
            caseId: data.case_id
          };
          setActivities(prev => [newAct, ...prev.slice(0, 15)]);
          setIndex(0);
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener("payment_recovered", (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          const data = parsed.data || parsed;
          const newAct: ActivityItem = {
            id: `evt_${Date.now()}`,
            time: "Just now",
            type: "recovered",
            text: `Payment successfully recovered for ${data.customer_name || "Customer"} (${data.case_id})`,
            amount: data.amount ? `+${formatINR(data.amount)}` : undefined,
            caseId: data.case_id
          };
          setActivities(prev => [newAct, ...prev.slice(0, 15)]);
          setIndex(0);
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener("approval_actioned", (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          const data = parsed.data || parsed;
          const newAct: ActivityItem = {
            id: `evt_${Date.now()}`,
            time: "Just now",
            type: "approval",
            text: `Human operator ${data.actor || "Operator"} ${data.decision?.toLowerCase() || "reviewed"} case ${data.case_id}`,
            amount: data.amount ? formatINR(data.amount) : undefined,
            caseId: data.case_id
          };
          setActivities(prev => [newAct, ...prev.slice(0, 15)]);
          setIndex(0);
        } catch {
          // ignore
        }
      });

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch {
      setIsLiveConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Cycle through current activities
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activities.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activities.length]);

  const current = activities[index] || activities[0];

  return (
    <div className="bg-[#040E17] border-b border-[#102B3E] px-6 py-2 flex items-center justify-between text-xs text-slate-300 select-none">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 font-mono text-[10px] font-bold tracking-wider uppercase shrink-0 border border-cyan-500/30">
          <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? "bg-emerald-400 animate-ping" : "bg-cyan-400"}`}></span>
          <span>{isLiveConnected ? "Live SSE Stream" : "Live ML Stream"}</span>
        </div>

        <div className="flex items-center gap-2 truncate text-xs">
          <span className="text-slate-500 text-[11px] shrink-0 font-mono">{current.time}:</span>
          <span className="text-slate-200 truncate">{current.text}</span>
          {current.amount && (
            <span className={`font-mono font-bold shrink-0 ${current.amount.startsWith("+") ? "text-emerald-400" : "text-amber-400"}`}>
              {current.amount}
            </span>
          )}
        </div>
      </div>

      <Link
        to="/ai-activity"
        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold shrink-0 ml-4 transition-colors hover:underline"
      >
        <span>View Full Activity</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
};
