"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown04Icon,
  ArrowUp04Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { useAsset, useAssetHistory } from "../../_lib/queries";
import type { PriceHistory, Timeframe } from "../../_lib/types";

interface AssetDetailPanelProps {
  symbol: string;
  onClose: () => void;
}

const TIMEFRAMES: Timeframe[] = ["1h", "24h", "7d", "30d"];

export function AssetDetailPanel({ symbol, onClose }: AssetDetailPanelProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");

  const { data: asset, isLoading: loadingAsset, error } = useAsset(symbol);
  const { data: history } = useAssetHistory(symbol, timeframe);

  const positive = (asset?.change24h ?? 0) >= 0;

  return (
    <aside className="overflow-hidden rounded-card border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3 border-b border-black/[0.04] px-6 py-5">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
            {symbol.toUpperCase()}
          </div>
          <h2 className="mt-0.5 truncate font-display text-2xl font-semibold tracking-tight text-foreground">
            {asset?.name ?? symbol.toUpperCase()}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close asset panel"
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-black/[0.05] hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </button>
      </div>

      <div className="px-6 py-5">
        {loadingAsset && !asset ? (
          <div className="flex items-center gap-3 py-6 text-sm text-foreground/50">
            <BrandLoader size="sm" tone="brand" />
            Loading asset data…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : "Failed to load asset"}
          </div>
        ) : asset ? (
          <>
            <div className="flex items-baseline gap-3">
              <div className="font-display text-4xl font-semibold tabular-nums text-foreground">
                {formatUsd(asset.price, asset.currency)}
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                  positive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                <HugeiconsIcon
                  icon={positive ? ArrowUp04Icon : ArrowDown04Icon}
                  className="size-3"
                />
                {Math.abs(asset.change24h).toFixed(2)}%
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3 text-xs">
              <Stat label="Market cap" value={formatCompactUsd(asset.marketCap)} />
              <Stat label="24h volume" value={formatCompactUsd(asset.volume)} />
              <Stat label="Type" value={asset.type} />
            </dl>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                  Price history
                </span>
                <div className="flex items-center gap-1 rounded-full border border-black/[0.08] bg-white p-1">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        timeframe === tf
                          ? "bg-foreground text-background"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <PriceSparkline history={history ?? null} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </aside>
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

function PriceSparkline({ history }: { history: PriceHistory | null }) {
  if (!history || !Array.isArray(history.data) || history.data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-black/[0.015] text-xs text-foreground/50">
        No price history available
      </div>
    );
  }

  const points = history.data
    .filter((p) => typeof p?.price === "number")
    .map((p) => p.price);
  if (points.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-black/[0.015] text-xs text-foreground/50">
        No price history available
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 640;
  const h = 128;

  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * w;
      const y = h - ((p - min) / span) * (h - 12) - 6;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  const lastPositive = points[points.length - 1]! >= points[0]!;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-32 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={lastPositive ? "var(--color-primary)" : "#F87171"}
            stopOpacity="0.35"
          />
          <stop
            offset="100%"
            stopColor={lastPositive ? "var(--color-primary)" : "#F87171"}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path
        d={path}
        fill="none"
        stroke={lastPositive ? "var(--color-primary)" : "#F87171"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatUsd(n: number, currency = "USD"): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: n < 1 ? 4 : 2,
  });
}

function formatCompactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
