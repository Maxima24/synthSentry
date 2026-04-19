"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown04Icon,
  ArrowUp04Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "./reveal";

interface DemoHolding {
  symbol: string;
  weight: number;
  change: number;
}

interface DemoPortfolio {
  id: string;
  label: string;
  description: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  totalValue: string;
  holdings: DemoHolding[];
  reasoning: string;
}

const PORTFOLIOS: DemoPortfolio[] = [
  {
    id: "crypto",
    label: "Crypto whale",
    description: "Heavy crypto · low diversification",
    riskScore: 78,
    riskLevel: "high",
    totalValue: "$248,420",
    holdings: [
      { symbol: "BTC", weight: 52, change: 2.34 },
      { symbol: "ETH", weight: 28, change: -0.82 },
      { symbol: "SOL", weight: 15, change: 5.12 },
      { symbol: "AVAX", weight: 5, change: -1.41 },
    ],
    reasoning:
      "Concentration risk is elevated — BTC alone is 52% of NAV. Cross-asset correlation across crypto holdings exceeds 0.8, so a single drawdown cascades. Volatility cluster detected on SOL over the last 72h.",
  },
  {
    id: "tech",
    label: "Tech investor",
    description: "Growth stocks · sector concentrated",
    riskScore: 54,
    riskLevel: "medium",
    totalValue: "$184,120",
    holdings: [
      { symbol: "NVDA", weight: 32, change: 1.18 },
      { symbol: "AAPL", weight: 24, change: -0.41 },
      { symbol: "MSFT", weight: 22, change: 0.62 },
      { symbol: "META", weight: 14, change: 1.84 },
      { symbol: "GOOGL", weight: 8, change: -1.12 },
    ],
    reasoning:
      "Sector concentration in mega-cap tech amplifies macro-rate sensitivity. NVDA's 32% weight drives portfolio beta to 1.4. Add a defensive sleeve to dampen drawdowns during tech rotations.",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Diversified · risk-managed",
    riskScore: 28,
    riskLevel: "low",
    totalValue: "$312,640",
    holdings: [
      { symbol: "VOO", weight: 35, change: 0.42 },
      { symbol: "BND", weight: 25, change: 0.08 },
      { symbol: "VXUS", weight: 18, change: -0.21 },
      { symbol: "BTC", weight: 12, change: 2.34 },
      { symbol: "GLD", weight: 10, change: 0.74 },
    ],
    reasoning:
      "Healthy spread across equities, fixed income, and a 12% crypto sleeve. Bond allocation cushions equity drawdowns; gold provides a tail-risk hedge. No anomalies detected in 90-day window.",
  },
];

const LEVEL_TONE: Record<DemoPortfolio["riskLevel"], string> = {
  low: "text-emerald-300 bg-emerald-500/[0.08] border-emerald-400/30",
  medium: "text-amber-300 bg-amber-500/[0.08] border-amber-400/30",
  high: "text-rose-300 bg-rose-500/[0.08] border-rose-400/35",
  critical: "text-rose-200 bg-rose-500/[0.12] border-rose-400/50",
};

