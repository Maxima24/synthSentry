"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { useState, type FormEvent } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { useAddHolding } from "../../_lib/queries";
import { Modal } from "./modal";

interface AddHoldingModalProps {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName: string;
}

const POPULAR = ["BTC", "ETH", "SOL", "AAPL", "TSLA", "NVDA"];

export function AddHoldingModal({
  open,
  onClose,
  portfolioId,
  portfolioName,
}: AddHoldingModalProps) {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const addHolding = useAddHolding(portfolioId);

  function reset() {
    setSymbol("");
    setQuantity("");
    addHolding.reset();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const sym = symbol.trim().toUpperCase();
    const qty = Number(quantity);
    if (!sym || !Number.isFinite(qty) || qty <= 0 || addHolding.isPending) return;
    try {
      await addHolding.mutateAsync({ symbol: sym, quantity: qty });
      reset();
      onClose();
    } catch {
      /* error surfaced via mutation state */
    }
  }

  const error = addHolding.error;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add holding"
      description={`To ${portfolioName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {POPULAR.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSymbol(s)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                symbol === s
                  ? "border-transparent bg-foreground text-background"
                  : "border-black/[0.08] bg-white text-foreground/70 hover:bg-black/[0.04]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 focus-within:border-foreground/30">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-foreground/50">
              Symbol
            </span>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              autoFocus
              placeholder="BTC"
              className="mt-0.5 w-full bg-transparent text-sm font-semibold uppercase text-foreground placeholder:text-foreground/30 focus:outline-none"
            />
          </label>
          <label className="block rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 focus-within:border-foreground/30">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-foreground/50">
              Quantity
            </span>
            <input
              type="number"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.5"
              className="mt-0.5 w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
            />
          </label>
        </div>

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
            disabled={addHolding.isPending || !symbol.trim() || !quantity}
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
