import React, { useState, useEffect } from "react";
import { Bell, ShieldAlert, CheckCircle2, AlertTriangle, Info, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { notificationService, OperationalNotification } from "../services/notificationService";

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<OperationalNotification[]>([]);

  useEffect(() => {
    notificationService.getNotifications().then(setNotifications);
    const unsubscribe = notificationService.subscribe(setNotifications);
    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 pb-12 max-w-4xl font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              REAL-TIME DISPATCHES
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              {unreadCount} Unread Alerts
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Operational Notifications & Alerts</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Real-time incident dispatches, policy approvals, and revenue recovery milestones synchronized across the engine.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => notificationService.markAllAsRead()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer shadow-premium-sm"
          >
            <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl divide-y divide-[var(--color-border-subtle)] shadow-premium-sm overflow-hidden">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 sm:p-5 hover:bg-[var(--color-bg-surface-hover)] transition-colors flex items-start justify-between gap-4 text-xs ${
              !n.read ? "bg-[var(--color-accent-subtle)]/30" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  n.type === "approval"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : n.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : n.type === "warning"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]"
                }`}
              >
                {n.type === "approval" ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : n.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : n.type === "warning" ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[var(--color-text-primary)] text-sm">{n.title}</h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                  )}
                </div>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">{n.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-[var(--color-text-muted)] text-[11px]">{n.time}</span>
              <Link
                to={n.link}
                onClick={() => notificationService.markAsRead(n.id)}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-canvas)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-accent)] font-semibold transition-colors border border-[var(--color-border-subtle)]"
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
