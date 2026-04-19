"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowRight02Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BrandLoader } from "../../_components/brand-loader";
import { ApiError } from "../../_lib/api";
import { login, signup } from "../../_lib/auth";

export type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup({ name, email, password });
      } else {
        await login({ email, password });
      }
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <header className="text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {isSignup ? "Create account" : "Sign in"}
        </h2>
        <p className="mt-1.5 text-sm text-foreground/60">
          {isSignup
            ? "Start monitoring your portfolio risk in minutes."
            : "Access your Synth Sentry account."}
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {isSignup ? (
        <Field label="Full name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Ada Lovelace"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
        </Field>
      ) : null}

      <Field label="Email address">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@company.com"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
        />
      </Field>

      <Field label="Password">
        <div className="flex items-center gap-2">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="••••••••"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="cursor-pointer rounded-md p-1 text-foreground/50 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <HugeiconsIcon
              icon={showPassword ? ViewOffIcon : ViewIcon}
              className="size-4"
            />
          </button>
        </div>
      </Field>

      {!isSignup ? (
        <div className="flex items-center justify-between text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-foreground/70">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
              className="size-3.5 cursor-pointer accent-primary"
            />
            Keep me logged in
          </label>
          <span
            aria-disabled="true"
            title="Not yet available"
            className="cursor-not-allowed font-medium text-foreground/40"
          >
            Forgot password?
          </span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--color-primary)_60%,transparent)] transition-all duration-200 hover:brightness-[0.96] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {submitting ? <BrandLoader size="sm" tone="dark" /> : null}
        {isSignup ? "Create account" : "Sign in"}
        {!submitting ? (
          <HugeiconsIcon
            icon={ArrowRight02Icon}
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        ) : null}
      </button>

      <p className="text-center text-xs text-foreground/60">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-foreground hover:text-primary-foreground hover:underline"
            >
              Sign in
            </a>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-semibold text-foreground hover:underline"
            >
              Register
            </a>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 transition-colors focus-within:border-foreground/30">
      <span className="block text-[10px] font-medium uppercase tracking-wider text-foreground/50">
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}
