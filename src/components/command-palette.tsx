"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Car,
  AlertTriangle,
  Wrench,
  X,
  TrendingUp,
  Cpu,
} from "lucide-react";
import { GlobalSearchResult } from "@/types";
import { apiFetch } from "@/lib/api-client";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await apiFetch<GlobalSearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: GlobalSearchResult) => {
    onClose();
    router.push(result.href);
  };

  if (!isOpen) return null;

  const getTypeIcon = (type: GlobalSearchResult["type"]) => {
    switch (type) {
      case "VEHICLE":
        return <Car className="h-4 w-4 text-amber-400" />;
      case "DTC":
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case "MAINTENANCE":
        return <Wrench className="h-4 w-4 text-sky-400" />;
      default:
        return <Cpu className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl border border-white/[0.12] bg-[#0c0f13] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5 bg-[#090b0e]">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vehicles, VINs, license plates, DTC codes, maintenance..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-[#161c22] border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Searching vehicle database...
            </div>
          ) : query.length >= 2 && results.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs font-semibold text-slate-300">No matching vehicles or records found</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Try searching by vehicle model, VIN number, or DTC trouble code.
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-amber-500/15 border border-amber-500/30 text-white"
                        : "hover:bg-white/[0.04] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded bg-[#12161a] border border-white/[0.06] shrink-0">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate text-white">
                            {item.title}
                          </span>
                          <span className="rounded bg-[#161c22] border border-white/[0.08] px-1.5 py-0.2 text-[9px] font-mono font-bold text-slate-400 uppercase">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    {item.badge && (
                      <span className="hidden sm:inline-block rounded bg-[#101418] border border-white/[0.06] px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 px-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Quick Navigation
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    onClose();
                    router.push("/garage");
                  }}
                  className="flex items-center gap-2 p-2 rounded bg-[#090b0e] border border-white/[0.05] text-slate-300 hover:text-amber-300 hover:border-amber-500/30 text-left"
                >
                  <Car className="h-3.5 w-3.5 text-amber-400" />
                  <span>My Vehicles</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/diagnostics");
                  }}
                  className="flex items-center gap-2 p-2 rounded bg-[#090b0e] border border-white/[0.05] text-slate-300 hover:text-amber-300 hover:border-amber-500/30 text-left"
                >
                  <Cpu className="h-3.5 w-3.5 text-red-400" />
                  <span>Diagnostics & DTC Codes</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/maintenance");
                  }}
                  className="flex items-center gap-2 p-2 rounded bg-[#090b0e] border border-white/[0.05] text-slate-300 hover:text-amber-300 hover:border-amber-500/30 text-left"
                >
                  <Wrench className="h-3.5 w-3.5 text-sky-400" />
                  <span>Maintenance Logbook</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/predictive");
                  }}
                  className="flex items-center gap-2 p-2 rounded bg-[#090b0e] border border-white/[0.05] text-slate-300 hover:text-amber-300 hover:border-amber-500/30 text-left"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Predictive Wear</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-white/[0.08] bg-[#080a0d] px-4 py-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>AUTOPULSE VEHICLE HEALTH SEARCH</span>
        </div>
      </div>
    </div>
  );
}
