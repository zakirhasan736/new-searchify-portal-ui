"use client";

import Link from "next/link";
import brandLogo from "@/assets/img/brand-logo.svg";

const src = typeof brandLogo === "string" ? brandLogo : brandLogo?.src;

export default function BrandMark({ href = "/", className = "" }) {
  const image = <img src={src} alt="Searchify" className="sf-brand-logo" />;
  if (!href) {
    return <div className={`sf-brand ${className}`.trim()}>{image}</div>;
  }
  return (
    <Link href={href} className={`sf-brand ${className}`.trim()} aria-label="Searchify">
      {image}
    </Link>
  );
}
