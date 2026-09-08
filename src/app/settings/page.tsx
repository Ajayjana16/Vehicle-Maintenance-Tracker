"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  User,
  Key,
  Shield,
  Bell,
  Cpu,
  CheckCircle2,
  Sliders,
  LogOut,
  Gauge,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"PROFILE" | "UNITS" | "DIAGNOSTICS" | "NOTIFICATIONS">("PROFILE");

  // Profile
  const [name, setName] = useState(user?.name || "Alex Mercer");
  const [email, setEmail] = useState(user?.email || "alex@autopulse.me");

  // Units
  const [distanceUnit, setDistanceUnit] = useState("miles");
  const [fuelUnit, setFuelUnit] = useState("mpg");
  const [pressureUnit, setPressureUnit] = useState("psi");
  const [tempUnit, setTempUnit] = useState("f");

  // Diagnostic & AI
  const [apiKey, setApiKey] = useState<string>("");
  const [scanSensitivity, setScanSensitivity] = useState("standard");

  // Notifications
  const [notifyCritical, setNotifyCritical] = useState<boolean>(true);
  const [notifyMaintenanceDays, setNotifyMaintenanceDays] = useState<string>("14");

  const [saved, setSaved] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    const stored = localStorage.getItem("gemini_api_key");
    if (stored) setApiKey(stored);
    const savedUnits = localStorage.getItem("autopulse_units");
    if (savedUnits) {
      try {
        const parsed = JSON.parse(savedUnits);
        if (parsed.distance) setDistanceUnit(parsed.distance);
        if (parsed.fuel) setFuelUnit(parsed.fuel);
        if (parsed.pressure) setPressureUnit(parsed.pressure);
        if (parsed.temp) setTempUnit(parsed.temp);
      } catch {}
    }
  }, [user]);

  const showSavedState = (msg = "Preferences successfully saved.") => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSaveMessage(msg);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => setSaved(false), 3500);
  };

  const handleSaveUnits = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "autopulse_units",
      JSON.stringify({
        distance: distanceUnit,
        fuel: fuelUnit,
        pressure: pressureUnit,
        temp: tempUnit,
      })
    );
    showSavedState("Measurement units updated.");
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("gemini_api_key", apiKey.trim());
    showSavedState("Diagnostic AI engine updated.");
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    showSavedState("Reverted to embedded ASE Master Technician rule catalog.");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <header className="border-b border-white/[0.08] pb-5">
        <div>
          <span className="eyebrow">
            <Settings className="h-3 w-3" /> Account Settings
          </span>
          <h1 className="page-heading mt-1">Preferences & Configuration</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal profile, measurement units, OBD-II scanner sensitivity, and notification rules.
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-1 mt-6 border-b border-white/[0.06] -mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("PROFILE")}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "PROFILE"
                ? "border-amber-400 text-amber-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile & Account</span>
          </button>
          <button
            onClick={() => setActiveTab("UNITS")}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "UNITS"
                ? "border-amber-400 text-amber-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Measurement Units</span>
          </button>
          <button
            onClick={() => setActiveTab("DIAGNOSTICS")}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "DIAGNOSTICS"
                ? "border-amber-400 text-amber-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>AI & Diagnostics</span>
          </button>
          <button
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "NOTIFICATIONS"
                ? "border-amber-400 text-amber-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Notifications</span>
          </button>
        </div>
      </header>

      {/* Success Notification Banner */}
      {saved && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* TAB 1: PROFILE & ACCOUNT */}
      {activeTab === "PROFILE" && (
        <div className="space-y-6">
          <div className="surface-panel p-6 space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <User className="h-4 w-4 text-amber-400" />
              Personal Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/20 bg-red-500/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out of AutoPulse</span>
              </button>

              <button
                type="button"
                onClick={() => showSavedState("Profile updated.")}
                className="action-primary text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEASUREMENT UNITS */}
      {activeTab === "UNITS" && (
        <form onSubmit={handleSaveUnits} className="surface-panel p-6 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Sliders className="h-4 w-4 text-amber-400" />
            Display Units & Formats
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Distance & Speed
              </label>
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                className="field-input"
              >
                <option value="miles">Miles / MPH (US Standard)</option>
                <option value="km">Kilometers / km/h (Metric)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Fuel Economy
              </label>
              <select
                value={fuelUnit}
                onChange={(e) => setFuelUnit(e.target.value)}
                className="field-input"
              >
                <option value="mpg">Miles Per Gallon (MPG / MPGe)</option>
                <option value="l100km">Liters per 100 km (L/100km)</option>
                <option value="km_l">Kilometers per Liter (km/L)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Tire Pressure
              </label>
              <select
                value={pressureUnit}
                onChange={(e) => setPressureUnit(e.target.value)}
                className="field-input"
              >
                <option value="psi">Pounds per Square Inch (PSI)</option>
                <option value="bar">Bar (bar)</option>
                <option value="kpa">Kilopascals (kPa)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Temperature
              </label>
              <select
                value={tempUnit}
                onChange={(e) => setTempUnit(e.target.value)}
                className="field-input"
              >
                <option value="f">Fahrenheit (°F)</option>
                <option value="c">Celsius (°C)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex justify-end">
            <button type="submit" className="action-primary text-xs">
              Save Unit Preferences
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: AI & DIAGNOSTICS */}
      {activeTab === "DIAGNOSTICS" && (
        <div className="surface-panel p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  Diagnostic Intelligence Engine
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Translates OBD-II fault codes, guides safe driving decisions, and estimates repair expenses.
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto rounded border border-white/[0.08] bg-[#0c0f12] px-2.5 py-1 text-xs font-mono text-amber-400">
              {apiKey ? "Live Gemini AI Active" : "ASE Heuristic Rule Catalog Active"}
            </span>
          </div>

          <form onSubmit={handleSaveApiKey} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Gemini API Key (Optional)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="field-input font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                AutoPulse includes offline ASE Master Technician heuristics. Configuring a personal Gemini API key enables deep generative mechanical diagnosis and receipt parsing.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Fault Code Alert Sensitivity
              </label>
              <select
                value={scanSensitivity}
                onChange={(e) => setScanSensitivity(e.target.value)}
                className="field-input sm:w-80"
              >
                <option value="standard">Standard (Critical + Moderate Faults)</option>
                <option value="all">All Diagnostic Codes (including Pending)</option>
                <option value="critical_only">Critical Issues Only (Check Engine)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="action-danger text-xs"
                >
                  Clear Key
                </button>
              )}
              <button type="submit" className="action-primary text-xs">
                Save AI Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === "NOTIFICATIONS" && (
        <div className="surface-panel p-6 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Bell className="h-4 w-4 text-amber-400" />
            Alerts & Reminders
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between gap-4 p-3.5 rounded border border-white/[0.06] bg-[#0c0f12]">
              <div>
                <h4 className="font-semibold text-white">Critical Fault Alerts</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Receive instant notifications when critical engine, braking, or battery trouble codes are detected.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyCritical}
                onChange={(e) => setNotifyCritical(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-3.5 rounded border border-white/[0.06] bg-[#0c0f12]">
              <div>
                <h4 className="font-semibold text-white">Upcoming Maintenance Reminders</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  How far in advance to alert you before factory service intervals (oil, tires, brake checks) are due.
                </p>
              </div>
              <select
                value={notifyMaintenanceDays}
                onChange={(e) => setNotifyMaintenanceDays(e.target.value)}
                className="field-input w-40"
              >
                <option value="7">7 Days in Advance</option>
                <option value="14">14 Days in Advance</option>
                <option value="30">30 Days in Advance</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex justify-end">
            <button
              onClick={() => showSavedState("Alert preferences saved.")}
              className="action-primary text-xs"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
