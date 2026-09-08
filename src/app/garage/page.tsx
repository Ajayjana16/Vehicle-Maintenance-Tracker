"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Car,
  Bike,
  ChevronRight,
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  Cpu,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
  CheckCircle2,
  Zap,
  Gauge,
  SlidersHorizontal,
  X,
  Fuel,
  Activity,
} from "lucide-react";
import { VehicleWithRelations } from "@/types";
import VehicleCard from "@/components/vehicle-card";
import VehicleImageView from "@/components/vehicle-image-view";
import AddVehicleModal from "@/components/add-vehicle-modal";
import AddServiceModal from "@/components/add-service-modal";
import ObdScannerModal from "@/components/obd-scanner-modal";
import EmptyState from "@/components/empty-state";
import RequestError from "@/components/request-error";
import { useVehicleSummaries } from "@/components/vehicle-summary-provider";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/components/auth-context";

// In-memory client cache to eliminate redundant refetches when navigating between tabs
let garageVehiclesCache: VehicleWithRelations[] | null = null;
let garageCacheTimestamp = 0;
const GARAGE_CACHE_TTL = 30000; // 30 seconds fresh cache

export default function GaragePage() {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleWithRelations[]>(() => garageVehiclesCache || []);
  const [loading, setLoading] = useState<boolean>(() => !garageVehiclesCache);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [healthFilter, setHealthFilter] = useState("ALL");
  const [fuelFilter, setFuelFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<string>("health-desc");

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [targetVehicleId, setTargetVehicleId] = useState("");

  const { refresh, remove, setBulkVehicles } = useVehicleSummaries();

  const loadVehicles = useCallback(async (forceRefresh = false) => {
    // If we have cached data and it's not a forced refresh, use cache first
    const isCacheValid = garageVehiclesCache && (Date.now() - garageCacheTimestamp < GARAGE_CACHE_TTL);
    if (isCacheValid && !forceRefresh) {
      setVehicles(garageVehiclesCache!);
      setLoading(false);
      return;
    }

    if (!garageVehiclesCache) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await apiFetch<VehicleWithRelations[]>("/api/vehicles", { timeoutMs: 8000 });
      if (Array.isArray(data)) {
        garageVehiclesCache = data;
        garageCacheTimestamp = Date.now();
        setVehicles(data);
        setBulkVehicles(data);
      }
    } catch (err) {
      console.error("Failed to load vehicles:", err);
      const message = err instanceof Error ? err.message : "Unable to load vehicles";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setBulkVehicles]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const totalMileage = useMemo(
    () => vehicles.reduce((sum, v) => sum + v.mileage, 0),
    [vehicles]
  );

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        const text = `${v.year} ${v.make} ${v.model} ${v.name} ${v.vehicleType || ""} ${v.engineCc || ""} ${v.vin || ""} ${v.licensePlate || ""}`.toLowerCase();
        const matchesSearch = text.includes(searchQuery.toLowerCase());

        let matchesType = true;
        if (typeFilter === "CAR") matchesType = v.vehicleType === "CAR";
        if (typeFilter === "SUV") matchesType = v.vehicleType === "SUV";
        if (typeFilter === "MOTORCYCLE") matchesType = v.vehicleType === "MOTORCYCLE";
        if (typeFilter === "SCOOTER") matchesType = v.vehicleType === "SCOOTER";
        if (typeFilter === "VAN") matchesType = v.vehicleType === "VAN";
        if (typeFilter === "EV") matchesType = v.fuelType === "ELECTRIC";
        if (typeFilter === "HYBRID") matchesType = v.fuelType === "HYBRID";

        let matchesHealth = true;
        if (healthFilter === "HEALTHY") matchesHealth = v.healthScore >= 80;
        if (healthFilter === "ATTENTION") matchesHealth = v.healthScore >= 60 && v.healthScore < 80;
        if (healthFilter === "CRITICAL") matchesHealth = v.healthScore < 60;

        const matchesFuel = fuelFilter === "ALL" || v.fuelType === fuelFilter;

        return matchesSearch && matchesType && matchesHealth && matchesFuel;
      })
      .sort((a, b) => {
        if (sortBy === "health-desc") return b.healthScore - a.healthScore;
        if (sortBy === "health-asc") return a.healthScore - b.healthScore;
        if (sortBy === "mileage-desc") return b.mileage - a.mileage;
        if (sortBy === "mileage-asc") return a.mileage - b.mileage;
        if (sortBy === "year-desc") return b.year - a.year;
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [vehicles, searchQuery, typeFilter, healthFilter, fuelFilter, sortBy]);

  // Paginated Slice
  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedVehicles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedVehicles.map((v) => v.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDelete = async (id: string, displayName: string) => {
    if (!confirm(`Are you sure you want to remove ${displayName} from your garage?`)) {
      return;
    }

    try {
      await apiFetch(`/api/vehicles/${id}`, { method: "DELETE" });
      garageVehiclesCache = null;
      remove(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      await refresh().catch(() => undefined);
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
    }
  };

  const handleExportCSV = () => {
    const rowsToExport = selectedIds.size > 0
      ? vehicles.filter((v) => selectedIds.has(v.id))
      : filteredVehicles;

    const header = ["Vehicle Name", "Type", "Make", "Model", "Year", "Displacement/Engine", "VIN", "License Plate", "Health Score", "Mileage", "Fuel Type"].join(",");
    const rows = rowsToExport.map((v) =>
      [
        v.name,
        v.vehicleType || "CAR",
        v.make,
        v.model,
        v.year,
        v.engineCc ? `${v.engineCc} cc` : "N/A",
        v.vin || "N/A",
        v.licensePlate || "N/A",
        v.healthScore,
        v.mileage,
        v.fuelType,
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autopulse-my-vehicles-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Car className="h-3 w-3" /> My Garage
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono text-emerald-400">Live Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
            My Vehicles
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Personal garage fleet monitoring, OBD-II diagnostic trouble codes & predictive maintenance forecasting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadVehicles(true)}
            className="p-2 rounded-lg border border-white/[0.08] bg-[#0c0f13] text-slate-400 hover:text-white hover:border-white/[0.16] hover:bg-[#12161c] transition-all shadow-xs"
            title="Refresh Fleet Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="action-secondary py-2 px-3 text-xs flex items-center gap-2 rounded-lg"
            title="Export Vehicle Fleet to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="action-primary py-2 px-3.5 text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-amber-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </header>

      {/* Modern KPI Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Garage */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0f14] p-5 hover:border-amber-500/40 hover:bg-[#10141a] transition-all shadow-md group">
          <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-500/[0.08] blur-2xl pointer-events-none group-hover:bg-amber-500/[0.14] transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Registered Fleet
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm group-hover:scale-105 transition-transform">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-extrabold text-white tracking-tight leading-none">
              {vehicles.length}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20">
              Active {vehicles.length === 1 ? "Unit" : "Units"}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">Cars, bikes, SUVs & EVs</span>
            <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">Fleet Monitored</span>
          </div>
        </div>

        {/* Card 2: Cumulative Distance */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0f14] p-5 hover:border-sky-500/40 hover:bg-[#10141a] transition-all shadow-md group">
          <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-sky-500/[0.08] blur-2xl pointer-events-none group-hover:bg-sky-500/[0.14] transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Total Mileage
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shadow-sm group-hover:scale-105 transition-transform">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-sky-300 tracking-tight leading-none">
              {totalMileage.toLocaleString()}
            </span>
            <span className="text-xs font-mono font-bold text-sky-400 uppercase">mi</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">Cumulative garage distance</span>
            <span className="text-[10px] font-mono text-emerald-400/80 shrink-0 ml-1">● Odometer Synced</span>
          </div>
        </div>

        {/* Card 3: Optimal Health */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0f14] p-5 hover:border-emerald-500/40 hover:bg-[#10141a] transition-all shadow-md group">
          <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/[0.08] blur-2xl pointer-events-none group-hover:bg-emerald-500/[0.14] transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Optimal Health (≥80%)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-extrabold text-emerald-400 tracking-tight leading-none">
              {vehicles.filter((v) => v.healthScore >= 80).length}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
              of {vehicles.length} Nominal
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">All core systems verified</span>
            <span className="text-[10px] font-mono text-emerald-400 shrink-0 ml-1">Nominal</span>
          </div>
        </div>

        {/* Card 4: Attention Needed */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0f14] p-5 hover:border-amber-500/40 hover:bg-[#10141a] transition-all shadow-md group">
          <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-500/[0.08] blur-2xl pointer-events-none group-hover:bg-amber-500/[0.14] transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Needs Attention
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm group-hover:scale-105 transition-transform">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className={`font-mono text-3xl font-extrabold tracking-tight leading-none ${
              vehicles.filter((v) => v.healthScore < 80).length > 0 ? "text-amber-400" : "text-slate-300"
            }`}>
              {vehicles.filter((v) => v.healthScore < 80).length}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
              vehicles.filter((v) => v.healthScore < 80).length > 0
                ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
                : "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
            }`}>
              {vehicles.filter((v) => v.healthScore < 80).length > 0 ? "Action Needed" : "All Clear ✓"}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">Service due or active DTC</span>
            <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">Telemetry Monitor</span>
          </div>
        </div>
      </div>

      {/* Search, Multi-Filters, and Table Toolbar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 rounded-xl border border-white/[0.08] bg-[#0c0f13] p-3.5 shadow-xl">
        {/* Search */}
        <div className="relative flex items-center flex-1 max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by nickname, make, model, type, CC, license plate..."
            className="w-full rounded-lg border border-white/[0.08] bg-[#080b0e] pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 transition-colors focus:border-amber-400/80 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-white"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Vehicle Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-lg border border-white/[0.08] bg-[#080b0e] hover:border-white/[0.16] px-3 py-2 pr-7 text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:border-amber-400/80"
            >
              <option value="ALL">All Vehicle Types</option>
              <option value="CAR">Cars</option>
              <option value="SUV">SUVs</option>
              <option value="MOTORCYCLE">Bikes / Motorcycles</option>
              <option value="SCOOTER">Scooters</option>
              <option value="EV">Electric (EVs)</option>
              <option value="HYBRID">Hybrids</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 text-[10px]">
              ▼
            </div>
          </div>

          {/* Health Status Filter */}
          <div className="relative">
            <select
              value={healthFilter}
              onChange={(e) => {
                setHealthFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-lg border border-white/[0.08] bg-[#080b0e] hover:border-white/[0.16] px-3 py-2 pr-7 text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:border-amber-400/80"
            >
              <option value="ALL">All Health Scores</option>
              <option value="HEALTHY">Healthy (80–100%)</option>
              <option value="ATTENTION">Attention (60–79%)</option>
              <option value="CRITICAL">Critical (&lt;60%)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 text-[10px]">
              ▼
            </div>
          </div>

          {/* Powertrain Filter */}
          <div className="relative">
            <select
              value={fuelFilter}
              onChange={(e) => {
                setFuelFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-lg border border-white/[0.08] bg-[#080b0e] hover:border-white/[0.16] px-3 py-2 pr-7 text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:border-amber-400/80"
            >
              <option value="ALL">All Powertrains</option>
              <option value="ELECTRIC">Electric (BEV)</option>
              <option value="HYBRID">Hybrid (HEV)</option>
              <option value="GASOLINE">Gasoline / Petrol</option>
              <option value="DIESEL">Diesel</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 text-[10px]">
              ▼
            </div>
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-lg border border-white/[0.08] bg-[#080b0e] hover:border-white/[0.16] px-3 py-2 pr-7 text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:border-amber-400/80"
            >
              <option value="health-desc">Health: High to Low</option>
              <option value="health-asc">Health: Low to High</option>
              <option value="mileage-desc">Mileage: High to Low</option>
              <option value="mileage-asc">Mileage: Low to High</option>
              <option value="year-desc">Year: Newest</option>
              <option value="name-asc">Vehicle Name (A–Z)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 text-[10px]">
              ▼
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || typeFilter !== "ALL" || healthFilter !== "ALL" || fuelFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("ALL");
                setHealthFilter("ALL");
                setFuelFilter("ALL");
                setPage(1);
              }}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#080b0e] p-1 ml-auto">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading && vehicles.length === 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
            <span>Loading garage fleet telemetry...</span>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0f14] overflow-hidden p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0 animate-pulse"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="h-12 w-20 rounded-lg bg-[#151a20] shrink-0 border border-white/[0.04]" />
                  <div className="space-y-2 min-w-0">
                    <div className="h-4 w-48 rounded bg-[#1c222a]" />
                    <div className="h-3 w-32 rounded bg-[#151a20]" />
                  </div>
                </div>
                <div className="hidden sm:block h-6 w-16 rounded bg-[#1c222a]" />
                <div className="hidden md:block h-6 w-24 rounded bg-[#151a20]" />
                <div className="hidden lg:block h-5 w-28 rounded bg-[#151a20]" />
                <div className="hidden sm:block h-8 w-24 rounded bg-[#1c222a]" />
              </div>
            ))}
          </div>
        </div>
      ) : error && vehicles.length === 0 ? (
        <div className="rounded-xl border border-red-500/20 bg-[#0c0f14] p-8 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Unable to load garage vehicles</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{error}</p>
          </div>
          <button
            onClick={() => loadVehicles(true)}
            className="action-primary text-xs mx-auto"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry Connection
          </button>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0f14] p-8">
          <EmptyState
            icon={Car}
            eyebrow="My Garage"
            title={vehicles.length === 0 ? "No vehicles registered" : "No matching vehicles found"}
            description={
              vehicles.length === 0
                ? "Add your car, motorcycle, or scooter to start monitoring live subsystem health and maintenance."
                : "Try adjusting your search criteria, vehicle type, or powertrain filter."
            }
            actionLabel={vehicles.length === 0 ? "Add Vehicle" : "Clear All Filters"}
            onAction={
              vehicles.length === 0
                ? () => setAddModalOpen(true)
                : () => {
                    setSearchQuery("");
                    setTypeFilter("ALL");
                    setHealthFilter("ALL");
                    setFuelFilter("ALL");
                    setPage(1);
                  }
            }
          />
        </div>
      ) : viewMode === "table" ? (
        <div className="space-y-4">
          {/* Redesigned Luxury Automotive Table */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0f14] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#080b0e] text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="w-12 py-3.5 pl-4 pr-2 text-center">
                      <button
                        onClick={handleSelectAll}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Select all on this page"
                      >
                        {selectedIds.size === paginatedVehicles.length && paginatedVehicles.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4 min-w-[280px]">Vehicle & Model</th>
                    <th className="py-3.5 px-3 min-w-[110px] text-center">Type</th>
                    <th className="py-3.5 px-3 min-w-[130px] text-center">Health Score</th>
                    <th className="py-3.5 px-4 min-w-[120px] text-right">Odometer</th>
                    <th className="py-3.5 px-3 min-w-[110px] text-center">Powertrain</th>
                    <th className="py-3.5 px-4 min-w-[180px]">OBD-II DTC Status</th>
                    <th className="py-3.5 px-4 min-w-[190px]">Next Scheduled Service</th>
                    <th className="py-3.5 pr-4 pl-2 min-w-[150px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {paginatedVehicles.map((v) => {
                    const isSelected = selectedIds.has(v.id);
                    const isEV = v.fuelType === "ELECTRIC";
                    const isHybrid = v.fuelType === "HYBRID";
                    const isMotorcycle = v.vehicleType === "MOTORCYCLE";
                    const isScooter = v.vehicleType === "SCOOTER";
                    const isTwoWheeler = isMotorcycle || isScooter;

                    const typeLabel = isMotorcycle
                      ? "Bike"
                      : isScooter
                      ? "Scooter"
                      : isEV
                      ? "EV"
                      : isHybrid
                      ? "Hybrid"
                      : v.vehicleType === "SUV"
                      ? "SUV"
                      : v.vehicleType === "VAN"
                      ? "Van"
                      : "Car";

                    const activeDTC = v.diagnostics?.find((d) => d.status === "ACTIVE");
                    const nextService = v.schedules?.[0];

                    const healthColor =
                      v.healthScore >= 80
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                        : v.healthScore >= 65
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/25"
                        : "text-red-400 bg-red-500/10 border-red-500/25";

                    const healthDot =
                      v.healthScore >= 80
                        ? "bg-emerald-400"
                        : v.healthScore >= 65
                        ? "bg-amber-400"
                        : "bg-red-400";

                    const healthBar =
                      v.healthScore >= 80
                        ? "bg-emerald-500"
                        : v.healthScore >= 65
                        ? "bg-amber-500"
                        : "bg-red-500";

                    return (
                      <tr
                        key={v.id}
                        className={`group transition-colors ${
                          isSelected
                            ? "bg-amber-500/[0.08]"
                            : "hover:bg-[#12161d]/90"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 pl-4 pr-2 text-center align-middle">
                          <button
                            onClick={() => toggleSelectOne(v.id)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-amber-400" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        {/* Vehicle Identity & Model */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex items-center gap-3.5 min-w-[260px]">
                            <Link
                              href={`/garage/${v.id}`}
                              className="relative h-12 w-20 rounded-lg overflow-hidden bg-[#07090c] border border-white/[0.08] shrink-0 group-hover:border-amber-500/40 transition-colors shadow-inner"
                            >
                              <VehicleImageView
                                src={v.imageUrl}
                                alt={`${v.year} ${v.make} ${v.model}`}
                                make={v.make}
                                model={v.model}
                                year={v.year}
                                trim={v.trim}
                                vehicleType={v.vehicleType}
                                fuelType={v.fuelType}
                                aspectRatio="cover"
                                compact={true}
                              />
                            </Link>

                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/garage/${v.id}`}
                                className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors block truncate leading-tight"
                              >
                                {v.year} {v.make} {v.model}
                              </Link>
                              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                                <span className="font-semibold text-amber-400/90 truncate max-w-[120px]">
                                  {v.name}
                                </span>
                                {v.engineCc && (
                                  <span className="text-slate-500">• {v.engineCc} cc</span>
                                )}
                                {v.licensePlate && (
                                  <span className="rounded bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.2 text-[10px] text-slate-300">
                                    {v.licensePlate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3.5 px-3 text-center align-middle">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold uppercase bg-white/[0.04] text-slate-200 border border-white/[0.08] shadow-xs">
                            {isTwoWheeler ? (
                              <Bike className="h-3.5 w-3.5 text-amber-400" />
                            ) : isEV ? (
                              <Zap className="h-3.5 w-3.5 text-sky-400" />
                            ) : (
                              <Car className="h-3.5 w-3.5 text-slate-400" />
                            )}
                            <span>{typeLabel}</span>
                          </span>
                        </td>

                        {/* Health Score Pill & Bar */}
                        <td className="py-3.5 px-3 text-center align-middle">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${healthColor}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${healthDot}`} />
                              {v.healthScore}/100
                            </span>
                            <div className="w-16 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${healthBar}`}
                                style={{ width: `${v.healthScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Odometer */}
                        <td className="py-3.5 px-4 text-right align-middle font-mono font-semibold text-xs text-slate-200 whitespace-nowrap">
                          {v.mileage.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-500 font-normal">mi</span>
                        </td>

                        {/* Powertrain */}
                        <td className="py-3.5 px-3 text-center align-middle">
                          <span className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${
                            isEV
                              ? "bg-sky-500/15 border-sky-500/30 text-sky-300"
                              : isHybrid
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                              : "bg-white/[0.04] border-white/[0.08] text-slate-300"
                          }`}>
                            {isEV ? "Electric" : isHybrid ? "Hybrid" : v.fuelType}
                          </span>
                        </td>

                        {/* Diagnostic Codes (DTC) */}
                        <td className="py-3.5 px-4 align-middle">
                          {activeDTC ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 text-[10px] font-mono font-bold shrink-0">
                                <AlertTriangle className="h-3 w-3" />
                                {activeDTC.codes}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                                {activeDTC.aiSummary?.split(".")[0] || "Active Fault"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Nominal</span>
                            </span>
                          )}
                        </td>

                        {/* Next Scheduled Service */}
                        <td className="py-3.5 px-4 align-middle">
                          {nextService ? (
                            <div className="min-w-[160px]">
                              <p className={`font-semibold text-xs truncate max-w-[180px] ${
                                nextService.urgency === "OVERDUE"
                                  ? "text-red-400"
                                  : nextService.urgency === "DUE_SOON"
                                  ? "text-amber-400"
                                  : "text-slate-200"
                              }`}>
                                {nextService.taskName}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                {nextService.urgency === "OVERDUE"
                                  ? "Overdue for service"
                                  : nextService.urgency === "DUE_SOON"
                                  ? "Due soon"
                                  : `Due at ${nextService.nextDueMileage.toLocaleString()} mi`}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">Up to date</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pr-4 pl-2 text-right align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setTargetVehicleId(v.id);
                                setScanModalOpen(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-sky-400 transition-colors"
                              title="Run OBD-II Diagnostics Scan"
                            >
                              <Cpu className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTargetVehicleId(v.id);
                                setServiceModalOpen(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-amber-400 transition-colors"
                              title="Log Maintenance Record"
                            >
                              <Wrench className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/garage/${v.id}`}
                              className="action-secondary py-1 px-2.5 text-xs font-semibold rounded-md inline-flex items-center gap-1 hover:border-amber-500/40"
                            >
                              <span>View</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 px-1">
              <span>
                Showing <strong className="text-white font-mono">{paginatedVehicles.length}</strong> of{" "}
                <strong className="text-white font-mono">{filteredVehicles.length}</strong> vehicles
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-white/[0.08] bg-[#0c0f13] px-3 py-1.5 text-slate-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <span className="px-2 font-mono text-slate-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-white/[0.08] bg-[#0c0f13] px-3 py-1.5 text-slate-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Card Grid View */
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedVehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onRunScan={(id) => {
                  setTargetVehicleId(id);
                  setScanModalOpen(true);
                }}
                onLogService={(id) => {
                  setTargetVehicleId(id);
                  setServiceModalOpen(true);
                }}
              />
            ))}
          </div>

          {/* Pagination Controls for Grid */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 px-1">
              <span>
                Showing <strong className="text-white font-mono">{paginatedVehicles.length}</strong> of{" "}
                <strong className="text-white font-mono">{filteredVehicles.length}</strong> vehicles
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-white/[0.08] bg-[#0c0f13] px-3 py-1.5 text-slate-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <span className="px-2 font-mono text-slate-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-white/[0.08] bg-[#0c0f13] px-3 py-1.5 text-slate-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onVehicleAdded={() => loadVehicles(true)}
      />

      {/* OBD Scanner Modal */}
      {targetVehicleId && (
        <ObdScannerModal
          isOpen={scanModalOpen}
          onClose={() => {
            setScanModalOpen(false);
            setTargetVehicleId("");
          }}
          vehicles={vehicles}
          selectedVehicleId={targetVehicleId}
          onAnalysisSuccess={() => void loadVehicles(true)}
        />
      )}

      {/* Add Service Modal */}
      {targetVehicleId && (
        <AddServiceModal
          isOpen={serviceModalOpen}
          onClose={() => {
            setServiceModalOpen(false);
            setTargetVehicleId("");
          }}
          vehicles={vehicles}
          selectedVehicleId={targetVehicleId}
          onRecordAdded={() => void loadVehicles(true)}
        />
      )}
    </div>
  );
}
