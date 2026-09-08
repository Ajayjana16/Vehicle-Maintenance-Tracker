"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Cpu,
  Fuel,
  Gauge,
  Plus,
  ShieldCheck,
  Wrench,
  TrendingUp,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  Zap,
  Activity,
  Radio,
} from "lucide-react";
import { VehicleWithRelations } from "@/types";
import HealthGauge from "@/components/health-gauge";
import VehicleImageView from "@/components/vehicle-image-view";
import SubsystemHealthMatrix from "@/components/subsystem-health-matrix";
import { calculateSubsystemHealth } from "@/lib/subsystem-health";
import ObdScannerModal from "@/components/obd-scanner-modal";
import AddServiceModal from "@/components/add-service-modal";
import EditVehicleModal from "@/components/edit-vehicle-modal";
import EmptyState from "@/components/empty-state";
import RequestError from "@/components/request-error";
import { useVehicleSummaries } from "@/components/vehicle-summary-provider";
import { apiFetch } from "@/lib/api-client";

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<VehicleWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "diagnostics" | "maintenance" | "predictive" | "fuel">("overview");

  // Modals
  const [scannerOpen, setScannerOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { remove, refresh } = useVehicleSummaries();

  const loadVehicle = React.useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<VehicleWithRelations>(`/api/vehicles/${params.id}`);
      setVehicle(data);
    } catch (err) {
      console.error("Failed to load vehicle:", err);
      const message = err instanceof Error ? err.message : "Unable to load vehicle details";
      setError(message);
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadVehicle();
  }, [loadVehicle]);

  // Subsystem health calculation
  const subsystems = useMemo(() => {
    if (!vehicle) return [];
    return calculateSubsystemHealth(
      vehicle.mileage,
      vehicle.year,
      vehicle.schedules,
      vehicle.diagnostics,
      vehicle.vehicleType,
      vehicle.fuelType,
      vehicle.driveType
    );
  }, [vehicle]);

  const activeIssues = useMemo(
    () => vehicle?.diagnostics?.filter((d) => d.status === "ACTIVE") || [],
    [vehicle]
  );

  const handleDelete = async () => {
    if (!vehicle) return;
    if (!confirm(`Are you sure you want to remove ${vehicle.year} ${vehicle.make} ${vehicle.model} from your garage?`)) {
      return;
    }

    try {
      await apiFetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
      remove(vehicle.id);
      await refresh().catch(() => undefined);
      router.push("/garage");
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-64 rounded-xl border border-white/[0.06] bg-[#0f1215] animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-[#0f1215] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !vehicle) {
    return <RequestError message={error} onRetry={loadVehicle} />;
  }

  if (!vehicle) {
    return (
      <EmptyState
        icon={Car}
        eyebrow="My Garage"
        title="Vehicle Not Found"
        description="This vehicle profile could not be located or may have been removed from your garage."
        actionLabel="Return to Garage"
        href="/garage"
      />
    );
  }

  const isEV = vehicle.fuelType === "ELECTRIC";
  const isHybrid = vehicle.fuelType === "HYBRID";

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/garage"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to My Vehicles</span>
        </Link>
      </div>

      {/* Hero Header */}
      <section className="surface-panel overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[380px_1fr]">
          {/* Vehicle Photography */}
          <div className="relative h-64 lg:h-full bg-[#090b0e] border-b lg:border-b-0 lg:border-r border-white/[0.08]">
            <VehicleImageView
              src={vehicle.imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              make={vehicle.make}
              model={vehicle.model}
              year={vehicle.year}
              trim={vehicle.trim}
              fuelType={vehicle.fuelType}
              vehicleType={vehicle.vehicleType}
              aspectRatio="cover"
              priority
            />
          </div>

          {/* Identity & Quick Operations Bar */}
          <div className="p-6 flex flex-col justify-between space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="eyebrow">
                  <Activity className="h-3 w-3" /> Vehicle Profile & Health
                </span>
                <h1 className="page-heading mt-1">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {vehicle.name} {vehicle.trim ? `• ${vehicle.trim}` : ""} •{" "}
                  <span className="font-mono text-slate-300">{vehicle.fuelType}</span>
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {/* Vehicle Type Badge */}
                  <span className="font-mono rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300 text-[11px] font-semibold">
                    {vehicle.vehicleType === "MOTORCYCLE"
                      ? "Motorcycle / Bike"
                      : vehicle.vehicleType === "SCOOTER"
                      ? "Scooter"
                      : vehicle.vehicleType === "SUV"
                      ? "SUV"
                      : vehicle.vehicleType === "VAN"
                      ? "Van"
                      : "Car"}
                  </span>
                  {vehicle.engineCc && (
                    <span className="font-mono rounded border border-white/[0.08] bg-[#0c0f12] px-2 py-0.5 text-sky-400 text-[11px]">
                      {vehicle.engineCc} CC
                    </span>
                  )}
                  {vehicle.driveType && (
                    <span className="font-mono rounded border border-white/[0.08] bg-[#0c0f12] px-2 py-0.5 text-purple-400 text-[11px]">
                      DRIVE: {vehicle.driveType}
                    </span>
                  )}
                  {vehicle.coolingType && (
                    <span className="font-mono rounded border border-white/[0.08] bg-[#0c0f12] px-2 py-0.5 text-emerald-400 text-[11px]">
                      COOLING: {vehicle.coolingType}
                    </span>
                  )}
                  {vehicle.obdConnected && (
                    <span className="font-mono rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                      <Radio className="h-3 w-3" /> OBD-II Connected
                    </span>
                  )}
                  {vehicle.vin && (
                    <span className="font-mono rounded border border-white/[0.08] bg-[#0c0f12] px-2 py-0.5 text-slate-300 text-[11px]">
                      VIN: {vehicle.vin}
                    </span>
                  )}
                  {vehicle.licensePlate && (
                    <span className="font-mono rounded border border-white/[0.08] bg-[#0c0f12] px-2 py-0.5 text-slate-300 text-[11px]">
                      PLATE: {vehicle.licensePlate}
                    </span>
                  )}
                  <span className="font-mono rounded border border-white/[0.08] bg-[#0c0f12] px-2 py-0.5 text-cyan-400 text-[11px]">
                    POWERTRAIN: {vehicle.fuelType}
                  </span>
                  <span className="font-mono rounded border border-white/[0.08] bg-[#0c0f12] px-2 py-0.5 text-slate-300 text-[11px]">
                    ODOMETER: {vehicle.mileage.toLocaleString()} MI
                  </span>
                </div>
              </div>

              {/* Health Gauge Readout */}
              <div className="self-start sm:self-auto shrink-0">
                <HealthGauge score={vehicle.healthScore} size="md" showLabel />
              </div>
            </div>

            {/* Quick Action Operations Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setScannerOpen(true)}
                  className="action-primary text-xs"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Scan Vehicle</span>
                </button>

                <button
                  onClick={() => setServiceOpen(true)}
                  className="action-secondary text-xs"
                >
                  <Wrench className="h-3.5 w-3.5 text-amber-400" />
                  <span>Log Service</span>
                </button>

                <Link
                  href={`/fuel?vehicleId=${vehicle.id}`}
                  className="action-secondary text-xs"
                >
                  <Fuel className="h-3.5 w-3.5 text-sky-400" />
                  <span>{isEV ? "Add Charge" : "Add Fuel"}</span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditOpen(true)}
                  className="action-secondary text-xs py-1.5 px-2.5"
                  title="Edit vehicle specifications"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={handleDelete}
                  aria-label="Remove vehicle"
                  className="rounded border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Remove vehicle from garage"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Grid */}
      <section className="telemetry-grid">
        <div className="telemetry-cell">
          <span className="telemetry-cell-label">Current Odometer</span>
          <strong className="telemetry-cell-value">
            {vehicle.mileage.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">mi</span>
          </strong>
          <span className="telemetry-cell-subtext">Verified reading</span>
        </div>

        <div className="telemetry-cell">
          <span className="telemetry-cell-label">Daily Average Driving</span>
          <strong className="telemetry-cell-value">
            ~{vehicle.avgDailyMiles || 35} <span className="text-xs text-slate-500 font-sans font-normal">mi/day</span>
          </strong>
          <span className="telemetry-cell-subtext">Operating pacing</span>
        </div>

        <div className="telemetry-cell">
          <span className="telemetry-cell-label">Active DTC Alerts</span>
          <strong
            className={`telemetry-cell-value ${
              activeIssues.length > 0 ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {activeIssues.length}
          </strong>
          <span className="telemetry-cell-subtext">
            {activeIssues.length === 0 ? "All diagnostic circuits clear" : "Action required"}
          </span>
        </div>

        <div className="telemetry-cell">
          <span className="telemetry-cell-label">Transmission / Drive</span>
          <strong className="telemetry-cell-value text-base text-slate-200 truncate">
            {vehicle.transmission}
          </strong>
          <span className="telemetry-cell-subtext">{vehicle.fuelType} Powertrain</span>
        </div>
      </section>

      {/* Vehicle Details Navigation Tabs */}
      <nav className="flex items-center gap-2 border-b border-white/[0.08] overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-amber-400 text-amber-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Subsystems & Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "diagnostics"
              ? "border-amber-400 text-amber-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Diagnostics ({vehicle.diagnostics?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("maintenance")}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "maintenance"
              ? "border-amber-400 text-amber-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Maintenance Log ({vehicle.maintenanceRecords?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("predictive")}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "predictive"
              ? "border-amber-400 text-amber-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Predictive Wear</span>
        </button>

        <button
          onClick={() => setActiveTab("fuel")}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "fuel"
              ? "border-amber-400 text-amber-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Fuel className="h-3.5 w-3.5" />
          <span>Fuel & Energy ({vehicle.fuelLogs?.length || 0})</span>
        </button>
      </nav>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Subsystem Health Matrix */}
          <div className="surface-panel p-5 space-y-4">
            <SubsystemHealthMatrix subsystems={subsystems} />
          </div>

          {/* Factory Schedule Status */}
          <div className="surface-panel p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.08] pb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Factory Maintenance Intervals
            </h3>

            <div className="space-y-2 text-xs">
              {vehicle.schedules?.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-white/[0.05] pb-2 last:border-0"
                >
                  <span className="text-slate-300 truncate max-w-[200px]">{item.taskName}</span>
                  <span
                    className={`badge-status ${
                      item.urgency === "OVERDUE"
                        ? "critical"
                        : item.urgency === "DUE_SOON"
                        ? "attention"
                        : "healthy"
                    }`}
                  >
                    {item.urgency === "OVERDUE"
                      ? "Overdue"
                      : item.urgency === "DUE_SOON"
                      ? "Due Soon"
                      : "Nominal"}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab("maintenance")}
                className="action-secondary text-xs w-full justify-center"
              >
                <span>View Full Maintenance Logbook</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "diagnostics" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Diagnostic Scan Log</h3>
            <button
              onClick={() => setScannerOpen(true)}
              className="action-primary text-xs"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Run New Scan</span>
            </button>
          </div>

          {vehicle.diagnostics && vehicle.diagnostics.length > 0 ? (
            <div className="space-y-3">
              {vehicle.diagnostics.map((scan) => (
                <div
                  key={scan.id}
                  className="surface-panel p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge-status ${
                          scan.severity === "CRITICAL"
                            ? "critical"
                            : scan.severity === "MODERATE"
                            ? "attention"
                            : "healthy"
                        }`}
                      >
                        {scan.severity}
                      </span>
                      <strong className="font-mono text-sm text-white">
                        DTC: {scan.codes}
                      </strong>
                    </div>

                    <span className="font-mono text-[11px] text-slate-500">
                      {new Date(scan.scanDate).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-slate-200">{scan.aiSummary}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-panel p-6">
              <EmptyState
                icon={Cpu}
                eyebrow="Diagnostics"
                title="No Diagnostic Scans"
                description="Run an OBD-II scan to detect faults and get repair cost estimations."
                actionLabel="Run Diagnostic Scan"
                onAction={() => setScannerOpen(true)}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Maintenance Logbook & Factory Intervals</h3>
            <button
              onClick={() => setServiceOpen(true)}
              className="action-primary text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Maintenance Event</span>
            </button>
          </div>

          {vehicle.maintenanceRecords && vehicle.maintenanceRecords.length > 0 ? (
            <div className="table-shell overflow-x-auto">
              <table className="data-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Service Description</th>
                    <th>Category</th>
                    <th>Odometer</th>
                    <th>Provider</th>
                    <th className="text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicle.maintenanceRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-slate-400">
                        {new Date(r.serviceDate).toLocaleDateString()}
                      </td>
                      <td className="font-semibold text-white">{r.title}</td>
                      <td>
                        <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-300 font-mono">
                          {r.serviceType}
                        </span>
                      </td>
                      <td className="font-mono text-slate-300">
                        {r.mileage.toLocaleString()} mi
                      </td>
                      <td className="text-slate-400">{r.provider || "Self-serviced"}</td>
                      <td className="text-right font-mono font-bold text-emerald-400">
                        ${r.cost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="surface-panel p-6">
              <EmptyState
                icon={Wrench}
                eyebrow="Maintenance"
                title="No Service Records"
                description="Log your first service to start tracking expenditure and resetting maintenance intervals."
                actionLabel="Log Service"
                onAction={() => setServiceOpen(true)}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "predictive" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Component Wear Forecaster</h3>
            <Link href={`/predictive?vehicleId=${vehicle.id}`} className="action-secondary text-xs">
              <span>Full Forecaster</span>
            </Link>
          </div>

          <div className="surface-panel p-5">
            <div className="space-y-3">
              {vehicle.schedules?.map((item) => {
                const milesRemaining = item.nextDueMileage - vehicle.mileage;
                const daysRemaining = Math.max(
                  0,
                  Math.round(milesRemaining / (vehicle.avgDailyMiles || 35))
                );
                const wearPercent = Math.min(
                  100,
                  Math.max(
                    0,
                    Math.round(
                      ((item.intervalMiles - Math.max(0, milesRemaining)) /
                        (item.intervalMiles || 7500)) *
                        100
                    )
                  )
                );

                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-white/[0.06] bg-[#0c0f12] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-200">{item.taskName}</strong>
                      <span className="font-mono text-slate-400">
                        {milesRemaining <= 0 ? (
                          <span className="text-red-400 font-bold">Overdue</span>
                        ) : (
                          `${milesRemaining.toLocaleString()} mi (~${daysRemaining} days)`
                        )}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full ${
                          wearPercent >= 100
                            ? "bg-red-500"
                            : wearPercent >= 80
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${wearPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "fuel" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {isEV ? "Charging & Efficiency Logs" : "Fuel Consumption Logs"}
            </h3>
            <Link
              href={`/fuel?vehicleId=${vehicle.id}`}
              className="action-primary text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isEV ? "Log Charge" : "Log Fill-Up"}</span>
            </Link>
          </div>

          {vehicle.fuelLogs && vehicle.fuelLogs.length > 0 ? (
            <div className="table-shell overflow-x-auto">
              <table className="data-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Odometer</th>
                    <th>Units</th>
                    <th>Price / Unit</th>
                    <th>Total Cost</th>
                    <th>Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicle.fuelLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="font-mono text-slate-400">
                        {new Date(l.logDate).toLocaleDateString()}
                      </td>
                      <td className="font-mono font-bold text-white">
                        {l.mileage.toLocaleString()} mi
                      </td>
                      <td className="font-mono text-slate-300">
                        {l.units.toFixed(1)} {isEV ? "kWh" : "gal"}
                      </td>
                      <td className="font-mono text-slate-400">
                        ${l.pricePerUnit.toFixed(3)}
                      </td>
                      <td className="font-mono font-bold text-emerald-400">
                        ${l.totalCost.toFixed(2)}
                      </td>
                      <td className="font-mono text-slate-300">
                        {l.calculatedMpg ? `${l.calculatedMpg} MPG` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="surface-panel p-6">
              <EmptyState
                icon={Fuel}
                eyebrow="Energy Tracking"
                title="No Fuel or Charging Logs"
                description={`Log your first ${isEV ? "charging session" : "fill-up"} to monitor efficiency and cost per mile.`}
                actionLabel={isEV ? "Log Charge" : "Log Fill-Up"}
                href={`/fuel?vehicleId=${vehicle.id}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ObdScannerModal
        vehicles={[vehicle]}
        selectedVehicleId={vehicle.id}
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onAnalysisSuccess={loadVehicle}
      />
      <AddServiceModal
        vehicles={[vehicle]}
        selectedVehicleId={vehicle.id}
        isOpen={serviceOpen}
        onClose={() => setServiceOpen(false)}
        onRecordAdded={loadVehicle}
      />
      <EditVehicleModal
        vehicle={vehicle}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onVehicleUpdated={async () => {
          await Promise.all([loadVehicle(), refresh()]);
        }}
      />
    </div>
  );
}
