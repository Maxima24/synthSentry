"use client"
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity03Icon,
  Alert02Icon,
  BellDotIcon,
  ChartLineData01Icon,
  SparklesIcon,
  TranslationIcon,
} from "@hugeicons/core-free-icons";
import { Reveal } from "./reveal";
import { SpotlightCard } from "./spotlight-card";

const FEATURES = [
  {
    icon: Activity03Icon,
    title: "Live market data",
    body: "Real-time prices, 24h change, and volume for every holding. Powered exclusively by Bayse API — no mock data.",
  },
  {
    icon: SparklesIcon,
    title: "AI risk scoring",
    body: "Gemini analyses your portfolio composition and market conditions to produce 0–100 scores per asset and overall.",
  },
  {
    icon: TranslationIcon,
    title: "Plain-language rationale",
    body: "Every risk score comes with a 2–4 sentence explanation. No quant jargon — just what to pay attention to and why.",
  },
  {
    icon: Alert02Icon,
    title: "Anomaly detection",
    body: "Backend polling flags unusual price movements and volatility spikes before they hit the headlines.",
  },
  {
    icon: BellDotIcon,
    title: "Threshold alerts",
    body: "Set a risk score threshold per asset or portfolio. Cross it, get notified — in-app, email, or both.",
  },
  {
    icon: ChartLineData01Icon,
    title: "Risk history",
    body: "Watch how your portfolio's risk score trends over time. Spot the drift before it becomes a loss.",
  },
] as const;

export function FeaturesGrid() {
  return (
    <section id="features" className="px-5 py-20 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-center font-sans text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
            Capabilities
          </p>
          <h2 className="mt-4 text-balance text-center font-display text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Built for retail.{" "}
            <span className="text-foreground/45">Not Wall Street.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-center font-sans text-base leading-relaxed text-foreground/70 sm:text-lg">
            Every feature exists for one reason — let you see and act on portfolio risk before it becomes loss.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 100}>
              <SpotlightCard className="h-full rounded-card border border-foreground/[0.08] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_2px_6px_rgba(0,0,0,0.04),0_20px_48px_-20px_rgba(0,0,0,0.18)]">
                <div className="relative z-10 p-6 sm:p-7">
                  <div className="inline-flex size-11 items-center justify-center rounded-panel bg-primary/20 text-primary-foreground transition-all duration-300 group-hover/spot:bg-primary/30 group-hover/spot:shadow-[0_0_24px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]">
                    <HugeiconsIcon icon={f.icon} className="size-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/65">
                    {f.body}
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
