"use client";

import { useEffect } from "react";
import NextLink from "next/link";
import { useParams as useNextParams, usePathname, useRouter } from "next/navigation";

const STATE_PREFIX = "searchify-nav:";

function readState(pathname) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STATE_PREFIX + pathname);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeState(pathname, state) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STATE_PREFIX + pathname, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export function Link({ to, href, children, ...rest }) {
  return (
    <NextLink href={href || to || "/"} {...rest}>
      {children}
    </NextLink>
  );
}

export function NavLink({ to, href, children, className, ...rest }) {
  const pathname = usePathname();
  const target = href || to || "/";
  const active = pathname === target;
  const resolved =
    typeof className === "function" ? className({ isActive: active }) : className;
  return (
    <NextLink href={target} className={resolved} data-active={active ? "true" : undefined} {...rest}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to, options = {}) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      return;
    }
    const href = typeof to === "string" ? to : to?.pathname || "/";
    if (options.state !== undefined) writeState(href, options.state);
    if (options.replace) router.replace(href);
    else router.push(href);
  };
}

export function useLocation() {
  const pathname = usePathname() || "/";
  return {
    pathname,
    search: "",
    hash: "",
    state: readState(pathname),
  };
}

export function useParams() {
  return useNextParams();
}

export function Navigate({ to }) {
  const router = useRouter();
  useEffect(() => {
    if (to) router.replace(to);
  }, [router, to]);
  return null;
}

export function Outlet() {
  return null;
}

export function BrowserRouter({ children }) {
  return children;
}
