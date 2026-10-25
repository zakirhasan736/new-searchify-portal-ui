export function brandTail(title) {
  const parts = String(title || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return "";
  const tail = parts[parts.length - 1];
  return tail.length <= 42 ? tail : "";
}

export function listingKept(proposed) {
  const p = proposed || {};
  const decision = p.decision || p.analysis?.decision || "";
  return Boolean(p.recommendKeep || p.analysis?.recommendKeep || decision === "KEEP_CURRENT");
}

export function listingStatus(liveTitle, { keep }) {
  const title = String(liveTitle || "").trim();
  const missing = !title || title.startsWith("(");
  if (missing) {
    return keep
      ? "This page has no title to keep, so the recommendation below is the one to review."
      : "This page needs a title. The recommendation below is ready to review.";
  }
  const brand = brandTail(title);
  if (keep && brand) {
    return `The current title with “| ${brand}” is the better choice for now, unless your Google Search Console and keyword data show that removing the brand improves relevance or performance.`;
  }
  if (keep) {
    return `The current title “${title}” is the better choice for now, unless your Google Search Console and keyword data show that a rewrite improves relevance or performance.`;
  }
  return `The current title “${title}” stays published until you approve a change. The recommendation below is the stronger listing for this page.`;
}

export function whyLines(proposed) {
  const p = proposed || {};
  const analysis = p.analysis || {};
  const bits = [analysis.improvement, analysis.currentAssessment, analysis.tradeOff, p.reason];
  const out = [];
  bits.forEach((bit) => {
    String(bit || "")
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length > 12)
      .forEach((line) => {
        if (!out.some((item) => item.toLowerCase() === line.toLowerCase())) out.push(line);
      });
  });
  return out.slice(0, 4);
}

export function pinKeptTitle(rows, { keep, liveTitle, liveDescription, ctrFit = 0, seoScore = 0 }) {
  if (!keep) return rows;
  const live = String(liveTitle || "").trim();
  if (!live || live.startsWith("(")) return rows;
  const desc = String(liveDescription || "").trim();
  const idx = rows.findIndex((row) => String(row.title || "").trim().toLowerCase() === live.toLowerCase());
  if (idx > 0) {
    const [row] = rows.splice(idx, 1);
    rows.unshift({ ...row, current: true });
  } else if (idx === 0) {
    rows[0] = { ...rows[0], current: true };
  } else {
    rows.unshift({
      title: live,
      description: desc.startsWith("(") ? "" : desc,
      ctrFit,
      seoScore,
      current: true,
    });
  }
  return rows;
}
