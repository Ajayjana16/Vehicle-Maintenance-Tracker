import React from "react";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading vehicle health telemetry...">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-white/[0.06]" />
          <div className="h-7 w-64 rounded bg-white/[0.08]" />
          <div className="h-3 w-96 rounded bg-white/[0.04]" />
        </div>
        <div className="h-8 w-36 rounded bg-white/[0.06]" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="surface-panel p-4 h-24 space-y-2">
            <div className="h-3 w-20 rounded bg-white/[0.06]" />
            <div className="h-6 w-16 rounded bg-white/[0.08]" />
          </div>
        ))}
      </div>

      {/* Main Table / Matrix Skeleton */}
      <div className="surface-panel p-6 h-80 rounded-lg space-y-4">
        <div className="h-4 w-48 rounded bg-white/[0.06]" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </div>
  );
}
