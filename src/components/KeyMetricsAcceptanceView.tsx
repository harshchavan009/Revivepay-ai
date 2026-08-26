import React, { useState } from "react";
import { Download, ArrowUpRight, ArrowDownRight, Check, RefreshCw, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface KeyMetricsAcceptanceViewProps {
  theme?: "light" | "dark";
}

const mockChartData = [
  { label: "Jan 1", current: 87.2, previous: 89.0 },
  { label: "Jan 5", current: 89.8, previous: 90.5 },
  { label: "Jan 10", current: 88.0, previous: 86.0 },
  { label: "Jan 15", current: 91.5, previous: 88.2 },
  { label: "Jan 20", current: 92.4, previous: 91.0 },
  { label: "Jan 25", current: 91.8, previous: 87.5 },
  { label: "Jan 30", current: 88.0, previous: 86.8 },
  { label: "Feb 5", current: 88.9, previous: 87.2 },
  { label: "Feb 10", current: 88.2, previous: 86.0 },
  { label: "Feb 15", current: 87.8, previous: 84.5 },
  { label: "Feb 20", current: 92.6, previous: 87.0 },
  { label: "Feb 25", current: 93.2, previous: 89.4 },
  { label: "Mar 1", current: 89.5, previous: 85.0 },
  { label: "Mar 5", current: 91.2, previous: 88.5 },
  { label: "Mar 10", current: 90.0, previous: 87.0 },
  { label: "Mar 15", current: 91.4, previous: 90.1 },
  { label: "Mar 20", current: 92.0, previous: 89.8 },
  { label: "Mar 25", current: 89.2, previous: 86.5 },
  { label: "Mar 30", current: 90.5, previous: 88.0 },
  { label: "Apr 5", current: 93.8, previous: 89.2 },
  { label: "Apr 10", current: 92.5, previous: 88.0 },
  { label: "Apr 15", current: 91.8, previous: 87.4 },
  { label: "Apr 20", current: 93.0, previous: 89.5 },
  { label: "Apr 25", current: 92.8, previous: 89.0 },
  { label: "Apr 30", current: 94.6, previous: 88.8 },
];

export const KeyMetricsAcceptanceView: React.FC<KeyMetricsAcceptanceViewProps> = ({ theme = "dark" }) => {
  const [activeTab, setActiveTab] = useState("Acceptance");
  const [selectedMetric, setSelectedMetric] = useState<"rate" | "count" | "volume">("rate");
  const [isExporting, setIsExporting] = useState(false);

  const tabs = ["Acceptance", "Authentication", "Disputes", "Payment Methods", "Optimization"];

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Key metrics report exported successfully!");
    }, 800);
  };

  return (
    <div className="w-full rounded-2xl shadow-xl border border-[#163E5C] bg-[#081826]/90 p-6 font-sans">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-8 border-b border-[#163E5C] mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-semibold text-sm transition-all whitespace-nowrap relative ${
              activeTab === tab
                ? "text-cyan-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-cyan-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Header with Title & Download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Key Metrics & Gateway Efficiency
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time authorization & payment settlement benchmark curves
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#163E5C] bg-[#051420] hover:bg-[#092233] text-slate-200 text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          {isExporting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>{isExporting ? "Exporting..." : "Download"}</span>
        </button>
      </div>

      {/* KPI Cards Row (Selectable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Card 1: Success Rate */}
        <div
          onClick={() => setSelectedMetric("rate")}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            selectedMetric === "rate"
              ? "border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-950/20"
              : "border-[#143952] bg-[#051420] hover:border-[#1F5275]"
          }`}
        >
          <div className="text-xs font-medium text-slate-400 mb-1">
            Payment success rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              93.50%
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>+2.45%</span>
            </span>
          </div>
        </div>

        {/* Card 2: Accepted Payments */}
        <div
          onClick={() => setSelectedMetric("count")}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            selectedMetric === "count"
              ? "border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-950/20"
              : "border-[#143952] bg-[#051420] hover:border-[#1F5275]"
          }`}
        >
          <div className="text-xs font-medium text-slate-400 mb-1">
            Accepted transactions
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              140.5K
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>+4.12%</span>
            </span>
          </div>
        </div>

        {/* Card 3: Accepted Volume (INR) */}
        <div
          onClick={() => setSelectedMetric("volume")}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            selectedMetric === "volume"
              ? "border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-950/20"
              : "border-[#143952] bg-[#051420] hover:border-[#1F5275]"
          }`}
        >
          <div className="text-xs font-medium text-slate-400 mb-1">
            Accepted volume (INR)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              ₹1.16 Cr
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>+1.56%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual Series Chart */}
      <div className="h-80 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockChartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#13354E"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "#163E5C" }}
              tick={{ fill: "#64748B", fontSize: 11 }}
            />
            <YAxis
              domain={[80, 100]}
              tickLine={false}
              axisLine={{ stroke: "#163E5C" }}
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#051420",
                borderColor: "#163E5C",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "#F8FAFC"
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
            />
            <Line
              type="monotone"
              dataKey="current"
              name="Current Revive Engine"
              stroke="#06B6D4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#06B6D4" }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              name="Previous Baseline"
              stroke="#475569"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
