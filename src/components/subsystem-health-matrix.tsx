"use client";

import React from "react";
import { SubsystemStatus } from "@/lib/subsystem-health";

interface SubsystemHealthMatrixProps {
  subsystems: SubsystemStatus[];
  compact?: boolean;
  showTitle?: boolean;
}

export default function SubsystemHealthMatrix({
  subsystems,
  compact = true,
  showTitle = false,
}: SubsystemHealthMatrixProps) {
  return (
    <div className="w-full">
      {showTitle && (
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5 mb-2">
          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
            System Health
          </span>
          <span className="text-[10px] text-slate-500">
            {subsystems.length} subsystems
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {subsystems.map((sub) => {
          const isCrit = sub.status === "CRITICAL";
          const isWarn = sub.status === "ATTENTION";

          const fillPercent = Math.max(5, Math.min(100, sub.score));
          const barColor = isCrit
            ? "bg-red-500"
            : isWarn
            ? "bg-amber-500"
            : "bg-emerald-500";

          const statusDot = isCrit
            ? "bg-red-500"
            : isWarn
            ? "bg-amber-400"
            : "bg-emerald-500";

          const textColor = isCrit
            ? "text-red-400"
            : isWarn
            ? "text-amber-400"
            : "text-emerald-400";

          return (
            <div
              key={sub.name}
              className="flex flex-col justify-between p-2.5 rounded border border-white/[0.06] bg-[#090b0e] hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot} shrink-0`} />
                  <span className="text-[10px] font-semibold text-slate-300 truncate">
                    {sub.name}
                  </span>
                </div>
                <span className={`font-mono text-[11px] font-bold ${textColor} shrink-0 ml-1`}>
                  {sub.score}%
                </span>
              </div>

              <div className="h-1 w-full overflow-hidden rounded-full bg-[#161c22]">
                <div
                  className={`h-full ${barColor} transition-all duration-300`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>

              <div className="text-[9px] text-slate-500 mt-1">
                {isCrit ? "Action required" : isWarn ? "Service due" : "Normal"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
