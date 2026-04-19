"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { PageHead } from "../_components/page-head";
import { useAlerts } from "../../_lib/queries";
import type { AlertConfig } from "../../_lib/types";
import { CreateAlertModal } from "./_create-alert-modal";

export default function AlertsPage() {
  const { data: alerts, error, isLoading } = useAlerts();
  const [createOpen, setCreateOpen] = useState(false);

  const list = alerts ?? [];
  const active = list.filter((a) => !a.triggeredAt);
  const triggered = list.filter((a) => !!a.triggeredAt);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHead
        title="Alerts"
        subtitle={
          isLoading && !alerts
            ? "Loading…"
            : `${active.length} active · ${triggered.length} triggered`
        }
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:translate-y-[-1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            New alert
          </button>
        }
      />

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to load"}
        </div>
      ) : null}

      {isLoading && !alerts ? (
        <AlertsSkeleton />
      ) : list.length === 0 ? (
        <EmptyAlerts onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <AlertSection
            title="Active"
            empty="No active alerts — you'll be notified when a threshold crosses."
            alerts={active}
          />
          <AlertSection
            title="Triggered"
            empty="Nothing has triggered yet."
            alerts={triggered}
          />
        </div>
      )}

      <CreateAlertModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

function AlertSection({
  title,
  alerts,
  empty,
}: {
  title: string;
  alerts: AlertConfig[];
  empty: string;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="border-b border-black/[0.04] px-6 py-4">
        <h3 className="font-display text-base font-semibold text-foreground">
          {title}
        </h3>
      </div>
      {alerts.length === 0 ? (
        <p className="px-6 py-8 text-sm text-foreground/55">{empty}</p>
      ) : (
        <ul className="divide-y divide-black/[0.04]">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-6 py-4">
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                  a.triggeredAt
                    ? "bg-amber-100 text-amber-700"
                    : "bg-primary/15 text-primary-foreground"
                }`}
              >
                <HugeiconsIcon
                  icon={a.triggeredAt ? Alert02Icon : Tick02Icon}
                  className="size-4"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {a.reason || "Risk threshold alert"}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/55">
                  <span>
                    Threshold:{" "}
                    <span className="font-semibold text-foreground/80">
                      {a.threshold}
                    </span>
                  </span>
                  <span>Holding: {a.holdingId.slice(0, 8)}…</span>
                  <span>Created {formatRelative(a.createdAt)}</span>
                  {a.triggeredAt ? (
                    <span className="font-semibold text-amber-700">
                      Triggered {formatRelative(a.triggeredAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyAlerts({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-card border border-black/[0.05] bg-white px-8 py-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary-foreground">
        <HugeiconsIcon icon={Alert02Icon} className="size-6" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
        No alerts configured
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/60">
        Set a risk threshold on any holding. We&apos;ll ping you when it
        crosses the line.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <HugeiconsIcon icon={Add01Icon} className="size-4" />
        Create your first alert
      </button>
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-card border border-black/[0.04] bg-white p-6"
        >
          <div className="h-5 w-24 rounded bg-black/[0.06]" />
          <div className="mt-5 h-12 rounded-lg bg-black/[0.04]" />
          <div className="mt-3 h-12 rounded-lg bg-black/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
