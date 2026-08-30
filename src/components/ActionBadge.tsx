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
        return <RefreshCw className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      case "create_payment_link":
        return <LinkIcon className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />;
      case "send_customer_notification":
        return <Bell className="w-3 h-3 text-[var(--color-accent)] shrink-0" />;
      case "trigger_checkout_reminder":
        return <ShoppingCart className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case "request_payment_method_update":
        return <CreditCard className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />;
      case "escalate_to_merchant":
        return <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400 shrink-0" />;
      default:
        return <XCircle className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />;
    }
  };

  const formatLabel = (act: string) => {
    return act
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs font-medium shadow-sm">
      {getIcon()}
      <span className="font-mono text-[11px]">{formatLabel(norm)}</span>
    </span>
  );
};
