"use client";

import React from "react";
import { Check, X } from "lucide-react";

export interface PasswordRules {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePassword(password: string): {
  rules: PasswordRules;
  score: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
} {
  const rules: PasswordRules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const count = Object.values(rules).filter(Boolean).length;

  let score = 1;
  let label: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
  let colorClass = "bg-red-500 text-red-400";

  if (count <= 2) {
    score = 1;
    label = "Weak";
    colorClass = "bg-red-500 text-red-400";
  } else if (count === 3) {
    score = 2;
    label = "Fair";
    colorClass = "bg-amber-500 text-amber-400";
  } else if (count === 4) {
    score = 3;
    label = "Good";
    colorClass = "bg-sky-400 text-sky-400";
  } else if (count === 5) {
    score = 4;
    label = "Strong";
    colorClass = "bg-emerald-500 text-emerald-400";
  }

  return { rules, score, label, colorClass };
}

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const { rules, score, label, colorClass } = evaluatePassword(password);

  return (
    <div className="space-y-2 mt-2 pt-2 border-t border-white/[0.06] text-xs">
      {/* Visual meter */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 grid grid-cols-4 gap-1.5 h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
          <div className={`h-full transition-all ${score >= 1 ? (score === 1 ? "bg-red-500" : score === 2 ? "bg-amber-500" : score === 3 ? "bg-sky-400" : "bg-emerald-500") : "bg-transparent"}`} />
          <div className={`h-full transition-all ${score >= 2 ? (score === 2 ? "bg-amber-500" : score === 3 ? "bg-sky-400" : "bg-emerald-500") : "bg-transparent"}`} />
          <div className={`h-full transition-all ${score >= 3 ? (score === 3 ? "bg-sky-400" : "bg-emerald-500") : "bg-transparent"}`} />
          <div className={`h-full transition-all ${score >= 4 ? "bg-emerald-500" : "bg-transparent"}`} />
        </div>
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${colorClass.split(" ")[1]}`}>
          {label}
        </span>
      </div>

      {/* Rules list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono">
        <div className={`flex items-center gap-1.5 ${rules.minLength ? "text-emerald-400" : "text-slate-500"}`}>
          {rules.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 text-slate-600" />}
          <span>8+ characters</span>
        </div>
        <div className={`flex items-center gap-1.5 ${rules.hasUpper ? "text-emerald-400" : "text-slate-500"}`}>
          {rules.hasUpper ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 text-slate-600" />}
          <span>Uppercase letter</span>
        </div>
        <div className={`flex items-center gap-1.5 ${rules.hasLower ? "text-emerald-400" : "text-slate-500"}`}>
          {rules.hasLower ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 text-slate-600" />}
          <span>Lowercase letter</span>
        </div>
        <div className={`flex items-center gap-1.5 ${rules.hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
          {rules.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 text-slate-600" />}
          <span>Number (0-9)</span>
        </div>
        <div className={`flex items-center gap-1.5 ${rules.hasSpecial ? "text-emerald-400" : "text-slate-500"} sm:col-span-2`}>
          {rules.hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 text-slate-600" />}
          <span>Special character (!@#$%^&*)</span>
        </div>
      </div>
    </div>
  );
}
