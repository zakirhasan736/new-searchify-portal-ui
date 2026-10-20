const KEY = "sf-phone-report";

export function listedRows(rows, limit = 5) {
  return (Array.isArray(rows) ? rows : [])
    .slice(0, limit)
    .map((row) => ({
      label: String(row?.[0] || ""),
      clicks: Number(String(row?.[1] ?? "").replace(/[^\d.]/g, "")) || 0,
      impressions: Number(String(row?.[2] ?? "").replace(/[^\d.]/g, "")) || 0,
      position: String(row?.[4] ?? "—"),
    }))
    .filter((row) => row.label);
}

export function readPhoneReport(siteKey) {
  if (!siteKey || typeof window === "undefined") return null;
  try {
    const all = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    const row = all[siteKey];
    return row && typeof row === "object" ? row : null;
  } catch {
    return null;
  }
}

export function writePhoneReport(siteKey, report) {
  if (!siteKey || typeof window === "undefined") return;
  const all = JSON.parse(window.localStorage.getItem(KEY) || "{}");
  all[siteKey] = report;
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
