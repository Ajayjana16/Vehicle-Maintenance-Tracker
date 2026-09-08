"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { VehicleWithRelations } from "@/types";
import VehicleImageView from "./vehicle-image-view";
import SubsystemHealthMatrix from "./subsystem-health-matrix";
import { calculateSubsystemHealth } from "@/lib/subsystem-health";
import {
  AlertTriangle,
  Cpu,
  Wrench,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Gauge,
  Bike,
  Car,
  Zap,
} from "lucide-react";

interface VehicleCardProps {
  vehicle: VehicleWithRelations;
  onRunScan?: (vehicleId: string) => void;
  onLogService?: (vehicleId: string) => void;
}

export default function VehicleCard({
  vehicle,
  onRunScan,
  onLogService,
}: VehicleCardProps) {
  const activeIssues =
    vehicle.diagnostics?.filter((d) => d.status === "ACTIVE") || [];
  const hasCriticalIssue = activeIssues.some((d) => d.severity === "CRITICAL");
  const overdueServices =
    vehicle.schedules?.filter((s) => s.urgency === "OVERDUE") || [];
  const dueSoonServices =
    vehicle.schedules?.filter((s) => s.urgency === "DUE_SOON") || [];

  const isEV = vehicle.fuelType === "ELECTRIC";
  const isHybrid = vehicle.fuelType === "HYBRID";
  const isMotorcycle = vehicle.vehicleType === "MOTORCYCLE";
  const isScooter = vehicle.vehicleType === "SCOOTER";
  const isTwoWheeler = isMotorcycle || isScooter;

  // Calculate Subsystem Health breakdown
  const subsystems = useMemo(
    () =>
      calculateSubsystemHealth(
        vehicle.mileage,
        vehicle.year,
        vehicle.schedules,
        vehicle.diagnostics,
        vehicle.vehicleType,
        vehicle.fuelType,
        vehicle.driveType
      ),
    [vehicle.mileage, vehicle.year, vehicle.schedules, vehicle.diagnostics, vehicle.vehicleType, vehicle.fuelType, vehicle.driveType]
  );

  // Determine overall status tone
  const [statusLabel, statusClass] = hasCriticalIssue
    ? ["CRITICAL", "critical"]
    : activeIssues.length > 0 || overdueServices.length > 0
    ? ["ATTENTION", "attention"]
    : dueSoonServices.length > 0
    ? ["DUE SOON", "attention"]
    : ["NOMINAL", "healthy"];

  const typeLabel = isMotorcycle
    ? "Bike"
    : isScooter
    ? "Scooter"
    : isEV
    ? "EV"
    : isHybrid
    ? "Hybrid"
    : vehicle.vehicleType === "SUV"
    ? "SUV"
    : vehicle.vehicleType === "VAN"
    ? "Van"
    : "Car";

  return (
    <div className="group relative flex flex-col rounded-lg bg-[#0c0f13] border border-white/[0.06] hover:border-amber-500/35 transition-all duration-200 overflow-hidden">
      {/* Top Hero Photography Container */}
      <Link href={`/garage/${vehicle.id}`} className="relative block overflow-hidden bg-[#080a0c]">
        <VehicleImageView
          src={vehicle.imageUrl}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          make={vehicle.make}
          model={vehicle.model}
          year={vehicle.year}
          trim={vehicle.trim}
          vehicleType={vehicle.vehicleType}
          fuelType={vehicle.fuelType}
          aspectRatio="video"
        />

        {/* Health Score Readout Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded bg-black/80 backdrop-blur-sm px-2.5 py-1 text-xs font-mono-num font-bold text-white border border-white/[0.12]">
          <span className="text-[9px] uppercase text-slate-400 font-sans font-semibold">
            Health
          </span>
          <span
            className={
              vehicle.healthScore >= 80
                ? "text-emerald-400"
                : vehicle.healthScore >= 65
                ? "text-amber-400"
                : "text-red-400"
            }
          >
            {vehicle.healthScore}
          </span>
          <span className="text-slate-500 text-[10px]">/100</span>
        </div>

        {/* Operational Status Tag & Vehicle Type Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={`telemetry-pill ${statusClass}`}>
            {statusLabel === "CRITICAL" ? (
              <ShieldAlert className="h-3 w-3" />
            ) : statusLabel === "NOMINAL" ? (
              <ShieldCheck className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {statusLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-amber-400 border border-white/[0.12] backdrop-blur-sm">
            {isTwoWheeler ? <Bike className="h-3 w-3" /> : isEV ? <Zap className="h-3 w-3" /> : <Car className="h-3 w-3" />}
            {typeLabel}
          </span>
        </div>
      </Link>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5 space-y-4">
        {/* Vehicle Identity */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/garage/${vehicle.id}`}
              className="font-bold text-lg text-white group-hover:text-amber-300 transition-colors truncate tracking-tight"
            >
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
            <span>{vehicle.name}</span>
            {vehicle.engineCc ? <span>• {vehicle.engineCc} cc</span> : null}
            {vehicle.trim ? <span>• {vehicle.trim}</span> : null}
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-[#080b0e] border border-white/[0.04] p-2.5">
            <span className="block text-[10px] text-slate-500 mb-0.5">
              Odometer
            </span>
            <span className="font-mono font-bold text-sm text-slate-200">
              {vehicle.mileage.toLocaleString()}{" "}
              <span className="text-[10px] font-normal text-slate-500">mi</span>
            </span>
          </div>

          <div className="rounded bg-[#080b0e] border border-white/[0.04] p-2.5">
            <span className="block text-[10px] text-slate-500 mb-0.5">
              Avg. daily
            </span>
            <span className="font-mono font-bold text-sm text-slate-200">
              ~{vehicle.avgDailyMiles || (isTwoWheeler ? 15 : 30)}{" "}
              <span className="text-[10px] font-normal text-slate-500">mi/day</span>
            </span>
          </div>
        </div>

        {/* System Health Matrix */}
        <div className="pt-1">
          <SubsystemHealthMatrix subsystems={subsystems} compact showTitle={false} />
        </div>

        {/* Active Fault Banner */}
        {activeIssues.length > 0 && (
          <div className="rounded bg-red-500/[0.08] border border-red-500/20 p-2.5 text-xs text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <span className="truncate">
                {activeIssues[0].codes}: {activeIssues[0].aiSummary?.split(".")[0]}
              </span>
            </div>
            <Link
              href={`/garage/${vehicle.id}?tab=diagnostics`}
              className="text-[10px] font-mono text-red-400 hover:underline shrink-0 ml-2"
            >
              VIEW
            </Link>
          </div>
        )}

        {/* Next Maintenance Line */}
        <div className="border-t border-white/[0.06] pt-3 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate">
              {overdueServices.length > 0
                ? `${overdueServices[0].taskName} (Overdue)`
                : dueSoonServices.length > 0
                ? `${dueSoonServices[0].taskName} (Due soon)`
                : "No service currently due"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
          <button
            onClick={() => onRunScan?.(vehicle.id)}
            className="action-secondary py-1.5 text-xs flex items-center justify-center gap-1.5"
          >
            <Cpu className="h-3.5 w-3.5 text-sky-400" />
            <span>Scan OBD</span>
          </button>
          <button
            onClick={() => onLogService?.(vehicle.id)}
            className="action-secondary py-1.5 text-xs flex items-center justify-center gap-1.5"
          >
            <Wrench className="h-3.5 w-3.5 text-amber-400" />
            <span>Log Service</span>
          </button>
        </div>
      </div>
    </div>
  );
}
