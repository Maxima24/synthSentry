"use client";

import type { RiskSnapshot } from "../../_lib/types";

interface RiskHistoryChartProps {
  snapshots: RiskSnapshot[];
}

const BAR_COUNT = 7;
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function RiskHistoryChart({ snapshots }: RiskHistoryChartProps) {
  const bars = buildBars(snapshots);
  const maxIndex = bars.reduce(
    (best, b, i) => (b.value !== null && b.value > (bars[best]?.value ?? -1) ? i : best),
    0
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Risk analytics
          </h3>
          <p className="mt-0.5 text-xs text-foreground/50">
            Last 7 risk evaluations · 0–100 scale
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-1 items-end gap-3 sm:gap-4">
        {bars.map((bar, i) => (
          <Bar
            key={i}
            value={bar.value}
            label={DAY_LABELS[i] ?? ""}
            highlight={i === maxIndex && bar.value !== null}
          />
        ))}
      </div>
    </div>
  );
}

function Bar({
  value,
  label,
  highlight,
}: {
  value: number | null;
  label: string;
  highlight: boolean;
}) {
  const height = value === null ? 30 : Math.max(18, Math.min(100, value));
  const isEmpty = value === null;

  return (
    <div className="relative flex flex-1 flex-col items-center">
      {highlight && value !== null ? (
        <div className="absolute -top-7 rounded-full border border-black/[0.06] bg-white px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
          {Math.round(value)}
        </div>
      ) : null}
      <div
        className="w-full max-w-[56px] origin-bottom rounded-full transition-all"
        style={{
          height: `${height}%`,
          background: isEmpty
            ? "repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 4px, rgba(0,0,0,0.08) 4px 8px)"
            : highlight
              ? "linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 88%, black) 0%, color-mix(in oklab, var(--color-primary) 55%, black) 100%)"
              : "linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 45%, white) 0%, color-mix(in oklab, var(--color-primary) 25%, white) 100%)",
          minHeight: 60,
        }}
      />
      <span className="mt-3 text-xs font-medium text-foreground/50">
        {label}
      </span>
    </div>
  );
}

function buildBars(
  snapshots: RiskSnapshot[]
): { value: number | null }[] {
  const recent = [...snapshots]
    .sort(
      (a, b) =>
        new Date(a.snapShotAt).getTime() - new Date(b.snapShotAt).getTime()
    )
    .slice(-BAR_COUNT);

  const bars: { value: number | null }[] = Array.from({ length: BAR_COUNT }, () => ({
    value: null,
  }));
  const startIdx = BAR_COUNT - recent.length;
  recent.forEach((snap, i) => {
    bars[startIdx + i] = { value: snap.overallScore };
  });
  return bars;
}
