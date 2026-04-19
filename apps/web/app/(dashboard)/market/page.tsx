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
import type { MarketTrend, SearchResult } from "../../_lib/types";
import { AssetDetailPanel } from "./_asset-detail-panel";

export default function MarketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSymbol = searchParams.get("symbol");

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const { data: trends = [], error: trendsError, isLoading: trendsLoading } =
    useMarketTrends(12);

  const {
    data: results = [],
    error: searchError,
    isFetching: searching,
  } = useAssetSearch(deferredQuery);

  const selectSymbol = useCallback(
    (symbol: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("symbol", symbol);
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
        subtitle="Live prices from Bayse · search any asset"
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
          placeholder="Search bitcoin, ETH, AAPL, TSLA…"
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
          onSelect={selectSymbol}
        />
      ) : null}

      <div
        className={`mt-8 grid grid-cols-1 gap-5 ${
          activeSymbol ? "xl:grid-cols-12" : ""
        }`}
      >
        <div className={activeSymbol ? "xl:col-span-7" : ""}>
          <TrendsSection
            trends={trends}
            loading={trendsLoading}
            error={trendsError}
            activeSymbol={activeSymbol}
            onSelect={selectSymbol}
          />
        </div>
        {activeSymbol ? (
          <div className="xl:col-span-5">
            <AssetDetailPanel symbol={activeSymbol} onClose={clearSelection} />
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
  results: SearchResult[];
  error: unknown;
  loading: boolean;
  onSelect: (symbol: string) => void;
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
        No results. Try another ticker or name.
      </div>
    );
  }
  return (
    <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {results.slice(0, 9).map((r) => (
        <li key={`${r.type}-${r.symbol}`}>
          <button
            type="button"
            onClick={() => onSelect(r.symbol)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-black/[0.05] bg-white px-3 py-2.5 text-left transition-colors hover:border-foreground/20 hover:bg-black/[0.02]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/[0.05] font-display text-xs font-bold text-foreground">
              {r.symbol.slice(0, 3).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {r.name}
              </span>
              <span className="block text-[11px] text-foreground/50">
                {r.symbol.toUpperCase()} · {r.type}
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
  activeSymbol,
  onSelect,
}: {
  trends: MarketTrend[];
  loading: boolean;
  error: unknown;
  activeSymbol: string | null;
  onSelect: (symbol: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-black/[0.04] px-6 py-4">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            Trending
          </h3>
          <p className="mt-0.5 text-xs text-foreground/50">
            Top movers · 24h
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
            const positive = (t.change24h ?? 0) >= 0;
            const active = activeSymbol === t.symbol;
            return (
              <li key={t.symbol}>
                <button
                  type="button"
                  onClick={() => onSelect(t.symbol)}
                  className={`flex w-full cursor-pointer items-center gap-3 px-6 py-3.5 text-left transition-colors ${
                    active
                      ? "bg-primary/10"
                      : "hover:bg-black/[0.015]"
                  }`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] font-display text-xs font-bold text-foreground">
                    {t.symbol.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {t.name}
                    </span>
                    <span className="block text-[11px] text-foreground/50">
                      {t.symbol.toUpperCase()}
                      {t.trend ? ` · ${t.trend}` : ""}
                    </span>
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums text-foreground">
                    {formatUsd(t.price)}
                  </span>
                  <span
                    className={`inline-flex min-w-[72px] items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums ${
                      positive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={positive ? ArrowUp04Icon : ArrowDown04Icon}
                      className="size-3"
                    />
                    {Math.abs(t.change24h ?? 0).toFixed(2)}%
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

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 1) return `$${n.toFixed(4)}`;
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 100 ? 2 : 0,
  });
}
