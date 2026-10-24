"use client";

import AppChrome from "@/components/v8/AppChrome";

/**
 * Post-login shell is the V8 Nav.dc.html chrome only.
 * Old results-board topbar / WebsiteBar / mobile tabbar removed so pages match the zip HTML.
 */
export default function BoardShell({ children }) {
  return <AppChrome>{children}</AppChrome>;
}
