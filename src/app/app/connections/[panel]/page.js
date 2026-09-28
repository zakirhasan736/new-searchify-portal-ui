import ConnectionsPage from "@/components/v3/pages/ConnectionsPage";

export const metadata = { title: "Connections · Manage" };

export default async function Page({ params }) {
  const resolved = await params;
  const panel = resolved?.panel || null;
  return <ConnectionsPage panel={panel} />;
}
