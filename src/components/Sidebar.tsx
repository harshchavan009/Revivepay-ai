import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  PlayCircle,
  CreditCard,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  Sparkles,
  Clock,
  Lock,
  Settings,
  ExternalLink,
  LogOut,
  Compass,
  FileCode
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMetrics } from "../context/MetricsContext";
import { GuidedTour } from "./GuidedTour";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalCasesCount, awaitingApprovalCount, environmentLabel } = useMetrics();
  const [isTourOpen, setIsTourOpen] = useState(false);

  const activeCasesBadge = String(totalCasesCount);
  const pendingApprovalsBadge = String(awaitingApprovalCount);

  const navGroups = [
    {
      group: "REVENUE RECOVERY",
      items: [
        { label: "Executive Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Recovery Cases", icon: ShieldCheck, path: "/cases", badge: activeCasesBadge },
        { label: "Approval Center", icon: CheckCircle2, path: "/approvals", badge: pendingApprovalsBadge, badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
        { label: "Simulation Lab", icon: PlayCircle, path: "/simulation" },
      ]
    },
    {
      group: "BILLING & LEDGER",
      items: [
        { label: "Payments Telemetry", icon: CreditCard, path: "/payments" },
        { label: "Subscription Dunning", icon: RefreshCw, path: "/subscriptions" },
        { label: "Checkout Recovery", icon: ShoppingCart, path: "/checkout" },
        { label: "Revenue Analytics", icon: BarChart3, path: "/analytics" },
      ]
    },
    {
      group: "AI & GOVERNANCE",
      items: [
        { label: "200+ ML Signals Feed", icon: Sparkles, path: "/ai-activity" },
        { label: "Immutable Audit Log", icon: Clock, path: "/audit" },
        { label: "Policy Guardrails", icon: Lock, path: "/policies" },
        { label: "Engineering Notes", icon: FileCode, path: "/changelog" },
        { label: "Gateway & Webhooks", icon: Settings, path: "/settings" },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] flex flex-col justify-between py-4 select-none shrink-0 z-30 font-sans shadow-premium-sm transition-colors">
      {/* Top Section: Brand Header & Navigation */}
      <div className="flex flex-col gap-6 w-full">
        {/* Brand Logo */}
        <div className="px-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shadow-premium-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5 leading-none">
                <span>revive</span>
                <span className="text-[var(--color-accent)] text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)]">
                  AI
                </span>
              </span>
              <span className="text-[9px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5 font-bold">
                OPERATING SYSTEM
              </span>
            </div>
          </Link>

          <Link
            to="/"
            title="View Public Website"
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 space-y-5 overflow-y-auto max-h-[calc(100vh-230px)]">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="px-3 text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                {group.group}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item, iIdx) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path === "/cases" && location.pathname.startsWith("/cases")) ||
                    (item.path === "/policies" && location.pathname === "/policy");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={iIdx}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] shadow-sm font-bold"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 font-bold ${
                            item.badgeColor || "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Authenticated Identity & Environment */}
      <div className="px-3 pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
        {/* Guided Product Tour Button */}
        <button
          type="button"
          onClick={() => setIsTourOpen(true)}
          className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--color-accent-subtle)] hover:bg-[var(--color-accent-subtle)]/80 text-[var(--color-accent)] border border-[var(--color-accent-border)] flex items-center justify-between text-xs font-semibold shadow-premium-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            <span>Guided Product Tour</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-bg-surface)] text-[var(--color-accent)] border border-[var(--color-accent-border)]">
            60s
          </span>
        </button>

        {/* Single Environment Source of Truth Badge */}
        <div className="px-2.5 py-1.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold truncate">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span className="truncate">{environmentLabel}</span>
          </div>
        </div>

        {/* User Identity & Sign Out Action */}
        <div className="p-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] shadow-premium-sm space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user?.name ? user.name[0] : "R"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">{user?.name || "Rohan Deshmukh"}</p>
                <p className="text-[10px] text-[var(--color-accent)] font-mono truncate">
                  {user?.role?.replace("_", " ") || "REVENUE OPERATOR"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] text-[var(--color-text-muted)] font-mono flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-1.5">
            <span className="truncate">Active Session</span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-rose-500 hover:underline font-semibold cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Guided Tour Modal */}
      <GuidedTour forceOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </aside>
  );
};
