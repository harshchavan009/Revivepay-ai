import React, { useState } from "react";
import { Download, Check, RefreshCw, TrendingUp } from "lucide-react";
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
import { useTheme } from "../context/ThemeContext";

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

export const KeyMetricsAcceptanceView: React.FC = () => {
  const { effectiveTheme } = useTheme();
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

  const isDark = effectiveTheme === "dark";

  return (
    <div className="w-full rounded-2xl shadow-premium-sm border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 font-sans transition-colors">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-8 border-b border-[var(--color-border-subtle)] mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-semibold text-sm transition-all whitespace-nowrap relative cursor-pointer ${
              activeTab === tab
                ? "text-[var(--color-accent)] font-bold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--color-accent)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Header with Title & Download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Key Metrics & Gateway Efficiency
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Real-time authorization & payment settlement benchmark curves
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-canvas)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          {isExporting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--color-accent)]" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{isExporting ? "Exporting..." : "Export telemetry"}</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Acceptance Rate */}
        <div
          onClick={() => setSelectedMetric("rate")}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            selectedMetric === "rate"
              ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 bg-[var(--color-accent-subtle)]"
              : "border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] hover:border-[var(--color-border)]"
          }`}
        >
          <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">
            Acceptance rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight font-mono">
              94.6%
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>+5.8%</span>
            </span>
          </div>
        </div>

        {/* Card 2: Successful Transactions */}
        <div
          onClick={() => setSelectedMetric("count")}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            selectedMetric === "count"
              ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 bg-[var(--color-accent-subtle)]"
              : "border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] hover:border-[var(--color-border)]"
          }`}
        >
          <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">
            Successful transactions
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight font-mono">
              1,42,605
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
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
              ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 bg-[var(--color-accent-subtle)]"
              : "border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] hover:border-[var(--color-border)]"
          }`}
        >
          <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">
            Accepted volume (INR)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight font-mono">
              ₹1.16 Cr
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
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
              stroke={isDark ? "var(--color-border-subtle)" : "#E2E8F0"}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: isDark ? "var(--color-border)" : "#CBD5E1" }}
              tick={{ fill: isDark ? "#94A3B8" : "#64748B", fontSize: 11 }}
            />
            <YAxis
              domain={[80, 100]}
              tickLine={false}
              axisLine={{ stroke: isDark ? "var(--color-border)" : "#CBD5E1" }}
              tick={{ fill: isDark ? "#94A3B8" : "#64748B", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "var(--color-bg-surface)" : "#FFFFFF",
                borderColor: isDark ? "var(--color-border)" : "#CBD5E1",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: isDark ? "var(--color-text-primary)" : "#0F172A",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
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
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "var(--color-accent)" }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              name="Previous Baseline"
              stroke={isDark ? "#64748B" : "#94A3B8"}
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
