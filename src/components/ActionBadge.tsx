import React from "react";
import { RefreshCw, Link as LinkIcon, Bell, ShoppingCart, CreditCard, AlertTriangle, XCircle } from "lucide-react";

interface ActionBadgeProps {
  action: string;
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({ action }) => {
  const norm = action || "retry_payment";

  const getIcon = () => {
    switch (norm) {
      case "retry_payment":
        return <RefreshCw className="w-3 h-3 text-blue-400" />;
      case "create_payment_link":
        return <LinkIcon className="w-3 h-3 text-purple-400" />;
      case "send_customer_notification":
        return <Bell className="w-3 h-3 text-cyan-400" />;
      case "trigger_checkout_reminder":
        return <ShoppingCart className="w-3 h-3 text-emerald-400" />;
      case "request_payment_method_update":
        return <CreditCard className="w-3 h-3 text-amber-400" />;
      case "escalate_to_merchant":
        return <AlertTriangle className="w-3 h-3 text-orange-400" />;
      default:
        return <XCircle className="w-3 h-3 text-slate-400" />;
    }
  };

  const formatLabel = (act: string) => {
    return act
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-medium">
      {getIcon()}
      <span className="font-mono text-[11px]">{formatLabel(norm)}</span>
    </span>
  );
};
