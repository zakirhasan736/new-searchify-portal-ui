import { Suspense } from "react";
import { ConnectionsView } from "@/components/board/WorkspaceViews";

export const metadata = { title: "Connections" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConnectionsView />
    </Suspense>
  );
}
