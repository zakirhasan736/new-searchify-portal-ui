const VALIDATION = {
  verified: ["good", "Claims match the page"],
  partially_verified: ["warn", "Some claims are not on the page"],
  unverified: ["warn", "Claims are not on the page"],
  contradicted: ["danger", "A claim contradicts the page"],
};

const TYPES = {
  home: "Homepage",
  service: "Service page",
  product: "Product page",
  category: "Category page",
  location: "Location page",
  case_study: "Case study",
  blog: "Blog post",
  about: "About page",
  contact: "Contact page",
  other: "Page",
};

export function isHomepage(row) {
  if (row?.proposed?.isHomepage) return true;
  try {
    return new URL(row.targetUrl).pathname.replace(/\/+$/, "") === "";
  } catch {
    return false;
  }
}

export function statusLabel(row) {
  const p = row?.proposed || {};
  if (p.sourceChanged && row.status === "awaiting_approval") return "Page changed · review again";
  return {
    proposed: "Needs review",
    awaiting_approval: "Needs review",
    needs_review: "Needs review",
    approved: "Approved · not published",
    executing: "Publishing…",
    failed: "Publish failed · not live",
    monitoring: "Published · verified",
    applied: "Published",
    published_unverified: "Published · not confirmed",
    dismissed: "Rejected",
    undone: "Undone",
    closed: "Closed",
  }[row?.status] || row?.status || "";
}

export function pageTypeLabel(proposed) {
  return TYPES[proposed?.pageType] || (proposed?.pageRole ? `${proposed.pageRole} page` : "Page");
}

function jevBandClass(band) {
  if (band === "auto") return "good";
  if (band === "reject") return "danger";
  return "warn";
}

function jevBandLabel(band) {
  if (band === "auto") return "JEV auto-safe";
  if (band === "reject") return "JEV reject · regenerate";
  if (band === "inbox") return "JEV inbox · human review";
  return "JEV not scored";
}

export function WhyThisDraft({ proposed, evidence = null, compact = false }) {
  const p = proposed || {};
  const analysis = p.analysis || {};
  const jev = p.jev || {};
  const sources = (analysis.sources || []).filter(Boolean);
  const keyword = analysis.keyword || p.target || "";
  const meet = analysis.meetCompetitor || p.meetCompetitor?.title || "";
  const gsc = evidence || p.evidence || {};
  if (!sources.length && !keyword && !jev.score && !p.reason) return null;
  return (
    <div className="why-draft">
      <div className="dash-eyebrow">Why this draft (analysis, not a paste)</div>
      <p>
        Built from live page signals plus keyword, competitor, and Searchify SEO research — not by copying the H1 word for word.
        Open Graph and JSON-LD use the same title and description.
      </p>
      <div className="evidence-row">
        {keyword ? <span className="w-pill">{`Keyword · ${keyword}`}</span> : null}
        {meet ? <span className="w-pill">{`Meet · ${meet}`}</span> : <span className="w-pill">No same-keyword competitor stored</span>}
        {p.beatsLive ? <span className="w-pill good">Beats live</span> : p.beatsLive === false ? <span className="w-pill warn">Not stronger than live yet</span> : null}
        {analysis.contentWriter ? <span className="w-pill">Searchify SEO content writer used</span> : null}
        {jev.score != null ? <span className={`w-pill ${jevBandClass(jev.band)}`}>{`JEV ${jev.score}/100 · ${jev.band || "inbox"}`}</span> : null}
        {gsc.clicks != null && gsc.clicks !== "—" ? <span className="w-pill">{`GSC clicks · ${gsc.clicks}`}</span> : null}
        {gsc.impressions != null && gsc.impressions !== "—" ? <span className="w-pill">{`GSC reach · ${gsc.impressions}`}</span> : null}
      </div>
      {!compact && sources.length ? (
        <ul className="claim-list">
          {sources.map((source) => <li key={source}>{source}</li>)}
        </ul>
      ) : null}
      {!compact && Array.isArray(jev.reasons) && jev.reasons.length ? (
        <p className="w-footnote">{`JEV: ${jev.reasons.slice(0, 3).join(" · ")}`}</p>
      ) : null}
      {!compact && p.reason ? <p className="suggestion-reason">{p.reason}</p> : null}
    </div>
  );
}

