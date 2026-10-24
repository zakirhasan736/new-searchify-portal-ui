'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  errorText,
  getBusinessProfile,
  getProductUsage,
  getProductWorkspace,
  inviteWorkspaceMember,
  listChanges,
  saveBusinessProfile,
  saveUsageControls,
} from '@/lib/v1Api';
import { initials, planDisplayName } from '@/lib/v8LiveData';
import { loadJourney, planById } from '@/lib/journey';
import { authHeaders } from '@/utils/users/Helpers';
import '@/styles/v8-screens.css';

const SETTINGS_KEY = 'sf_v8_settings_v1';

function loadLocal() {
  try {
    return JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function saveLocal(patch) {
  const next = { ...loadLocal(), ...patch };
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

function roleLabel(role, clientHint) {
  const r = String(role || 'viewer').toLowerCase();
  if (r === 'owner') return 'Owner';
  if (r === 'editor' || r === 'approver') return 'Editor';
  if (r === 'client' || clientHint) return clientHint ? `Client · ${clientHint}` : 'Client';
  if (r === 'viewer') return 'Viewer';
  return role || 'Member';
}

export default function SettingsScreen({ initialTab = 'auto' }) {
  const [tab, setTab] = useState(initialTab === 'auto' || initialTab === 'billing' ? initialTab : 'auto');
  const [level, setLevel] = useState('ask');
  const [notif, setNotif] = useState({ results: true, weekly: true, broken: true, summary: false });
  const [profile, setProfile] = useState({ name: '', email: '', agency: '', timezone: '', photo: '' });
  const [people, setPeople] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [lockedExtra, setLockedExtra] = useState([]);
  const [winningCount, setWinningCount] = useState(0);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [newPage, setNewPage] = useState('');
  const [billing, setBilling] = useState({ plan: 'Starter', planId: 'starter', sitesUsed: 0, siteLimit: 5, renewNote: 'renews monthly' });
  const [scanHours, setScanHours] = useState(6);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialTab === 'billing' || initialTab === 'profile' || initialTab === 'team' || initialTab === 'notif' || initialTab === 'auto') {
      setTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const local = typeof window !== 'undefined' ? loadLocal() : {};
    if (local.notif) setNotif({ results: true, weekly: true, broken: true, summary: false, ...local.notif });
    if (local.autonomy) setLevel(local.autonomy);
    if (Array.isArray(local.lockedPages)) setLockedExtra(local.lockedPages);
    if (local.timezone) setProfile((p) => ({ ...p, timezone: local.timezone }));

    Promise.all([
      fetch('/api/v1/profile', { headers: authHeaders() }).then((r) => r.json().catch(() => null)).catch(() => null),
      getBusinessProfile({ force: true }).catch(() => ({ ok: false })),
      getProductWorkspace({ force: true }).catch(() => ({ ok: false })),
      getProductUsage().catch(() => ({ ok: false })),
      listChanges({ force: true }).catch(() => ({ ok: false })),
    ])
      .then(([acct, biz, ws, usage, chRes]) => {
        if (cancelled) return;
        const journey = loadJourney();
        const bizProfile = biz?.ok ? biz.data?.profile || biz.data || {} : {};
        const name = acct?.displayName || acct?.username || '';
        const email = acct?.email || '';
        setProfile((p) => ({
          name: name || p.name,
          email: email || p.email,
          agency: bizProfile.business || bizProfile.agencyName || bizProfile.businessName || p.agency,
          timezone: local.timezone || p.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
          photo: acct?.photo || '',
        }));

        const members = ws.ok ? ws.data?.members || [] : [];
        const clients = ws.ok ? ws.data?.clients || [] : [];
        const mappedPeople = members.map((m) => ({
          id: m.id,
          initials: initials(m.displayName || m.display_name || m.email),
          name: m.displayName || m.display_name || m.email,
          email: m.email,
          role: roleLabel(m.role),
        }));
        for (const c of clients) {
          if (!c.contactEmail) continue;
          if (mappedPeople.some((p) => p.email === c.contactEmail)) continue;
          mappedPeople.push({
            id: `client-${c.id}`,
            initials: initials(c.name || c.contactEmail),
            name: c.name || c.contactEmail,
            email: c.contactEmail,
            role: roleLabel('client', c.name),
          });
        }
        setPeople(mappedPeople);

        const u = usage.ok ? usage.data : ws.data?.usage || {};
        const planId = u.plan || journey.planId || 'starter';
        const planMeta = planById(planId);
        const sitesUsed = u.sites ?? ws.data?.sites?.length ?? 0;
        setBilling({
          plan: planDisplayName(planId) || planMeta?.name || 'Starter',
          planId,
          sitesUsed,
          siteLimit: u.limit || planMeta?.sites || 5,
          renewNote: u.resetsOn ? `renews ${u.resetsOn}` : 'renews monthly',
        });
        if (u.scanHours) setScanHours(u.scanHours);
        if (u.scansPaused && !local.autonomy) setLevel('pause');
        else if (local.autonomy) setLevel(local.autonomy);

        const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
        const winning = changes.filter((c) => c.status === 'monitoring' || c.status === 'applied');
        setWinningCount(winning.length);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tdefs = [
    ['profile', 'Profile'],
    ['team', 'Team and clients'],
    ['notif', 'Notifications'],
    ['auto', 'Autonomy'],
    ['billing', 'Plan and billing'],
  ];
  const tabs = tdefs.map((t) => ({
    label: t[1],
    on: t[0] === tab,
    off: t[0] !== tab,
    pick: () => setTab(t[0]),
  }));

  const ldefs = [
    {
      id: 'ask',
      label: 'Ask me before every change',
      desc: 'Searchify drafts and checks. Nothing goes live until you tap Ship it.',
    },
    {
      id: 'small',
      label: 'Ship small fixes on its own',
      desc: 'Titles, descriptions and internal links only. Up to 5 a week. Everything else still asks.',
    },
    {
      id: 'pause',
      label: 'Pause all changes',
      desc: 'Searchify keeps scanning and measuring, but ships nothing.',
    },
  ];
  const levels = ldefs.map((l) => {
    const on = l.id === level;
    return {
      ...l,
      checked: on,
      border: on ? '#4DA3FF' : '#262A31',
      bg: on ? 'rgba(77,163,255,.07)' : 'transparent',
      shadow: on ? '0 0 22px rgba(77,163,255,.2)' : 'none',
      ring: on ? '#4DA3FF' : '#3A404A',
      fill: on ? '#4DA3FF' : 'transparent',
      pick: () => {
        setLevel(l.id);
        saveLocal({ autonomy: l.id });
      },
    };
  });

  const ndefs = [
    { id: 'results', label: 'A result is in', hint: 'Email and phone, 28 days after a change ships' },
    { id: 'weekly', label: 'New moves are ready', hint: 'Thursday mornings' },
    { id: 'broken', label: 'A connection breaks', hint: 'So nothing silently stops working' },
    { id: 'summary', label: 'Monthly summary', hint: 'First Monday of the month' },
  ];
  const notifs = ndefs.map((n) => {
    const v = !!notif[n.id];
    return {
      ...n,
      checked: v,
      track: v ? '#4DA3FF' : '#262A31',
      justify: v ? 'flex-end' : 'flex-start',
      toggle: () => {
        const next = { ...notif, [n.id]: !v };
        setNotif(next);
        saveLocal({ notif: next });
        setSaved('Notification preferences saved on this device.');
      },
    };
  });

  const saveProfile = async () => {
    setBusy(true);
    setSaved('');
    saveLocal({ timezone: profile.timezone });
    const [acctRes, bizRes] = await Promise.all([
      fetch('/api/v1/profile', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ displayName: profile.name, photo: profile.photo || '' }),
      }).then((r) => r.json().then((data) => ({ ok: r.ok, data })).catch(() => ({ ok: false }))),
      saveBusinessProfile({
        business: profile.agency,
        services: '',
        areas: '',
        locations: '',
        claims: '',
        voice: '',
        restrictions: '',
        rules: '',
      }),
    ]);
    setBusy(false);
    if (acctRes.ok || bizRes.ok) setSaved('Profile saved.');
    else setSaved(errorText(bizRes, 'Could not save profile.'));
  };

  const saveAutonomy = async () => {
    setBusy(true);
    setSaved('');
    saveLocal({ autonomy: level, lockedPages: lockedExtra });
    const res = await saveUsageControls({
      scanHours,
      scansPaused: level === 'pause',
    });
    setBusy(false);
    setSaved(res.ok ? 'Autonomy settings saved.' : errorText(res, 'Could not save settings.'));
  };

  const sendInvite = async () => {
    const email = inviteEmail.trim();
    if (!email.includes('@')) {
      setSaved('Enter a valid email to invite.');
      return;
    }
    setBusy(true);
    setSaved('');
    const res = await inviteWorkspaceMember({ email, role: 'editor' });
    setBusy(false);
    if (res.ok) {
      const m = res.data?.member;
      if (m) {
        setPeople((prev) => [
          ...prev,
          {
            id: m.id,
            initials: initials(m.displayName || m.email),
            name: m.displayName || m.email,
            email: m.email,
            role: roleLabel(m.role),
          },
        ]);
      }
      setInviteEmail('');
      setSaved('Invite sent.');
    } else {
      setSaved(errorText(res, 'Could not send invite.'));
    }
  };

  const addLockedPage = () => {
    const path = newPage.trim().startsWith('/') ? newPage.trim() : `/${newPage.trim()}`;
    if (!path || path === '/') return;
    if (lockedExtra.includes(path)) {
      setNewPage('');
      setAddPageOpen(false);
      return;
    }
    const next = [...lockedExtra, path];
    setLockedExtra(next);
    saveLocal({ lockedPages: next });
    setNewPage('');
    setAddPageOpen(false);
    setSaved('Page added to never-touch list.');
  };

  const removeLocked = (path) => {
    const next = lockedExtra.filter((p) => p !== path);
    setLockedExtra(next);
    saveLocal({ lockedPages: next });
  };

  const isProfile = tab === 'profile';
  const isTeam = tab === 'team';
  const isNotif = tab === 'notif';
  const isAuto = tab === 'auto';
  const isBilling = tab === 'billing';

  return (
    <div style={{ flex: '999 1 560px', minWidth: 0, minHeight: 1000, background: '#0A0B0D', color: '#F2F4F5', fontFamily: "Geist, 'Helvetica Neue', sans-serif", boxSizing: 'border-box', padding: '22px clamp(16px, 4vw, 56px) 56px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '40px', padding: '0 14px', borderRadius: '999px', border: '1px solid #262A31', color: '#F2F4F5', textDecoration: 'none', fontSize: '13px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Home
        </Link>
      </header>

      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
        <nav aria-label="Settings sections" style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ margin: '0 0 16px', fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: '40px', letterSpacing: '-1.2px', fontWeight: '700' }}>Settings</h1>
          {tabs.map((t, i) =>
            t.on ? (
              <button key={i} type="button" aria-current="page" onClick={t.pick} style={{ textAlign: 'left', minHeight: '46px', padding: '0 14px', borderRadius: '12px', border: 0, background: '#131519', color: '#F2F4F5', fontSize: '15px', fontWeight: '600', boxShadow: 'inset 3px 0 0 #4DA3FF' }}>
                {t.label}
              </button>
            ) : (
              <button key={i} type="button" onClick={t.pick} style={{ textAlign: 'left', minHeight: '46px', padding: '0 14px', borderRadius: '12px', border: 0, background: 'transparent', color: '#9AA1AB', fontSize: '15px' }}>
                {t.label}
              </button>
            ),
          )}
          <Link href="/app/connections" style={{ display: 'flex', alignItems: 'center', minHeight: '46px', padding: '0 14px', borderRadius: '12px', color: '#9AA1AB', textDecoration: 'none', fontSize: '15px' }}>
            Connections ↗
          </Link>
        </nav>

        <section style={{ flex: '1 1 auto', minWidth: 0, borderRadius: '24px', background: '#101215', border: '1px solid #1A1D22', padding: 'clamp(20px, 3vw, 32px)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {saved ? (
            <p style={{ margin: 0, fontSize: '13px', color: '#4DA3FF' }} role="status">
              {saved}
            </p>
          ) : null}
          {loading ? (
            <p style={{ margin: 0, fontSize: '14px', color: '#9AA1AB' }}>Loading settings…</p>
          ) : null}

          {isProfile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'sfy-rise .25s ease both' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Profile</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#262A31', display: 'grid', placeItems: 'center', fontWeight: '600', overflow: 'hidden' }}>
                  {profile.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.photo} alt="" width={56} height={56} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    initials(profile.name)
                  )}
                </span>
                <label style={{ minHeight: '40px', padding: '0 14px', borderRadius: '10px', border: '1px solid #262A31', background: 'transparent', color: '#D7DADE', fontSize: '13px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  Change photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 400_000) {
                        setSaved('Choose a photo under 400KB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setProfile((p) => ({ ...p, photo: String(reader.result || '') }));
                        setSaved('Photo ready — tap Save changes.');
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#9AA1AB' }}>
                  Name
                  <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={{ minHeight: '46px', padding: '0 14px', borderRadius: '12px', border: '1px solid #262A31', background: '#0A0B0D', color: '#F2F4F5', font: 'inherit', fontSize: '15px' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#9AA1AB' }}>
                  Email
                  <input type="email" value={profile.email} readOnly style={{ minHeight: '46px', padding: '0 14px', borderRadius: '12px', border: '1px solid #262A31', background: '#0A0B0D', color: '#9AA1AB', font: 'inherit', fontSize: '15px' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#9AA1AB' }}>
                  Agency name (shown on client reports)
                  <input type="text" value={profile.agency} onChange={(e) => setProfile({ ...profile, agency: e.target.value })} style={{ minHeight: '46px', padding: '0 14px', borderRadius: '12px', border: '1px solid #262A31', background: '#0A0B0D', color: '#F2F4F5', font: 'inherit', fontSize: '15px' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#9AA1AB' }}>
                  Time zone
                  <input
                    type="text"
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    style={{ minHeight: '46px', padding: '0 14px', borderRadius: '12px', border: '1px solid #262A31', background: '#0A0B0D', color: '#F2F4F5', font: 'inherit', fontSize: '15px' }}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" disabled={busy} onClick={saveProfile} style={{ minHeight: '48px', padding: '0 20px', borderRadius: '12px', border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: '15px', fontWeight: '600' }}>
                  Save changes
                </button>
                <Link href="/resetpassword" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid #262A31', background: 'transparent', color: '#D7DADE', fontSize: '14px', textDecoration: 'none' }}>
                  Change password
                </Link>
              </div>
            </div>
          )}

          {isTeam && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'sfy-rise .25s ease both' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Team and clients</h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {people.length === 0 && <p style={{ margin: '8px 0', fontSize: '14px', color: '#9AA1AB' }}>Only you so far. Invite an editor or client below.</p>}
                {people.map((p) => (
                  <div key={p.id || p.email} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: '1px solid #1A1D22', flexWrap: 'wrap' }}>
                    <span style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#262A31', display: 'grid', placeItems: 'center', fontSize: '13px', fontWeight: '600' }}>{p.initials}</span>
                    <span style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '15px' }}>{p.name}</span>
                      <span style={{ fontSize: '13px', color: '#9AA1AB' }}>{p.email}</span>
                    </span>
                    <span style={{ fontSize: '13px', padding: '5px 10px', borderRadius: '8px', border: '1px solid #262A31', color: '#D7DADE' }}>{p.role}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#9AA1AB' }}>
                <span>
                  Roles: <strong style={{ color: '#F2F4F5' }}>Owner</strong> manages billing · <strong style={{ color: '#F2F4F5' }}>Editor</strong> ships moves · <strong style={{ color: '#F2F4F5' }}>Client</strong> can approve or decline moves on their own site, and sees their report
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <label style={{ flex: '1 1 260px', display: 'flex', position: 'relative' }}>
                  <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Invite by email</span>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    style={{ flex: 1, minHeight: '48px', padding: '0 14px', borderRadius: '12px', border: '1px solid #262A31', background: '#0A0B0D', color: '#F2F4F5', font: 'inherit', fontSize: '15px' }}
                  />
                </label>
                <button type="button" disabled={busy} onClick={sendInvite} style={{ minHeight: '48px', padding: '0 20px', borderRadius: '12px', border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: '15px', fontWeight: '600' }}>
                  Send invite
                </button>
              </div>
            </div>
          )}

          {isNotif && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'sfy-rise .25s ease both' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: '600' }}>Notifications</h2>
              {notifs.map((n) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: '1px solid #1A1D22' }}>
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '15px' }}>{n.label}</span>
                    <span style={{ fontSize: '13px', color: '#9AA1AB' }}>{n.hint}</span>
                  </span>
                  <button type="button" role="switch" aria-checked={n.checked} aria-label={n.label} onClick={n.toggle} style={{ width: '52px', height: '30px', borderRadius: '999px', border: 0, padding: '3px', background: n.track, display: 'flex', justifyContent: n.justify, transition: 'background .2s ease' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F2F4F5' }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isAuto && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'sfy-rise .25s ease both' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>How much can Searchify do on its own?</h2>
                <span style={{ fontSize: '14px', color: '#9AA1AB' }}>You can change this any time. Every change is still checked live and can be undone.</span>
              </div>
              <div role="radiogroup" aria-label="Autonomy" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {levels.map((l) => (
                  <button key={l.id} type="button" role="radio" aria-checked={l.checked} onClick={l.pick} style={{ textAlign: 'left', display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 18px', borderRadius: '16px', border: `1px solid ${l.border}`, background: l.bg, boxShadow: l.shadow, color: '#F2F4F5' }}>
                    <span style={{ width: '20px', height: '20px', marginTop: '2px', flex: 'none', borderRadius: '50%', border: `2px solid ${l.ring}`, boxSizing: 'border-box', display: 'grid', placeItems: 'center' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.fill }} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600' }}>{l.label}</span>
                      <span style={{ fontSize: '14px', color: '#9AA1AB', lineHeight: '1.45' }}>{l.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Never touch these pages</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'Geist Mono', monospace", fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #4DA3FF', color: '#D7DADE' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4DA3FF' }} />
                    {winningCount} winning pages (automatic)
                  </span>
                  {lockedExtra.map((path) => (
                    <button
                      key={path}
                      type="button"
                      title="Remove"
                      onClick={() => removeLocked(path)}
                      style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #262A31', color: '#D7DADE', background: 'transparent', cursor: 'pointer' }}
                    >
                      {path} ×
                    </button>
                  ))}
                  {addPageOpen ? (
                    <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        value={newPage}
                        onChange={(e) => setNewPage(e.target.value)}
                        placeholder="/page"
                        style={{ minHeight: '32px', width: '120px', padding: '0 8px', borderRadius: '8px', border: '1px solid #262A31', background: '#0A0B0D', color: '#F2F4F5', fontFamily: "'Geist Mono', monospace", fontSize: '12px' }}
                      />
                      <button type="button" onClick={addLockedPage} style={{ minHeight: '32px', padding: '0 10px', borderRadius: '8px', border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: '12px', fontWeight: 600 }}>
                        Add
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setAddPageOpen(true)} style={{ minHeight: '32px', padding: '0 10px', borderRadius: '8px', border: '1px dashed #262A31', background: 'transparent', color: '#9AA1AB', fontSize: '12px' }}>
                      + Add page
                    </button>
                  )}
                </div>
              </div>
              <button type="button" disabled={busy} onClick={saveAutonomy} style={{ alignSelf: 'flex-start', minHeight: '48px', padding: '0 20px', borderRadius: '12px', border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: '15px', fontWeight: '600' }}>
                Save autonomy
              </button>
            </div>
          )}

          {isBilling && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'sfy-rise .25s ease both' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Plan and billing</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '18px', borderRadius: '16px', border: '1px solid #4DA3FF', boxShadow: '0 0 24px rgba(77,163,255,.18)' }}>
                <span style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>{billing.plan}</span>
                  <span style={{ fontSize: '14px', color: '#9AA1AB' }}>
                    {billing.sitesUsed} of {billing.siteLimit} websites in use · {billing.renewNote}
                  </span>
                </span>
                <Link href="/app/billing" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: '0 16px', borderRadius: '11px', border: '1px solid #262A31', color: '#F2F4F5', textDecoration: 'none', fontSize: '14px' }}>
                  Change plan
                </Link>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', fontSize: '15px' }}>
                <span>Payment method</span>
                <span style={{ color: '#9AA1AB' }}>
                  Managed by your payment provider ·{' '}
                  <Link href="/app/billing" style={{ color: '#4DA3FF' }}>
                    Update
                  </Link>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', color: '#7D848E', paddingBottom: '6px', borderBottom: '1px solid #1A1D22' }}>Invoices</span>
                <p style={{ margin: '14px 0 0', fontSize: '14px', color: '#9AA1AB' }}>
                  Invoices appear here after a paid cycle. Manage billing on{' '}
                  <Link href="/app/billing" style={{ color: '#4DA3FF' }}>
                    Plans
                  </Link>
                  .
                </p>
              </div>
              <a href="mailto:support@searchify.io?subject=Cancel%20subscription" style={{ alignSelf: 'flex-start', minHeight: '40px', padding: '0 12px', border: 0, background: 'transparent', color: '#9AA1AB', fontSize: '13px', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center' }}>
                Cancel subscription
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
