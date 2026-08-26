import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface FailureReasonDonutProps {
  data: Array<{
    category: string;
    label: string;
    count: number;
    amount: number;
  }>;
}

const COLORS = ["#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981", "#EC4899"];

export const FailureReasonDonut: React.FC<FailureReasonDonutProps> = ({ data }) => {
  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="count"
            nameKey="label"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0B0F19" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0B0F19",
              borderColor: "#1E293B",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "#F8FAFC",
            }}
            formatter={(value: any, name: any, item: any) => [
              `${value} failures (₹${item.payload.amount?.toLocaleString()})`,
              name
            ]}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            formatter={(val) => <span className="text-[11px] text-slate-400">{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
