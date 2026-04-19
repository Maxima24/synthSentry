"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import type { AlertConfig } from "../../_lib/types";

interface RemindersCardProps {
  alerts: AlertConfig[];
}

export function RemindersCard({ alerts }: RemindersCardProps) {
  const next = alerts[0];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Alert02Icon} className="size-4 text-foreground/60" />
        <h3 className="font-display text-base font-semibold text-foreground">
          Reminders
        </h3>
      </div>

      {next ? (
        <>
          <div className="mt-4">
            <div className="font-display text-xl font-semibold leading-tight text-foreground">
              {next.reason || "Price threshold alert"}
            </div>
            <div className="mt-2 text-xs text-foreground/55">
              Threshold:{" "}
              <span className="font-medium text-foreground/80">
                {formatThreshold(next.threshold)}
              </span>
              {next.triggeredAt ? (
                <> · Triggered {formatRelative(next.triggeredAt)}</>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition-transform hover:translate-y-[-1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View alerts
            <HugeiconsIcon icon={ArrowRight02Icon} className="size-4" />
          </button>
        </>
      ) : (
        <div className="mt-4 flex flex-1 flex-col justify-between">
          <p className="text-sm leading-relaxed text-foreground/55">
            No active reminders. When an alert threshold is crossed or an
            anomaly is flagged, it will appear here.
          </p>
          <div className="mt-auto inline-flex items-center gap-2 rounded-xl bg-black/[0.04] px-4 py-3 text-sm font-medium text-foreground/60">
            All clear
          </div>
        </div>
      )}
    </div>
  );
}

function formatThreshold(value: number): string {
  if (typeof value !== "number") return String(value);
  if (Math.abs(value) >= 1) return value.toLocaleString();
  return `${(value * 100).toFixed(1)}%`;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
