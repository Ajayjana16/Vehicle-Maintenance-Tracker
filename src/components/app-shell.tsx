"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  Car,
  ChevronRight,
  User,
  LogOut,
  Settings,
  ChevronDown,
  X,
  CheckCircle2,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import CommandPalette from "@/components/command-palette";
import NotificationCenter from "@/components/notification-center";
import { useAuth } from "@/components/auth-context";

const ROUTE_NAMES: Record<string, { title: string; section: string }> = {
  "/": { title: "Dashboard", section: "Vehicle Health" },
  "/garage": { title: "My Vehicles", section: "Vehicle Health" },
  "/diagnostics": { title: "Diagnostics", section: "Vehicle Health" },
  "/predictive": { title: "Predictive Wear", section: "Vehicle Health" },
  "/maintenance": { title: "Maintenance", section: "Vehicle Health" },
  "/fuel": { title: "Fuel & Energy", section: "Vehicle Health" },
  "/settings": { title: "Settings", section: "Account & Preferences" },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [headerUserMenuOpen, setHeaderUserMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Read saved collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("autopulse_sidebar_collapsed");
    if (saved !== null) {
      setSidebarCollapsed(saved === "true");
    }
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("autopulse_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Close menus on route change
  useEffect(() => {
    setHeaderUserMenuOpen(false);
  }, [pathname]);

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

  // Current page breadcrumb
  const currentRoute = ROUTE_NAMES[pathname] || {
    title: pathname.startsWith("/garage/") ? "Vehicle Profile" : "Vehicle Health",
    section: "Vehicle Health",
  };

  // If on authentication or onboarding routes, bypass chrome (sidebar, topbar, footer)
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/onboarding");

  if (isAuthPage) {
    return <>{children}</>;
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AP";

  return (
    <div className="min-h-screen bg-[#090b0d] text-[#f0f4f8] flex flex-col selection:bg-amber-400 selection:text-black">
      {/* Collapsible / Mobile Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Layout Container — offset by sidebar width on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#07090b]/85 backdrop-blur-xl shadow-md">
          <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* Left: Mobile Toggle, Breadcrumb & Live Telemetry Pill */}
            <div className="flex items-center gap-3.5 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="hidden sm:inline-block rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-1 text-[11px] text-slate-400 font-medium">
                  {currentRoute.section}
                </span>
                <ChevronRight className="hidden sm:inline-block h-3 w-3 text-slate-600" />
                <span className="font-bold text-white text-xs sm:text-sm truncate tracking-tight">
                  {currentRoute.title}
                </span>
              </div>

              {/* Live Telemetry Beacon */}
              <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>TELEMETRY SYNCED</span>
              </div>
            </div>

            {/* Center: Global Search Bar Trigger */}
            <div className="flex-1 max-w-md hidden md:block">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="w-full flex items-center justify-between rounded-full border border-white/[0.08] bg-[#0c0f13] hover:border-amber-500/40 hover:bg-[#11161d] px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-all shadow-inner group"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300">
                    Search vehicles, DTC codes, maintenance...
                  </span>
                </div>
                <kbd className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-slate-400 group-hover:text-amber-300">
                  Ctrl K
                </kbd>
              </button>
            </div>

            {/* Right: Search Mobile Button, Alerts Bell, Account Menu */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Mobile Search Button */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="md:hidden p-2 rounded-lg border border-white/[0.08] bg-[#0c0f13] text-slate-400 hover:text-white hover:border-amber-500/40 transition-colors"
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Notifications Button */}
              <button
                onClick={() => setNotificationCenterOpen(true)}
                className="relative p-2 rounded-lg border border-white/[0.08] bg-[#0c0f13] text-slate-300 hover:border-amber-500/40 hover:bg-[#11161d] hover:text-white transition-all shadow-xs"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-mono font-bold text-slate-950 shadow-sm">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* Authenticated User Account Menu */}
              <div className="relative">
                <button
                  onClick={() => setHeaderUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full border border-white/[0.08] bg-[#0c0f13] hover:border-amber-500/40 hover:bg-[#11161d] transition-all shadow-xs group cursor-pointer"
                  aria-expanded={headerUserMenuOpen}
                  aria-label="User account menu"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 text-xs font-mono font-extrabold shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left max-w-[130px] truncate">
                    <p className="text-xs font-bold text-white leading-none group-hover:text-amber-300 transition-colors truncate">
                      {user?.name || "Vehicle Owner"}
                    </p>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/80 leading-none block mt-1">
                      Garage Owner
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-transform" />
                </button>

                {/* Dropdown Menu */}
                {headerUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2.5 w-60 rounded-xl border border-white/[0.1] bg-[#0e1216] shadow-2xl p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    {/* User Header */}
                    <div className="p-2.5 rounded-lg bg-[#080b0e] border border-white/[0.04] mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold font-mono text-xs border border-amber-500/30">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate text-xs">{user?.name || "Vehicle Owner"}</p>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{user?.email || "alex@autopulse.me"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Links */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setHeaderUserMenuOpen(false);
                          setProfileModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">My Profile</span>
                      </button>

                      <Link
                        href="/settings"
                        onClick={() => setHeaderUserMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
                      >
                        <Settings className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Account Settings</span>
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="mt-2 pt-2 border-t border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => {
                          setHeaderUserMenuOpen(false);
                          void signOut();
                        }}
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left font-semibold"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-white/[0.08] bg-[#07090b] py-4 text-xs text-slate-500">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-slate-500">
                AutoPulse <span className="text-slate-600">Personal Health Platform</span>
              </p>
            </div>
            <p className="text-slate-600">
              Vehicle Health & Intelligence Companion
            </p>
          </div>
        </footer>
      </div>

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

      {/* Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#0e1216] p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setProfileModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Close profile modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-base font-mono font-bold shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white leading-tight truncate">
                  {user?.name || "Vehicle Owner"}
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                  {user?.email || "alex@autopulse.me"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-amber-400 font-semibold">
                    Personal Account
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs border-t border-white/[0.08] pt-4 mb-5">
              <div className="flex items-center justify-between p-2 rounded bg-[#080b0e] border border-white/[0.04]">
                <span className="text-slate-400">User Identity</span>
                <span className="font-mono text-slate-300 text-[11px] truncate max-w-[200px]">
                  {user?.id || "user-01"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#080b0e] border border-white/[0.04]">
                <span className="text-slate-400">Session Security</span>
                <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Signed httpOnly JWT
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => {
                  setProfileModalOpen(false);
                  void signOut();
                }}
                className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="action-secondary py-1.5 px-3 text-xs font-semibold rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
