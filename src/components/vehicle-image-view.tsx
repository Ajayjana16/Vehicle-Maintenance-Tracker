"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Car, Zap, Bike } from "lucide-react";
import {
  getVerifiedVehicleImage,
  getVehicleAccessibleAltText,
  isImageValidForVehicle,
  isValidImageUrl,
} from "@/lib/vehicle-image";

interface VehicleImageViewProps {
  src?: string | null;
  alt?: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  trim?: string | null;
  vehicleType?: string | null;
  fuelType?: string | null;
  className?: string;
  aspectRatio?: "video" | "wide" | "square" | "cover";
  priority?: boolean;
  compact?: boolean;
}

function canUseNextImage(source: string): boolean {
  try {
    const parsed = new URL(source);
    return [
      "images.unsplash.com",
      "upload.wikimedia.org",
      "commons.wikimedia.org",
      "thumb.wikimedia.org",
    ].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export default function VehicleImageView({
  src,
  alt,
  make,
  model,
  year,
  trim,
  vehicleType,
  fuelType = "GASOLINE",
  className = "",
  aspectRatio = "video",
  priority = false,
  compact = false,
}: VehicleImageViewProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isEV = fuelType === "ELECTRIC";
  const isTwoWheeler = vehicleType === "MOTORCYCLE" || vehicleType === "SCOOTER";

  // Compute accessible alt text
  const vehicleDescriptor = [year, make, model, trim].filter(Boolean).join(" ");
  const computedAlt =
    alt && !["car", "vehicle", "image"].includes(alt.trim().toLowerCase())
      ? alt
      : getVehicleAccessibleAltText({ make, model, year, trim, fuelType, vehicleType });

  // Aspect ratio class mapping
  const aspectClass =
    aspectRatio === "video"
      ? "aspect-[16/9]"
      : aspectRatio === "wide"
      ? "aspect-[21/9]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "h-full w-full";

  // Check verified catalog as secondary source if src is not provided
  const resolvedCatalogImage =
    make && model
      ? getVerifiedVehicleImage({ make, model, year, trim, fuelType, vehicleType })
      : null;

  // Active source resolution - strictly URL-based, never falls back to an unrelated car
  const activeSrc =
    !hasError && src && isValidImageUrl(src)
      ? src
      : !hasError && resolvedCatalogImage
      ? resolvedCatalogImage
      : null;

  const useNext = activeSrc ? canUseNextImage(activeSrc) : false;

  return (
    <div
      className={`relative overflow-hidden bg-[#080a0c] select-none ${aspectClass} ${className}`}
    >
      {activeSrc ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-[#0d1014] animate-pulse flex items-center justify-center z-10">
              {isTwoWheeler ? (
                <Bike className="h-6 w-6 text-slate-700 animate-pulse" />
              ) : (
                <Car className="h-6 w-6 text-slate-700 animate-pulse" />
              )}
            </div>
          )}

          {useNext ? (
            <Image
              src={activeSrc}
              alt={computedAlt}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className={`object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.03] ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={activeSrc}
              alt={computedAlt}
              loading="lazy"
              decoding="async"
              className={`h-full w-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.03] ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
            />
          )}
        </>
      ) : compact ? (
        /* Streamlined compact placeholder for tables and small avatars */
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#12161c] to-[#0a0d10]">
          {isTwoWheeler ? (
            <Bike className="h-4 w-4 text-amber-400/70" />
          ) : isEV ? (
            <Zap className="h-4 w-4 text-sky-400/70" />
          ) : (
            <Car className="h-4 w-4 text-slate-400/70" />
          )}
        </div>
      ) : (
        /* Clean technical neutral placeholder */
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-slate-500 bg-gradient-to-b from-[#0e1216] to-[#07090b] border border-white/[0.04]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
            {isTwoWheeler ? (
              <Bike className="h-5 w-5 text-amber-400/80" />
            ) : isEV ? (
              <Zap className="h-5 w-5 text-amber-400/80" />
            ) : (
              <Car className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-300">
            Vehicle photo unavailable
          </p>
          {vehicleDescriptor ? (
            <p className="mt-0.5 text-[10px] font-mono tracking-wider text-slate-500 uppercase truncate max-w-[90%]">
              {vehicleDescriptor}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