export default function DraftChecks({ proposed, compact = false }) {
  const p = proposed || {};
  const validation = p.validation || null;
  const [tone, label] = VALIDATION[validation?.status] || [];
  const confidence = p.confidence || null;
  const flagged = (validation?.claims || []).filter((claim) => claim.status !== "verified");
  const meet = p.meetCompetitor?.title || "";
  const target = p.target || "";
  const jev = p.jev || {};
  return (
    <div className="draft-checks">
      <div className="evidence-row">
        <span className="source-caption">CHECKS</span>
        {p.beatsLive ? <span className="w-pill good">Beats the live listing</span> : p.beatsLive === false ? <span className="w-pill warn">Not stronger than live yet</span> : null}
        {jev.score != null ? <span className={`w-pill ${jevBandClass(jev.band)}`}>{jevBandLabel(jev.band)} · {jev.score}</span> : null}
        {label ? <span className={`w-pill ${tone}`}>{label}</span> : <span className="w-pill">Claims not checked</span>}
        {confidence ? <span className="w-pill">{`Evidence: ${confidence.level}${confidence.basis?.length ? ` · ${confidence.basis.join(", ")}` : ""}`}</span> : null}
        {target ? <span className="w-pill">{`Keyword · ${target}`}</span> : null}
        {meet ? <span className="w-pill">{`Meet · ${meet}`}</span> : null}
        {p.pageType === "case_study" ? <span className="w-pill warn">Case study · written as your work for a client</span> : null}
      </div>
      {p.sourceChanged ? (
        <p className="w-inset" role="status">
          {`The live page ${p.sourceChanged.fields?.join(" and ") || "listing"} changed after this was drafted. The current values below are the new live ones. Review before approving again.`}
        </p>
      ) : null}
      {!compact && flagged.length ? (
        <ul className="claim-list">
          {flagged.map((claim) => (
            <li key={`${claim.kind}-${claim.claim}`}>
              <strong>{claim.claim}</strong>
              {claim.status === "contradicted" ? ` contradicts the page (${claim.page}).` : " is not on this page."}
            </li>
          ))}
        </ul>
      ) : null}
      {!compact && p.openIssues?.length ? (
        <ul className="claim-list">
          {p.openIssues.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

export function ListingPackage({ proposed, title = "", description = "" }) {
  const p = proposed || {};
  const ogTitle = p.openGraphTitle || title || p.title || "";
  const ogDesc = p.openGraphDescription || description || p.metaDescription || "";
  const schema = p.jsonLd || {};
  const missing = (p.images || []).filter((img) => img && img.needsAlt && img.suggestedAlt).slice(0, 3);
  const hasSignals = p.canonical || (p.nav || []).length || (p.faqs || []).length || (p.videos || []).length || p.reviewRating || p.reviewCount;
  if (!ogTitle && !schema["@type"] && !missing.length && !p.shareImage && !hasSignals) return null;
  return (
    <div className="change-pair">
      <div className="change-cell"><small>Open Graph</small><span>{ogTitle || "Uses the suggested title"}</span><small>{ogDesc || "Uses the suggested description"}</small></div>
      <div className="change-cell"><small>JSON-LD</small><span>{schema["@type"] || "WebPage"}</span><small>{schema.name || ogTitle || "Uses the suggested title"}</small></div>
      {p.shareImage ? <div className="change-cell"><small>Share image</small><span>{p.shareImage}</span><small>Used for the social card and the schema image.</small></div> : null}
      {missing.map((img) => (
        <div className="change-cell" key={img.src}>
          <small>Image text</small>
          <span>{img.suggestedAlt}</span>
          <small>Add this as the image alt text. The picture file stays as it is.</small>
        </div>
      ))}
      {p.canonical ? <div className="change-cell"><small>Canonical</small><span>{p.canonical}</span></div> : null}
      {(p.nav || []).length ? <div className="change-cell"><small>Navigation</small><span>{p.nav.slice(0, 8).join(" · ")}</span></div> : null}
      {(p.faqs || []).length ? <div className="change-cell"><small>FAQ</small><span>{p.faqs.slice(0, 4).join(" ")}</span></div> : null}
      {(p.videos || []).length ? <div className="change-cell"><small>Video</small><span>{p.videos[0]}</span><small>{p.videos.length === 1 ? "One video on this page." : `${p.videos.length} videos on this page.`}</small></div> : null}
      {p.reviewRating || p.reviewCount ? <div className="change-cell"><small>Reviews</small><span>{p.reviewRating ? `${p.reviewRating} stars` : "Reviews on the page"}</span><small>{p.reviewCount ? `${p.reviewCount} in the page schema` : "Shown only when the page publishes a rating."}</small></div> : null}
    </div>
  );
}
