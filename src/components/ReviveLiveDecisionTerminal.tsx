import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Check,
  X,
  RotateCw,
  Play,
  Pause,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";
import { formatINR } from "../data/mockData";

interface RetryDecisionItem {
  id: string;
  txn: string;
  inv: string;
  amount: string;
  declineReason: string;
  status: "analyzing" | "scheduled" | "paused" | "recovered" | "rerouted";
  statusText: string;
  detail: string;
  badge?: string;
  caseId?: string;
}

const INITIAL_DECISIONS: RetryDecisionItem[] = [
  {
    id: "1",
    txn: "TXN_8841",
    inv: "INV-20471",
    amount: "₹14,999",
    declineReason: "Insufficient Funds",
    status: "scheduled",
    statusText: "Retry scheduled: Friday 09:00 AM",
    detail: "Typical payroll deposit window",
    caseId: "RV-10291"
  },
  {
    id: "2",
    txn: "TXN_8847",
    inv: "INV-20486",
    amount: "₹8,500",
    declineReason: "Expired Card Mandate",
    status: "paused",
    statusText: "Retries paused",
    detail: "1-Click WhatsApp card update dispatched",
    caseId: "RV-10292"
  },
  {
    id: "3",
    txn: "TXN_8852",
    inv: "INV-20491",
    amount: "₹32,400",
    declineReason: "Bank Switch Glitch",
    status: "recovered",
    statusText: "Recovered via smart retry",
    detail: "09:14 AM IST (14m post-outage)",
    badge: "RECOVERED",
    caseId: "RV-10293"
  },
  {
    id: "4",
    txn: "TXN_8858",
    inv: "INV-20504",
    amount: "₹4,200",
    declineReason: "3DS Auth Drop",
    status: "rerouted",
    statusText: "1-Click UPI link dispatched",
    detail: "WhatsApp payment link opened",
    caseId: "RV-10294"
  },
  {
    id: "5",
    txn: "TXN_8863",
    inv: "INV-20519",
    amount: "₹68,500",
    declineReason: "High-Value Threshold",
    status: "scheduled",
    statusText: "Awaiting Operator Sign-off",
    detail: "Policy approval gate active",
    caseId: "RV-10295"
  }
];

const SIMULATION_TEMPLATES = [
  {
    txn: "TXN_8869",
    inv: "INV-20528",
    amount: "₹18,500",
    declineReason: "Bank Switch Outage",
    status: "recovered" as const,
    statusText: "Recovered via smart retry",
    detail: "HDFC gateway switch restored",
    badge: "RECOVERED"
  },
  {
    txn: "TXN_8874",
    inv: "INV-20535",
    amount: "₹9,200",
    declineReason: "Pre-Salary Liquidity Dip",
    status: "scheduled" as const,
    statusText: "Smart retry window set",
    detail: "Payroll credit window aligned"
  },
  {
    txn: "TXN_8881",
    inv: "INV-20542",
    amount: "₹24,000",
    declineReason: "Card Expiration",
    status: "paused" as const,
    statusText: "Retries stopped per policy",
    detail: "1-Click WhatsApp update sent"
  }
];

interface ReviveLiveDecisionTerminalProps {
  recoveredRevenue?: number;
  recoveryRate?: number;
}

