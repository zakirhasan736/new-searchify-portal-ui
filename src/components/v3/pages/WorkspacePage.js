"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import {
  deleteAgencyClient,
  getProductWorkspace,
  inviteWorkspaceMember,
  patchWorkspaceMember,
  removeWorkspaceMember,
  saveAgencyClient,
} from "@/lib/v1Api";

const EMPTY_CLIENT = { name: "", contact_email: "", notes: "", site_ids: [] };
const EMPTY_MEMBER = { email: "", display_name: "", role: "viewer" };

export default function WorkspacePage() {
  const toast = useV3Toast();
  const [data, setData] = useState(null);
  const [client, setClient] = useState(EMPTY_CLIENT);
  const [member, setMember] = useState(EMPTY_MEMBER);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = useState(false);

  const load = useCallback(async () => {
    const res = await getProductWorkspace({ force: true });
    if (res.ok) setData(res.data);
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addClient = async () => {
    setBusy(true);
    const res = await saveAgencyClient(client);
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not save client.");
      return;
    }
    setClient(EMPTY_CLIENT);
    toast("Client folder created. Sites stay isolated to that client.");
    load();
  };

  const toggleSite = (id) => {
    const next = client.site_ids.includes(id) ? client.site_ids.filter((x) => x !== id) : [...client.site_ids, id];
    setClient({ ...client, site_ids: next });
  };

  const addMember = async () => {
    setBusy(true);
    const res = await inviteWorkspaceMember(member);
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not add teammate.");
      return;
    }
    setMember(EMPTY_MEMBER);
    toast("Invite saved. They only see this workspace’s clients and sites.");
    load();
  };

  if (!booted) return <PageSkeleton />;

  const sites = data?.sites || [];
  const clients = data?.clients || [];
  const members = data?.members || [];

  return (
    <>
      <Hero
        label="Agency workspace"
        line1="KEEP CLIENTS"
        line2="SEPARATE."
        sub="Clients, sites, and team permissions live here. Each client folder only sees the sites you attach."
      />

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>Clients</h2>
            <p>Group WordPress sites so one client never sees another client’s queue or reports.</p>
          </div>
          <Pill>{clients.length} folders</Pill>
        </div>
        <div className="sf-grid">
          <label className="sf-field">
            Client name
            <input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Northside Dental" />
          </label>
          <label className="sf-field">
            Contact email
            <input value={client.contact_email} onChange={(e) => setClient({ ...client, contact_email: e.target.value })} placeholder="owner@client.com" />
          </label>
        </div>
        <label className="sf-field">
          Notes
          <textarea value={client.notes} onChange={(e) => setClient({ ...client, notes: e.target.value })} placeholder="Brand rules, publishing windows, who approves." />
        </label>
        {sites.length ? (
          <div>
            <div className="sf-small" style={{ marginBottom: 8 }}>
              Attach sites
            </div>
            <div className="sf-row" style={{ flexWrap: "wrap", gap: 8 }}>
              {sites.map((site) => (
                <Btn key={site.id} onClick={() => toggleSite(site.id)}>
                  {client.site_ids.includes(site.id) ? "✓ " : ""}
                  {site.label || site.siteUrl}
                </Btn>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13 }}>Connect a WordPress site first, then attach it to a client.</p>
        )}
        <Btn primary onClick={addClient} disabled={busy || !client.name.trim()}>
          Save client folder
        </Btn>
      </div>

      <div className="sf-list sf-gap">
        {clients.length ? (
          clients.map((row) => (
            <div className="sf-listrow" key={row.id}>
              <div>
                <h3>{row.name}</h3>
                <div className="sf-small">{row.contactEmail || "No contact yet"}</div>
                <div className="sf-small">
                  {(row.siteIds || []).length
                    ? (row.siteIds || [])
                        .map((id) => sites.find((s) => s.id === id)?.label || sites.find((s) => s.id === id)?.siteUrl || `Site ${id}`)
                        .join(" · ")
                    : "No sites attached"}
                </div>
                {row.notes ? <p style={{ fontSize: 13, marginTop: 8 }}>{row.notes}</p> : null}
              </div>
              <Btn
                onClick={async () => {
                  setBusy(true);
                  await deleteAgencyClient(row.id);
                  setBusy(false);
                  toast("Client folder removed. Sites stay connected.");
                  load();
                }}
              >
                Remove
              </Btn>
            </div>
          ))
        ) : (
          <div className="sf-empty">
            <h3>No client folders yet</h3>
            <p>Create one per account so work, reports, and approvals stay separated.</p>
          </div>
        )}
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>Team permissions</h2>
            <p>Owner approves plan changes. Approvers can publish. Editors draft. Viewers only read.</p>
          </div>
          <Pill>{members.length} seats</Pill>
        </div>
        <div className="sf-grid">
          <label className="sf-field">
            Email
            <input value={member.email} onChange={(e) => setMember({ ...member, email: e.target.value })} placeholder="writer@agency.com" />
          </label>
          <label className="sf-field">
            Name
            <input value={member.display_name} onChange={(e) => setMember({ ...member, display_name: e.target.value })} />
          </label>
        </div>
        <label className="sf-field">
          Role
          <select value={member.role} onChange={(e) => setMember({ ...member, role: e.target.value })}>
            <option value="approver">Approver · can publish</option>
            <option value="editor">Editor · can draft</option>
            <option value="viewer">Viewer · read only</option>
          </select>
        </label>
        <Btn primary onClick={addMember} disabled={busy || !member.email.trim()}>
          Add teammate
        </Btn>
      </div>

      <div className="sf-list sf-gap">
        {members.map((row) => (
          <div className="sf-listrow" key={row.id}>
            <div>
              <div className="sf-row" style={{ marginBottom: 6 }}>
                <h3>{row.displayName || row.email}</h3>
                <Pill neutral={row.role !== "owner"}>{row.role}</Pill>
                <Pill warn={row.status === "invited"}>{row.status}</Pill>
              </div>
              <div className="sf-small">{row.email}</div>
            </div>
            {row.role === "owner" ? (
              <span className="sf-small">Owner seat</span>
            ) : (
              <div className="sf-row">
                <Btn
                  onClick={async () => {
                    await patchWorkspaceMember(row.id, { status: row.status === "invited" ? "active" : "invited" });
                    load();
                  }}
                >
                  {row.status === "invited" ? "Mark active" : "Mark invited"}
                </Btn>
                <Btn
                  onClick={async () => {
                    await removeWorkspaceMember(row.id);
                    toast("Seat removed.");
                    load();
                  }}
                >
                  Remove
                </Btn>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
