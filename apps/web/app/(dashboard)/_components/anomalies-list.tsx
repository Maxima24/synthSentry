"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AiBrain01Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import type { AnomalySummary } from "../../_lib/types";

interface AnomaliesListProps {
  anomalies: AnomalySummary[];
  reasoning?: string[];
}

const SEVERITY_TONE: Record<AnomalySummary["severity"], string> = {
  low: "bg-emerald-500/70",
  medium: "bg-amber-500/80",
  high: "bg-rose-500",
};

const SEVERITY_LABEL_TONE: Record<AnomalySummary["severity"], string> = {
  low: "text-emerald-700 bg-emerald-100",
  medium: "text-amber-800 bg-amber-100",
  high: "text-rose-700 bg-rose-100",
};

export function AnomaliesList({
  anomalies,
  reasoning = [],
}: AnomaliesListProps) {
  const useReasoning = anomalies.length === 0 && reasoning.length > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          icon={useReasoning ? AiBrain01Icon : Alert02Icon}
          className="size-4 text-foreground/60"
        />
        <h3 className="font-display text-base font-semibold text-foreground">
          {useReasoning ? "AI reasoning" : "Active anomalies"}
        </h3>
      </div>
      <p className="mt-0.5 text-xs text-foreground/50">
        {useReasoning
          ? "How Gemini evaluated your portfolio."
          : "Outliers detected across your positions."}
      </p>

      {anomalies.length === 0 && reasoning.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/55">
          No anomalies detected. Your portfolio is behaving within expected
          ranges.
        </p>
      ) : useReasoning ? (
        <ul className="mt-4 flex flex-col gap-3">
          {reasoning.slice(0, 5).map((text, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-black/[0.04] bg-black/[0.015] px-3 py-2.5"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/40" />
              <span className="text-sm leading-relaxed text-foreground/80">
                {text}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {anomalies.slice(0, 5).map((a, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-black/[0.04] bg-black/[0.015] px-3 py-2.5"
            >
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${SEVERITY_TONE[a.severity]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {a.label}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${SEVERITY_LABEL_TONE[a.severity]}`}
                  >
                    {a.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-foreground/70">
                  {a.reason}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
