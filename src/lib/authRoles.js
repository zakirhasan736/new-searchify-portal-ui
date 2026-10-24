import { getUser, userIsAuthenticated } from "@/utils/users/Helpers";

const PARTNER_KEY = "searchify-partner-signed-in";
const PREVIEW_KEY = "searchify-preview-signed-in";

export function readSessionFlag(key) {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeSessionFlag(key, on = true) {
  if (typeof window === "undefined") return;
  try {
    if (on) sessionStorage.setItem(key, "1");
    else sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function clearSessionFlag(key) {
  writeSessionFlag(key, false);
}

export function userTypeOf(user = getUser()) {
  const raw =
    user?.result?.userType ||
    user?.userType ||
    user?.data?.userType ||
    user?.data?.role ||
    "";
  return String(raw || "").toLowerCase();
}

export function isAdminUser(user = getUser()) {
  const t = userTypeOf(user);
  const role = String(user?.data?.role || user?.result?.role || "").toUpperCase();
  return t === "admin" || role.includes("ADMIN");
}

export function isPartnerUser(user = getUser()) {
  const t = userTypeOf(user);
  const role = String(user?.data?.role || user?.result?.role || "").toUpperCase();
  return t === "partner" || t === "affiliate" || role.includes("PARTNER") || role.includes("AFFILIATE");
}

/** Customer / agency workspace — real JWT, not partner-only or preview. */
export function isCustomerAuthenticated() {
  if (!userIsAuthenticated()) return false;
  if (isAdminUser()) return false;
  if (isPartnerUser()) return false;
  return true;
}

/** Partner centre — partner JWT and/or dedicated partner session flag. */
export function isPartnerAuthenticated() {
  if (readSessionFlag(PARTNER_KEY)) return true;
  return userIsAuthenticated() && isPartnerUser();
}

/** HQ / admin console — admin JWT only. */
export function isAdminAuthenticated() {
  return userIsAuthenticated() && isAdminUser();
}

export function isPreviewSignedIn() {
  return readSessionFlag(PREVIEW_KEY);
}

/** Customer workspace (/app) — customer or admin JWT; never preview-only or partner-only. */
export function canAccessCustomerApp(user = getUser()) {
  if (!userIsAuthenticated()) return false;
  if (isPreviewSignedIn() && !isCustomerAuthenticated() && !isAdminUser(user)) return false;
  return isCustomerAuthenticated() || isAdminUser(user);
}

export { PARTNER_KEY, PREVIEW_KEY };
