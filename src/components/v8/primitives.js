"use client";

import Link from "next/link";
import SearchifyMark from "@/components/landing/SearchifyMark";

export function V8Mark({ size = 28, href, label = "searchify", tag }) {
  const inner = (
    <>
      <SearchifyMark size={size} />
      <span>{label}</span>
      {tag ? <span className="v8-tag">{tag}</span> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="v8-brand">
        {inner}
      </Link>
    );
  }
  return <div className="v8-brand">{inner}</div>;
}

export function V8Button({
  children,
  variant = "primary",
  href,
  className = "",
  type = "button",
  ...props
}) {
  const cls = `v8-btn v8-btn-${variant}${className ? ` ${className}` : ""}`;
  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}

export function V8Field({ label, children, ...props }) {
  return (
    <label className="v8-field">
      {label}
      {children || <input {...props} />}
    </label>
  );
}

export function V8Segmented({ options = [], value, onChange, ariaLabel }) {
  return (
    <div className="v8-seg" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={on}
            className={on ? "is-on" : undefined}
            data-accent={opt.accent || undefined}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function V8Card({ children, className = "", highlighted = false }) {
  return (
    <div className={`v8-card${highlighted ? " is-on" : ""}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
