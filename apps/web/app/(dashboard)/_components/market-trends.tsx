"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown04Icon,
  ArrowUp04Icon,
} from "@hugeicons/core-free-icons";
import type { MarketTrend } from "../../_lib/types";

interface MarketTrendsProps {
  trends: MarketTrend[];
}

export function MarketTrends({ trends }: MarketTrendsProps) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-card bg-surface-marketing p-6 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 100% 0%, color-mix(in oklab, var(--color-primary) 25%, transparent), transparent 60%), radial-gradient(ellipse 60% 60% at 0% 100%, color-mix(in oklab, var(--color-primary) 12%, transparent), transparent 65%)",
        }}
      />
      <div aria-hidden className="bg-retro-grid pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative z-10 flex h-full flex-col">
        <h3 className="font-display text-base font-semibold">Market trends</h3>
        <p className="mt-0.5 text-xs text-white/55">Top movers · 24h</p>

        {trends.length === 0 ? (
          <p className="mt-6 text-sm text-white/55">
            Market data temporarily unavailable.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {trends.slice(0, 3).map((t) => {
              const change = t.change24h ?? 0;
              const positive = change >= 0;
              return (
                <li
                  key={t.symbol}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-semibold">
                      {t.symbol.toUpperCase()}
                    </div>
                    <div className="truncate text-[11px] text-white/50">
                      {t.name ?? "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold tabular-nums">
                      {formatUsd(t.price)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        positive
                          ? "bg-primary/25 text-primary"
                          : "bg-rose-500/25 text-rose-300"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={positive ? ArrowUp04Icon : ArrowDown04Icon}
                        className="size-2.5"
                      />
                      {Math.abs(change).toFixed(2)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 1) return `$${n.toFixed(4)}`;
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 100 ? 2 : 0,
  });
}
