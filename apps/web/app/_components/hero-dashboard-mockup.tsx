"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  ArrowDown01Icon,
  ArrowDown04Icon,
  ArrowUp04Icon,
  ChartLineData02Icon,
  DashboardSquare02Icon,
  Notification03Icon,
  PieChart09Icon,
  Search01Icon,
  Settings02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Position {
  /** Short ticker chip — first letters of the event title */
  symbol: string;
  /** Full event title shown to the user */
  title: string;
  outcome: "YES" | "NO";
  shares: number;
  /** Implied probability paid in (0.00–1.00) */
  entryPrice: number;
  /** Current implied probability (0.00–1.00) */
  currentPrice: number;
}

const SEED: Position[] = [
  {
    symbol: "BTC",
    title: "Will BTC be above $100k by EOY?",
    outcome: "YES",
    shares: 100,
    entryPrice: 0.55,
    currentPrice: 0.62,
  },
  {
    symbol: "ARS",
    title: "Will Arsenal qualify vs Atletico?",
    outcome: "YES",
    shares: 80,
    entryPrice: 0.66,
    currentPrice: 0.71,
  },
  {
    symbol: "PSG",
    title: "UEFA Champions League: PSG wins?",
    outcome: "NO",
    shares: 60,
    entryPrice: 0.45,
    currentPrice: 0.4,
  },
  {
    symbol: "REC",
    title: "US recession declared by Q3?",
    outcome: "NO",
    shares: 50,
    entryPrice: 0.38,
    currentPrice: 0.32,
  },
  {
    symbol: "DEB",
    title: "Trump–Vance debate margin >5pts?",
    outcome: "YES",
    shares: 40,
    entryPrice: 0.42,
    currentPrice: 0.45,
  },
];

