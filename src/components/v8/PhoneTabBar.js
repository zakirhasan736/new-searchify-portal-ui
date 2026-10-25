"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Exact Phone.dc.html bottom tabs — mobile layout reference. */
export const PHONE_TABS = [
  {
    href: "/app",
    label: "Moves",
    match: (p) => p === "/app",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 13h4l2 3h4l2-3h4" />
        <path d="M5 5h14l1 8v6H4v-6z" />
      </svg>
    ),
  },
  {
    href: "/app/results",
    label: "Board",
    match: (p) => p.startsWith("/app/results") || p.startsWith("/app/scan"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="6" cy="8" r="2" />
        <circle cx="12" cy="8" r="2" />
        <circle cx="18" cy="8" r="2" />
        <circle cx="6" cy="16" r="2" />
        <circle cx="12" cy="16" r="2" />
        <circle cx="18" cy="16" r="2" />
      </svg>
    ),
  },
  {
    href: "/app/path",
    label: "Progress",
    match: (p) => p.startsWith("/app/path"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 20V10" />
        <path d="M12 20V4" />
        <path d="M18 20v-7" />
      </svg>
    ),
  },
  {
    href: "/app/keywords",
    label: "Keywords",
    match: (p) => p.startsWith("/app/keywords") || p.startsWith("/app/win"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    ),
  },
  {
    href: "/app/workspace",
    label: "Sites",
    match: (p) => p.startsWith("/app/workspace") || p.startsWith("/app/sites"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

export default function PhoneTabBar({ className = "v8-phone-tabs" }) {
  const pathname = usePathname() || "/app";
  return (
    <nav aria-label="Main" className={className}>
      {PHONE_TABS.map((tab) => {
        const on = tab.match(pathname);
        return (
          <Link key={tab.href} href={tab.href} aria-current={on ? "page" : undefined}>
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
