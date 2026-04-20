"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown04Icon,
  ArrowUp04Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useState } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { PageHead } from "../_components/page-head";
import { useAssetSearch, useMarketTrends } from "../../_lib/queries";
import type { EventSearchResult, MarketTrendEvent } from "../../_lib/types";
import { AssetDetailPanel } from "./_asset-detail-panel";

export default function MarketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEventId = searchParams.get("eventId");

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const {
    data: trends = [],
    error: trendsError,
    isLoading: trendsLoading,
  } = useMarketTrends(12);

  const {
    data: results = [],
    error: searchError,
    isFetching: searching,
  } = useAssetSearch(deferredQuery);

  const selectEvent = useCallback(
    (eventId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("eventId", eventId);
      router.push(`/market?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearSelection = useCallback(() => {
    router.push("/market");
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHead
        title="Market"
        subtitle="Live prediction markets · powered by Bayse"
      />

      <div className="mt-8 flex items-center gap-3 rounded-xl border border-black/[0.08] bg-white px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] focus-within:border-foreground/30">
        <HugeiconsIcon
          icon={Search01Icon}
          className="size-4 shrink-0 text-foreground/50"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events — bitcoin, AFCON, election…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
        {searching && deferredQuery.trim() ? (
          <BrandLoader size="xs" tone="brand" />
        ) : null}
      </div>

      {deferredQuery.trim() ? (
        <SearchResults
          results={results}
          error={searchError}
          loading={searching}
          onSelect={selectEvent}
        />
      ) : null}

      <div
        className={`mt-8 grid grid-cols-1 gap-5 ${
          activeEventId ? "xl:grid-cols-12" : ""
        }`}
      >
        <div className={activeEventId ? "xl:col-span-7" : ""}>
          <TrendsSection
            trends={trends}
            loading={trendsLoading}
            error={trendsError}
            activeEventId={activeEventId}
            onSelect={selectEvent}
          />
        </div>
        {activeEventId ? (
          <div className="xl:col-span-5">
            <AssetDetailPanel eventId={activeEventId} onClose={clearSelection} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SearchResults({
  results,
  error,
  loading,
  onSelect,
}: {
  results: EventSearchResult[];
  error: unknown;
  loading: boolean;
  onSelect: (eventId: string) => void;
}) {
  if (error) {
    return (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error instanceof Error ? error.message : "Search failed"}
      </div>
    );
  }
  if (loading && results.length === 0) return null;
  if (!loading && results.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-black/[0.08] bg-black/[0.015] px-4 py-4 text-sm text-foreground/55">
        No markets match that query.
      </div>
    );
  }
  return (
    <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {results.slice(0, 9).map((r) => (
        <li key={r.eventId}>
          <button
            type="button"
            onClick={() => onSelect(r.eventId)}
            className="flex w-full cursor-pointer flex-col items-start gap-1.5 rounded-xl border border-black/[0.05] bg-white px-3 py-2.5 text-left transition-colors hover:border-foreground/20 hover:bg-black/[0.02]"
          >
            <span className="line-clamp-2 text-sm font-semibold text-foreground">
              {r.title}
            </span>
            <span className="flex items-center gap-2 text-[11px] text-foreground/55">
              <span className="rounded-full bg-black/[0.04] px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                {r.category}
              </span>
              <span className="tabular-nums">
                YES {Math.round(r.yesPrice * 100)}¢
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TrendsSection({
  trends,
  loading,
  error,
  activeEventId,
  onSelect,
}: {
  trends: MarketTrendEvent[];
  loading: boolean;
  error: unknown;
  activeEventId: string | null;
  onSelect: (eventId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-black/[0.04] px-6 py-4">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            Trending
          </h3>
          <p className="mt-0.5 text-xs text-foreground/50">
            Most active prediction events
          </p>
        </div>
      </div>

      {loading && trends.length === 0 ? (
        <div className="flex items-center gap-3 px-6 py-6 text-sm text-foreground/55">
          <BrandLoader size="sm" tone="brand" />
          Loading market data…
        </div>
      ) : error ? (
        <div className="m-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Market data temporarily unavailable. Try again shortly.
        </div>
      ) : trends.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-foreground/55">
          No trend data.
        </p>
      ) : (
        <ul className="divide-y divide-black/[0.04]">
          {trends.map((t) => {
            const bullish = t.trend === "bullish";
            const active = activeEventId === t.eventId;
            return (
              <li key={t.eventId}>
                <button
                  type="button"
                  onClick={() => onSelect(t.eventId)}
                  className={`flex w-full cursor-pointer items-start gap-3 px-6 py-3.5 text-left transition-colors ${
                    active ? "bg-primary/10" : "hover:bg-black/[0.015]"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-semibold text-foreground">
                      {t.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-foreground/55">
                      <span className="rounded-full bg-black/[0.04] px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                        {t.category}
                      </span>
                      <span className="tabular-nums">
                        ${formatCompactUsd(t.liquidity)} liq
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="font-display text-sm font-semibold tabular-nums text-foreground">
                      {Math.round(t.yesPrice * 100)}¢
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        bullish
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={bullish ? ArrowUp04Icon : ArrowDown04Icon}
                        className="size-3"
                      />
                      {t.trend}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function formatCompactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}
