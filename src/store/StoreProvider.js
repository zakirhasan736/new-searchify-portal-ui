"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { researchApi } from "@/store/researchApi";
import { hydratePageSizes, loadPageSizes } from "@/store/uiSlice";

export default function StoreProvider({ children }) {
  const [store] = useState(makeStore);

  useEffect(() => {
    store.dispatch(hydratePageSizes(loadPageSizes()));
    const reset = () => store.dispatch(researchApi.util.resetApiState());
    window.addEventListener("sf-auth", reset);
    return () => window.removeEventListener("sf-auth", reset);
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
