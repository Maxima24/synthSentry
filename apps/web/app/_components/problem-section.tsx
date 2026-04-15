import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlarmClockIcon,
  QuestionIcon,
  SquareStackIcon,
} from "@hugeicons/core-free-icons";
import { Reveal } from "./reveal";

const PAINS = [
  {
    icon: SquareStackIcon,
    title: "Fragmented visibility",
    body: "Your portfolio lives across brokerage apps. None of them give you a unified picture of your total exposure.",
  },
  {
    icon: QuestionIcon,
    title: "Opaque risk metrics",
    body: "When risk is shown at all, it's raw numbers — VaR, beta, Sharpe — that retail investors can't interpret without a finance degree.",
  },
  {
    icon: AlarmClockIcon,
    title: "Late alerts",
    body: "By the time you check after a market shock, the damage is already in the portfolio. You react instead of prepare.",
  },
] as const;

export function ProblemSection() {
  return (
    <section id="problem" className="px-5 py-20 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-center font-sans text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
            The problem
          </p>
          <h2 className="mt-4 text-balance text-center font-display text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
            You see prices.{" "}
            <span className="text-foreground/45">Not exposure.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-center font-sans text-base leading-relaxed text-foreground/70 sm:text-lg">
            Retail investors make consequential financial decisions with almost zero real-time risk feedback. By the time the danger shows up in the price, the damage is already in your portfolio.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:mt-16 sm:grid-cols-3 sm:gap-5">
          {PAINS.map((pain, i) => (
            <Reveal key={pain.title} delay={i * 100}>
              <article
                className="group h-full rounded-card border border-foreground/[0.08] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_8px_24px_-12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_2px_6px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)] sm:p-7"
              >
                <div className="inline-flex size-11 items-center justify-center rounded-panel bg-foreground/[0.05] text-foreground/80 transition-colors duration-300 group-hover:bg-foreground/10 group-hover:text-foreground">
                  <HugeiconsIcon icon={pain.icon} className="size-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-foreground">
                  {pain.title}
                </h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/65">
                  {pain.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
