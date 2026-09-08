"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Car,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [demoResetLink, setDemoResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to process request. Please try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      if (data?.demoResetLink) {
        setDemoResetLink(data.demoResetLink);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090b] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 space-y-6 my-auto">
        {/* Brand */}
        <div className="text-center space-y-1">
          <Link href="/login" className="inline-flex items-center justify-center gap-2 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-sm">
              <Car className="h-4 w-4" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-white leading-none">
              AUTOPULSE
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Reset account password
          </h1>
          <p className="text-xs text-slate-400">
            Enter your work email to receive password recovery instructions.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0f13] p-6 sm:p-7 shadow-2xl backdrop-blur-sm space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 leading-snug">{error}</div>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white">Reset Instructions Dispatched</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If an account is associated with <strong className="text-white font-mono">{email}</strong>, you will receive a secure reset link valid for 60 minutes.
                </p>
              </div>

              {demoResetLink && (
                <div className="p-3 rounded-lg border border-amber-500/25 bg-amber-500/10 text-left space-y-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                    [DEMO ENVIRONMENT DIRECT LINK]
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Click below to open the reset screen immediately:
                  </p>
                  <Link
                    href={demoResetLink}
                    className="action-primary py-1.5 px-3 text-xs font-bold rounded flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/login"
                  className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-300">
                  Work email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    disabled={loading}
                    className="w-full rounded-md border border-white/[0.1] bg-[#080b0e] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full action-primary py-2.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/10 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Issuing Reset Token...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
