"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  Cpu,
  Fuel,
  Gauge,
  Menu,
  Settings,
  TrendingUp,
  Wrench,
  X,
  Search,
  Bell,
} from "lucide-react";
import CommandPalette from "@/components/command-palette";
import NotificationCenter from "@/components/notification-center";

const PRIMARY_NAV = [
  { name: "Dashboard", href: "/", icon: Gauge },
  { name: "My Vehicles", href: "/garage", icon: Car },
  { name: "Diagnostics", href: "/diagnostics", icon: Cpu },
  { name: "Predictive Wear", href: "/predictive", icon: TrendingUp },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Fuel & Energy", href: "/fuel", icon: Fuel },
  { name: "Settings", href: "/settings", icon: Settings },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update dynamic document title
  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "Dashboard — Vehicle Health",
      "/garage": "My Vehicles — AutoPulse",
      "/diagnostics": "Diagnostics & DTC Codes",
      "/maintenance": "Maintenance & Service Logbook",
      "/fuel": "Fuel & Energy Analytics",
      "/predictive": "Predictive Component Wear",
      "/settings": "Settings & Preferences",
    };
    document.title = `AutoPulse — ${titles[pathname] || "Vehicle Health"}`;
  }, [pathname]);

  // Close drawers on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#090b0d]/95 backdrop-blur-md">
        {/* Top Operational Bar */}
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="group flex items-center gap-2.5 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 transition-colors group-hover:border-amber-400">
                <Car className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  AUTOPULSE
                </span>
                <span className="text-[8px] font-mono tracking-widest text-amber-400/80 uppercase -mt-0.5">
                  VEHICLE HEALTH
                </span>
              </div>
            </Link>
          </div>

          {/* Search Trigger Bar (Command Palette) */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between rounded border border-white/[0.08] bg-[#0b0e11] px-3 py-1.5 text-xs text-slate-400 hover:border-white/[0.16] hover:bg-[#0e1216] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px] text-slate-400">Search vehicles, DTC codes, maintenance...</span>
              </div>
              <kbd className="rounded bg-[#161c22] border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Controls: Alerts, Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Command Palette Mobile Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="md:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06]"
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotificationCenterOpen(true)}
              className="relative p-1.5 rounded border border-white/[0.08] bg-[#0d1014] text-slate-300 hover:border-amber-500/40 hover:text-white transition-colors"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-mono font-bold text-white">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
              className="rounded p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Primary Desktop Navigation Bar */}
        <div className="border-t border-white/[0.06] bg-[#07090b]">
          <div className="mx-auto flex h-10 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
              {PRIMARY_NAV.map(({ name, href, icon: Icon }) => {
                const isActive =
                  href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold tracking-tight transition-all ${
                      isActive
                        ? "text-amber-300 bg-amber-500/[0.1] font-bold"
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                    <span>{name}</span>
                    {isActive && (
                      <span className="absolute inset-x-2 bottom-0 h-0.5 bg-amber-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-white/[0.08] bg-[#0c0f12] px-4 py-3 lg:hidden">
            <nav className="flex flex-col space-y-1">
              {PRIMARY_NAV.map(({ name, href, icon: Icon }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded px-3 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-amber-500/15 text-amber-300 border-l-2 border-amber-400"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                    <span>{name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Global Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <NotificationCenter
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
        onNotificationCountUpdate={setUnreadAlertsCount}
      />
    </>
  );
}
