import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { policyService } from "../services";
import { PolicyConfig } from "../types";

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
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <span>Deterministic Policy & Safety Gateway Configuration</span>
        </h1>
        <p className="text-xs text-slate-400">
          Configure hard limits, automatic retry boundaries, and human authorization thresholds enforced by deterministic code.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
        {/* Max Auto Retries */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-semibold text-slate-200">Maximum Automatic Retries</label>
              <p className="text-xs text-slate-400">Number of automatic payment retry attempts allowed before case escalation.</p>
            </div>
            <span className="font-mono font-bold text-base text-blue-400 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg">
              {config.max_auto_retries} attempts
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={4}
            value={config.max_auto_retries}
            onChange={(e) => setConfig({ ...config, max_auto_retries: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Max Auto Amount Limit */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-semibold text-slate-200">Maximum Automated Action Amount (INR)</label>
              <p className="text-xs text-slate-400">Transactions above this value require human operator approval before execution.</p>
            </div>
            <span className="font-mono font-bold text-base text-amber-400 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg">
              ₹{config.max_auto_amount.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={25000}
            step={1000}
            value={config.max_auto_amount}
            onChange={(e) => setConfig({ ...config, max_auto_amount: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* High-Value Approval Threshold */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-semibold text-slate-200">Senior High-Value Approval Threshold (INR)</label>
              <p className="text-xs text-slate-400">Enterprise tier threshold where senior sign-off is mandatory.</p>
            </div>
            <span className="font-mono font-bold text-base text-rose-400 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg">
              ₹{config.high_value_approval_threshold.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={25000}
            max={100000}
            step={5000}
            value={config.high_value_approval_threshold}
            onChange={(e) => setConfig({ ...config, high_value_approval_threshold: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* Min AI Confidence */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-semibold text-slate-200">Minimum AI Confidence Score Gate</label>
              <p className="text-xs text-slate-400">If AI diagnostic confidence is below this score, action routes to operator review.</p>
            </div>
            <span className="font-mono font-bold text-base text-indigo-400 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg">
              {Math.round(config.min_ai_confidence * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.6}
            max={0.95}
            step={0.05}
            value={config.min_ai_confidence}
            onChange={(e) => setConfig({ ...config, min_ai_confidence: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Customer Contact Consent Toggle */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <label className="text-sm font-semibold text-slate-200">Allow Customer Recovery Messaging</label>
            <p className="text-xs text-slate-400">Permits issuing personalized payment links and update notifications.</p>
          </div>
          <button
            type="button"
            onClick={() => setConfig({ ...config, allow_customer_contact: !config.allow_customer_contact })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              config.allow_customer_contact ? "bg-emerald-500" : "bg-slate-800"
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
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Policy..." : "Save Policy Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
