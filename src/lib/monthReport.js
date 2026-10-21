const PUBLISHED = new Set(["applied", "monitoring", "published_unverified", "closed"]);
const PLAN = new Set(["proposed", "awaiting_approval", "approved", "failed", "needs_review"]);

/** Parse a countable metric. Missing / blank stays null — never invent zero. */
function asCount(value) {
  if (value == null || value === "" || value === "—" || value === "n/a") return null;
  const num = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num : null;
}

function sumWindow(rows) {
  const clicks = rows.reduce((total, row) => total + (row.clicks || 0), 0);
  const impressions = rows.reduce((total, row) => total + (row.impressions || 0), 0);
  const withPos = rows.filter((row) => row.position != null && row.impressions);
  const weighted = withPos.reduce((total, row) => total + row.position * row.impressions, 0);
  const posImpr = withPos.reduce((total, row) => total + row.impressions, 0);
  return {
    clicks,
    impressions,
    position: posImpr ? Math.round((weighted / posImpr) * 10) / 10 : null,
    days: rows.length,
  };
}

/** Latest 14 stored days beside the 14 days before them. */
export function clickHalves(daily) {
  const rows = (Array.isArray(daily) ? daily : [])
    .map((row) => ({
      date: String(row?.[0] || ""),
      clicks: asCount(row?.[1]),
      impressions: asCount(row?.[2]),
      position: asCount(row?.[4]),
    }))
    .filter((row) => row.date && row.clicks != null && row.impressions != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length < 28) return null;
  return {
    earlier: sumWindow(rows.slice(-28, -14)),
    latest: sumWindow(rows.slice(-14)),
  };
}

export function statusLabel(status) {
  return {
    proposed: "Draft",
    awaiting_approval: "Waiting for approval",
    approved: "Approved",
    failed: "Publish failed",
    needs_review: "Needs review",
    applied: "Published",
    monitoring: "Published",
    published_unverified: "Published",
    closed: "Published",
  }[status] || status || "Draft";
}

export function planRows(changes, dates = {}) {
  return (Array.isArray(changes) ? changes : [])
    .filter((change) => PLAN.has(change.status))
    .map((change) => ({
      id: change.id,
      keyword: String(change.proposed?.title || change.opportunity || "Untitled").trim(),
      status: statusLabel(change.status),
      url: change.targetUrl || change.target_url || "",
      date: dates[change.id] || "",
    }));
}

export function publishedRows(changes, pages) {
  const byUrl = new Map((pages || []).map((row) => [String(row.label || ""), row]));
  return (Array.isArray(changes) ? changes : [])
    .filter((change) => PUBLISHED.has(change.status))
    .map((change) => {
      const url = change.targetUrl || change.target_url || "";
      const hit = [...byUrl.values()].find((row) => url && (row.label === url || url.includes(row.label) || row.label.includes(url)));
      return {
        id: change.id,
        name: String(change.proposed?.title || change.opportunity || url || "Published page").trim(),
        url,
        when: change.appliedAt || change.applied_at || "",
        clicks: hit ? hit.clicks : null,
        impressions: hit ? hit.impressions : null,
        position: hit ? hit.position : null,
      };
    });
}

const DATES = "sf-month-dates";

export function readMonthDates(siteKey) {
  if (!siteKey || typeof window === "undefined") return {};
  try {
    const all = JSON.parse(window.localStorage.getItem(DATES) || "{}");
    return all[siteKey] && typeof all[siteKey] === "object" ? all[siteKey] : {};
  } catch {
    return {};
  }
}

export function writeMonthDates(siteKey, dates) {
  if (!siteKey || typeof window === "undefined") return;
  const all = JSON.parse(window.localStorage.getItem(DATES) || "{}");
  all[siteKey] = dates;
  window.localStorage.setItem(DATES, JSON.stringify(all));
}

function keywordOf(idea) {
  if (typeof idea === "string") return idea.trim();
  return String(idea?.keyword || "").trim();
}

function changeKeyword(change) {
  return [change?.opportunity, change?.proposed?.keyword, change?.keyword, change?.proposed?.title]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
}

