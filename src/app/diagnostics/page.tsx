"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Cpu,
  AlertTriangle,
  Wrench,
  DollarSign,
  Filter,
  Check,
  RotateCcw,
  AlertOctagon,
  ShieldCheck,
  Info,
} from "lucide-react";
import ObdScannerModal from "@/components/obd-scanner-modal";
import EmptyState from "@/components/empty-state";
import RequestError from "@/components/request-error";
import { useVehicleSummaries } from "@/components/vehicle-summary-provider";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/components/auth-context";

function DiagnosticsContent() {
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get("vehicleId") || "";

  const { isAuthenticated } = useAuth();
  const { vehicles, error: vehicleError, ensureLoaded } = useVehicleSummaries();
  const [scans, setScans] = useState<any[]>([]);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>(initialVehicleId);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      void ensureLoaded().catch(() => undefined);
    }
  }, [isAuthenticated, ensureLoaded]);

  const fetchDiagnostics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (selectedVehicleFilter) queryParams.set("vehicleId", selectedVehicleFilter);
      const data = await apiFetch<any[]>(`/api/diagnostics?${queryParams.toString()}`);
      if (Array.isArray(data)) {
        setScans(data);
      }
    } catch (err) {
      console.error("Error fetching diagnostics:", err);
      const message = err instanceof Error ? err.message : "Diagnostic data is temporarily unavailable.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchDiagnostics();
    }
  }, [isAuthenticated, fetchDiagnostics]);

  const handleToggleStatus = async (scanId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "RESOLVED" : "ACTIVE";
    try {
      await apiFetch("/api/diagnostics", {
        method: "PATCH",
        body: JSON.stringify({ id: scanId, status: newStatus }),
      });
      fetchDiagnostics();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredScans = scans.filter((s) => {
    if (severityFilter === "ALL") return true;
    return s.severity === severityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <span className="eyebrow">
            <Cpu className="h-3 w-3" /> Diagnostics
          </span>
          <h1 className="page-heading mt-1">Diagnostics & Trouble Codes</h1>
          <p className="text-xs text-slate-400 mt-1">
            OBD-II fault code triage, safety guidance, and estimated repair costs.
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="action-primary text-xs self-start sm:self-auto"
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Run Diagnostic Scan</span>
        </button>
      </header>

      {/* Filter Toolbar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-[#0f1215] p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold text-[11px] uppercase">Vehicle:</span>
          </div>

          <select
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
            className="rounded border border-white/[0.08] bg-[#090b0e] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded border border-white/[0.08] bg-[#090b0e] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="MODERATE">Moderate Severity</option>
            <option value="MINOR">Minor Severity</option>
          </select>
        </div>

        <div className="font-mono text-xs text-slate-400">
          Scans: <strong className="text-white">{filteredScans.length}</strong>
        </div>
      </section>

      {/* Scans List */}
      {vehicleError && vehicles.length === 0 ? (
        <RequestError
          message={vehicleError}
          onRetry={() => void ensureLoaded().catch(() => undefined)}
        />
      ) : error ? (
        <RequestError message={error} onRetry={() => void fetchDiagnostics()} />
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-lg border border-white/[0.06] bg-[#0f1215] animate-pulse"
            />
          ))}
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="surface-panel p-6">
          <EmptyState
            icon={Cpu}
            eyebrow="Diagnostic Telemetry"
            title="No diagnostic trouble codes detected"
            description="Run an OBD-II diagnostic scan on your vehicle to triage fault codes and estimate repair expenses."
            actionLabel="Run Diagnostic Scan"
            onAction={() => setIsScannerOpen(true)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredScans.map((scan) => {
            const isActive = scan.status === "ACTIVE";
            let causes: string[] = [];
            let steps: string[] = [];

            try {
              causes = JSON.parse(scan.possibleCauses || "[]");
            } catch {}
            try {
              steps = JSON.parse(scan.diySteps || "[]");
            } catch {}

            return (
              <div
                key={scan.id}
                className={`rounded-lg border p-5 transition-all text-xs ${
                  isActive
                    ? scan.severity === "CRITICAL"
                    ? "border-red-500/40 bg-[#120d0f]"
                    : "border-amber-500/35 bg-[#12100d]"
                    : "border-white/[0.07] bg-[#0f1215] opacity-75"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`badge-status ${
                        scan.severity === "CRITICAL"
                          ? "critical"
                          : scan.severity === "MODERATE"
                          ? "attention"
                          : "healthy"
                      }`}
                    >
                      {scan.severity === "CRITICAL" ? (
                        <AlertOctagon className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {scan.severity}
                    </span>

                    <span className="font-mono text-base font-bold text-white tracking-wider">
                      DTC: {scan.codes}
                    </span>

                    <span className="text-slate-400 font-medium">
                      • {scan.vehicle?.year} {scan.vehicle?.make} {scan.vehicle?.model}
                    </span>

                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                      {scan.dataSource === "OBD_II" ? "From OBD-II" : "Estimated"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold border ${
                        scan.canDrive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                          : "bg-red-500/10 text-red-400 border-red-500/25"
                      }`}
                    >
                      {scan.canDrive ? "Safe for Short Drives" : "Do Not Drive (Tow Recommended)"}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(scan.id, scan.status)}
                      className="action-secondary text-xs py-1 px-2.5"
                    >
                      {isActive ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Check className="h-3 w-3" /> Mark Resolved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400">
                          <RotateCcw className="h-3 w-3" /> Re-open
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Analysis Summary */}
                <div className="mt-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-amber-400 font-bold">
                    <Info className="h-3 w-3" /> AI Diagnostic Interpretation
                  </div>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">
                    {scan.aiSummary}
                  </p>
                  {scan.symptoms && (
                    <p className="text-[11px] text-slate-400 italic">
                      Reported symptoms: &ldquo;{scan.symptoms}&rdquo;
                    </p>
                  )}
                </div>

                {/* Causes & DIY Checklist */}
                <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {causes.length > 0 && (
                    <div className="rounded border border-white/[0.06] bg-[#090b0e] p-3">
                      <h5 className="font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        Probable Causes
                      </h5>
                      <ul className="space-y-1 text-slate-400 list-disc list-inside">
                        {causes.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {steps.length > 0 && (
                    <div className="rounded border border-white/[0.06] bg-[#090b0e] p-3">
                      <h5 className="font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                        <Wrench className="h-3.5 w-3.5 text-sky-400" />
                        Inspection Checklist
                      </h5>
                      <ul className="space-y-1 text-slate-400 list-disc list-inside">
                        {steps.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer Telemetry */}
                <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      Estimated Repair Cost: ${scan.estimatedCostMin} – ${scan.estimatedCostMax}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Scanned on: {new Date(scan.scanDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scanner Modal */}
      <ObdScannerModal
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleFilter}
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAnalysisSuccess={fetchDiagnostics}
      />
    </div>
  );
}

export default function DiagnosticsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-mono">
          Loading diagnostics...
        </div>
      }
    >
      <DiagnosticsContent />
    </Suspense>
  );
}
