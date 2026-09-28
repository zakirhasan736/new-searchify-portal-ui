"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/utils/users/Helpers";
import { getProject, isWebsiteExist, updateProject } from "@/utils/users/ProjectUtil";

export function WorksPage() {
  const router = useRouter();
  const [sites, setSites] = useState([]);

  useEffect(() => {
    const project = getProject();
    setSites(project?.websites || []);
  }, []);

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Start</p>
          <h1 className="mt-2 font-sans text-4xl font-semibold tracking-tight">My works</h1>
          <p className="mt-2 text-sm text-white/65">Sites saved on this account. Open one or add a new crawl.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("currentWebsite");
            router.push("/seooptimization/new");
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-blush to-brand px-4 font-semibold"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-white stroke-2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New project
        </button>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sites.map((site) => (
          <button
            key={site.url || site.name}
            type="button"
            onClick={() => {
              localStorage.setItem("currentWebsite", JSON.stringify(site));
              router.push("/seooptimization");
            }}
            className="rounded-2xl border border-line bg-panel p-5 text-left"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-white/40">Site</p>
            <h2 className="mt-2 font-sans text-xl">{site.name || "Untitled"}</h2>
            <p className="mt-2 text-sm text-white/60">{site.url}</p>
          </button>
        ))}
        {!sites.length ? <p className="text-sm text-white/55">No sites yet. Create the first project.</p> : null}
      </div>
    </section>
  );
}

export function CrawlPage({ mode = "edit" }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (mode === "new") localStorage.removeItem("currentWebsite");
    const site = typeof window === "undefined" ? null : JSON.parse(localStorage.getItem("currentWebsite") || "null");
    if (site?.url) setUrl(site.url);
    if (site?.name) setName(site.name);
  }, [mode]);

  const crawl = async (event) => {
    event.preventDefault();
    setMessage("Crawling…");
    const response = await fetch("/api/v1/crawl", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ link: url }),
    });
    const data = await response.json();
    if (!response.ok || data.current?.error === "invalid url") {
      setMessage("That URL could not be crawled.");
      return;
    }
    const site = { name: name || data.current?.title || url, url, settings: { domain: "Retail" }, webpages: data.internalResources || [] };
    localStorage.setItem("currentWebsite", JSON.stringify(site));
    const project = getProject();
    if (project && !isWebsiteExist(project.websites, url)) {
      const websites = [...(project.websites || []), site];
      const saved = await updateProject({ ...project, websites });
      if (saved.ok) {
        const resultProject = await saved.json();
        localStorage.setItem("project", JSON.stringify(resultProject));
      }
    }
    setPages(data.internalResources || []);
    setMessage(data.current?.title || "Crawl stored.");
  };

  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Start</p>
      <h1 className="mt-2 font-sans text-3xl font-semibold">{mode === "new" ? "New optimization" : "Site optimization"}</h1>
      <p className="mt-2 text-sm text-white/65">Crawl a page, then keep the title and the pages found on the same host.</p>
      <form onSubmit={crawl} className="mt-6 grid gap-3 rounded-2xl border border-line bg-panel p-5">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" className="h-11 rounded-xl border border-line bg-ink px-3" />
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" className="h-11 rounded-xl border border-line bg-ink px-3" />
        <div className="flex gap-2">
          <button type="submit" className="h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 font-semibold">Crawl</button>
          <button type="button" onClick={() => router.push("/projectmaking")} className="h-11 rounded-full border border-line px-5">Open suggestions</button>
        </div>
        {message ? <p className="text-sm text-brand">{message}</p> : null}
      </form>
      {pages.length ? (
        <ul className="mt-4 divide-y divide-white/5 overflow-hidden rounded-2xl border border-line bg-panel">
          {pages.slice(0, 12).map((page) => (
            <li key={page.url} className="px-4 py-3 text-sm">
              <p>{page.title || "Untitled page"}</p>
              <p className="text-white/50">{page.url}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
