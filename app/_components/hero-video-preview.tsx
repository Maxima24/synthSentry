export function HeroVideoPreview() {
  return (
    <div className="animate-fade-in-up relative aspect-[16/9] w-full overflow-hidden rounded-card border border-white/40 shadow-[0_40px_140px_-20px_rgba(0,0,0,0.65),0_0_0_1px_rgb(255_255_255/0.04)] [animation-delay:420ms]">
      <div className="absolute inset-0 bg-surface-marketing" />

      <div className="bg-retro-grid absolute inset-0 opacity-90" />

      <div className="absolute inset-0 [background:radial-gradient(ellipse_50%_65%_at_5%_50%,color-mix(in_oklab,var(--color-primary)_28%,transparent)_0%,transparent_60%)]" />

      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.5)_100%)]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-5">
        <PlayButton />
        <span className="text-xs font-medium tracking-wide text-white/85 sm:text-sm">
          Watch the 2-minute demo
        </span>
      </div>
    </div>
  );
}

function PlayButton() {
  return (
    <button
      type="button"
      aria-label="Play product demo video"
      className="group relative inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:size-20"
    >
      <span
        aria-hidden
        className="animate-pulse-soft absolute -inset-2 -z-10 rounded-full bg-primary/40 blur-xl"
      />
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className="size-5 translate-x-0.5 sm:size-7"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}