export function HeroDashboardMockup() {
  const [positions, setPositions] = useState(SEED);
  const [riskScore, setRiskScore] = useState(54);
  const [url, setUrl] = useState("synthsentry.app/dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(`${window.location.host}/dashboard`);
    }

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const id = setInterval(() => {
      setPositions((prev) =>
        prev.map((p) => {
          // Implied probability drifts in cents, clamped to [0.02, 0.98]
          const drift = (Math.random() - 0.5) * 0.012;
          const next = Math.min(0.98, Math.max(0.02, p.currentPrice + drift));
          return { ...p, currentPrice: next };
        }),
      );
      setRiskScore((s) => {
        const next = s + (Math.random() - 0.5) * 1.4;
        return Math.max(28, Math.min(82, next));
      });
    }, 1800);

    return () => clearInterval(id);
  }, []);

  const totalValue = positions.reduce(
    (sum, p) => sum + p.shares * p.currentPrice,
    0,
  );
  const totalCost = positions.reduce(
    (sum, p) => sum + p.shares * p.entryPrice,
    0,
  );
  const totalPnl = totalValue - totalCost;

  return (
    <div className="relative isolate w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 -bottom-8 -top-12 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent 70%)",
        }}
      />

      <div className="overflow-hidden rounded-[24px] border border-white/15 bg-white shadow-[0_40px_120px_-30px_rgba(0,0,0,0.55)]">
        <BrowserChrome url={url} />

        <div className="flex min-h-[480px]">
          <MockSidebar />
          <div className="flex min-w-0 flex-1 flex-col bg-background">
            <MockTopbar />
            <div className="flex-1 space-y-4 p-5 sm:p-6">
              <MockPageHeader totalValue={totalValue} totalPnl={totalPnl} />
              <MockStats
                totalValue={totalValue}
                totalCost={totalCost}
                riskScore={riskScore}
                openPositions={positions.length}
              />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <MockChart riskScore={riskScore} />
                </div>
                <div className="lg:col-span-5">
                  <MockHoldings positions={positions} />
                </div>
              </div>
              <MockReasoning />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserChrome({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-black/[0.08] bg-[#F4F4F5] px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-[#FF5F57]" />
        <span className="size-3 rounded-full bg-[#FEBC2E]" />
        <span className="size-3 rounded-full bg-[#28C840]" />
      </div>
      <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-md border border-black/[0.06] bg-white px-3 py-1 text-[11px] text-foreground/55">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        {url}
      </div>
      <div className="w-12" />
    </div>
  );
}

const NAV_ITEMS = [
  { icon: DashboardSquare02Icon, label: "Dashboard", active: true },
  { icon: PieChart09Icon, label: "Portfolios" },
  { icon: Alert02Icon, label: "Alerts" },
  { icon: ChartLineData02Icon, label: "Markets" },
];

function MockSidebar() {
  return (
    <aside className="hidden w-[172px] shrink-0 flex-col border-r border-black/[0.05] bg-white px-3 py-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <Image
          src="/synth_sentry_emblem.png"
          alt=""
          width={48}
          height={48}
          priority
          className="size-6 object-contain"
        />
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          Synth Sentry
        </span>
      </div>
      <div className="px-2 pb-2 text-[9px] font-semibold uppercase tracking-wider text-foreground/40">
        Menu
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item, i) => (
          <span
            key={i}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              item.active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/60"
            }`}
          >
            <HugeiconsIcon icon={item.icon} className="size-3.5" />
            {item.label}
          </span>
        ))}
      </nav>
      <div className="mt-5 px-2 pb-2 text-[9px] font-semibold uppercase tracking-wider text-foreground/40">
        General
      </div>
      <nav className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground/60">
          <HugeiconsIcon icon={Settings02Icon} className="size-3.5" />
          Settings
        </span>
      </nav>
    </aside>
  );
}

function MockTopbar() {
  return (
    <div className="flex items-center gap-3 border-b border-black/[0.04] px-5 py-3">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-black/[0.06] bg-black/[0.02] px-3 py-1.5 text-[11px] text-foreground/45">
        <HugeiconsIcon icon={Search01Icon} className="size-3" />
        Search markets…
        <span className="ml-auto rounded border border-black/[0.06] bg-white px-1 py-px font-mono text-[9px]">
          ⌘K
        </span>
      </div>
      <span className="relative hidden size-7 items-center justify-center rounded-full border border-black/[0.06] bg-white text-foreground/60 sm:flex">
        <HugeiconsIcon icon={Notification03Icon} className="size-3" />
        <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
          2
        </span>
      </span>
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-[10px] font-bold text-primary-foreground">
          EI
        </div>
        <div className="hidden flex-col leading-tight sm:flex">
          <span className="text-[11px] font-semibold text-foreground">
            Synth Dev
          </span>
          <span className="text-[9px] text-foreground/45">dev@synth.io</span>
        </div>
      </div>
    </div>
  );
}

function MockPageHeader({
  totalValue,
  totalPnl,
}: {
  totalValue: number;
  totalPnl: number;
}) {
  const positive = totalPnl >= 0;
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[10px] font-semibold text-foreground">
            <HugeiconsIcon icon={PieChart09Icon} className="size-2.5" />
            Main portfolio
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className="size-2.5 text-foreground/50"
            />
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[10px] text-foreground/50">Portfolio value</span>
          <span className="font-display text-sm font-semibold tabular-nums text-foreground">
            {formatFullUsd(totalValue)}
          </span>
          <span
            className={`text-[10px] font-medium tabular-nums ${
              positive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {positive ? "+" : ""}
            {formatFullUsd(totalPnl)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="hidden items-center gap-1.5 rounded-full border border-black/[0.1] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-foreground sm:inline-flex">
          <HugeiconsIcon icon={SparklesIcon} className="size-3" />
          Evaluate risk
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1.5 text-[10px] font-semibold text-background">
          <HugeiconsIcon icon={Add01Icon} className="size-3" />
          Add holding
        </span>
      </div>
    </div>
  );
}

function MockStats({
  totalValue,
  totalCost,
  riskScore,
  openPositions,
}: {
  totalValue: number;
  totalCost: number;
  riskScore: number;
  openPositions: number;
}) {
  const pnl = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  const riskLevel =
    riskScore < 25
      ? "low"
      : riskScore < 50
        ? "medium"
        : riskScore < 75
          ? "high"
          : "critical";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label="Portfolio value"
        value={formatCompactUsd(totalValue)}
        delta={`${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}% vs cost`}
        primary
      />
      <StatTile
        label="Open positions"
        value={`${openPositions}`}
        delta="across 1 portfolio"
      />
      <StatTile
        label="Risk score"
        value={Math.round(riskScore).toString()}
        delta={`${riskLevel} risk`}
      />
      <StatTile label="Active alerts" value="2" delta="1 anomaly flagged" />
    </div>
  );
}

function StatTile({
  label,
  value,
  delta,
  primary,
}: {
  label: string;
  value: string;
  delta: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ${
        primary
          ? "bg-primary text-primary-foreground shadow-[0_10px_40px_-14px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]"
          : "border border-black/[0.05] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div
        className={`text-[10px] font-medium uppercase tracking-wider ${
          primary ? "text-primary-foreground/75" : "text-foreground/45"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 font-display text-xl font-semibold tabular-nums ${
          primary ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div
        className={`mt-1 text-[10px] font-medium ${
          primary ? "text-primary-foreground/80" : "text-foreground/55"
        }`}
      >
        {delta}
      </div>
    </div>
  );
}

function MockChart({ riskScore }: { riskScore: number }) {
  const bars = [42, 38, 45, 52, 48, riskScore, riskScore + 2];
  const max = 90;
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-sm font-semibold text-foreground">
            Risk analytics
          </div>
          <div className="text-[10px] text-foreground/45">
            7-day trend · live
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
          <span className="relative inline-flex size-1.5">
            <span className="animate-pulse-soft absolute inset-0 rounded-full bg-primary/70" />
            <span className="relative size-1.5 rounded-full bg-primary" />
          </span>
          live
        </span>
      </div>
      <div className="mt-5 flex h-40 items-stretch gap-2">
        {bars.map((b, i) => {
          const isLast = i === bars.length - 2;
          const heightPct = Math.max(22, (b / max) * 100);
          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center justify-end"
            >
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[28px] rounded-full transition-all duration-700 ease-out"
                  style={{
                    height: `${heightPct}%`,
                    background: isLast
                      ? "linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 92%, black), color-mix(in oklab, var(--color-primary) 60%, black))"
                      : "linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 38%, white), color-mix(in oklab, var(--color-primary) 18%, white))",
                  }}
                />
              </div>
              <span className="mt-2 text-[10px] font-medium text-foreground/40">
                {DAYS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SYMBOL_COLORS = ["#C6F432", "#60A5FA", "#F59E0B", "#A78BFA"];

function MockHoldings({ positions }: { positions: Position[] }) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <div className="font-display text-sm font-semibold text-foreground">
          Holdings
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] px-2 py-0.5 text-[10px] font-semibold text-foreground/60">
          <HugeiconsIcon icon={Add01Icon} className="size-2.5" />
          New
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {positions.slice(0, 4).map((p, i) => {
          const value = p.shares * p.currentPrice;
          const pnlPct = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100;
          const positive = pnlPct >= 0;
          return (
            <li key={p.symbol} className="flex items-center gap-2.5">
              <span
                className="flex size-7 items-center justify-center rounded-md font-display text-[9px] font-bold text-primary-foreground"
                style={{
                  background: SYMBOL_COLORS[i % SYMBOL_COLORS.length],
                }}
              >
                {p.symbol}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {p.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-foreground/45">
                  <span className="rounded bg-black/[0.05] px-1 py-px font-bold text-foreground/70">
                    {p.outcome}
                  </span>
                  <span className="tabular-nums">{p.shares} sh</span>
                  <span className="tabular-nums">
                    @ {formatCents(p.entryPrice)}
                  </span>
                  <span className="tabular-nums text-foreground/65">
                    → {formatCents(p.currentPrice)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {formatFullUsd(value)}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-medium tabular-nums ${
                    positive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  <HugeiconsIcon
                    icon={positive ? ArrowUp04Icon : ArrowDown04Icon}
                    className="size-2"
                  />
                  {Math.abs(pnlPct).toFixed(1)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MockReasoning() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-foreground">
        <HugeiconsIcon icon={SparklesIcon} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
            Gemini reasoning
          </span>
          <span className="size-1 rounded-full bg-primary/70" />
          <span className="text-[10px] text-foreground/45">~1.2s eval</span>
        </div>
        <p className="mt-1 max-w-prose text-xs leading-relaxed text-foreground/75">
          Two sports positions (Arsenal qualify + UCL winner) are correlated —
          a single match outcome moves both. BTC YES @ 62¢ near 50/50 inflection
          carries elevated tail risk. Recession NO position hedges against the
          equity-correlated longs.
        </p>
      </div>
    </div>
  );
}

function formatCompactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function formatFullUsd(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatCents(p: number): string {
  return `${Math.round(p * 100)}¢`;
}
