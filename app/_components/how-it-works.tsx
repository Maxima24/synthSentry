import { HugeiconsIcon } from "@hugeicons/react";
import {
  BellDotIcon,
  Brain02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { DataFlow } from "./data-flow";
import { Reveal } from "./reveal";

const STEPS = [
  {
    n: "01",
    icon: Wallet01Icon,
    title: "Add your holdings",
    body: "Drop in your tickers and quantities. Bayse API streams live prices, 24h change, and volume into your dashboard immediately.",
  },
  {
    n: "02",
    icon: Brain02Icon,
    title: "Gemini scores your risk",
    body: "Every position gets a 0–100 risk score with a plain-English explanation. No VaR, no Sharpe — just what to watch and why.",
  },
  {
    n: "03",
    icon: BellDotIcon,
    title: "Get alerted in time",
    body: "Set thresholds. Synth Sentry flags anomalies and notifies you the moment your exposure crosses the line — before the loss hits.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative m-3 overflow-hidden rounded-card bg-surface-marketing px-5 py-20 text-white sm:m-4 sm:px-8 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_55%_60%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="bg-retro-grid pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
      />

      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <p className="text-center font-sans text-xs font-medium uppercase tracking-[0.18em] text-white/55">
            How it works
          </p>
          <h2 className="mt-4 text-balance text-center font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            Three steps to see your{" "}
            <span className="text-primary">real risk</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-center font-sans text-base leading-relaxed text-white/75 sm:text-lg">
            From a fresh portfolio to a risk score with explanation, you&rsquo;re set up in under five minutes.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <DataFlow />
        </Reveal>

        <div className="mt-14 grid gap-4 sm:mt-16 sm:grid-cols-3 sm:gap-5">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 120}>
              <article className="group h-full rounded-card border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07] sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="inline-flex size-11 items-center justify-center rounded-panel bg-primary/15 text-primary transition-all duration-300 group-hover:bg-primary/25 group-hover:shadow-[0_0_24px_color-mix(in_oklab,var(--color-primary)_40%,transparent)]">
                    <HugeiconsIcon icon={step.icon} className="size-5" />
                  </div>
                  <span className="font-display text-sm font-semibold tracking-widest text-white/40">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-white/75">
                  {step.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
