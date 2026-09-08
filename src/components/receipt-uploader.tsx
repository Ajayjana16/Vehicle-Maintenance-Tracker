"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Wrench,
  Check,
} from "lucide-react";
import { ParsedReceiptResult, VehicleSummary } from "@/types";
import { apiFetch } from "@/lib/api-client";

interface ReceiptUploaderProps {
  vehicles: VehicleSummary[];
  selectedVehicleId?: string;
  onRecordAdded?: () => void;
}

export default function ReceiptUploader({
  vehicles,
  selectedVehicleId,
  onRecordAdded,
}: ReceiptUploaderProps) {
  const [vehicleId, setVehicleId] = useState<string>(
    selectedVehicleId || vehicles[0]?.id || ""
  );
  const [receiptText, setReceiptText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [parsed, setParsed] = useState<ParsedReceiptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const sampleReceipt = `APEX AUTOMOTIVE SPECIALISTS
Invoice #: INV-2024-8841
Date: 2024-04-15
Vehicle: 2021 Toyota RAV4 Hybrid
Mileage: 48,250

Line Items:
1. Synthetic Motor Oil & OEM Filter Change (0W-16) - $89.50
2. Engine Air Filter & Cabin Microfilter Replacement - $65.00
3. Multi-Point Safety Inspection & Fluid Top-off - $0.00
4. Environmental Disposal Fee - $5.50
------------------------------------------------
Subtotal: $160.00
Tax (8.25%): $13.20
TOTAL CHARGE: $173.20

Payment Method: VISA ************4412
Technician: Mike R. (#42)`;

  const handleUseSample = () => {
    setReceiptText(sampleReceipt);
  };

  const handleParse = async () => {
    if (!receiptText.trim()) {
      setError("Please paste invoice or receipt text first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiKey = localStorage.getItem("gemini_api_key") || "";
      const data = await apiFetch<ParsedReceiptResult>("/api/receipts", {
        method: "POST",
        body: JSON.stringify({ receiptText: receiptText.trim(), apiKey }),
      });

      setParsed(data);
    } catch (err: any) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to extract invoice data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLogbook = async () => {
    if (!parsed || !vehicleId) return;

    setSaving(true);
    setError(null);

    try {
      const targetVehicle = vehicles.find((v) => v.id === vehicleId);
      const mileageToLog = parsed.mileage || targetVehicle?.mileage || 0;

      await apiFetch("/api/maintenance", {
        method: "POST",
        body: JSON.stringify({
          vehicleId,
          title: parsed.title,
          serviceType: parsed.serviceType,
          serviceDate: parsed.serviceDate,
          mileage: mileageToLog,
          cost: parsed.cost,
          provider: parsed.provider,
          notes: parsed.notes,
          receiptText,
        }),
      });

      setSuccess(true);
      setParsed(null);
      setReceiptText("");
      if (onRecordAdded) onRecordAdded();
    } catch (err: any) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to commit record to logbook.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="surface-panel p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Invoice & Work Order Parser
              <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-white/[0.08]">
                AI / Master Tech Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste service invoices or mechanic quotes to extract parts, costs, and dates.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUseSample}
          className="action-secondary text-xs self-start sm:self-auto"
        >
          Load Sample Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="md:col-span-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Assign to Vehicle *
          </label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="field-input"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <textarea
          rows={5}
          value={receiptText}
          onChange={(e) => setReceiptText(e.target.value)}
          placeholder="Paste full invoice text, mechanic work order, or itemized receipt here..."
          className="field-input font-mono text-xs"
        />
      </div>

      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Record successfully saved into your vehicle service logbook!</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleParse}
          disabled={loading || !receiptText.trim()}
          className="action-primary text-xs"
        >
          {loading ? (
            <span>Extracting Details...</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Extract Work Order Details
            </span>
          )}
        </button>
      </div>

      {/* Extracted Data Card */}
      {parsed && (
        <div className="rounded-lg border border-amber-500/30 bg-[#0c0f12] p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Extracted Work Order Details
            </h4>
            <span className="font-mono font-bold text-sm text-emerald-400">
              ${parsed.cost.toFixed(2)} Total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Service Description</span>
              <span className="font-semibold text-slate-200">{parsed.title}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Service Provider</span>
              <span className="font-semibold text-slate-200">{parsed.provider}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Odometer</span>
              <span className="font-mono font-semibold text-slate-200">
                {parsed.mileage ? `${parsed.mileage.toLocaleString()} mi` : "Current Odometer"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Date</span>
              <span className="font-mono font-semibold text-slate-200">{parsed.serviceDate}</span>
            </div>
          </div>

          {parsed.partsReplaced && parsed.partsReplaced.length > 0 && (
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1">
                Parts & Hardware Replaced
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsed.partsReplaced.map((part, idx) => (
                  <span
                    key={idx}
                    className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs text-slate-300"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveToLogbook}
              disabled={saving}
              className="action-primary text-xs"
            >
              {saving ? "Saving to Logbook..." : "Confirm & Save into Service Logbook"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
