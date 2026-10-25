import { authHeaders, getUser, parseJwt, userLogin } from "@/utils/users/Helpers";

async function json(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function post(path, body, withAuth = false) {
  return fetch(path, {
    method: "POST",
    headers: withAuth ? authHeaders() : { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(json);
}

/** area: "customer" | "partner" | "admin" — the reset link opens that area's sign-in page. */
export function forgotPassword(email, area) {
  return post("/api/v1/auth/forgot", { email: String(email || "").trim(), area });
}

export function resetPassword(token, password) {
  return post("/api/v1/auth/reset", { token, password });
}

export function changePassword(current, password) {
  return post("/api/v1/auth/change-password", { current, password }, true);
}

export function errorText(res, fallback) {
  const detail = res?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}

/** Keep this device signed in after a password change (other sessions stop working). */
export function replaceSessionToken(token, userType, username) {
  if (!token) return;
  const current = getUser() || {};
  const decoded = parseJwt(token) || {};
  userLogin({
    ...current,
    result: { ...(current.result || {}), token, userType: userType || current.result?.userType, username: username || current.result?.username },
    data: { ...(current.data || {}), ...decoded },
  });
}
