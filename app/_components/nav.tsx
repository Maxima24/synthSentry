"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#company", label: "Company" },
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-12 z-50 mx-auto flex w-[min(100%-1rem,84rem)] items-center justify-between rounded-panel border px-5 py-3.5 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled
          ? "border-white/15 bg-surface-marketing/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.14),inset_0_-1px_0_rgb(0_0_0/0.3),0_12px_40px_-10px_rgb(0_0_0/0.5)] backdrop-blur-xl"
          : "border-transparent bg-transparent shadow-none"
      }`}
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-lg px-1 font-display text-lg font-semibold tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <Image
          src="/synth_sentry_emblem.png"
          alt=""
          width={160}
          height={160}
          priority
          className="size-11"
        />
        Synth Sentry
      </Link>

      <ul className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="rounded-full px-4 py-2 text-sm text-white/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden rounded-full px-4 py-2 text-sm text-white/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-block"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Get started
          <span aria-hidden className="text-base leading-none">→</span>
        </Link>
      </div>
    </nav>
  );
}
