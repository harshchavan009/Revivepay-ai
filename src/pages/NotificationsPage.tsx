import React from "react";
import { Bell, ShieldAlert, CheckCircle2, Clock, PlayCircle, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { formatINR } from "../data/mockData";

export const NotificationsPage: React.FC = () => {
  const notifications = [
    {
      id: "1",
      title: "High-Value Approval Required",
      message: `Case RV-10296 (${formatINR(89000)}) exceeds automated policy threshold and requires operator sign-off.`,
      time: "10m ago",
      type: "approval",
      link: "/approvals"
    },
    {
      id: "2",
      title: "Autonomous Recovery Successful",
      message: `Successfully recovered ${formatINR(18500)} for customer Siddharth Nair via automated retry.`,
      time: "45m ago",
      type: "success",
      link: "/cases/RV-10295"
    },
    {
      id: "3",
      title: "Retry Limit Exhausted & Escalated",
      message: `Case RV-10294 reached maximum retries (2/2) and was safely escalated to merchant.`,
      time: "2h ago",
      type: "warning",
      link: "/cases/RV-10294"
    },
    {
      id: "4",
      title: "Razorpay Webhook Signature Verified",
      message: "Razorpay webhook event 'payment.failed' ingested with valid HMAC-SHA256 signature.",
      time: "4h ago",
      type: "info",
      link: "/audit"
    }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl font-sans">
      <div className="border-b border-[#13354E] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            REAL-TIME DISPATCHES
          </span>
          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {notifications.length} Unread Alerts
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
          <Bell className="w-6 h-6 text-cyan-400" />
          <span>Operational Notifications & Alerts</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time incident dispatches, policy approvals, and revenue recovery milestones.
        </p>
      </div>

      <div className="bg-[#081826]/90 border border-[#163E5C] rounded-2xl divide-y divide-[#13354E]/60 shadow-xl overflow-hidden">
        {notifications.map((n) => (
          <div key={n.id} className="p-4 sm:p-5 hover:bg-[#0A2234]/60 transition-colors flex items-start justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                n.type === "approval" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                n.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                n.type === "warning" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
              }`}>
                {n.type === "approval" ? <ShieldAlert className="w-4 h-4" /> :
                 n.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
                 <Bell className="w-4 h-4" />}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">{n.title}</h4>
                <p className="text-slate-300 leading-relaxed">{n.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-slate-400 text-[11px]">{n.time}</span>
              <Link
                to={n.link}
                className="px-3 py-1.5 rounded-lg bg-[#0B253A] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-semibold transition-colors"
              >
                Inspect
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
