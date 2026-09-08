"use client";

import React from "react";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

interface ProjectionItem {
  id: string;
  taskName: string;
  category: string;
  wearPercent: number;
  milesRemaining: number;
  daysRemaining: number;
  estimatedDueDate: string;
  estimatedCost: number;
  urgency: string;
}

interface PredictiveTimelineProps {
  vehicleName: string;
  currentMileage: number;
  avgDailyMiles: number;
  next12MonthsBudget: number;
  projections: ProjectionItem[];
}

export default function PredictiveTimeline({
  vehicleName,
  currentMileage,
  avgDailyMiles,
  next12MonthsBudget,
  projections,
}: PredictiveTimelineProps) {
  return (
    <div className="space-y-6">
      {/* 12-Month Financial Forecast Banner */}
      <div className="surface-panel p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                12-Month Predictive Maintenance Forecast
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated at ~{avgDailyMiles} miles/day velocity ({currentMileage.toLocaleString()} mi current odometer)
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-[#0c0f12] border border-white/[0.08] px-4 py-2.5 sm:text-right">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Projected 12-Month Budget
            </span>
            <span className="font-mono text-2xl font-bold text-emerald-400 block mt-0.5">
              ${next12MonthsBudget.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Component Wear Breakdown */}
      <div className="surface-panel p-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            Component Wear Lifecycles & Replacement Milestones
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            {projections.length} COMPONENTS TRACKED
          </span>
        </div>

        <div className="space-y-3">
          {projections.map((item) => {
            const isOverdue = item.urgency === "OVERDUE";
            const isDueSoon = item.urgency === "DUE_SOON";

            const progressColor = isOverdue
              ? "bg-red-500"
              : isDueSoon
              ? "bg-amber-500"
              : item.wearPercent > 70
              ? "bg-sky-400"
              : "bg-emerald-500";

            return (
              <div
                key={item.id}
                className="rounded-lg border border-white/[0.06] bg-[#0c0f12] p-4 transition-colors hover:border-white/[0.12]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isOverdue
                          ? "bg-red-500"
                          : isDueSoon
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-200 block">
                        {item.taskName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Category: {item.category} • Est. Cost: ${item.estimatedCost}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`badge-status ${
                        isOverdue ? "critical" : isDueSoon ? "attention" : "healthy"
                      }`}
                    >
                      {isOverdue ? (
                        <>
                          <AlertOctagon className="h-3 w-3" /> Overdue
                        </>
                      ) : isDueSoon ? (
                        <>
                          <AlertTriangle className="h-3 w-3" /> Due Soon
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3 w-3" /> Optimal
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-400 text-[11px]">
                      Wear Consumed: <strong className="text-slate-200 font-mono">{item.wearPercent}%</strong>
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {item.milesRemaining <= 0 ? (
                        <span className="text-red-400 font-bold">
                          {Math.abs(item.milesRemaining).toLocaleString()} mi past due
                        </span>
                      ) : (
                        <span>
                          {item.milesRemaining.toLocaleString()} mi (~{item.daysRemaining} days remaining)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full ${progressColor} transition-all duration-500`}
                      style={{ width: `${Math.min(100, item.wearPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/[0.04] pt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    Target Date: <strong className="text-slate-400 font-mono">{item.estimatedDueDate}</strong>
                  </span>
                  <span className="font-mono text-slate-400">
                    Est. Replacement: <strong className="text-slate-300 font-bold">${item.estimatedCost}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