/** Ideas the stored Search Console queries do not already list. A missing console does not count as uncovered. */
export function contentPlan({ ideas, queries, changes, limit = 8 } = {}) {
  const ranking = new Set();
  for (const row of Array.isArray(queries) ? queries : []) {
    const query = String(Array.isArray(row) ? row[0] : row?.query || "").trim().toLowerCase();
    if (query) ranking.add(query);
  }
  if (!ranking.size) return { state: "needs-console", rows: [] };
  if (!Array.isArray(ideas) || !ideas.length) return { state: "needs-ideas", rows: [] };
  const seen = new Set();
  const rows = [];
  for (const idea of ideas) {
    const keyword = keywordOf(idea);
    const key = keyword.toLowerCase();
    if (!key || seen.has(key) || ranking.has(key)) continue;
    seen.add(key);
    const change = (Array.isArray(changes) ? changes : []).find((item) => changeKeyword(item).includes(key));
    rows.push({
      id: change?.id || key,
      keyword,
      status: change ? statusLabel(change.status) : "Not drafted",
      changeId: change?.id || null,
    });
    if (rows.length >= limit) break;
  }
  return rows.length ? { state: "ready", rows } : { state: "covered", rows: [] };
}

export function applyPlanDates(rows, dates = {}) {
  return (rows || []).map((row) => ({
    ...row,
    date: dates[String(row.keyword || "").toLowerCase()] || (row.changeId != null ? dates[row.changeId] || "" : "") || "",
  }));
}

export function issueCounts(issues) {
  const counts = { errors: 0, warnings: 0, notices: 0 };
  for (const issue of issues || []) {
    if (issue.severity === "Critical") counts.errors += 1;
    else if (issue.severity === "Warning") counts.warnings += 1;
    else counts.notices += 1;
  }
  return counts;
}

export function monthEmail({ host, halves, published, counts, visibility, plan }) {
  const lines = [`Monthly Searchify report for ${host || "this site"}`, ""];
  if (halves) {
    const fell = halves.latest.clicks < halves.earlier.clicks;
    const diff = Math.abs(halves.latest.clicks - halves.earlier.clicks);
    lines.push(fell
      ? `Clicks fell by ${diff.toLocaleString("en-US")}, from ${halves.earlier.clicks.toLocaleString("en-US")} to ${halves.latest.clicks.toLocaleString("en-US")}.`
      : `Clicks were ${halves.latest.clicks.toLocaleString("en-US")} in the latest 14 days and ${halves.earlier.clicks.toLocaleString("en-US")} in the 14 days before.`);
    lines.push(`Impressions ${halves.latest.impressions.toLocaleString("en-US")} latest, ${halves.earlier.impressions.toLocaleString("en-US")} before.`);
    lines.push(`Average position ${halves.latest.position ?? "—"} latest, ${halves.earlier.position ?? "—"} before. This is where the site showed, not a promise it will rank.`);
  } else {
    lines.push("Two 14-day Search Console windows are not stored yet, so this report does not claim clicks rose.");
  }
  lines.push("", published?.length ? "Published:" : "Nothing in the queue is marked published.");
  for (const row of (published || []).slice(0, 8)) {
    const seen = row.clicks == null ? "no stored Search Console row" : `${row.clicks.toLocaleString("en-US")} clicks, position ${row.position ?? "—"}`;
    lines.push(`- ${row.name}: ${seen}`);
  }
  lines.push("", plan?.length ? "Content plan, keywords Search Console does not already list:" : "No uncovered keyword is on this month's plan.");
  for (const row of (plan || []).slice(0, 8)) {
    lines.push(`- ${row.keyword}: ${row.status}${row.date ? `, date ${row.date}` : ", no publish date"}. A date does not publish.`);
  }
  lines.push("", `Still open: ${counts?.errors || 0} errors, ${counts?.warnings || 0} warnings, ${counts?.notices || 0} notices.`);
  lines.push(`Plan items without a publish date: ${(plan || []).filter((row) => !row.date).length}. Plan items dated: ${(plan || []).filter((row) => row.date).length}.`);
  lines.push("", visibility || "AI visibility: no stored check yet.");
  lines.push("", "Nothing in this report is published.");
  return lines.join("\n");
}
