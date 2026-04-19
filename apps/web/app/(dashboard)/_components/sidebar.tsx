"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ChartLineData02Icon,
  DashboardSquare02Icon,
  Logout02Icon,
  PieChart09Icon,
  SidebarLeftIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarCollapse } from "./sidebar-collapse-context";

interface SidebarProps {
  onLogout: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof DashboardSquare02Icon;
}

const MENU_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardSquare02Icon },
  { href: "/portfolios", label: "Portfolios", icon: PieChart09Icon },
  { href: "/alerts", label: "Alerts", icon: Alert02Icon },
  { href: "/market", label: "Market", icon: ChartLineData02Icon },
];

const GENERAL_ITEMS: readonly NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings02Icon },
];

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarCollapse();

  const width = collapsed ? "w-[72px]" : "w-[240px]";

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-black/[0.06] bg-white transition-[width] duration-200 ease-out lg:flex ${width}`}
    >
      <div
        className={`flex items-center gap-2.5 px-5 pt-5 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <Link
          href="/"
          aria-label="Synth Sentry home"
          className="flex cursor-pointer items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <Image
            src="/synth_sentry_emblem.png"
            alt="Synth Sentry"
            width={72}
            height={72}
            priority
            className="size-9 shrink-0 object-contain"
          />
          {!collapsed ? (
            <span className="whitespace-nowrap font-display text-lg font-semibold tracking-tight text-foreground">
              Synth Sentry
            </span>
          ) : null}
        </Link>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`mx-3 mt-4 flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-black/[0.06] bg-white text-xs font-medium text-foreground/60 transition-colors hover:bg-black/[0.03] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          collapsed ? "justify-center px-2" : "justify-start px-3"
        }`}
      >
        <HugeiconsIcon
          icon={SidebarLeftIcon}
          className={`size-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
        />
        {!collapsed ? "Collapse" : null}
      </button>

      <div className="mt-6 flex min-h-0 flex-1 flex-col px-3">
        {!collapsed ? (
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
            Menu
          </div>
        ) : (
          <div className="mb-2 h-2" />
        )}
        <nav className="flex flex-col gap-1">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {!collapsed ? (
          <div className="mb-2 mt-8 px-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
            General
          </div>
        ) : (
          <div className="mb-2 mt-6 h-px bg-black/[0.05]" />
        )}
        <nav className="flex flex-col gap-1">
          {GENERAL_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Logout" : undefined}
            className={`flex cursor-pointer items-center gap-3 rounded-xl text-sm font-medium text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
            }`}
          >
            <HugeiconsIcon icon={Logout02Icon} className="size-[18px]" />
            {!collapsed ? "Logout" : null}
          </button>
        </nav>

        <div className="mt-auto pb-5 pt-5">
          {!collapsed ? <HealthCallout /> : <CollapsedHealthCallout />}
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`group flex cursor-pointer items-center gap-3 rounded-xl text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
      } ${
        active
          ? "bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]"
          : "text-foreground/70 hover:bg-black/[0.04] hover:text-foreground"
      }`}
    >
      <HugeiconsIcon icon={item.icon} className="size-[18px]" />
      {!collapsed ? item.label : null}
    </Link>
  );
}

function HealthCallout() {
  return (
    <div className="relative overflow-hidden rounded-card bg-surface-marketing p-4 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 100% 0%, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent 60%)",
        }}
      />
      <div className="relative z-10">
        <div className="font-display text-sm font-semibold">Portfolio health</div>
        <p className="mt-1 text-xs text-white/60">
          Gemini-explained risk scoring is live.
        </p>
      </div>
    </div>
  );
}

function CollapsedHealthCallout() {
  return (
    <div
      className="relative mx-auto flex size-10 items-center justify-center overflow-hidden rounded-xl bg-surface-marketing"
      title="Portfolio health — Gemini reasoning is live"
    >
      <span className="relative inline-flex size-2">
        <span className="animate-pulse-soft absolute inset-0 rounded-full bg-primary/70" />
        <span className="relative size-2 rounded-full bg-primary" />
      </span>
    </div>
  );
}
