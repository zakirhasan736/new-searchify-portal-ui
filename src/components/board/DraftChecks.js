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
  const keep = p.recommendKeep || analysis.recommendKeep;
  const decision = p.decision || analysis.decision || "";
  const warnings = analysis.dataQualityWarnings || p.evidenceRecord?.data_quality_warnings || [];
  if (!sources.length && !keyword && !jev.score && !p.reason) return null;
  return (
    <div className="why-draft">
      <div className="dash-eyebrow">Why this recommendation</div>
      <p>
        {decision === "INSUFFICIENT_EVIDENCE"
          ? "Searchify does not have reliable page evidence for a change, so the published title and description stay in place."
          : keep
            ? "Analysis compared candidates with the published listing and recommends keeping the current title and description."
            : "A candidate showed a material improvement backed by this page's evidence. Nothing is published until you approve it."}
        {" "}Open Graph stays aligned with the listing. JSON-LD updates WebPage name/description without removing other live schema types.
      </p>
      <div className="evidence-row">
        {analysis.objective || p.objective ? <span className="w-pill">{`Objective · ${analysis.objective || p.objective}`}</span> : null}
        {pageTypeLabel(p) ? <span className="w-pill">{`Page · ${pageTypeLabel(p)}`}</span> : null}
        {keyword ? <span className="w-pill">{`Keyword · ${keyword}`}</span> : null}
        {analysis.keywordSource ? <span className="w-pill">{`Keyword source · ${analysis.keywordSource}`}</span> : null}
        {meet ? <span className="w-pill">{`Meet · ${meet}`}</span> : <span className="w-pill">No same-keyword competitor stored</span>}
        {decision ? <span className={`w-pill ${decision === "RECOMMEND_CHANGE" ? "good" : "warn"}`}>{decision.replaceAll("_", " ")}</span> : null}
        {keep ? <span className="w-pill good">Keep published listing</span> : p.beatsLive ? <span className="w-pill good">Beats live</span> : p.beatsLive === false ? <span className="w-pill warn">Not stronger than live yet</span> : null}
        {analysis.contentWriter ? <span className="w-pill">Searchify SEO content writer used</span> : null}
        {jev.score != null ? <span className={`w-pill ${jevBandClass(jev.band)}`}>{`JEV ${jev.score}/100 · ${jev.band || "inbox"}`}</span> : <span className="w-pill warn">JEV not scored</span>}
        {gsc.clicks != null && gsc.clicks !== "—" ? <span className="w-pill">{`GSC clicks · ${gsc.clicks}`}</span> : null}
        {gsc.impressions != null && gsc.impressions !== "—" ? <span className="w-pill">{`GSC reach · ${gsc.impressions}`}</span> : null}
      </div>
      {!compact && warnings.length ? (
        <ul className="claim-list">
          {warnings.slice(0, 4).map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : null}
      {!compact && analysis.comparisonSummary ? <p className="w-footnote"><strong>Comparison:</strong> {analysis.comparisonSummary}</p> : null}
      {!compact && analysis.currentAssessment ? <p className="w-footnote"><strong>Current listing:</strong> {analysis.currentAssessment}</p> : null}
      {!compact && analysis.improvement ? <p className="w-footnote"><strong>Improvement:</strong> {analysis.improvement}</p> : null}
      {!compact && analysis.tradeOff ? <p className="w-footnote"><strong>Trade-off:</strong> {analysis.tradeOff}</p> : null}
      {!compact && analysis.schemaNote ? <p className="w-footnote">{analysis.schemaNote}</p> : null}
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
  const schemaType = schema["@type"] || (Array.isArray(schema["@graph"]) ? "Graph" : "");
  const schemaName = schema.name || schema["@graph"]?.[0]?.name || ogTitle || "";
  const preserved = (p.schemaTypesPreserved || p.beforeSchemaTypes || []).filter(Boolean);
  const missing = [];
  const seenImg = new Set();
  for (const img of p.images || []) {
    if (!img?.needsAlt || !img?.suggestedAlt) continue;
    const key = String(img.id || img.src || "").split("?")[0];
    if (!key || seenImg.has(key)) continue;
    seenImg.add(key);
    missing.push(img);
    if (missing.length >= 3) break;
  }
  const hasSignals = p.canonical || (p.nav || []).length || (p.faqs || []).length || (p.videos || []).length || p.reviewRating || p.reviewCount;
  if (!ogTitle && !schemaType && !missing.length && !p.shareImage && !hasSignals) return null;
  return (
    <div className="change-pair">
      <div className="change-cell"><small>Open Graph {p.recommendKeep ? "(unchanged messaging)" : "(aligned with listing)"}</small><span>{ogTitle || "Uses the suggested title"}</span><small>{ogDesc || "Uses the suggested description"}</small></div>
      <div className="change-cell">
        <small>JSON-LD {schemaType || "WebPage"}</small>
        <span>{schemaName || "Uses the suggested title"}</span>
        <small>
          {preserved.length
            ? `Updates WebPage name/description. Live types noted: ${preserved.slice(0, 6).join(", ")}.`
            : "Updates WebPage name/description to match this listing."}
        </small>
      </div>
      {p.shareImage ? <div className="change-cell"><small>Share image</small><span>{p.shareImage}</span><small>Used for the social card and the schema image.</small></div> : null}
      {missing.map((img) => (
        <div className="change-cell" key={img.id || img.src}>
          <small>Image alt {img.changed === false ? "(kept)" : "(suggested)"}</small>
          <span>{img.suggestedAlt}</span>
          <small>{img.src ? `${img.src.slice(0, 72)}${img.src.length > 72 ? "…" : ""}` : "Image file unchanged."}</small>
        </div>
      ))}
      {p.canonical ? <div className="change-cell"><small>Canonical (preserved)</small><span>{p.canonical}</span></div> : null}
      {(p.nav || []).length ? <div className="change-cell"><small>Navigation (context only)</small><span>{p.nav.slice(0, 8).join(" · ")}</span></div> : null}
      {(p.faqs || []).length ? <div className="change-cell"><small>FAQ</small><span>{p.faqs.slice(0, 4).join(" ")}</span></div> : null}
      {(p.videos || []).length ? <div className="change-cell"><small>Video (context only)</small><span>{p.videos[0]}</span><small>{p.videos.length === 1 ? "One video on this page." : `${p.videos.length} videos on this page.`}</small></div> : null}
      {p.reviewRating || p.reviewCount ? <div className="change-cell"><small>Reviews</small><span>{p.reviewRating ? `${p.reviewRating} stars` : "Reviews on the page"}</span><small>{p.reviewCount ? `${p.reviewCount} in the page schema` : "Shown only when the page publishes a rating."}</small></div> : null}
    </div>
  );
}
