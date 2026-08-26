import React, { useState, useEffect } from "react";
import { BarChart3, Download, CheckSquare, Square } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { dashboardService } from "../services";
import { DashboardMetrics } from "../types";
import { KeyMetricsAcceptanceView } from "../components/KeyMetricsAcceptanceView";

const mockNewCustomerData = [
  { day: "Aug 1", current: 4200, previous: 2100 },
  { day: "Aug 2", current: 2800, previous: 2500 },
  { day: "Aug 3", current: 3100, previous: 3800 },
  { day: "Aug 4", current: 2400, previous: 4400 },
  { day: "Aug 5", current: 3900, previous: 3600 },
  { day: "Aug 6", current: 4900, previous: 3100 },
  { day: "Aug 7", current: 2900, previous: 4100 },
  { day: "Aug 8", current: 3900, previous: 3900 },
  { day: "Aug 9", current: 3800, previous: 3700 },
  { day: "Aug 10", current: 2100, previous: 4300 },
  { day: "Aug 11", current: 3100, previous: 3800 },
  { day: "Aug 12", current: 2800, previous: 3900 },
  { day: "Aug 13", current: 4100, previous: 3100 },
  { day: "Aug 14", current: 3600, previous: 3500 },
];

const mockGrossVolumeData = [
  { day: "Aug 1", current: 4500, previous: 8100 },
  { day: "Aug 3", current: 6800, previous: 5200 },
  { day: "Aug 5", current: 5100, previous: 9200 },
  { day: "Aug 7", current: 7800, previous: 6100 },
  { day: "Aug 9", current: 6200, previous: 9800 },
  { day: "Aug 11", current: 6700, previous: 5900 },
  { day: "Aug 13", current: 9800, previous: 7200 },
];

export const AnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [showCurrent, setShowCurrent] = useState(true);
  const [showPrevious, setShowPrevious] = useState(true);

  useEffect(() => {
    dashboardService.getSummary().then(setMetrics);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Financial & SaaS Revenue Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            MRR breakdowns, cohort metrics, retry efficiency benchmarks, and financial volume intelligence.
          </p>
        </div>
      </div>

      {/* SECTION 1: SAAS MRR & ACCOUNT ANALYTICS DASHBOARD (IMAGE 3) */}
      <div className="space-y-6">
        {/* Top Grid: MRR & Customers Summary + New Customers Dual Area Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Block: MRR & Active Subscriptions */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-center space-y-6 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              MRR & Customers
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400">MRR</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  $ 271.00
                </h3>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400">Active Subscriptions</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  283
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                  ▲ 65% <span className="font-normal text-slate-400 text-[10px]">vs prev (172)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Block: New Customers Dual Area Chart (Image 3) */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-400">Month to Date (Aug 1 - 14)</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    New Customers 1,851
                  </h3>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    ▼ 31% <span className="font-normal text-slate-400 text-[10px]">vs previous period (2,697)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockNewCustomerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="grayGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#94A3B8", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  {showPrevious && (
                    <Area type="monotone" dataKey="previous" stroke="#94A3B8" strokeDasharray="3 3" fill="url(#grayGradient)" strokeWidth={2} />
                  )}
                  {showCurrent && (
                    <Area type="monotone" dataKey="current" stroke="#8B5CF6" fill="url(#purpleGradient)" strokeWidth={2.5} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Checkbox Controls (Image 3) */}
            <div className="flex items-center justify-center gap-6 pt-2 text-xs">
              <label
                onClick={() => setShowCurrent(!showCurrent)}
                className="flex items-center gap-1.5 cursor-pointer text-slate-800 font-bold"
              >
                {showCurrent ? <CheckSquare className="w-4 h-4 text-purple-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>New Customers</span>
              </label>
              <label
                onClick={() => setShowPrevious(!showPrevious)}
                className="flex items-center gap-1.5 cursor-pointer text-slate-500 font-medium"
              >
                {showPrevious ? <CheckSquare className="w-4 h-4 text-slate-500" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>Previous period</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Grid: 3 Tables & Charts (Image 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Table 1: MRR Overview */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900">MRR Overview</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                  <tr>
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Value</th>
                    <th className="pb-2 text-right">vs prev</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  <tr>
                    <td className="py-2 text-slate-700">New MRR</td>
                    <td className="py-2 text-right font-bold text-slate-900">$ 334.4k</td>
                    <td className="py-2 text-right text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">▲ 23%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700">Upgrades</td>
                    <td className="py-2 text-right font-bold text-slate-900">$ 22.7k</td>
                    <td className="py-2 text-right text-rose-600 bg-rose-50 px-1 py-0.5 rounded text-[10px]">▼ 26%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700">Churned MRR</td>
                    <td className="py-2 text-right font-bold text-slate-900">$ 4,788.00</td>
                    <td className="py-2 text-right text-rose-600 bg-rose-50 px-1 py-0.5 rounded text-[10px]">▲ 46%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700">Refunds</td>
                    <td className="py-2 text-right font-bold text-slate-900">$ 2,004.00</td>
                    <td className="py-2 text-right text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">▼ 57%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700">Discounts in MRR</td>
                    <td className="py-2 text-right font-bold text-slate-900">$ 4,184.00</td>
                    <td className="py-2 text-right text-rose-600 bg-rose-50 px-1 py-0.5 rounded text-[10px]">▼ 7%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700">Downgrades</td>
                    <td className="py-2 text-right font-bold text-slate-900">$ 530.00</td>
                    <td className="py-2 text-right text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">▼ 11%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Account Analytics */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900">Account Analytics</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                  <tr>
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Value</th>
                    <th className="pb-2 text-right">vs prev</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  <tr>
                    <td className="py-2.5 text-slate-700">Gross Volume</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">$ 9,408.00</td>
                    <td className="py-2.5 text-right text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">▲ 18%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-700">New Customers</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">1,044</td>
                    <td className="py-2.5 text-right text-rose-600 bg-rose-50 px-1 py-0.5 rounded text-[10px]">▼ 77%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-700">Payments</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">96,188</td>
                    <td className="py-2.5 text-right text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">▲ 16%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-700">ARR</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">$ 861.00</td>
                    <td className="py-2.5 text-right text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">▲ 416%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart 3: Gross Volume Shaded Area Chart */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-400">Month to Date (Aug 7 - 13)</span>
              <h4 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">Gross Volume</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight">$ 7,566.00</span>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">▼ 11% <span className="font-normal text-slate-400 text-[10px]">vs prev</span></span>
              </div>
            </div>

            <div className="h-36 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockGrossVolumeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grossPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="grossGray" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#94A3B8", fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="previous" stroke="#94A3B8" strokeDasharray="3 3" fill="url(#grossGray)" strokeWidth={2} />
                  <Area type="monotone" dataKey="current" stroke="#8B5CF6" fill="url(#grossPurple)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: KEY METRICS ACCEPTANCE DASHBOARD (IMAGE 1) */}
      <KeyMetricsAcceptanceView theme="light" />
    </div>
  );
};
