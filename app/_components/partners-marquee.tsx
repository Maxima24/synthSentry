import Image from "next/image";

const PARTNERS = [
  { src: "/bayse_logo.png", alt: "Bayse", width: 196, height: 48, h: "h-7" },
  { src: "/Gemini-logo.png", alt: "Google Gemini", width: 1065, height: 241, h: "h-7" },
  {
    src: "/google_for_developers.svg",
    alt: "Google for Developers",
    width: 432,
    height: 64,
    h: "h-6",
  },
] as const;

export function PartnersMarquee() {
  const loopSet = [...PARTNERS, ...PARTNERS, ...PARTNERS];

  return (
    <section className="relative pb-24 pt-20 sm:pb-28 sm:pt-28">
      <p className="text-center font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/70">
        Built on industry-leading AI and market data infrastructure
      </p>

      <div className="mt-12 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="animate-marquee flex w-max items-center gap-24 sm:gap-32">
          {[...loopSet, ...loopSet].map((partner, i) => (
            <div
              key={`${partner.alt}-${i}`}
              className="flex shrink-0 items-center"
              aria-hidden={i >= loopSet.length}
            >
              <Image
                src={partner.src}
                alt={i < loopSet.length ? partner.alt : ""}
                width={partner.width}
                height={partner.height}
                className={`${partner.h} w-auto opacity-65 brightness-0 transition-opacity duration-300 hover:opacity-100`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
