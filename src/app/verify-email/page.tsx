"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Car,
  Edit2,
  Check,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const emailFromUrl = searchParams.get("email");

  const { user, refreshUser } = useAuth();

  const [targetEmail, setTargetEmail] = useState(emailFromUrl || user?.email || "owner@example.com");
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(targetEmail);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      setTargetEmail(user.email);
      setNewEmailInput(user.email);
    }
  }, [user]);

  const handleVerify = React.useCallback(async (token?: string) => {
    try {
      setVerifying(true);
      setError(null);

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || tokenFromUrl || undefined,
          email: targetEmail,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Email verification failed. The link may have expired.");
        setVerifying(false);
        return;
      }

      setVerified(true);
      await refreshUser();
    } catch (err) {
      console.error("Verification error:", err);
      setError("Network error occurred during verification.");
    } finally {
      setVerifying(false);
    }
  }, [tokenFromUrl, targetEmail, refreshUser]);

  useEffect(() => {
    if (tokenFromUrl && !verified) {
      void handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl, verified, handleVerify]);

  const handleResend = () => {
    setResending(true);
    setResendNotice(null);
    setTimeout(() => {
      setResending(false);
      setResendNotice(`A fresh verification link has been dispatched to ${targetEmail} (Demo mode simulated).`);
    }, 600);
  };

  const handleSaveEmail = () => {
    if (!newEmailInput.trim() || !newEmailInput.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setTargetEmail(newEmailInput.trim().toLowerCase());
    setEditingEmail(false);
    setError(null);
    setResendNotice(`Updated recipient to ${newEmailInput.trim().toLowerCase()}.`);
  };

  return (
    <div className="min-h-screen bg-[#07090b] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-[460px] relative z-10 space-y-6 my-auto">
        {/* Brand */}
        <div className="text-center space-y-1">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-sm">
              <Car className="h-4 w-4" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-white leading-none">
              AUTOPULSE
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Check your inbox
          </h1>
          <p className="text-xs text-slate-400">
            We sent a verification link to confirm your email.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0f13] p-6 sm:p-7 shadow-2xl backdrop-blur-sm text-center space-y-5">
          {/* Icon */}
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 mx-auto shadow-md">
            {verified ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            ) : (
              <Mail className="h-7 w-7" />
            )}
          </div>

          {/* Status Notifications */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 text-left animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 leading-snug">{error}</div>
            </div>
          )}

          {resendNotice && (
            <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-300 text-left animate-in fade-in duration-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
              <div className="flex-1 leading-snug">{resendNotice}</div>
            </div>
          )}

          {/* Verification Target Box */}
          <div className="p-3.5 rounded-lg bg-[#080b0e] border border-white/[0.06] text-xs text-slate-300 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                Email Address
              </span>
              {!editingEmail && !verified && (
                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <Edit2 className="h-2.5 w-2.5" />
                  <span>Change</span>
                </button>
              )}
            </div>

            {editingEmail ? (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="flex-1 rounded border border-amber-400/60 bg-[#0c0f12] px-2 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  className="action-primary py-1 px-2 text-[11px] rounded"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEmail(false);
                    setNewEmailInput(targetEmail);
                  }}
                  className="action-secondary py-1 px-2 text-[11px] rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="font-mono text-white font-semibold truncate text-xs">
                {targetEmail}
              </p>
            )}
          </div>

          {/* Verified State or Actions */}
          {verified ? (
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 font-medium">
                Email verified successfully! Your account is active.
              </div>
              <button
                onClick={() => router.push("/onboarding")}
                className="w-full action-primary py-2.5 text-xs font-bold rounded-md flex items-center justify-center gap-2"
              >
                <span>Continue to Vehicle Setup</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {/* Demo Mode Simulation Notice */}
              <div className="p-2.5 rounded border border-amber-500/20 bg-amber-500/5 text-left text-[11px] text-amber-300/90 leading-relaxed font-mono">
                <span className="font-bold text-amber-400 uppercase tracking-wider block text-[9px] mb-0.5">
                  [DEMO ENVIRONMENT STATE]
                </span>
                No external SMTP email server is required in this build. You can simulate clicking the email confirmation link below:
              </div>

              {/* Instant Verification Simulation Button */}
              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={verifying}
                className="w-full action-primary py-2.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/10"
              >
                {verifying ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Token...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Simulate Email Confirmation (Demo)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                  <span>Resend verification email</span>
                </button>

                <Link
                  href="/login"
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090b] flex items-center justify-center"><div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
