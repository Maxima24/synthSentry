"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  PieChart09Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { useCreatePortfolio } from "../../_lib/queries";

interface EmptyStateProps {
  onCreated?: () => void;
}

export function EmptyState({ onCreated }: EmptyStateProps) {
  const [name, setName] = useState("My portfolio");
  const createPortfolio = useCreatePortfolio();

  async function handleCreate() {
    if (!name.trim() || createPortfolio.isPending) return;
    try {
      await createPortfolio.mutateAsync(name.trim());
      onCreated?.();
    } catch {
      /* error surfaced via mutation state */
    }
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-black/[0.05] bg-white px-8 py-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary-foreground">
        <HugeiconsIcon icon={PieChart09Icon} className="size-6" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
        Let&apos;s create your first portfolio
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/60">
        Track holdings, get AI-explained risk scores, and receive real-time
        anomaly alerts — all in one place.
      </p>

      <div className="mt-8 flex w-full max-w-sm items-stretch gap-2 rounded-xl border border-black/[0.08] bg-white p-1.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Portfolio name"
          className="flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={createPortfolio.isPending}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {createPortfolio.isPending ? (
            <BrandLoader size="xs" tone="dark" />
          ) : (
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
          )}
          {createPortfolio.isPending ? "Creating…" : "Create"}
        </button>
      </div>

      {createPortfolio.error ? (
        <p className="mt-3 text-xs text-red-600">
          {createPortfolio.error instanceof Error
            ? createPortfolio.error.message
            : "Failed to create"}
        </p>
      ) : null}
    </div>
  );
}
