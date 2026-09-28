"use client";

import { useEffect, useState } from "react";
import PageSkeleton from "@/components/v3/PageSkeleton";
import "@/styles/searchify-v3.css";

export default function ClientOnly({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="sf-booting">
        <PageSkeleton />
      </div>
    );
  }
  return children;
}
