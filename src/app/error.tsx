"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AutoPulse Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="surface-panel w-full max-w-lg p-8 text-center space-y-5 border-red-500/30">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-red-400">
            <AlertTriangle className="h-3 w-3" /> System Fault Handled
          </span>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-white">
            Telemetry Rendering Interrupted
          </h1>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            An unexpected error occurred while executing client telemetry state. The application data remains safely persisted.
          </p>
          {error?.message && (
            <div className="mt-3 rounded border border-white/[0.06] bg-[#0c0f12] p-3 text-left">
              <p className="font-mono text-[11px] text-red-400 break-all">{error.message}</p>
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="action-primary text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Re-initialize View</span>
          </button>
          <Link href="/" className="action-secondary text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Command Center</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
