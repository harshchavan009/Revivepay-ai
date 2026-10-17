import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  Cpu,
  BarChart3,
  CheckCircle2,
  PlayCircle,
  TrendingUp,
  CreditCard,
  Building2,
  ChevronDown,
  Activity,
  Calculator,
  RefreshCw,
  Sliders,
  Clock,
  Check,
  Server,
  ArrowUpRight,
  CircleDot,
  FileCheck2,
  HelpCircle,
  PhoneCall,
  UserCheck,
  MessageSquare,
  AlertTriangle,
  Globe2
} from "lucide-react";
import { Footer } from "../components/Footer";
import { ReviveHeroPreview } from "../components/ReviveHeroPreview";
import { formatINR } from "../data/mockData";
import { useMetrics } from "../context/MetricsContext";

export const LandingPage: React.FC = () => {
  const { recoveryRate, environmentLabel } = useMetrics();

  // ROI Calculator state in INR (₹)
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(2500000); // ₹25 Lakhs
  const [failRate, setFailRate] = useState<number>(7.5);
  const recoveryRateEst = (recoveryRate || 52.7) / 100;

  const failedRevenue = (monthlyRevenue * failRate) / 100;
  const recoveredMonthly = failedRevenue * recoveryRateEst;
  const recoveredAnnual = recoveredMonthly * 12;

  // Active Industry Use-Case Tab
  const [activeIndustryTab, setActiveIndustryTab] = useState<string>("saas");

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const industries = [
    {
      id: "saas",
      name: "SaaS & Subscriptions",
      headline: "Prevent Involuntary Churn from Recurring Mandate Failures",
      problem: "Monthly subscription cards expire, reach limit thresholds, or face bank maintenance downtime, causing sudden account cancellations and customer dissatisfaction.",
      solution: "RevivePay analyzes card decline codes to separate transient downtime from expired cards. For bank outages, smart retries execute when bank clearing resumes. For expired cards, tokenized 1-click update links are dispatched via WhatsApp.",
      statNote: "Recovers recurring revenue without annoying customers with repeated failed charge notifications."
    },
    {
      id: "ecommerce",
      name: "E-Commerce & D2C",
      headline: "Capture High-Intent Shoppers During Checkout Glitches",
      problem: "Shoppers abandoning payment at checkout due to bank switch 504 timeouts rarely re-enter card details. By the time marketing sends an email, the buying intent is gone.",
      solution: "RevivePay receives the payment failure webhook in <100ms and immediately sends a frictionless 1-click UPI deep-link directly to the buyer's smartphone on WhatsApp, recovering the sale in minutes.",
      statNote: "Closes the window between cart abandonment and customer distraction."
    },
    {
      id: "edtech",
      name: "EdTech & Courses",
      headline: "Protect Monthly EMI Schedules and Student Enrollments",
      problem: "Students and parents face card limits or banking switch delays on recurring course fees, interrupting class access and overwhelming support staff with payment tickets.",
      solution: "Deterministic retry policies coordinate with national clearing calendars and provide alternate UPI payment links with customizable grace periods, maintaining continuous learning access.",
      statNote: "Eliminates student dropouts caused purely by payment switch timeouts."
    },
    {
      id: "healthcare",
      name: "Healthcare & Telemedicine",
      headline: "Ensure Uninterrupted Consultations and Prescription Deliveries",
      problem: "Recurring medication subscriptions and telemedicine consultations cannot afford payment disruption, but automated over-charging can create regulatory liability.",
      solution: "Strict human-in-the-loop guardrails flag transactions above merchant limits, while automated nudges handle routine copays under strict DPDP consent compliance.",
      statNote: "Ensures medical continuity while enforcing zero raw card storage."
    },
    {
      id: "nonprofit",
      name: "Non-Profits & Charities",
      headline: "Preserve Recurring Patron Contributions with Polite Nudges",
      problem: "Charities lose recurring donors every year when monthly debit cards expire, but aggressive debt-collection dunning damages goodwill and patron relationships.",
      solution: "RevivePay sends respectful, branded donor nudges with one-click UPI donation links, adhering to RBI e-mandate guidance and complete customer consent controls.",
      statNote: "Protects long-term donor retention with respectful, compliant outreach."
    }
  ];

  const currentIndustry = industries.find((i) => i.id === activeIndustryTab) || industries[0];

  const faqs = [
    {
      q: "Does RevivePay need access to my Razorpay account credentials?",
      a: "No. You only provide your Razorpay API Key ID and Key Secret (which are encrypted at rest using authenticated AES-256-GCM) or configure a Webhook Secret. RevivePay never requests your Razorpay login credentials, two-factor codes, or master account access."
    },
    {
      q: "Does RevivePay store my customers' credit or debit cards?",
      a: "Never. RevivePay operates under a strict Zero Cardholder Data policy. Card numbers, expiration dates, and CVVs are handled entirely by Razorpay. RevivePay only processes opaque transaction references, failure codes, and customer contact details required for recovery dunning."
    },
    {
      q: "How do I switch between Test Mode and Live Mode?",
      a: "RevivePay includes an explicit toggle in Settings. In Test Mode, all operations use Razorpay sandbox keys and a prominent amber test banner is displayed. You can simulate failures and verify recoveries safely before ever switching to Live Mode."
    },
    {
      q: "How does RevivePay comply with India's DPDP Act 2023?",
      a: "RevivePay includes dedicated compliance endpoints (/api/v1/compliance/consent, /export, and /delete). When a customer exercises their Right to Erasure, their personal identifiers (name, email, phone) are irreversibly anonymized while preserving cryptographic ledger integrity for tax and financial auditing."
    },
    {
      q: "Can my operations team review high-value recoveries before they happen?",
      a: "Yes. In the Policy Configuration portal, you can set an automated action threshold (e.g., ₹10,000). Any failed transaction above this threshold automatically overrules the AI and routes to the Human-in-the-Loop review queue for manual operator approval."
    },
    {
      q: "What happens if a customer pays through another channel while recovery is pending?",
      a: "Every automated retry or link execution verifies real-time payment status against Razorpay's API before executing. If the customer already settled the invoice or completed a separate transaction, RevivePay immediately halts all retries and closes the case, preventing duplicate charges."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] selection:bg-[var(--color-accent)] selection:text-white font-sans antialiased overflow-x-hidden transition-colors">
      {/* 1. STICKY TOP NAVIGATION BAR */}
      <nav className="h-20 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between transition-colors">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-premium-sm text-white group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5 leading-none">
                <span>RevivePay</span>
                <span className="text-[var(--color-accent)] text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)]">
                  AI
                </span>
              </span>
              <span className="text-[9px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">
                Policy-Gated Recovery
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--color-text-secondary)]">
            <a href="#how-it-works" className="hover:text-[var(--color-text-primary)] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[var(--color-text-primary)] transition-colors">
              Features
            </a>
            <a href="#solutions" className="hover:text-[var(--color-text-primary)] transition-colors">
              Solutions
            </a>
            <Link to="/security" className="hover:text-[var(--color-text-primary)] transition-colors">
              Security
            </Link>
            <Link to="/pricing" className="hover:text-[var(--color-text-primary)] transition-colors">
              Pricing
            </Link>
            <Link to="/contact" className="hover:text-[var(--color-text-primary)] transition-colors">
              Contact
            </Link>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Works with Razorpay API</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold">
          <Link
            to="/login"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors hidden sm:flex items-center gap-1 font-medium"
          >
            <span>Sign In</span>
          </Link>

          <Link
            to="/demo"
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-md border border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
          >
            <PlayCircle className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span>Interactive Demo</span>
          </Link>

          <Link
            to="/login"
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-premium-sm transition-all text-xs sm:text-sm font-bold"
          >
            Connect Razorpay
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 sm:pt-16 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Outcome Headline & Subhead */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] text-xs font-mono font-bold tracking-wide">
              <CircleDot className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>DETERMINISTIC REVENUE RECOVERY FOR MERCHANTS</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.1]">
                Recover Failed Razorpay Payments Automatically.
              </h1>
            </div>

            <div className="space-y-3 text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed max-w-xl">
              <p className="font-medium text-[var(--color-text-primary)] text-base">
                Intelligently diagnose failed transactions, coordinate smart UPI/card retries, and enforce deterministic policy limits to protect your revenue and brand reputation.
              </p>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                Connect your Razorpay account via secure webhooks in minutes. RevivePay automatically distinguishes temporary bank switch outages from permanent card declines, routes high-value transactions to your team, and records every action in a verifiable cryptographic ledger.
              </p>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-sm shadow-premium-md transition-all group"
              >
                <span>Connect Razorpay Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#how-it-works"
                className="flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-md bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold text-sm transition-all shadow-premium-sm group"
              >
                <span>See How It Works</span>
                <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] group-hover:translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Verifiable Trust Highlights */}
            <div className="pt-4 border-t border-[var(--color-border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">Zero Card Numbers Stored</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">AES-256-GCM Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">Deterministic Policy Caps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">DPDP Act 2023 Ready</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Preview / Simulator */}
          <div className="lg:col-span-6">
            <ReviveHeroPreview />
          </div>
        </div>
      </section>

      {/* 3. "HOW IT WORKS" 6-STEP VISUAL STRIP */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/60 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              END-TO-END RECOVERY PIPELINE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              How RevivePay Recovers Revenue in 6 Deterministic Steps
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed">
              Every failed payment flows through a transparent, audited 6-stage lifecycle. AI provides root-cause diagnosis, while deterministic merchant policies control all real-world actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-2.5 relative">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center font-mono font-bold text-xs">
                01
              </div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Detect</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Ingests payment.failed webhook from Razorpay in &lt;100ms with timing-safe HMAC-SHA256 signature verification.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-2.5 relative">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Diagnose</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                AI model analyzes bank decline code and switch health to isolate transient outages from permanent card issues.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-2.5 relative">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Decide</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Deterministic Policy Gateway verifies transaction amount, retry limits, cooldowns, and routes high-value cases to humans.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-2.5 relative">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-mono font-bold text-xs">
                04
              </div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Act</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Executes smart gateway retry during peak bank clearing, or sends a 1-click UPI payment link via WhatsApp.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-2.5 relative">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-mono font-bold text-xs">
                05
              </div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Verify</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                The AI cannot declare victory. Only direct confirmation of capture on Razorpay's ledger transitions status to RECOVERED.
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-2.5 relative">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-mono font-bold text-xs">
                06
              </div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Measure</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Every recovery is immutably hashed in the SHA-256 audit ledger, tracking exact recovery ROI and zero double-charges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 6-CARD FEATURE GRID */}
      <section id="features" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
            CORE CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Built for High-Volume Reliability and Merchant Control
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed">
            Eliminate blind retries. RevivePay provides honest, engineering-grade recovery tools designed specifically for modern payment systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 hover:border-[var(--color-border-hover)] transition-all shadow-premium-sm">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Smart Retry Orchestration
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Recovers temporary bank switch failures without spamming customer cards or triggering network decline penalties.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 hover:border-[var(--color-border-hover)] transition-all shadow-premium-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              WhatsApp & SMS 1-Click Pay
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Converts abandoned checkout carts and expired card declines into completed UPI payments directly on user devices.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 hover:border-[var(--color-border-hover)] transition-all shadow-premium-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Deterministic Safety Policies
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Hard caps on automated retries, maximum rupee amounts, and cooldown windows ensure AI recommendations never run wild.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 hover:border-[var(--color-border-hover)] transition-all shadow-premium-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Human-in-the-Loop Review
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              High-value or anomalous transactions automatically pause and route to your operations team with full context before action.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 hover:border-[var(--color-border-hover)] transition-all shadow-premium-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Zero-Knowledge Card Handling
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Card data is handled entirely by Razorpay. RevivePay never sees, processes, or stores raw 16-digit card numbers or CVVs.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 hover:border-[var(--color-border-hover)] transition-all shadow-premium-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Cryptographic Audit Ledger
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Every action, policy evaluation, and recovery confirmation is permanently chained in a SHA-256 tamper-evident log.
            </p>
          </div>
        </div>
      </section>

      {/* 5. TABBED INDUSTRY USE-CASE SECTION */}
      <section id="solutions" className="py-20 px-4 sm:px-8 border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/50 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              TAILORED WORKFLOWS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Designed for Your Industry's Specific Payment Flow
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed">
              Different payment models fail in different ways. See how RevivePay customizes failure recovery for your exact business requirements.
            </p>
          </div>

          {/* Industry Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--color-border-subtle)]">
            {industries.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setActiveIndustryTab(ind.id)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeIndustryTab === ind.id
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]"
                }`}
              >
                {ind.name}
              </button>
            ))}
          </div>

          {/* Active Industry Showcase Card */}
          <div className="p-8 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-wider">
                {currentIndustry.name} Solution
              </span>
              <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                {currentIndustry.headline}
              </h3>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
                  <h5 className="text-xs font-bold text-rose-500 uppercase tracking-wider font-mono">The Problem</h5>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    {currentIndustry.problem}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
                  <h5 className="text-xs font-bold text-emerald-500 uppercase tracking-wider font-mono">The RevivePay Solution</h5>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    {currentIndustry.solution}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--color-text-muted)] italic pt-1">
                {currentIndustry.statNote}
              </p>
            </div>

            <div className="lg:col-span-5 p-6 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-4">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider font-mono">
                Active Policy Invariants
              </h4>
              <ul className="space-y-3 text-xs text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Max 2 automated retries within 72 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Zero retries on permanent card cancel codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Tokenized 1-click WhatsApp deep-links with 24h expiration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Real-time duplicate debit prevention check</span>
                </li>
              </ul>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full py-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Deploy for {currentIndustry.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HONEST SECURITY & TRUST SECTION */}
      <section id="security" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
            SECURITY & COMPLIANCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Security Grounded in Verifiable Facts
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed">
            We don't display unearned compliance badges. Instead, here is exactly how your data and credentials are treated under real engineering controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[var(--color-text-primary)]">Zero Card Data Handling</h4>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Card data is handled entirely by Razorpay. RevivePay never sees, processes, or stores 16-digit card numbers, CVVs, or bank credentials.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[var(--color-text-primary)]">AES-256-GCM Encryption</h4>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Razorpay API keys and webhook secrets are encrypted at rest using authenticated AES-256-GCM and never returned in plaintext to browsers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center font-bold">
              <Globe2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[var(--color-text-primary)]">DPDP Act 2023 Compliance</h4>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Native consent recording, data portability export, and Section 12 Right-to-Erasure endpoints anonymize PII upon customer request.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Read Our Security Specification</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Detailed breakdown of cryptographic hash chaining, timing-safe signatures, and tenant isolation policies.
            </p>
          </div>
          <Link
            to="/security"
            className="px-4 py-2 rounded-md bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-xs font-semibold hover:border-[var(--color-accent)] text-[var(--color-text-primary)] transition-colors whitespace-nowrap"
          >
            Open Security Whitepaper
          </Link>
        </div>
      </section>

      {/* 7. HONEST PRICING & ROI CALCULATOR */}
      <section id="pricing" className="py-20 px-4 sm:px-8 border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/60 transition-colors">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              TRANSPARENT PRICING
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Pay Only for Revenue We Actually Recover
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              No hidden setup fees. No long-term lock-in. Free during initial integration and test mode testing.
            </p>
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Beta */}
            <div className="p-6 rounded-2xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase">Developer & Pilot</span>
                  <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">Free Beta</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">For teams testing Razorpay test mode or starting out.</p>
                </div>

                <div className="text-3xl font-extrabold font-mono text-[var(--color-text-primary)]">
                  ₹0 <span className="text-xs font-sans font-normal text-[var(--color-text-secondary)]">/ month</span>
                </div>

                <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2 text-xs text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Up to ₹50,000 monthly recovered revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Razorpay Test Mode simulation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Cryptographic SHA-256 audit ledger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>DPDP consent & erasure API</span>
                  </div>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full py-2.5 rounded-lg bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] text-xs font-bold text-center block transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Growth Tier */}
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface-raised)] border-2 border-[var(--color-accent)] space-y-6 flex flex-col justify-between relative shadow-premium-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded bg-[var(--color-accent)] text-white text-[10px] font-extrabold uppercase font-mono">
                Most Popular
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase">Scaling Brands</span>
                  <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">Growth Plan</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">For active subscription, e-commerce, and SaaS businesses.</p>
                </div>

                <div className="text-3xl font-extrabold font-mono text-[var(--color-text-primary)]">
                  ₹4,999 <span className="text-xs font-sans font-normal text-[var(--color-text-secondary)]">+ 1.5% recovered</span>
                </div>

                <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2 text-xs text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                    <span>Unlimited recovery volume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                    <span>Automated smart retry orchestration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                    <span>WhatsApp & SMS 1-click UPI links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                    <span>Deterministic policy limits portal</span>
                  </div>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full py-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold text-center block shadow-sm transition-colors"
              >
                Deploy Growth Plan
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="p-6 rounded-2xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] uppercase">Custom Volume</span>
                  <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">Enterprise</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">For organizations processing &gt; ₹50 Lakhs monthly.</p>
                </div>

                <div className="text-3xl font-extrabold font-mono text-[var(--color-text-primary)]">
                  Custom <span className="text-xs font-sans font-normal text-[var(--color-text-secondary)]">SLA & Volume Pricing</span>
                </div>

                <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2 text-xs text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Dedicated tenant database isolation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Custom policy engine approval workflows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>99.9% Uptime Service Level Agreement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Dedicated Technical Account Manager</span>
                  </div>
                </div>
              </div>

              <Link
                to="/contact"
                className="w-full py-2.5 rounded-lg bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] text-xs font-bold text-center block transition-colors"
              >
                Contact Enterprise Team
              </Link>
            </div>
          </div>

          {/* Dynamic ROI Calculator */}
          <div className="p-8 rounded-2xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] shadow-premium-md space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Interactive Revenue Recovery Calculator
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Estimate your recoverable revenue based on your monthly transaction volume.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[var(--color-text-secondary)]">Monthly Processing Volume (INR)</span>
                    <span className="text-[var(--color-accent)] font-mono text-sm">{formatINR(monthlyRevenue)}</span>
                  </div>
                  <input
                    type="range"
                    min={500000}
                    max={20000000}
                    step={250000}
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full accent-[var(--color-accent)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-mono mt-1">
                    <span>₹5 Lakhs</span>
                    <span>₹1 Crore</span>
                    <span>₹2 Crores</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[var(--color-text-secondary)]">Estimated Payment Failure Rate</span>
                    <span className="text-amber-500 font-mono text-sm">{failRate.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={20.0}
                    step={0.5}
                    value={failRate}
                    onChange={(e) => setFailRate(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-mono mt-1">
                    <span>2.0%</span>
                    <span>10.0%</span>
                    <span>20.0%</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase">
                    Estimated Monthly Recovered Revenue
                  </span>
                  <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatINR(recoveredMonthly)}
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    Calculated using standard recovery benchmark across temporary bank glitches & dunning.
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase">
                    Annual Recovered Topline
                  </span>
                  <div className="text-xl font-bold font-mono text-[var(--color-text-primary)]">
                    {formatINR(recoveredAnnual)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMPREHENSIVE FAQ ACCORDION */}
      <section className="py-20 px-4 sm:px-8 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Common Questions from Engineering & Finance Teams
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 shrink-0 ${
                    openFaqIndex === idx ? "rotate-180 text-[var(--color-accent)]" : ""
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border-subtle)]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. STATUTORY FOOTER */}
      <Footer />
    </div>
  );
};
