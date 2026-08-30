import React, { useState } from "react";
import { BarChart3, TrendingUp, ShieldCheck, Zap, Calendar, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { KeyMetricsAcceptanceView } from "../components/KeyMetricsAcceptanceView";
import { useTheme } from "../context/ThemeContext";
import { useMetrics } from "../context/MetricsContext";
import { formatINR } from "../data/mockData";

type DateRange = "7D" | "30D" | "90D" | "YTD";

const VOLUME_DATA_BY_RANGE: Record<DateRange, Array<{ day: string; current: number; previous: number; rate: number }>> = {
  "7D": [
    { day: "Day 1 (Mon)", current: 48500, previous: 29000, rate: 62.4 },
    { day: "Day 2 (Tue)", current: 62400, previous: 38200, rate: 64.1 },
    { day: "Day 3 (Wed)", current: 54100, previous: 41000, rate: 63.8 },
    { day: "Day 4 (Thu)", current: 81200, previous: 52400, rate: 66.5 },
    { day: "Day 5 (Fri)", current: 73500, previous: 49800, rate: 65.2 },
    { day: "Day 6 (Sat)", current: 68900, previous: 44300, rate: 64.7 },
    { day: "Day 7 (Sun)", current: 99400, previous: 61200, rate: 68.2 },
  ],
  "30D": [
    { day: "Aug 1", current: 45000, previous: 28000, rate: 61.2 },
    { day: "Aug 4", current: 58000, previous: 34000, rate: 62.8 },
    { day: "Aug 8", current: 68000, previous: 42000, rate: 63.5 },
    { day: "Aug 12", current: 51000, previous: 39000, rate: 62.1 },
    { day: "Aug 16", current: 78000, previous: 51000, rate: 65.4 },
    { day: "Aug 20", current: 62000, previous: 44000, rate: 64.0 },
    { day: "Aug 24", current: 67000, previous: 48000, rate: 64.7 },
    { day: "Aug 28", current: 89000, previous: 58000, rate: 66.8 },
    { day: "Aug 30", current: 98000, previous: 62000, rate: 67.5 },
  ],
  "90D": [
    { day: "Jun W1", current: 185000, previous: 112000, rate: 58.4 },
    { day: "Jun W3", current: 224000, previous: 138000, rate: 60.1 },
    { day: "Jul W1", current: 265000, previous: 165000, rate: 62.3 },
    { day: "Jul W3", current: 298000, previous: 182000, rate: 63.7 },
    { day: "Aug W1", current: 340000, previous: 210000, rate: 65.0 },
    { day: "Aug W3", current: 395000, previous: 235000, rate: 66.9 },
  ],
  "YTD": [
    { day: "Jan", current: 420000, previous: 280000, rate: 54.2 },
    { day: "Feb", current: 580000, previous: 360000, rate: 57.1 },
    { day: "Mar", current: 720000, previous: 450000, rate: 59.8 },
    { day: "Apr", current: 890000, previous: 540000, rate: 61.5 },
    { day: "May", current: 1050000, previous: 660000, rate: 63.2 },
    { day: "Jun", current: 1240000, previous: 780000, rate: 64.4 },
    { day: "Jul", current: 1480000, previous: 920000, rate: 65.8 },
    { day: "Aug", current: 1720000, previous: 1080000, rate: 67.2 },
  ],
};

export const AnalyticsPage: React.FC = () => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const { recoveredRevenue, recoveryRate } = useMetrics();
  const [selectedRange, setSelectedRange] = useState<DateRange>("30D");

  const chartData = VOLUME_DATA_BY_RANGE[selectedRange];

  // Custom Interactive Glassmorphism Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload[0]?.value || 0;
      const previous = payload[1]?.value || 0;
      const delta = current - previous;
      const pct = previous > 0 ? ((delta / previous) * 100).toFixed(1) : "0.0";
      const rate = payload[0]?.payload?.rate || 64.7;

      return (
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-surface-raised)] border border-[var(--color-border)] shadow-premium-lg text-xs space-y-2 font-sans backdrop-blur-md min-w-[200px]">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-1.5 font-mono">
            <span className="font-bold text-[var(--color-text-primary)]">{label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              {rate}% Yield
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                <span>Revive Autonomous:</span>
              </span>
              <span className="font-bold text-[var(--color-text-primary)] font-mono">{formatINR(current)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-border-hover)] shrink-0"></span>
                <span>Fixed Legacy Retries:</span>
              </span>
              <span className="text-[var(--color-text-muted)] font-mono">{formatINR(previous)}</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Incremental Lift:</span>
            </span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{formatINR(delta)} (+{pct}%)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-16 font-sans transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest">
              FINANCIAL TELEMETRY
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              REAL-TIME AGGREGATES
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--color-accent)]" />
            <span>Financial & SaaS Revenue Analytics</span>
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            MRR protection cohorts, retry efficiency benchmarks, and gateway volume intelligence.
          </p>
        </div>

        {/* Date Range Selector Header Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm">
          <Calendar className="w-4 h-4 text-[var(--color-text-muted)] ml-2 mr-1 shrink-0" />
          {(["7D", "30D", "90D", "YTD"] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedRange === range
                  ? "bg-[var(--color-accent)] text-white shadow-premium-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)]"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* TOP KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Total Recovered Revenue</span>
            <div className="p-2 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight font-mono">
            {formatINR(recoveredRevenue)}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+4.8% Topline Boost</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Protected MRR Mandates</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight font-mono">
            {formatINR(48200)}<span className="text-sm font-normal text-[var(--color-text-muted)] font-sans">/mo</span>
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>142 Active Subscribers Protected</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-3 shadow-premium-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Autonomous Recovery Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight font-mono">
            {recoveryRate}%
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% vs. Legacy Fixed Retries</span>
          </div>
        </div>
      </div>

      {/* REVENUE CAPTURE TREND CHART WITH DATE RANGE PICKER & INTERACTIVE HOVER */}
      <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight">
                Gross Recovered Volume Trend (INR ₹)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-bold">
                {selectedRange} Window
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Comparison: Autonomous Multi-Signal Retries vs. Prior Fixed Schedule
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[var(--color-accent)] font-medium">
              <span className="w-2.5 h-2.5 rounded bg-[var(--color-accent)]"></span>
              <span>RevivePay Autonomous</span>
            </span>
            <span className="flex items-center gap-1.5 text-[var(--color-text-muted)] font-medium">
              <span className="w-2.5 h-2.5 rounded bg-[var(--color-border-hover)]"></span>
              <span>Fixed Legacy Baseline</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="currentVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? "#4F5FF0" : "#4338CA"} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={isDark ? "#4F5FF0" : "#4338CA"} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1C202A" : "#E2E8F0"} vertical={false} />
              <XAxis dataKey="day" stroke={isDark ? "#475569" : "#94A3B8"} tick={{ fontSize: 11 }} />
              <YAxis stroke={isDark ? "#475569" : "#94A3B8"} tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="current"
                stroke={isDark ? "#4F5FF0" : "#4338CA"}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#currentVolumeGrad)"
              />
              <Area
                type="monotone"
                dataKey="previous"
                stroke={isDark ? "#343B4A" : "#CBD5E1"}
                strokeWidth={1.5}
                fillOpacity={0.08}
                fill={isDark ? "#343B4A" : "#CBD5E1"}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KEY METRICS SUB-SECTION */}
      <KeyMetricsAcceptanceView />
    </div>
  );
};
