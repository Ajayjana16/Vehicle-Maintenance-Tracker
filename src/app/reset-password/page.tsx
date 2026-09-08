"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Car,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import PasswordField from "@/components/password-field";
import PasswordStrength, { evaluatePassword } from "@/components/password-strength";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Password reset token is missing from URL.");
      return;
    }

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    const { score } = evaluatePassword(password);
    if (score < 4) {
      setError("Password does not meet the minimum security requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          newPassword: password,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to update password. Link may have expired.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 1200);
    } catch (err) {
      console.error("Reset submission error:", err);
      setError("Network connection error. Please try again.");
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
            Create new password
          </h1>
          <p className="text-xs text-slate-400">
            {email ? `Updating credentials for ${email}` : "Enter a secure replacement password."}
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

          {success ? (
            <div className="space-y-3 text-center py-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-sm font-bold text-white">Password Updated!</h2>
              <p className="text-xs text-slate-400">
                Redirecting you to sign in with your new credentials...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <PasswordField
                  id="reset-password-new"
                  label="New Password *"
                  value={password}
                  onChange={setPassword}
                  helperText="Must be 8+ characters with uppercase, lowercase, number, and symbol."
                />
                <PasswordStrength password={password} />
              </div>

              <PasswordField
                id="reset-password-confirm"
                label="Confirm New Password *"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full action-primary py-2.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/10 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
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
                  <span>Cancel and Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
