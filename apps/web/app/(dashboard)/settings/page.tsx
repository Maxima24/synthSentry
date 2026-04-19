"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Logout02Icon,
  Tick02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHead } from "../_components/page-head";
import { logout as logoutFn } from "../../_lib/auth";
import { useMe } from "../../_lib/queries";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user, error } = useMe();

  function handleLogout() {
    logoutFn();
    qc.clear();
    router.replace("/login");
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHead
        title="Settings"
        subtitle="Account, session, and API configuration."
      />

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to load"}
        </div>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-card border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <header className="flex items-center gap-2 border-b border-black/[0.04] px-6 py-4">
          <HugeiconsIcon icon={UserCircleIcon} className="size-4 text-foreground/60" />
          <h2 className="font-display text-base font-semibold text-foreground">
            Profile
          </h2>
        </header>
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-display text-lg font-bold text-primary-foreground">
            {user ? initials(user.name) : "··"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-semibold text-foreground">
              {user?.name ?? "Loading…"}
            </div>
            <div className="truncate text-sm text-foreground/60">
              {user?.email ?? ""}
            </div>
          </div>
          {user ? (
            <span className="rounded-full bg-black/[0.04] px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-foreground">
              {user.role}
            </span>
          ) : null}
        </div>
        {user ? (
          <dl className="grid grid-cols-1 gap-px border-t border-black/[0.04] bg-black/[0.04] sm:grid-cols-2">
            <InfoRow label="User ID" value={user.id} monospace copyable />
            <InfoRow label="Email" value={user.email} copyable />
          </dl>
        ) : null}
      </section>

      <section className="mt-6 overflow-hidden rounded-card border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <header className="border-b border-black/[0.04] px-6 py-4">
          <h2 className="font-display text-base font-semibold text-foreground">
            Session
          </h2>
        </header>
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <p className="text-sm text-foreground/60">
            Signing out clears your tokens from this device.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <HugeiconsIcon icon={Logout02Icon} className="size-4" />
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  monospace?: boolean;
  copyable?: boolean;
}

function InfoRow({ label, value, monospace, copyable }: InfoRowProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-white px-6 py-3.5">
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
          {label}
        </dt>
        <dd
          className={`mt-0.5 truncate text-sm ${
            monospace ? "font-mono" : ""
          } text-foreground`}
          title={value}
        >
          {value}
        </dd>
      </div>
      {copyable ? (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-black/[0.04] hover:text-foreground"
        >
          <HugeiconsIcon
            icon={copied ? Tick02Icon : Copy01Icon}
            className="size-3.5"
          />
        </button>
      ) : null}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
