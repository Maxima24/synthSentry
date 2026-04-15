"use client"
import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "#problem", label: "The problem" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-foreground/[0.08] px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-xs flex-col items-center gap-3 sm:items-start">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg font-display text-base font-semibold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <Image
              src="/synth_sentry_emblem.png"
              alt=""
              width={120}
              height={120}
              className="size-8"
            />
            Synth Sentry
          </Link>
          <p className="text-balance text-center font-sans text-sm leading-relaxed text-foreground/55 sm:text-left">
            AI-powered portfolio risk intelligence for retail investors. Built on Bayse + Gemini.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:items-end">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-foreground/70">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Login
            </Link>
          </nav>
          <p className="text-xs text-foreground/45">
            © 2025 Synth Sentry · Built for the OAU × Bayse Hackathon
          </p>
        </div>
      </div>
    </footer>
  );
}
