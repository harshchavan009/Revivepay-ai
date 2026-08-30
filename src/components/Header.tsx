import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  PlayCircle,
  Sun,
  Moon,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { notificationService, OperationalNotification } from "../services/notificationService";
import { dashboardService } from "../services";
import { DashboardMetrics } from "../types";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, effectiveTheme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<OperationalNotification[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationService.getNotifications().then(setNotifications);
    const unsubscribe = notificationService.subscribe(setNotifications);
    dashboardService.getSummary().then(setMetrics).catch(() => {});
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.markAsRead(id);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  return (
    <>
      <header className="h-16 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-premium-sm backdrop-blur-md transition-colors">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 w-80">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-all text-xs font-medium group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
              <span>Search cases, TXNs, customers...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Status Indicators & Action Triggers */}
        <div className="flex items-center gap-3">
          {/* Autonomous Engine Live Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[var(--color-text-secondary)]">Autonomous Retries:</span>
            <span className="text-[var(--color-accent)] font-bold">{metrics?.recovery_rate ?? 53.6}% Rate</span>
          </div>

          {/* Quick Simulation Trigger Button */}
          <button
            onClick={() => navigate("/simulation")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all active:scale-95 cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Simulate Failure</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${effectiveTheme === "dark" ? "Light" : "Dark"} mode`}
            className="w-9 h-9 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
          >
            {effectiveTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-9 h-9 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center justify-center relative transition-colors cursor-pointer shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] shadow-premium-lg z-50 overflow-hidden font-sans animate-in fade-in">
                {/* Header */}
                <div className="p-3.5 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-bg-surface)]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[var(--color-accent)]" />
                    <span className="font-bold text-xs text-[var(--color-text-primary)]">Real-Time Dispatches</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-[10px] font-mono font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-[var(--color-accent)] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border-subtle)] text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[var(--color-text-muted)]">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          notificationService.markAsRead(n.id);
                          setIsNotifOpen(false);
                          navigate(n.link);
                        }}
                        className={`p-3.5 hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer flex items-start gap-3 ${
                          !n.read ? "bg-[var(--color-accent-subtle)]/40" : ""
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            n.type === "approval"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : n.type === "success"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : n.type === "warning"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                          }`}
                        >
                          {n.type === "approval" ? (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          ) : n.type === "success" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : n.type === "warning" ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <Info className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className={`font-semibold truncate text-[11px] ${!n.read ? "text-[var(--color-text-primary)] font-bold" : "text-[var(--color-text-secondary)]"}`}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-[var(--color-text-muted)] font-mono shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 mt-0.5">{n.message}</p>
                        </div>

                        {!n.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            title="Mark as read"
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] shrink-0 p-1"
                          >
                            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] block"></span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Link */}
                <div className="p-3 bg-[var(--color-bg-surface)] border-t border-[var(--color-border-subtle)] text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[11px] text-[var(--color-accent)] hover:underline font-semibold flex items-center justify-center gap-1"
                  >
                    <span>View All Operational Alerts</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
