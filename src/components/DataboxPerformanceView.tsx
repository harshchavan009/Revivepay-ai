import React, { useState } from "react";
import {
  Gauge,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Facebook,
  Smartphone,
  Sliders,
  Layers,
  ArrowUpDown,
  Activity,
  BarChart2,
  Users,
  DollarSign,
  Mail,
  Clock,
  Target
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface DataboxPerformanceViewProps {
  theme?: "light" | "dark";
}

const sparklineData1 = [
  { v: 120 }, { v: 140 }, { v: 110 }, { v: 160 }, { v: 90 }, { v: 85 }, { v: 130 }, { v: 100 }, { v: 95 }
];

const sparklineData3 = [
  { v: 50 }, { v: 65 }, { v: 60 }, { v: 80 }, { v: 75 }, { v: 90 }, { v: 110 }, { v: 105 }, { v: 125 }
];

const sparklineData5 = [
  { v: 80 }, { v: 95 }, { v: 70 }, { v: 110 }, { v: 105 }, { v: 140 }, { v: 120 }, { v: 150 }, { v: 160 }
];

export const DataboxPerformanceView: React.FC<DataboxPerformanceViewProps> = ({ theme = "light" }) => {
  const [timeFilter, setTimeFilter] = useState("Last 7 days");
  const [isBannerExpanded, setIsBannerExpanded] = useState(true);
  const isLight = theme === "light";

  return (
    <div className={`w-full rounded-2xl shadow-xl border overflow-hidden transition-colors duration-200 ${
      isLight ? "bg-[#F8FAFC] border-slate-200 text-slate-900" : "bg-[#090D16] border-slate-800 text-slate-100"
    }`}>
      {/* Top Header Bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
        isLight ? "bg-white border-slate-200" : "bg-[#0E1524] border-slate-800"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              Good Afternoon, Steve!
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Databox Selector */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            isLight ? "bg-slate-50 border-slate-300 text-slate-700" : "bg-slate-900 border-slate-700 text-slate-200"
          }`}>
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Databox</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Icon Buttons */}
          <div className={`flex items-center rounded-lg border p-0.5 ${
            isLight ? "bg-slate-100 border-slate-300" : "bg-slate-900 border-slate-800"
          }`}>
            <button className={`p-1.5 rounded-md ${isLight ? "bg-white shadow text-slate-800" : "bg-slate-800 text-white"}`}>
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-200">
              <Activity className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main Left Content Area */}
        <div className="flex-1 p-6 space-y-6">
          {/* Top Highlight Summary Banner */}
          <div className={`rounded-xl border p-5 transition-all ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0E1524] border-slate-800"
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                    Showing significant progress
                  </h2>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Here's how your business is doing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer ${
                    isLight ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-slate-900 border-slate-700 text-slate-200"
                  }`}
                >
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="Last 30 days">Last 30 days</option>
                  <option value="Last 90 days">Last 90 days</option>
                </select>
              </div>
            </div>

            {/* Expandable Paragraph Text */}
            {isBannerExpanded && (
              <p className={`text-xs leading-relaxed mt-4 pt-4 border-t ${
                isLight ? "border-slate-100 text-slate-600" : "border-slate-800/80 text-slate-300"
              }`}>
                In the last week, website traffic remained steady with an average of <strong className={isLight ? "text-slate-900" : "text-white"}>500 daily visits</strong>. There was a slight increase in engagement with a <strong className="text-emerald-500 font-bold">5% rise in pageviews</strong> per session. However, the <strong className="text-rose-500 font-bold">bounce rate increased by 2%</strong> to a total of 45%.
              </p>
            )}

            <button
              onClick={() => setIsBannerExpanded(!isBannerExpanded)}
              className="w-full flex items-center justify-center pt-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {isBannerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Performance Overview Grid Header */}
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
              Performance overview
            </h3>
            <div className="flex items-center gap-1">
              <button className={`p-1 rounded border ${isLight ? "bg-white border-slate-300 text-slate-600" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className={`p-1 rounded border ${isLight ? "bg-white border-slate-300 text-slate-600" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 6 Performance Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Sessions */}
            <div className={`p-5 rounded-xl border flex flex-col justify-between h-48 shadow-sm ${
              isLight ? "bg-white border-slate-200" : "bg-[#0E1524] border-slate-800"
            }`}>
              <div>
                <span className={`text-[11px] font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                  Month to date
                </span>
                <p className={`text-xs font-semibold mt-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  Sessions
                </p>
                <h4 className={`text-3xl font-extrabold tracking-tight mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>
                  290,879
                </h4>
              </div>

              {/* Red Sparkline Curve */}
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData1}>
                    <Area type="monotone" dataKey="v" stroke="#EF4444" fill="rgba(239, 68, 68, 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  My Website
                </span>
                <span className="font-bold text-rose-500 text-[11px] bg-rose-500/10 px-1.5 py-0.5 rounded">
                  ▼ 3.4%
                </span>
              </div>
            </div>

            {/* Card 2: Pageviews (Progress Bar) */}
            <div className={`p-5 rounded-xl border flex flex-col justify-between h-48 shadow-sm ${
              isLight ? "bg-white border-slate-200" : "bg-[#0E1524] border-slate-800"
            }`}>
              <div>
                <span className={`text-[11px] font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                  Month to date
                </span>
                <p className={`text-xs font-semibold mt-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  Pageviews
                </p>
                <h4 className="text-3xl font-extrabold tracking-tight mt-1 text-emerald-500">
                  56%
                </h4>
              </div>

              {/* Green Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>$3,541</span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" /> $6,500
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "56%" }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  My Website
                </span>
                <span className="font-bold text-emerald-500 text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  ▲ 3.4%
                </span>
              </div>
            </div>

            {/* Card 3: Page Likes */}
            <div className={`p-5 rounded-xl border flex flex-col justify-between h-48 shadow-sm ${
              isLight ? "bg-white border-slate-200" : "bg-[#0E1524] border-slate-800"
            }`}>
              <div>
                <span className={`text-[11px] font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                  Month to date
                </span>
                <p className={`text-xs font-semibold mt-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  Page Likes
                </p>
                <h4 className={`text-3xl font-extrabold tracking-tight mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>
                  5,283
                </h4>
              </div>

              {/* Green Sparkline Curve */}
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData3}>
                    <Area type="monotone" dataKey="v" stroke="#10B981" fill="rgba(16, 185, 129, 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                  <Facebook className="w-3.5 h-3.5 text-blue-600" />
                  My Facebook page
                </span>
                <span className="font-bold text-emerald-500 text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  ▲ 1.2%
                </span>
              </div>
            </div>

            {/* Card 4: New Likes (Yellow Progress Bar) */}
            <div className={`p-5 rounded-xl border flex flex-col justify-between h-48 shadow-sm ${
              isLight ? "bg-white border-slate-200" : "bg-[#0E1524] border-slate-800"
            }`}>
              <div>
                <span className={`text-[11px] font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                  Month to date
                </span>
                <p className={`text-xs font-semibold mt-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  New Likes
                </p>
                <h4 className="text-3xl font-extrabold tracking-tight mt-1 text-amber-500">
                  48%
                </h4>
              </div>

              {/* Yellow Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>48</span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" /> 100
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "48%" }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                  <Facebook className="w-3.5 h-3.5 text-blue-600" />
                  My Website
                </span>
                <span className="font-bold text-emerald-500 text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  ▲ 1.2%
                </span>
              </div>
            </div>

            {/* Card 5: Events */}
            <div className={`p-5 rounded-xl border flex flex-col justify-between h-48 shadow-sm ${
              isLight ? "bg-white border-slate-200" : "bg-[#0E1524] border-slate-800"
            }`}>
              <div>
                <span className={`text-[11px] font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                  Month to date
                </span>
                <p className={`text-xs font-semibold mt-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  Events
                </p>
                <h4 className={`text-3xl font-extrabold tracking-tight mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>
                  19,293
                </h4>
              </div>

              {/* Green Wave Sparkline */}
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData5}>
                    <Area type="monotone" dataKey="v" stroke="#10B981" fill="rgba(16, 185, 129, 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                  My App
                </span>
                <span className="font-bold text-emerald-500 text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  ▲ 4.8%
                </span>
              </div>
            </div>

            {/* Card 6: Sessions 14% (Red Bar) */}
            <div className={`p-5 rounded-xl border flex flex-col justify-between h-48 shadow-sm ${
              isLight ? "bg-white border-slate-200" : "bg-[#0E1524] border-slate-800"
            }`}>
              <div>
                <span className={`text-[11px] font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                  Month to date
                </span>
                <p className={`text-xs font-semibold mt-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  Sessions
                </p>
                <h4 className="text-3xl font-extrabold tracking-tight mt-1 text-rose-500">
                  14%
                </h4>
              </div>

              {/* Red Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>290.9k</span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" /> 2M
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: "14%" }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  My Website
                </span>
                <span className="font-bold text-rose-500 text-[11px] bg-rose-500/10 px-1.5 py-0.5 rounded">
                  ▼ 3.4%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Panel: Trending Up & Trending Down (Matching Image 2) */}
        <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l p-5 space-y-6 ${
          isLight ? "bg-white border-slate-200" : "bg-[#0B0E18] border-slate-800"
        }`}>
          {/* Trending Up Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h4 className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                  Trending up
                </h4>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Last 30 days</span>
            </div>

            <div className="space-y-2">
              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Impressions
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>1,732,939</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">▲ 432%</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  Deals
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>292</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">▲ 183%</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                  Resolution time
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>13h 49m 13s</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">▲ 39%</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Gross sales
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>$544</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">▲ 38.2%</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  MRR
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>$732.9k</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">▲ 2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trending Down Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h4 className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                  Trending down
                </h4>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Last 30 days</span>
            </div>

            <div className="space-y-2">
              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  Impressions
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>10,292</span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">▼ 248%</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <Mail className="w-3.5 h-3.5 text-sky-500" />
                  Emails sent
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>129</span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">▼ 92%</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  Users
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>1,292</span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">▼ 84%</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                  Churned revenue
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>$100</span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">▼ 31.3%</span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                isLight ? "bg-slate-50" : "bg-slate-900/60"
              }`}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  Sessions
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>1.9M</span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">▼ 2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
