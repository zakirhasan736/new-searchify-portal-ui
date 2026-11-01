import "@/styles/v8-founder-signature.css";

/** Exact founder sign-off used on every letter across Searchify flows. */
export const FOUNDER_SIGN_NAME = "Aadle M. Faqiryar";
export const FOUNDER_SIGN_TITLE = "Founder, Searchify";

export default function FounderSignature({ className = "", style, showTitle = true }) {
  return (
    <div className={`sfy-founder-sig${className ? ` ${className}` : ""}`} style={style} aria-label={`${FOUNDER_SIGN_NAME}, ${FOUNDER_SIGN_TITLE}`}>
      <span className="sfy-founder-sig__ink">{FOUNDER_SIGN_NAME}</span>
      {showTitle ? <span className="sfy-founder-sig__title">{FOUNDER_SIGN_TITLE}</span> : null}
    </div>
  );
}
