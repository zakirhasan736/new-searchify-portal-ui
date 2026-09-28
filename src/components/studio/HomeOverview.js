"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadFeatures } from "@/lib/clientApi";
import { getProject } from "@/utils/users/ProjectUtil";

const PRODUCTS = [
  ["SEO Operator", "Approve → CMS execute → monitor", "/operator"],
  ["SEO studio", "Audits, ranks, keywords, links", "/dashboard"],
  ["AI visibility", "Mentions across answer engines", "/visibility/overview"],
  ["Market pulse", "Sessions and competitor mix", "/market/traffic-analytics"],
  ["Local presence", "Listings, reviews, map ranks", "/local"],
  ["Content desk", "Briefs through publish queue", "/content"],
];

function metric(features, kind, pick) {
  const row = features[kind]?.[0];
  const payload = row?.payload || {};
  if (typeof pick === "function") return pick(payload, row);
  return "—";
}

function buildRows(sites, features) {
  const health = metric(features, "site-audit", (p) => (p.panels?.score != null ? `${p.panels.score}%` : "Set up"));
  const keywords = metric(features, "domain-snapshot", (p) => {
    const hit = (p.rows || []).find((r) => String(r[0]).toLowerCase().includes("keyword"));
    return hit?.[1] || "—";
  });
  const backlinks = metric(features, "backlinks", (p) => String((p.rows || []).length || "—"));
  const mentions = metric(features, "visibility-overview", (p) => {
    const hit = (p.rows || []).find((r) => String(r[0]).toLowerCase().includes("ai") || String(r[1]).toLowerCase().includes("mention"));
    return hit?.[2] || hit?.[1] || "n/a";
  });
  const traffic = metric(features, "domain-snapshot", (p) => {
    const hit = (p.rows || []).find((r) => String(r[0]).toLowerCase().includes("traffic"));
    return hit?.[1] || "—";
  });
  const visibility = metric(features, "visibility-overview", (p) => {
    const hit = (p.rows || []).find((r) => String(r[0]).toLowerCase().includes("search"));
    return hit?.[2] || "n/a";
  });

  if (sites.length) {
    return sites.map((site) => ({
      key: site.url || site.name,
      name: site.name || "Untitled",
      url: site.url,
      health,
      visibility,
      traffic,
      keywords,
      backlinks,
      mentions,
      site,
    }));
  }

  const seeded = features["home-projects"]?.[0]?.payload?.rows || [];
  if (seeded.length) {
    return seeded.map((row, index) => ({
      key: row[0] || index,
      name: row[0],
      url: row[1],
      health: row[2],
      visibility: row[3],
      traffic: row[4],
      keywords: row[5],
      backlinks: row[6],
      mentions: row[7],
      site: { name: row[0], url: row[1], settings: { domain: "Retail" }, webpages: [] },
    }));
  }

  return [
    {
      key: "demo",
      name: "searchify.example",
      url: "https://searchify.example",
      health,
      visibility,
      traffic,
      keywords,
      backlinks,
      mentions,
      site: { name: "searchify.example", url: "https://searchify.example", settings: { domain: "Retail" }, webpages: [] },
    },
  ];
}

export default function HomeOverview() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [domain, setDomain] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const project = getProject();
      const kinds = ["site-audit", "domain-snapshot", "visibility-overview", "backlinks", "home-projects"];
      const packed = {};
      await Promise.all(
        kinds.map(async (kind) => {
          packed[kind] = await loadFeatures(kind);
        }),
      );
      if (!alive) return;
      setRows(buildRows(project?.websites || [], packed));
    })();
    return () => {
      alive = false;
    };
  }, []);

  const visible = rows.filter((row) => `${row.name || ""} ${row.url || ""}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <section className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-brand/25 via-[#120e1c] to-blush/20 px-4 py-6 sm:rounded-[2rem] sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-blush/25 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
          <div className="max-w-xl">
            <p className="font-sans text-4xl font-semibold tracking-tight sm:text-6xl">Searchify</p>
            <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">Your studio pulse — projects, AI mentions, and organic health in one dark workspace.</p>
          </div>
          <Link href="/seooptimization/new" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white px-5 font-semibold text-ink sm:w-auto">
            Start a project
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {PRODUCTS.map(([title, body, href]) => (
          <Link
            key={title}
            href={href}
            className="group rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-brand/40 hover:bg-brand/10 sm:rounded-[1.5rem] sm:p-5"
          >
            <p className="font-sans text-base font-semibold sm:text-lg">{title}</p>
            <p className="mt-2 text-sm leading-6 text-white/55">{body}</p>
            <p className="mt-4 text-xs font-medium text-brand opacity-80 group-hover:opacity-100">Enter space</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <h2 className="font-sans text-xl font-semibold sm:text-2xl">Project pulse</h2>
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter sites…"
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm sm:ml-auto sm:h-10 sm:min-w-[160px] sm:flex-1 sm:max-w-xs"
            />
            <Link href="/works" className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 px-3 text-sm text-white/70 sm:h-auto sm:py-2">
              Library
            </Link>
          </div>
          <div className="space-y-3">
            {visible.map((row) => (
              <button
                key={row.key}
                type="button"
                className="w-full rounded-[1.25rem] border border-white/10 bg-gradient-to-r from-white/[0.05] to-transparent p-4 text-left transition hover:border-brand/35 sm:rounded-[1.5rem] sm:p-5"
                onClick={() => {
                  localStorage.setItem("currentWebsite", JSON.stringify(row.site));
                  router.push("/seooptimization");
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-lg font-semibold sm:text-xl">{row.name}</p>
                    <p className="mt-1 truncate text-sm text-white/45">{row.url}</p>
                  </div>
                  <span className="rounded-full bg-brand/20 px-3 py-1 text-xs text-brand">Health {row.health}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">AI mentions</p>
                    <p className="mt-1 text-base font-semibold sm:text-lg">{row.mentions}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">Traffic</p>
                    <p className="mt-1 text-base font-semibold sm:text-lg">{row.traffic}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">Keywords</p>
                    <p className="mt-1 text-base font-semibold sm:text-lg">{row.keywords}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">Backlinks</p>
                    <p className="mt-1 text-base font-semibold sm:text-lg">{row.backlinks}</p>
                  </div>
                </div>
              </button>
            ))}
            {!visible.length ? <p className="rounded-[1.5rem] border border-dashed border-white/10 px-5 py-10 text-sm text-white/50">No sites yet — add a domain below.</p> : null}
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-white/10 bg-[#120e1c] p-5 sm:rounded-[1.75rem] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blush">Watchlist</p>
          <h2 className="mt-2 font-sans text-xl font-semibold sm:text-2xl">Add a domain</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">Store a competitor or property on this project. Crawls wait for a person to publish fixes.</p>
          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!domain.trim()) return;
              localStorage.setItem(
                "currentWebsite",
                JSON.stringify({
                  name: domain.trim(),
                  url: domain.trim().startsWith("http") ? domain.trim() : `https://${domain.trim()}`,
                  settings: { domain: "Retail" },
                  webpages: [],
                }),
              );
              router.push("/seooptimization/new");
            }}
          >
            <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" className="h-12 w-full rounded-2xl border border-white/10 bg-ink px-4" />
            <button type="submit" className="h-12 w-full rounded-2xl bg-gradient-to-r from-blush to-brand font-semibold">
              Pin to studio
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
