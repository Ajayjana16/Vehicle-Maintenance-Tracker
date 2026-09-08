"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp, Car, RefreshCw, Activity, Layers } from "lucide-react";
import PredictiveTimeline from "@/components/predictive-timeline";
import EmptyState from "@/components/empty-state";
import RequestError from "@/components/request-error";
import { useVehicleSummaries } from "@/components/vehicle-summary-provider";
import { apiFetch } from "@/lib/api-client";

function PredictiveContent() {
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get("vehicleId") || "";

  const { vehicles, error: vehicleError, ensureLoaded } = useVehicleSummaries();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId);
  const [predictiveData, setPredictiveData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
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

  const fetchPredictions = useCallback(async () => {
    if (!selectedVehicleId) {
      setPredictiveData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<any>(`/api/predictive?vehicleId=${selectedVehicleId}`);
      setPredictiveData(data);
    } catch (err) {
      console.error("Error loading predictions:", err);
      setPredictiveData(null);
      const message = err instanceof Error ? err.message : "Predictive wear model data is temporarily unavailable.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <span className="eyebrow">
            <TrendingUp className="h-3 w-3" /> Predictive Intelligence
          </span>
          <h1 className="page-heading mt-1">Predictive Component Wear</h1>
          <p className="text-xs text-slate-400 mt-1">
            Component wear velocity calculated from odometer pacing and OEM service intervals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0f1215] px-3 py-1.5 text-xs">
            <Car className="h-3.5 w-3.5 text-amber-400" />
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#0f1215] text-slate-200">
                  {v.year} {v.make} {v.model} ({v.mileage.toLocaleString()} mi)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchPredictions}
            className="rounded-lg border border-white/[0.08] bg-[#0f1215] hover:bg-white/[0.06] p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh Predictive Model"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      {vehicleError && vehicles.length === 0 ? (
        <RequestError
          message={vehicleError}
          onRetry={() => void ensureLoaded().catch(() => undefined)}
        />
      ) : error ? (
        <RequestError message={error} onRetry={() => void fetchPredictions()} />
      ) : loading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-lg border border-white/[0.06] bg-[#0f1215] animate-pulse" />
          <div className="h-96 rounded-lg border border-white/[0.06] bg-[#0f1215] animate-pulse" />
        </div>
      ) : predictiveData ? (
        <PredictiveTimeline
          vehicleName={predictiveData.vehicleName}
          currentMileage={predictiveData.currentMileage}
          avgDailyMiles={predictiveData.avgDailyMiles}
          next12MonthsBudget={predictiveData.next12MonthsBudget}
          projections={predictiveData.projections}
        />
      ) : (
        <div className="surface-panel p-6">
          <EmptyState
            icon={TrendingUp}
            eyebrow="Lifecycle Forecaster"
            title="Select a Vehicle to Begin Forecasting"
            description="Choose any vehicle in your garage to project wear velocity, replacement milestones, and annual expenditure."
            actionLabel="Open Garage"
            href="/garage"
          />
        </div>
      )}
    </div>
  );
}

export default function PredictivePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-mono">
          Loading wear velocity telemetry...
        </div>
      }
    >
      <PredictiveContent />
    </Suspense>
  );
}
