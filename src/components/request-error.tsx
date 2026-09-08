"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface RequestErrorProps {
  message?: string;
  onRetry: () => void;
}

export default function RequestError({
  message = "We could not load this data.",
  onRetry,
}: RequestErrorProps) {
  return (
    <div className="surface-panel flex min-h-40 flex-col items-center justify-center rounded-xl px-6 py-8 text-center">
      <AlertTriangle className="h-5 w-5 text-amber-400" />
      <p className="mt-3 text-sm font-semibold text-white">Something went wrong</p>
      <p className="mt-1 text-xs text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.09]"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}
