import Link from "next/link";
import LandingShell from "@/components/landing/LandingShell";

const MAIL = "start@sovereignstandard.ca";

export default function PrivacyView() {
  return (
    <LandingShell current="privacy">
      <main>
        <section className="pagehero wrap">
          <div className="eyebrow">
            <span className="bar" /> PRIVACY POLICY
          </div>
          <h1>
            WHAT WE HOLD.
            <br />
            <em>AND WHY.</em>
          </h1>
          <p>
            This policy covers the Searchify website and workspace. Last updated October 8, 2026. We collect what the
            product needs to run an account, a connected site, and a review you can check.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/terms">
              Read the terms
            </Link>
            <a className="btn" href={`mailto:${MAIL}`}>
              Email privacy questions
            </a>
          </div>
          <div className="conceptnote">
            The contact form on this site opens your email app. It does not send the message to a Searchify server.
            Account and workspace data are a separate step, and only after you create a login.
          </div>
        </section>

        <section className="pageband">
          <div className="wrap pagecolumns">
            <div>
              <div className="eyebrow">THE SHORT VERSION</div>
              <h2>
                YOUR EVIDENCE
                <br />
                STAYS IN THE WORK.
              </h2>
            </div>
            <div className="pageprose">
              <p>
                Searchify is not an ad network. We do not sell your account, your site content, or your search data.
                We use that information to show the workspace, prepare drafts you can approve, and keep a record of
                what was decided.
              </p>
              <p>
                Connected Google or WordPress data is read only with the access you grant. Drafts are prepared so a
                person can review them. They are not published until someone on your team approves the change.
              </p>
            </div>
          </div>
        </section>

        <section className="wrap pageprinciples">
          <div className="eyebrow">WHAT CAN BE STORED</div>
          <h2>
            ONLY WHAT
            <br />
            <span className="green">THE WORKFLOW NEEDS.</span>
          </h2>
          <div className="principlegrid">
            <article className="feature">
              <div className="icon" aria-hidden="true">
                01
              </div>
              <h3>Account</h3>
              <p>Email, username, and a password hash, or the profile a supported sign-in provider returns.</p>
            </article>
            <article className="feature">
              <div className="icon" aria-hidden="true">
                02
              </div>
              <h3>Connected sites</h3>
              <p>
                Site addresses, Search Console or Analytics figures you authorize, and page fields the workflow is
                allowed to read.
              </p>
            </article>
            <article className="feature">
              <div className="icon" aria-hidden="true">
                03
              </div>
              <h3>Drafts and decisions</h3>
              <p>Suggested titles and descriptions, plus the approval, edit, or dismissal your team records.</p>
            </article>
          </div>
        </section>

        <section className="pageband">
          <div className="wrap faq">
            <div>
              <div className="eyebrow">HOW IT IS USED</div>
              <h2>
                GOOD TO
                <br />
                KNOW.
              </h2>
              <p>Who else can see workspace data, how long it stays, and how to ask a question.</p>
            </div>
            <div>
              <details open>
                <summary>Other services</summary>
                <p>
                  Sign-in and site data can pass through Google when you connect Search Console, Analytics, or Ads.
                  Draft text can be sent to an AI provider so a suggestion can be written. Those providers process
                  that data under their own terms, and only for the request you started.
                </p>
              </details>
              <details>
                <summary>What stays in the browser</summary>
                <p>
                  The workspace keeps a few preferences on your device, such as the active site and tour state, so the
                  screen can reopen where you left it. That storage does not replace the account on the server.
                </p>
              </details>
              <details>
                <summary>Who we share with</summary>
                <p>
                  We share workspace data with the people on your account, the providers required to run a connection
                  you turned on, and when the law requires it. We do not sell personal information.
                </p>
              </details>
              <details>
                <summary>How long it stays</summary>
                <p>
                  Account and site records stay while the workspace is open. If you ask us to close the account, we
                  delete or de-identify the workspace data we still hold, except where a record has to be kept for
                  security or a legal duty.
                </p>
              </details>
              <details>
                <summary>Your choices</summary>
                <p>
                  You can disconnect Google or WordPress access, correct account details, or email{" "}
                  <a href={`mailto:${MAIL}`}>{MAIL}</a> to ask what we hold or to close the workspace. This policy can
                  change as the pilot becomes a live service. The date at the top will move when it does.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="closing">
          <div className="eyebrow">PRIVACY QUESTIONS</div>
          <div className="closing-title">
            ASK WHAT
            <br />
            <span className="green">WE HOLD.</span>
          </div>
          <p>
            Email <a href={`mailto:${MAIL}`}>{MAIL}</a>. The terms explain how the workspace is allowed to be used.
          </p>
          <Link className="btn primary" href="/terms">
            Read the terms
          </Link>
        </section>
      </main>
    </LandingShell>
  );
}
