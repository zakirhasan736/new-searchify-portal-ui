import Link from "next/link";
import LandingShell from "@/components/landing/LandingShell";

export default function PricingView() {
  return (
    <LandingShell current="pricing">
      <main>
        <section className="pagehero wrap">
          <div className="eyebrow">
            <span className="bar" /> PRICING & PILOT
          </div>
          <h1>
            KNOW THE COST
            <br />
            <em>BEFORE YOU COMMIT.</em>
          </h1>
          <p>
            Searchify is validating the first customer workflow now. Pilot pricing is being shaped around supported
            sites, real provider usage, and the work you need done.
          </p>
          <Link className="btn primary" href="/contact">
            Ask about the pilot
          </Link>
          <div className="micro">No published subscription price yet. You&apos;ll get the scope and cost in writing first.</div>
        </section>
        <section className="wrap pricewrap">
          <article className="pricecard">
            <div className="priceeyebrow">FOUNDING CUSTOMER PILOT</div>
            <h2>
              ONE WORKFLOW.
              <br />
              <span className="green">CLEAR TERMS.</span>
            </h2>
            <p className="priceintro">Work directly with the team to test one real SEO workflow on supported WordPress site(s).</p>
            <ul className="pricecheck">
              <li>Connect a supported WordPress site and Search Console</li>
              <li>Review evidence-backed page opportunities</li>
              <li>Approve AI-assisted title and description drafts</li>
              <li>Publish, verify, and record supported changes</li>
              <li>Measure actual data usage and operating costs</li>
            </ul>
            <Link className="btn primary" href="/contact">
              Discuss pilot fit
            </Link>
            <p className="pricefine">Pilot scope, availability, and fees are confirmed individually before any work begins.</p>
          </article>
          <aside className="priceaside">
            <div className="eyebrow">WHAT SHAPES THE QUOTE</div>
            <h3>PRICE IT ON WHAT YOU USE.</h3>
            <p>Before agreeing to a pilot, we&apos;ll define:</p>
            <ul className="checklist">
              <li>Number of websites and pages in scope</li>
              <li>How often each connection refreshes data</li>
              <li>Third-party data costs and usage limits</li>
              <li>What the workflow includes and how success is checked</li>
            </ul>
            <div className="costnote">
              <strong>Provider usage matters.</strong>
              <br />
              Data fees depend on the actual workflow and usage. We&apos;re measuring those costs before setting ongoing plans.
            </div>
          </aside>
        </section>
        <section className="pageband">
          <div className="wrap faq pricingfaq">
            <div>
              <div className="eyebrow">PRICING, WITHOUT SURPRISES</div>
              <h2>
                GOOD TO
                <br />
                KNOW.
              </h2>
            </div>
            <div>
              <details open>
                <summary>Why isn&apos;t there a monthly price yet?</summary>
                <p>
                  The first release is still being validated with real customer workflows and third-party data usage.
                  Publishing a flat price before measuring those costs would be guesswork.
                </p>
              </details>
              <details>
                <summary>Will provider API costs be included?</summary>
                <p>
                  The pilot quote will clearly state what is included, any usage limits, and how additional third-party
                  charges are handled before you agree.
                </p>
              </details>
              <details>
                <summary>Can I get a walkthrough first?</summary>
                <p>
                  Yes. The current interactive demo uses sample data and simulated actions. Contact us to discuss the
                  product direction and pilot scope.
                </p>
              </details>
            </div>
          </div>
        </section>
        <section className="closing">
          <div className="eyebrow">GET THE DETAILS IN WRITING</div>
          <div className="closing-title">
            CLEAR SCOPE.
            <br />
            <span className="green">NO GUESSWORK.</span>
          </div>
          <p>Tell us how many sites you manage and what you want to test. We&apos;ll discuss whether the pilot is a fit.</p>
          <Link className="btn primary" href="/contact">
            Contact Searchify
          </Link>
        </section>
      </main>
    </LandingShell>
  );
}
