"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { Modal } from "../_components/modal";
import { getPortfolio } from "../../_lib/portfolio-api";
import {
  qk,
  usePortfolios,
  useSetAlertThreshold,
} from "../../_lib/queries";
import type { Holding, Portfolio } from "../../_lib/types";

interface CreateAlertModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateAlertModal({ open, onClose }: CreateAlertModalProps) {
  const [selected, setSelected] = useState<string>("");
  const [threshold, setThreshold] = useState(70);
  const [reason, setReason] = useState("");

  const { data: portfolios = [] } = usePortfolios();

  const detailResults = useQueries({
    queries: portfolios.map((p) => ({
      queryKey: qk.portfolio(p.id),
      queryFn: () => getPortfolio(p.id),
      enabled: open,
      staleTime: 30_000,
    })),
  });

  const allHoldings: Holding[] = useMemo(
    () =>
      detailResults.flatMap((r, i) => {
        const detail = r.data ?? portfolios[i];
        return (detail as Portfolio | undefined)?.holdings ?? [];
      }),
    [detailResults, portfolios]
  );

  const loadingHoldings =
    portfolios.length > 0 &&
    detailResults.some((r) => r.isLoading) &&
    allHoldings.length === 0;

  const setAlert = useSetAlertThreshold();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const holdingId = selected || allHoldings[0]?.id;
    if (!holdingId || setAlert.isPending) return;
    try {
      await setAlert.mutateAsync({
        holdingId,
        threshold,
        reason: reason || undefined,
      });
      setReason("");
      onClose();
    } catch {
      /* error surfaced via mutation state */
    }
  }

  const error = setAlert.error;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create alert"
      description="Notify me when a holding's risk score crosses a threshold."
    >
      {loadingHoldings ? (
        <div className="flex items-center gap-3 py-6 text-sm text-foreground/55">
          <BrandLoader size="sm" tone="brand" />
          Loading your holdings…
        </div>
      ) : allHoldings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/[0.1] bg-black/[0.02] px-4 py-6 text-center text-sm text-foreground/60">
          You have no holdings yet. Add a holding first — then you can set
          an alert on it.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground/50">
              Holding
            </span>
            <select
              value={selected || allHoldings[0]?.id}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
            >
              {allHoldings.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.eventTitle
                    ? `${h.outcome ? h.outcome + " · " : ""}${h.eventTitle}`
                    : h.symbol}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-foreground/50">
              <span>Risk threshold (0–100)</span>
              <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-xs font-bold text-foreground">
                {threshold}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
            <div className="mt-1 flex justify-between text-[10px] text-foreground/40">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
              <span>Critical</span>
            </div>
          </label>

          <label className="block rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 focus-within:border-foreground/30">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-foreground/50">
              Reason (optional)
            </span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Notify me when risk exceeds threshold"
              className="mt-0.5 w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error instanceof Error ? error.message : "Failed to set alert"}
            </p>
          ) : null}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={setAlert.isPending}
              className="flex-1 cursor-pointer rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={setAlert.isPending}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              {setAlert.isPending ? (
                <BrandLoader size="sm" tone="dark" />
              ) : (
                <HugeiconsIcon icon={Alert02Icon} className="size-4" />
              )}
              {setAlert.isPending ? "Saving…" : "Set alert"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
