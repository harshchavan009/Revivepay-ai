import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle2, ShieldCheck, AlertTriangle, Lock } from "lucide-react";
import { policyService } from "../services";
import { PolicyConfig } from "../types";
import { formatINR } from "../data/mockData";

export const PolicyConfigPage: React.FC = () => {
  const [config, setConfig] = useState<PolicyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    policyService.getConfig().then((data) => {
      setConfig(data);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSaving(true);
    try {
      const updated = await policyService.updateConfig(config);
      setConfig(updated);
      setSuccessMessage("Deterministic policy parameters saved and live across all recovery engines.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!config) return null;

  return (
    <div className="space-y-6 pb-16 max-w-4xl font-sans">
      <div className="border-b border-[var(--color-border-subtle)] pb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
            GOVERNANCE & SAFETY
          </span>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
            DETERMINISTIC LIMITS
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
          <Lock className="w-6 h-6 text-[var(--color-accent)]" />
          <span>Deterministic Policy & Safety Gateway Configuration</span>
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          Configure hard limits, automatic retry boundaries, and human authorization thresholds enforced by deterministic code.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-premium-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-premium-sm">
        {/* Max Auto Retries */}
        <div className="space-y-2 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-bold text-[var(--color-text-primary)]">Maximum Automatic Retries</label>
              <p className="text-xs text-[var(--color-text-secondary)]">Number of automatic payment retry attempts allowed before case escalation.</p>
            </div>
            <span className="font-mono font-bold text-sm text-[var(--color-accent)] px-3 py-1 bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] rounded-xl">
              {config.max_auto_retries} attempts
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={4}
            value={config.max_auto_retries}
            onChange={(e) => setConfig({ ...config, max_auto_retries: parseInt(e.target.value) })}
            className="w-full h-2 bg-[var(--color-bg-canvas)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
          />
        </div>

        {/* Max Auto Amount Limit */}
        <div className="space-y-2 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-bold text-[var(--color-text-primary)]">Maximum Automated Action Amount (INR)</label>
              <p className="text-xs text-[var(--color-text-secondary)]">Transactions above this value require human operator approval before execution.</p>
            </div>
            <span className="font-bold text-sm text-amber-600 dark:text-amber-400 px-3 py-1 bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] rounded-xl font-mono">
              {formatINR(config.max_auto_amount)}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={25000}
            step={1000}
            value={config.max_auto_amount}
            onChange={(e) => setConfig({ ...config, max_auto_amount: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[var(--color-bg-canvas)] rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* High-Value Approval Threshold */}
        <div className="space-y-2 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-bold text-[var(--color-text-primary)]">High-Value Approval Threshold (INR)</label>
              <p className="text-xs text-[var(--color-text-secondary)]">Mandatory operator sign-off threshold regardless of model confidence.</p>
            </div>
            <span className="font-bold text-sm text-purple-600 dark:text-purple-400 px-3 py-1 bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] rounded-xl font-mono">
              {formatINR(config.high_value_approval_threshold)}
            </span>
          </div>
          <input
            type="range"
            min={25000}
            max={100000}
            step={5000}
            value={config.high_value_approval_threshold}
            onChange={(e) => setConfig({ ...config, high_value_approval_threshold: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[var(--color-bg-canvas)] rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* AI Confidence Minimum */}
        <div className="space-y-2 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-bold text-[var(--color-text-primary)]">Minimum AI Confidence Score</label>
              <p className="text-xs text-[var(--color-text-secondary)]">If AI root-cause confidence falls below this threshold, action is blocked or routed to human operator.</p>
            </div>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] rounded-xl">
              {Math.round(config.min_ai_confidence * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.7}
            max={0.98}
            step={0.01}
            value={config.min_ai_confidence}
            onChange={(e) => setConfig({ ...config, min_ai_confidence: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[var(--color-bg-canvas)] rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Customer Contact Permission Toggle */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-6">
          <div>
            <label className="text-sm font-bold text-[var(--color-text-primary)]">Allow Direct Customer Communication</label>
            <p className="text-xs text-[var(--color-text-secondary)]">Permits sending 1-click WhatsApp payment links and card update notifications.</p>
          </div>
          <button
            type="button"
            onClick={() => setConfig({ ...config, allow_customer_contact: !config.allow_customer_contact })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              config.allow_customer_contact ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                config.allow_customer_contact ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all flex items-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Policy Rules..." : "Save Policy Safeguards"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
