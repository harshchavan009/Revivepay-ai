import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, ArrowLeft, CheckCircle2, Server } from "lucide-react";

export const PrivacyPage: React.FC = () => {
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
            <span>RevivePay Privacy Governance</span>
            <span className="text-emerald-400">PCI-DSS Compliant</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>DATA PROTECTION & PCI-DSS ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-400">Effective Date: January 1, 2026 · Compliance Standard: PCI-DSS v4.0 Level 1</p>
        </div>

        <section className="p-6 rounded-2xl bg-[#081826]/80 border border-[#163E5C] space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <span>1. Zero Primary Account Number (PAN) Retention</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            RevivePay never receives, processes, or stores unencrypted 16-digit primary account numbers (PAN), CVV security codes, or card PINs. All payment transactions are executed via tokenized payment identifiers and secure redirect tokens through authorized gateways (e.g. Razorpay).
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[#081826]/80 border border-[#163E5C] space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <span>2. Ingress Telemetry & Webhook Processing</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            When webhook events are ingested, RevivePay captures only metadata required for failure analysis: transaction amount, currency, error reason codes, customer email/name, and masked card network labels (e.g. Visa ···· 4242). Webhooks are validated using HMAC-SHA256 signatures before entering the event pipeline.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[#081826]/80 border border-[#163E5C] space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <span>3. Customer Consent & Communication</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Automated recovery prompts (via Email, SMS, or WhatsApp) are only dispatched when customer communication consent is active. Customers may opt-out from automated payment link reminders at any time, immediately halting automated recovery cycles.
          </p>
        </section>

        <div className="pt-6 border-t border-[#13354E] flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>RevivePay Security Governance</span>
          <Link to="/security" className="text-cyan-400 hover:underline">View Security Architecture →</Link>
        </div>
      </main>
    </div>
  );
};
