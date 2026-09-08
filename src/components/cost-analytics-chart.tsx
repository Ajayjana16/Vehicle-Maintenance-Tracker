"use client";

import React, { useMemo } from "react";
import { BarChart3, DollarSign, PieChart as PieIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MaintenanceRecordItem } from "@/types";
import EmptyState from "@/components/empty-state";

interface CostAnalyticsChartProps {
  records: MaintenanceRecordItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  OIL_CHANGE: "#e5a93c", // signature amber
  BRAKES: "#ef4444",     // red
  TIRES: "#f59e0b",      // warm amber
  BATTERY: "#a855f7",    // purple
  FLUIDS: "#22c55e",     // emerald
  INSPECTION: "#38bdf8", // cyan
  REPAIR: "#f87171",     // light red
  FILTERS: "#14b8a6",    // teal
  GENERAL: "#64748b",    // slate
};

export default function CostAnalyticsChart({ records }: CostAnalyticsChartProps) {
  const analytics = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    const monthMap: Record<string, number> = {};
    let totalSpend = 0;

    for (const rec of records) {
      const type = rec.serviceType || "GENERAL";
      categoryTotals[type] = (categoryTotals[type] || 0) + rec.cost;
      totalSpend += rec.cost;
      const date = new Date(rec.serviceDate);
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthMap[monthKey] = (monthMap[monthKey] || 0) + rec.cost;
    }

    return {
      totalSpend,
      pieData: Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
        color: CATEGORY_COLORS[name] || "#64748b",
      })),
      barData: Object.entries(monthMap).map(([month, cost]) => ({
        month,
        cost: parseFloat(cost.toFixed(2)),
      })),
    };
  }, [records]);

  const { pieData, barData, totalSpend } = analytics;

  if (records.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        eyebrow="Ownership Analytics"
        title="No maintenance spend records"
        description="Log service records or parse invoices to visualize category expenditure breakdown and cost trends."
        actionLabel="Log maintenance"
        href="/maintenance"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Category Breakdown Pie */}
      <div className="surface-panel p-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <PieIcon className="h-3.5 w-3.5 text-amber-400" />
            Expenditure by Service Category
          </h4>
          <span className="font-mono font-bold text-xs text-emerald-400">
            ${totalSpend.toFixed(2)} Total
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                stroke="#090b0d"
                strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1215",
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  borderRadius: "0.375rem",
                  fontSize: "12px",
                  color: "#f0f4f8",
                }}
                formatter={(val: any) => [`$${Number(val).toFixed(2)}`, "Cost"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 justify-center text-[11px]">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-slate-400">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>
                {item.name}: <strong className="font-mono text-slate-300">${item.value.toFixed(0)}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Expenditure Trend */}
      <div className="surface-panel p-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
            Historical Spend Timeline
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">By Service Month</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                stroke="#505c66"
                fontSize={10}
                tickLine={false}
                fontFamily="ui-monospace, monospace"
              />
              <YAxis
                stroke="#505c66"
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => `$${val}`}
                fontFamily="ui-monospace, monospace"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1215",
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  borderRadius: "0.375rem",
                  fontSize: "12px",
                  color: "#f0f4f8",
                }}
                formatter={(val: any) => [`$${Number(val).toFixed(2)}`, "Spent"]}
              />
              <Bar
                dataKey="cost"
                fill="#e5a93c"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          Aggregated across your vehicles
        </div>
      </div>
    </div>
  );
}
