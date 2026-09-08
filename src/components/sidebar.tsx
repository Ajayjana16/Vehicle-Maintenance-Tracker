"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  Gauge,
  Wrench,
  Cpu,
  Fuel,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  X,
  LogOut,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: "amber" | "red" | "sky" | "emerald";
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/", icon: Gauge },
  { name: "My Vehicles", href: "/garage", icon: Car },
  { name: "Diagnostics", href: "/diagnostics", icon: Cpu },
  { name: "Predictive Wear", href: "/predictive", icon: TrendingUp },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Fuel & Energy", href: "/fuel", icon: Fuel },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Close mobile sidebar and menus on route change
  useEffect(() => {
    onMobileClose();
    setAccountMenuOpen(false);
  }, [pathname, onMobileClose]);

  // Compute initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AP";

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto bg-[#07090b] border-r border-white/[0.08] select-none">
      {/* Brand & Navigation */}
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-3.5 border-b border-white/[0.08]">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-sm">
              <Car className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-extrabold tracking-tight text-white leading-none">
                  AUTOPULSE
                </span>
                <span className="text-[8px] font-mono tracking-widest text-amber-400/90 uppercase mt-0.5">
                  VEHICLE INTELLIGENCE
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map(({ name, href, icon: Icon, badge, badgeColor }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? name : undefined}
                className={`group flex items-center gap-2.5 rounded px-2.5 py-2 text-xs font-semibold tracking-tight transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 shadow-xs"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                } ${collapsed ? "justify-center px-0 py-2.5" : ""}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                {!collapsed && <span className="truncate">{name}</span>}
                {!collapsed && badge && (
                  <span
                    className={`ml-auto rounded px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                      badgeColor === "red"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer & Collapse Toggle */}
      <div className="p-2 border-t border-white/[0.08] space-y-2 bg-[#050709]">
        {/* Live Telemetry Beacon */}
        {!collapsed ? (
          <div className="flex items-center justify-between rounded border border-white/[0.06] bg-[#0c0f12] px-2.5 py-1.5 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="truncate text-slate-400 text-[10px]">OBD-II Telemetry Synced</span>
            </div>
            <span className="text-[9px] text-emerald-400">●</span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span className="relative flex h-2.5 w-2.5" title="Telemetry Live">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}

        {/* Interactive User Account Menu */}
        <div className="relative">
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setAccountMenuOpen((prev) => !prev)}
              aria-expanded={accountMenuOpen}
              aria-label="Open user account menu"
              className="w-full flex items-center justify-between p-1.5 rounded-md hover:bg-white/[0.05] transition-colors group text-left"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                  {initials}
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-semibold text-white group-hover:text-amber-300 truncate leading-tight">
                    {user?.name || "Vehicle Owner"}
                  </p>
                  <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                    {user?.email || "alex@autopulse.me"}
                  </p>
                </div>
              </div>
              <MoreVertical className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1" />
            </button>
          ) : (
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-label="Open user account menu"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold hover:ring-2 hover:ring-amber-400/40 transition-all"
                title={`${user?.name || "Account"}`}
              >
                {initials}
              </button>
            </div>
          )}

          {/* Account Popover Menu */}
          {accountMenuOpen && (
            <div
              className={`absolute z-50 rounded-lg border border-white/[0.1] bg-[#0e1216] shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${
                collapsed
                  ? "left-full bottom-0 ml-2 w-64 p-2"
                  : "bottom-full left-0 right-0 mb-2 p-2"
              }`}
            >
              {/* User Header Summary */}
              <div className="p-2 border-b border-white/[0.08] mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {user?.name || "Vehicle Owner"}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      {user?.email || "alex@autopulse.me"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <Link
                  href="/settings"
                  onClick={() => setAccountMenuOpen(false)}
                  className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  <span>Settings & Preferences</span>
                </Link>
              </div>

              {/* Sign Out Action */}
              <div className="mt-1.5 pt-1.5 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    void signOut();
                  }}
                  className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button (Desktop Only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center gap-2 rounded border border-white/[0.06] bg-[#090b0e] py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>

      {/* Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
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
                <span className="text-slate-400">User ID</span>
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

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-200 ease-in-out ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          {/* Slide-over Container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
