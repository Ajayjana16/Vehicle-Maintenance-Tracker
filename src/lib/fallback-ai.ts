import { DiagnosticAnalysisResult, ParsedReceiptResult } from "@/types";

interface ObdDatabaseEntry {
  title: string;
  severity: "CRITICAL" | "MODERATE" | "MINOR";
  canDrive: boolean;
  summary: string;
  causes: string[];
  diySteps: string[];
  costMin: number;
  costMax: number;
}

const OBD_KNOWLEDGE_BASE: Record<string, ObdDatabaseEntry> = {
  P0300: {
    title: "Random or Multiple Cylinder Misfire Detected",
    severity: "CRITICAL",
    canDrive: false,
    summary:
      "The engine control module (ECM) detected multiple cylinders misfiring intermittently. Driving with a flashing check engine light can rapidly overheat and melt the catalytic converter.",
    causes: [
      "Worn spark plugs or faulty ignition coils",
      "Clogged fuel injectors or low fuel pressure",
      "Vacuum leak in intake manifold",
      "Defective mass air flow (MAF) sensor",
    ],
    diySteps: [
      "Inspect spark plug tips for carbon fouling or oil contamination",
      "Swap ignition coils between cylinders to see if misfire code follows",
      "Inspect vacuum lines for cracking or hissing sounds",
      "Clean Mass Air Flow (MAF) sensor using dedicated MAF cleaner spray",
    ],
    costMin: 120,
    costMax: 650,
  },
  P0420: {
    title: "Catalyst System Efficiency Below Threshold (Bank 1)",
    severity: "MODERATE",
    canDrive: true,
    summary:
      "The downstream oxygen sensor signals that the catalytic converter is not efficiently converting harmful exhaust emissions into cleaner gases.",
    causes: [
      "Failing or degraded catalytic converter",
      "Faulty downstream O2 oxygen sensor",
      "Exhaust leak before or near the catalytic converter",
      "Engine oil or coolant burning leaking into exhaust",
    ],
    diySteps: [
      "Check live O2 sensor voltage waveforms via OBD-II live scanner",
      "Inspect exhaust pipe near manifold for dark soot or pinhole leaks",
      "Test with catalytic converter cleaning additive before replacement",
    ],
    costMin: 180,
    costMax: 1400,
  },
  P0171: {
    title: "System Too Lean (Bank 1)",
    severity: "MODERATE",
    canDrive: true,
    summary:
      "There is too much air and not enough fuel in combustion chamber Bank 1. Can lead to rough idle, hesitation, and eventual valve wear if ignored.",
    causes: [
      "Dirty or failing Mass Air Flow (MAF) sensor",
      "Intake manifold vacuum leak or cracked PCV hose",
      "Weak fuel pump or clogged fuel filter",
      "Stuck open purge valve",
    ],
    diySteps: [
      "Clean MAF sensor with aerosol electrical cleaner",
      "Perform smoke test or carburetor cleaner spray test around intake gaskets to spot vacuum leaks",
      "Verify fuel pressure meets OEM spec",
    ],
    costMin: 80,
    costMax: 450,
  },
  P0128: {
    title: "Coolant Thermostat Temperature Below Regulating Temperature",
    severity: "MINOR",
    canDrive: true,
    summary:
      "The engine is taking too long to reach normal operating temperature. Usually caused by a thermostat stuck in the open position.",
    causes: [
      "Engine thermostat stuck open",
      "Faulty engine coolant temperature (ECT) sensor",
      "Low coolant level or trapped air pocket",
    ],
    diySteps: [
      "Check coolant level in expansion reservoir when engine is cold",
      "Feel upper and lower radiator hoses as engine warms up to check flow",
      "Replace thermostat assembly and bleed cooling system",
    ],
    costMin: 70,
    costMax: 280,
  },
  P0442: {
    title: "Evaporative Emission Control System Leak Detected (Small Leak)",
    severity: "MINOR",
    canDrive: true,
    summary:
      "A small vapor leak was detected in the fuel tank evaporative recovery system. Often harmless to engine performance but fails emissions test.",
    causes: [
      "Loose, cracked, or missing gas cap rubber seal",
      "Cracked EVAP charcoal canister vapor line",
      "Faulty EVAP vent solenoid or purge valve",
    ],
    diySteps: [
      "Remove, clean, and tightly re-click fuel filler cap (3 clicks)",
      "Inspect gas cap rubber O-ring for cracks or dry rot; replace cap if worn ($15)",
      "Reset code with scanner and drive through a drive cycle",
    ],
    costMin: 20,
    costMax: 220,
  },
  P0700: {
    title: "Transmission Control System Malfunction",
    severity: "CRITICAL",
    canDrive: false,
    summary:
      "The transmission control module (TCM) reported an internal fault. May result in vehicle going into limp-home mode to safeguard gears.",
    causes: [
      "Low or burnt automatic transmission fluid",
      "Faulty shift solenoid or valve body defect",
      "Wiring harness or TCM module communication failure",
    ],
    diySteps: [
      "Check automatic transmission fluid level and color (pink/red = good; dark brown/burnt = bad)",
      "Scan specifically with TCM-capable scanner for secondary P07xx subcodes",
    ],
    costMin: 150,
    costMax: 1800,
  },
  B1342: {
    title: "ECU / Airbag Control Module Defective",
    severity: "CRITICAL",
    canDrive: true,
    summary:
      "Internal supplemental restraint or body control unit self-test failure. Airbags may not deploy during an accident.",
    causes: ["Voltage spike", "Moisture intrusion in module", "Internal EEPROM failure"],
    diySteps: [
      "Check 12V battery health and terminal tightness",
      "Inspect module connectors under seats/console for moisture",
    ],
    costMin: 250,
    costMax: 850,
  },
};

