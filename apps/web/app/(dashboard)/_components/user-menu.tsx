"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Logout02Icon,
  Settings02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "../../_lib/types";

interface UserMenuProps {
  user: AuthUser;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-display text-xs font-bold text-primary-foreground">
          {initials(user.name)}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className={`size-3 text-foreground/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-fade-in-up absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center gap-3 border-b border-black/[0.04] px-3 py-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-display text-sm font-bold text-primary-foreground">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </div>
              <div className="truncate text-xs text-foreground/50">
                {user.email}
              </div>
            </div>
          </div>

          <div className="mt-1 flex flex-col">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-black/[0.04]"
            >
              <HugeiconsIcon icon={UserCircleIcon} className="size-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-black/[0.04]"
            >
              <HugeiconsIcon icon={Settings02Icon} className="size-4" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              role="menuitem"
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <HugeiconsIcon icon={Logout02Icon} className="size-4" />
              Sign out
            </button>
          </div>

          <div className="mt-1 flex items-center gap-2 border-t border-black/[0.04] px-3 py-2 text-[10px] text-foreground/40">
            <span className="rounded-full bg-black/[0.04] px-1.5 py-0.5 font-mono uppercase">
              {user.role}
            </span>
            <span className="truncate font-mono">{user.id.slice(0, 8)}</span>
          </div>
        </div>
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
