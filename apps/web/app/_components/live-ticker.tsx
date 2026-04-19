"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown04Icon,
  ArrowUp04Icon,
} from "@hugeicons/core-free-icons";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

const TICKER_DATA: TickerItem[] = [
  { symbol: "BTC", price: 67_540, change: 2.34 },
  { symbol: "ETH", price: 3_124, change: -0.82 },
  { symbol: "SOL", price: 178.45, change: 5.12 },
  { symbol: "AAPL", price: 226.31, change: -0.41 },
  { symbol: "NVDA", price: 142.66, change: 1.18 },
  { symbol: "TSLA", price: 245.92, change: 3.45 },
  { symbol: "MSFT", price: 421.18, change: 0.62 },
  { symbol: "GOOGL", price: 178.04, change: -1.12 },
  { symbol: "META", price: 562.81, change: 1.84 },
  { symbol: "AMZN", price: 195.23, change: -0.28 },
];

export function LiveTicker() {
  const items = [...TICKER_DATA, ...TICKER_DATA];

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-black/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface-marketing to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface-marketing to-transparent"
      />
      <div className="animate-marquee flex gap-8 py-2.5 will-change-transform">
        {items.map((item, i) => {
          const positive = item.change >= 0;
          return (
            <div
              key={`${item.symbol}-${i}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[11px] font-medium text-white/70"
            >
              <span className="font-display font-semibold tracking-wider text-white/90">
                {item.symbol}
              </span>
              <span className="tabular-nums text-white/65">
                ${formatPrice(item.price)}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 tabular-nums ${
                  positive ? "text-primary" : "text-rose-400"
                }`}
              >
                <HugeiconsIcon
                  icon={positive ? ArrowUp04Icon : ArrowDown04Icon}
                  className="size-2.5"
                />
                {Math.abs(item.change).toFixed(2)}%
              </span>
              <span className="text-white/15" aria-hidden>
                ·
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatPrice(n: number): string {
  if (n >= 1000)
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
