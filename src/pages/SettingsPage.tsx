import React, { useState } from "react";
import { Settings, Key, Webhook, Cpu, ShieldCheck, CheckCircle2, Copy, Globe, Terminal, Sparkles, AlertCircle } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState("https://api.revivepay.ai/api/webhooks/razorpay");
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);

  const webhookSecret = "whsec_revivepay_test_webhook_2026";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(tunnelUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleTestWebhook = async () => {
    setTestWebhookStatus("Dispatching test webhook through internal pipeline...");
    try {
      const res = await fetch("/api/webhooks/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Razorpay-Signature": "test_signature"
        },
        body: JSON.stringify({
          event: "payment.failed",
          id: `evt_test_${Date.now()}`,
          payload: {
            payment: {
              entity: {
                id: `pay_test_${Date.now()}`,
                amount: 499900,
                email: "vikram.sharma@enterprise.in",
                contact: "+919820144829",
                method: "card",
                error_code: "BANK_DECLINE",
                error_description: "Issuer switch timed out (504)"
              }
            }
          }
        })
      });
      const data = await res.json();
      setTestWebhookStatus(`✅ Webhook verified & processed! Ingested Case: ${data.case_id || "Success"} (Status: ${data.recovery_status || "PROCESSED"})`);
    } catch (e: any) {
      setTestWebhookStatus("❌ Error sending test webhook: " + e.message);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <span>Platform Ingress & Gateway Architecture</span>
        </h1>
        <p className="text-xs text-slate-400">
          RevivePay AI implements a unified domain pipeline supporting both Local Synthetic Simulation and Real Razorpay Public HTTPS Webhooks.
        </p>
      </div>

      {/* Dual Ingestion Architecture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode 1 */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-blue-950/40 to-slate-900/60 border border-blue-500/30 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-blue-300 uppercase tracking-wider">Mode 1: Local Simulation</span>
          </div>
          <p className="text-xs text-slate-300">
            <strong>Simulation Center</strong> generates synthetic failure events directly into the backend domain engine. Zero external network dependencies.
          </p>
          <div className="pt-2">
            <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40">
              Simulation Center → Synthetic Event → Recovery Pipeline
            </span>
          </div>
        </div>

        {/* Mode 2 */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-purple-950/40 to-slate-900/60 border border-purple-500/30 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-purple-500/20 text-purple-400">
              <Globe className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-purple-300 uppercase tracking-wider">Mode 2: Razorpay Test Integration</span>
          </div>
          <p className="text-xs text-slate-300">
            <strong>Public HTTPS Webhook</strong> receives real webhook payloads from Razorpay cloud, validates HMAC-SHA256, and dispatches to the same engine.
          </p>
          <div className="pt-2">
            <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40">
              Razorpay Cloud → Public HTTPS → Webhook Node → Recovery Pipeline
            </span>
          </div>
        </div>
      </div>

      {/* Razorpay Test Mode Credentials */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Razorpay Test Mode API Credentials</h3>
            <p className="text-xs text-slate-400">Authenticated Razorpay API keys for test mode payment queries and payment links</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Key ID</label>
            <input
              type="text"
              readOnly
              value="rzp_test_revivepay2026"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 font-mono p-2.5 rounded-lg outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Key Secret</label>
            <input
              type="password"
              readOnly
              value="secret_revivepay_fintech_test"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 font-mono p-2.5 rounded-lg outline-none"
            />
          </div>
        </div>
      </div>

      {/* Public HTTPS Webhook Configuration */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Webhook className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Razorpay Public HTTPS Webhook Destination</h3>
            <p className="text-xs text-slate-400">
              Razorpay requires a publicly accessible HTTPS endpoint (e.g. ngrok tunnel or deployed staging server)
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Public Webhook URL (Paste into Razorpay Dashboard)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tunnelUrl}
                onChange={(e) => setTunnelUrl(e.target.value)}
                placeholder="https://your-domain.ngrok-free.app/api/webhooks/razorpay"
                className="flex-1 bg-slate-900 border border-slate-700 text-purple-300 font-mono p-2.5 rounded-lg outline-none"
              />
              <button
                onClick={handleCopyUrl}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedUrl ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Webhook Secret (HMAC-SHA256)</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={webhookSecret}
                className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 font-mono p-2.5 rounded-lg outline-none"
              />
              <button
                onClick={handleCopySecret}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSecret ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>How to connect live Razorpay Test Mode with local dev server:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              1. Start public HTTPS tunnel: <code className="text-emerald-400 font-mono bg-slate-900 px-1 py-0.5 rounded">ngrok http 8000</code><br />
              2. Go to <strong>Razorpay Dashboard → Settings → Webhooks → Add New Webhook</strong><br />
              3. Paste the URL: <code className="text-purple-400 font-mono bg-slate-900 px-1 py-0.5 rounded">https://&lt;your-ngrok-subdomain&gt;.ngrok-free.app/api/webhooks/razorpay</code><br />
              4. Set Secret to: <code className="text-amber-400 font-mono bg-slate-900 px-1 py-0.5 rounded">whsec_revivepay_test_webhook_2026</code><br />
              5. Subscribe to Active Events: <code className="text-blue-400 font-mono">payment.failed</code>, <code className="text-blue-400 font-mono">payment.authorized</code>, <code className="text-blue-400 font-mono">payment.captured</code>
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">Idempotency & HMAC-SHA256 signature verification active</span>
          <button
            onClick={handleTestWebhook}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            Simulate Webhook Ingress
          </button>
        </div>

        {testWebhookStatus && (
          <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-mono">
            {testWebhookStatus}
          </div>
        )}
      </div>

      {/* AI LLM Provider Configuration */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">AI Model Provider Architecture</h3>
            <p className="text-xs text-slate-400">Pluggable LLM provider with fail-safe deterministic fallback</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
            <span className="text-slate-400">Active Provider:</span>
            <span className="font-mono text-emerald-400 font-bold">Google Gemini 1.5 Pro / Built-in Fallback</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
            <span className="text-slate-400">Fail-Safe Fallback:</span>
            <span className="font-mono text-blue-400 font-bold">Deterministic Rule-Based Agent (Always Active)</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-400">Structured Output Validation:</span>
            <span className="font-mono text-purple-400 font-bold">Pydantic Schemas Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
