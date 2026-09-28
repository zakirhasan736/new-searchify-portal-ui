"use client";

import { useEffect, useState } from "react";
import styles from "../analytics/analytics.module.css";
import { authHeaders } from "@/utils/users/Helpers";

export default function TagManagement() {
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState("Retail");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await fetch("/api/v1/admin/tags", { headers: authHeaders() });
    if (!response.ok) {
      setMessage("Sign in as admin to manage tags.");
      return;
    }
    setDomains(await response.json());
    setMessage("");
  };

  useEffect(() => {
    load();
  }, []);

  const addTag = async () => {
    const response = await fetch("/api/v1/admin/tags", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ domain, name }),
    });
    if (!response.ok) {
      setMessage("Could not save that tag.");
      return;
    }
    setName("");
    load();
  };

  return (
    <section className={styles.SEORanking__wrap_section}>
      <div className={styles.analytics_overview_titlebox}>
        <h1 className={styles.analytics_title}>Tag management</h1>
        <p style={{ color: "#cfcfcf", marginTop: 8 }}>Admin home. Add a tag to a business domain.</p>
      </div>
      <div style={{ padding: "0 24px 32px", color: "#fff" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="Domain" style={{ padding: 8 }} />
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tag name" style={{ padding: 8 }} />
          <button type="button" onClick={addTag} style={{ padding: "8px 14px" }}>Add tag</button>
        </div>
        {message ? <p>{message}</p> : null}
        {domains.map((item) => (
          <div key={item.id} style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 18 }}>{item.name}</h2>
            <p>{item.tags.map((tag) => tag.name).join(", ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
