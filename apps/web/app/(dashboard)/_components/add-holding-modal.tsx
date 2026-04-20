"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { useDeferredValue, useState, type FormEvent } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { useAddHolding, useAssetSearch } from "../../_lib/queries";
import type { EventSearchResult } from "../../_lib/types";
import { Modal } from "./modal";

interface AddHoldingModalProps {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName: string;
}

export function AddHoldingModal({
  open,
  onClose,
  portfolioId,
  portfolioName,
}: AddHoldingModalProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selected, setSelected] = useState<EventSearchResult | null>(null);
  const [quantity, setQuantity] = useState("");

  const {
    data: results = [],
    isFetching: searching,
    error: searchError,
  } = useAssetSearch(deferredQuery);

  const addHolding = useAddHolding(portfolioId);

  function reset() {
    setQuery("");
    setSelected(null);
    setQuantity("");
    addHolding.reset();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!selected || !Number.isFinite(qty) || qty <= 0 || addHolding.isPending)
      return;
    try {
      await addHolding.mutateAsync({ eventId: selected.eventId, quantity: qty });
      reset();
      onClose();
    } catch {
      /* surfaced via mutation state */
    }
  }

  const error = addHolding.error;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add holding"
      description={`Add a prediction-market position to ${portfolioName}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {selected ? (
          <div className="rounded-xl border border-primary/40 bg-primary/[0.08] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                  Selected market · {selected.category}
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
                  {selected.title}
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-foreground/60">
                  <span className="tabular-nums">
                    YES {Math.round(selected.yesPrice * 100)}¢
                  </span>
                  <span className="tabular-nums">
                    NO {Math.round(selected.noPrice * 100)}¢
                  </span>
                  <span className="tabular-nums">
                    {selected.impliedProbability.toFixed(0)}% implied
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 cursor-pointer rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[10px] font-semibold text-foreground transition-colors hover:bg-black/[0.03]"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 focus-within:border-foreground/30">
              <HugeiconsIcon
                icon={Search01Icon}
                className="size-4 shrink-0 text-foreground/50"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                placeholder="Search a prediction market (e.g. bitcoin, elections)…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
              />
              {searching && deferredQuery.trim() ? (
                <BrandLoader size="xs" tone="brand" />
              ) : null}
            </label>

            {deferredQuery.trim() ? (
              searchError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {searchError instanceof Error
                    ? searchError.message
                    : "Search failed"}
                </p>
              ) : results.length === 0 && !searching ? (
                <p className="rounded-xl border border-dashed border-black/[0.08] bg-black/[0.015] px-3 py-3 text-xs text-foreground/55">
                  No markets match &quot;{deferredQuery}&quot;.
                </p>
              ) : (
                <ul className="max-h-64 overflow-y-auto rounded-xl border border-black/[0.06] bg-white">
                  {results.slice(0, 6).map((r) => (
                    <li key={r.eventId}>
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className="flex w-full cursor-pointer items-start gap-2 border-b border-black/[0.04] px-3 py-2.5 text-left last:border-b-0 hover:bg-black/[0.03] focus-visible:bg-black/[0.03] focus-visible:outline-none"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-foreground">
                            {r.title}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-foreground/55">
                            <span className="uppercase tracking-wider">
                              {r.category}
                            </span>
                            <span className="tabular-nums">
                              YES {Math.round(r.yesPrice * 100)}¢
                            </span>
                            <span className="capitalize">· {r.status}</span>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </>
        )}

        <label className="block rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 focus-within:border-foreground/30">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-foreground/50">
            Shares
          </span>
          <input
            type="number"
            step="1"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="50"
            className="mt-0.5 w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error instanceof Error ? error.message : "Failed to add holding"}
          </p>
        ) : null}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={addHolding.isPending}
            className="flex-1 cursor-pointer rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              addHolding.isPending ||
              !selected ||
              !quantity ||
              Number(quantity) <= 0
            }
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addHolding.isPending ? (
              <BrandLoader size="sm" tone="dark" />
            ) : (
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
            )}
            {addHolding.isPending ? "Adding…" : "Add holding"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