export const ReviveLiveDecisionTerminal: React.FC<ReviveLiveDecisionTerminalProps> = ({
  recoveredRevenue = 596534.34,
  recoveryRate = 53.6
}) => {
  const [decisions, setDecisions] = useState<RetryDecisionItem[]>(INITIAL_DECISIONS);
  const [isLive, setIsLive] = useState(true);
  const [recoveredAmount, setRecoveredAmount] = useState(recoveredRevenue);
  const [analyzingItem, setAnalyzingItem] = useState<string | null>(null);

  useEffect(() => {
    setRecoveredAmount(recoveredRevenue);
  }, [recoveredRevenue]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const randomTemplate =
        SIMULATION_TEMPLATES[Math.floor(Math.random() * SIMULATION_TEMPLATES.length)];
      const randomId = String(Date.now());
      const randomCaseNum = Math.floor(10300 + Math.random() * 80);

      const newItem: RetryDecisionItem = {
        id: randomId,
        txn: randomTemplate.txn,
        inv: randomTemplate.inv,
        amount: randomTemplate.amount,
        declineReason: randomTemplate.declineReason,
        status: "analyzing",
        statusText: "Analyzing 200+ ML Signals...",
        detail: "Evaluating optimal liquidity window",
        caseId: `RV-${randomCaseNum}`
      };

      setAnalyzingItem(randomId);
      setDecisions((prev) => [newItem, ...prev.slice(0, 4)]);

      setTimeout(() => {
        setDecisions((prev) =>
          prev.map((item) => {
            if (item.id === randomId) {
              return {
                ...item,
                status: randomTemplate.status,
                statusText: randomTemplate.statusText,
                detail: randomTemplate.detail,
                badge: randomTemplate.badge
              };
            }
            return item;
          })
        );
        setAnalyzingItem(null);
        if (randomTemplate.status === "recovered") {
          setRecoveredAmount((prev) => prev + 4999);
        }
      }, 1200);
    }, 9000);

    return () => clearInterval(interval);
  }, [isLive]);

  const triggerManualSimulation = () => {
    const randomTemplate =
      SIMULATION_TEMPLATES[Math.floor(Math.random() * SIMULATION_TEMPLATES.length)];
    const manualId = String(Date.now());

    const manualItem: RetryDecisionItem = {
      id: manualId,
      txn: `TXN_${Math.floor(8900 + Math.random() * 99)}`,
      inv: `INV_${Math.floor(20600 + Math.random() * 99)}`,
      amount: "₹18,500",
      declineReason: randomTemplate.declineReason,
      status: "analyzing",
      statusText: "Ingesting Failure Telemetry...",
      detail: "Evaluating customer payment history",
      caseId: `RV-${Math.floor(10300 + Math.random() * 80)}`
    };

    setAnalyzingItem(manualItem.id);
    setDecisions((prev) => [manualItem, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setDecisions((prev) =>
        prev.map((item) => {
          if (item.id === manualItem.id) {
            return {
              ...item,
              status: randomTemplate.status,
              statusText: randomTemplate.statusText,
              detail: randomTemplate.detail,
              badge: randomTemplate.badge
            };
          }
          return item;
        })
      );
      setAnalyzingItem(null);
      if (randomTemplate.status === "recovered") {
        setRecoveredAmount((prev) => prev + 4999);
      }
    }, 1200);
  };

  return (
    <div className="relative rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-5 sm:p-6 shadow-premium-md font-sans">
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger)] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] inline-block"></span>
          </div>
          <span className="ml-2 text-xs font-semibold text-[var(--color-text-primary)] tracking-wide">
            Revive &middot; Live Retry Decisions
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            title={isLive ? "Pause live simulation" : "Resume live simulation"}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)] transition-colors cursor-pointer"
          >
            {isLive ? <Pause className="w-3 h-3 text-[var(--color-accent)]" /> : <Play className="w-3 h-3 text-emerald-500" />}
            <span className="text-[11px] font-medium">{isLive ? "Live Stream" : "Paused"}</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards Grid (INR figures) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-4">
        {/* Metric 1 */}
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
          <p className="text-[11px] font-medium text-[var(--color-text-secondary)] leading-tight">
            Total Recovered
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-[var(--color-text-primary)] mt-1 tracking-tight font-mono">
            {formatINR(recoveredAmount)}
          </p>
          <p className="text-[10px] text-[var(--color-accent)] mt-1 flex items-center gap-0.5 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>quarter-to-date</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
          <p className="text-[11px] font-medium text-[var(--color-text-secondary)] leading-tight">
            Added to Topline
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-[var(--color-text-primary)] mt-1 tracking-tight font-mono">
            +4.8%
          </p>
          <p className="text-[10px] text-[var(--color-accent)] mt-1 flex items-center gap-0.5 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>vs. fixed schedule</span>
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)]">
          <p className="text-[11px] font-medium text-[var(--color-text-secondary)] leading-tight">
            Recovery Rate
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-[var(--color-text-primary)] mt-1 tracking-tight font-mono">
            {recoveryRate}%
          </p>
          <p className="text-[10px] text-[var(--color-accent)] mt-1 flex items-center gap-0.5 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>retried invoices</span>
          </p>
        </div>
      </div>

      {/* Live Retry Decisions Stream Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider font-mono">
            LIVE STREAMING DECISIONS
          </span>
          <button
            onClick={triggerManualSimulation}
            className="text-xs text-[var(--color-accent)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            <span>Simulate Failure Ingress</span>
          </button>
        </div>

        {/* Streaming Decision Cards */}
        <div className="space-y-2 max-h-[290px] overflow-hidden">
          {decisions.map((item) => {
            const isAnalyzing = item.status === "analyzing" || analyzingItem === item.id;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border text-xs transition-all duration-300 ${
                  isAnalyzing
                    ? "bg-[var(--color-accent-subtle)] border-[var(--color-accent-border)] shadow-sm"
                    : item.status === "recovered"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-[var(--color-bg-canvas)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)]"
                }`}
              >
                {/* Header Line: TXN · INV + Decline Reason */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                    <span className="font-mono font-bold text-[var(--color-text-primary)]">{item.txn}</span>
                    <span className="text-[var(--color-text-muted)]">&middot;</span>
                    <span className="font-mono text-[var(--color-text-muted)]">{item.inv}</span>
                  </div>

                  <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                    <X className="w-3 h-3" />
                    <span>Declined: {item.declineReason}</span>
                  </div>
                </div>

                {/* Sub Line: AI Decision & Status Outcome */}
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  {isAnalyzing ? (
                    <div className="flex items-center gap-1.5 text-[var(--color-accent)] animate-pulse font-mono">
                      <Sparkles className="w-3 h-3 text-[var(--color-accent)]" />
                      <span>{item.statusText}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                      <span className="text-[var(--color-accent)] font-bold">&rarr;</span>
                      <span className="font-medium text-[var(--color-text-primary)]">{item.statusText}</span>
                      <span className="text-[var(--color-text-muted)]">&middot;</span>
                      <span className="text-[var(--color-text-muted)]">{item.detail}</span>
                    </div>
                  )}

                  {item.badge === "RECOVERED" && !isAnalyzing && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[9px] tracking-wider flex items-center gap-0.5 shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>RECOVERED</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation within Terminal */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <span>Multi-Gateway Adaptive Retries</span>
        </div>
        <Link
          to="/cases/RV-10291"
          className="text-[var(--color-accent)] hover:underline font-semibold flex items-center gap-1"
        >
          <span>Deep Dive Case RV-10291</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
