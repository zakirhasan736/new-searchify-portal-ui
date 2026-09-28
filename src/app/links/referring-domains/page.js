import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Referring Domains",
  description: "Domains that link to the site.",
  path: "/links/referring-domains",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="referring-domains"
      title="Referring Domains"
      description="Domains that link to the site."
    />
  );
}
