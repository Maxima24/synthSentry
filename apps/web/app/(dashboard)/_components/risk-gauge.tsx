"use client";

import type { RiskLevel } from "../../_lib/types";

interface RiskGaugeProps {
  score: number | null;
  level?: RiskLevel;
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score));
  const radius = 70;
  const stroke = 22;
  const circumference = Math.PI * radius;
  const arc = (pct / 100) * circumference;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <h3 className="font-display text-base font-semibold text-foreground">
        Portfolio risk
      </h3>

      <div className="relative mx-auto mt-4 flex aspect-[2/1] w-full max-w-[260px] items-center justify-center">
        <svg
          viewBox="0 0 200 110"
          className="h-full w-full"
          aria-hidden="true"
        >
          <path
            d={describeArc(100, 100, radius, 180, 360)}
            stroke="rgba(0,0,0,0.05)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={describeArc(100, 100, radius, 180, 360)}
            stroke="url(#gauge-grad)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
            strokeDashoffset={0}
          />
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--color-primary)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <div className="font-display text-3xl font-semibold text-foreground">
            {score === null ? "—" : `${Math.round(pct)}`}
            <span className="text-lg text-foreground/40">/100</span>
          </div>
          <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-foreground/50">
            {level ?? "awaiting evaluation"}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-center gap-4 pt-4 text-xs text-foreground/60">
        <Legend color="var(--color-primary)" label="Current" />
        <Legend color="rgba(0,0,0,0.1)" label="Remaining" dashed />
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-full"
        style={{
          background: color,
          backgroundImage: dashed
            ? "repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0 2px, transparent 2px 4px)"
            : undefined,
        }}
      />
      {label}
    </div>
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
