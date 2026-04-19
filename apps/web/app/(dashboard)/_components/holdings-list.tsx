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
                  {h.symbol.slice(0, 3).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {h.name ?? h.symbol.toUpperCase()}
                  </div>
                  <div className="text-xs text-foreground/50">
                    {formatQty(h.quantity)} · {h.symbol.toUpperCase()}
                  </div>
                </div>
                {typeof h.value === "number" ? (
                  <div className="flex flex-col items-end text-right">
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {formatUsd(h.value)}
                    </span>
                    {typeof h.change24h === "number" ? (
                      <span
                        className={`text-[10px] font-medium tabular-nums ${
                          h.change24h >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {h.change24h >= 0 ? "+" : ""}
                        {h.change24h.toFixed(2)}%
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
    maximumFractionDigits: 0,
  });
}
