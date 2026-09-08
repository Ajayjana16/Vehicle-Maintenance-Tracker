"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Car,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  HelpCircle,
  X,
  Info,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";

interface DemoAccount {
  email: string;
  name: string;
  vehicles: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "alex@autopulse.me",
    name: "Alex Mercer",
    vehicles: "2023 Tesla Model 3 & 2021 Toyota RAV4",
  },
  {
    email: "sarah@autopulse.me",
    name: "Sarah Chen",
    vehicles: "2022 Ford F-150 Lightning & 2024 Ioniq 5",
  },
  {
    email: "marcus@autopulse.me",
    name: "Marcus Vance",
    vehicles: "2020 Honda Civic & 2019 BMW 330i",
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const expired = searchParams.get("expired") === "true";
  const resetSuccess = searchParams.get("reset") === "success";

  const { refreshUser, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(
    expired ? "Your session has expired. Please sign in to continue." : null
  );
  const [infoNotice, setInfoNotice] = useState<string | null>(
    resetSuccess ? "Password updated successfully. You may now sign in." : null
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const [selectedDemoEmail, setSelectedDemoEmail] = useState<string | null>(null);
  const [fillFeedback, setFillFeedback] = useState<string | null>(null);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(from);
    }
  }, [isAuthenticated, user, router, from]);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email address is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    return isValid;
  };

  const performLogin = async (targetEmail: string, targetPass: string) => {
    try {
      setLoading(true);
      setGeneralError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: targetEmail.trim().toLowerCase(),
          password: targetPass,
          rememberMe,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setGeneralError(
          data?.error || "Invalid email or password. Please verify your credentials."
        );
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Refresh Auth context
      await refreshUser();

      // Smooth transition to destination
      setTimeout(() => {
        router.replace(from);
      }, 350);
    } catch (err) {
      console.error("Login submission error:", err);
      setGeneralError("Unable to connect to authentication server. Please check your network connection.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await performLogin(email, password);
  };

  const handleSelectDemo = (demo: DemoAccount, autoSubmit: boolean = false) => {
    setEmail(demo.email);
    setPassword("Password123!");
    setSelectedDemoEmail(demo.email);
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setFillFeedback(`Loaded credentials for ${demo.name}`);

    if (autoSubmit) {
      void performLogin(demo.email, "Password123!");
    }
  };

  return (
    <div className="min-h-screen bg-[#07090b] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-y-auto">
      {/* Subtle background gradient and grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 space-y-6 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2.5 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-sm">
              <Car className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="text-base font-extrabold tracking-tight text-white block leading-none">
                AUTOPULSE
              </span>
              <span className="text-[9px] font-mono tracking-widest text-amber-400/80 uppercase mt-0.5 block">
                VEHICLE INTELLIGENCE
              </span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Sign in to AutoPulse
          </h1>
          <p className="text-xs text-slate-400">
            Personal vehicle health, predictive wear & diagnostic companion
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0f13] p-6 sm:p-7 shadow-2xl backdrop-blur-sm">
          {/* Info Notice */}
          {infoNotice && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-300 animate-in fade-in duration-200">
              <Info className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
              <div className="flex-1 leading-snug">{infoNotice}</div>
            </div>
          )}

          {/* Fill Feedback Banner */}
          {fillFeedback && (
            <div className="mb-5 flex items-center justify-between gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="font-medium">{fillFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setFillFeedback(null)}
                className="text-amber-400 hover:text-white p-0.5"
                aria-label="Dismiss feedback"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* General / Server Error Alert */}
          {generalError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 leading-snug">{generalError}</div>
            </div>
          )}

          {/* Success Notification */}
          {success && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 animate-in fade-in duration-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Welcome back! Loading your garage...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300"
              >
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  disabled={loading || success}
                  placeholder="alex@example.com"
                  className={`w-full rounded-md border bg-[#080b0e] pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 ${
                    emailError
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                      : selectedDemoEmail && email === selectedDemoEmail
                      ? "border-amber-400/80 bg-amber-500/[0.04] focus:border-amber-400 focus:ring-amber-400/40"
                      : "border-white/[0.1] focus:border-amber-400/80 focus:ring-amber-400/40"
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  disabled={loading || success}
                  placeholder="••••••••••••"
                  className={`w-full rounded-md border bg-[#080b0e] pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 ${
                    passwordError
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                      : selectedDemoEmail && password === "Password123!"
                      ? "border-amber-400/80 bg-amber-500/[0.04] focus:border-amber-400 focus:ring-amber-400/40"
                      : "border-white/[0.1] focus:border-amber-400/80 focus:ring-amber-400/40"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading || success}
                  className="h-4 w-4 rounded border-white/[0.2] bg-[#080b0e] text-amber-500 focus:ring-amber-400/30 focus:ring-offset-0 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400">Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-2 action-primary py-3 text-xs font-bold rounded-md flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-md hover:shadow-amber-500/10 cursor-pointer touch-manipulation active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Authorized</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

            {/* Don't have an account? Create one */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
                >
                  Create one
                </Link>
              </p>
            </div>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-white/[0.08]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-amber-400" /> Demo Owner Accounts
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">Tap to auto-fill</span>
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((demo) => {
                const isSelected = selectedDemoEmail === demo.email && email === demo.email;
                return (
                  <div
                    key={demo.email}
                    className={`w-full rounded-lg border transition-all text-xs overflow-hidden ${
                      isSelected
                        ? "border-amber-500/60 bg-amber-500/10 shadow-sm shadow-amber-500/10"
                        : "border-white/[0.08] bg-[#080b0e] hover:border-amber-500/40 hover:bg-[#12161c]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectDemo(demo)}
                      className="w-full flex items-center justify-between p-2.5 text-left cursor-pointer touch-manipulation active:scale-[0.99] transition-transform"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className={`font-semibold text-[11px] leading-tight truncate ${
                            isSelected ? "text-amber-300" : "text-slate-200"
                          }`}>
                            {demo.name}
                          </p>
                          {isSelected && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Filled
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                          {demo.email}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {demo.vehicles}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[9px] font-mono uppercase rounded px-1.5 py-0.5 border ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-400/40 text-amber-300 font-bold"
                            : "bg-white/[0.04] border-white/[0.08] text-slate-400"
                        }`}>
                          {isSelected ? "Active" : "Use"}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center">
          <p className="text-[11px] text-slate-600 font-mono flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            256-BIT ENCRYPTED TELEMETRY SESSION
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#0e1216] p-6 shadow-2xl relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5 text-amber-400 mb-3">
              <HelpCircle className="h-5 w-5" />
              <h2 className="text-base font-bold text-white">Reset Account Password</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              To reset your AutoPulse password, click the &ldquo;Forgot password?&rdquo; link on the login screen or contact support.
            </p>
            <div className="p-3 rounded bg-[#080b0e] border border-white/[0.06] text-[11px] font-mono text-slate-400 space-y-1 mb-5">
              <p>Demo Passcode: <strong className="text-amber-400">Password123!</strong></p>
            </div>
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="w-full action-secondary py-2 text-xs font-semibold rounded-md"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090b] flex items-center justify-center text-xs font-mono text-slate-500">
          Loading sign in...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
