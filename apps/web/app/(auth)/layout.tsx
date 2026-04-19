import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-background p-3 sm:p-4">
      <div className="grid w-full overflow-hidden rounded-frame shadow-[0_24px_80px_-32px_rgba(0,0,0,0.45)] lg:grid-cols-2">
        <AuthHeroPanel />
        <section className="relative flex flex-col bg-white">
          <header className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
            <Link
              href="/"
              className="text-xs font-medium text-foreground/60 transition-colors hover:text-foreground"
            >
              ← Back to home
            </Link>
          </header>
          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
            <div className="w-full max-w-sm">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AuthHeroPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-surface-marketing text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 0%, color-mix(in oklab, var(--color-primary) 28%, transparent), transparent 60%), radial-gradient(ellipse 70% 55% at 90% 100%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 65%)",
        }}
      />
      <div aria-hidden className="bg-retro-grid pointer-events-none absolute inset-0 opacity-40" />
      <div aria-hidden className="bg-curtain pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay" />

      <div className="relative z-10 flex items-center gap-2.5 font-display text-lg font-semibold">
        <Image
          src="/synth_sentry_emblem.png"
          alt=""
          width={44}
          height={44}
          priority
          className="size-11"
        />
        Synth Sentry
      </div>

      <div className="relative z-10 max-w-md">
        <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          Fast.
          <br />
          Transparent.
          <br />
          <span className="text-primary [text-shadow:0_0_40px_color-mix(in_oklab,var(--color-primary)_40%,transparent)]">
            Intelligent.
          </span>
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
          AI-explained portfolio risk scores and live anomaly detection —
          powered by Bayse market data and Gemini reasoning.
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-3 text-xs text-white/60">
        <span className="relative inline-flex size-1.5">
          <span className="animate-pulse-soft absolute inset-0 rounded-full bg-primary/70" />
          <span className="relative size-1.5 rounded-full bg-primary" />
        </span>
        <span>Live · Powered by Bayse + Gemini</span>
      </div>
    </section>
  );
}
