import Link from "next/link";
import LandingShell from "@/components/landing/LandingShell";
import SearchifyMark from "@/components/landing/SearchifyMark";

export default function LegalLayout({
  current,
  kicker,
  title,
  lede,
  updated,
  actions,
  sections,
  closeTitle,
  closeText,
  closeHref,
  closeLabel,
}) {
  return (
    <LandingShell current={current}>
      <main className="sf-legal">
        <div className="sf-legal-glow" aria-hidden="true" />

        <header className="sf-legal-hero">
          <div className="sf-legal-brand">
            <SearchifyMark size={28} />
            <span className="sf-kicker">{kicker}</span>
          </div>
          <h1>{title}</h1>
          <p>{lede}</p>
          <span className="sf-note">Last updated {updated}</span>
          {actions ? <div className="sf-legal-actions">{actions}</div> : null}
        </header>

        <nav className="sf-legal-toc" aria-label="On this page">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>

        <div className="sf-legal-list">
          {sections.map((section, index) => (
            <article key={section.id} id={section.id} className="sf-legal-block">
              <span className="sf-kicker">{String(index + 1).padStart(2, "0")}</span>
              <h2>{section.title}</h2>
              <div className="sf-legal-body">{section.body}</div>
            </article>
          ))}
        </div>

        <section className="sf-closing sf-legal-close">
          <h2>{closeTitle}</h2>
          <p>{closeText}</p>
          <Link className="sf-btn-blue lg" href={closeHref}>
            {closeLabel}
          </Link>
        </section>
      </main>
    </LandingShell>
  );
}
