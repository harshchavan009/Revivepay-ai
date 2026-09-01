import React from "react";
import { ShieldCheck, Wrench, AlertTriangle, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface HardeningLogItem {
  id: string;
  date: string;
  issue: string;
  whyItMattered: string;
  fix: string;
  category: "Security" | "Data Integrity" | "Honesty & Framing" | "Architecture";
  status: "RESOLVED" | "VERIFIED" | "TODO_PROJECT_OWNER";
}

const HARDENING_LOG_ENTRIES: HardeningLogItem[] = [
  {
    id: "HL-001",
    date: "August 2026",
    issue: "Demo Credential Exposure (Hardcoded Secret Tokens)",
    whyItMattered: "Plaintext credentials in client bundles expose backend APIs to credential theft and unauthorized mutation.",
    fix: "Migrated to server-side bcrypt (12 rounds) persona login with automated secrets hygiene scanner in CI pipeline.",
    category: "Security",
    status: "VERIFIED"
  },
  {
    id: "HL-002",
    date: "August 2026",
    issue: "LIVE / TEST Label Contradiction & Provenance Ambiguity",
    whyItMattered: "Inconsistent labels break credibility when presenting to technical evaluators and reviewers.",
    fix: "Enforced strict source provenance tags (RAZORPAY_TEST vs. SIMULATION) across all models, badges, and filters.",
    category: "Honesty & Framing",
    status: "VERIFIED"
  },
  {
    id: "HL-003",
    date: "August 2026",
    issue: "Case-Count Divergence (Dashboard vs. Registry Mismatch)",
    whyItMattered: "Two different totals for the same dataset breaks user trust in the platform's telemetry.",
    fix: "Unified database query with default limit=1000 and shared GET /api/recovery/count canonical endpoint.",
    category: "Data Integrity",
    status: "VERIFIED"
  },
  {
    id: "HL-004",
    date: "August 2026",
    issue: "Unverifiable Regulatory Badging ('RBI Certified' Copy)",
    whyItMattered: "RBI does not certify software products; claiming official certification creates legal and credibility risks.",
    fix: "Replaced marketing copy with honest educational reference implementations of RBI circulars (RBI/2019-20/67).",
    category: "Honesty & Framing",
    status: "VERIFIED"
  },
  {
    id: "HL-005",
    date: "August 2026",
    issue: "High-Value Transaction Execution Without Step-Up Verification",
    whyItMattered: "Automated execution on transactions >= ₹50,000 without MFA creates substantial financial blast-radius risk.",
    fix: "Implemented mandatory Step-Up Re-Authentication (OTP/password verification) logging distinct audit events.",
    category: "Security",
    status: "VERIFIED"
  },
  {
    id: "HL-006",
    date: "August 2026",
    issue: "Data Consistency & Invariant Boundary Hardening",
    whyItMattered: "Unbounded retry counters (e.g. 3/2) and unverified recovery claims break user trust and violate fintech accounting invariants.",
    fix: "Strictly enforced retry_count <= max_retry_count, locked SUCCESS payments from retry eligibility, and required verified outcomes for RECOVERED cases.",
    category: "Data Integrity",
    status: "VERIFIED"
  }
];

export const HardeningLogPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-16 max-w-5xl font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              ENGINEERING TRANSPARENCY & AUDIT
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              VERIFIED FIXES
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Hardening Log: Issues Found & Fixed</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            A chronological record of genuine security, honesty, consistency, and architecture fixes implemented during platform hardening.
          </p>
        </div>

        <Link
          to="/changelog"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer shadow-premium-sm"
        >
          <FileText className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <span>View ADR Notes</span>
        </Link>
      </div>

      {/* Log Table Container */}
      <div className="rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] overflow-hidden shadow-premium-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-canvas)] font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="p-4 pl-6">Date</th>
                <th className="p-4">Category</th>
                <th className="p-4">Issue Identified</th>
                <th className="p-4">Why It Mattered</th>
                <th className="p-4">Engineering Fix Enforced</th>
                <th className="p-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] font-sans">
              {HARDENING_LOG_ENTRIES.map((entry) => (
                <tr key={entry.id} className="hover:bg-[var(--color-bg-surface-hover)] transition-colors">
                  <td className="p-4 pl-6 font-mono text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                    {entry.date}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      entry.category === "Security"
                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                        : entry.category === "Data Integrity"
                        ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                        : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                    }`}>
                      {entry.category}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-[var(--color-text-primary)] min-w-[200px]">
                    {entry.issue}
                  </td>
                  <td className="p-4 text-[var(--color-text-secondary)] min-w-[240px] leading-relaxed">
                    {entry.whyItMattered}
                  </td>
                  <td className="p-4 text-[var(--color-text-primary)] min-w-[240px] leading-relaxed font-mono text-[11px]">
                    {entry.fix}
                  </td>
                  <td className="p-4 pr-6 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{entry.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note on Verification */}
      <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-1 text-xs text-[var(--color-text-secondary)]">
        <p className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Verifiable Hardening Guarantee</span>
        </p>
        <p className="leading-relaxed text-[11px]">
          Every fix listed above is guarded by automated Pytest unit and regression tests in <code className="font-mono text-[var(--color-accent)]">tests/</code> and verified on every commit in CI.
        </p>
      </div>
    </div>
  );
};
