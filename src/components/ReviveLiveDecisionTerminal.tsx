import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Check,
  X,
  Clock,
  RotateCw,
  Play,
  Pause,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Zap
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
    statusText: "Instant retry triggered",
    detail: "HDFC bank direct route re-established",
    badge: "RECOVERED",
    caseId: "RV-10298"
  },
  {
    id: "4",
    txn: "TXN_8861",
    inv: "INV-20502",
    amount: "₹19,250",
    declineReason: "Issuer Do Not Honor",
    status: "rerouted",
    statusText: "Retry rerouted",
    detail: "Peak authorization window (14:30 IST)",
    caseId: "RV-10295"
  },
  {
    id: "5",
    txn: "TXN_8888",
    inv: "INV-20523",
    amount: "₹45,000",
    declineReason: "Issuer Gateway Timeout",
    status: "recovered",
    statusText: "Instant retry triggered",
    detail: "Secondary gateway cascade captured",
    badge: "RECOVERED",
    caseId: "RV-10300"
  }
];

const ROTATING_NEW_ITEMS: Array<Omit<RetryDecisionItem, "id">> = [
  {
    txn: "TXN_8902",
    inv: "INV-20540",
    amount: "₹24,800",
    declineReason: "Gateway Timeout (504)",
    status: "recovered",
    statusText: "Adaptive cascade triggered",
    detail: "Axis Bank backup direct route captured",
    badge: "RECOVERED",
    caseId: "RV-10295"
  },
  {
    txn: "TXN_8915",
    inv: "INV-20555",
    amount: "₹12,400",
    declineReason: "Insufficient Balance",
    status: "scheduled",
    statusText: "Retry scheduled: 1st of month 08:30 AM",
    detail: "Monthly payroll credit detected",
    caseId: "RV-10299"
  },
  {
    txn: "TXN_8928",
    inv: "INV-20569",
    amount: "₹55,000",
    declineReason: "Card Velocity Limit",
    status: "scheduled",
    statusText: "Smart backoff retry: +4 hours",
    detail: "Cooling period window calculation",
    caseId: "RV-10296"
  },
  {
    txn: "TXN_8940",
    inv: "INV-20582",
    amount: "₹38,900",
    declineReason: "3DS Auth Failure",
    status: "paused",
    statusText: "1-Click WhatsApp payment link sent",
    detail: "Frictionless checkout token created",
    caseId: "RV-10293"
  }
];

