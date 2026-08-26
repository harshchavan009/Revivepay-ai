import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, ArrowUpRight, DollarSign, Users, ShieldCheck, RefreshCw, Zap } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { KeyMetricsAcceptanceView } from "../components/KeyMetricsAcceptanceView";
import { formatINR, SHARED_METRICS, SHARED_CASES } from "../data/mockData";

const mockVolumeData = [
  { day: "Aug 1", current: 45000, previous: 28000 },
  { day: "Aug 3", current: 68000, previous: 52000 },
  { day: "Aug 5", current: 51000, previous: 42000 },
  { day: "Aug 7", current: 78000, previous: 61000 },
  { day: "Aug 9", current: 62000, previous: 54000 },
  { day: "Aug 11", current: 67000, previous: 59000 },
  { day: "Aug 13", current: 98000, previous: 72000 },
];

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#13354E] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              FINANCIAL TELEMETRY
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              REAL-TIME AGGREGATES
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>Financial & SaaS Revenue Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            MRR protection cohorts, retry efficiency benchmarks, and gateway volume intelligence.
          </p>
        </div>
      </div>

      {/* TOP KPI ROW (INR figures derived from SHARED_METRICS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl bg-[#081826]/90 border border-[#163E5C] space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Recovered Revenue</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            {formatINR(142605)}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+4.8% Topline Boost</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl bg-[#081826]/90 border border-[#163E5C] space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Protected MRR Mandates</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            {formatINR(48200)}<span className="text-sm font-normal text-slate-400">/mo</span>
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>142 Active Subscribers Protected</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl bg-[#081826]/90 border border-[#163E5C] space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Autonomous Recovery Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            65.2%
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% vs. Legacy Fixed Retries</span>
          </div>
        </div>
      </div>

      {/* REVENUE CAPTURE TREND CHART */}
      <div className="p-6 rounded-2xl bg-[#081826]/90 border border-[#163E5C] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Gross Recovered Volume Trend (INR ₹)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison: Automated Multi-Signal Retries vs. Prior Fixed Schedule
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
              <span>Current Revive Retries</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-2.5 h-2.5 rounded bg-slate-600"></span>
              <span>Previous Fixed Dunning</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockVolumeData}>
              <defs>
                <linearGradient id="currentVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                formatter={(val: any) => formatINR(Number(val))}
                contentStyle={{
                  backgroundColor: "#051420",
                  borderColor: "#163E5C",
                  borderRadius: "0.75rem",
                  fontSize: "12px"
                }}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#06B6D4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#currentVolumeGrad)"
              />
              <Area
                type="monotone"
                dataKey="previous"
                stroke="#475569"
                strokeWidth={1.5}
                fillOpacity={0.1}
                fill="#475569"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KEY METRICS SUB-SECTION */}
      <KeyMetricsAcceptanceView theme="dark" />
    </div>
  );
};
