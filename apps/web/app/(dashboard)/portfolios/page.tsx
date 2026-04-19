"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, PieChart09Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { AddHoldingModal } from "../_components/add-holding-modal";
import { AddPortfolioModal } from "../_components/add-portfolio-modal";
import { PageHead } from "../_components/page-head";
import { usePortfolios } from "../../_lib/queries";
import type { Portfolio } from "../../_lib/types";
import { PortfolioRow } from "./_portfolio-row";

export default function PortfoliosPage() {
  const { data: portfolios, error } = usePortfolios();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addPortfolioOpen, setAddPortfolioOpen] = useState(false);
  const [addHoldingFor, setAddHoldingFor] = useState<Portfolio | null>(null);

  if (!portfolios && !error) {
    return <PortfolioSkeleton />;
  }

  const list = portfolios ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHead
        title="Portfolios"
        subtitle={`${list.length} portfolio${list.length === 1 ? "" : "s"}`}
        action={
          <button
            type="button"
            onClick={() => setAddPortfolioOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:translate-y-[-1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            New portfolio
          </button>
        }
      />

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to load"}
        </div>
      ) : null}

      {list.length === 0 ? (
        <EmptyPortfolios onCreate={() => setAddPortfolioOpen(true)} />
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {list.map((p) => (
            <PortfolioRow
              key={p.id}
              portfolio={p}
              expanded={expandedId === p.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === p.id ? null : p.id))
              }
              onAddHolding={() => setAddHoldingFor(p)}
            />
          ))}
        </ul>
      )}

      <AddPortfolioModal
        open={addPortfolioOpen}
        onClose={() => setAddPortfolioOpen(false)}
        onCreated={(id) => setExpandedId(id)}
      />
      {addHoldingFor ? (
        <AddHoldingModal
          open
          onClose={() => setAddHoldingFor(null)}
          portfolioId={addHoldingFor.id}
          portfolioName={addHoldingFor.name}
        />
      ) : null}
    </div>
  );
}

function EmptyPortfolios({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-card border border-black/[0.05] bg-white px-8 py-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary-foreground">
        <HugeiconsIcon icon={PieChart09Icon} className="size-6" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
        No portfolios yet
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/60">
        Create your first portfolio to start tracking holdings and risk.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <HugeiconsIcon icon={Add01Icon} className="size-4" />
        New portfolio
      </button>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-black/[0.05]" />
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-card bg-black/[0.04]" />
        ))}
      </div>
    </div>
  );
}

