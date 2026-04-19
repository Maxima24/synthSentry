import Image from "next/image";

export type BrandLoaderSize = "xs" | "sm" | "md" | "lg";
export type BrandLoaderTone = "brand" | "dark" | "light";

interface BrandLoaderProps {
  size?: BrandLoaderSize;
  tone?: BrandLoaderTone;
  label?: string;
  className?: string;
}

const SIZE_MAP: Record<BrandLoaderSize, { w: number; h: number; gap: number }> = {
  xs: { w: 2, h: 10, gap: 2 },
  sm: { w: 3, h: 14, gap: 2 },
  md: { w: 5, h: 28, gap: 3 },
  lg: { w: 8, h: 56, gap: 5 },
};

const BARS = [0, 120, 240, 360];

export function BrandLoader({
  size = "md",
  tone = "brand",
  label = "Loading",
  className,
}: BrandLoaderProps) {
  const { w, h, gap } = SIZE_MAP[size];
  const bg =
    tone === "brand"
      ? "var(--color-primary)"
      : tone === "light"
        ? "#ffffff"
        : "var(--color-primary-foreground)";

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center ${className ?? ""}`}
      style={{ gap: `${gap}px` }}
    >
      {BARS.map((delay, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="animate-brand-bar inline-block rounded-full"
          style={{
            width: `${w}px`,
            height: `${h}px`,
            background: bg,
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}

interface BrandSplashProps {
  message?: string;
  tagline?: string;
  showEmblem?: boolean;
}

export function BrandSplash({
  message = "Preparing your portfolio",
  tagline = "Live prices · Gemini reasoning · Anomaly detection",
  showEmblem = true,
}: BrandSplashProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 40%, color-mix(in oklab, var(--color-primary) 14%, transparent), transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center">
        {showEmblem ? (
          <Image
            src="/synth_sentry_emblem.png"
            alt="Synth Sentry"
            width={88}
            height={88}
            priority
            className="mb-6 size-14 object-contain"
          />
        ) : null}
        <BrandLoader size="lg" tone="brand" label={message} />
        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground/70">
          {message}
        </div>
        <p className="mt-1.5 text-xs text-foreground/40">{tagline}</p>
      </div>
    </div>
  );
}
