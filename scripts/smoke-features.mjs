const email = process.env.SMOKE_EMAIL || "client";
const password = process.env.SMOKE_PASSWORD || "client";
const API = process.env.API_URL || "http://127.0.0.1:8000";

async function json(url, opts = {}) {
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const login = await json(`${API}/api/v1/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });
  if (!login.ok) {
    console.log(JSON.stringify({ loginFailed: login }, null, 2));
    process.exit(1);
  }
  const token = login.body.token || login.body.access_token;
  const kinds = [
    "domain-snapshot",
    "site-audit",
    "keyword-gap",
    "backlink-analytics",
    "traffic-analytics",
    "local-dashboard",
    "content-dashboard",
    "ai-analysis",
    "on-page-seo",
    "position-tracking",
    "organic-research",
    "seo-writing",
    "brand-performance",
    "referral",
    "my-content",
  ];
  const results = [];
  for (const kind of kinds) {
    const res = await json(`${API}/api/v1/features/${kind}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const first = Array.isArray(res.body) ? res.body[0] : null;
    results.push({
      kind,
      status: res.status,
      rows: first?.payload?.rows?.length || 0,
      hasSummary: Boolean(first?.payload?.summary),
    });
  }
  const bad = results.filter((r) => r.status !== 200 || !r.rows);
  console.log(JSON.stringify({ ok: !bad.length, bad, results }, null, 2));
  process.exit(bad.length ? 1 : 0);
}

main();
