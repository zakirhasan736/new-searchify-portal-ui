"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const IconMoves = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 13h4l2 3h4l2-3h4" />
    <path d="M5 5h14l1 8v6H4v-6z" />
  </svg>
);
const IconBoard = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="6" cy="8" r="2" />
    <circle cx="12" cy="8" r="2" />
    <circle cx="18" cy="8" r="2" />
    <circle cx="6" cy="16" r="2" />
    <circle cx="12" cy="16" r="2" />
    <circle cx="18" cy="16" r="2" />
  </svg>
);
const IconProgress = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 20V10" />
    <path d="M12 20V4" />
    <path d="M18 20v-7" />
  </svg>
);
const IconKeywords = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);
const IconSites = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
const IconPlan = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <path d="M7 14h4" />
  </svg>
);

/** Exact Phone.dc.html bottom tabs — mobile layout reference. */
export const PHONE_TABS = [
  { href: "/app", label: "In progress", match: (p) => p === "/app", alwaysOpen: true, icon: IconMoves },
  { href: "/app/results", label: "Scan", match: (p) => p.startsWith("/app/results") || p.startsWith("/app/scan"), icon: IconBoard },
  { href: "/app/path", label: "Progress", match: (p) => p.startsWith("/app/path"), icon: IconProgress },
  { href: "/app/keywords", label: "Keywords", match: (p) => p.startsWith("/app/keywords") || p.startsWith("/app/win"), icon: IconKeywords },
  { href: "/app/workspace", label: "Sites", match: (p) => p.startsWith("/app/workspace") || p.startsWith("/app/sites"), icon: IconSites },
];

const LOCKED_TABS = [
  { href: "/app", label: "In progress", match: (p) => p === "/app", alwaysOpen: true, icon: IconMoves },
  { href: "/app/results", label: "Scan", match: (p) => p.startsWith("/app/results"), icon: IconBoard },
  { href: "/app/path", label: "Progress", match: (p) => p.startsWith("/app/path"), icon: IconProgress },
  { href: "/app/keywords", label: "Keywords", match: (p) => p.startsWith("/app/keywords"), icon: IconKeywords },
  { href: "/app/billing", label: "Plan", match: (p) => p.startsWith("/app/billing") || p.startsWith("/app/plans"), alwaysOpen: true, icon: IconPlan },
];

export default function PhoneTabBar({ className = "v8-phone-tabs", trialLocked = false }) {
  const pathname = usePathname() || "/app";
  const tabs = trialLocked ? LOCKED_TABS : PHONE_TABS;

  return (
    <nav aria-label="Main" className={className}>
      {tabs.map((tab) => {
        const on = tab.match(pathname);
        const locked = trialLocked && !tab.alwaysOpen;
        if (locked) {
          return (
            <span key={tab.href} aria-disabled="true" title="Start a paid plan to unlock" style={{ opacity: 0.4, pointerEvents: "none" }}>
              {tab.icon}
              {tab.label}
            </span>
          );
        }
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