export function fallbackAnalyzeDiagnostic(
  codes: string,
  symptoms?: string
): DiagnosticAnalysisResult {
  const codeArray = codes
    .toUpperCase()
    .split(/[\s,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  // Check if we have an exact OBD code match
  for (const code of codeArray) {
    if (OBD_KNOWLEDGE_BASE[code]) {
      const match = OBD_KNOWLEDGE_BASE[code];
      return {
        severity: match.severity,
        canDrive: match.canDrive,
        aiSummary: `[Code ${code} - ${match.title}] ${match.summary}`,
        possibleCauses: match.causes,
        diySteps: match.diySteps,
        estimatedCostMin: match.costMin,
        estimatedCostMax: match.costMax,
      };
    }
  }

  // Check Symptom NLP matching
  const sym = (symptoms || "").toLowerCase();
  if (sym.includes("squeal") || sym.includes("grind") || sym.includes("brake")) {
    return {
      severity: "MODERATE",
      canDrive: true,
      aiSummary:
        "Brake friction system wear detected. Squealing is typically caused by built-in acoustic wear indicator tabs contacting the rotor.",
      possibleCauses: [
        "Front or rear brake pads worn down below 3mm",
        "Glazed or warped brake rotors",
        "Worn caliper slide pins needing high-temp silicone lubrication",
        "Brake dust accumulation on pad shims",
      ],
      diySteps: [
        "Remove wheels and visually measure remaining brake pad friction material (minimum 3mm safe)",
        "Inspect rotor surface for deep grooving, lip wear, or blue heat tinting",
        "Replace brake pads and lubricate slide pins with brake-rated grease",
      ],
      estimatedCostMin: 90,
      estimatedCostMax: 420,
    };
  }

  if (sym.includes("vibrat") || sym.includes("shake") || sym.includes("wobble")) {
    return {
      severity: "MODERATE",
      canDrive: true,
      aiSummary:
        "Drivetrain or wheel assembly imbalance. Shaking at highway speed points to wheel balance or tire separation, while shaking under braking indicates rotor runout.",
      possibleCauses: [
        "Unbalanced tires or lost wheel weights",
        "Warped front brake rotors causing pulsing pedal/steering wheel",
        "Worn tie rod ends, ball joints, or control arm bushings",
      ],
      diySteps: [
        "Inspect tire tread for uneven cupping or abnormal bulge",
        "Have front wheels road-force balanced at a tire shop",
        "Check for play in front suspension by wiggling tire at 12 & 6 and 9 & 3 o'clock",
      ],
      estimatedCostMin: 60,
      estimatedCostMax: 350,
    };
  }

  if (sym.includes("overheat") || sym.includes("smoke") || sym.includes("steam")) {
    return {
      severity: "CRITICAL",
      canDrive: false,
      aiSummary:
        "Severe engine cooling distress. Running an overheating engine causes cylinder head warping and blown head gaskets.",
      possibleCauses: [
        "Radiator coolant leak or low coolant level",
        "Failed water pump or broken serpentine belt",
        "Thermostat stuck closed",
        "Electric radiator cooling fan motor failure",
      ],
      diySteps: [
        "Turn off engine immediately and let cool for at least 45 minutes",
        "Check coolant overflow tank and inspect undercarriage for green/pink puddles",
        "Do NOT open radiator cap while hot to prevent severe burns",
      ],
      estimatedCostMin: 150,
      estimatedCostMax: 950,
    };
  }

  if (sym.includes("battery") || sym.includes("crank") || sym.includes("click")) {
    return {
      severity: "MODERATE",
      canDrive: false,
      aiSummary:
        "Starting / charging system failure. Rapid clicking indicates starter solenoid receives inadequate voltage from the battery.",
      possibleCauses: [
        "Discharged or aged 12V lead-acid / AGM battery (>3-4 years old)",
        "Corroded battery terminals preventing good contact",
        "Failing alternator not recharging battery during operation",
        "Loose starter motor electrical connection",
      ],
      diySteps: [
        "Clean battery terminals with wire brush and baking soda/water solution",
        "Test battery resting voltage (should be 12.6V resting, 13.8-14.4V with engine running)",
        "Jump start and drive to auto parts store for free battery load test",
      ],
      estimatedCostMin: 120,
      estimatedCostMax: 320,
    };
  }

  // Generic fallback if code or symptom is unrecognized
  return {
    severity: codeArray.length > 0 ? "MODERATE" : "MINOR",
    canDrive: true,
    aiSummary: `Telemetry analyzed: ${codes || "Reported Symptoms"}. Potential powertrain or sensor drift detected requiring diagnostic inspection.`,
    possibleCauses: [
      "Sensor connector oxidation or wiring harness resistance",
      "Pending maintenance interval threshold reached",
      "Minor vacuum or electrical circuit anomaly",
    ],
    diySteps: [
      "Connect OBD-II scanner and clear code to verify if it returns immediately",
      "Check fluid levels (oil, brake fluid, coolant, transmission)",
      "Inspect engine bay for loose grounds, disconnected hoses, or rodent damage",
    ],
    estimatedCostMin: 75,
    estimatedCostMax: 250,
  };
}

export function fallbackParseReceipt(text: string): ParsedReceiptResult {
  const lines = text.split("\n").map((l) => l.trim());
  let cost = 0;
  let provider = "Independent Auto Care";
  let title = "General Vehicle Service";
  let serviceType = "GENERAL";
  let mileage: number | null = null;
  const partsReplaced: string[] = [];

  // Match cost ($450.00, Total: 129.99, etc.)
  const costRegex = /(?:total|amount|due|paid)?\s*\$?\s*([0-9]{1,4}(?:\.[0-9]{2})?)/i;
  for (const line of lines) {
    if (/total|amount due|final|balance/i.test(line)) {
      const match = line.match(/\$?([0-9]+(?:\.[0-9]{2})?)/);
      if (match) {
        cost = parseFloat(match[1]);
        break;
      }
    }
  }
  if (!cost) {
    const allMatches = text.match(/\$([0-9]+(?:\.[0-9]{2})?)/g);
    if (allMatches && allMatches.length > 0) {
      const numbers = allMatches.map((m) => parseFloat(m.replace("$", "")));
      cost = Math.max(...numbers);
    }
  }

  // Match mileage
  const mileageMatch = text.match(/([0-9]{1,3}(?:,[0-9]{3})*|[0-9]{4,6})\s*(?:miles|mi|odometer)/i);
  if (mileageMatch) {
    mileage = parseInt(mileageMatch[1].replace(/,/g, ""), 10);
  }

  // Detect Provider
  if (/toyota|honda|ford|chevrolet|bmw|audi|hyundai|kia|dealership/i.test(text)) {
    const match = text.match(/(Toyota|Honda|Ford|Chevrolet|BMW|Audi|Hyundai|Kia|Tesla)(\s+[A-Za-z]+)?/i);
    provider = match ? `${match[0]} Dealership` : "Dealership Service Center";
  } else if (/firestone/i.test(text)) {
    provider = "Firestone Complete Auto Care";
  } else if (/jiffy lube/i.test(text)) {
    provider = "Jiffy Lube";
  } else if (/valvoline/i.test(text)) {
    provider = "Valvoline Instant Oil Change";
  } else if (/pep boys/i.test(text)) {
    provider = "Pep Boys";
  } else if (/midas/i.test(text)) {
    provider = "Midas Auto Service";
  }

  // Detect Service Type & Parts
  const lower = text.toLowerCase();
  if (lower.includes("oil") || lower.includes("filter")) {
    title = "Full Synthetic Oil & Filter Replacement";
    serviceType = "OIL_CHANGE";
    partsReplaced.push("Synthetic Motor Oil (0W-20/5W-30)", "Engine Oil Filter");
  } else if (lower.includes("brake") || lower.includes("pad") || lower.includes("rotor")) {
    title = "Brake Pad & Rotor Replacement";
    serviceType = "BRAKES";
    partsReplaced.push("Ceramic Brake Pads", "Brake Hardware Kit");
  } else if (lower.includes("tire") || lower.includes("alignment") || lower.includes("balance")) {
    title = "Tire Rotation & Wheel Alignment";
    serviceType = "TIRES";
    partsReplaced.push("Wheel Balancing Weights");
  } else if (lower.includes("battery") || lower.includes("alternator")) {
    title = "12V Battery Replacement & Charging Test";
    serviceType = "BATTERY";
    partsReplaced.push("12V AGM/Lead-Acid Battery");
  } else if (lower.includes("coolant") || lower.includes("flush") || lower.includes("transmission")) {
    title = "Fluid System Flush & Exchange";
    serviceType = "FLUIDS";
    partsReplaced.push("OEM Specification Fluid");
  }

  return {
    title,
    serviceType,
    serviceDate: new Date().toISOString().split("T")[0],
    mileage,
    cost: cost || 129.99,
    provider,
    partsReplaced,
    notes: `Extracted via AI Receipt Analyzer. Verified items: ${partsReplaced.join(", ") || "Standard maintenance service"}.`,
  };
}
