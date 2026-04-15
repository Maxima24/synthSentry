import { BackgroundLayers } from "./_components/background-layers";
import { EmailCTA } from "./_components/email-cta";
import { FeaturesGrid } from "./_components/features-grid";
import { FinalCTA } from "./_components/final-cta";
import { Footer } from "./_components/footer";
import { HeroVideoPreview } from "./_components/hero-video-preview";
import { HowItWorks } from "./_components/how-it-works";
import { Nav } from "./_components/nav";
import { PartnersMarquee } from "./_components/partners-marquee";
import { ProblemSection } from "./_components/problem-section";

const HERO_SUBHEAD =
  "Live portfolio monitoring, AI-explained risk scores, real-time alerts before exposure becomes loss — built for retail investors, not Wall Street desks.";

export default function Home() {
  return (
    <main>
      <Nav />

      <section className="relative isolate m-3 flex min-h-[620px] flex-col overflow-hidden rounded-card bg-surface-marketing text-white sm:m-4 sm:h-[calc(100svh-4rem)] sm:min-h-[760px]">
        <BackgroundLayers />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-5 pt-20 sm:px-6 sm:pt-36">
          <TrustBadge />

          <h1 className="animate-fade-in-up mt-5 max-w-4xl text-balance text-center font-display text-[2.25rem] font-semibold leading-[1.05] tracking-tight sm:mt-7 sm:text-5xl md:text-6xl lg:text-7xl [animation-delay:80ms]">
            Know your real portfolio risk.{" "}
            <span className="text-primary [text-shadow:0_0_40px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]">
              In plain English.
            </span>
          </h1>

          <p className="animate-fade-in-up mt-4 max-w-2xl text-balance text-center font-sans text-[15px] leading-relaxed text-white/85 sm:mt-6 sm:text-lg [animation-delay:180ms]">
            {HERO_SUBHEAD}
          </p>

          <EmailCTA />

          <a
            href="#how-it-works"
            className="animate-fade-in-up mt-4 rounded-md text-xs font-medium text-white/80 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:mt-5 sm:text-sm [animation-delay:380ms]"
          >
            See how it works ↓
          </a>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-[clamp(5rem,11vw,13rem)] w-[min(100%-2rem,72rem)] px-3 sm:px-6">
        <HeroVideoPreview />
      </div>

      <PartnersMarquee />
      <ProblemSection />
      <HowItWorks />
      <FeaturesGrid />
      <FinalCTA />
      <Footer />
    </main>
  );
}

function TrustBadge() {
  return (
    <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/[0.07] px-3 py-1.5 backdrop-blur-md sm:px-3.5">
      <span className="relative inline-flex size-1.5">
        <span className="animate-pulse-soft absolute inset-0 rounded-full bg-primary/70" />
        <span className="relative size-1.5 rounded-full bg-primary" />
      </span>
      <span className="text-[10px] font-medium tracking-wide text-white/85 sm:text-xs">
        Live · Powered by Bayse API + Gemini
      </span>
    </div>
  );
}

