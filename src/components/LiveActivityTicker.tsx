import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatINR } from "../data/mockData";
import { API_BASE_URL } from "../services";

interface ActivityItem {
  id: string;
  time: string;
  type: "recovered" | "analyzed" | "escalated" | "retry" | "webhook" | "approval";
  text: string;
  amount?: string;
  caseId?: string;
}

const IDLE_ACTIVITY: ActivityItem = {
  id: "idle",
  time: "Sandbox",
  type: "webhook",
  text: "Recovery engine listening for Razorpay test webhooks. Trigger a simulation or send an event to begin.",
};

export const LiveActivityTicker: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([IDLE_ACTIVITY]);
  const [index, setIndex] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Connect to Real Backend Server-Sent Events (SSE) Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      const sseUrl = `${API_BASE_URL}/events/stream`;
      eventSource = new EventSource(sseUrl);

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
          setActivities(prev => [newAct, ...prev.filter(a => a.id !== "idle").slice(0, 15)]);
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
          setActivities(prev => [newAct, ...prev.filter(a => a.id !== "idle").slice(0, 15)]);
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
            text: `Operator ${data.actor || "Operator"} ${data.decision?.toLowerCase() || "reviewed"} case ${data.case_id}`,
            amount: data.amount ? formatINR(data.amount) : undefined,
            caseId: data.case_id
          };
          setActivities(prev => [newAct, ...prev.filter(a => a.id !== "idle").slice(0, 15)]);
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
    if (activities.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activities.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activities.length]);

  const current = activities[index] || activities[0] || IDLE_ACTIVITY;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[var(--color-bg-canvas)] border-b border-[var(--color-border-subtle)] px-6 py-2 flex items-center justify-between text-xs text-[var(--color-text-secondary)] select-none transition-colors"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-mono text-[10px] font-bold tracking-wider uppercase shrink-0 border border-[var(--color-accent-border)]">
          <span className={`w-1.5 h-1.5 rounded-sm ${isLiveConnected ? "bg-emerald-500" : "bg-[var(--color-accent)]"}`}></span>
          <span>{isLiveConnected ? "Live SSE Stream" : "Live Event Stream"}</span>
        </div>

        <div className="flex items-center gap-2 truncate text-xs">
          <span className="text-[var(--color-text-muted)] text-[11px] shrink-0 font-mono">{current.time}:</span>
          <span className="text-[var(--color-text-primary)] truncate">{current.text}</span>
          {current.amount && (
            <span className={`font-mono font-bold shrink-0 ${current.amount.startsWith("+") ? "text-emerald-500" : "text-amber-500"}`}>
              {current.amount}
            </span>
          )}
        </div>
      </div>

      <Link
        to="/ai-activity"
        className="flex items-center gap-1 text-[11px] text-[var(--color-accent)] hover:underline font-semibold shrink-0 ml-4 transition-colors"
      >
        <span>View Full Activity</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
};
