"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** V8 ships from Edit → published; confirm is no longer a separate step. */
export default function Page() {
  const { id } = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(id ? `/app/queue/${id}` : "/app/queue");
  }, [id, router]);
  return null;
}
