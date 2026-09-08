"use client";

import React from "react";
import { X, ShieldCheck, FileText } from "lucide-react";

interface TermsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "terms" | "privacy";
}

export default function TermsDialog({ isOpen, onClose, type = "terms" }: TermsDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-white/[0.1] bg-[#0d1014] p-6 shadow-2xl text-left relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-amber-400">
            {type === "terms" ? <FileText className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {type === "terms" ? "AutoPulse Terms of Service" : "AutoPulse Privacy Policy"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs text-slate-300 leading-relaxed font-sans pr-2">
          {type === "terms" ? (
            <>
              <p>
                <strong>Effective Date:</strong> January 1, 2026. These Terms of Service (&ldquo;Agreement&rdquo;) govern your
                access to and personal use of the AutoPulse Vehicle Health and Diagnostic Intelligence Platform.
              </p>
              <div>
                <h3 className="font-bold text-white mb-1">1. Personal Vehicle Health Account</h3>
                <p>
                  You retain all ownership and privacy rights to your vehicle telemetry, diagnostic scans, and maintenance logbooks.
                  AutoPulse provides tooling to assist in vehicle maintenance tracking and diagnostic interpretation.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">2. Diagnostic Interpretation & Safety Disclaimer</h3>
                <p>
                  AutoPulse provides OBD-II fault code explanations, predictive wear estimations, and maintenance scheduling tips.
                  AI diagnostic summaries are informational and do not replace formal certified mechanic inspections. You remain
                  responsible for safe vehicle operation and driving decisions.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">3. Account Security</h3>
                <p>
                  You agree to protect your personal account credentials and notify us if you suspect unauthorized access.
                </p>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>Effective Date:</strong> January 1, 2026. This Privacy Policy details how AutoPulse safeguards your personal
                vehicle data and maintenance records.
              </p>
              <div>
                <h3 className="font-bold text-white mb-1">1. Telemetry Data Protection</h3>
                <p>
                  All vehicle sensor data (CAN-bus, OBD-II, diagnostic trouble codes, fuel logs) is encrypted in transit
                  using TLS 1.3 and at rest with AES-256 encryption.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">2. Personal Privacy</h3>
                <p>
                  AutoPulse never sells, rents, or monetizes personal vehicle telemetry, mileage logs, or location data to third parties or advertisers.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="action-secondary py-1.5 px-4 text-xs font-semibold rounded-md"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
