import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

interface RevenueTrendChartProps {
  data: Array<{
    date: string;
    revenue_at_risk: number;
    recovered_revenue: number;
  }>;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data }) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#1E293B" }}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0B0F19",
              borderColor: "#1E293B",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "#F8FAFC",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
            }}
            formatter={(value: any, name: any) => [
              `₹${Number(value).toLocaleString()}`,
              name === "recovered_revenue" ? "Recovered Revenue" : "Revenue at Risk"
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            formatter={(val) => (
              <span className="text-xs text-slate-400">
                {val === "recovered_revenue" ? "Recovered Revenue" : "Revenue at Risk"}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="revenue_at_risk"
            stroke="#F59E0B"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRisk)"
          />
          <Area
            type="monotone"
            dataKey="recovered_revenue"
            stroke="#10B981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorRecovered)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
