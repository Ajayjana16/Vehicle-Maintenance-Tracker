"use client";

import React from "react";
import { Check } from "lucide-react";

export interface StepDef {
  number: number;
  label: string;
  shortTitle: string;
}

export const ONBOARDING_STEPS: StepDef[] = [
  { number: 1, label: "Welcome & Setup", shortTitle: "Welcome" },
  { number: 2, label: "Add Your Vehicle", shortTitle: "Vehicle" },
  { number: 3, label: "Initial Health Scan", shortTitle: "Health Scan" },
];

interface OnboardingStepperProps {
  currentStep: number;
  onSelectStep?: (step: number) => void;
}

export default function OnboardingStepper({ currentStep, onSelectStep }: OnboardingStepperProps) {
  return (
    <div className="w-full">
      {/* Mobile Step Header */}
      <div className="sm:hidden flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
            Step {currentStep} of {ONBOARDING_STEPS.length}
          </span>
          <p className="text-xs font-bold text-white">
            {ONBOARDING_STEPS[currentStep - 1]?.label}
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          {Math.round((currentStep / ONBOARDING_STEPS.length) * 100)}%
        </div>
      </div>

      {/* Desktop Stepper */}
      <div className="hidden sm:flex items-center justify-between relative max-w-lg mx-auto">
        {/* Continuous background track line */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-[2px] bg-white/[0.06] -z-0" />

        {ONBOARDING_STEPS.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div
              key={step.number}
              className="relative z-10 flex flex-col items-center group cursor-default"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20"
                    : isCurrent
                    ? "bg-amber-400 text-slate-950 ring-4 ring-amber-400/25"
                    : "bg-[#0b0e12] border border-white/[0.12] text-slate-500"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.number}
              </div>

              <span
                className={`mt-1.5 text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors ${
                  isCurrent
                    ? "text-amber-400 font-bold"
                    : isCompleted
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                {step.shortTitle}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
