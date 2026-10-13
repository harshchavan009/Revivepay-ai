import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Scale,
  Clock,
  AlertTriangle,
  Building2,
  Layers,
  HelpCircle
} from "lucide-react";
import { Footer } from "../components/Footer";

export const TermsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("acceptance");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItems = [
    { id: "acceptance", label: "1. Acceptance & Scope" },
    { id: "guardrails", label: "2. Deterministic Guardrails" },
    { id: "audit-chain", label: "3. Cryptographic Ledger" },
    { id: "gateway", label: "4. Gateway Test Sandbox" },
    { id: "tat", label: "5. RBI TAT Framework" },
    { id: "dpdp-liability", label: "6. Data Protection & Zero-PAN" },
    { id: "sla", label: "7. Availability & SLAs" },
    { id: "liability", label: "8. Limitation of Liability" },
    { id: "jurisdiction", label: "9. Governing Law & Dispute" }
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
            <span className="hidden sm:inline">Statutory Terms of Service</span>
            <span className="px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] font-bold">
              v2.5 (2026 Edition)
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-10 px-6 transition-colors">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] font-mono text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>MASTER SERVICES AGREEMENT & ENTERPRISE TERMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            RevivePay Terms of Service
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Effective Date: January 1, 2026 | Last Updated: October 13, 2026 | Governing Legislation: Information Technology Act, 2000, Payment and Settlement Systems Act, 2007, DPDP Act, 2023.
          </p>
        </div>
      </div>

      {/* Main Content with Sticky Sidebar */}
      <main className="max-w-5xl mx-auto px-6 py-10 flex-1 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="hidden md:block col-span-1">
          <div className="sticky top-24 space-y-1 p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm">
            <div className="px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider font-mono border-b border-[var(--color-border-subtle)]">
              Terms Sections
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

        {/* Terms Body */}
        <div className="col-span-1 md:col-span-3 space-y-8">
          {/* Section 1 */}
          <section id="acceptance" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Building2 className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                1. Acceptance of Terms & Autonomous Scope
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                By integrating, deploying, or utilizing RevivePay AI ("RevivePay", "Platform", "Service"), the subscribing merchant ("Merchant", "You") agrees to be bound by these Terms of Service.
              </p>
              <p>
                RevivePay provides an autonomous revenue recovery engine designed to diagnose payment failures, calculate real-time recovery likelihood, verify settlement states, and orchestrate policy-bounded dunning or retry sequences. The Merchant grants RevivePay authorization to analyze failed transaction telemetry ingested through authorized gateway integrations (such as Razorpay).
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="guardrails" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                2. Deterministic Guardrails & Bounded Actions
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                RevivePay guarantees that autonomous artificial intelligence agents function strictly within hardcoded, deterministic safety guardrails defined by the Merchant:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-text-primary)]">
                <li>
                  <strong>Retry Caps:</strong> Automated retries are bounded to a maximum of 2 attempts per transaction by default to protect against issuer card-network spam penalties.
                </li>
                <li>
                  <strong>Human-in-the-Loop Thresholds:</strong> Transactions exceeding merchant-configured thresholds (default INR 50,000.00) require explicit operator review and manual approval before execution.
                </li>
                <li>
                  <strong>Non-Discretionary Limits:</strong> AI models cannot alter merchant policy limits, bypass minimum confidence thresholds (0.85), or override customer opt-out directives.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section id="audit-chain" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Layers className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                3. Cryptographic Audit Chain & Non-Repudiation
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                Every state transition, AI diagnosis rationale, human operator approval, and gateway execution response is cryptographically linked in an immutable, append-only audit ledger:
              </p>
              <p>
                Each ledger record includes an entry hash computed as <code className="font-mono text-emerald-600 dark:text-emerald-400">SHA-256(previous_hash + case_id + timestamp + actor + action)</code>. Both RevivePay and the Merchant agree that this cryptographic ledger serves as definitive, tamper-evident evidence for dispute reconciliation, regulatory inspections, and forensic audits.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="gateway" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Lock className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                4. Gateway Test Sandbox & Demonstration Boundaries
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                In default demo and sandbox modes, RevivePay operates against simulated payment rails or Razorpay Test Mode keys (<code className="font-mono">rzp_test_*</code>). No actual monetary debits or banking settlements occur in sandbox mode.
              </p>
              <p>
                Merchants are solely responsible for testing and validating their webhook signing secrets, policy rules, and dunning templates in sandbox before promoting integrations to live production gateways.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="tat" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Clock className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                5. RBI Harmonization of Turnaround Time (TAT) Framework
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                RevivePay's recovery tracking aligns with the Reserve Bank of India framework for Turnaround Time (TAT) and customer compensation for failed transactions (Circular DPSS.CO.PD No.629/02.01.014/2019-20):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
                  <div className="font-mono text-xs font-bold text-[var(--color-text-primary)]">UPI Transactions (T + 1)</div>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">Auto-reversal or recovery confirmation within 1 business day of failure report.</p>
                </div>
                <div className="p-3 rounded bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1">
                  <div className="font-mono text-xs font-bold text-[var(--color-text-primary)]">Card Transactions (T + 5)</div>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">Acquiring bank settlement or reversal within 5 business days of transaction decline.</p>
                </div>
              </div>
              <p>
                RevivePay's engine audits compliance against these deadlines, tracking statutory penalty accruals (INR 100 per day of delay) to assist merchants in mitigating customer disputes.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="dpdp-liability" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                6. Data Protection, DPDP Act 2023 & Zero-PAN Allocation
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                The parties allocate data protection responsibilities as follows:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-text-primary)]">
                <li>
                  <strong>Merchant Obligations:</strong> The Merchant warrants that it has provided notice and obtained necessary consent from customer Data Principals under the DPDP Act 2023 before transmitting telemetry to RevivePay.
                </li>
                <li>
                  <strong>Zero-PAN Guarantee:</strong> RevivePay warrants that it shall not request, process, or store unencrypted 16-digit card numbers (PANs) or CVVs, maintaining strict PCI-DSS v4.0 tokenized scope.
                </li>
                <li>
                  <strong>Opt-Out Honoring:</strong> RevivePay guarantees immediate cessation of dunning communications upon customer opt-out trigger.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section id="sla" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Layers className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                7. Service Availability & High-Availability Architecture
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                RevivePay strives to maintain 99.9% uptime for core webhook ingestion endpoints. Webhook queues feature automatic retry mechanisms with exponential backoff and dead-letter queues. In the event of primary database maintenance, the platform automatically engages local resilient buffering to prevent webhook drops.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="liability" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                8. Limitation of Liability & Indemnity
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                To the maximum extent permitted by applicable Indian law:
              </p>
              <p>
                RevivePay shall not be liable for any indirect, incidental, punitive, or consequential damages, including lost profits, loss of data, or gateway interchange penalties arising from merchant-configured automated retry rules. RevivePay's total aggregate liability arising out of or related to this agreement shall not exceed the total fees paid by the Merchant to RevivePay during the three (3) months preceding the incident.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="jurisdiction" className="p-6 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4 shadow-premium-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
              <Scale className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                9. Governing Law, Dispute Resolution & Jurisdiction
              </h2>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of India.
              </p>
              <p>
                Any dispute, controversy, or claim arising out of or relating to this agreement shall be settled through binding arbitration conducted in Mumbai, Maharashtra, India, in accordance with the provisions of the <strong>Arbitration and Conciliation Act, 1996</strong>. The arbitration proceedings shall be conducted in English. Subject to arbitration, the courts in Mumbai shall have exclusive jurisdiction.
              </p>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="pt-6 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--color-text-secondary)] font-mono">
            <span>RevivePay Autonomous Revenue Protection</span>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-[var(--color-accent)] hover:underline">
                Privacy Policy →
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
