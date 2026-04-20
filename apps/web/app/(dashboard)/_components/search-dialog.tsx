"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown04Icon,
  ArrowUp04Icon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { useAssetSearch } from "../../_lib/queries";
import type { EventSearchResult } from "../../_lib/types";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data: results = [],
    error,
    isFetching: loading,
  } = useAssetSearch(deferredQuery);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function handleSelect(r: EventSearchResult) {
    onClose();
    router.push(`/market?eventId=${encodeURIComponent(r.eventId)}`);
  }

  if (!open) return null;

  const showLoading = loading && deferredQuery.trim().length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search assets"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-black/45 backdrop-blur-sm"
      />
      <div className="animate-fade-in-up relative w-full max-w-xl overflow-hidden rounded-card border border-black/[0.06] bg-white shadow-[0_32px_80px_-20px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3 border-b border-black/[0.04] px-5 py-4">
          <HugeiconsIcon
            icon={Search01Icon}
            className="size-4 shrink-0 text-foreground/50"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bitcoin, ETH, AAPL…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
          />
          {showLoading ? <BrandLoader size="xs" tone="brand" /> : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-black/[0.05] hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {error ? (
            <Empty
              message={error instanceof Error ? error.message : "Search failed"}
              tone="error"
            />
          ) : deferredQuery.trim() === "" ? (
            <Empty message="Start typing to search assets powered by Bayse." />
          ) : !loading && results.length === 0 ? (
            <Empty message={`No results for "${deferredQuery}".`} />
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((r) => {
                const initials =
                  (r.title.match(/\b\w/g) || [])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "EV";
                return (
                  <li key={r.eventId}>
                    <button
                      type="button"
                      onClick={() => handleSelect(r)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-black/[0.04] focus-visible:bg-black/[0.04] focus-visible:outline-none"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] font-display text-xs font-bold text-foreground">
                        {initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {r.title}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-foreground/50">
                          <span className="uppercase tracking-wider">
                            {r.category}
                          </span>
                          <span>·</span>
                          <span className="tabular-nums">
                            YES {Math.round(r.yesPrice * 100)}¢
                          </span>
                          <span>·</span>
                          <span className="capitalize">{r.status}</span>
                        </span>
                      </span>
                      <span className="hidden rounded-md border border-black/[0.06] bg-white px-1.5 py-0.5 text-[10px] font-medium text-foreground/50 sm:inline">
                        ↵
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/[0.04] bg-black/[0.015] px-5 py-2.5 text-[11px] text-foreground/50">
          <div className="flex items-center gap-3">
            <Kbd>↵</Kbd> to open
            <span className="flex items-center gap-1">
              <Kbd>
                <HugeiconsIcon icon={ArrowUp04Icon} className="size-2.5" />
              </Kbd>
              <Kbd>
                <HugeiconsIcon icon={ArrowDown04Icon} className="size-2.5" />
              </Kbd>
              to navigate
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}

function Empty({
  message,
  tone,
}: {
  message: string;
  tone?: "error";
}) {
  return (
    <div
      className={`px-4 py-10 text-center text-sm ${
        tone === "error" ? "text-red-600" : "text-foreground/50"
      }`}
    >
      {message}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground/70">
      {children}
    </span>
  );
}
