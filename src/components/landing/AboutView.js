import Link from "next/link";
import LandingShell from "@/components/landing/LandingShell";

export default function AboutView() {
  return (
    <LandingShell current="about">
      <main>
        <section className="pagehero wrap">
          <div className="eyebrow">
            <span className="bar" /> ABOUT SEARCHIFY
          </div>
          <h1>
            BUILT TO GET
            <br />
            <em>THE WORK DONE.</em>
          </h1>
          <p>
            Searchify is being rebuilt around a simple idea: finding an SEO opportunity is only useful when a team can
            review it, make the change, and see what happened.
          </p>
          <a className="btn primary" href="/#how">
            See the workflow
          </a>
        </section>
        <section className="pageband">
          <div className="wrap pagecolumns">
            <div>
              <div className="eyebrow">WHY IT EXISTS</div>
              <h2>
                FROM AGENCY WORK
                <br />
                TO A CLEARER LOOP.
              </h2>
            </div>
            <div className="pageprose">
              <p>
                Searchify began in 2020–2021, shaped by hands-on work managing SEO for client websites. The product is
                now being revisited with a narrower first release and a stronger focus on completing the work, not just
                generating another audit.
              </p>
              <p>
                The initial workflow is designed for WordPress sites: use Google Search Console and business context to
                surface an opportunity, prepare an AI-assisted draft, let a person approve it, then publish and verify
                the change where supported.
              </p>
            </div>
          </div>
        </section>
        <section className="wrap pageprinciples">
          <div className="eyebrow">HOW WE THINK ABOUT THE PRODUCT</div>
          <h2>
            USEFUL MEANS
            <br />
            <span className="green">CLEAR AND CHECKABLE.</span>
          </h2>
          <div className="principlegrid">
            <article className="feature">
              <div className="icon" aria-hidden="true">
                01
              </div>
              <h3>Show the evidence.</h3>
              <p>Every recommendation should be tied to the page, available search data, and confirmed business details.</p>
            </article>
            <article className="feature">
              <div className="icon" aria-hidden="true">
                02
              </div>
              <h3>Keep a person in charge.</h3>
              <p>AI can draft. A customer reviews and approves the exact change before it is published.</p>
            </article>
            <article className="feature">
              <div className="icon" aria-hidden="true">
                03
              </div>
              <h3>Record what happened.</h3>
              <p>Keep a history of approved work and verify the live page where the connection supports it.</p>
            </article>
          </div>
          <p className="conceptnote">
            Searchify is in product validation. This site is a design preview; the integrations and publishing workflow
            shown here are not yet a live service.
          </p>
        </section>
        <section className="closing">
          <div className="eyebrow">A SMALLER, TESTABLE FIRST STEP</div>
          <div className="closing-title">
            ONE REAL WORKFLOW.
            <br />
            <span className="green">END TO END.</span>
          </div>
          <p>
            The first release is being shaped around one supported customer workflow, with real data costs and acceptance
            criteria tested as it is built.
          </p>
          <Link className="btn primary" href="/contact">
            Talk about the pilot
          </Link>
        </section>
      </main>
    </LandingShell>
  );
}
