import React, { useState } from "react";
import { Download, ArrowUpRight, ArrowDownRight, Check, RefreshCw } from "lucide-react";
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

export const KeyMetricsAcceptanceView: React.FC<KeyMetricsAcceptanceViewProps> = ({ theme = "light" }) => {
  const [activeTab, setActiveTab] = useState("Acceptance");
  const [selectedMetric, setSelectedMetric] = useState<"rate" | "count" | "volume">("rate");
  const [isExporting, setIsExporting] = useState(false);

  const tabs = ["Acceptance", "Authentication", "Disputes", "Payment Methods", "Optimization"];

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Key metrics report exported successfully (CSV/PDF)!");
    }, 800);
  };

  const isLight = theme === "light";

  return (
    <div className={`w-full rounded-2xl shadow-xl border p-6 transition-colors duration-200 ${
      isLight 
        ? "bg-white border-slate-200 text-slate-900" 
        : "bg-[#0B0F19] border-slate-800 text-slate-100"
    }`}>
      {/* Navigation Sub-Tabs */}
      <div className={`flex items-center gap-8 border-b mb-6 overflow-x-auto ${
        isLight ? "border-slate-200" : "border-slate-800"
      }`}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-semibold text-sm transition-all whitespace-nowrap relative ${
              activeTab === tab
                ? isLight 
                  ? "text-indigo-600 font-bold" 
                  : "text-indigo-400 font-bold"
                : isLight 
                  ? "text-slate-500 hover:text-slate-800" 
                  : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Header with Title & Download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-xl font-extrabold tracking-tight ${
            isLight ? "text-slate-900" : "text-slate-100"
          }`}>
            Key metrics
          </h2>
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Real-time authorization & payment settlement benchmark curves
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-all active:scale-95 ${
            isLight
              ? "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              : "border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
          }`}
        >
          {isExporting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 text-slate-500" />
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
              ? isLight
                ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20"
                : "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-950/20"
              : isLight
                ? "border-slate-200 bg-white hover:border-slate-300"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
          }`}
        >
          <div className={`text-xs font-medium mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Payment success rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              93.50%
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              +2.45%
            </span>
          </div>
        </div>

        {/* Card 2: Accepted Payments */}
        <div
          onClick={() => setSelectedMetric("count")}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            selectedMetric === "count"
              ? isLight
                ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20"
                : "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-950/20"
              : isLight
                ? "border-slate-200 bg-white hover:border-slate-300"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
          }`}
        >
          <div className={`text-xs font-medium mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Accepted payments
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              140.5K
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">
              -0.34%
            </span>
          </div>
        </div>

        {/* Card 3: Accepted Volume */}
        <div
          onClick={() => setSelectedMetric("volume")}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            selectedMetric === "volume"
              ? isLight
                ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20"
                : "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-950/20"
              : isLight
                ? "border-slate-200 bg-white hover:border-slate-300"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
          }`}
        >
          <div className={`text-xs font-medium mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Accepted volume
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              $11.6M
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              +1.56%
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual Series Chart (Matching Image 1) */}
      <div className="h-80 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockChartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isLight ? "#E2E8F0" : "#1E293B"}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: isLight ? "#E2E8F0" : "#334155" }}
              tick={{ fill: isLight ? "#64748B" : "#94A3B8", fontSize: 11 }}
              interval={5}
            />
            <YAxis
              orientation="right"
              domain={[80, 95]}
              ticks={[80, 85, 90, 95]}
              unit="%"
              tickLine={false}
              axisLine={false}
              tick={{ fill: isLight ? "#94A3B8" : "#64748B", fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className={`p-3 rounded-lg border shadow-lg text-xs font-sans ${
                      isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-700 text-slate-100"
                    }`}>
                      <p className="font-bold border-b pb-1 mb-2 border-slate-200 dark:border-slate-800">{label}</p>
                      <div className="flex items-center justify-between gap-4 text-indigo-500 font-semibold">
                        <span>Current period:</span>
                        <span>{payload[0]?.value}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-400">
                        <span>Previous period:</span>
                        <span>{payload[1]?.value}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="current"
              name="Current period"
              stroke="#8B5CF6"
              strokeWidth={3.5}
              dot={false}
              activeDot={{ r: 6, fill: "#8B5CF6", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              name="Previous period"
              stroke="#94A3B8"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Bottom Legend Matching Image 1 */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-2 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#8B5CF6] inline-block"></span>
            <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              Current period
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#94A3B8] inline-block"></span>
            <span className={`font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Previous period
            </span>
          </div>
        </div>

        <div className={`font-mono text-xs ${isLight ? "text-slate-400" : "text-slate-500"}`}>
          Jan — Apr Range
        </div>
      </div>
    </div>
  );
};
