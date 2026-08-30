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
  FileCode,
  RotateCcw,
  Cpu,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMetrics } from "../context/MetricsContext";
import { simulationService } from "../services";
import { GuidedTour } from "./GuidedTour";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalCasesCount, awaitingApprovalCount, environmentLabel } = useMetrics();
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
        { label: "System Evaluation", icon: Cpu, path: "/evaluation" },
        { label: "Immutable Audit Log", icon: Clock, path: "/audit" },
        { label: "Policy Guardrails", icon: Lock, path: "/policies" },
        { label: "Engineering Notes", icon: FileCode, path: "/changelog" },
        { label: "Gateway & Webhooks", icon: Settings, path: "/settings" },
      ]
    }
  ];

  const renderContent = () => (
    <div className="flex flex-col justify-between h-full py-4 select-none">
      {/* Top Section: Brand Header & Navigation */}
      <div className="flex flex-col gap-5 w-full">
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

          <div className="flex items-center gap-1">
            <Link
              to="/"
              title="View Public Website"
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer"
                aria-label="Close mobile sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 space-y-4 overflow-y-auto max-h-[calc(100vh-230px)]">
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

                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={iIdx}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? "bg-[var(--color-accent)] text-white shadow-premium-sm"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconComponent
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? "text-white" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]"
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
          className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--color-accent-subtle)] hover:bg-[var(--color-accent-subtle)]/80 text-[var(--color-accent)] border border-[var(--color-accent-border)] flex items-center justify-between text-xs font-semibold shadow-premium-sm transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] outline-none"
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

        {/* Reset Demo Data Button */}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-semibold shadow-premium-sm transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] outline-none"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className={`w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors ${isResetting ? "animate-spin" : ""}`} />
            <span>Reset Demo Data</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
            Seed
          </span>
        </button>

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
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
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

      {/* Reset Demo Data Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in">
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--color-text-primary)]">Reset Demo Dataset?</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Restore pristine sandbox baseline</p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              This will reseed the sandbox database to its pristine state, re-generate all mock transactions, clear custom overrides, and re-anchor the cryptographic SHA-256 audit ledger.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    await simulationService.resetDemoData();
                    setShowResetConfirm(false);
                    window.location.reload();
                  } catch (e: any) {
                    alert("Failed to reset demo: " + e.message);
                  } finally {
                    setIsResetting(false);
                  }
                }}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-premium-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                <span>{isResetting ? "Resetting..." : "Confirm Reset"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] flex-col justify-between shrink-0 z-30 font-sans shadow-premium-sm transition-colors h-full">
        {renderContent()}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative w-72 max-w-[85vw] bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] flex flex-col justify-between z-10 shadow-2xl h-full animate-in slide-in-from-left duration-200">
            {renderContent()}
          </aside>
        </div>
      )}
    </>
  );
};
