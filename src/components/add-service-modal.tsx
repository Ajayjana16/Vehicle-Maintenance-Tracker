"use client";

import React, { useState, useEffect } from "react";
import { X, Wrench, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import { VehicleSummary } from "@/types";
import { apiFetch } from "@/lib/api-client";

interface AddServiceModalProps {
  vehicles: VehicleSummary[];
  selectedVehicleId?: string;
  isOpen: boolean;
  onClose: () => void;
  onRecordAdded: () => void;
}

export default function AddServiceModal({
  vehicles,
  selectedVehicleId,
  isOpen,
  onClose,
  onRecordAdded,
}: AddServiceModalProps) {
  const [vehicleId, setVehicleId] = useState(
    selectedVehicleId || vehicles[0]?.id || ""
  );
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("OIL_CHANGE");
  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [mileage, setMileage] = useState<number>(0);
  const [cost, setCost] = useState<number>(85.0);
  const [provider, setProvider] = useState("Dealership Service Center");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default mileage when vehicle selection changes
  useEffect(() => {
    const v = vehicles.find((item) => item.id === vehicleId);
    if (v) {
      setMileage(v.mileage);
    }
  }, [vehicleId, vehicles]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !title.trim() || !serviceDate || mileage === undefined || cost === undefined) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiFetch("/api/maintenance", {
        method: "POST",
        body: JSON.stringify({
          vehicleId,
          title: title.trim(),
          serviceType,
          serviceDate,
          mileage: Number(mileage),
          cost: Number(cost),
          provider: provider.trim() || "Independent Auto Service",
          notes: notes.trim() || null,
        }),
      });

      onRecordAdded();
      onClose();
    } catch (err: any) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to log maintenance record.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-white/[0.1] bg-[#0f1215] p-6 shadow-2xl my-8">
        <button
          onClick={onClose}
          aria-label="Close service dialog"
          className="absolute top-4 right-4 rounded p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Log Vehicle Maintenance</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Records service entry to vehicle maintenance history and resets OEM schedule intervals.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Vehicle *
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

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Service Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Synthetic Engine Oil & Filter (0W-20)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="field-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Category
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="field-input"
              >
                <option value="OIL_CHANGE">Oil & Fluids</option>
                <option value="BRAKES">Brakes & Rotors</option>
                <option value="TIRES">Tires & Alignment</option>
                <option value="BATTERY">Battery & Electrical</option>
                <option value="FILTERS">Cabin & Engine Filters</option>
                <option value="INSPECTION">Inspection / Smog</option>
                <option value="REPAIR">Mechanical Repair</option>
                <option value="RECALL">Factory Recall</option>
                <option value="GENERAL">General Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Date Completed *
              </label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                required
                className="field-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Odometer at Service *
              </label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                required
                className="field-input font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Amount Paid ($ USD) *
              </label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                required
                className="field-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Shop / Mechanic Provider
            </label>
            <input
              type="text"
              placeholder="e.g. Toyota Dealership, Firestone, DIY"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="field-input"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Notes & Parts Replaced (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Part numbers, oil viscosity grade, brake pad thickness..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field-input"
            />
          </div>

          {error && (
            <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
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
              {loading ? "Recording..." : "Log Maintenance Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
