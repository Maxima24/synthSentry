"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  ArrowUp04Icon,
} from "@hugeicons/core-free-icons";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: { text: string; positive?: boolean };
  variant?: "default" | "primary";
}

export function StatCard({ label, value, delta, variant = "default" }: StatCardProps) {
  const isPrimary = variant === "primary";

  return (
    <div
      className={`group relative overflow-hidden rounded-card p-5 transition-shadow ${
        isPrimary
          ? "bg-primary text-primary-foreground shadow-[0_10px_40px_-14px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]"
          : "border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`text-sm font-medium ${
            isPrimary ? "text-primary-foreground/80" : "text-foreground/60"
          }`}
        >
          {label}
        </div>
        <div
          className={`flex size-7 items-center justify-center rounded-full ${
            isPrimary
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-black/[0.04] text-foreground/60"
          }`}
        >
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5" />
        </div>
      </div>

      <div
        className={`mt-6 font-display text-5xl font-semibold tracking-tight ${
          isPrimary ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {value}
      </div>

      {delta ? (
        <div
          className={`mt-5 inline-flex items-center gap-1.5 text-xs font-medium ${
            isPrimary
              ? "text-primary-foreground/80"
              : delta.positive
                ? "text-emerald-700"
                : "text-foreground/60"
          }`}
        >
          {delta.positive ? (
            <span
              className={`flex size-4 items-center justify-center rounded-md ${
                isPrimary ? "bg-primary-foreground/15" : "bg-emerald-100"
              }`}
            >
              <HugeiconsIcon icon={ArrowUp04Icon} className="size-3" />
            </span>
          ) : null}
          {delta.text}
        </div>
      ) : null}
    </div>
  );
}
