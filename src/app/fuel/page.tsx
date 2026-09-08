"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Fuel,
  Zap,
  Plus,
  DollarSign,
  Gauge,
  Calendar,
  AlertTriangle,
  Flame,
  Activity,
} from "lucide-react";
import EmptyState from "@/components/empty-state";
import RequestError from "@/components/request-error";
import { useVehicleSummaries } from "@/components/vehicle-summary-provider";
import { apiFetch } from "@/lib/api-client";

function FuelContent() {
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get("vehicleId") || "";

  const { vehicles, error: vehicleError, ensureLoaded } = useVehicleSummaries();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Log Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [mileage, setMileage] = useState<number>(0);
  const [units, setUnits] = useState<number>(12.0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(3.85);
  const [logDate, setLogDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void ensureLoaded().catch(() => undefined);
  }, [ensureLoaded]);

  useEffect(() => {
    if (vehicles.length > 0) {
      if (!selectedVehicleId || !vehicles.some((v) => v.id === selectedVehicleId)) {
        setSelectedVehicleId(vehicles[0].id);
      }
    } else {
      setSelectedVehicleId("");
    }
  }, [vehicles, selectedVehicleId]);

  const currentVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const isEV = currentVehicle?.fuelType === "ELECTRIC";
  const isHybrid = currentVehicle?.fuelType === "HYBRID";

  const fetchLogs = useCallback(async () => {
    if (!selectedVehicleId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const logsData = await apiFetch<any[]>(`/api/fuel?vehicleId=${selectedVehicleId}`);
      if (Array.isArray(logsData)) setLogs(logsData);
    } catch (err) {
      console.error("Error fetching fuel logs:", err);
      const message = err instanceof Error ? err.message : "Fuel and energy telemetry data is temporarily unavailable.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !units || !pricePerUnit || !mileage) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch("/api/fuel", {
        method: "POST",
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          mileage: Number(mileage),
          units: Number(units),
          pricePerUnit: Number(pricePerUnit),
          logDate,
          notes: notes.trim() || null,
        }),
      });

      setShowAddForm(false);
      setNotes("");
      fetchLogs();
    } catch (err) {
      console.error("Error creating fuel log:", err);
      const message = err instanceof Error ? err.message : "Failed to record entry";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Telemetry metrics
  const { totalCost, totalUnits, avgEfficiency, costPerMile } = useMemo(() => {
    const totalCost = logs.reduce((sum, l) => sum + l.totalCost, 0);
    const totalUnits = logs.reduce((sum, l) => sum + l.units, 0);
    const validMpgs = logs.filter(
      (l) => l.calculatedMpg !== null && l.calculatedMpg > 0
    );
    const avgEfficiency =
      validMpgs.length > 0
        ? (
            validMpgs.reduce((sum, l) => sum + l.calculatedMpg, 0) /
            validMpgs.length
          ).toFixed(1)
        : "N/A";
    const mileageRange =
      logs.length > 1
        ? Math.max(...logs.map((l) => l.mileage)) -
          Math.min(...logs.map((l) => l.mileage))
        : 0;
    return {
      totalCost,
      totalUnits,
      avgEfficiency,
      costPerMile: mileageRange > 0 ? totalCost / mileageRange : null,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <span className="eyebrow">
            {isEV ? <Zap className="h-3 w-3" /> : <Fuel className="h-3 w-3" />}{" "}
            Energy Telemetry
          </span>
          <h1 className="page-heading mt-1">Fuel & Charging Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time operating efficiency, consumption rates, and cost per mile.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-[#0f1215] px-3 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model} ({v.fuelType})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (currentVehicle) setMileage(currentVehicle.mileage);
            }}
            className="action-primary text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isEV ? "Log Charge" : "Log Fill-Up"}</span>
          </button>
        </div>
      </header>

      {/* KPI Telemetry Grid */}
      <section className="telemetry-grid">
        <div className="telemetry-cell">
          <span className="telemetry-cell-label">Average Efficiency</span>
          <strong className="telemetry-cell-value text-emerald-400">
            {avgEfficiency}{" "}
            <span className="text-xs font-sans text-slate-400 font-normal">
              {isEV ? "MPGe" : "MPG"}
            </span>
          </strong>
          <span className="telemetry-cell-subtext">
            {isEV ? "Miles per 33.7 kWh equivalent" : "Miles per gallon combined"}
          </span>
        </div>

        <div className="telemetry-cell">
          <span className="telemetry-cell-label">Total Spend</span>
          <strong className="telemetry-cell-value text-white">
            ${totalCost.toFixed(2)}
          </strong>
          <span className="telemetry-cell-subtext">
            Across {logs.length} logged {isEV ? "charges" : "fill-ups"}
          </span>
        </div>

        <div className="telemetry-cell">
          <span className="telemetry-cell-label">Energy Consumed</span>
          <strong className="telemetry-cell-value text-sky-400">
            {totalUnits.toFixed(1)}{" "}
            <span className="text-xs font-sans text-slate-400 font-normal">
              {isEV ? "kWh" : "gal"}
            </span>
          </strong>
          <span className="telemetry-cell-subtext">
            {isEV ? "Total kilowatt-hours" : "Total gallons pumped"}
          </span>
        </div>

        <div className="telemetry-cell">
          <span className="telemetry-cell-label">Operating Cost / Mile</span>
          <strong className="telemetry-cell-value text-slate-200">
            {costPerMile === null ? "—" : `$${costPerMile.toFixed(2)}`}
            {costPerMile !== null && (
              <span className="text-xs font-sans text-slate-400 font-normal"> /mi</span>
            )}
          </strong>
          <span className="telemetry-cell-subtext">Based on recorded odometer deltas</span>
        </div>
      </section>

      {/* Add Log Inline Form */}
      {showAddForm && (
        <div className="surface-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-400" />
              {isEV ? "Record EV Charging Session" : "Record Fuel Fill-Up"}
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateLog} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Date Completed *
              </label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                required
                className="field-input font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Odometer (Miles) *
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
                {isEV ? "Units (kWh) *" : "Units (Gallons) *"}
              </label>
              <input
                type="number"
                step="0.01"
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                required
                className="field-input font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {isEV ? "Price / kWh ($) *" : "Price / Gallon ($) *"}
              </label>
              <input
                type="number"
                step="0.001"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                required
                className="field-input font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder={
                  isEV
                    ? "Level 2 home charging, Tesla Supercharger, off-peak rates..."
                    : "Station name, octane rating (87/91/93), highway cruise..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="field-input"
              />
            </div>

            <div className="sm:col-span-1 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="action-primary text-xs w-full justify-center"
              >
                {submitting ? "Recording..." : "Save Entry"}
              </button>
            </div>
          </form>

          {error && (
            <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Logs Table */}
      {vehicleError && vehicles.length === 0 ? (
        <RequestError
          message={vehicleError}
          onRetry={() => void ensureLoaded().catch(() => undefined)}
        />
      ) : error && logs.length === 0 ? (
        <RequestError message={error} onRetry={() => void fetchLogs()} />
      ) : loading ? (
        <div className="h-56 rounded-lg border border-white/[0.06] bg-[#0f1215] animate-pulse" />
      ) : logs.length === 0 ? (
        <div className="surface-panel p-6">
          <EmptyState
            icon={isEV ? Zap : Fuel}
            eyebrow="Energy Logbook"
            title={currentVehicle ? `No ${isEV ? "charging" : "fuel"} sessions logged` : "No vehicle selected"}
            description={
              currentVehicle
                ? `Log your first ${isEV ? "charging session" : "fuel fill-up"} to calculate real-world MPG, MPGe, and operating cost per mile.`
                : "Add a vehicle to your garage before tracking fuel or energy logs."
            }
            actionLabel={currentVehicle ? (isEV ? "Log Charge" : "Log Fill-Up") : "Open Garage"}
            onAction={
              currentVehicle
                ? () => {
                    setShowAddForm(true);
                    setMileage(currentVehicle.mileage);
                  }
                : undefined
            }
            href={currentVehicle ? undefined : "/garage"}
          />
        </div>
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Odometer</th>
                <th>Units Added</th>
                <th>Price / Unit</th>
                <th>Total Cost</th>
                <th>Calculated Efficiency</th>
                <th>Operating Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="font-mono text-slate-400">
                    {new Date(l.logDate).toLocaleDateString()}
                  </td>
                  <td className="font-mono font-bold text-white">
                    {l.mileage.toLocaleString()} mi
                  </td>
                  <td className="font-mono text-slate-300">
                    {l.units.toFixed(2)} {isEV ? "kWh" : "gal"}
                  </td>
                  <td className="font-mono text-slate-400">
                    ${l.pricePerUnit.toFixed(3)}
                  </td>
                  <td className="font-mono font-bold text-emerald-400">
                    ${l.totalCost.toFixed(2)}
                  </td>
                  <td>
                    {l.calculatedMpg ? (
                      <span className="font-mono font-bold text-emerald-400">
                        {l.calculatedMpg} {isEV ? "MPGe" : "MPG"}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">Baseline Entry</span>
                    )}
                  </td>
                  <td className="text-slate-400 truncate max-w-xs">
                    {l.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function FuelPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-mono">
          Loading fuel & energy telemetry...
        </div>
      }
    >
      <FuelContent />
    </Suspense>
  );
}
