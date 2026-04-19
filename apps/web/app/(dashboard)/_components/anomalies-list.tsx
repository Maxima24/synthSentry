"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AiBrain01Icon, Alert02Icon } from "@hugeicons/core-free-icons";

interface AnomaliesListProps {
  anomalies: string[];
  reasoning?: string[];
}

export function AnomaliesList({ anomalies, reasoning = [] }: AnomaliesListProps) {
  const items = anomalies.length > 0 ? anomalies : reasoning;
  const isReasoning = anomalies.length === 0 && reasoning.length > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          icon={isReasoning ? AiBrain01Icon : Alert02Icon}
          className="size-4 text-foreground/60"
        />
        <h3 className="font-display text-base font-semibold text-foreground">
          {isReasoning ? "AI reasoning" : "Active anomalies"}
        </h3>
      </div>
      <p className="mt-0.5 text-xs text-foreground/50">
        {isReasoning
          ? "How Gemini evaluated your portfolio."
          : "Outliers detected across your holdings."}
      </p>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/55">
          No anomalies detected. Your portfolio is behaving within expected
          ranges.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.slice(0, 5).map((text, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-black/[0.04] bg-black/[0.015] px-3 py-2.5"
            >
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                  isReasoning ? "bg-foreground/40" : "bg-amber-500"
                }`}
              />
              <span className="text-sm leading-relaxed text-foreground/80">
                {text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
