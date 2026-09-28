import LocalStudio from "@/components/studio/LocalStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Local Automations",
  description: "Scheduled local tasks including Google Sync.",
  path: "/local/automations",
  index: true,
});

export default function Page() {
  return <LocalStudio kind="local-automations" />;
}
