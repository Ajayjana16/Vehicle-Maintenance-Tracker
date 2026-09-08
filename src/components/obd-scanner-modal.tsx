"use client";

import React, { useState } from "react";
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  X,
  Wrench,
  DollarSign,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
} from "lucide-react";
import { DiagnosticAnalysisResult, VehicleSummary } from "@/types";
import { apiFetch } from "@/lib/api-client";

interface ObdScannerModalProps {
  vehicles: VehicleSummary[];
  selectedVehicleId?: string;
  isOpen: boolean;
  onClose: () => void;
  onAnalysisSuccess?: () => void;
}

export default function ObdScannerModal({
  vehicles,
  selectedVehicleId,
  isOpen,
  onClose,
  onAnalysisSuccess,
}: ObdScannerModalProps) {
  const [vehicleId, setVehicleId] = useState(selectedVehicleId || vehicles[0]?.id || "");
  const [codes, setCodes] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync default vehicle ID
  React.useEffect(() => {
    if (selectedVehicleId) {
      setVehicleId(selectedVehicleId);
    } else if (vehicles.length > 0 && !vehicleId) {
      setVehicleId(vehicles[0].id);
    }
  }, [selectedVehicleId, vehicles, vehicleId]);

  if (!isOpen) return null;

  const presets = [
    { label: "P0420 Catalyst", code: "P0420", symptom: "Check engine light illuminated, mild sulfur odor" },
    { label: "P0300 Misfire", code: "P0300", symptom: "Engine shudders under load, flashing check engine light" },
    { label: "Brake Noise", code: "", symptom: "High-pitched squeal when depressing brake pedal" },
    { label: "P0128 Thermostat", code: "P0128", symptom: "Slow engine warmup, heater blowing lukewarm air" },
  ];

  const handleApplyPreset = (code: string, symptom: string) => {
    setCodes(code);
    setSymptoms(symptom);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      setError("Please select a vehicle to run diagnostic triage.");
      return;
    }
    if (!codes.trim() && !symptoms.trim()) {
      setError("Please enter at least one OBD-II trouble code or describe symptoms.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = localStorage.getItem("gemini_api_key") || "";
      const data = await apiFetch<{ analysis: DiagnosticAnalysisResult }>("/api/diagnostics", {
        method: "POST",
        body: JSON.stringify({
          vehicleId,
          codes: codes.trim(),
          symptoms: symptoms.trim(),
          apiKey,
        }),
      });

      setResult(data.analysis);
      if (onAnalysisSuccess) onAnalysisSuccess();
    } catch (err: any) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to analyze diagnostic trouble codes.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-xl border border-white/[0.1] bg-[#0f1215] p-6 shadow-2xl my-8">
        <button
          onClick={onClose}
          aria-label="Close diagnostic scanner dialog"
          className="absolute top-4 right-4 rounded p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Diagnostic Trouble Code Scanner</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyze OBD-II fault codes (DTC) or symptoms for root-cause mechanism and repair estimates.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Target Vehicle *
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="field-input"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.mileage.toLocaleString()} mi)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                OBD-II Codes (e.g. P0420, P0300)
              </label>
              <input
                type="text"
                placeholder="P0420, P0171"
                value={codes}
                onChange={(e) => setCodes(e.target.value)}
                className="field-input font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Presets for Fast Test
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p.code, p.symptom)}
                    className="rounded bg-white/[0.05] hover:bg-white/[0.1] px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Observed Symptoms & Driving Behavior
            </label>
            <textarea
              rows={2}
              placeholder="Describe sounds, vibrations, smoke, loss of power, or flashing warning lights..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="field-input"
            />
          </div>

          {error && (
            <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="action-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="action-primary"
            >
              {loading ? (
                <span>Analyzing Telemetry...</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-4 w-4" /> Run Diagnostic Scan
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Results presentation */}
        {result && (
          <div className="mt-5 border-t border-white/[0.08] pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span
                className={`badge-status ${
                  result.severity === "CRITICAL"
                    ? "critical"
                    : result.severity === "MODERATE"
                    ? "attention"
                    : "healthy"
                }`}
              >
                {result.severity === "CRITICAL" ? (
                  <AlertOctagon className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                Severity: {result.severity}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-semibold border ${
                  result.canDrive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                    : "bg-red-500/10 text-red-400 border-red-500/25"
                }`}
              >
                {result.canDrive ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" /> Safe for Short Drives
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5" /> Tow Recommended (Do Not Drive)
                  </>
                )}
              </span>
            </div>

            {/* Analysis Summary */}
            <div className="rounded border border-white/[0.08] bg-[#090b0e] p-3.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                Root Cause & Telemetry Analysis
              </h4>
              <p className="text-slate-200 leading-relaxed">{result.aiSummary}</p>
            </div>

            {/* Causes and DIY Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded border border-white/[0.08] bg-[#0c0f12] p-3">
                <h5 className="font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Probable Causes
                </h5>
                <ul className="space-y-1 text-slate-400 list-disc list-inside">
                  {result.possibleCauses.map((cause, i) => (
                    <li key={i}>{cause}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded border border-white/[0.08] bg-[#0c0f12] p-3">
                <h5 className="font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Wrench className="h-3.5 w-3.5 text-sky-400" />
                  Inspection Checklist
                </h5>
                <ul className="space-y-1 text-slate-400 list-disc list-inside">
                  {result.diySteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Repair Cost Estimation */}
            <div className="rounded border border-white/[0.08] bg-[#0c0f12] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">
                    Estimated Parts & Labor Cost
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    ${result.estimatedCostMin} – ${result.estimatedCostMax}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                PERSISTED IN VEHICLE DIAGNOSTIC LOG
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
