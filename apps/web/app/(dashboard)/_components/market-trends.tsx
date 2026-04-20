"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown04Icon,
  ArrowUp04Icon,
} from "@hugeicons/core-free-icons";
import type { MarketTrendEvent } from "../../_lib/types";

interface MarketTrendsProps {
  trends: MarketTrendEvent[];
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
      <div
        aria-hidden
        className="bg-retro-grid pointer-events-none absolute inset-0 opacity-30"
      />

      <div className="relative z-10 flex h-full flex-col">
        <h3 className="font-display text-base font-semibold">Trending markets</h3>
        <p className="mt-0.5 text-xs text-white/55">Most active prediction events</p>

        {trends.length === 0 ? (
          <p className="mt-6 text-sm text-white/55">
            Market data temporarily unavailable.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {trends.slice(0, 3).map((t) => {
              const bullish = t.trend === "bullish";
              return (
                <li key={t.eventId} className="flex items-start gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 font-display text-xs font-semibold leading-snug">
                      {t.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-white/45">
                      <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                        {t.category}
                      </span>
                      <span className="tabular-nums">
                        ${formatLiquidity(t.liquidity)} liq
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-display text-sm font-semibold tabular-nums">
                      {formatShareCents(t.yesPrice)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        bullish
                          ? "bg-primary/25 text-primary"
                          : "bg-rose-500/25 text-rose-300"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={bullish ? ArrowUp04Icon : ArrowDown04Icon}
                        className="size-2.5"
                      />
                      {t.trend}
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

function formatShareCents(p: number): string {
  if (!Number.isFinite(p)) return "—";
  return `${Math.round(p * 100)}¢`;
}

function formatLiquidity(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}
