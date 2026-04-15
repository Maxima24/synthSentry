export function BackgroundLayers() {
  return (
    <>
      {/* Bottom-anchored radial — finite extent so it can't bleed into the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_55%_42%_at_50%_98%,color-mix(in_oklab,var(--color-primary)_22%,transparent)_0%,transparent_70%)]"
      />
      {/* Tight bright core where the mockup meets the floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[8%] left-1/2 h-[260px] w-[640px] max-w-[90%] -translate-x-1/2 rounded-full bg-primary/18 blur-[90px]"
      />
      {/* Curtain texture — vertical streaks, evokes velvet drapery */}
      <div
        aria-hidden
        className="bg-curtain pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
      />
      {/* Fine film grain on top */}
      <div
        aria-hidden
        className="bg-noise pointer-events-none absolute inset-0 opacity-[0.025] mix-blend-overlay"
      />
      {/* Vignette — darken corners, focus the eye centre */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.5)_100%)]"
      />
    </>
  );
}
