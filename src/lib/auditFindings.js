function payloadOf(res) {
  return res?.data?.payload || {};
}

function pathOf(url) {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return String(url || "").replace(/^https?:\/\/[^/]+/i, "") || "/";
  }
}

function panelRows(payload, titleStart) {
  const panels = payload?.tablePanels || [];
  const panel = panels.find((item) => String(item?.title || "").toLowerCase().startsWith(titleStart));
  return panel?.rows || [];
}

function keyOf(url) {
  return pathOf(url).replace(/\/+$/, "") || "/";
}

function kpiValue(rows, label) {
  const hit = (rows || []).find((row) => {
    const name = String(row?.[0] || "").trim().toLowerCase();
    return name === label || name.includes(label);
  });
  const raw = hit?.[1];
  if (raw == null || raw === "" || raw === "—") return null;
  return raw;
}

function scoreText(value) {
  if (value == null || value === "" || value === "—") return null;
  const num = Number(value);
  if (Number.isFinite(num)) return String(Math.round(num));
  return String(value);
}

/** PageSpeed SEO first, then crawl on-page score — never collapse 0 to blank. */
export function resolveSeoScore(auditPayload = {}, crawlReport = null) {
  const fromPsi =
    kpiValue(auditPayload.kpis, "seo")
    ?? kpiValue(auditPayload.panels?.kpis, "seo")
    ?? auditPayload.scores?.mobile?.seo
    ?? auditPayload.scores?.seo
    ?? auditPayload.panels?.audit?.find?.((row) => String(row?.[0] || "").toLowerCase() === "seo")?.[1];
  const fromCrawl = crawlReport?.seoScore ?? crawlReport?.score;
  const text = scoreText(fromPsi) ?? scoreText(fromCrawl);
  return {
    seoScore: text,
    seoSource: scoreText(fromPsi) != null ? "PageSpeed, home page" : fromCrawl != null ? "DataForSEO on-page score" : "Loads after PageSpeed sync or a site crawl",
  };
}

const SEVERITY_RANK = { Critical: 0, Warning: 1, Notice: 2 };

const PSI_CRITICAL = /document title|title element|http status|is.?crawlable|robots\.txt|canonical|indexability|noindex|blocked/i;

function crawlFindings(report, { impressions, sessions, open }) {
  return (report?.issues || []).map((issue) => {
    const pages = (issue.pages || []).map((page) => ({
      ...page,
      impressions: impressions.get(keyOf(page.url)) || 0,
      sessions: sessions.get(keyOf(page.url)) || 0,
    })).sort((a, b) => (b.impressions + b.sessions) - (a.impressions + a.sessions));
    const seen = pages.reduce((sum, page) => sum + page.impressions, 0);
    const visits = pages.reduce((sum, page) => sum + page.sessions, 0);
    let severity = issue.severity || "Notice";
    if ((seen || visits) && severity === "Notice") severity = "Warning";
    const bits = [`DataForSEO crawled ${report.pagesCrawled || "the"} pages and found this on ${issue.count}.`];
    if (seen) bits.push(`Search Console: these pages had ${seen.toLocaleString("en-US")} impressions.`);
    if (visits) bits.push(`Analytics: ${visits.toLocaleString("en-US")} sessions landed on them.`);
    const lead = pages[0];
    if (issue.meta && lead?.title) bits.push(`Example: ${pathOf(lead.url)} has the title "${lead.title}" (${lead.title.length} characters).`);
    if (issue.meta && lead && !lead.title && issue.key === "no_description") bits.push(`Example: ${pathOf(lead.url)}.`);
    const queued = issue.meta ? open.find((change) => keyOf(change.targetUrl) === keyOf(lead?.url)) : null;
    return {
      id: `crawl-${issue.key}`,
      severity,
      name: issue.name,
      detail: issue.meta ? "Metadata draft supported" : "Manual investigation",
      count: issue.count,
      pages: pages.map((page) => page.url).filter(Boolean),
      evidence: bits.join(" "),
      fix: issue.fix,
      manual: !issue.meta,
      changeId: queued?.id || null,
      suggestion: null,
      traffic: seen + visits,
      source: "crawl",
    };
  });
}

