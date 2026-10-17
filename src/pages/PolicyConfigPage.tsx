import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle2, ShieldCheck, AlertTriangle, Lock } from "lucide-react";
import { policyService } from "../services";
import { PolicyConfig } from "../types";
import { formatINR } from "../data/mockData";

const DEFAULT_CONFIG: PolicyConfig = {
  id: "default-policy",
  merchant_id: "merchant_live_01",
  max_auto_retries: 3,
  max_auto_amount: 10000,
  high_value_approval_threshold: 50000,
  min_ai_confidence: 0.85,
  allow_customer_contact: true,
  recovery_time_window_hours: 72,
  allowed_actions: ["RETRY", "SMART_ROUTING", "CUSTOMER_LINK"],
  updated_at: new Date().toISOString(),
};

export const PolicyConfigPage: React.FC = () => {
  const [config, setConfig] = useState<PolicyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    policyService.getConfig()
      .then((data) => {
        setConfig(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setConfig(DEFAULT_CONFIG);
        setErrorMessage("Loaded default policy parameters. Backend connection will be re-attempted on save.");
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await policyService.updateConfig(config);
      setConfig(updated);
      setSuccessMessage("Deterministic policy parameters saved and live across all recovery engines.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save policy safeguards. Please check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16 max-w-4xl font-sans animate-pulse">
        <div className="h-8 bg-[var(--color-bg-surface)] rounded-md w-64"></div>
        <div className="h-64 bg-[var(--color-bg-surface)] rounded-lg"></div>
      </div>
    );
  }

  const activeConfig = config || DEFAULT_CONFIG;

  return (
    <div className="space-y-6 pb-16 max-w-4xl font-sans">
      <div className="border-b border-[var(--color-border-subtle)] pb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
            GOVERNANCE & SAFETY
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
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

      {errorMessage && (
        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-premium-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg p-6 sm:p-8 space-y-6 shadow-premium-sm">
        {/* Max Auto Retries */}
        <div className="space-y-2 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-bold text-[var(--color-text-primary)]">Maximum Automatic Retries</label>
              <p className="text-xs text-[var(--color-text-secondary)]">Number of automatic payment retry attempts allowed before case escalation.</p>
            </div>
            <span className="font-mono font-bold text-sm text-[var(--color-accent)] px-3 py-1 bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] rounded-md">
              {activeConfig.max_auto_retries} attempts
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={4}
            value={activeConfig.max_auto_retries}
            onChange={(e) => setConfig({ ...activeConfig, max_auto_retries: parseInt(e.target.value) })}
            className="w-full h-2 bg-[var(--color-bg-canvas)] rounded-md appearance-none cursor-pointer accent-[var(--color-accent)]"
          />
        </div>

        {/* Max Auto Amount Limit */}
        <div className="space-y-2 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-bold text-[var(--color-text-primary)]">Maximum Automated Action Amount (INR)</label>
              <p className="text-xs text-[var(--color-text-secondary)]">Transactions above this value require human operator approval before execution.</p>
            </div>
            <span className="font-bold text-sm text-amber-600 dark:text-amber-400 px-3 py-1 bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] rounded-md font-mono">
              {formatINR(activeConfig.max_auto_amount)}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={25000}
            step={1000}
            value={activeConfig.max_auto_amount}
            onChange={(e) => setConfig({ ...activeConfig, max_auto_amount: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[var(--color-bg-canvas)] rounded-md appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* High-Value Approval Threshold */}
        <div className="space-y-2 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-bold text-[var(--color-text-primary)]">High-Value Approval Threshold (INR)</label>
              <p className="text-xs text-[var(--color-text-secondary)]">Mandatory operator sign-off threshold regardless of model confidence.</p>
            </div>
            <span className="font-bold text-sm text-blue-600 dark:text-blue-400 px-3 py-1 bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] rounded-md font-mono">
              {formatINR(activeConfig.high_value_approval_threshold)}
            </span>
          </div>
          <input
            type="range"
            min={25000}
            max={100000}
            step={5000}
            value={activeConfig.high_value_approval_threshold}
            onChange={(e) => setConfig({ ...activeConfig, high_value_approval_threshold: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[var(--color-bg-canvas)] rounded-md appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* AI Confidence Minimum */}
        <div className="space-y-2 border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-bold text-[var(--color-text-primary)]">Minimum AI Confidence Score</label>
              <p className="text-xs text-[var(--color-text-secondary)]">If AI root-cause confidence falls below this threshold, action is blocked or routed to human operator.</p>
            </div>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] rounded-md">
              {Math.round(activeConfig.min_ai_confidence * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.7}
            max={0.98}
            step={0.01}
            value={activeConfig.min_ai_confidence}
            onChange={(e) => setConfig({ ...activeConfig, min_ai_confidence: parseFloat(e.target.value) })}
            className="w-full h-2 bg-[var(--color-bg-canvas)] rounded-md appearance-none cursor-pointer accent-emerald-500"
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
            onClick={() => setConfig({ ...activeConfig, allow_customer_contact: !activeConfig.allow_customer_contact })}
            className={`w-12 h-6 rounded-md transition-colors relative cursor-pointer border border-[var(--color-border)] ${
              activeConfig.allow_customer_contact ? "bg-[var(--color-accent)]" : "bg-[var(--color-bg-input)]"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-sm bg-white absolute top-0.5 transition-transform ${
                activeConfig.allow_customer_contact ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Policy Rules..." : "Save Policy Safeguards"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
