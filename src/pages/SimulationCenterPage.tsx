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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#13354E] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              FAILURE SIMULATION LAB
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              UNIFIED DOMAIN ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-cyan-400" />
            <span>Interactive Simulation & Stress Testing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Generates synthetic gateway failure events that execute through the exact same backend domain recovery engine as real Razorpay webhooks.
          </p>
        </div>
      </div>

      {/* Live Simulation Result Display Box */}
      {activeSimulation && (
        <div className="p-6 rounded-2xl bg-[#081826] border border-cyan-500/50 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#163E5C] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-mono font-bold text-white text-sm">
                Simulation Telemetry: {activeSimulation.case_id || activeSimulation.checkout_id || "Active"}
              </span>
              <RiskBadge level={activeSimulation.risk_level} score={activeSimulation.risk_score} showScore />
              <StatusBadge status={activeSimulation.recovery_status} />
            </div>

            {activeSimulation.case_id && (
              <Link
                to={`/cases/${activeSimulation.case_id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto"
              >
                <span>Deep Dive into Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[#051420] border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeSimulation.message}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#051420] border border-[#143952]">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">AI Root Cause</span>
              <span className="font-semibold text-white">{activeSimulation.root_cause || "Temporary Bank Switch Outage"}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#051420] border border-[#143952]">
              <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Recommended Action</span>
              <ActionBadge action={activeSimulation.recommended_action} />
            </div>
            <div className="p-3.5 rounded-xl bg-[#051420] border border-[#143952]">
              <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">AI Confidence</span>
              <ConfidenceGauge confidence={activeSimulation.ai_confidence} />
            </div>
          </div>
        </div>
      )}

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((p) => {
          const isRunning = runningPresetId === p.id || runningPresetId === p.type;
          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-[#081826]/90 border border-[#163E5C] hover:border-cyan-500/50 flex flex-col justify-between space-y-4 shadow-xl transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[#0B253A] text-cyan-300 font-bold border border-cyan-500/30">
                    {p.type.replace(/_/g, " ")}
                  </span>
                  <span className="font-bold text-xs text-amber-400">
                    {formatINR(p.default_amount)}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm">{p.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
              </div>

              <button
                onClick={() => handleRunSimulation(p.type || p.id, p.default_amount)}
                disabled={isRunning}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
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
