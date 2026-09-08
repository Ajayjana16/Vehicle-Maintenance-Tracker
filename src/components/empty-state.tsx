"use client";

import React from "react";
import { ArrowRight, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
}

export default function EmptyState({
  icon: Icon,
  eyebrow = "Nothing here yet",
  title,
  description,
  actionLabel,
  onAction,
  href,
}: EmptyStateProps) {
  const action = actionLabel && (onAction || href) ? (
    href ? (
      <a
        href={href}
        className="action-primary inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold"
      >
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    ) : (
      <button
        type="button"
        onClick={onAction}
        className="action-primary inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold"
      >
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    )
  ) : null;

  return (
    <div className="surface-panel flex min-h-56 flex-col items-center justify-center rounded-xl px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-300">
        <Icon className="h-5 w-5" />
      </div>
      <span className="eyebrow mt-4">{eyebrow}</span>
      <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
