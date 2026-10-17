import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Server,
  FileText,
  UserCheck,
  Scale,
  Clock,
  Building2,
  Mail,
  AlertCircle
} from "lucide-react";
import { Footer } from "../components/Footer";

export const PrivacyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("scope");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItems = [
    { id: "scope", label: "1. Fiduciary Scope" },
    { id: "pci", label: "2. Zero PAN Policy" },
    { id: "telemetry", label: "3. Ingress Telemetry" },
    { id: "consent", label: "4. Consent & Opt-Out" },
    { id: "dpdp", label: "5. DPDP Act 2023 Rights" },
    { id: "rbi", label: "6. RBI Mandate & TAT" },
    { id: "ai-transparency", label: "7. AI Governance" },
    { id: "retention", label: "8. Retention & CERT-In" },
    { id: "grievance", label: "9. Grievance Officer" }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] font-sans flex flex-col justify-between transition-colors">
      {/* Header */}
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[var(--color-accent)] font-bold text-xs uppercase tracking-wider hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Application</span>
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs text-[var(--color-text-secondary)]">
            <span className="hidden sm:inline">Statutory Privacy Policy</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              DPDP Act 2023 Compliant
            </span>
          </div>
        </div>
      </header>

      {/* Regulatory Draft Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 text-center text-xs font-semibold text-amber-700 dark:text-amber-400">
        <span>This page is a draft for regulatory and legal review prior to commercial launch.</span>
      </div>

      {/* Hero Banner */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-10 px-6 transition-colors">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] font-mono text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>DIGITAL PERSONAL DATA PROTECTION (DPDP) ACT 2023 SPECIFICATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            RevivePay Privacy Governance & Data Protection Policy
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Effective Date: January 1, 2026 | Last Revised: October 18, 2026 | Governance Reference: DPDP Act 2023, RBI Master Direction on Digital Payment Security Controls. Card data is handled entirely by Razorpay; RevivePay never sees or stores card numbers.
          </p>
        </div>
      </div>

      {/* Main Content with Sticky Sidebar */}
      <main className="max-w-5xl mx-auto px-6 py-10 flex-1 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="hidden md:block col-span-1">
          <div className="sticky top-24 space-y-1 p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm">
            <div className="px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider font-mono border-b border-[var(--color-border-subtle)]">
              Policy Sections
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left px-3 py-2 rounded text-xs transition-colors cursor-pointer ${
                  activeSection === item.id
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold border border-[var(--color-accent-border)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Policy Body */}
        <div className="col-span-1 md:col-span-3 space-y-8">
          {/* Section 1: Scope */}
          <section id="scope" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Building2 className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                1. Data Fiduciary Scope & Role Definitions
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                Under the <strong>Digital Personal Data Protection (DPDP) Act, 2023 (India)</strong>, RevivePay AI operates primarily as a <strong>Data Processor</strong> on behalf of onboarding enterprise merchants (the <strong>Data Fiduciary</strong>), and as a direct Data Fiduciary with respect to merchant administrative accounts, operator logs, and platform telemetry.
              </p>
              <p>
                RevivePay processes digital personal data strictly for lawful, explicitly specified purposes: evaluating payment failure error codes, calculating dynamic recovery likelihood, verifying transaction settlement status, orchestrating policy-bounded retry sequences, and fulfilling statutory grievance obligations.
              </p>
            </div>
          </section>

          {/* Section 2: Zero PAN */}
          <section id="pci" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Lock className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                2. Zero Primary Account Number (PAN) Retention Policy
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                RevivePay maintains a strict <strong>Zero Cardholder Data Environment (Zero-CDE) footprint</strong> in accordance with <strong>PCI-DSS v4.0 Handling Standards</strong> and RBI Tokenisation Mandates (RBI/2021-22/96 DPSS.CO.PD No.S-516/02-14-003/2021-22):
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-text-primary)]">
                <li>RevivePay never receives, processes, transmits, or stores plaintext 16-digit Primary Account Numbers (PANs).</li>
                <li>RevivePay never stores Card Verification Values (CVV/CVC), ATM PINs, OTP codes, or biometric authentication factors.</li>
                <li>All payment interactions are completed via tokenized payment IDs, masked card schemes (e.g. Visa ending in 4242), or signed redirect URLs provided by authorized acquiring gateways (Razorpay).</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Telemetry */}
          <section id="telemetry" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Server className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                3. Ingress Telemetry & Webhook Cryptographic Verification
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                When payment events fail at the gateway level, ingress webhooks deliver bounded telemetry to RevivePay:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
                  <div className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">Captured Data Points</div>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Transaction amount (INR), currency, timestamp, gateway failure code (e.g. BAD_REQUEST_AUTHENTICATION_TIMEOUT), masked customer name, and masked email.
                  </p>
                </div>
                <div className="p-3 rounded bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
                  <div className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">Cryptographic Safeguard</div>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Every webhook payload is verified using HMAC-SHA256 signature digests and payload hash checks before any agent assessment begins.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Consent & Opt-Out */}
          <section id="consent" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                4. Data Principal Consent & Universal Opt-Out
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                In compliance with Section 6 of the DPDP Act 2023, automated customer communication (SMS reminders, WhatsApp notifications, email payment links) is permitted only where lawful consent exists or where requested by the customer to resolve a broken checkout.
              </p>
              <div className="p-3.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Immediate Withdrawal Mechanism</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Every recovery message includes an explicit, single-click opt-out link. When triggered, customer record consent is immediately flipped to False, canceling any pending automated dunning actions within 60 seconds.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: DPDP Rights */}
          <section id="dpdp" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Scale className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                5. Statutory Rights of the Data Principal
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                Under Chapter III of the DPDP Act 2023, every Data Principal whose information is processed by RevivePay possesses the following enforceable statutory rights:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
                  <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">Right to Information & Summary</span>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">Request a comprehensive summary of personal data being processed and identities of all processing entities.</p>
                </div>
                <div className="p-3 rounded bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
                  <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">Right to Correction & Erasure</span>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">Rectify inaccurate personal data or request deletion of data that is no longer required for recovery or tax compliance.</p>
                </div>
                <div className="p-3 rounded bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
                  <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">Right to Grievance Redressal</span>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">Avail convenient redressal of grievances through our designated statutory Grievance Officer within 72 hours.</p>
                </div>
                <div className="p-3 rounded bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
                  <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">Right to Nominate</span>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">Nominate an individual who, in the event of death or incapacity, shall exercise data rights on the principal's behalf.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: RBI Mandates & TAT */}
          <section id="rbi" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Clock className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                6. RBI E-Mandate Governance & Harmonization of TAT
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                RevivePay operates within the strict parameters of Reserve Bank of India circulars:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-text-primary)]">
                <li>
                  <strong>Turnaround Time (TAT) Framework:</strong> Under RBI Circular DPSS.CO.PD No.629/02.01.014/2019-20, failed transactions must be reversed within T+1 days for UPI and T+5 days for Cards. RevivePay tracks resolution deadlines in real-time, calculating statutory compensation (Rs. 100/day) for merchant compliance audits.
                </li>
                <li>
                  <strong>Recurring E-Mandates:</strong> Pre-debit notifications must be transmitted at least 24 hours prior to actual debit. Transactions exceeding Rs. 15,000 require Additional Factor Authentication (AFA).
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7: AI Governance */}
          <section id="ai-transparency" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <FileText className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                7. Automated AI Processing & Non-Discretionary Guardrails
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                RevivePay utilizes multi-tier AI models (Claude 3.5 Sonnet, Gemini 1.5 Pro, and deterministic decision engines) exclusively to analyze technical failure root causes. 
              </p>
              <p>
                Crucially, AI agents <strong>cannot independently execute arbitrary financial actions</strong>. All proposed actions are passed through strict policy gateway rules (e.g. maximum 2 auto-retries, auto-recovery capped below merchant thresholds, mandatory human approval for cases exceeding high-value limits). Every diagnosis is cryptographically logged with root-cause rationales and confidence scores.
              </p>
            </div>
          </section>

          {/* Section 8: Retention & CERT-In */}
          <section id="retention" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Server className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                8. Data Retention, Localization & CERT-In Compliance
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                In accordance with <strong>CERT-In Cyber Security Directions (No. 20(3)/2022-CERT-In)</strong> and RBI payment localization mandates, transaction logs and immutable audit records are stored within secure cloud infrastructure in India.
              </p>
              <p>
                System logs and immutable audit trail records are retained for a minimum statutory period of 180 days to support forensic audits, fraud detection, and regulatory inspection. After the mandatory retention period, non-essential telemetry is permanently purged.
              </p>
            </div>
          </section>

          {/* Section 9: Grievance Officer */}
          <section id="grievance" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Mail className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                9. Statutory Grievance Redressal Officer
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                In compliance with Section 19 of the DPDP Act 2023 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the designated Grievance Officer for RevivePay AI is:
              </p>
              <div className="p-4 rounded bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-2 font-mono text-xs">
                <div><strong className="text-[var(--color-text-primary)]">Officer Name:</strong> Harsh Chavan</div>
                <div><strong className="text-[var(--color-text-primary)]">Designation:</strong> Data Protection & Grievance Redressal Officer</div>
                <div><strong className="text-[var(--color-text-primary)]">Organization:</strong> RevivePay AI Systems</div>
                <div><strong className="text-[var(--color-text-primary)]">Direct Email:</strong> <a href="mailto:grievance@revivepay.ai" className="text-[var(--color-accent)] hover:underline">grievance@revivepay.ai</a></div>
                <div><strong className="text-[var(--color-text-primary)]">Alternate Contact:</strong> <a href="mailto:harshchavan1030@gmail.com" className="text-[var(--color-accent)] hover:underline">harshchavan1030@gmail.com</a></div>
                <div><strong className="text-[var(--color-text-primary)]">Statutory Response TAT:</strong> Acknowledgment within 24 hours; complete resolution within 72 business hours.</div>
              </div>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="pt-6 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--color-text-secondary)] font-mono">
            <span>RevivePay Autonomous Revenue Protection</span>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="text-[var(--color-accent)] hover:underline">
                Terms of Service →
              </Link>
              <Link to="/security" className="text-[var(--color-accent)] hover:underline">
                Security Architecture →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
