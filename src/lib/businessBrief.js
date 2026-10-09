export function hostnameOf(siteUrl) {
  const raw = String(siteUrl || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

export function briefFromAnswers(answers = {}) {
  const siteUrl = String(answers.site || "").trim();
  const hostname = hostnameOf(siteUrl);
  const businessType = String(answers.businessType || "").trim();
  const market = String(answers.market || "").trim();
  const reach = String(answers.reach || "").trim();
  const goal = String(answers.shortGoal || "").trim();
  const avoid = String(answers.avoid || "").trim();
  const industry = String(answers.industry || "").trim();
  const sensitive = industry && industry !== "No special category" ? industry : "";
  const platform = String(answers.platform || "").trim();
  const ready = Boolean(siteUrl || businessType || market || goal || reach);
  const offer = businessType || "your offer";
  const place = market || "your market";
  const local = /local/i.test(reach);
  const focus = [businessType, market].filter(Boolean).join(" in ") || "";
  return {
    ready,
    siteUrl,
    hostname,
    businessType,
    market,
    reach,
    goal,
    avoid,
    sensitive,
    platform,
    offer,
    place,
    local,
    focus,
  };
}

export function starterKeywords(brief) {
  if (!brief?.ready) return [];
  const offer = brief.businessType || "your business";
  const place = brief.market || brief.reach || "your market";
  const rows = [{ term: `${offer} in ${place}`, page: "/" }];
  if (brief.local) rows.push({ term: `${offer} near me`, page: "/" });
  else if (brief.reach) rows.push({ term: `${offer} ${brief.reach.toLowerCase()}`, page: "/" });
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.term.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((row, index) => ({
    id: `brief-keyword-${index}`,
    term: row.term,
    rank: null,
    previous: null,
    volume: null,
    page: row.page,
    country: place,
    device: "Mobile",
    sample: true,
    fromBrief: true,
  }));
}

export function starterPrompts(brief) {
  if (!brief?.ready) return [];
  const offer = (brief.businessType || "this business").toLowerCase();
  const place = brief.market || "your market";
  const host = brief.hostname || "your website";
  return [
    {
      id: "brief-prompt-1",
      text: `Who offers ${offer} in ${place}?`,
      model: "ChatGPT",
      mention: null,
      citation: "",
      snippet: "",
      sample: true,
    },
    {
      id: "brief-prompt-2",
      text: `What should I look for when choosing ${offer} in ${place}?`,
      model: "Gemini",
      mention: null,
      citation: "",
      snippet: "",
      sample: true,
    },
    {
      id: "brief-prompt-3",
      text: brief.goal
        ? `Which pages on ${host} support this aim: ${brief.goal}`
        : `Where can customers in ${place} learn about ${offer}?`,
      model: "Perplexity",
      mention: null,
      citation: "",
      snippet: "",
      sample: true,
    },
    {
      id: "brief-prompt-4",
      text: `Is ${host} a good option for ${offer} in ${place}?`,
      model: "Claude",
      mention: null,
      citation: "",
      snippet: "",
      sample: true,
    },
  ];
}
