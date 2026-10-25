import Link from "next/link";
import LegalLayout from "@/components/landing/LegalLayout";

const MAIL = "start@sovereignstandard.ca";

export default function PrivacyView() {
  return (
    <LegalLayout
      current="privacy"
      kicker="PRIVACY"
      title="What we hold, and why."
      lede="This policy covers the Searchify website and the customer workspace. We keep what the product needs to run an account, a connected site, and a change you can review."
      updated="October 25, 2026"
      actions={
        <>
          <Link className="sf-btn-blue" href="/terms">
            Read the terms
          </Link>
          <a className="sf-btn-ghost" href={`mailto:${MAIL}`}>
            Email a privacy question
          </a>
        </>
      }
      sections={[
        {
          id: "short",
          label: "Short version",
          title: "We do not sell your data.",
          body: (
            <>
              <p>
                Searchify is not an ad network. We do not sell your account, your site content, or your search data.
                We use that information to show the workspace, prepare drafts you can approve, and keep a record of what was decided.
              </p>
              <p>
                The contact form on this site opens your email app. It does not send the message to a Searchify server.
                Account data starts only after you create a login.
              </p>
            </>
          ),
        },
        {
          id: "stored",
          label: "What we store",
          title: "Only what the workflow needs.",
          body: (
            <ul>
              <li>Account: email, username, and a password hash, or the profile a supported sign-in provider returns.</li>
              <li>Plan: the plan you choose, billing interval, and trial status.</li>
              <li>Sites: addresses you add, and Search Console, Analytics, or site fields you authorize.</li>
              <li>Work: suggested titles and descriptions, plus each approval, edit, or dismissal.</li>
              <li>On this device: a sign-in token and a few workspace preferences so the screen can reopen where you left it.</li>
            </ul>
          ),
        },
        {
          id: "use",
          label: "How it is used",
          title: "To run the workspace you asked for.",
          body: (
            <p>
              Connected Google or WordPress data is read only with the access you grant. Draft text can be sent to an AI
              provider so a suggestion can be written. Those providers process that request under their own terms. We share
              workspace data with the people on your account, the providers required for a connection you turned on, and
              when the law requires it.
            </p>
          ),
        },
        {
          id: "keep",
          label: "How long",
          title: "While the workspace is open.",
          body: (
            <p>
              Account and site records stay while the workspace is open. If you ask us to close the account, we delete or
              de-identify the workspace data we still hold, except where a record has to be kept for security, billing, or
              a legal duty. Clearing your browser removes the sign-in token on that device. The account stays in the database
              until you ask us to close it.
            </p>
          ),
        },
        {
          id: "choices",
          label: "Your choices",
          title: "Disconnect, correct, or close.",
          body: (
            <p>
              You can disconnect Google or WordPress, correct account details from the workspace, or email{" "}
              <a href={`mailto:${MAIL}`}>{MAIL}</a> to ask what we hold or to close the workspace. If this policy changes,
              the date at the top of this page moves with it.
            </p>
          ),
        },
      ]}
      closeTitle="Ask what we hold."
      closeText={
        <>
          Email <a href={`mailto:${MAIL}`}>{MAIL}</a>. The terms explain how the workspace is allowed to be used.
        </>
      }
      closeHref="/terms"
      closeLabel="Read the terms"
    />
  );
}
