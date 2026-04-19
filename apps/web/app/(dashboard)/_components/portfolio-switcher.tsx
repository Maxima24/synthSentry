"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Tick02Icon,
  PieChart09Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import type { Portfolio } from "../../_lib/types";

interface PortfolioSwitcherProps {
  portfolios: Portfolio[];
  currentId: string | null;
  onSelect: (id: string) => void;
}

export function PortfolioSwitcher({
  portfolios,
  currentId,
  onSelect,
}: PortfolioSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = portfolios.find((p) => p.id === currentId) ?? portfolios[0];
  if (!current) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <HugeiconsIcon icon={PieChart09Icon} className="size-3.5" />
        <span className="max-w-[160px] truncate">{current.name}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className={`size-3 text-foreground/50 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="animate-fade-in-up absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]">
          <div className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
            Your portfolios
          </div>
          <ul className="max-h-[280px] overflow-y-auto">
            {portfolios.map((p) => {
              const active = p.id === current.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(p.id);
                      setOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-primary/15 text-foreground"
                        : "text-foreground/80 hover:bg-black/[0.03]"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-black/[0.04] text-foreground/70"
                        }`}
                      >
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {p.name}
                        </span>
                        {typeof p.totalValue === "number" ? (
                          <span className="block text-[10px] text-foreground/50">
                            {formatUsd(p.totalValue)}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    {active ? (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className="size-3.5 text-foreground"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function formatUsd(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
