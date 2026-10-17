import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Users,
  PlayCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Zap,
  Radio
} from "lucide-react";
import { organizationService, OnboardingStatus } from "../services/organizationService";

export const OnboardingChecklist: React.FC = () => {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("revivepay_onboarding_dismissed") === "true";
  });

  useEffect(() => {
    organizationService
      .getOnboardingStatus()
      .then((data) => setStatus(data))
      .catch(() => {});
  }, []);

  if (dismissed || !status) return null;

  // If 100% completed, don't show unless user hasn't dismissed
  const isAllComplete = status.progress_percentage === 100;

  const handleDismiss = () => {
    localStorage.setItem("revivepay_onboarding_dismissed", "true");
    setDismissed(true);
  };

  const getStepLink = (stepId: string) => {
    switch (stepId) {
      case "connect_razorpay":
        return "/settings";
      case "setup_webhook":
        return "/settings";
      case "configure_policy":
        return "/policies";
      case "invite_team":
        return "/settings";
      case "first_event":
        return "/cases";
      default:
        return "/settings";
    }
  };

  return (
    <div className="mb-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-5 shadow-premium-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Organization Setup Checklist
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold">
                {status.completed_steps > 0
                  ? `${status.completed_steps} of ${status.total_steps} Completed (${status.progress_percentage}%)`
                  : "Quick Integration (5 Steps)"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Complete these steps to fully automate failure recovery under your merchant policy limits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-canvas)] transition-colors cursor-pointer"
            title={collapsed ? "Expand Checklist" : "Collapse Checklist"}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-canvas)] transition-colors cursor-pointer"
            title="Dismiss Checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[var(--color-bg-canvas)] rounded-full h-1.5 mt-4 mb-2 overflow-hidden border border-[var(--color-border-subtle)]">
        <div
          className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${status.progress_percentage}%` }}
        ></div>
      </div>

      {/* Step Items List */}
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
          {status.steps.map((step) => (
            <Link
              key={step.id}
              to={getStepLink(step.id)}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between text-left group cursor-pointer ${
                step.completed
                  ? "bg-emerald-500/5 border-emerald-500/20 text-[var(--color-text-primary)]"
                  : "bg-[var(--color-bg-canvas)] border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-primary)]"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  {step.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] shrink-0" />
                  )}
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                      step.completed
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                    }`}
                  >
                    {step.completed ? "Done" : "Action"}
                  </span>
                </div>
                <h4 className="text-xs font-bold leading-snug group-hover:text-[var(--color-accent)] transition-colors">
                  {step.title}
                </h4>
                <p className="text-[10px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-2 mt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[10px] font-semibold text-[var(--color-accent)]">
                <span>{step.completed ? "Review Config" : "Configure Now"}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
