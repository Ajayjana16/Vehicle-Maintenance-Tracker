"use client";

import React, { useState, useEffect } from "react";
import { X, Car, Bike, Sparkles, AlertTriangle, Check, Loader2, CheckCircle2 } from "lucide-react";
import { useVehicleSummaries } from "@/components/vehicle-summary-provider";
import { apiFetch } from "@/lib/api-client";
import VehicleImageView from "@/components/vehicle-image-view";
import { getVerifiedVehicleImage, isValidImageUrl } from "@/lib/vehicle-image";

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleAdded: () => void;
}

export default function AddVehicleModal({
  isOpen,
  onClose,
  onVehicleAdded,
}: AddVehicleModalProps) {
  const { refresh } = useVehicleSummaries();
  const [vehicleType, setVehicleType] = useState<string>("CAR");
  const [name, setName] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [trim, setTrim] = useState("");
  const [engineCc, setEngineCc] = useState<number | "">("");
  const [driveType, setDriveType] = useState<string>("CHAIN");
  const [coolingType, setCoolingType] = useState<string>("LIQUID");
  const [mileage, setMileage] = useState(0);
  const [avgDailyMiles, setAvgDailyMiles] = useState(30);
  const [fuelType, setFuelType] = useState("GASOLINE");
  const [transmission, setTransmission] = useState("AUTOMATIC");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "adding" | "finding" | "added">("idle");
  const [error, setError] = useState<string | null>(null);

  // Debounced photo preview resolution
  const [isResolvingPreview, setIsResolvingPreview] = useState(false);
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string | null>(null);

  const isMotorcycle = vehicleType === "MOTORCYCLE";
  const isScooter = vehicleType === "SCOOTER";
  const isTwoWheeler = isMotorcycle || isScooter;

  // Adjust defaults on vehicleType change
  useEffect(() => {
    if (vehicleType === "MOTORCYCLE") {
      setTransmission("MANUAL");
      setDriveType("CHAIN");
      setAvgDailyMiles(20);
    } else if (vehicleType === "SCOOTER") {
      setTransmission("CVT");
      setDriveType("CVT");
      setAvgDailyMiles(15);
    } else {
      setTransmission(fuelType === "ELECTRIC" ? "DIRECT_DRIVE" : "AUTOMATIC");
      setDriveType("FWD");
      setAvgDailyMiles(30);
    }
  }, [vehicleType, fuelType]);

  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    setUrlError(null);
    const trimmedInput = imageUrl.trim();

    if (trimmedInput) {
      if (!isValidImageUrl(trimmedInput)) {
        setUrlError("Invalid URL format. Please provide a valid http:// or https:// image link.");
        setResolvedPreviewUrl(null);
        setIsResolvingPreview(false);
        return;
      }
      setResolvedPreviewUrl(trimmedInput);
      setIsResolvingPreview(false);
      return;
    }

    if (!make.trim() || !model.trim()) {
      setResolvedPreviewUrl(null);
      setIsResolvingPreview(false);
      return;
    }

    setIsResolvingPreview(true);
    setResolvedPreviewUrl(null);

    const timer = setTimeout(() => {
      const match = getVerifiedVehicleImage({
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        trim: trim.trim() || null,
        vehicleType,
        fuelType,
      });
      setResolvedPreviewUrl(match);
      setIsResolvingPreview(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [make, model, year, trim, vehicleType, fuelType, imageUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !make.trim() || !model.trim() || !year) {
      setError("Please fill out vehicle nickname, make, model, and year.");
      return;
    }

    if (imageUrl.trim() && !isValidImageUrl(imageUrl.trim())) {
      setError("Please provide a valid http:// or https:// image URL or leave the field blank.");
      return;
    }

    setLoading(true);
    setSubmitStatus("adding");
    setError(null);
    const imageLookupTimer = window.setTimeout(() => setSubmitStatus("finding"), 350);

    try {
      await apiFetch("/api/vehicles", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          make: make.trim(),
          model: model.trim(),
          year: Number(year),
          trim: trim.trim() || null,
          vehicleType,
          mileage: Number(mileage),
          avgDailyMiles: Number(avgDailyMiles),
          fuelType,
          transmission,
          engineCc: engineCc ? Number(engineCc) : null,
          driveType: isTwoWheeler ? driveType : null,
          coolingType: isMotorcycle ? coolingType : null,
          vin: vin.trim() || null,
          licensePlate: licensePlate.trim() || null,
          imageUrl: imageUrl.trim() || null,
        }),
      });

      window.clearTimeout(imageLookupTimer);
      setSubmitStatus("added");
      await refresh().catch(() => undefined);
      onVehicleAdded();
      window.setTimeout(onClose, 600);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create vehicle");
      window.clearTimeout(imageLookupTimer);
      setSubmitStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  const hasVehicleSpecs = make.trim() && model.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-xl border border-white/[0.1] bg-[#0f1215] p-6 shadow-2xl my-8">
        <button
          onClick={onClose}
          aria-label="Close add vehicle dialog"
          className="absolute top-4 right-4 rounded p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {isTwoWheeler ? <Bike className="h-5 w-5" /> : <Car className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Add Vehicle</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Registers personal cars, SUVs, motorcycles, and scooters with tailored maintenance intervals.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* VEHICLE TYPE SELECTOR (CRITICAL) */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
              1. Select Vehicle Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { type: "CAR", label: "Car", icon: Car },
                { type: "SUV", label: "SUV / CUV", icon: Car },
                { type: "MOTORCYCLE", label: "Motorcycle / Bike", icon: Bike },
                { type: "SCOOTER", label: "Scooter", icon: Bike },
                { type: "VAN", label: "Van", icon: Car },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVehicleType(type)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-md border text-center transition-all ${
                    vehicleType === type
                      ? "border-amber-400 bg-amber-400/15 text-white font-bold"
                      : "border-white/[0.08] bg-[#090c0f] text-slate-400 hover:text-white hover:border-white/[0.2]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {isMotorcycle ? "Bike Nickname *" : isScooter ? "Scooter Nickname *" : "Vehicle Nickname *"}
              </label>
              <input
                type="text"
                placeholder={isMotorcycle ? "e.g. Weekend Beast, Commuter R15" : isScooter ? "e.g. Daily Activa, City Scoot" : "e.g. Daily Driver, Family SUV"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="field-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Fuel / Powertrain
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="field-input"
              >
                <option value="GASOLINE">Gasoline / Petrol</option>
                <option value="ELECTRIC">Full Electric (EV)</option>
                {!isTwoWheeler && <option value="HYBRID">Hybrid (HEV/PHEV)</option>}
                {!isTwoWheeler && <option value="DIESEL">Diesel</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Year *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                className="field-input font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Make *
              </label>
              <input
                type="text"
                placeholder={isMotorcycle ? "e.g. Yamaha, Royal Enfield" : isScooter ? "e.g. Honda, TVS, Vespa" : "e.g. Toyota, Tesla"}
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
                className="field-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Model *
              </label>
              <input
                type="text"
                placeholder={isMotorcycle ? "e.g. R15 V4, Classic 350" : isScooter ? "e.g. Activa 6G, 450X" : "e.g. RAV4, Model 3"}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="field-input"
              />
            </div>
          </div>

          {/* TWO-WHEELER SPECIFIC FIELDS */}
          {isTwoWheeler ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-white/[0.06] bg-[#090c0f] p-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Engine Displacement (CC)
                </label>
                <input
                  type="number"
                  placeholder={isMotorcycle ? "e.g. 155, 350, 650" : "e.g. 110, 125"}
                  value={engineCc}
                  onChange={(e) => setEngineCc(e.target.value ? Number(e.target.value) : "")}
                  className="field-input font-mono"
                />
              </div>

              {isMotorcycle && (
                <>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Final Drive Type
                    </label>
                    <select
                      value={driveType}
                      onChange={(e) => setDriveType(e.target.value)}
                      className="field-input"
                    >
                      <option value="CHAIN">Drive Chain & Sprocket</option>
                      <option value="BELT">Belt Drive (Cruiser)</option>
                      <option value="SHAFT">Shaft Drive (Tourer/BMW)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Cooling System
                    </label>
                    <select
                      value={coolingType}
                      onChange={(e) => setCoolingType(e.target.value)}
                      className="field-input"
                    >
                      <option value="LIQUID">Liquid-Cooled (Radiator)</option>
                      <option value="AIR">Air-Cooled (Fins)</option>
                      <option value="OIL">Oil-Cooled</option>
                    </select>
                  </div>
                </>
              )}

              {isScooter && (
                <>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Transmission
                    </label>
                    <input
                      type="text"
                      value={fuelType === "ELECTRIC" ? "Direct Drive Hub" : "Continuous Variable (CVT)"}
                      readOnly
                      className="field-input text-slate-400 bg-white/[0.02]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Brake Configuration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Front Disc / Rear Drum CBS"
                      value={trim}
                      onChange={(e) => setTrim(e.target.value)}
                      className="field-input"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Trim / Edition (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. XSE AWD, Long Range"
                  value={trim}
                  onChange={(e) => setTrim(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Transmission
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="field-input"
                >
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="MANUAL">Manual</option>
                  <option value="CVT">CVT</option>
                  <option value="DIRECT_DRIVE">Direct Drive (EV)</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Current Odometer *
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
                Avg Distance / Day (mi/km)
              </label>
              <input
                type="number"
                value={avgDailyMiles}
                onChange={(e) => setAvgDailyMiles(Number(e.target.value))}
                className="field-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Registration / License Plate
              </label>
              <input
                type="text"
                placeholder={isTwoWheeler ? "e.g. MH12AB1234, DL3S9999" : "e.g. 7XYZ942"}
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                className="field-input font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {isTwoWheeler ? "Chassis / Frame No. (Optional)" : "VIN (Optional)"}
              </label>
              <input
                type="text"
                placeholder={isTwoWheeler ? "Frame / VIN Number" : "17-character VIN"}
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                className="field-input font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Vehicle Photo (Optional)
            </label>
            <div className="space-y-1">
              <input
                type="url"
                placeholder="https://example.com/images/vehicle.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={`field-input ${urlError ? "border-red-500/50 focus:border-red-500" : ""}`}
              />
              {urlError ? (
                <p className="text-[10px] text-red-400 flex items-center gap-1 font-mono">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>{urlError}</span>
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                  Leave blank to auto-resolve exact {isMotorcycle ? "motorcycle" : isScooter ? "scooter" : "vehicle"} photo from catalog.
                </p>
              )}
            </div>

            {hasVehicleSpecs || imageUrl ? (
              <div className="mt-3 rounded-lg border border-white/[0.08] overflow-hidden bg-[#080b0e] p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Photography Preview</span>
                  </p>
                  {isResolvingPreview ? (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400/80 font-mono">
                      <Loader2 className="h-3 w-3 animate-spin" /> Resolving vehicle photo...
                    </span>
                  ) : imageUrl.trim() && !urlError ? (
                    <span className="flex items-center gap-1 text-[10px] text-sky-400 font-mono">
                      <CheckCircle2 className="h-3 w-3" /> Custom Image URL
                    </span>
                  ) : resolvedPreviewUrl ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <CheckCircle2 className="h-3 w-3" /> Exact Model Match
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Photo Unavailable (Neutral Silhouette)
                    </span>
                  )}
                </div>

                <div className="relative h-32 w-full rounded overflow-hidden">
                  {isResolvingPreview ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0d1014] text-slate-400 animate-pulse">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-400 mb-1" />
                      <span className="text-[10px] font-mono">Loading vehicle photo...</span>
                    </div>
                  ) : (
                    <VehicleImageView
                      src={resolvedPreviewUrl || undefined}
                      make={make}
                      model={model}
                      year={year}
                      trim={trim}
                      vehicleType={vehicleType}
                      fuelType={fuelType}
                      aspectRatio="cover"
                    />
                  )}
                </div>
              </div>
            ) : null}
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
              {submitStatus === "finding" ? (
                <span>Resolving vehicle image...</span>
              ) : submitStatus === "added" ? (
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Added to Garage
                </span>
              ) : submitStatus === "adding" ? (
                <span>Adding vehicle...</span>
              ) : (
                <span>Add Vehicle</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