export const ReviveLiveDecisionTerminal: React.FC = () => {
  const [decisions, setDecisions] = useState<RetryDecisionItem[]>(INITIAL_DECISIONS);
  const [recoveredAmount, setRecoveredAmount] = useState<number>(142605);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [analyzingItem, setAnalyzingItem] = useState<string | null>(null);

  // Live streaming simulation interval
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const nextTemplate = ROTATING_NEW_ITEMS[Math.floor(Math.random() * ROTATING_NEW_ITEMS.length)];
      const randomTxnNum = Math.floor(8890 + Math.random() * 200);
      const randomInvNum = Math.floor(20530 + Math.random() * 200);

      const newItem: RetryDecisionItem = {
        ...nextTemplate,
        id: Date.now().toString(),
        txn: `TXN_${randomTxnNum}`,
        inv: `INV-${randomInvNum}`,
        status: "analyzing",
        statusText: "Analyzing 200+ signals &middot; Issuer switch &middot; Liquidity heuristics..."
      };

      setAnalyzingItem(newItem.id);
      setDecisions((prev) => [newItem, ...prev.slice(0, 4)]);

      setTimeout(() => {
        setDecisions((prev) =>
          prev.map((item) => {
            if (item.id === newItem.id) {
              return {
                ...item,
                status: nextTemplate.status,
                statusText: nextTemplate.statusText,
                detail: nextTemplate.detail,
                badge: nextTemplate.badge
              };
            }
            return item;
          })
        );
        setAnalyzingItem(null);

        if (nextTemplate.status === "recovered") {
          setRecoveredAmount((prev) => prev + Math.floor(2400 + Math.random() * 5000));
        }
      }, 1600);
    }, 4500);

    return () => clearInterval(interval);
  }, [isLive]);

  const triggerManualSimulation = () => {
    const randomTemplate = ROTATING_NEW_ITEMS[Math.floor(Math.random() * ROTATING_NEW_ITEMS.length)];
    const randomTxnNum = Math.floor(9000 + Math.random() * 500);
    const randomInvNum = Math.floor(20700 + Math.random() * 500);

    const manualItem: RetryDecisionItem = {
      ...randomTemplate,
      id: Date.now().toString(),
      txn: `TXN_${randomTxnNum}`,
      inv: `INV-${randomInvNum}`,
      status: "analyzing",
      statusText: "Analyzing 200+ signals &middot; Issuer switch &middot; Liquidity heuristics..."
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
    }, 1400);
  };

  return (
    <div className="relative rounded-2xl bg-[#081520]/95 border border-[#14364D] p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-[#1E4E6E] font-sans">
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between border-b border-[#14364D]/80 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block"></span>
          </div>
          <span className="ml-2 text-xs font-semibold text-white tracking-wide">
            Revive &middot; Live Retry Decisions
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            title={isLive ? "Pause live simulation" : "Resume live simulation"}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[#0E2333] hover:bg-[#15344C] text-slate-300 border border-[#1A425E] transition-colors"
          >
            {isLive ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            <span className="text-[11px] font-medium">{isLive ? "Live Stream" : "Paused"}</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards Grid (INR figures) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-4">
        {/* Metric 1 */}
        <div className="p-3.5 rounded-xl bg-[#0B1E2D]/90 border border-[#173B54]">
          <p className="text-[11px] font-medium text-slate-400 leading-tight">
            Total Recovered
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
            {formatINR(recoveredAmount)}
          </p>
          <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-0.5 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>quarter-to-date</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 rounded-xl bg-[#0B1E2D]/90 border border-[#173B54]">
          <p className="text-[11px] font-medium text-slate-400 leading-tight">
            Added to Topline
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
            +4.8%
          </p>
          <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-0.5 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>vs. fixed schedule</span>
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 rounded-xl bg-[#0B1E2D]/90 border border-[#173B54]">
          <p className="text-[11px] font-medium text-slate-400 leading-tight">
            Recovery Rate
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
            65.2%
          </p>
          <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-0.5 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>retried invoices</span>
          </p>
        </div>
      </div>

      {/* Live Retry Decisions Stream Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
            LIVE STREAMING DECISIONS
          </span>
          <button
            onClick={triggerManualSimulation}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
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
                    ? "bg-[#0E283C]/95 border-cyan-500/50 shadow-md shadow-cyan-950/40"
                    : item.status === "recovered"
                    ? "bg-[#092233]/80 border-emerald-500/30 hover:border-emerald-500/50"
                    : "bg-[#091D2C]/70 border-[#143952] hover:border-[#1F5478]"
                }`}
              >
                {/* Header Line: TXN · INV + Decline Reason */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="font-mono font-bold">{item.txn}</span>
                    <span className="text-slate-600">&middot;</span>
                    <span className="font-mono text-slate-400">{item.inv}</span>
                  </div>

                  <div className="flex items-center gap-1 text-rose-400 font-medium">
                    <X className="w-3 h-3" />
                    <span>Declined: {item.declineReason}</span>
                  </div>
                </div>

                {/* Sub Line: AI Decision & Status Outcome */}
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  {isAnalyzing ? (
                    <div className="flex items-center gap-1.5 text-cyan-300 animate-pulse font-mono">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>{item.statusText}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-300">
                      <span className="text-cyan-400 font-bold">&rarr;</span>
                      <span className="font-medium text-white">{item.statusText}</span>
                      <span className="text-slate-500">&middot;</span>
                      <span className="text-slate-400">{item.detail}</span>
                    </div>
                  )}

                  {item.badge === "RECOVERED" && !isAnalyzing && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[9px] tracking-wider flex items-center gap-0.5 shadow-sm shadow-emerald-500/30">
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
      <div className="mt-4 pt-3 border-t border-[#14364D]/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Multi-Gateway Adaptive Retries</span>
        </div>
        <Link
          to="/cases/RV-10291"
          className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
        >
          <span>Deep Dive Case RV-10291</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
