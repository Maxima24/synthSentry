"use client";

export function EmailCTA() {
  return (
    <form
      className="animate-fade-in-up mt-9 flex w-full max-w-md items-stretch gap-1.5 rounded-panel bg-white p-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] [animation-delay:240ms]"
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor="hero-email" className="sr-only">
        Work email
      </label>
      <input
        id="hero-email"
        type="email"
        required
        placeholder="Enter email address"
        className="min-w-0 flex-1 rounded-lg bg-transparent px-4 text-sm text-foreground placeholder:text-foreground/45 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />
      <button
        type="submit"
        className="group inline-flex shrink-0 items-center gap-2.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow duration-300 hover:shadow-[0_0_36px_color-mix(in_oklab,var(--color-primary)_60%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
      >
        Request a demo
        <ArrowBadge />
      </button>
    </form>
  );
}

function ArrowBadge() {
  return (
    <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary-foreground">
      <svg
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden
        className="size-2.5 transition-transform group-hover:translate-x-0.5"
      >
        <path
          d="M2 5h6M5.5 2.5L8 5 5.5 7.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
