"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./reveal";

interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
}

const STATS: Stat[] = [
  { prefix: "$", value: 2.4, suffix: "M", label: "tracked across portfolios", decimals: 1 },
  { value: 99.7, suffix: "%", label: "Bayse uptime", decimals: 1 },
  { value: 1200, suffix: "+", label: "risk evaluations / week" },
  { value: 1.2, suffix: "s", label: "avg Gemini reasoning latency", decimals: 1 },
];

export function StatsTrust() {
  return (
    <section className="relative isolate overflow-hidden border-y border-black/[0.05] bg-white py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 50%, color-mix(in oklab, var(--color-primary) 6%, transparent), transparent 70%)",
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal className="text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/45">
            By the numbers
          </span>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built for retail investors who treat their portfolio{" "}
            <span className="text-foreground/55">like a serious operation.</span>
          </h2>
        </Reveal>

        <Reveal
          delay={120}
          className="mt-12 grid grid-cols-2 gap-8 sm:gap-12 lg:grid-cols-4"
        >
          <dl className="contents">
            {STATS.map((stat) => (
              <StatCell key={stat.label} stat={stat} />
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function StatCell({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(stat.value);
      return;
    }

    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            started = true;
            const start = performance.now();
            const duration = 1400;
            const tick = (now: number) => {
              const progress = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(stat.value * eased);
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [stat.value]);

  const formatted =
    stat.decimals !== undefined
      ? value.toFixed(stat.decimals)
      : Math.round(value).toLocaleString();

  return (
    <div ref={ref}>
      <dd className="font-display text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
        {stat.prefix ?? ""}
        {formatted}
        {stat.suffix ?? ""}
      </dd>
      <dt className="mt-2 text-xs font-medium text-foreground/55 sm:text-sm">
        {stat.label}
      </dt>
    </div>
  );
}
