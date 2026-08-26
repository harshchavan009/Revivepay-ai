import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Lock, ArrowLeft, Key, Cpu, RefreshCw, FileCode } from "lucide-react";

export const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#041018] text-slate-200 font-sans">
      {/* Header */}
      <header className="border-b border-[#13354E] bg-[#081826]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-cyan-400 font-bold text-base hover:text-cyan-300">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>RevivePay Security Architecture</span>
            <span className="text-emerald-400">SOC-2 Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SECURITY & GUARDRAILS SPECIFICATION</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Security & Policy Guardrails</h1>
          <p className="text-sm text-slate-400">Deterministic Safety Invariants · Cryptographic Hash Integrity · Secret Isolation</p>
        </div>

        <section className="p-6 rounded-2xl bg-[#081826]/80 border border-[#163E5C] space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            <span>1. Zero Frontend Secret Exposure</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            API keys for LLM providers (Anthropic Claude, Google Gemini, OpenAI) and Razorpay gateway secrets are strictly isolated within backend environment variables (<code className="text-cyan-300 font-mono">.env</code>). No client application ever receives or transmits merchant secret keys.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[#081826]/80 border border-[#163E5C] space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>2. Deterministic Risk & Policy Gateways</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            AI recommendations cannot execute directly without passing through deterministic code boundaries. The Policy Gateway enforces:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pl-2 font-mono">
            <li><strong className="text-white">Bounded Retries:</strong> Hard limit of 2 automated retry attempts before mandatory escalation.</li>
            <li><strong className="text-white">High-Value Thresholds:</strong> Payments exceeding ₹50,000 strictly require human operator sign-off.</li>
            <li><strong className="text-white">Confidence Floor:</strong> Recommendations with AI confidence below 85% automatically route to review.</li>
            <li><strong className="text-white">Whitelist Enforcement:</strong> Only 7 predefined recovery tools can ever be executed.</li>
          </ul>
        </section>

        <section className="p-6 rounded-2xl bg-[#081826]/80 border border-[#163E5C] space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>3. SHA-256 Cryptographic Hash Chaining</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every audit log entry is linked to its preceding entry via a SHA-256 hash pointer (<code className="text-amber-300 font-mono">entry_hash = SHA256(prev_hash + timestamp + actor + action)</code>). Any retroactive tampering breaks the mathematical hash chain and is immediately flagged by the verification endpoint.
          </p>
        </section>

        <div className="pt-6 border-t border-[#13354E] flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>RevivePay Autonomous Revenue Engine</span>
          <Link to="/dashboard" className="text-cyan-400 hover:underline">Go to Command Center →</Link>
        </div>
      </main>
    </div>
  );
};
