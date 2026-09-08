import { DiagnosticScanItem, MaintenanceScheduleItem } from "@/types";

export interface SubsystemStatus {
  name: string;
  category: string;
  score: number;
  status: "NOMINAL" | "ATTENTION" | "CRITICAL";
  details: string;
}

export function calculateSubsystemHealth(
  mileage: number,
  year: number,
  schedules: MaintenanceScheduleItem[] = [],
  diagnostics: DiagnosticScanItem[] = [],
  vehicleType: string = "CAR",
  fuelType: string = "GASOLINE",
  driveType?: string | null
): SubsystemStatus[] {
  const activeDiags = diagnostics.filter((d) => d.status === "ACTIVE");
  const isEV = fuelType.toUpperCase() === "ELECTRIC";
  const isMotorcycle = vehicleType.toUpperCase() === "MOTORCYCLE";
  const isScooter = vehicleType.toUpperCase() === "SCOOTER";

  // Helper to map score to status
  const toStatus = (score: number): "NOMINAL" | "ATTENTION" | "CRITICAL" => {
    if (score < 60) return "CRITICAL";
    if (score < 80) return "ATTENTION";
    return "NOMINAL";
  };

  // 1. ENGINE / POWERTRAIN
  let powertrainScore = 96;
  const powertrainDTC = activeDiags.find((d) =>
    d.codes.startsWith("P0") || d.codes.startsWith("P1") || d.codes.startsWith("P2")
  );
  if (powertrainDTC) {
    powertrainScore = powertrainDTC.severity === "CRITICAL" ? 48 : 68;
  }
  const engineSchedule = schedules.find((s) => s.category === "ENGINE" && s.urgency !== "GOOD");
  if (engineSchedule) {
    powertrainScore = Math.min(powertrainScore, engineSchedule.urgency === "OVERDUE" ? 64 : 82);
  }

  // 2. BRAKING
  let brakingScore = 94;
  const brakeSchedule = schedules.find((s) => s.category === "BRAKES" && s.urgency !== "GOOD");
  if (brakeSchedule) {
    brakingScore = brakeSchedule.urgency === "OVERDUE" ? 55 : 78;
  }

  // 3. BATTERY & ELECTRICAL
  let electricalScore = 95;
  const electricalDTC = activeDiags.find((d) =>
    d.codes.startsWith("B") || d.codes.startsWith("U") || d.codes.includes("BATTERY")
  );
  if (electricalDTC) {
    electricalScore = electricalDTC.severity === "CRITICAL" ? 52 : 72;
  }
  const electricalSchedule = schedules.find((s) => s.category === "ELECTRICAL" && s.urgency !== "GOOD");
  if (electricalSchedule) {
    electricalScore = Math.min(electricalScore, electricalSchedule.urgency === "OVERDUE" ? 62 : 80);
  }

  // 4. TIRES
  let tiresScore = 92;
  const tireSchedule = schedules.find((s) => s.category === "TIRES" && s.urgency !== "GOOD");
  if (tireSchedule) {
    tiresScore = tireSchedule.urgency === "OVERDUE" ? 58 : 76;
  }

  // 5. DRIVE SYSTEM (Chain/Sprocket for Bike, CVT Belt for Scooter, Transmission for Car)
  let driveScore = 95;
  const driveSchedule = schedules.find((s) => s.category === "DRIVE" && s.urgency !== "GOOD");
  if (driveSchedule) {
    driveScore = driveSchedule.urgency === "OVERDUE" ? 58 : 77;
  }

  // 6. SUSPENSION / FORKS
  let suspensionScore = 94;
  const suspensionSchedule = schedules.find((s) => s.category === "SUSPENSION" && s.urgency !== "GOOD");
  if (suspensionSchedule) {
    suspensionScore = suspensionSchedule.urgency === "OVERDUE" ? 62 : 80;
  }

  // 7. FLUIDS & FILTERS (Oil/Air filter/Coolant)
  let fluidsScore = 95;
  const fluidSchedule = schedules.find(
    (s) => (s.category === "FLUIDS" || s.category === "FILTERS") && s.urgency !== "GOOD"
  );
  if (fluidSchedule) {
    fluidsScore = fluidSchedule.urgency === "OVERDUE" ? 60 : 79;
  }

  // ==========================================
  // TYPE-SPECIFIC COMPONENT MATRICES
  // ==========================================

  if (isMotorcycle) {
    return [
      {
        name: "Engine & Oil",
        category: "ENGINE",
        score: powertrainScore,
        status: toStatus(powertrainScore),
        details: engineSchedule
          ? (engineSchedule.urgency === "OVERDUE" ? "Motorcycle engine oil overdue" : "Oil service due soon")
          : "Valve clearances and compression nominal",
      },
      {
        name: "Chain & Sprocket",
        category: "DRIVE",
        score: driveScore,
        status: toStatus(driveScore),
        details: driveSchedule
          ? (driveSchedule.urgency === "OVERDUE" ? "Chain lube & slack adjustment overdue" : "Chain inspection due soon")
          : "Drive chain tension & roller wear optimal",
      },
      {
        name: "Braking (Front & Rear)",
        category: "BRAKES",
        score: brakingScore,
        status: toStatus(brakingScore),
        details: brakeSchedule
          ? (brakeSchedule.urgency === "OVERDUE" ? "Pad wear inspection overdue" : "Brake fluid check due soon")
          : "Disc thickness & master cylinder pressure verified",
      },
      {
        name: "Motorcycle Tires",
        category: "TIRES",
        score: tiresScore,
        status: toStatus(tiresScore),
        details: tireSchedule
          ? (tireSchedule.urgency === "OVERDUE" ? "Tread inspection overdue" : "Pressure check due soon")
          : "Profile curvature & inflation within factory spec",
      },
      {
        name: "Forks & Suspension",
        category: "SUSPENSION",
        score: suspensionScore,
        status: toStatus(suspensionScore),
        details: suspensionSchedule
          ? (suspensionSchedule.urgency === "OVERDUE" ? "Fork oil service overdue" : "Damper check due soon")
          : "Telescopic seals dry & monoshock preload calibrated",
      },
      {
        name: "Electrical & Ignition",
        category: "ELECTRICAL",
        score: electricalScore,
        status: toStatus(electricalScore),
        details: electricalDTC
          ? `Ignition/Electrical alert: ${electricalDTC.codes}`
          : "12V Battery charge & spark plug timing verified",
      },
    ];
  }

  if (isScooter) {
    return [
      {
        name: isEV ? "Electric Motor" : "Engine & Oil",
        category: "ENGINE",
        score: powertrainScore,
        status: toStatus(powertrainScore),
        details: isEV
          ? "Electric hub drive efficiency verified"
          : engineSchedule
          ? (engineSchedule.urgency === "OVERDUE" ? "Engine oil overdue" : "Oil check due soon")
          : "Combustion & cooling airflow nominal",
      },
      {
        name: isEV ? "Drive Reduction Gear" : "CVT Drive Belt & Rollers",
        category: "DRIVE",
        score: driveScore,
        status: toStatus(driveScore),
        details: driveSchedule
          ? (driveSchedule.urgency === "OVERDUE" ? "CVT belt replacement overdue" : "Variator inspection due soon")
          : "Variator roller weights & drive belt width optimal",
      },
      {
        name: "Brake System & Cables",
        category: "BRAKES",
        score: brakingScore,
        status: toStatus(brakingScore),
        details: brakeSchedule
          ? (brakeSchedule.urgency === "OVERDUE" ? "Brake cable adjustment overdue" : "Shoe/pad check due soon")
          : "Combi-brake synchronization & lining nominal",
      },
      {
        name: "Scooter Tires & Pressure",
        category: "TIRES",
        score: tiresScore,
        status: toStatus(tiresScore),
        details: tireSchedule
          ? (tireSchedule.urgency === "OVERDUE" ? "Tire replacement overdue" : "Pressure check due soon")
          : "Small-diameter tread depth & rim bead seated",
      },
      {
        name: "Battery & Starter",
        category: "ELECTRICAL",
        score: electricalScore,
        status: toStatus(electricalScore),
        details: isEV
          ? "High-voltage battery state-of-health nominal"
          : "Self-starter cranking voltage & lighting verified",
      },
      {
        name: "Suspension & Shocks",
        category: "SUSPENSION",
        score: suspensionScore,
        status: toStatus(suspensionScore),
        details: "Single-sided trailing link & rear shock nominal",
      },
    ];
  }

  // Default: CAR, SUV, VAN
  return [
    {
      name: isEV ? "Electric Powertrain" : "Powertrain & Engine",
      category: "ENGINE",
      score: powertrainScore,
      status: toStatus(powertrainScore),
      details: isEV
        ? "Inverter efficiency & motor torque delivery nominal"
        : powertrainDTC
        ? `Active DTC: ${powertrainDTC.codes}`
        : "Combustion & transmission parameters nominal",
    },
    {
      name: "Braking System",
      category: "BRAKES",
      score: brakingScore,
      status: toStatus(brakingScore),
      details: brakeSchedule
        ? (brakeSchedule.urgency === "OVERDUE" ? "Brake service overdue" : "Service due soon")
        : "Hydraulic pressure & pad wear nominal",
    },
    {
      name: isEV ? "High-Voltage Battery" : "Battery & Electrical",
      category: "ELECTRICAL",
      score: electricalScore,
      status: toStatus(electricalScore),
      details: electricalDTC
        ? `Electrical alert: ${electricalDTC.codes}`
        : isEV
        ? "Cell balance & thermal management optimal"
        : "12V starter battery health verified",
    },
    {
      name: "Tires & Alignment",
      category: "TIRES",
      score: tiresScore,
      status: toStatus(tiresScore),
      details: tireSchedule
        ? (tireSchedule.urgency === "OVERDUE" ? "Tire rotation overdue" : "Rotation due soon")
        : "Tread depth & balance calibrated",
    },
    {
      name: isEV ? "Thermal Coolant & Cabin Filter" : "Fluids & Filters",
      category: "FLUIDS",
      score: fluidsScore,
      status: toStatus(fluidsScore),
      details: fluidSchedule ? "Filter/fluid maintenance required" : "Clean operating media levels",
    },
  ];
}
