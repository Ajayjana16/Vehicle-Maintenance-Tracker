"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react";
import PasswordField from "@/components/password-field";
import PasswordStrength, { evaluatePassword } from "@/components/password-strength";
import TermsDialog from "@/components/terms-dialog";
import { useAuth } from "@/components/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { refreshUser, isAuthenticated, user } = useAuth();

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [termsType, setTermsType] = useState<"terms" | "privacy">("terms");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated and active, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace("/");
    }
  }, [isAuthenticated, user, router]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!firstName.trim()) nextErrors.firstName = "First name is required";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required";

    if (!email.trim()) {
      nextErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }

    const strength = evaluatePassword(password);
    if (!password) {
      nextErrors.password = "Password is required";
    } else if (strength.score < 3 || password.length < 8) {
      nextErrors.password = "Password does not meet security requirements";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (!termsAccepted) {
      nextErrors.terms = "You must accept the Terms of Service to create an account";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          confirmPassword,
          termsAccepted: true,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setServerError(data?.error || "Registration failed. Please try again.");
        return;
      }

      await refreshUser();
      router.push("/onboarding");
    } catch (err) {
      setServerError("Network connection error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090b] text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Brand Bar */}
      <header className="px-6 py-5 border-b border-white/[0.06] bg-[#090b0e]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400">
            <Car className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white leading-none">
              AUTOPULSE
            </span>
            <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mt-0.5">
              VEHICLE INTELLIGENCE
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Already have an account?</span>
          <Link
            href="/login"
            className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personal Vehicle Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Create your account
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Know your vehicle before it tells you something is wrong. Intelligent diagnostics & predictive care.
            </p>
          </div>

          {/* Form Surface */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0b0e12] p-6 sm:p-8 shadow-2xl shadow-black/60">
            {serverError && (
              <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: "" }));
                    }}
                    placeholder="Alex"
                    className={`w-full rounded-md border bg-[#080b0e] px-3 py-2 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 ${
                      errors.firstName
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                        : "border-white/[0.1] focus:border-amber-400"
                    }`}
                  />
                  {errors.firstName && <p className="text-[11px] text-red-400">{errors.firstName}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: "" }));
                    }}
                    placeholder="Vance"
                    className={`w-full rounded-md border bg-[#080b0e] px-3 py-2 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 ${
                      errors.lastName
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                        : "border-white/[0.1] focus:border-amber-400"
                    }`}
                  />
                  {errors.lastName && <p className="text-[11px] text-red-400">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="alex@example.com"
                  className={`w-full rounded-md border bg-[#080b0e] px-3 py-2 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                      : "border-white/[0.1] focus:border-amber-400"
                  }`}
                />
                {errors.email && <p className="text-[11px] text-red-400">{errors.email}</p>}
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-300">Phone Number</label>
                  <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] px-3 py-2 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Password */}
              <div>
                <PasswordField
                  id="signup-password"
                  label="Password *"
                  value={password}
                  onChange={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="Create a strong password"
                  error={errors.password}
                />
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div>
                <PasswordField
                  id="signup-confirm-password"
                  label="Confirm Password *"
                  value={confirmPassword}
                  onChange={(val) => {
                    setConfirmPassword(val);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  placeholder="Repeat your password"
                  error={errors.confirmPassword}
                />
              </div>

              {/* Terms Acceptance */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-white/[0.1] bg-[#080b0e] text-amber-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-[11px] text-slate-400 leading-snug">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setTermsType("terms");
                        setTermsDialogOpen(true);
                      }}
                      className="text-amber-400 underline hover:text-amber-300"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setTermsType("privacy");
                        setTermsDialogOpen(true);
                      }}
                      className="text-amber-400 underline hover:text-amber-300"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
                {errors.terms && <p className="text-[11px] text-red-400 mt-1">{errors.terms}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 action-primary py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10"
              >
                <span>{loading ? "Creating your account..." : "Create AutoPulse Account"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Privacy Note */}
          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>End-to-end encrypted vehicle telemetry & private diagnostics</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/[0.06] text-center text-[11px] text-slate-500">
        © {new Date().getFullYear()} AutoPulse. Personal Vehicle Health Intelligence.
      </footer>

      {/* Terms & Privacy Dialog */}
      <TermsDialog
        isOpen={termsDialogOpen}
        onClose={() => setTermsDialogOpen(false)}
        type={termsType}
      />
    </div>
  );
}
