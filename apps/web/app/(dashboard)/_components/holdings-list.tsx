"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useDeleteHolding } from "../../_lib/queries";
import type { Holding } from "../../_lib/types";

interface HoldingsListProps {
  holdings: Holding[];
  portfolioId: string | null;
  onAdd: () => void;
}

const SYMBOL_COLORS = [
  "#C6F432",
  "#60A5FA",
  "#F59E0B",
  "#FB7185",
  "#34D399",
  "#A78BFA",
];

export function HoldingsList({ holdings, portfolioId, onAdd }: HoldingsListProps) {
  const deleteHolding = useDeleteHolding(portfolioId ?? undefined);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground">
          Holdings
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
          New
        </button>
      </div>

      {holdings.length === 0 ? (
        <div className="mt-6 flex flex-1 flex-col items-start gap-3">
          <p className="text-sm text-foreground/55">
            No holdings yet. Add one to start risk scoring.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background transition-transform hover:translate-y-[-1px]"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
            Add first holding
          </button>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {holdings.slice(0, 6).map((h, i) => {
            const isDeleting =
              deleteHolding.isPending && deleteHolding.variables === h.id;
            const label = h.eventTitle ?? h.symbol;
            const initials = (label.match(/\b\w/g) || [])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "EV";
            return (
              <li
                key={h.id}
                className="group flex items-center gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-black/[0.015]"
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-primary-foreground"
                  style={{
                    background: SYMBOL_COLORS[i % SYMBOL_COLORS.length],
                  }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {label}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-foreground/55">
                    {h.outcome ? (
                      <span className="rounded bg-black/[0.05] px-1 py-0.5 text-[9px] font-bold text-foreground/70">
                        {h.outcome}
                      </span>
                    ) : null}
                    <span>{formatQty(h.quantity)} sh</span>
                    <span className="tabular-nums">
                      @ {formatCents(h.entryPrice)}
                    </span>
                    {typeof h.currentPrice === "number" ? (
                      <span className="tabular-nums text-foreground/70">
                        → {formatCents(h.currentPrice)}
                      </span>
                    ) : (
                      <span className="text-amber-700">— stale</span>
                    )}
                  </div>
                </div>
                {typeof h.currentValue === "number" ? (
                  <div className="flex flex-col items-end text-right">
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {formatUsd(h.currentValue)}
                    </span>
                    {typeof h.pnl === "number" && h.costBasis > 0 ? (
                      <span
                        className={`text-[10px] font-medium tabular-nums ${
                          h.pnl > 0
                            ? "text-emerald-600"
                            : h.pnl < 0
                              ? "text-rose-600"
                              : "text-foreground/55"
                        }`}
                      >
                        {h.pnl > 0 ? "+" : ""}
                        {formatUsd(h.pnl)}
                        {typeof h.pnlPercent === "number"
                          ? ` (${h.pnlPercent.toFixed(1)}%)`
                          : ""}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => deleteHolding.mutate(h.id)}
                  disabled={isDeleting}
                  aria-label={`Remove ${h.symbol}`}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-full text-foreground/40 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatQty(q: number | string): string {
  const n = typeof q === "string" ? Number(q) : q;
  if (!Number.isFinite(n)) return String(q);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatUsd(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatCents(p: number): string {
  return `${Math.round(p * 100)}¢`;
}
