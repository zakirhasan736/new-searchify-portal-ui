import Link from "next/link";
import LandingShell from "@/components/landing/LandingShell";

const MAIL = "start@sovereignstandard.ca";

export default function TermsView() {
  return (
    <LandingShell current="terms">
      <main>
        <section className="pagehero wrap">
          <div className="eyebrow">
            <span className="bar" /> TERMS OF USE
          </div>
          <h1>
            THE RULES
            <br />
            <em>FOR THE WORK.</em>
          </h1>
          <p>
            These terms cover the Searchify website, account, and workspace. Last updated October 8, 2026. The product
            is in validation: a preview and a founding-customer pilot, not a finished ranking service.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/privacy">
              Read the privacy policy
            </Link>
            <Link className="btn" href="/contact">
              Ask a question
            </Link>
          </div>
          <div className="conceptnote">
            Written in the same plain language as the rest of the site. It is the working agreement for using Searchify.
            It is not legal advice for your own clients or campaigns.
          </div>
        </section>

        <section className="pageband">
          <div className="wrap pagecolumns">
            <div>
              <div className="eyebrow">WHAT YOU ARE USING</div>
              <h2>
                A REVIEW LOOP.
                <br />
                NOT A PROMISE.
              </h2>
            </div>
            <div className="pageprose">
              <p>
                Searchify helps a team connect a supported site, look at search evidence, review an AI-assisted draft,
                and approve a change before it is published. A person stays in charge of what goes live.
              </p>
              <p>
                Rankings, traffic, and revenue are not guaranteed. Search results depend on search engines, your site,
                your competitors, and the decisions you approve. Templates and drafts are starting points, not legal,
                medical, or financial advice.
              </p>
            </div>
          </div>
        </section>

        <section className="wrap pageprinciples">
          <div className="eyebrow">THE PARTS THAT MATTER</div>
          <h2>
            CLEAR SCOPE.
            <br />
            <span className="green">YOU STAY IN CHARGE.</span>
          </h2>
          <div className="principlegrid">
            <article className="feature">
              <div className="icon" aria-hidden="true">
                01
              </div>
              <h3>Your sites stay yours.</h3>
              <p>
                Pages, Search Console data, and drafts you connect remain yours. Searchify may store and display them
                only to run the workspace you asked for.
              </p>
            </article>
            <article className="feature">
              <div className="icon" aria-hidden="true">
                02
              </div>
              <h3>Nothing publishes itself.</h3>
              <p>
                AI can prepare a title or description. A person on your team reviews and approves the exact change
                before it is sent to a connected site.
              </p>
            </article>
            <article className="feature">
              <div className="icon" aria-hidden="true">
                03
              </div>
              <h3>Pilot terms are written first.</h3>
              <p>
                There is no public subscription price yet. Scope, sites, and fees are confirmed with you before paid
                pilot work begins.
              </p>
            </article>
          </div>
        </section>

        <section className="pageband">
          <div className="wrap faq">
            <div>
              <div className="eyebrow">READ THE REST</div>
              <h2>
                GOOD TO
                <br />
                KNOW.
              </h2>
              <p>The short version is above. These notes cover accounts, connections, and how the terms can change.</p>
            </div>
            <div>
              <details open>
                <summary>Accounts</summary>
                <p>
                  You need an email and a password, or a supported sign-in provider, to open a workspace. You are
                  responsible for the people who use that login and for keeping the password private. Tell us at{" "}
                  <a href={`mailto:${MAIL}`}>{MAIL}</a> if you think someone else is using it.
                </p>
              </details>
              <details>
                <summary>Connected services</summary>
                <p>
                  Google Search Console, Analytics, Ads, and WordPress connections run under those providers&apos; own
                  terms. Searchify can only see what you authorize. Disconnecting a service stops new reads from that
                  connection.
                </p>
              </details>
              <details>
                <summary>Acceptable use</summary>
                <p>
                  Don&apos;t use the workspace to break the law, attack another site, scrape data you were not given,
                  or upload content you don&apos;t have the right to use. We may suspend access that puts the service
                  or other customers at risk.
                </p>
              </details>
              <details>
                <summary>Fees</summary>
                <p>
                  The public site does not charge a subscription by itself. A pilot quote, if you accept one, states
                  what is included, any usage limits, and how third-party data costs are handled. Cancel or stop a
                  pilot the way that written quote describes.
                </p>
              </details>
              <details>
                <summary>Changes to these terms</summary>
                <p>
                  If the product leaves validation or the rules change in a material way, we will update this page and
                  the date at the top. Continued use after that date means you accept the updated terms. The privacy
                  policy explains what information the workspace holds.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="closing">
          <div className="eyebrow">QUESTIONS ON THE RULES</div>
          <div className="closing-title">
            ASK BEFORE
            <br />
            <span className="green">YOU COMMIT.</span>
          </div>
          <p>
            Email <a href={`mailto:${MAIL}`}>{MAIL}</a> or use the contact page. We&apos;ll answer in the same direct
            language as the product.
          </p>
          <Link className="btn primary" href="/contact">
            Contact Searchify
          </Link>
        </section>
      </main>
    </LandingShell>
  );
}
