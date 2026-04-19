"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  Notification03Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import type { AuthUser } from "../../_lib/types";
import { SearchDialog } from "./search-dialog";
import { UserMenu } from "./user-menu";

interface TopbarProps {
  user: AuthUser | null;
  alertCount: number;
  onLogout: () => void;
}

export function Topbar({ user, alertCount, onLogout }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && (e.key === "k" || e.key === "K" || e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-black/[0.04] bg-white/90 px-6 py-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search assets"
          className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-black/[0.06] bg-black/[0.02] px-4 py-2.5 text-left text-sm text-foreground/50 transition-colors hover:bg-black/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <HugeiconsIcon icon={Search01Icon} className="size-4" />
          <span>Search assets, symbols…</span>
          <span className="ml-auto rounded-md border border-black/[0.06] bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground/60">
            ⌘K
          </span>
        </button>

        <div className="flex items-center gap-2">
          <IconButton icon={Mail01Icon} label="Messages" disabled />
          <div className="relative">
            <IconButton icon={Notification03Icon} label="Notifications" disabled />
            {alertCount > 0 ? (
              <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            ) : null}
          </div>
        </div>

        <div className="pl-2">
          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <div className="flex size-10 animate-pulse rounded-full bg-black/[0.06]" />
          )}
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

interface IconButtonProps {
  icon: typeof Mail01Icon;
  label: string;
  disabled?: boolean;
}

function IconButton({ icon, label, disabled }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      title={disabled ? `${label} — coming soon` : label}
      className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-black/[0.06] bg-white text-foreground/70 transition-colors hover:bg-black/[0.03] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-foreground/70"
    >
      <HugeiconsIcon icon={icon} className="size-4" />
    </button>
  );
}
