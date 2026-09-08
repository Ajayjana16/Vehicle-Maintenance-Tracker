"use client";

import React from "react";
import { getHealthStatusLabel } from "@/lib/health-calculator";
import { ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";

interface HealthGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function HealthGauge({
  score,
  size = "md",
  showLabel = true,
}: HealthGaugeProps) {
  const status = getHealthStatusLabel(score);

  // SVG parameters for radial arc (from 135 deg to 405 deg = 270 deg span)
  const radius = size === "lg" ? 64 : size === "md" ? 50 : 36;
  const strokeWidth = size === "lg" ? 7 : size === "md" ? 6 : 5;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const progressOffset = arcLength - (Math.max(0, Math.min(100, score)) / 100) * arcLength;

  const dimension = size === "lg" ? 160 : size === "md" ? 130 : 96;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        className="relative flex items-center justify-center"
        style={{ width: dimension, height: dimension }}
      >
        <svg
          className="transform -rotate-[135deg]"
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
        >
          {/* Background Track with tick markings */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="#1c2228"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Health Score Meter */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={status.color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-mono font-bold tracking-tight text-white ${
              size === "lg" ? "text-3xl" : size === "md" ? "text-2xl" : "text-lg"
            }`}
          >
            {score}
            <span className="text-[10px] font-sans font-normal text-slate-500">/100</span>
          </span>
          <span className="text-[8px] uppercase font-bold tracking-widest text-slate-500 -mt-0.5">
            INDEX
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${status.badgeClass}`}
          >
            {score >= 75 ? (
              <ShieldCheck className="h-3 w-3" />
            ) : score >= 60 ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <AlertOctagon className="h-3 w-3" />
            )}
            {status.label}
          </span>
        </div>
      )}
    </div>
  );
}
