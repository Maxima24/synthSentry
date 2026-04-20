"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { BrandLoader } from "../../_components/brand-loader";
import { useEvent } from "../../_lib/queries";
import type { BayseEvent } from "../../_lib/types";

interface AssetDetailPanelProps {
  eventId: string;
  onClose: () => void;
}

export function AssetDetailPanel({ eventId, onClose }: AssetDetailPanelProps) {
  const { data: event, isLoading, error } = useEvent(eventId);

  return (
    <aside className="overflow-hidden rounded-card border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3 border-b border-black/[0.04] px-6 py-5">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
            {event?.category ?? "Event"}
          </div>
          <h2 className="mt-0.5 font-display text-xl font-semibold leading-snug tracking-tight text-foreground">
            {event?.title ?? "Loading…"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail panel"
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-black/[0.05] hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </button>
      </div>

      <div className="px-6 py-5">
        {isLoading && !event ? (
          <div className="flex items-center gap-3 py-6 text-sm text-foreground/50">
            <BrandLoader size="sm" tone="brand" />
            Loading event data…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : "Failed to load event"}
          </div>
        ) : event ? (
          <EventBody event={event} />
        ) : null}
      </div>
    </aside>
  );
}

function EventBody({ event }: { event: BayseEvent }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <OutcomeCard
          label="YES"
          price={event.yesPrice}
          accent="emerald"
        />
        <OutcomeCard label="NO" price={event.noPrice} accent="rose" />
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <Stat
          label="Implied"
          value={`${Math.round(event.impliedProbability)}%`}
        />
        <Stat label="Liquidity" value={formatCompactUsd(event.liquidity)} />
        <Stat label="Volume" value={formatCompactUsd(event.totalVolume)} />
      </dl>

      {event.description ? (
        <div className="mt-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
            About
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">
            {event.description}
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-black/[0.06] bg-black/[0.015] p-4 text-xs">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
            Status
          </div>
          <div className="mt-0.5 capitalize text-foreground">{event.status}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
            Resolves
          </div>
          <div className="mt-0.5 text-foreground">
            {event.resolutionDate
              ? new Date(event.resolutionDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </div>
        </div>
      </div>

      {event.markets && event.markets.length > 1 ? (
        <div className="mt-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
            Sub-markets · {event.markets.length}
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {event.markets.slice(0, 6).map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-black/[0.05] bg-white px-3 py-2 text-xs"
              >
                <span className="truncate font-medium text-foreground">
                  {m.title}
                </span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums text-foreground/60">
                  <span className="text-emerald-700">
                    {Math.round(m.outcome1Price * 100)}¢
                  </span>
                  <span className="text-rose-700">
                    {Math.round(m.outcome2Price * 100)}¢
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function OutcomeCard({
  label,
  price,
  accent,
}: {
  label: string;
  price: number;
  accent: "emerald" | "rose";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent === "emerald"
          ? "border-emerald-200 bg-emerald-50"
          : "border-rose-200 bg-rose-50"
      }`}
    >
      <div
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          accent === "emerald" ? "text-emerald-700" : "text-rose-700"
        }`}
      >
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-semibold tabular-nums text-foreground">
        {Math.round(price * 100)}
        <span className="text-lg text-foreground/50">¢</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-black/[0.015] px-3 py-2.5">
      <dt className="text-[9px] font-semibold uppercase tracking-wider text-foreground/40">
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-display text-sm font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function formatCompactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}
