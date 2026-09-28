const API = "http://127.0.0.1:8000";

async function json(url, opts = {}) {
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

const login = await json(`${API}/api/v1/auth/signin`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "client", password: "Client#1234" }),
});
if (!login.ok) {
  console.log(JSON.stringify(login, null, 2));
  process.exit(1);
}
const token = login.body.token;
const kinds = [
  "domain-snapshot",
  "site-audit",
  "position-tracking",
  "keyword-gap",
  "organic-search",
  "backlink-analytics",
  "traffic-analytics",
  "local-dashboard",
  "content-dashboard",
  "ai-analysis",
  "seo-writing",
  "ai-article",
  "brand-performance",
  "referral",
  "my-content",
  "seo-dashboard",
  "home-projects",
];

const results = [];
for (const kind of kinds) {
  const res = await json(`${API}/api/v1/features/${kind}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const first = Array.isArray(res.body) ? res.body[0] : null;
  const rows = first?.payload?.rows?.length || 0;
  const version = first?.payload?.seedVersion || "";
  const drafts = Array.isArray(res.body) ? res.body.filter((r) => r.payload?.draft).length : 0;
  results.push({ kind, status: res.status, rows, version, drafts, panels: Boolean(first?.payload?.panels) });
}

const bad = results.filter((r) => r.status !== 200 || r.rows < 4 || r.version !== "2026-09-23-proto-v2");
console.log(JSON.stringify({ ok: !bad.length, bad, results }, null, 2));
process.exit(bad.length ? 1 : 0);
