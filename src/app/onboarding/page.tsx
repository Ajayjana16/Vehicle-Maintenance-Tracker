"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Cpu,
  Check,
  Activity,
} from "lucide-react";
import OnboardingStepper from "@/components/onboarding-stepper";
import { useAuth } from "@/components/auth-context";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 2: Vehicle state
  const [vehicleName, setVehicleName] = useState("Daily Driver");
  const [vehicleMake, setVehicleMake] = useState("Tesla");
  const [vehicleModel, setVehicleModel] = useState("Model 3");
  const [vehicleYear, setVehicleYear] = useState("2023");
  const [vehicleTrim, setVehicleTrim] = useState("Long Range AWD");
  const [vehicleVin, setVehicleVin] = useState("5YJ3E1EB8PF184920");
  const [vehiclePlate, setVehiclePlate] = useState("7XYZ942");
  const [vehicleMileage, setVehicleMileage] = useState("24500");
  const [vehicleFuelType, setVehicleFuelType] = useState("ELECTRIC");

  // Step 3: Telemetry & Scan state
  const [telemetryProtocol, setTelemetryProtocol] = useState("OBD2_CAN");
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // Sync initial step with user's saved onboardingStep
  useEffect(() => {
    if (user?.onboardingStep && user.onboardingStep <= 3) {
      setCurrentStep(user.onboardingStep);
    }
  }, [user]);

  const saveStepProgress = async (step: number) => {
    try {
      await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });
    } catch {
      // non-blocking
    }
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      const next = currentStep + 1;
      setCurrentStep(next);
      await saveStepProgress(next);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // STEP 2: Save Vehicle
  const handleSaveVehicle = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_vehicle",
          data: {
            name: vehicleName,
            make: vehicleMake,
            model: vehicleModel,
            year: vehicleYear,
            trim: vehicleTrim,
            vin: vehicleVin,
            licensePlate: vehiclePlate,
            mileage: vehicleMileage,
            fuelType: vehicleFuelType,
          },
        }),
      });
      if (res.ok) {
        setSuccessMsg("Vehicle added to your garage!");
        setTimeout(() => {
          setSuccessMsg(null);
          setCurrentStep(3);
        }, 600);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Run Baseline Scan & Finish Setup
  const handleRunInitialScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanComplete(true);
    }, 1500);
  };

  const handleFinishOnboarding = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      if (res.ok) {
        await refreshUser();
        router.push("/");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090b] flex flex-col justify-between text-[#f0f4f8] select-none">
      {/* Top Bar */}
      <header className="border-b border-white/[0.08] bg-[#090b0d]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400">
            <Car className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold tracking-tight text-white block leading-none">
              AUTOPULSE
            </span>
            <span className="text-[9px] font-mono text-amber-400/80 uppercase tracking-wider">
              Vehicle Health & Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Skip to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Stepper Component */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0f13] p-4 sm:p-6 shadow-xl">
          <OnboardingStepper currentStep={currentStep} onSelectStep={setCurrentStep} />
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step Cards */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0f13] p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Step 1 of 3 · Personal Vehicle Health
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Welcome to AutoPulse{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-xs text-slate-400">
                  Your intelligent automotive companion for vehicle health, early fault detection, and predictive maintenance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-lg bg-[#080b0e] border border-white/[0.06] space-y-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <p className="font-bold text-white">Live Health Score</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Understand overall vehicle condition on a clear 0–100 scale with real subsystem breakdowns.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#080b0e] border border-white/[0.06] space-y-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <p className="font-bold text-white">Smart Diagnostics</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Translate cryptic OBD-II fault codes into plain English with clear safe-to-drive advice.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#080b0e] border border-white/[0.06] space-y-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <p className="font-bold text-white">Predictive Wear</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Anticipate brake pad wear, oil life, and battery health before issues become costly repairs.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div />
                <button
                  onClick={handleNext}
                  className="action-primary py-2.5 px-5 text-xs font-bold rounded-md flex items-center gap-2"
                >
                  <span>Set Up My First Vehicle</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ADD VEHICLE */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Step 2 of 3 · Vehicle Profile
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Add your vehicle
                </h1>
                <p className="text-xs text-slate-400">
                  Enter your vehicle specs to initialize factory maintenance schedules and component health tracking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Vehicle Nickname</label>
                  <input
                    type="text"
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    placeholder="e.g. Daily Driver, My Model 3"
                    className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Powertrain / Fuel Type</label>
                  <select
                    value={vehicleFuelType}
                    onChange={(e) => setVehicleFuelType(e.target.value)}
                    className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="ELECTRIC">Battery Electric (BEV)</option>
                    <option value="HYBRID">Hybrid Electric (HEV / PHEV)</option>
                    <option value="GASOLINE">Gasoline (ICE)</option>
                    <option value="DIESEL">Diesel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Make *</label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="e.g. Tesla, Toyota, Ford"
                    className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Model *</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. Model 3, RAV4, F-150"
                    className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Year *</label>
                    <input
                      type="number"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Trim / Package</label>
                    <input
                      type="text"
                      value={vehicleTrim}
                      onChange={(e) => setVehicleTrim(e.target.value)}
                      placeholder="e.g. Long Range"
                      className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Current Odometer (mi) *</label>
                    <input
                      type="number"
                      value={vehicleMileage}
                      onChange={(e) => setVehicleMileage(e.target.value)}
                      className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">License Plate</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="e.g. 7XYZ942"
                      className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold">VIN (Vehicle Identification Number)</label>
                  <input
                    type="text"
                    value={vehicleVin}
                    onChange={(e) => setVehicleVin(e.target.value)}
                    placeholder="17-digit VIN"
                    className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={handleBack}
                  className="action-secondary py-2 px-3 text-xs font-semibold rounded-md flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveVehicle}
                  disabled={loading || !vehicleMake || !vehicleModel}
                  className="action-primary py-2 px-4 text-xs font-bold rounded-md flex items-center gap-2 disabled:opacity-60"
                >
                  <span>{loading ? "Adding Vehicle..." : "Save Vehicle & Continue"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INITIAL HEALTH SCAN */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Step 3 of 3 · Telemetry & Baseline Scan
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Connect telemetry & run baseline health scan
                </h1>
                <p className="text-xs text-slate-400">
                  Select your telemetry stream to ingest real-time OBD-II sensors and initialize your vehicle dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  {
                    id: "OBD2_CAN",
                    title: "Standard OBD-II Scanner",
                    desc: "Bluetooth / Wi-Fi OBD-II dongle (ELM327 / OBDLink). Instant DTC codes and sensor diagnostics.",
                  },
                  {
                    id: "OEM_CLOUD",
                    title: "OEM Connected Vehicle API",
                    desc: "Direct digital bridge for Tesla, FordPass, Toyota Connected, and GM OnStar.",
                  },
                  {
                    id: "SIMULATED",
                    title: "Continuous Health Stream",
                    desc: "Live simulated stream for speed, battery/fuel, tire pressures, and subsystem metrics.",
                  },
                ].map((proto) => (
                  <button
                    key={proto.id}
                    type="button"
                    onClick={() => setTelemetryProtocol(proto.id)}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      telemetryProtocol === proto.id
                        ? "border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/40"
                        : "border-white/[0.06] bg-[#080b0e] hover:border-white/[0.15]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-white">{proto.title}</p>
                      {telemetryProtocol === proto.id && (
                        <Check className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{proto.desc}</p>
                  </button>
                ))}
              </div>

              {/* Baseline Scan Widget */}
              <div className="p-4 rounded-lg bg-[#080b0e] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-white">Baseline Health Scan</span>
                  </div>
                  {scanComplete && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-3 w-3" /> Baseline Health: 92/100 (Nominal)
                    </span>
                  )}
                </div>

                {!scanComplete ? (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-400">
                      Run a quick multi-point scan to verify powertrain, electrical, and braking parameters.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunInitialScan}
                      disabled={scanning}
                      className="action-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Cpu className={`h-3.5 w-3.5 ${scanning ? "animate-spin text-amber-400" : ""}`} />
                      <span>{scanning ? "Scanning Subsystems..." : "Run Baseline Scan"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px] text-slate-300">
                    <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-500 block">Powertrain</span>
                      <span className="text-emerald-400 font-bold">● Nominal</span>
                    </div>
                    <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-500 block">Braking</span>
                      <span className="text-emerald-400 font-bold">● Nominal</span>
                    </div>
                    <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-500 block">Electrical</span>
                      <span className="text-emerald-400 font-bold">● Nominal</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={handleBack}
                  className="action-secondary py-2 px-3 text-xs font-semibold rounded-md flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  disabled={loading}
                  className="action-primary py-2 px-5 text-xs font-bold rounded-md flex items-center gap-2"
                >
                  <span>{loading ? "Initializing Dashboard..." : "Go to Dashboard"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-600 font-mono border-t border-white/[0.04]">
        AutoPulse Vehicle Health Intelligence · Personal Companion
      </footer>
    </div>
  );
}
