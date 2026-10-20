function payloadOf(res) {
  return res?.data?.payload || {};
}

function asCount(value) {
  const num = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

/** Last seven stored Search Console days beside the seven days before them. */
export function weekMovement(daily) {
  const rows = (Array.isArray(daily) ? daily : [])
    .map((row) => ({
      date: String(row?.[0] || ""),
      clicks: asCount(row?.[1]),
      impressions: asCount(row?.[2]),
      position: asCount(row?.[4]),
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length < 8) return null;
  const latest = rows[rows.length - 1].date;
  const end = new Date(`${latest}T00:00:00Z`);
  const thisStart = new Date(end);
  thisStart.setUTCDate(end.getUTCDate() - 6);
  const prevEnd = new Date(thisStart);
  prevEnd.setUTCDate(thisStart.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevEnd.getUTCDate() - 6);
  const between = (row, from, to) => {
    const time = new Date(`${row.date}T00:00:00Z`).getTime();
    return time >= from.getTime() && time <= to.getTime();
  };
  const sum = (list) => {
    const clicks = list.reduce((total, row) => total + row.clicks, 0);
    const impressions = list.reduce((total, row) => total + row.impressions, 0);
    const weighted = list.reduce((total, row) => total + row.position * row.impressions, 0);
    return {
      clicks,
      impressions,
      position: impressions ? Math.round((weighted / impressions) * 10) / 10 : null,
    };
  };
  return {
    current: sum(rows.filter((row) => between(row, thisStart, end))),
    previous: sum(rows.filter((row) => between(row, prevStart, prevEnd))),
  };
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
    seoSource: scoreText(fromPsi) != null ? "PageSpeed, home page" : fromCrawl != null ? "Searchify SEO on-page score" : "Loads after PageSpeed sync or a site crawl",
  };
}

const SEVERITY_RANK = { Critical: 0, Warning: 1, Notice: 2 };

function areaCount(findings, area) {
  return findings.filter((item) => item.area === area).length;
}

export function starterPackage(findings, report = {}) {
  const gap = (area) => areaCount(findings, area);
  return [
    { name: "Meta title and description", state: gap("Meta") ? `${gap("Meta")} to review` : "Drafted from the page when you generate", href: "/app/queue", note: "Searchify writes the title and description. You approve before publishing." },
    { name: "Keywords", state: report.queries ? "Search Console queries are in" : "Open Keywords", href: "/app/keywords", note: "A title uses the keyword that matches that page." },
    { name: "Competitors", state: "Compared when a title is drafted", href: "/app/keywords", note: "Competitor titles keep the draft from copying them." },
    { name: "AI visibility", state: "Checked on its own screen", href: "/app/visibility", note: "Shows whether answer engines mention the business." },
    { name: "Google Places", state: report.places ? "Connected" : "Connect on Local", href: "/app/local", note: "A place name is used only when the page is about that place." },
    { name: "Backlinks", state: "Review referring domains", href: "/app/backlinks", note: "Searchify lists links. It does not buy or exchange them." },
    { name: "Open Graph and JSON-LD", state: gap("Social") || gap("Schema") ? "Missing on some pages" : "Written with the approved title", href: "/app/queue", note: "Publishing with the switch on uses the same title and description." },
    { name: "Images", state: gap("Images") ? `${gap("Images")} image finding${gap("Images") === 1 ? "" : "s"}` : "No missing alt text in this crawl", href: "/app/results", note: "You add the alt text. Searchify points at the pages." },
    { name: "FAQ", state: gap("FAQ") ? "Questions need answers on the page" : "No FAQ gap in this crawl", href: "/app/results", note: "Searchify does not invent answers that are not on the page." },
    { name: "Video", state: gap("Video") ? "A video page needs a description" : "No video gap in this crawl", href: "/app/results", note: "Describe the video in the title and the first paragraph." },
  ];
}

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
    const bits = [`Searchify SEO crawled ${report.pagesCrawled || "the"} pages and found this on ${issue.count}.`];
    if (seen) bits.push(`Search Console: these pages had ${seen.toLocaleString("en-US")} impressions.`);
    if (visits) bits.push(`Analytics: ${visits.toLocaleString("en-US")} sessions landed on them.`);
    const lead = pages[0];
    if (issue.meta && lead?.title) bits.push(`Example: ${pathOf(lead.url)} has the title "${lead.title}" (${lead.title.length} characters).`);
    if (issue.meta && lead && !lead.title && issue.key === "no_description") bits.push(`Example: ${pathOf(lead.url)}.`);
    if (lead?.detail) bits.push(`${pathOf(lead.url)}: ${lead.detail}`);
    const queued = open.find((change) => {
      if (keyOf(change.targetUrl) !== keyOf(lead?.url)) return false;
      if (issue.prepare === "image") return change.changeType === "image";
      if (issue.prepare === "assets") return change.changeType === "performance";
      return Boolean(issue.meta);
    });
    const pageNotes = pages.map((page) => (page.detail ? `${pathOf(page.url)}: ${page.detail}` : pathOf(page.url))).filter(Boolean);
    return {
      id: `crawl-${issue.key}`,
      severity,
      name: issue.name,
      area: issue.area || (issue.meta ? "Meta" : "Page"),
      detail: issue.prepare === "image" ? "Searchify can prepare a smaller image" : issue.prepare === "assets" ? "Searchify can queue this weight" : issue.meta ? "Searchify can prepare this" : "Update on the page",
      count: issue.count,
      pages: pages.map((page) => page.url).filter(Boolean),
      pageNotes,
      evidence: bits.join(" "),
      fix: issue.fix,
      steps: issue.steps || [],
      prepare: issue.prepare || "",
      weight: issue.weight || null,
      manual: issue.prepare ? false : !issue.meta,
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
  if (crawlReport) sources.unshift("Searchify SEO site crawl");

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
      area: "Meta",
      detail: pathOf(change.targetUrl),
      count: 1,
      pages: [change.targetUrl],
      evidence: evidenceBits.join(" "),
      fix: proposed.reason || "Review the suggested title and description, then approve the draft before anything is published.",
      steps: [
        "Read the suggested title and description.",
        "Edit them if a fact is wrong.",
        "Approve publishing. Leave Open Graph and JSON-LD on so the social card and the page schema use the same words.",
      ],
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
  const packageRows = starterPackage(findings, { pages: pageRows.length, queries: queryRows.length, places: placeRows.length });
  return {
    findings,
    packageRows,
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
