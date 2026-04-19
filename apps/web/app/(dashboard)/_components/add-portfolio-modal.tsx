"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PieChart09Icon } from "@hugeicons/core-free-icons";
import { useState, type FormEvent } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { useCreatePortfolio } from "../../_lib/queries";
import { Modal } from "./modal";

interface AddPortfolioModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (portfolioId: string) => void;
}

export function AddPortfolioModal({
  open,
  onClose,
  onCreated,
}: AddPortfolioModalProps) {
  const [name, setName] = useState("");
  const createPortfolio = useCreatePortfolio();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || createPortfolio.isPending) return;
    try {
      const p = await createPortfolio.mutateAsync(trimmed);
      setName("");
      onCreated?.(p.id);
      onClose();
    } catch {
      /* error surfaced via mutation state */
    }
  }

  const error = createPortfolio.error;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create portfolio"
      description="Name it — you can add holdings right after."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 focus-within:border-foreground/30">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-foreground/50">
            Portfolio name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={50}
            placeholder="e.g. Crypto core"
            className="mt-0.5 w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error instanceof Error ? error.message : "Failed to create"}
          </p>
        ) : null}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={createPortfolio.isPending}
            className="flex-1 cursor-pointer rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createPortfolio.isPending || !name.trim()}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createPortfolio.isPending ? (
              <BrandLoader size="sm" tone="dark" />
            ) : (
              <HugeiconsIcon icon={PieChart09Icon} className="size-4" />
            )}
            {createPortfolio.isPending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
