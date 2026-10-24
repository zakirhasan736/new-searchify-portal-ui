import { activeJourneySite } from "@/lib/journey";

/** Hostname + site URL for the active journey site (for API calls and UI labels). */
export function activeSiteContext(state) {
  const site = activeJourneySite(state);
  const raw = site?.answers?.site || site?.site || site?.url || "";
  let hostname = "your-site";
  let href = raw;
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    hostname = u.hostname.replace(/^www\./, "") || hostname;
    href = u.origin + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    hostname = String(raw).replace(/^https?:\/\//, "").replace(/^www\./, "") || hostname;
    href = raw || "";
  }
  return { site, hostname, href: href || raw, raw };
}
