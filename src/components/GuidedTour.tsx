import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  LayoutDashboard,
  ShieldAlert,
  CheckCircle2,
  FlaskConical,
  FileCheck2,
  KeyRound,
  ExternalLink
} from "lucide-react";
import { safeStorage } from "../utils/storage";

interface TourStep {
  title: string;
  subtitle: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  keyFeatures: string[];
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Executive Dashboard",
    subtitle: "Real-Time Revenue Recovery Command Center",
    path: "/dashboard",
    icon: LayoutDashboard,
    badge: "Step 1 of 5",
    description:
      "Monitor live recovered revenue, active cases at risk, and autonomous recovery rates derived directly from your gateway telemetry.",
    keyFeatures: [
      "Strict zero-drift arithmetic invariants matching database reality",
      "Real-time Server-Sent Events (SSE) streaming live recovery decisions",
      "Interactive Revenue Analytics chart with time range filters"
    ]
  },
  {
    title: "Recovery Case Registry",
    subtitle: "AI Diagnosis & 4-Factor Risk Engine",
    path: "/cases",
    icon: ShieldAlert,
    badge: "Step 2 of 5",
    description:
      "Every failed transaction is ingested, mapped to canonical taxonomy, and diagnosed using Claude 3.5 Sonnet & Gemini 1.5 Pro.",
    keyFeatures: [
      "Dynamic AI root-cause diagnosis with full raw prompt/output audit trails",
      "4-Factor weighted risk scoring (0-100 index)",
      "Multi-source filtering (Real Gateway Webhooks vs Synthetic Simulations)"
    ]
  },
  {
    title: "Approval Center & High-Value Gate",
    subtitle: "Human-in-the-Loop Governance",
    path: "/cases?approval_status=PENDING",
    icon: KeyRound,
    badge: "Step 3 of 5",
    description:
      "Deterministic safety rules route high-value transactions (≥ ₹50,000) to human operators with mandatory Step-Up Re-Authentication.",
    keyFeatures: [
      "MFA OTP and operator credential step-up authorization modal",
      "Server-side RBAC enforcement with 403 prevention for unauthorized roles",
      "One-click execution of policy-approved automated recovery actions"
    ]
  },
  {
    title: "Simulation Lab",
    subtitle: "Synthetic Stress Testing & Chaos Engineering",
    path: "/simulation",
    icon: FlaskConical,
    badge: "Step 4 of 5",
    description:
      "Simulate high-concurrency bank switch latency, issuer outages, and dunning workflows without touching live customer accounts.",
    keyFeatures: [
      "Pre-configured Chaos Presets (HDFC Switch Outage, Salary Day Surge)",
      "Real-time recovery yield and prevented chargeback calculations",
      "Clear provenance isolation separating test simulation from live webhooks"
    ]
  },
  {
    title: "Immutable Hash-Chained Audit Log",
    subtitle: "Cryptographic SHA-256 Ledger",
    path: "/audit",
    icon: FileCheck2,
    badge: "Step 5 of 5",
    description:
      "Every state change, AI diagnosis, operator sign-off, and gateway webhook is hashed into an append-only cryptographic chain.",
    keyFeatures: [
      "Block-by-block cryptographic verification from Genesis to Head",
      "Zero black-box logging of raw LLM prompts, latencies, and responses",
      "Instant compliance export for SOC-2 and regulatory audits"
    ]
  }
];

interface GuidedTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ forceOpen = false, onClose }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }
    const hasSeen = safeStorage.getItem("revivepay_tour_seen");
    if (!hasSeen) {
      setIsOpen(true);
      setCurrentStep(0);
    }
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    safeStorage.setItem("revivepay_tour_seen", "true");
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      navigate(TOUR_STEPS[nextStep].path);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      navigate(TOUR_STEPS[prevStep].path);
    }
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStep(index);
    navigate(TOUR_STEPS[index].path);
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-xl bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] rounded-2xl shadow-premium-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-center justify-center text-[var(--color-accent)] shadow-premium-sm">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]">
                  {step.badge}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                  60s Guided Tour
                </span>
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer"
            title="Dismiss Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-[var(--color-accent)] font-mono uppercase tracking-wide">
              {step.subtitle}
            </h4>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Key Feature Highlights */}
          <div className="space-y-2 p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-mono">
              Key Capabilities in this View:
            </span>
            <div className="space-y-2">
              {step.keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[var(--color-text-primary)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Progress Indicator Bar */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleJumpToStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? "bg-[var(--color-accent)] shadow-premium-sm"
                    : idx < currentStep
                    ? "bg-emerald-500/60 hover:bg-emerald-500"
                    : "bg-[var(--color-border)] hover:bg-[var(--color-border-hover)]"
                }`}
                title={s.title}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] font-medium cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] text-xs font-semibold border border-[var(--color-border)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-premium-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next View"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
