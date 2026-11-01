export const parseJwt = (token) => {
  if (!token) {
    return;
  }
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return JSON.parse(window.atob(padded));
};

export const handleLogError = (error) => {
  if (error.response) {
    console.log(error.response.data);
  } else if (error.request) {
    console.log(error.request);
  } else {
    console.log(error.message);
  }
};

const localStore = () => (typeof window === "undefined" ? null : window.localStorage);
const sessionStore = () => (typeof window === "undefined" ? null : window.sessionStorage);

function readUserRaw() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("user") || window.localStorage.getItem("user");
}

export const getUser = () => {
  const raw = readUserRaw();
  return raw ? JSON.parse(raw) : null;
};

export const userIsAuthenticated = () => {
  const raw = readUserRaw();
  if (!raw) return false;
  const user = JSON.parse(raw);
  if (Date.now() > user.data.exp * 1000) {
    userLogout();
    return false;
  }
  return true;
};

/** @param {object} user
 *  @param {{ remember?: boolean }} [opts] — false stores the session for this browser tab only */
export const userLogin = (user, opts = {}) => {
  if (typeof window === "undefined") return;
  const remember = opts.remember !== false;
  const local = localStore();
  const session = sessionStore();
  local?.removeItem("user");
  session?.removeItem("user");
  (remember ? local : session)?.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("sf-auth"));
};

export const userLogout = () => {
  if (typeof window === "undefined") return;
  localStore()?.removeItem("user");
  sessionStore()?.removeItem("user");
  window.dispatchEvent(new Event("sf-auth"));
  localStore()?.removeItem("project");
  localStore()?.removeItem("currentWebsite");
  localStore()?.removeItem("crawlingData");
  sessionStore()?.removeItem("project");
};

export function authHeaders() {
  const token = getUser()?.result?.token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
