"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Hero, Pill } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { authHeaders } from "@/utils/users/Helpers";
import { useAdminToast } from "@/components/v3/AdminShell";

export default function AdminTagsPage() {
  const toast = useAdminToast();
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState("Retail");
  const [name, setName] = useState("");
  const [booted, setBooted] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/admin/tags", { headers: authHeaders() });
    const data = res.ok ? await res.json() : [];
    setDomains(Array.isArray(data) ? data : []);
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (event) => {
    event.preventDefault();
    setBusy(true);
    const res = await fetch("/api/v1/admin/tags", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ domain, name }),
    });
    setBusy(false);
    if (!res.ok) {
      toast("Admin sign-in is required.");
      return;
    }
    setName("");
    toast("Tag saved. Customers never see this rail.");
    load();
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero
        label="Admin only"
        line1="TAG"
        line2="CATALOG."
        sub="Industry tags stay here. Ordinary customer navigation never includes this page."
      />

      <form className="sf-box sf-gap" onSubmit={add}>
        <div className="sf-row sf-between">
          <h2>Add a tag</h2>
          <Pill>Admin</Pill>
        </div>
        <div className="sf-grid">
          <label className="sf-field">
            Domain
            <input value={domain} onChange={(e) => setDomain(e.target.value)} />
          </label>
          <label className="sf-field">
            Tag name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Local services" />
          </label>
        </div>
        <Btn primary disabled={busy || !name.trim()} onClick={add}>
          Save tag
        </Btn>
      </form>

      <div className="sf-list sf-gap">
        {domains.length ? (
          domains.map((item) => (
            <div className="sf-listrow" key={item.id}>
              <div>
                <h3>{item.name}</h3>
                <p style={{ fontSize: 13 }}>{(item.tags || []).map((tag) => tag.name).join(", ") || "No tags yet"}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="sf-empty">
            <h3>No domains yet</h3>
            <p>Create the first catalog domain. This never appears in /app Settings.</p>
          </div>
        )}
      </div>
    </>
  );
}
