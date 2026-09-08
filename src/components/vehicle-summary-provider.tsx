"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { VehicleSummary } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/components/auth-context";

interface VehicleSummaryContextValue {
  vehicles: VehicleSummary[];
  loading: boolean;
  error: string | null;
  ensureLoaded: () => Promise<VehicleSummary[]>;
  refresh: () => Promise<VehicleSummary[]>;
  setBulkVehicles: (vehicles: VehicleSummary[]) => void;
  update: (vehicle: VehicleSummary) => void;
  remove: (vehicleId: string) => void;
}

const VehicleSummaryContext = createContext<VehicleSummaryContextValue | null>(null);

export function VehicleSummaryProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const requestRef = useRef<Promise<VehicleSummary[]> | null>(null);
  const vehiclesRef = useRef<VehicleSummary[]>([]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setVehicles([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<VehicleSummary[]>("/api/vehicles?summary=true");
      const nextVehicles = Array.isArray(data) ? data : [];
      vehiclesRef.current = nextVehicles;
      setVehicles(nextVehicles);
      loadedRef.current = true;
      return nextVehicles;
    } catch (requestError) {
      console.error("Failed to load vehicle summaries:", requestError);
      const message = requestError instanceof Error ? requestError.message : "Failed to load vehicles";
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const ensureLoaded = useCallback(() => {
    if (loadedRef.current && vehiclesRef.current.length > 0) return Promise.resolve(vehiclesRef.current);
    if (!requestRef.current) {
      requestRef.current = refresh().finally(() => {
        requestRef.current = null;
      });
    }
    return requestRef.current;
  }, [refresh]);

  const setBulkVehicles = useCallback((newVehicles: VehicleSummary[]) => {
    const list = Array.isArray(newVehicles) ? newVehicles : [];
    vehiclesRef.current = list;
    setVehicles(list);
    loadedRef.current = true;
    setLoading(false);
  }, []);

  const update = useCallback((vehicle: VehicleSummary) => {
    setVehicles((current) => {
      const exists = current.some((item) => item.id === vehicle.id);
      const nextVehicles = exists
        ? current.map((item) => (item.id === vehicle.id ? { ...item, ...vehicle } : item))
        : [vehicle, ...current];
      vehiclesRef.current = nextVehicles;
      return nextVehicles;
    });
  }, []);

  const remove = useCallback((vehicleId: string) => {
    setVehicles((current) => {
      const nextVehicles = current.filter((vehicle) => vehicle.id !== vehicleId);
      vehiclesRef.current = nextVehicles;
      return nextVehicles;
    });
  }, []);

  return (
    <VehicleSummaryContext.Provider value={{ vehicles, loading, error, ensureLoaded, refresh, setBulkVehicles, update, remove }}>
      {children}
    </VehicleSummaryContext.Provider>
  );
}

export function useVehicleSummaries() {
  const context = useContext(VehicleSummaryContext);
  if (!context) {
    throw new Error("useVehicleSummaries must be used inside VehicleSummaryProvider");
  }
  return context;
}
