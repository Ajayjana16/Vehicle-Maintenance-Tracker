"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  disabled?: boolean;
  autoComplete?: string;
  helperText?: string;
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••••••",
  error,
  disabled = false,
  autoComplete = "new-password",
  helperText,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-300">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          <Lock className="h-4 w-4" />
        </div>
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full rounded-md border bg-[#080b0e] pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 ${
            error
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
              : "border-white/[0.1] focus:border-amber-400/80 focus:ring-amber-400/40"
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      {helperText && !error && <p className="text-[10px] text-slate-500 mt-1">{helperText}</p>}
    </div>
  );
}