export function RiskDemoSection() {
  const [activeId, setActiveId] = useState(PORTFOLIOS[0]!.id);
  const active = PORTFOLIOS.find((p) => p.id === activeId)!;

  return (
    <section
      id="demo"
      className="relative isolate overflow-hidden bg-surface-marketing py-24 text-white sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 65%)",
        }}
      />
      <div aria-hidden className="bg-retro-grid pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/[0.07] px-3.5 py-1.5 text-[11px] font-medium text-white/85 backdrop-blur-md">
            <span className="relative inline-flex size-1.5">
              <span className="animate-pulse-soft absolute inset-0 rounded-full bg-primary/70" />
              <span className="relative size-1.5 rounded-full bg-primary" />
            </span>
            Try the risk engine
          </span>
          <h2 className="mt-5 text-balance font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Three portfolios.{" "}
            <span className="text-primary [text-shadow:0_0_40px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]">
              Three risk profiles.
            </span>
          </h2>
          <p className="mt-4 text-balance text-base text-neutral-400 sm:text-lg">
            Click a preset and watch Synth Sentry score the portfolio, surface
            weaknesses, and explain the why — in plain English.
          </p>
        </Reveal>

        <Reveal
          delay={120}
          className="mt-7 flex flex-wrap items-center justify-center gap-2"
        >
          {PORTFOLIOS.map((p) => {
            const active = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                aria-pressed={active}
                className={`group relative cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  active
                    ? "border-primary/55 bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.15),0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent),0_6px_18px_-8px_color-mix(in_oklab,var(--color-primary)_70%,transparent)]"
                    : "border-white/15 bg-white/[0.02] text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/25 hover:bg-white/[0.045]"
                }`}
              >
                <div className="text-sm font-semibold">{p.label}</div>
                <div
                  className={`text-[10px] font-medium ${
                    active ? "text-primary-foreground/85" : "text-neutral-300/90"
                  }`}
                >
                  {p.description}
                </div>
              </button>
            );
          })}
        </Reveal>

        <Reveal
          delay={220}
          className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          <div className="lg:col-span-5">
            <DemoGauge portfolio={active} />
          </div>
          <div className="lg:col-span-7">
            <DemoHoldings portfolio={active} />
          </div>
          <div className="lg:col-span-12">
            <DemoReasoning portfolio={active} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function DemoGauge({ portfolio }: { portfolio: DemoPortfolio }) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklab, var(--color-primary) 8%, transparent), transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Overall risk
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            LEVEL_TONE[portfolio.riskLevel]
          }`}
        >
          {portfolio.riskLevel}
        </span>
      </div>

      <div className="relative mx-auto mt-4 flex aspect-[2/1] w-full max-w-[280px] items-center justify-center">
        <Gauge score={portfolio.riskScore} />
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <div className="font-display text-4xl font-semibold tabular-nums text-white">
            {Math.round(portfolio.riskScore)}
            <span className="text-xl text-neutral-500">/100</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Total value
          </div>
          <div className="mt-1 font-display text-xl font-semibold tabular-nums text-white">
            {portfolio.totalValue}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Holdings
          </div>
          <div className="mt-1 font-display text-xl font-semibold tabular-nums text-white">
            {portfolio.holdings.length}
          </div>
        </div>
      </div>
    </div>
  );
}

function Gauge({ score }: { score: number }) {
  const radius = 70;
  const stroke = 22;
  const circumference = Math.PI * radius;
  const arc = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hero-gauge-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="hero-gauge-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.35" />
          <stop offset="60%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id="hero-gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={describeArc(100, 100, radius, 180, 360)}
        stroke="color-mix(in oklab, var(--color-primary) 10%, rgba(255,255,255,0.04))"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={describeArc(100, 100, radius, 180, 360)}
        stroke="url(#hero-gauge-grad)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${arc} ${circumference}`}
        filter="url(#hero-gauge-glow)"
        style={{
          transition: "stroke-dasharray 800ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      <path
        d={describeArc(100, 100, radius, 180, 360)}
        stroke="url(#hero-gauge-sheen)"
        strokeWidth={stroke - 10}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${arc} ${circumference}`}
        style={{
          transition: "stroke-dasharray 800ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </svg>
  );
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function DemoHoldings({ portfolio }: { portfolio: DemoPortfolio }) {
  return (
    <div
      className="relative h-full overflow-hidden rounded-2xl border border-white/10 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 100% 0%, color-mix(in oklab, var(--color-primary) 6%, transparent), transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Allocation
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
          % of NAV
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {portfolio.holdings.map((h) => {
          const positive = h.change >= 0;
          return (
            <li key={h.symbol} className="space-y-1.5">
              <div className="grid grid-cols-[1fr_auto_72px] items-center gap-4 text-xs">
                <span className="font-mono text-xs tracking-wide text-white/90">
                  {h.symbol}
                </span>
                <span className="justify-self-end font-semibold tabular-nums text-white">
                  {h.weight}%
                </span>
                <span
                  className={`inline-flex items-center justify-end gap-0.5 text-[11px] font-medium tabular-nums ${
                    positive ? "text-primary" : "text-rose-300"
                  }`}
                >
                  <HugeiconsIcon
                    icon={positive ? ArrowUp04Icon : ArrowDown04Icon}
                    className="size-2.5"
                  />
                  {Math.abs(h.change).toFixed(2)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(0,0,0,0.35)]">
                <div
                  className="h-full rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-[width] duration-700 ease-out"
                  style={{
                    width: `${h.weight}%`,
                    background:
                      "linear-gradient(90deg, color-mix(in oklab, var(--color-primary) 72%, white) 0%, var(--color-primary) 60%, color-mix(in oklab, var(--color-primary) 85%, black) 100%)",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DemoReasoning({ portfolio }: { portfolio: DemoPortfolio }) {
  const text = useTypewriter(portfolio.reasoning, [portfolio.id]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
      style={{
        background:
          "radial-gradient(ellipse 50% 80% at 0% 0%, color-mix(in oklab, var(--color-primary) 10%, transparent), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <HugeiconsIcon icon={SparklesIcon} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Gemini reasoning
            </span>
            <span className="size-1 rounded-full bg-primary/70" />
            <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">
              ~1.2s eval
            </span>
          </div>
          <p className="mt-3 min-h-[3.5rem] max-w-prose text-sm leading-loose text-white/90">
            {text}
            <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-primary" />
          </p>
        </div>
      </div>
    </div>
  );
}

function useTypewriter(target: string, deps: unknown[]): string {
  const [shown, setShown] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(target);
      return;
    }

    indexRef.current = 0;
    setShown("");
    const timer = setInterval(() => {
      indexRef.current += 2;
      if (indexRef.current >= target.length) {
        setShown(target);
        clearInterval(timer);
      } else {
        setShown(target.slice(0, indexRef.current));
      }
    }, 18);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return shown;
}
