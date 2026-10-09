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

export default function DraftChecks({ proposed, compact = false }) {
  const p = proposed || {};
  const validation = p.validation || null;
  const [tone, label] = VALIDATION[validation?.status] || [];
  const confidence = p.confidence || null;
  const flagged = (validation?.claims || []).filter((claim) => claim.status !== "verified");
  return (
    <div className="draft-checks">
      <div className="evidence-row">
        <span className="source-caption">CHECKS</span>
        {label ? <span className={`w-pill ${tone}`}>{label}</span> : <span className="w-pill">Claims not checked</span>}
        {confidence ? <span className="w-pill">{`Evidence: ${confidence.level}${confidence.basis?.length ? ` · ${confidence.basis.join(", ")}` : ""}`}</span> : null}
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