export function buildAuditFindings({ audit, pages, queries, landings, places, changes, crawl }) {
  const auditPayload = payloadOf(audit);
  const pageRows = payloadOf(pages).rows || [];
  const queryRows = payloadOf(queries).rows || [];
  const landingRows = payloadOf(landings).rows || [];
  const placeRows = payloadOf(places).rows || [];
  const open = (Array.isArray(changes) ? changes : []).filter((change) => ["proposed", "awaiting_approval", "approved"].includes(change.status));
  const queuedUrls = new Set(open.map((change) => String(change.targetUrl || "").replace(/\/$/, "")));
  const findings = [];
  const crawlReport = crawl?.report || null;
  const { seoScore, seoSource } = resolveSeoScore(auditPayload, crawlReport);
  const sources = [];
  if (pageRows.length || queryRows.length) sources.push("Search Console");
  if (landingRows.length) sources.push("Analytics");
  if (auditPayload.scores || (auditPayload.kpis || []).length) sources.push("PageSpeed");
  if (placeRows.length) sources.push("Places");
  if (crawlReport) sources.unshift("DataForSEO site crawl");

  open.forEach((change) => {
    const proposed = change.proposed || {};
    const evidenceBits = ["The live page was read."];
    if (proposed.evidence) evidenceBits.push(`Search Console: ${proposed.evidence.clicks ?? "—"} clicks, ${proposed.evidence.impressions ?? "—"} impressions, position ${proposed.evidence.position ?? "—"}.`);
    if (proposed.analytics) evidenceBits.push("Analytics has a stored landing or channel figure for this property.");
    if (Array.isArray(proposed.competitors) && proposed.competitors.length) evidenceBits.push(`${proposed.competitors.length} competitor titles were compared.`);
    if (seoScore != null) evidenceBits.push(`SEO score for the tested URL is ${seoScore}.`);
    if (placeRows.length) evidenceBits.push("Places data is connected, so a local name is only used when the page is about that place.");
    findings.push({
      id: `change-${change.id}`,
      severity: proposed.title ? "Warning" : "Critical",
      name: proposed.title ? "Title and description are ready to review" : "This page still needs a title and description",
      detail: pathOf(change.targetUrl),
      count: 1,
      pages: [change.targetUrl],
      evidence: evidenceBits.join(" "),
      fix: proposed.reason || "Review the suggested title and description, then approve the draft before anything is published.",
      manual: false,
      changeId: change.id,
      suggestion: proposed.title ? {
        beforeTitle: proposed.beforeTitle || "Current title",
        title: proposed.title,
        beforeDescription: proposed.beforeDescription || "None stored",
        description: proposed.metaDescription || "",
      } : null,
    });
  });

  const titles = new Map();
  open.forEach((change) => {
    const title = String(change.proposed?.title || "").trim().toLowerCase();
    if (!title) return;
    const list = titles.get(title) || [];
    list.push(change);
    titles.set(title, list);
  });
  titles.forEach((list) => {
    if (list.length < 2) return;
    findings.unshift({
      id: `dup-${list.map((change) => change.id).join("-")}`,
      severity: "Warning",
      name: "Two pages share the same suggested title",
      detail: "Give each page its own subject",
      count: list.length,
      pages: list.map((change) => change.targetUrl),
      evidence: `The same suggested title is on ${list.map((change) => pathOf(change.targetUrl)).join(", ")}.`,
      fix: "Generate again with a more exact style, or edit one title so each page describes its own offer.",
      manual: false,
      changeId: list[0].id,
      suggestion: null,
    });
  });

  panelRows(auditPayload, "seo audits").forEach((row, index) => {
    if (row[1] !== "Fail") return;
    const name = String(row[0] || "SEO check");
    const aboutMeta = /title|meta description|document/i.test(name);
    const critical = PSI_CRITICAL.test(name);
    findings.push({
      id: `psi-${index}`,
      severity: critical ? "Critical" : aboutMeta ? "Warning" : "Notice",
      name,
      detail: aboutMeta ? "Metadata draft supported" : "Manual investigation",
      count: 1,
      pages: [auditPayload.finalUrl || auditPayload.url || "/"],
      evidence: `PageSpeed marked this ${row[1]}. ${row[4] || row[2] || "No extra detail was stored."}`,
      fix: aboutMeta
        ? "Use the title and description draft for this URL, then approve it before publishing."
        : "Confirm the page should change before treating this as a content edit.",
      manual: !aboutMeta,
      changeId: null,
      suggestion: null,
    });
  });

  pageRows.slice(0, 12).forEach((row, index) => {
    const url = String(row[0] || "");
    if (!url || queuedUrls.has(url.replace(/\/$/, ""))) return;
    const impressions = Number(row[2] || 0);
    const ctr = Number(String(row[3] || "").replace("%", "")) || 0;
    const position = Number(row[4] || 0);
    if (!(impressions > 50 && ctr < 2) && !(position > 10 && impressions > 20)) return;
    findings.push({
      id: `gsc-${index}`,
      severity: position > 20 ? "Critical" : "Warning",
      name: ctr < 2 ? "Search Console shows clicks that a clearer title could earn" : "This page is beyond the first results page",
      detail: pathOf(url),
      count: 1,
      pages: [url],
      evidence: `Search Console: ${row[1] || 0} clicks, ${row[2] || 0} impressions, CTR ${row[3] || "—"}, position ${row[4] || "—"}.`,
      fix: "Send this page to the approval queue so Searchify can draft a title and description from the page, the query, Analytics, and competitor titles.",
      manual: false,
      changeId: null,
      suggestion: null,
    });
  });

  landingRows.slice(0, 8).forEach((row, index) => {
    const bounce = Number(String(row[3] || "").replace("%", ""));
    if (!Number.isFinite(bounce) || bounce < 70) return;
    findings.push({
      id: `ga-${index}`,
      severity: "Notice",
      name: "A landing page may be promising the wrong result",
      detail: pathOf(row[0]),
      count: 1,
      pages: [String(row[0] || "/")],
      evidence: `Analytics: ${row[1] || "—"} sessions and bounce ${row[3]}.`,
      fix: "Check the description against what the page actually offers before approving a rewrite.",
      manual: false,
      changeId: null,
      suggestion: null,
    });
  });

  if (placeRows.length) {
    const top = placeRows[0];
    findings.push({
      id: "places",
      severity: "Notice",
      name: "The local listing should agree with the page title",
      detail: String(top[0] || "Places"),
      count: placeRows.length,
      pages: placeRows.slice(0, 4).map((row) => String(row[0] || "Place")),
      evidence: `Places returned ${placeRows.length} nearby results. The first stored name is ${top[0] || "unnamed"}.`,
      fix: "Use the place name in a title only when that page is about that business or location.",
      manual: true,
      changeId: null,
      suggestion: null,
    });
  }

  if (crawlReport) {
    const impressions = new Map();
    pageRows.forEach((row) => impressions.set(keyOf(row[0]), (impressions.get(keyOf(row[0])) || 0) + (Number(row[2]) || 0)));
    const sessions = new Map();
    landingRows.forEach((row) => sessions.set(keyOf(row[0]), (sessions.get(keyOf(row[0])) || 0) + (Number(String(row[1] || "").replace(/,/g, "")) || 0)));
    findings.push(...crawlFindings(crawlReport, { impressions, sessions, open }));
  }
  findings.sort((a, b) => (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3) || (b.traffic || 0) - (a.traffic || 0));

  const critical = findings.filter((item) => item.severity === "Critical").length;
  const used = sources.filter(Boolean);
  return {
    findings,
    report: {
      seoScore,
      seoSource,
      health: crawlReport?.score ?? null,
      critical,
      crawled: crawlReport?.pagesCrawled || 0,
      pages: pageRows.length,
      queries: queryRows.length,
      places: placeRows.length,
      sources: used,
    },
  };
}
