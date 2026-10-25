"use client";

import { useEffect, useState } from "react";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
import "@/styles/searchify-v3.css";

export default function ClientOnly({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <SearchifyLoader full label="Opening Searchify" />
    );
  }
  return children;
}
