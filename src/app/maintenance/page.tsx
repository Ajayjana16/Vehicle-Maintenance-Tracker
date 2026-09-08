"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wrench,
  Plus,
  FileText,
  DollarSign,
  Search,
  Filter,
  Sparkles,
  BarChart3,
} from "lucide-react";
import ReceiptUploader from "@/components/receipt-uploader";
import AddServiceModal from "@/components/add-service-modal";
import CostAnalyticsChart from "@/components/cost-analytics-chart";
import EmptyState from "@/components/empty-state";
import RequestError from "@/components/request-error";
import { useVehicleSummaries } from "@/components/vehicle-summary-provider";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/components/auth-context";

function MaintenanceContent() {
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get("vehicleId") || "";

  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"LOGS" | "RECEIPTS" | "ANALYTICS">("LOGS");
  const { vehicles, error: vehicleError, ensureLoaded } = useVehicleSummaries();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(initialVehicleId);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddServiceOpen, setIsAddServiceOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      void ensureLoaded().catch(() => undefined);
    }
  }, [isAuthenticated, ensureLoaded]);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (selectedVehicle) queryParams.set("vehicleId", selectedVehicle);
      if (selectedCategory !== "ALL") queryParams.set("serviceType", selectedCategory);
      const recData = await apiFetch<any[]>(`/api/maintenance?${queryParams.toString()}`);
      if (Array.isArray(recData)) setRecords(recData);
    } catch (err) {
      console.error("Error fetching maintenance records:", err);
      const message = err instanceof Error ? err.message : "Maintenance records are temporarily unavailable.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle, selectedCategory]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecords();
    }
  }, [isAuthenticated, fetchRecords]);

  // Client-side search filtering
  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.provider && r.provider.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q))
    );
  }, [records, searchQuery]);

  const totalSpent = useMemo(
    () => records.reduce((sum, r) => sum + r.cost, 0),
    [records]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <span className="eyebrow">
            <Wrench className="h-3 w-3" /> Maintenance
          </span>
          <h1 className="page-heading mt-1">Maintenance & Service Logbook</h1>
          <p className="text-xs text-slate-400 mt-1">
            Factory service intervals, completed maintenance records, and repair expense tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("RECEIPTS")}
            className="action-secondary text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Parse Invoice</span>
          </button>

          <button
            onClick={() => setIsAddServiceOpen(true)}
            className="action-primary text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Service</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex items-center gap-2 border-b border-white/[0.08] text-xs font-semibold">
        <button
          onClick={() => setActiveTab("LOGS")}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "LOGS"
              ? "border-amber-400 text-amber-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Service Logbook ({filteredRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ANALYTICS")}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "ANALYTICS"
              ? "border-amber-400 text-amber-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Cost Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab("RECEIPTS")}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "RECEIPTS"
              ? "border-amber-400 text-amber-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Invoice & Receipt Extraction</span>
        </button>
      </nav>

      {/* Tab Panels */}
      {activeTab === "RECEIPTS" ? (
        <ReceiptUploader
          vehicles={vehicles}
          selectedVehicleId={selectedVehicle}
          onRecordAdded={() => {
            fetchRecords();
            setActiveTab("LOGS");
          }}
        />
      ) : activeTab === "ANALYTICS" ? (
        <CostAnalyticsChart records={records} />
      ) : (
        <div className="space-y-4">
          {/* Filter & Search Toolbar */}
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-[#0f1215] p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search service, shop, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded border border-white/[0.08] bg-[#090b0e] py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="rounded border border-white/[0.08] bg-[#090b0e] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded border border-white/[0.08] bg-[#090b0e] px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="OIL_CHANGE">Oil & Fluids</option>
                <option value="BRAKES">Brakes & Rotors</option>
                <option value="TIRES">Tires & Alignment</option>
                <option value="BATTERY">Battery & Electrical</option>
                <option value="FILTERS">Cabin & Filters</option>
                <option value="INSPECTION">Inspection</option>
                <option value="REPAIR">Mechanical Repair</option>
              </select>
            </div>

            <div className="font-mono text-xs text-slate-300 flex items-center gap-1">
              <span className="text-slate-500 uppercase text-[10px]">Logged Spend:</span>
              <strong className="text-emerald-400 font-bold">
                ${totalSpent.toFixed(2)}
              </strong>
            </div>
          </section>

          {/* Records Table */}
          {vehicleError && vehicles.length === 0 ? (
            <RequestError
              message={vehicleError}
              onRetry={() => void ensureLoaded().catch(() => undefined)}
            />
          ) : error ? (
            <RequestError message={error} onRetry={() => void fetchRecords()} />
          ) : loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg border border-white/[0.06] bg-[#0f1215] animate-pulse"
                />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="surface-panel p-6">
              <EmptyState
                icon={Wrench}
                eyebrow={searchQuery ? "Search Results" : "Maintenance"}
                title={searchQuery ? "No matching records found" : "No maintenance records recorded"}
                description={
                  searchQuery
                    ? "Try adjusting your search keywords or clear the filter to see full service history."
                    : "Log completed oil changes, brake service, or tire rotations to build a verified vehicle history."
                }
                actionLabel={searchQuery ? "Clear Search" : "Log Service"}
                onAction={() =>
                  searchQuery ? setSearchQuery("") : setIsAddServiceOpen(true)
                }
              />
            </div>
          ) : (
            <div className="table-shell overflow-x-auto">
              <table className="data-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Service Description</th>
                    <th>Category</th>
                    <th>Odometer</th>
                    <th>Shop / Provider</th>
                    <th className="text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-slate-400">
                        {new Date(r.serviceDate).toLocaleDateString()}
                      </td>
                      <td className="font-semibold text-white">
                        {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}
                      </td>
                      <td>
                        <strong className="block text-slate-200">{r.title}</strong>
                        {r.notes && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-sm">
                            {r.notes}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-slate-300">
                          {r.serviceType}
                        </span>
                      </td>
                      <td className="font-mono text-slate-300">
                        {r.mileage.toLocaleString()} mi
                      </td>
                      <td className="text-slate-400">{r.provider || "Self-Serviced"}</td>
                      <td className="text-right font-mono font-bold text-emerald-400">
                        ${r.cost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Service Modal */}
      <AddServiceModal
        vehicles={vehicles}
        selectedVehicleId={selectedVehicle}
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onRecordAdded={fetchRecords}
      />
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-mono">
          Loading maintenance records...
        </div>
      }
    >
      <MaintenanceContent />
    </Suspense>
  );
}
