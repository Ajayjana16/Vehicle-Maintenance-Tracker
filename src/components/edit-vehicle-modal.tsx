"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, AlertTriangle, Loader2, CheckCircle2, Bike, Car } from "lucide-react";
import { VehicleWithRelations } from "@/types";
import { useVehicleSummaries } from "@/components/vehicle-summary-provider";
import { apiFetch } from "@/lib/api-client";
import VehicleImageView from "@/components/vehicle-image-view";
import { getVerifiedVehicleImage, isValidImageUrl } from "@/lib/vehicle-image";

interface EditVehicleModalProps {
  vehicle: VehicleWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onVehicleUpdated: () => void;
}

export default function EditVehicleModal({
  vehicle,
  isOpen,
  onClose,
  onVehicleUpdated,
}: EditVehicleModalProps) {
  const { refresh } = useVehicleSummaries();
  const [vehicleType, setVehicleType] = useState<string>(vehicle.vehicleType || "CAR");
  const [name, setName] = useState(vehicle.name);
  const [make, setMake] = useState(vehicle.make);
  const [model, setModel] = useState(vehicle.model);
  const [year, setYear] = useState(vehicle.year);
  const [trim, setTrim] = useState(vehicle.trim || "");
  const [engineCc, setEngineCc] = useState<number | "">(vehicle.engineCc || "");
  const [driveType, setDriveType] = useState<string>(vehicle.driveType || "CHAIN");
  const [coolingType, setCoolingType] = useState<string>(vehicle.coolingType || "LIQUID");
  const [mileage, setMileage] = useState(vehicle.mileage);
  const [avgDailyMiles, setAvgDailyMiles] = useState(vehicle.avgDailyMiles || 30);
  const [fuelType, setFuelType] = useState(vehicle.fuelType);
  const [transmission, setTransmission] = useState(vehicle.transmission || "AUTOMATIC");
  const [vin, setVin] = useState(vehicle.vin || "");
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || "");
  const [imageUrl, setImageUrl] = useState(vehicle.imageUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced preview resolution
  const [isResolvingPreview, setIsResolvingPreview] = useState(false);
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string | null>(vehicle.imageUrl || null);

  const isMotorcycle = vehicleType === "MOTORCYCLE";
  const isScooter = vehicleType === "SCOOTER";
  const isTwoWheeler = isMotorcycle || isScooter;
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
    if (!name || !make || !model || !year) {
      setError("Please fill out vehicle nickname, make, model, and year.");
      return;
    }

    if (imageUrl.trim() && !isValidImageUrl(imageUrl.trim())) {
      setError("Please provide a valid http:// or https:// image URL or leave the field blank.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiFetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
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

      await refresh().catch(() => undefined);
      onVehicleUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to update vehicle";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-white/[0.1] bg-[#0f1215] p-6 shadow-2xl my-8">
        <button
          onClick={onClose}
          aria-label="Close edit vehicle dialog"
          className="absolute top-4 right-4 rounded p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {isTwoWheeler ? <Bike className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Edit Vehicle Details</h2>
            <p className="text-xs text-slate-400">
              Update odometer reading, specs, and vehicle classification.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* VEHICLE TYPE SELECTOR */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Vehicle Type
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { type: "CAR", label: "Car" },
                { type: "SUV", label: "SUV" },
                { type: "MOTORCYCLE", label: "Bike" },
                { type: "SCOOTER", label: "Scooter" },
                { type: "VAN", label: "Van" },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVehicleType(type)}
                  className={`py-1.5 px-2 rounded border text-center text-[10px] font-medium transition-all ${
                    vehicleType === type
                      ? "border-amber-400 bg-amber-400/20 text-white font-bold"
                      : "border-white/[0.08] bg-[#090c0f] text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Vehicle Nickname *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="field-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Powertrain
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="field-input"
              >
                <option value="GASOLINE">Gasoline / Petrol</option>
                <option value="ELECTRIC">Electric (EV)</option>
                {!isTwoWheeler && <option value="HYBRID">Hybrid (HEV/PHEV)</option>}
                {!isTwoWheeler && <option value="DIESEL">Diesel</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Year
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
                Make
              </label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
                className="field-input"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="field-input"
              />
            </div>
          </div>

          {/* TWO-WHEELER SPECIFIC EDIT FIELDS */}
          {isTwoWheeler && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-white/[0.06] bg-[#090c0f] p-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Engine CC
                </label>
                <input
                  type="number"
                  placeholder="e.g. 155, 350"
                  value={engineCc}
                  onChange={(e) => setEngineCc(e.target.value ? Number(e.target.value) : "")}
                  className="field-input font-mono"
                />
              </div>

              {isMotorcycle && (
                <>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Final Drive
                    </label>
                    <select
                      value={driveType}
                      onChange={(e) => setDriveType(e.target.value)}
                      className="field-input"
                    >
                      <option value="CHAIN">Drive Chain</option>
                      <option value="BELT">Belt Drive</option>
                      <option value="SHAFT">Shaft Drive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Cooling
                    </label>
                    <select
                      value={coolingType}
                      onChange={(e) => setCoolingType(e.target.value)}
                      className="field-input"
                    >
                      <option value="LIQUID">Liquid-Cooled</option>
                      <option value="AIR">Air-Cooled</option>
                      <option value="OIL">Oil-Cooled</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Trim / Variant
              </label>
              <input
                type="text"
                value={trim}
                onChange={(e) => setTrim(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Odometer (mi/km) *
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
                Avg Daily (mi/km)
              </label>
              <input
                type="number"
                value={avgDailyMiles}
                onChange={(e) => setAvgDailyMiles(Number(e.target.value))}
                className="field-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {isTwoWheeler ? "Frame / VIN No." : "VIN (17 characters)"}
              </label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                className="field-input font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                License / Registration
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
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
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/images/vehicle.jpg"
                className={`field-input ${urlError ? "border-red-500/50 focus:border-red-500" : ""}`}
              />
              {urlError ? (
                <p className="text-[10px] text-red-400 flex items-center gap-1 font-mono">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>{urlError}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 font-mono">
                  Leave blank to automatically use verified exact-model photography from catalog.
                </p>
              )}
            </div>

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
              {loading ? "Updating..." : "Save Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
