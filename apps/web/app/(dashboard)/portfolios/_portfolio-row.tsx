"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  Delete02Icon,
  PieChart09Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { BrandLoader } from "../../_components/brand-loader";
import {
  useDeleteHolding,
  useEvaluateRisk,
  usePortfolio,
} from "../../_lib/queries";
import type { Portfolio } from "../../_lib/types";

interface PortfolioRowProps {
  portfolio: Portfolio;
  expanded: boolean;
  onToggle: () => void;
  onAddHolding: () => void;
}

export function PortfolioRow({
  portfolio,
  expanded,
  onToggle,
  onAddHolding,
}: PortfolioRowProps) {
  const detailQuery = usePortfolio(expanded ? portfolio.id : null);
  const detail = detailQuery.data ?? portfolio;
  const evaluate = useEvaluateRisk(portfolio.id);
  const deleteHolding = useDeleteHolding(portfolio.id);

  return (
    <li className="overflow-hidden rounded-card border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-black/[0.015]"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-foreground">
          <HugeiconsIcon icon={PieChart09Icon} className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-semibold text-foreground">
            {portfolio.name}
          </div>
          <div className="text-xs text-foreground/50">
            {(detail.holdings?.length ?? 0)} holding
            {(detail.holdings?.length ?? 0) === 1 ? "" : "s"}
            {" · "}
            Created {formatDate(portfolio.createdAt)}
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <div className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">
            Value
          </div>
          <div className="font-display text-lg font-semibold tabular-nums text-foreground">
            {formatUsd(detail.totalValue ?? 0)}
          </div>
        </div>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className={`size-4 shrink-0 text-foreground/50 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded ? (
        <div className="border-t border-black/[0.04] bg-black/[0.015] px-6 py-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAddHolding}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-transform hover:translate-y-[-1px]"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
              Add holding
            </button>
            <button
              type="button"
              onClick={() => evaluate.mutate(true)}
              disabled={evaluate.isPending}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {evaluate.isPending ? (
                <BrandLoader size="xs" tone="brand" />
              ) : (
                <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
              )}
              {evaluate.isPending ? "Evaluating…" : "Evaluate risk"}
            </button>
            {evaluate.error ? (
              <span className="text-xs text-red-600">
                {evaluate.error instanceof Error
                  ? evaluate.error.message
                  : "Evaluation failed"}
              </span>
            ) : null}
          </div>

          {detailQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-black/[0.08] bg-white px-4 py-6 text-sm text-foreground/55">
              <BrandLoader size="sm" tone="brand" />
              Loading holdings…
            </div>
          ) : detail.holdings && detail.holdings.length > 0 ? (
            <ul className="divide-y divide-black/[0.04] overflow-hidden rounded-xl border border-black/[0.06] bg-white">
              {detail.holdings.map((h) => {
                const isDeleting =
                  deleteHolding.isPending && deleteHolding.variables === h.id;
                return (
                  <li
                    key={h.id}
                    className="group flex items-center gap-3 px-4 py-3"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.05] font-display text-[10px] font-bold text-foreground">
                      {h.symbol.slice(0, 4).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {h.name ?? h.symbol.toUpperCase()}
                      </div>
                      <div className="text-xs text-foreground/50">
                        {formatQty(h.quantity)} {h.symbol.toUpperCase()}
                        {typeof h.currentPrice === "number" ? (
                          <> · {formatUsd(h.currentPrice)}</>
                        ) : null}
                      </div>
                    </div>
                    {typeof h.value === "number" ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          {formatUsd(h.value)}
                        </span>
                        {typeof h.change24h === "number" ? (
                          <span
                            className={`text-[10px] font-medium tabular-nums ${
                              h.change24h >= 0
                                ? "text-emerald-600"
                                : "text-rose-600"
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
          ) : (
            <div className="rounded-xl border border-dashed border-black/[0.08] bg-white px-6 py-8 text-center text-sm text-foreground/55">
              No holdings yet. Click{" "}
              <span className="font-semibold text-foreground">
                Add holding
              </span>{" "}
              to start tracking this portfolio.
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}

function formatUsd(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 4 : 2,
  });
}

function formatQty(q: number | string): string {
  const n = typeof q === "string" ? Number(q) : q;
  if (!Number.isFinite(n)) return String(q);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
