"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import SearchifyLoader from "@/components/v8/SearchifyLoader";

/**
 * Full-screen six-dot loader for a whole screen: it stays up until the screen's first data has arrived.
 * Screens wrap their first requests in `track(promise)`; later requests (filters, saves) never bring it back.
 * A screen that loads nothing is released after a short grace period; nothing can hold it longer than MAX_MS.
 */
const BusyCtx = createContext(null);
const GRACE_MS = 220;
const MAX_MS = 15000;

export function ShellBusyProvider({ children, label = "Loading" }) {
  const [waiting, setWaiting] = useState(true);
  const pending = useRef(0);
  const open = useRef(true);
  const grace = useRef(null);

  const release = useCallback(() => {
    if (!open.current) return;
    open.current = false;
    setWaiting(false);
  }, []);

  useEffect(() => {
    grace.current = window.setTimeout(() => {
      if (pending.current === 0) release();
    }, GRACE_MS);
    const cap = window.setTimeout(release, MAX_MS);
    return () => {
      window.clearTimeout(grace.current);
      window.clearTimeout(cap);
    };
  }, [release]);

  const track = useCallback(
    (promise) => {
      if (!open.current || !promise || typeof promise.then !== "function") return promise;
      pending.current += 1;
      window.clearTimeout(grace.current);
      const done = () => {
        pending.current = Math.max(0, pending.current - 1);
        if (pending.current === 0) release();
      };
      promise.then(done, done);
      return promise;
    },
    [release],
  );

  return (
    <BusyCtx.Provider value={track}>
      {children}
      {waiting ? <SearchifyLoader full label={label} /> : null}
    </BusyCtx.Provider>
  );
}

/** `const track = useShellBusy(); track(getSomething())` — outside a provider it passes the promise through. */
export function useShellBusy() {
  return useContext(BusyCtx) || passThrough;
}

function passThrough(promise) {
  return promise;
}
