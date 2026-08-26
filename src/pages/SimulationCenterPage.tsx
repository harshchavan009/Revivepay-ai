import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlayCircle, Zap, ShieldAlert, Sparkles, RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { simulationService } from "../services";
import { SimulationPreset, SimulationResult } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { StatusBadge } from "../components/StatusBadge";
import { ActionBadge } from "../components/ActionBadge";
import { ConfidenceGauge } from "../components/ConfidenceGauge";

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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-400" />
            <span>Interactive Simulation & Stress Testing Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            <strong>Mode 1: Local Simulation</strong> — Generates synthetic gateway events that execute through the exact same backend domain recovery engine as real Razorpay webhooks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Unified Domain Engine
          </span>
        </div>
      </div>

      {/* Live Simulation Result Display Box */}
      {activeSimulation && (
        <div className="p-6 rounded-xl bg-[#0B0F19] border border-blue-500/40 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-mono font-bold text-slate-100 text-sm">
                Simulation Output Telemetry: {activeSimulation.case_id || activeSimulation.checkout_id || "Active"}
              </span>
              <RiskBadge level={activeSimulation.risk_level} score={activeSimulation.risk_score} showScore />
              <StatusBadge status={activeSimulation.recovery_status} />
            </div>

            {activeSimulation.case_id && (
              <Link
                to={`/cases/${activeSimulation.case_id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-900/40 transition-all self-start sm:self-auto"
              >
                <span>Deep Dive into Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-emerald-300 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeSimulation.message}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 font-bold uppercase text-[10px] block">AI Root Cause</span>
              <span className="font-semibold text-slate-200">{activeSimulation.root_cause}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 font-bold uppercase text-[10px] block mb-1">Recommended Action</span>
              <ActionBadge action={activeSimulation.recommended_action} />
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 font-bold uppercase text-[10px] block mb-1">AI Confidence</span>
              <ConfidenceGauge confidence={activeSimulation.ai_confidence} />
            </div>
          </div>

          {/* Real-time audit events produced by this simulation */}
          {activeSimulation.audit_events?.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Audit Events:</span>
              <div className="space-y-1">
                {activeSimulation.audit_events.map((ev, i) => (
                  <div key={i} className="p-2 rounded bg-slate-900/40 border border-slate-800 text-xs flex items-center justify-between font-mono">
                    <span className="text-blue-400 font-bold">{ev.action}</span>
                    <span className="text-slate-400 text-[11px] truncate max-w-md">{ev.notes}</span>
                    <span className="text-slate-500 text-[10px]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((p) => {
          const isRunning = runningPresetId === p.id;
          return (
            <div
              key={p.id}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 shadow-lg transition-all ${
                p.id === "bank_failure"
                  ? "bg-gradient-to-b from-blue-950/20 to-[#0B0F19] border-blue-500/40 hover:border-blue-400"
                  : p.id === "retry_exhaustion_escalation"
                  ? "bg-gradient-to-b from-rose-950/20 to-[#0B0F19] border-rose-500/30 hover:border-rose-400"
                  : "bg-[#0B0F19] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                    {p.type.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    ₹{p.default_amount.toLocaleString()}
                  </span>
                </div>
                <h3 className="font-bold text-slate-100 text-sm">{p.title}</h3>
                <p className="text-[11px] text-blue-400 font-mono">{p.tagline}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
              </div>

              <button
                onClick={() => handleRunSimulation(p.id, p.default_amount)}
                disabled={isRunning}
                className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 ${
                  p.id === "bank_failure"
                    ? "bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white shadow-blue-900/30"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
                }`}
              >
                {isRunning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlayCircle className="w-3.5 h-3.5" />
                )}
                <span>{isRunning ? "Simulating Workflow..." : "Trigger Simulation"}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
