import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlayCircle, Zap, ShieldAlert, Sparkles, RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, XCircle, FlaskConical } from "lucide-react";
import { simulationService } from "../services";
import { SimulationPreset, SimulationResult } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { StatusBadge } from "../components/StatusBadge";
import { ActionBadge } from "../components/ActionBadge";
import { ConfidenceGauge } from "../components/ConfidenceGauge";
import { formatINR } from "../data/mockData";

export const SimulationCenterPage: React.FC = () => {
  const [presets, setPresets] = useState<SimulationPreset[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<SimulationResult | null>(null);
  const [runningPresetId, setRunningPresetId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");

  useEffect(() => {
    simulationService.getPresets().then(setPresets);
  }, []);

  const handleRunSimulation = async (scenario: string, defaultAmt?: number) => {
    setRunningPresetId(scenario);
    setActiveSimulation(null);
    try {
      const amt = customAmount ? parseFloat(customAmount) : defaultAmt;
      const result = await simulationService.triggerSimulation(scenario, amt);
      setActiveSimulation(result);
    } catch (e: any) {
      alert("Simulation error: " + e.message);
    } finally {
      setRunningPresetId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              FAILURE SIMULATION LAB
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              UNIFIED DOMAIN ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Interactive Simulation & Stress Testing</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Generates synthetic gateway failure events that execute through the exact same backend domain recovery engine as real Razorpay webhooks.
          </p>
        </div>
      </div>

      {/* Live Simulation Result Display Box */}
      {activeSimulation && (
        <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-accent)] shadow-premium-md space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-mono font-bold text-[var(--color-text-primary)] text-sm">
                Simulation Telemetry: {activeSimulation.case_id || activeSimulation.checkout_id || "Active"}
              </span>
              <RiskBadge level={activeSimulation.risk_level} score={activeSimulation.risk_score} showScore />
              <StatusBadge status={activeSimulation.recovery_status} />
            </div>

            {activeSimulation.case_id && (
              <Link
                to={`/cases/${activeSimulation.case_id}`}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all self-start sm:self-auto"
              >
                <span>Deep Dive into Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{activeSimulation.message}</span>
          </div>

          {/* B.1: Demonstrable Policy Override Banner */}
          {activeSimulation.overrode_ai_recommendation && (
            <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/50 text-xs text-amber-900 dark:text-amber-200 space-y-2 shadow-premium-sm">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <span>Deterministic Policy Overrode AI Recommendation</span>
              </div>
              <p className="font-mono text-[11px] leading-relaxed">
                {activeSimulation.ai_override_reason ||
                  "AI recommended auto-retry (94% confidence) — blocked by policy: exceeds ₹10,000 automated-action limit. Routed to Human-in-the-Loop regardless of model confidence."}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 font-mono text-[10px] font-bold text-amber-900 dark:text-amber-200 border border-amber-500/30">
                  AI Proposal: {activeSimulation.ai_original_recommendation || "retry_payment (94% conf)"}
                </span>
                <span className="text-amber-500 font-bold">➔</span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-800 dark:text-rose-200 font-mono text-[10px] font-bold border border-rose-500/30">
                  Policy Gate Decision: REVIEW_REQUIRED (Human-in-the-Loop)
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] ml-auto">
                  Audit: <code className="text-amber-600 dark:text-amber-400 font-bold">recovery.policy.overrode_ai_recommendation</code>
                </span>
              </div>
            </div>
          )}

          {/* B.2: Demonstrable Multi-Tier Fallback Attribution */}
          {activeSimulation.model_name?.includes("gemini") && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between gap-2 shadow-premium-sm flex-wrap">
              <span className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Reasoning generated by: <strong className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Gemini 1.5 Pro (fallback)</strong></span>
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/30">
                Primary Claude Provider Latency / Timeout Failover Trigger
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-text-muted)] font-bold uppercase text-[10px] block">AI Root Cause</span>
              <span className="font-semibold text-[var(--color-text-primary)] mt-0.5 block">{activeSimulation.root_cause || "Temporary Bank Switch Outage"}</span>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-text-muted)] font-bold uppercase text-[10px] block mb-1.5">Recommended Action</span>
              <ActionBadge action={activeSimulation.recommended_action} />
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-text-muted)] font-bold uppercase text-[10px] block mb-1.5">AI Confidence</span>
              <ConfidenceGauge confidence={activeSimulation.ai_confidence} />
            </div>
          </div>
        </div>
      )}

      {/* Presets Grid (+20% whitespace, real elevation) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {presets.map((p) => {
          const isRunning = runningPresetId === p.id || runningPresetId === p.type;
          return (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] flex flex-col justify-between space-y-4 shadow-premium-sm transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase px-2.5 py-0.5 rounded-md bg-[var(--color-bg-canvas)] text-[var(--color-accent)] font-bold border border-[var(--color-border-subtle)]">
                    {p.type.replace(/_/g, " ")}
                  </span>
                  <span className="font-bold text-xs text-amber-600 dark:text-amber-400 font-mono">
                    {formatINR(p.default_amount)}
                  </span>
                </div>
                <h3 className="font-bold text-[var(--color-text-primary)] text-sm">{p.title}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{p.description}</p>
              </div>

              <button
                onClick={() => handleRunSimulation(p.type || p.id, p.default_amount)}
                disabled={isRunning}
                className="w-full py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isRunning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlayCircle className="w-3.5 h-3.5" />
                )}
                <span>{isRunning ? "Simulating Ingress..." : "Trigger Simulation"}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
