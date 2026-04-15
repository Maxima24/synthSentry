import { BackgroundLayers } from "./_components/background-layers";
import { EmailCTA } from "./_components/email-cta";
import { HeroVideoPreview } from "./_components/hero-video-preview";
import { Nav } from "./_components/nav";
import { PartnersMarquee } from "./_components/partners-marquee";

const HERO_SUBHEAD =
  "Live portfolio monitoring, AI-explained risk scores, real-time alerts before exposure becomes loss — built for retail investors, not Wall Street desks.";

export default function Home() {
  return (
    <main>
      <Nav />

      <section className="relative isolate m-3 flex h-[calc(100svh-3rem)] min-h-[760px] flex-col overflow-hidden rounded-card bg-surface-marketing text-white sm:m-4 sm:h-[calc(100svh-4rem)]">
        <BackgroundLayers />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-32 sm:pt-36">
          <TrustBadge />

          <h1 className="animate-fade-in-up mt-7 max-w-4xl text-center font-display text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl md:text-7xl">
            Know your real portfolio risk.{" "}
            <span className="text-primary [text-shadow:0_0_40px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]">
              In plain English.
            </span>
          </h1>

          <p className="animate-fade-in-up mt-6 max-w-2xl text-center font-sans text-lg leading-relaxed text-white/85 [animation-delay:120ms]">
            {HERO_SUBHEAD}
          </p>

          <EmailCTA />

          <a
            href="#how-it-works"
            className="animate-fade-in-up mt-5 rounded-md text-sm font-medium text-white/80 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [animation-delay:340ms]"
          >
            See how it works ↓
          </a>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-[clamp(4rem,11vw,13rem)] w-[min(100%-2rem,72rem)] px-4 sm:px-6">
        <HeroVideoPreview />
      </div>

      <PartnersMarquee />
    </main>
  );
}

function TrustBadge() {
  return (
    <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/[0.07] px-3.5 py-1.5 backdrop-blur-md">
      <span className="relative inline-flex size-1.5">
        <span className="animate-pulse-soft absolute inset-0 rounded-full bg-primary/70" />
        <span className="relative size-1.5 rounded-full bg-primary" />
      </span>
      <span className="text-xs font-medium tracking-wide text-white/80">
        Live · Powered by Bayse API + Gemini
      </span>
    </div>
  );
}

