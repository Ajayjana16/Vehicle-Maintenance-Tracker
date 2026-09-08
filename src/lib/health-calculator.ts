import { SubsystemHealthBreakdown } from "@/types";

interface ScheduleItemInput {
  urgency: string;
  category?: string;
  taskName?: string;
  nextDueMileage: number;
  nextDueDate: Date | string;
}

interface DiagnosticInput {
  status: string;
  severity: string;
  codes?: string;
  symptoms?: string | null;
}

export function calculateVehicleHealthScore(
  mileage: number,
  year: number,
  schedules: ScheduleItemInput[] = [],
  diagnostics: DiagnosticInput[] = []
): number {
  let score = 100;

  // 1. Penalties for Active Diagnostic Issues
  const activeDiagnostics = diagnostics.filter((d) => d.status === "ACTIVE");
  for (const diag of activeDiagnostics) {
    if (diag.severity === "CRITICAL") {
      score -= 25;
    } else if (diag.severity === "MODERATE") {
      score -= 12;
    } else {
      score -= 5;
    }
  }

  // 2. Penalties for Overdue / Due Soon Maintenance
  for (const item of schedules) {
    if (item.urgency === "OVERDUE") {
      score -= 15;
    } else if (item.urgency === "DUE_SOON") {
      score -= 5;
    }
  }

  // 3. Mild degradation factor based on extreme mileage (>150k miles)
  if (mileage > 200000) {
    score -= 8;
  } else if (mileage > 150000) {
    score -= 4;
  }

  // Clamp score between 15 and 100
  return Math.max(15, Math.min(100, Math.round(score)));
}

export function calculateSubsystemBreakdown(
  mileage: number,
  schedules: ScheduleItemInput[] = [],
  diagnostics: DiagnosticInput[] = []
): SubsystemHealthBreakdown {
  const activeDTCs = diagnostics.filter((d) => d.status === "ACTIVE");
  const overdueItems = schedules.filter((s) => s.urgency === "OVERDUE");
  const dueSoonItems = schedules.filter((s) => s.urgency === "DUE_SOON");

  // Helper to compute subsystem scores
  const hasEngineDTC = activeDTCs.some((d) => (d.codes || "").includes("P04") || (d.codes || "").includes("P03") || (d.codes || "").includes("P01"));
  const hasEngineOverdue = overdueItems.some((s) => s.category === "ENGINE" || s.category === "FLUIDS");
  const hasEngineDueSoon = dueSoonItems.some((s) => s.category === "ENGINE");

  const powertrainScore = hasEngineDTC ? 65 : hasEngineOverdue ? 78 : hasEngineDueSoon ? 88 : 94;
  const powertrainStatus = powertrainScore >= 90 ? "GOOD" : powertrainScore >= 75 ? "ATTENTION" : "CRITICAL";

  // Braking
  const hasBrakeOverdue = overdueItems.some((s) => s.category === "BRAKES");
  const hasBrakeDueSoon = dueSoonItems.some((s) => s.category === "BRAKES");
  const brakingScore = hasBrakeOverdue ? 72 : hasBrakeDueSoon ? 86 : 96;
  const brakingStatus = brakingScore >= 90 ? "GOOD" : brakingScore >= 75 ? "ATTENTION" : "CRITICAL";

  // Battery
  const batteryScore = mileage > 80000 ? 86 : mileage > 40000 ? 91 : 98;
  const batteryStatus = batteryScore >= 90 ? "GOOD" : "ATTENTION";

  // Tires
  const hasTireOverdue = overdueItems.some((s) => s.category === "TIRES");
  const hasTireDueSoon = dueSoonItems.some((s) => s.category === "TIRES");
  const tiresScore = hasTireOverdue ? 68 : hasTireDueSoon ? 82 : 88;
  const tiresStatus = tiresScore >= 90 ? "GOOD" : tiresScore >= 75 ? "ATTENTION" : "CRITICAL";

  // Fluids & Filters
  const hasFilterOverdue = overdueItems.some((s) => s.category === "FILTERS" || s.category === "FLUIDS");
  const fluidsScore = hasFilterOverdue ? 70 : 93;
  const fluidsStatus = fluidsScore >= 90 ? "GOOD" : "ATTENTION";

  // Suspension
  const suspensionScore = mileage > 100000 ? 82 : mileage > 50000 ? 90 : 97;
  const suspensionStatus = suspensionScore >= 90 ? "GOOD" : "ATTENTION";

  return {
    powertrain: {
      score: powertrainScore,
      status: powertrainStatus,
      label: "Powertrain & Engine",
      description: hasEngineDTC
        ? "Active diagnostic trouble code detected on exhaust/combustion circuit."
        : hasEngineOverdue
        ? "Engine maintenance interval is past due."
        : "Engine combustion, fuel trim, and transmission shifting within factory parameters.",
      factors: hasEngineDTC ? ["Active DTC code logged", "Emissions system efficiency check needed"] : ["Nominal operating temperature", "Clean fuel trim"],
    },
    braking: {
      score: brakingScore,
      status: brakingStatus,
      label: "Braking System",
      description: hasBrakeDueSoon
        ? "Brake fluid moisture inspection recommended soon."
        : "Hydraulic pressure, regenerative deceleration, and pad thickness are in safe condition.",
      factors: hasBrakeDueSoon ? ["Brake fluid inspection due in < 1,000 mi"] : ["Pad friction material > 5mm", "No hydraulic pressure drop"],
    },
    battery: {
      score: batteryScore,
      status: batteryStatus,
      label: "Battery & Electrical",
      description: "Pack voltage stability and 12V auxiliary system functioning optimally.",
      factors: ["12.6V resting charge verified", "Zero parasitic draw detected"],
    },
    tires: {
      score: tiresScore,
      status: tiresStatus,
      label: "Tires & Alignment",
      description: hasTireDueSoon
        ? "Tire rotation window reached to ensure even tread wear."
        : "Tread depth and TPMS cold pressures nominal across all four corners.",
      factors: hasTireDueSoon ? ["Rotation due soon"] : ["Cold pressure at 36 PSI", "Tread depth >= 5/32 in"],
    },
    fluids: {
      score: fluidsScore,
      status: fluidsStatus,
      label: "Fluids & Filters",
      description: hasFilterOverdue
        ? "Air filter replacement is overdue."
        : "Engine oil, coolant, and particulate air filters are within service limits.",
      factors: hasFilterOverdue ? ["Air filter replacement overdue"] : ["Synthetic fluid life within spec"],
    },
    suspension: {
      score: suspensionScore,
      status: suspensionStatus,
      label: "Suspension & Steering",
      description: "Dampers, control arms, and steering tie rods exhibit zero play.",
      factors: ["Dampers firm", "No bushing degradation"],
    },
  };
}

export function getHealthStatusLabel(score: number): {
  label: string;
  color: string;
  badgeClass: string;
} {
  if (score >= 90) {
    return {
      label: "Excellent Condition",
      color: "#10b981", // emerald-500
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }
  if (score >= 75) {
    return {
      label: "Good · Minor Attention",
      color: "#0ea5e9", // sky-500
      badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    };
  }
  if (score >= 60) {
    return {
      label: "Fair · Service Due",
      color: "#f59e0b", // amber-500
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
  }
  return {
    label: "Critical · Needs Inspection",
    color: "#ef4444", // red-500
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
  };
}
