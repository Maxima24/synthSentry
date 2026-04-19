"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  RefreshIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { AddHoldingModal } from "../_components/add-holding-modal";
import { AddPortfolioModal } from "../_components/add-portfolio-modal";
import { AnomaliesList } from "../_components/anomalies-list";
import { EmptyState } from "../_components/empty-state";
import { HoldingsList } from "../_components/holdings-list";
import { MarketTrends } from "../_components/market-trends";
import { PortfolioSwitcher } from "../_components/portfolio-switcher";
import { RemindersCard } from "../_components/reminders-card";
import { RiskGauge } from "../_components/risk-gauge";
import { RiskHistoryChart } from "../_components/risk-history-chart";
import { StatCard } from "../_components/stat-card";
import {
  useAlerts,
  useEvaluateRisk,
  useInvalidateAll,
  useMarketTrends,
  usePortfolio,
  usePortfolios,
  useRiskHistory,
  useRiskSummary,
} from "../../_lib/queries";
import type { Portfolio } from "../../_lib/types";

export default function DashboardPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addPortfolioOpen, setAddPortfolioOpen] = useState(false);
  const [addHoldingOpen, setAddHoldingOpen] = useState(false);

  const invalidateAll = useInvalidateAll();

  const { data: portfolios, error: portfoliosError } = usePortfolios();

  const selectedId =
    activeId && portfolios?.some((p) => p.id === activeId)
      ? activeId
      : portfolios?.[0]?.id ?? null;

  const { data: current } = usePortfolio(selectedId);
  const { data: history = [] } = useRiskHistory(selectedId);
  const { data: summary } = useRiskSummary(selectedId);
  const { data: alerts = [] } = useAlerts();
  const { data: trends = [] } = useMarketTrends(6);
  const evaluate = useEvaluateRisk(selectedId ?? "");

  if (portfoliosError) {
    return (
      <ErrorBanner
        message={portfoliosError.message}
        onRetry={invalidateAll}
      />
    );
  }

  if (!portfolios) {
    return <PageSkeleton />;
  }

  if (portfolios.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader hasPortfolio={false} />
        <div className="mt-8">
          <EmptyState onCreated={invalidateAll} />
        </div>
      </div>
    );
  }

  const totalHoldings = current?.holdings?.length ?? 0;
  const overallScore =
    summary?.risk?.overallScore ??
    history[history.length - 1]?.overallScore ??
    null;
  const riskLevel = summary?.risk?.riskLevel;
  const activeAlerts =
    alerts.filter((a) => !a.triggeredAt).length || alerts.length;
  const anomalies = summary?.activeAnomalies ?? [];
  const reasoning = summary?.risk?.reasoningPath ?? [];
  const totalValue = current?.totalValue ?? 0;
  const effectivePortfolio: Portfolio | null =
    current ?? portfolios.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        hasPortfolio
        portfolios={portfolios}
        currentId={selectedId}
        onSelectPortfolio={setActiveId}
        totalValue={totalValue}
        evaluating={evaluate.isPending}
        onEvaluate={() => evaluate.mutate(true)}
        onAddPortfolio={() => setAddPortfolioOpen(true)}
        onRefresh={invalidateAll}
      />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Portfolio value"
          value={formatCompactUsd(totalValue)}
          delta={{
            text: current?.lastUpdated
              ? `Updated ${timeAgo(current.lastUpdated)}`
              : "Live",
            positive: true,
          }}
          variant="primary"
        />
        <StatCard
          label="Total holdings"
          value={totalHoldings}
          delta={{
            text: `${portfolios.length} portfolio${portfolios.length === 1 ? "" : "s"}`,
          }}
        />
        <StatCard
          label="Risk score"
          value={overallScore !== null ? Math.round(overallScore) : "—"}
          delta={{
            text: riskLevel ? `${riskLevel} risk` : "Awaiting evaluation",
          }}
        />
        <StatCard
          label="Active alerts"
          value={activeAlerts}
          delta={{ text: activeAlerts > 0 ? "Needs review" : "All clear" }}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
            <div className="md:col-span-3">
              <RiskHistoryChart snapshots={history} />
            </div>
            <div className="md:col-span-2">
              <RemindersCard alerts={alerts} />
            </div>
          </div>
        </div>
        <div className="xl:col-span-4">
          <HoldingsList
            holdings={current?.holdings ?? []}
            portfolioId={selectedId}
            onAdd={() => setAddHoldingOpen(true)}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <AnomaliesList anomalies={anomalies} reasoning={reasoning} />
        </div>
        <div className="xl:col-span-4">
          <RiskGauge score={overallScore} level={riskLevel} />
        </div>
        <div className="xl:col-span-3">
          <MarketTrends trends={trends} />
        </div>
      </div>

      <AddPortfolioModal
        open={addPortfolioOpen}
        onClose={() => setAddPortfolioOpen(false)}
        onCreated={(id) => setActiveId(id)}
      />
      {effectivePortfolio ? (
        <AddHoldingModal
          open={addHoldingOpen}
          onClose={() => setAddHoldingOpen(false)}
          portfolioId={effectivePortfolio.id}
          portfolioName={effectivePortfolio.name}
        />
      ) : null}
    </div>
  );
}

