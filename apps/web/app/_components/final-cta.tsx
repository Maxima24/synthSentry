"use client"
import { EmailCTA } from "./email-cta";
import { Reveal } from "./reveal";

export function FinalCTA() {
  return (
    <section className="relative m-3 overflow-hidden rounded-card bg-surface-marketing px-5 py-20 text-white sm:m-4 sm:px-8 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_60%_70%_at_50%_50%,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="bg-retro-grid pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <Reveal>
          <h2 className="text-balance font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            Stop guessing your exposure.{" "}
            <span className="text-primary [text-shadow:0_0_40px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]">
              Start seeing it.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-balance font-sans text-base leading-relaxed text-white/85 sm:text-lg">
            Get early access to Synth Sentry. Be the first to know when your portfolio risk crosses the line.
          </p>
        </Reveal>
        <Reveal delay={180} className="w-full">
          <div className="flex justify-center">
            <EmailCTA />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
