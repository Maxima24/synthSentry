"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AiBrain01Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import type { AnomalySummary } from "../../_lib/types";

interface AnomaliesListProps {
  anomalies: AnomalySummary[];
  reasoning?: string[];
  riskAnomalies?: string[];
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
  riskAnomalies = [],
}: AnomaliesListProps) {
  const hasReasoning = reasoning.length > 0;
  const hasRiskAnomalies = riskAnomalies.length > 0;
  const hasActiveAnomalies = anomalies.length > 0;
  const isEmpty = !hasReasoning && !hasRiskAnomalies && !hasActiveAnomalies;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          icon={hasActiveAnomalies ? Alert02Icon : AiBrain01Icon}
          className="size-4 text-foreground/60"
        />
        <h3 className="font-display text-base font-semibold text-foreground">
          AI risk insights
        </h3>
      </div>
      <p className="mt-0.5 text-xs text-foreground/50">
        How Gemini evaluated your portfolio.
      </p>

      {isEmpty ? (
        <p className="mt-6 text-sm text-foreground/55">
          No risk evaluation yet. Click Evaluate Risk to score this portfolio.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {hasRiskAnomalies ? (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                Anomalies detected
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {riskAnomalies.map((text, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800"
                  >
                    {text}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {hasReasoning ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                Reasoning path
              </div>
              <ol className="mt-2 flex flex-col gap-2">
                {reasoning.slice(0, 5).map((text, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-black/[0.04] bg-black/[0.015] px-3 py-2.5"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold tabular-nums text-foreground/70">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-foreground/80">
                      {text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {hasActiveAnomalies ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                Active alerts
              </div>
              <ul className="mt-2 flex flex-col gap-2">
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
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
