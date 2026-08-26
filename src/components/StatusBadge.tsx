import React from "react";
import { RecoveryStatus, PolicyStatus, ApprovalStatus } from "../types";

interface StatusBadgeProps {
  status: string;
  type?: "recovery" | "policy" | "approval" | "payment";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = "recovery" }) => {
  const norm = (status || "NEW").toUpperCase();

  const getStyle = () => {
    switch (norm) {
      case "RECOVERED":
      case "SUCCESS":
      case "PASSED":
      case "APPROVED":
      case "AUTO_APPROVED":
      case "ACTIVE":
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

      case "AWAITING_APPROVAL":
      case "REVIEW_REQUIRED":
      case "PENDING":
      case "ACTION_RECOMMENDED":
      case "ANALYZING":
      case "PAST_DUE":
      case "REMINDED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";

      case "EXECUTING":
      case "QUEUED":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse";

      case "BLOCKED":
      case "REJECTED":
      case "FAILED":
      case "ESCALATED":
      case "STOPPED":
      case "CANCELLED":
      case "EXPIRED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";

      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getLabel = () => {
    return norm.replace(/_/g, " ");
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase border ${getStyle()}`}
    >
      {getLabel()}
    </span>
  );
};