interface PageHeaderProps {
  hasPortfolio: boolean;
  portfolios?: Portfolio[];
  currentId?: string | null;
  onSelectPortfolio?: (id: string) => void;
  totalValue?: number;
  evaluating?: boolean;
  onEvaluate?: () => void;
  onAddPortfolio?: () => void;
  onRefresh?: () => void;
}

function PageHeader({
  hasPortfolio,
  portfolios = [],
  currentId,
  onSelectPortfolio,
  totalValue,
  evaluating,
  onEvaluate,
  onAddPortfolio,
  onRefresh,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[42px] font-semibold leading-none tracking-tight text-foreground">
            Dashboard
          </h1>
          {hasPortfolio && portfolios.length > 0 && onSelectPortfolio ? (
            <PortfolioSwitcher
              portfolios={portfolios}
              currentId={currentId ?? null}
              onSelect={onSelectPortfolio}
            />
          ) : null}
        </div>
        {hasPortfolio ? (
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="text-sm text-foreground/55">Portfolio value</span>
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {formatUsd(totalValue ?? 0)}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-foreground/55">
            Plan, monitor, and protect your portfolio with AI.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {hasPortfolio && onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh"
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-black/[0.1] bg-white text-foreground/70 transition-colors hover:bg-black/[0.03] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <HugeiconsIcon icon={RefreshIcon} className="size-4" />
          </button>
        ) : null}
        {hasPortfolio && onEvaluate ? (
          <button
            type="button"
            onClick={onEvaluate}
            disabled={evaluating}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {evaluating ? (
              <BrandLoader size="sm" tone="brand" />
            ) : (
              <HugeiconsIcon icon={SparklesIcon} className="size-4" />
            )}
            {evaluating ? "Evaluating…" : "Evaluate risk"}
          </button>
        ) : null}
        {onAddPortfolio ? (
          <button
            type="button"
            onClick={onAddPortfolio}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:translate-y-[-1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Add portfolio
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-56 rounded-xl bg-black/[0.05]" />
        <div className="h-11 w-44 rounded-full bg-black/[0.05]" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-card bg-black/[0.04]" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="h-80 rounded-card bg-black/[0.04] xl:col-span-8" />
        <div className="h-80 rounded-card bg-black/[0.04] xl:col-span-4" />
      </div>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-card border border-red-200 bg-red-50 p-6 text-center">
      <h3 className="font-display text-lg font-semibold text-red-800">
        Couldn&apos;t load your dashboard
      </h3>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Retry
      </button>
    </div>
  );
}

function formatUsd(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatCompactUsd(n: number): string {
  if (n === 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
