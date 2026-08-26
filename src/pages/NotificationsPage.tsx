import React from "react";
import { Bell, ShieldAlert, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const NotificationsPage: React.FC = () => {
  const notifications = [
    {
      id: "1",
      title: "High-Value Approval Required",
      message: "Case RV-10291 (₹4,999) requires human operator sign-off.",
      time: "10m ago",
      type: "approval",
      link: "/cases/RV-10291"
    },
    {
      id: "2",
      title: "Autonomous Recovery Successful",
      message: "Successfully recovered ₹18,500 for customer Siddharth Nair via automated retry.",
      time: "45m ago",
      type: "success",
      link: "/cases/RV-10295"
    },
    {
      id: "3",
      title: "Retry Limit Exhausted & Escalated",
      message: "Case RV-10294 reached maximum retries (2/2) and was safely escalated.",
      time: "2h ago",
      type: "warning",
      link: "/cases/RV-10294"
    },
    {
      id: "4",
      title: "Webhook Signature Verified",
      message: "Razorpay webhook event 'payment.failed' ingested with valid HMAC-SHA256 signature.",
      time: "4h ago",
      type: "info",
      link: "/audit"
    }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <span>Operational Notifications & Alerts</span>
        </h1>
        <p className="text-xs text-slate-400">
          Real-time incident dispatches, policy approvals, and revenue recovery milestones.
        </p>
      </div>

      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl divide-y divide-slate-800/80 shadow-xl overflow-hidden">
        {notifications.map((n) => (
          <div key={n.id} className="p-4 hover:bg-slate-900/40 transition-colors flex items-start justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${
                n.type === "approval" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                n.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                n.type === "warning" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                "bg-blue-500/10 text-blue-400 border border-blue-500/30"
              }`}>
                {n.type === "approval" ? <ShieldAlert className="w-4 h-4" /> :
                 n.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
                 <Bell className="w-4 h-4" />}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-100">{n.title}</h4>
                <p className="text-slate-400">{n.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-slate-500 text-[11px]">{n.time}</span>
              <Link
                to={n.link}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium"
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
