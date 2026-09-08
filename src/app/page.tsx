"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Car,
  ChevronRight,
  Cpu,
  Plus,
  Wrench,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Clock,
  CheckCircle2,
  Activity,
  Sparkles,
  Info,
  DollarSign,
  Zap,
  Radio,
  SlidersHorizontal,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { VehicleWithRelations, SubsystemHealthBreakdown } from "@/types";
import AddVehicleModal from "@/components/add-vehicle-modal";
import AddServiceModal from "@/components/add-service-modal";
import ObdScannerModal from "@/components/obd-scanner-modal";
import RequestError from "@/components/request-error";
import VehicleImageView from "@/components/vehicle-image-view";
import SubsystemHealthMatrix from "@/components/subsystem-health-matrix";
import { calculateSubsystemHealth } from "@/lib/subsystem-health";
import { useAuth } from "@/components/auth-context";
import { apiFetch } from "@/lib/api-client";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<VehicleWithRelations[]>("/api/vehicles");
      if (Array.isArray(data)) {
        setVehicles(data);
        if (data.length > 0) {
          setSelectedVehicleId((prev) => {
            if (prev && data.some((v) => v.id === prev)) return prev;
            return data[0].id;
          });
        }
      }
      setLastSyncTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      console.error("Failed to load vehicle data:", err);
      const message = err instanceof Error ? err.message : "Unable to load vehicle data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadVehicles();
    }
  }, [isAuthenticated, loadVehicles]);

  // Active Selected Vehicle (or default to first vehicle)
  const activeVehicle = useMemo(() => {
    if (vehicles.length === 0) return null;
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const ownerName = user?.firstName || (user?.name ? user.name.split(" ")[0] : "there");

  // Subsystem health calculation for active vehicle
  const subsystemHealth = useMemo(() => {
    if (!activeVehicle) return [];
    return calculateSubsystemHealth(
      activeVehicle.mileage,
      activeVehicle.year,
      activeVehicle.schedules,
      activeVehicle.diagnostics,
      activeVehicle.vehicleType,
      activeVehicle.fuelType,
      activeVehicle.driveType
    );
  }, [activeVehicle]);

  // Active DTCs for selected vehicle
  const activeDTCs = useMemo(() => {
    if (!activeVehicle) return [];
    return (activeVehicle.diagnostics || []).filter((d) => d.status === "ACTIVE");
  }, [activeVehicle]);

  // Upcoming maintenance for selected vehicle
  const upcomingMaintenance = useMemo(() => {
    if (!activeVehicle) return [];
    return (activeVehicle.schedules || [])
      .filter((s) => s.urgency !== "GOOD")
      .sort((a, b) => (a.urgency === "OVERDUE" ? -1 : 1));
  }, [activeVehicle]);

  // Overall status summary
  const statusHeadline = useMemo(() => {
    if (!activeVehicle) return "No vehicle registered";
    if (activeDTCs.some((d) => d.severity === "CRITICAL")) {
      return "Immediate attention required";
    }
    if (activeDTCs.length > 0 || upcomingMaintenance.some((m) => m.urgency === "OVERDUE")) {
      return "Service inspection recommended";
    }
    if (upcomingMaintenance.length > 0) {
      return "Upcoming routine maintenance scheduled";
    }
    return "Your vehicle is running smoothly";
  }, [activeVehicle, activeDTCs, upcomingMaintenance]);

  const isHealthy = activeVehicle && activeVehicle.healthScore >= 80 && activeDTCs.length === 0;

  // Render Onboarding Hero if 0 vehicles
  if (!loading && vehicles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Welcome to AutoPulse</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Understand your vehicle.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              Prevent problems before they happen.
            </span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            AutoPulse monitors live subsystem health, translates confusing check engine codes into plain English, and predicts exactly when components need maintenance.
          </p>
        </div>

        {/* Onboarding Call to Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#14181f] to-[#0c0f13] shadow-xl relative overflow-hidden flex flex-col justify-between space-y-5">
            <div className="space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Car className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-white">Add Your First Vehicle</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add your car or truck by year, make, and model. We&apos;ll auto-generate factory maintenance schedules and component wear horizons.
              </p>
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
              className="action-primary w-full py-2.5 text-xs font-bold justify-center"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your Vehicle</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0f13] shadow-xl relative overflow-hidden flex flex-col justify-between space-y-5">
            <div className="space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Radio className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-white">Connect OBD-II Scanner</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plug in any standard Bluetooth or Wi-Fi OBD-II dongle to stream real-time sensor metrics and read diagnostic trouble codes.
              </p>
            </div>
            <button
              onClick={() => setScanModalOpen(true)}
              className="action-secondary w-full py-2.5 text-xs font-semibold justify-center"
            >
              <Cpu className="h-4 w-4 text-sky-400" />
              <span>Connect OBD-II Scanner</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
          <div className="p-4 rounded-xl bg-[#090b0e] border border-white/[0.04] space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Subsystem Health Score</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              0–100 composite health score evaluating powertrain, brakes, battery, and fluids.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#090b0e] border border-white/[0.04] space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Sparkles className="h-4 w-4" />
              <span>AI Trouble Code Triage</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Instant plain-English summaries of check engine DTCs, repair cost estimates, and DIY steps.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#090b0e] border border-white/[0.04] space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
              <Clock className="h-4 w-4" />
              <span>Predictive Wear Horizons</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mileage-based wear projections to plan brake pads, tires, and fluid replacements in advance.
            </p>
          </div>
        </div>

        <AddVehicleModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onVehicleAdded={loadVehicles}
        />
        <ObdScannerModal
          isOpen={scanModalOpen}
          onClose={() => setScanModalOpen(false)}
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onAnalysisSuccess={loadVehicles}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. GREETING & HEADER BAR */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Vehicle Health & Intelligence
            </span>
            {lastSyncTime && (
              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                · Synced at {lastSyncTime}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            {greeting}, {ownerName}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                isHealthy
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : activeDTCs.some((d) => d.severity === "CRITICAL")
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isHealthy
                    ? "bg-emerald-400"
                    : activeDTCs.some((d) => d.severity === "CRITICAL")
                    ? "bg-red-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              {statusHeadline}
            </span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadVehicles()}
            disabled={loading}
            className="action-secondary text-xs py-2 px-2.5"
            title="Refresh diagnostics"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setScanModalOpen(true)}
            className="action-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Cpu className="h-3.5 w-3.5 text-amber-400" />
            <span>Scan Vehicle</span>
          </button>
          <button
            onClick={() => setServiceModalOpen(true)}
            className="action-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Wrench className="h-3.5 w-3.5 text-slate-400" />
            <span>Log Maintenance</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="action-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </section>

      {/* Loading State Skeleton */}
      {loading && vehicles.length === 0 ? (
        <div className="space-y-4">
          <div className="h-44 rounded-xl bg-[#0c0f13] border border-white/[0.06] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 rounded-xl bg-[#0c0f13] border border-white/[0.06] animate-pulse" />
            <div className="h-48 rounded-xl bg-[#0c0f13] border border-white/[0.06] animate-pulse" />
          </div>
        </div>
      ) : error && vehicles.length === 0 ? (
        <RequestError message={error} onRetry={loadVehicles} />
      ) : activeVehicle && (
        <>
          {/* VEHICLE SWITCHER PILLS (if user owns multiple vehicles) */}
          {vehicles.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Active Vehicle:
              </span>
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    activeVehicle.id === v.id
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm"
                      : "bg-[#0c0f13] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/[0.12]"
                  }`}
                >
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/[0.06] text-slate-300">
                    {v.vehicleType === "MOTORCYCLE" ? "BIKE" : v.vehicleType === "SCOOTER" ? "SCOOTER" : v.vehicleType === "SUV" ? "SUV" : v.vehicleType === "VAN" ? "VAN" : "CAR"}
                  </span>
                  <span>{v.year} {v.make} {v.model}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    ({v.healthScore}/100)
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 2. COMPREHENSIVE VEHICLE HEALTH HERO */}
          <section className="rounded-xl border border-white/[0.08] bg-[#0c0f13] p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left: Vehicle Image & Identity */}
              <div className="flex items-center gap-4 min-w-0">
                <Link
                  href={`/garage/${activeVehicle.id}`}
                  className="relative h-20 w-32 overflow-hidden rounded-lg bg-[#07090b] border border-white/[0.08] shrink-0 group"
                >
                  <VehicleImageView
                    src={activeVehicle.imageUrl}
                    alt={`${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`}
                    make={activeVehicle.make}
                    model={activeVehicle.model}
                    year={activeVehicle.year}
                    trim={activeVehicle.trim}
                    fuelType={activeVehicle.fuelType}
                    vehicleType={activeVehicle.vehicleType}
                    aspectRatio="cover"
                  />
                </Link>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/garage/${activeVehicle.id}`}
                      className="text-lg font-extrabold text-white hover:text-amber-300 transition-colors truncate"
                    >
                      {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                    </Link>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                      {activeVehicle.vehicleType === "MOTORCYCLE"
                        ? "Bike"
                        : activeVehicle.vehicleType === "SCOOTER"
                        ? "Scooter"
                        : activeVehicle.vehicleType === "SUV"
                        ? "SUV"
                        : activeVehicle.vehicleType === "VAN"
                        ? "Van"
                        : "Car"}
                    </span>
                    {activeVehicle.engineCc && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.06] text-sky-400 border border-white/[0.08]">
                        {activeVehicle.engineCc} CC
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                      {activeVehicle.fuelType === "ELECTRIC"
                        ? "Electric (BEV)"
                        : activeVehicle.fuelType === "HYBRID"
                        ? "Hybrid Electric"
                        : `${activeVehicle.fuelType} (ICE)`}
                    </span>
                    {activeVehicle.obdConnected && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <Radio className="h-3 w-3" /> OBD-II Synced
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1.5 flex-wrap">
                    <span>Odometer: <strong className="text-white">{activeVehicle.mileage.toLocaleString()} mi</strong></span>
                    {activeVehicle.licensePlate && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span>Plate: <strong className="text-slate-300">{activeVehicle.licensePlate}</strong></span>
                      </>
                    )}
                    {activeVehicle.vin && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span>VIN: <strong className="text-slate-400">{activeVehicle.vin}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Radial Health Score Gauge */}
              <div className="flex items-center gap-4 bg-[#080b0e] p-3.5 rounded-lg border border-white/[0.06] shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider font-semibold block">
                    Overall Health Score
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span
                      className={`text-3xl font-mono font-extrabold ${
                        activeVehicle.healthScore >= 80
                          ? "text-emerald-400"
                          : activeVehicle.healthScore >= 65
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {activeVehicle.healthScore}
                    </span>
                    <span className="text-xs font-mono text-slate-500 font-bold">/ 100</span>
                  </div>
                </div>

                <div className="text-right pl-3 border-l border-white/[0.06]">
                  <span
                    className={`text-xs font-bold block ${
                      activeVehicle.healthScore >= 80
                        ? "text-emerald-400"
                        : activeVehicle.healthScore >= 65
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {activeVehicle.healthScore >= 85
                      ? "Excellent"
                      : activeVehicle.healthScore >= 70
                      ? "Good"
                      : activeVehicle.healthScore >= 55
                      ? "Needs Attention"
                      : "Critical"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    {activeDTCs.length === 0 ? "0 active faults" : `${activeDTCs.length} active DTCs`}
                  </span>
                </div>
              </div>
            </div>

            {/* Subsystem Health Matrix */}
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <SubsystemHealthMatrix subsystems={subsystemHealth} showTitle={true} compact={false} />
            </div>
          </section>

          {/* 3. TROUBLE CODES & ACTIONABLE RECOMMENDATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Active DTCs & Safe Driving Guidance (7 Columns) */}
            <section className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#0c0f13] p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-white">
                    Active Trouble Codes & Diagnostic Triage
                  </h2>
                </div>
                <Link
                  href={`/diagnostics?vehicleId=${activeVehicle.id}`}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>Diagnostic log</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {activeDTCs.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#080b0e] border border-white/[0.04] flex items-center gap-3 text-xs text-slate-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">You&apos;re all caught up!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No active trouble codes detected. All sensors and onboard systems report nominal operating parameters.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDTCs.map((dtc) => (
                    <div
                      key={dtc.id}
                      className={`p-4 rounded-lg border text-xs space-y-2.5 ${
                        dtc.severity === "CRITICAL"
                          ? "bg-red-500/5 border-red-500/30"
                          : "bg-amber-500/5 border-amber-500/25"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              dtc.severity === "CRITICAL"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {dtc.codes}
                          </span>
                          <span className="text-slate-300 font-medium">
                            {dtc.aiSummary?.split(".")[0] || "Diagnostic Fault"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                            {dtc.dataSource === "OBD_II" ? "From OBD-II" : "Estimated"}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              dtc.canDrive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                : "bg-red-500/10 text-red-400 border-red-500/25"
                            }`}
                          >
                            {dtc.canDrive ? "Safe for Short Drives" : "Do Not Drive"}
                          </span>
                        </div>
                      </div>

                      {/* Safe to Drive Explanation */}
                      <div className="p-2.5 rounded bg-[#080b0e] border border-white/[0.04] text-[11px] text-slate-300 leading-relaxed">
                        <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                          Safe Driving Guidance:
                        </span>
                        {dtc.canDrive
                          ? "No immediate stall hazard detected. Safe to drive locally, but avoid aggressive acceleration and schedule inspection soon."
                          : "Critical sensor malfunction. Extended driving may cause catalytic converter or engine damage. Immediate mechanical service required."}
                      </div>

                      {/* Cost Range */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          Est. Repair: ${dtc.estimatedCostMin} – ${dtc.estimatedCostMax}
                        </span>
                        <Link
                          href={`/diagnostics?vehicleId=${activeVehicle.id}`}
                          className="text-amber-400 hover:text-amber-300 font-sans font-semibold"
                        >
                          View Diagnostic Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* AI Action Plan: What Should I Do Next? (5 Columns) */}
            <section className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#0c0f13] p-5 shadow-lg space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-white">
                      Recommended Next Actions
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    AI Advisor
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  {activeDTCs.length > 0 ? (
                    <div className="p-3 rounded-lg bg-[#080b0e] border border-white/[0.04] space-y-2">
                      <p className="font-semibold text-white">Priority 1: Diagnostic Verification</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Inspect sensor wiring harnesses and verify live telemetry readings with a continuous OBD-II scan.
                      </p>
                      <div className="pt-1">
                        <Link
                          href={`/diagnostics?vehicleId=${activeVehicle.id}`}
                          className="action-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                        >
                          <span>Review Fault Code Details</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ) : upcomingMaintenance.length > 0 ? (
                    <div className="p-3 rounded-lg bg-[#080b0e] border border-white/[0.04] space-y-2">
                      <p className="font-semibold text-white">Priority 1: Upcoming Maintenance</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {upcomingMaintenance[0]?.taskName} is due soon. Scheduling service ahead of time prevents secondary component wear.
                      </p>
                      <div className="pt-1">
                        <Link
                          href={`/maintenance?vehicleId=${activeVehicle.id}`}
                          className="action-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 text-amber-400"
                        >
                          <span>View Maintenance Logbook</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-[#080b0e] border border-white/[0.04] space-y-1.5">
                      <p className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> All systems nominal
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        No immediate service actions required. AutoPulse continues to monitor battery degradation, brake wear, and sensor loops in real-time.
                      </p>
                    </div>
                  )}

                  {/* Secondary Tip */}
                  <div className="p-3 rounded-lg bg-[#080b0e] border border-white/[0.04] flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Recommendations combine factory service guidelines and live sensor diagnostics.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <Link
                  href={`/predictive?vehicleId=${activeVehicle.id}`}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <span>Predictive Wear Forecast →</span>
                </Link>
                <Link
                  href={`/garage/${activeVehicle.id}`}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  Vehicle Profile
                </Link>
              </div>
            </section>
          </div>

          {/* 4. UPCOMING MAINTENANCE HORIZONS */}
          <section className="rounded-xl border border-white/[0.08] bg-[#0c0f13] p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">
                  Upcoming Maintenance & Factory Intervals
                </h2>
              </div>
              <Link
                href={`/maintenance?vehicleId=${activeVehicle.id}`}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Full logbook</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {upcomingMaintenance.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#080b0e] border border-white/[0.04] text-center text-xs text-slate-500">
                All factory maintenance intervals are current.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingMaintenance.map((s) => {
                  const isOverdue = s.urgency === "OVERDUE";
                  const remainingMiles = Math.max(0, s.nextDueMileage - activeVehicle.mileage);
                  const overdueMiles = Math.max(0, activeVehicle.mileage - s.nextDueMileage);

                  return (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-lg border flex flex-col justify-between text-xs space-y-3 ${
                        isOverdue
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-[#080b0e] border-white/[0.06]"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              isOverdue
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            }`}
                          >
                            {isOverdue ? "Overdue" : "Due Soon"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Est. ${s.estimatedCost || 75}
                          </span>
                        </div>
                        <p className="font-bold text-white text-xs pt-1">{s.taskName}</p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {isOverdue
                            ? `Overdue by ${overdueMiles.toLocaleString()} mi`
                            : `Due in ${remainingMiles.toLocaleString()} mi (at ${s.nextDueMileage.toLocaleString()} mi)`}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {s.category || "General"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setServiceModalOpen(true)}
                          className="action-secondary text-[11px] py-1 px-2.5"
                        >
                          Log Service
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Global Modals */}
      <AddVehicleModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onVehicleAdded={loadVehicles}
      />
      <AddServiceModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onRecordAdded={loadVehicles}
      />
      <ObdScannerModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onAnalysisSuccess={loadVehicles}
      />
    </div>
  );
}
