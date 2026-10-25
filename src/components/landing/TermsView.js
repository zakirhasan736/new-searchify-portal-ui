import Link from "next/link";
import LegalLayout from "@/components/landing/LegalLayout";

const MAIL = "start@sovereignstandard.ca";

export default function TermsView() {
  return (
    <LegalLayout
      current="terms"
      kicker="TERMS"
      title="The rules for the work."
      lede="These terms cover the Searchify website, your account, and the customer workspace. They are the working agreement for using Searchify. They are not legal advice for your own clients."
      updated="October 26, 2026"
      actions={
        <>
          <Link className="sf-btn-blue" href="/privacy">
            Read the privacy policy
          </Link>
          <Link className="sf-btn-ghost" href="/pricing">
            See plans
          </Link>
        </>
      }
      sections={[
        {
          id: "product",
          label: "The product",
          title: "A review loop, not a ranking promise.",
          body: (
            <>
              <p>
                Searchify helps a team add a site, read search evidence, review a suggested title and description, and
                approve a change before it is published. A person stays in charge of what goes live.
              </p>
              <p>
                Rankings, traffic, and revenue are not guaranteed. Results depend on search engines, your site, your
                competitors, and the decisions you approve. Drafts are starting points, not legal, medical, or financial advice.
              </p>
            </>
          ),
        },
        {
          id: "yours",
          label: "Your sites",
          title: "Your sites stay yours.",
          body: (
            <p>
              Pages, Search Console data, and drafts you connect remain yours. Searchify may store and display them only
              to run the workspace you asked for. Nothing is published until someone on your team approves the exact change.
            </p>
          ),
        },
        {
          id: "account",
          label: "Accounts",
          title: "You keep the login private.",
          body: (
            <p>
              You need an email and a password, or a supported sign-in provider, to open a workspace. You are responsible
              for the people who use that login. Tell us at <a href={`mailto:${MAIL}`}>{MAIL}</a> if you think someone else
              is using it. The first time a customer has no site, setup asks for the website and a short brief, then a plan.
              Later sign-ins open the workspace.
            </p>
          ),
        },
        {
          id: "connections",
          label: "Connections",
          title: "Connections follow their own terms.",
          body: (
            <p>
              Google Search Console, Analytics, Ads, and WordPress run under those providers&apos; terms. Searchify can only
              see what you authorize. Disconnecting a service stops new reads from that connection.
            </p>
          ),
        },
        {
          id: "plans",
          label: "Plans",
          title: "Plans, trials, and cancellation.",
          body: (
            <p>
              Public plans and prices are listed on the pricing page. A new plan can start as a 14-day trial. You can
              change or cancel the plan from the workspace. Third-party data costs, if a written quote includes them, are
              described in that quote. Partner commissions, when a customer was referred, follow the partner agreement.
            </p>
          ),
        },
        {
          id: "use",
          label: "Acceptable use",
          title: "Do not misuse the workspace.",
          body: (
            <p>
              Do not use Searchify to break the law, attack another site, scrape data you were not given, or upload content
              you do not have the right to use. We may suspend access that puts the service or other customers at risk.
            </p>
          ),
        },
        {
          id: "changes",
          label: "Changes",
          title: "When these terms change.",
          body: (
            <p>
              If the rules change in a material way, we update this page and the date at the top. Continued use after that
              date means you accept the updated terms. The privacy policy explains what information the workspace holds.
            </p>
          ),
        },
      ]}
      closeTitle="Ask before you commit."
      closeText={
        <>
          Email <a href={`mailto:${MAIL}`}>{MAIL}</a> or use the contact page.
        </>
      }
      closeHref="/contact"
      closeLabel="Contact Searchify"
    />
  );
}
