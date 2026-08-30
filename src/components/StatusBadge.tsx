import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Activity, ShieldCheck, RefreshCw, X } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "recovery" | "policy" | "approval" | "payment";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = (status || "NEW").toUpperCase();

  const getConfig = () => {
    switch (norm) {
      case "RECOVERED":
      case "SUCCESS":
      case "PASSED":
      case "APPROVED":
      case "AUTO_APPROVED":
      case "ACTIVE":
      case "COMPLETED":
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          label: norm.replace(/_/g, " ")
        };

      case "AWAITING_APPROVAL":
      case "REVIEW_REQUIRED":
      case "PENDING":
      case "ACTION_RECOMMENDED":
      case "ANALYZING":
      case "PAST_DUE":
      case "REMINDED":
        return {
          icon: <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />,
          style: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30",
          label: norm.replace(/_/g, " ")
        };

      case "EXECUTING":
      case "QUEUED":
        return {
          icon: <Activity className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />,
          style: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
          label: norm.replace(/_/g, " ")
        };

      case "BLOCKED":
      case "REJECTED":
      case "FAILED":
      case "ESCALATED":
      case "STOPPED":
      case "CANCELLED":
      case "EXPIRED":
        return {
          icon: <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />,
          style: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
          label: norm.replace(/_/g, " ")
        };

      default:
        return {
          icon: <ShieldCheck className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />,
          style: "bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]",
          label: norm.replace(/_/g, " ")
        };
    }
  };

  const { icon, style, label } = getConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase border transition-colors ${style}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};

interface TatBadgeProps {
  status?: string;
  deadline?: string;
  accruedCompensation?: number;
}

export const TatBadge: React.FC<TatBadgeProps> = ({ status, accruedCompensation = 0 }) => {
  const norm = (status || "ON_TRACK").toUpperCase();

  if (norm === "BREACHED" || accruedCompensation > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide border bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 shrink-0">
        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>TAT Breached · ₹{accruedCompensation.toFixed(0)} Comp.</span>
      </span>
    );
  }

  if (norm === "DUE_TODAY") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide border bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 shrink-0">
        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Due Today (RBI T+5)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shrink-0">
      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>On Track</span>
    </span>
  );
};
