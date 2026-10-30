"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/** Number that counts up when it scrolls into view. Non-numeric values render as-is. */
export default function CountUp({ value, prefix = "", suffix = "", duration = 0.9, decimals, style, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const target = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  const numeric = value !== "" && value != null && Number.isFinite(target);
  const places = decimals ?? (numeric && !Number.isInteger(target) ? 1 : 0);
  const fmt = (n) => `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: places, maximumFractionDigits: places })}${suffix}`;

  useEffect(() => {
    const node = ref.current;
    if (!node || !numeric) return undefined;
    if (reduce || !inView) {
      if (reduce) node.textContent = fmt(target);
      return undefined;
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (n) => {
        node.textContent = fmt(n);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target, reduce, numeric]);

  if (!numeric) return <span className={className} style={style}>{value}</span>;
  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {fmt(reduce ? target : 0)}
    </span>
  );
}
