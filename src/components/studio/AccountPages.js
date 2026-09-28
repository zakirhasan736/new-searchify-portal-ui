"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authHeaders, getUser, userLogout } from "@/utils/users/Helpers";
import { FEATURES } from "@/lib/featureCatalog";
import { DEMO_SITES } from "@/lib/demoFeeds";

export function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const user = typeof window !== "undefined" ? getUser() : null;
  const signedIn = Boolean(user?.result?.token);

  useEffect(() => {
    fetch("/api/v1/profile", { headers: authHeaders() })
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) => {
        if (!profile) {
          setEmail(user?.result?.username || "");
          setName(user?.result?.username || "Guest");
          return;
        }
        setName(profile.displayName || "");
        setEmail(profile.email || "");
      });
  }, []);

  const save = async (event) => {
    event.preventDefault();
    const response = await fetch("/api/v1/profile", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ displayName: name }),
    });
    setMessage(response.ok ? "Profile saved." : "Sign in to save your profile.");
  };

  const logout = () => {
    userLogout();
    setMessage("Signed out.");
    router.push("/signin");
  };

  return (
    <section className="mx-auto max-w-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-semibold">Account</h1>
          <p className="mt-2 text-sm text-white/60">{email || (signedIn ? "Signed in" : "Not signed in — demo feeds still load on tools")}</p>
        </div>
        {signedIn ? (
          <button type="button" onClick={logout} className="h-10 rounded-full border border-line bg-white/5 px-4 text-sm text-white/80 hover:border-blush/50 hover:text-white">
            Log out
          </button>
        ) : (
          <Link href="/signin" className="inline-flex h-10 items-center rounded-full bg-gradient-to-r from-blush to-brand px-4 text-sm font-semibold">
            Sign in
          </Link>
        )}
      </div>

      <form onSubmit={save} className="mt-6 grid gap-3 rounded-2xl border border-line bg-panel p-5">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" className="h-11 rounded-xl border border-line bg-ink px-3" />
        <button className="h-11 rounded-full bg-gradient-to-r from-blush to-brand font-semibold">Save profile</button>
        {message ? <p className="text-sm text-brand">{message}</p> : null}
      </form>

      <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Prototype sites</p>
        <p className="mt-1 text-sm text-white/55">Tools show relational data for these domains in the client demo.</p>
        <ul className="mt-3 space-y-2">
          {DEMO_SITES.map((site) => (
            <li key={site.domain} className="flex items-center justify-between gap-2 text-sm">
              <span>{site.label}</span>
              <span className="text-white/45">{site.domain}</span>
            </li>
          ))}
        </ul>
      </div>

      {signedIn ? (
        <button type="button" onClick={logout} className="mt-6 h-11 w-full rounded-full border border-blush/40 bg-blush/10 text-sm font-semibold text-blush">
          Log out of Searchify
        </button>
      ) : null}
    </section>
  );
}

export function AdminPage() {
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState("Retail");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    fetch("/api/v1/admin/tags", { headers: authHeaders() })
      .then((response) => (response.ok ? response.json() : []))
      .then(setDomains);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (event) => {
    event.preventDefault();
    const response = await fetch("/api/v1/admin/tags", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ domain, name }),
    });
    setMessage(response.ok ? "Tag saved." : "Admin sign-in is required.");
    if (response.ok) {
      setName("");
      load();
    }
  };

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="font-sans text-3xl font-semibold">Tag management</h1>
      <form onSubmit={add} className="mt-6 flex flex-wrap gap-2">
        <input value={domain} onChange={(event) => setDomain(event.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3" />
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tag name" className="h-11 flex-1 rounded-xl border border-line bg-ink px-3" />
        <button className="h-11 rounded-full bg-brand px-5 font-semibold">Add tag</button>
      </form>
      {message ? <p className="mt-3 text-sm text-brand">{message}</p> : null}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {domains.map((item) => (
          <article key={item.id} className="rounded-2xl border border-line bg-panel p-4">
            <h2 className="font-semibold">{item.name}</h2>
            <p className="mt-2 text-sm text-white/65">{(item.tags || []).map((tag) => tag.name).join(", ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const NEWS = [
  ["Searchify studio", "The workspace now keeps reports in PostgreSQL and opens them from search."],
  ["Crawl notes", "A crawl stores the title, description, and same-host pages."],
  ["Writers stay gated", "Draft jobs wait until a writer is connected. A person still publishes."],
];

export function NewsPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="font-sans text-3xl font-semibold">Announcements</h1>
      <div className="mt-6 grid gap-3">
        {NEWS.map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-line bg-panel p-5">
            <h2 className="font-sans text-xl">{title}</h2>
            <p className="mt-2 text-sm text-white/65">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const FILTERS = ["All", "Ads", "Grammar", "Blog"];

export function FeaturesPage() {
  const [filter, setFilter] = useState("All");
  const cards = [
    ["Google ad copy", "Ads", "1"],
    ["Headline variations", "Ads", "2"],
    ["Grammar pass", "Grammar", "3"],
    ["Blog outline", "Blog", "4"],
    ["Meta description", "Blog", "5"],
  ].filter((item) => filter === "All" || item[1] === filter);

  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="font-sans text-3xl font-semibold">AI features</h1>
      <div className="mt-4 flex gap-2">
        {FILTERS.map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm ${filter === item ? "bg-brand" : "bg-white/5"}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map(([title, tag, id]) => (
          <Link key={id} href={`/text-generator/${id}`} className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-brand">{tag}</p>
            <h2 className="mt-2 text-xl">{title}</h2>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-2">
        {FEATURES.slice(0, 6).map((feature) => (
          <Link key={feature.path} href={feature.path} className="text-sm text-white/70 hover:text-white">
            {feature.group} · {feature.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
