"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import { getBusinessProfile, saveBusinessProfile } from "@/lib/v1Api";

const EMPTY = {
  business: "",
  services: "",
  areas: "",
  locations: "",
  claims: "",
  voice: "Clear, practical, local. Speak like the business owner — not a generic agency.",
  restrictions: "No invented guarantees, prices, credentials, awards, or 24/7 claims.",
  rules: "",
};

export default function ProfilePage() {
  const toast = useV3Toast();
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getProfile());

  const load = useCallback(async () => {
    const res = await getBusinessProfile();
    if (res.ok && res.data?.profile) {
      const p = res.data.profile;
      setForm({
        ...EMPTY,
        ...p,
        locations: p.locations || p.areas || "",
        restrictions: p.restrictions || p.rules || EMPTY.restrictions,
      });
    }
    setBooted(true);
  }, [setBooted]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    const res = await saveBusinessProfile({
      ...form,
      areas: form.locations || form.areas,
      rules: form.restrictions || form.rules,
    });
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not save profile.");
      return;
    }
    setSaved(true);
    toast("Business context saved. Drafts will use these claims and restrictions.");
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero
        label="Business context"
        line1="MAKE IT"
        line2="YOUR OWN."
        sub="Services, locations, claims, brand voice, and restrictions — used by every suggestion."
      />

      <div className="sf-box sf-gap">
        <h3>Business details</h3>
        <div className="sf-grid">
          <label className="sf-field">
            Business name
            <input value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
          </label>
          <label className="sf-field">
            Locations served
            <input
              value={form.locations}
              onChange={(e) => setForm({ ...form, locations: e.target.value, areas: e.target.value })}
              placeholder="Austin, TX · Cedar Park"
            />
          </label>
        </div>
        <label className="sf-field">
          Services offered
          <textarea
            value={form.services}
            onChange={(e) => setForm({ ...form, services: e.target.value })}
            placeholder="Emergency dental, cleanings, implants"
          />
        </label>
        <label className="sf-field">
          Approved claims
          <textarea
            value={form.claims}
            onChange={(e) => setForm({ ...form, claims: e.target.value })}
            placeholder="Family-owned since 2008. Same-day emergency slots when available."
          />
        </label>
        <label className="sf-field">
          Brand voice
          <textarea value={form.voice} onChange={(e) => setForm({ ...form, voice: e.target.value })} />
        </label>
        <label className="sf-field">
          Restrictions
          <textarea
            value={form.restrictions}
            onChange={(e) => setForm({ ...form, restrictions: e.target.value, rules: e.target.value })}
          />
        </label>
        <div className="sf-note">Suggestions must not invent prices, guarantees, certifications, or services you did not list.</div>
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h3>Publishing control</h3>
            <p style={{ fontSize: 13 }}>Every update still requires a named person to approve it.</p>
          </div>
          <Pill>Approval required</Pill>
        </div>
        <div className="sf-divider" />
        <h3>Protected content</h3>
        <p style={{ fontSize: 13 }}>
          Contact details, pricing, URLs, indexing settings and legal pages cannot be changed by this workflow.
        </p>
      </div>

      <div className="sf-row sf-between sf-gap">
        <span className="sf-small">{saved ? "Context saved for future drafts." : "Applies to future suggestions."}</span>
        <Btn primary onClick={save} disabled={busy}>
          Save business context
        </Btn>
      </div>
    </>
  );
}
