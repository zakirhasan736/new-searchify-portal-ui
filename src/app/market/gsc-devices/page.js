import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "GSC by Device",
  description: "Search Console clicks and impressions by device.",
  path: "/market/gsc-devices",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="gsc-devices"
      title="GSC by Device"
      description="Search Console performance split by device."
    />
  );
}
