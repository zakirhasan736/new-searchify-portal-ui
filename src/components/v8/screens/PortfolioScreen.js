'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildAuditFindings } from '@/lib/auditFindings';
import {
  clientLabelForChange,
  findingsToScanTasks,
  hostFromUrl,
  initials,
  mapQueueRow,
  mapWorkspaceSite,
  queueItemsFromChanges,
} from '@/lib/v8LiveData';
import {
  featurePayload,
  getBusinessProfile,
  getProductWorkspace,
  listChanges,
  loadFeature,
  setActiveSite,
} from '@/lib/v1Api';
import { loadJourney, planById, readySites, selectJourneySite } from '@/lib/journey';
import { SkeletonCards } from '@/components/v8/SkeletonWave';
import { activeSiteContext } from '@/lib/siteContext';
import '@/styles/v8-screens.css';
import '@/styles/v8-portfolio.css';

const QN = ['Poor', 'Fair', 'Good', 'Strong', 'Great', 'Excellent'];
const QC = ['#FF5A4E', '#FF9F43', '#FFC53D', '#3DDC84', '#2CC7C0', '#4DA3FF'];

function kpiNumber(gsc, part) {
  const kpis = gsc?.kpis || gsc?.panels?.kpis || [];
  const row = kpis.find((k) => String(k[0] || '').toLowerCase().includes(part));
  if (!row) return 0;
  return Number(String(row[1] || '').replace(/[^\d.]/g, '')) || 0;
}

function prettyName(raw, domain) {
  const s = String(raw || '').trim();
  if (s && s !== domain) return s;
  const host = String(domain || '')
    .replace(/^www\./, '')
    .split('.')[0];
  if (!host) return 'Client site';
  return host
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function siteMatchesChange(sites, site, change) {
  const domain = hostFromUrl(site.siteUrl);
  const name = site.label || domain;
  const label = clientLabelForChange(sites, change);
  if (!label && sites.length === 1) return true;
  if (!label) return hostFromUrl(change?.targetUrl) === domain;
  return label === name || label === domain || hostFromUrl(change?.targetUrl) === domain;
}

function journeySitesAsCms(journey) {
  return readySites(journey).map((s) => {
    const raw = s.answers?.site || s.site || s.url || '';
    const domain = hostFromUrl(raw);
    return {
      id: s.id,
      label: prettyName(s.answers?.business || s.answers?.name || s.label, domain),
      siteUrl: raw.includes('://') ? raw : raw ? `https://${raw}` : '',
      status: 'connected',
      journeyId: s.id,
    };
  });
}

function clientSites(journey, cmsSites) {
  const cmsByHost = new Map();
  for (const site of cmsSites) {
    const domain = hostFromUrl(site.siteUrl);
    if (domain) cmsByHost.set(domain, site);
  }
  const journeyMapped = journeySitesAsCms(journey).map((site) => {
    const linked = cmsByHost.get(hostFromUrl(site.siteUrl));
    if (!linked) return site;
    return {
      ...site,
      status: linked.status,
      cmsId: linked.id,
      label: prettyName(linked.label || site.label, hostFromUrl(linked.siteUrl || site.siteUrl)),
    };
  });
  if (journeyMapped.length) return journeyMapped;
  return cmsSites.map((site) => ({
    ...site,
    label: prettyName(site.label, hostFromUrl(site.siteUrl)),
    journeyId: null,
  }));
}

function boardSlice(counts, level, label, clicksOrRange) {
  const r = Number(counts[0]) || 0;
  const y = Number(counts[1]) || 0;
  const g = Number(counts[2]) || 0;
  const b = Number(counts[3]) || 0;
  const tot = r + y + g + b || 1;
  const w = (n) => `${((n / tot) * 100).toFixed(2)}%`;
  const lvl = Math.min(6, Math.max(1, level || 1));
  return {
    r: String(r),
    y: String(y),
    g: String(g),
    b: String(b),
    rw: w(r),
    yw: w(y),
    gw: w(g),
    bw: w(b),
    aria: `${label}: ${r} red, ${y} yellow, ${g} green and ${b} blue pages`,
    level: String(lvl),
    quality: QN[lvl - 1],
    qColor: QC[lvl - 1],
    clicks: clicksOrRange,
    range: clicksOrRange,
  };
}

/** Same goal shift as Portfolio.dc.html mock progression. */
function goalFromNow(nowArr, goalLevel) {
  const [nr, ny, ng, nb] = nowArr;
  const r = Math.max(0, Math.round(nr * 0.1));
  const y = Math.max(0, Math.round(ny * 0.45 + nr * 0.35));
  const g = Math.max(ng, Math.round(ng + nr * 0.5 + ny * 0.35));
  const b = Math.max(nb + 1, Math.round(nb + (nr + ny) * 0.25));
  return { counts: [r, y, g, b], level: goalLevel };
}

function healthLevel(red, yellow, green, blue, captured) {
  if (red >= 8 || (captured === 0 && red >= 3)) return 1;
  if (red >= 4 || yellow >= 12) return 2;
  if (red >= 1 || yellow >= 6) return 3;
  if (green >= 20 && blue >= 5) return 5;
  if (green >= 12 || blue >= 4) return 4;
  if (captured >= 700) return 4;
  return 3;
}

function PlugIcon({ color }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
      <path d="M9 2v6" />
      <path d="M15 2v6" />
      <path d="M6 8h12v3a6 6 0 0 1-12 0z" />
      <path d="M12 17v5" />
    </svg>
  );
}

export default function PortfolioScreen() {
  const router = useRouter();
  const [sort, setSort] = useState('attention');
  const [base, setBase] = useState([]);
  const [agencyName, setAgencyName] = useState('Your agency');
  const [avatar, setAvatar] = useState('??');
  const [loading, setLoading] = useState(true);
  const [sitesTick, setSitesTick] = useState(0);

  useEffect(() => {
    const onSite = () => setSitesTick((n) => n + 1);
    window.addEventListener('sf-site', onSite);
    return () => window.removeEventListener('sf-site', onSite);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProductWorkspace({ force: true }),
      listChanges({ force: true, all: true }),
      loadFeature('organic-search'),
      loadFeature('site-audit'),
      loadFeature('top-pages'),
      getBusinessProfile().catch(() => ({ ok: false })),
    ])
      .then(([ws, chRes, organic, audit, pages, prof]) => {
        if (cancelled) return;
        const journey = loadJourney();
        const plan = planById(journey.planId);
        const { hostname: activeHost } = activeSiteContext(journey);

        const agency =
          (prof.ok && (prof.data?.agencyName || prof.data?.businessName || prof.data?.agency || prof.data?.displayName)) ||
          (plan?.id === 'agency' || plan?.alias === 'premium' ? 'Your agency' : null) ||
          plan?.name ||
          'Your agency';
        setAgencyName(agency);
        setAvatar(
          initials((prof.ok && (prof.data?.displayName || prof.data?.name || prof.data?.email || agency)) || agency),
        );

        const cmsSites = ws.ok ? ws.data?.sites || [] : [];
        const sites = clientSites(journey, cmsSites);

        const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
        const queue = queueItemsFromChanges(changes);
        const built = buildAuditFindings({ audit, pages, queries: organic, changes });
        const colour = findingsToScanTasks(built.findings || [], { changes });
        const boardLens = {
          red: colour.red?.length || 0,
          yellow: colour.yellow?.length || 0,
          green: colour.green?.length || 0,
          blue: colour.blue?.length || 0,
        };

        const topFinding =
          colour.red?.[0] ||
          colour.yellow?.[0] ||
          built.findings?.find((f) => /critical|error|dire/i.test(String(f.severity || ''))) ||
          built.findings?.[0];
        const topProblem =
          topFinding?.title ||
          topFinding?.summary ||
          topFinding?.message ||
          topFinding?.why ||
          queue[0]?.opportunity ||
          queue[0]?.title ||
          'No critical issues found yet — keep scanning.';

        const google = ws.data?.google || {};
        const googleBroken = google.status === 'error' || Boolean(google.lastError);
        const googleConnected = Boolean(google.connected) && !googleBroken && google.status !== 'disconnected';

        const gsc = featurePayload(organic);
        const weeks = (gsc.weekly || gsc.panels?.weeklyClicks || []).slice(-4);
        const weekClicks = weeks.reduce((s, w) => s + (Number(w[1]) || 0), 0);
        const clicksKpi = kpiNumber(gsc, 'click');
        const impr = kpiNumber(gsc, 'impr') || weekClicks * 40;
        const workspaceCaptured = weekClicks || clicksKpi || 0;
        const workspaceUntapped = Math.max(impr, workspaceCaptured + queue.length * 25, workspaceCaptured || 1);

        const mapped = sites.map((site) => {
          const domain = hostFromUrl(site.siteUrl);
          const isActive = domain === activeHost || sites.length === 1;
          const siteQueue = queue.filter((c) => siteMatchesChange(sites, site, c));
          const assigned = siteQueue.length ? siteQueue : sites.length === 1 ? queue : [];
          const redQ = assigned.filter((c) => mapQueueRow(c).c === 'red').length;
          const yellowQ = assigned.filter((c) => mapQueueRow(c).c === 'yellow').length;

          let red;
          let yellow;
          let green;
          let blue;
          if (isActive && (boardLens.red || boardLens.yellow || boardLens.green || boardLens.blue)) {
            red = boardLens.red;
            yellow = boardLens.yellow;
            green = Math.max(boardLens.green, 0);
            blue = Math.max(boardLens.blue, 0);
          } else {
            red = redQ;
            yellow = yellowQ;
            green = Math.max(0, 8 - red - yellow);
            blue = Math.max(
              0,
              assigned.filter((c) => ['approved', 'monitoring', 'applied'].includes(c.status)).length,
            );
          }

          const cmsBroken = site.status === 'error' || site.status === 'disconnected';
          const captured = isActive ? workspaceCaptured : Math.max(0, assigned.length * 12);
          const untapped = isActive ? workspaceUntapped : Math.max(assigned.length * 40, captured + 120, 200);
          const level = healthLevel(red, yellow, green, blue, captured);
          const goalLevel = Math.min(6, level + (red > 0 ? 2 : 1));
          const problem = isActive
            ? topProblem
            : assigned[0]?.opportunity ||
              assigned[0]?.title ||
              (cmsBroken
                ? 'WordPress is disconnected, and pages may have no title Google can use.'
                : 'Waiting for a full scan on this site.');

          const lo = Math.max(captured, Math.round(captured * 1.45) || 80);
          const hi = Math.max(Math.round((untapped || captured * 3) * 0.9), Math.round(captured * 2.2) || 200);

          const row = mapWorkspaceSite(site, {
            queueCount: assigned.length,
            red,
            yellow,
            green,
            blue,
            captured,
            untapped,
            broken: cmsBroken,
            problem,
            fixes: Math.max(red + Math.ceil(yellow * 0.5), assigned.length, 1),
            goalLevel,
            goalLo: lo,
            goalHi: hi,
          });
          return {
            ...row,
            level,
            siteId: site.cmsId || site.id,
            journeyId: site.journeyId || null,
            gscOk: isActive ? googleConnected || (!googleBroken && sites.length === 1) : googleConnected,
            scanning: captured === 0 && assigned.length === 0 && !cmsBroken,
            nowArr: [red, yellow, green, blue],
          };
        });
        setBase(mapped);
      })
      .catch(() => {
        if (!cancelled) setBase([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sitesTick]);

  const totals = useMemo(
    () => ({
      sites: base.length,
      moves: base.reduce((s, x) => s + x.moves, 0),
      broken: base.filter((s) => s.broken).length,
    }),
    [base],
  );

  const score = (s) => (s.broken ? 1000 : 0) + s.red * 10 + s.yellow * 2;
  const list = useMemo(() => {
    const next = base.slice();
    if (sort === 'attention') next.sort((a, b) => score(b) - score(a));
    else next.sort((a, b) => a.name.localeCompare(b.name));
    return next;
  }, [base, sort]);

  const activate = (s) => {
    if (s.siteId != null && !s.journeyId) setActiveSite(s.siteId);
    if (s.journeyId != null) selectJourneySite(s.journeyId);
  };

  const openSite = (s) => (e) => {
    e.preventDefault();
    activate(s);
    router.push(s.broken ? '/app/connections' : '/app');
  };

  const rows = list.map((s) => {
    const nowArr = s.nowArr || [s.red, s.yellow, s.green, s.blue];
    const now = boardSlice(nowArr, s.level, 'Current', Number(s.captured || 0).toLocaleString('en-US'));
    const goalMeta = goalFromNow(nowArr, s.goalLevel);
    const goal = boardSlice(
      goalMeta.counts,
      goalMeta.level,
      'Target',
      `${Number(s.goalLo).toLocaleString('en-US')}–${Number(s.goalHi).toLocaleString('en-US')}`,
    );
    const dot = s.broken ? '#FF5A4E' : nowArr[0] > 0 ? '#FF5A4E' : nowArr[1] > 0 ? '#FFC53D' : '#3DDC84';
    const siteGscOk = s.gscOk !== false;
    return {
      ...s,
      now,
      goal,
      dot,
      anim: s.broken || nowArr[0] >= 5 ? 'sfy-flicker 1.2s ease-in-out infinite' : 'none',
      border: s.broken ? 'rgba(255,90,78,.55)' : '#1A1D22',
      shadow: s.broken ? '0 0 26px rgba(255,90,78,.18)' : 'none',
      status: s.broken
        ? 'WordPress cable unplugged — reconnect'
        : s.scanning
          ? 'First scan running'
          : 'All cables live',
      statusColor: s.broken ? '#FF5A4E' : s.scanning ? '#9AA1AB' : '#4DA3FF',
      p1color: siteGscOk ? '#3DDC84' : '#FF5A4E',
      p1label: siteGscOk ? 'Search Console' : 'Search Console · reconnect',
      p1title: siteGscOk ? 'Search Console connected' : 'Search Console needs reconnecting',
      p2color: s.broken ? '#FF5A4E' : '#3DDC84',
      p2label: s.broken ? 'WordPress · reconnect' : 'WordPress',
      p2title: s.broken ? 'WordPress needs reconnecting' : 'WordPress connected',
      waiting: s.moves > 0 ? `${s.moves}${s.moves === 1 ? ' move waiting' : ' moves waiting'}` : 'Nothing waiting',
      fixes: String(s.fixes || Math.max(s.red + s.yellow, s.moves, 1)),
      href: s.broken ? '/app/connections' : '/app',
    };
  });

  const sorts = [
    { id: 'attention', label: 'Needs attention first' },
    { id: 'az', label: 'A–Z' },
  ];

  return (
    <div
      style={{
        flex: '999 1 560px',
        minWidth: 0,
        minHeight: 2400,
        background: '#0A0B0D',
        color: '#F2F4F5',
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: 'border-box',
        padding: '22px clamp(16px, 4vw, 56px) 56px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
          <span style={{ fontWeight: 600, fontSize: 17 }}>{agencyName}</span>
        </div>
        <Link
          href="/app/settings"
          aria-label="Settings"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#262A31',
            display: 'grid',
            placeItems: 'center',
            color: '#F2F4F5',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {avatar}
        </Link>
      </header>

      <div
        style={{
          maxWidth: 1180,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: 'clamp(36px, 4.6vw, 58px)',
              lineHeight: 1,
              letterSpacing: '-1.6px',
              fontWeight: 700,
            }}
          >
            Your clients
          </h1>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14, color: '#9AA1AB' }}>
            <span>
              <strong style={{ color: '#F2F4F5' }}>{loading ? '…' : totals.sites}</strong> sites
            </span>
            <span>
              <strong style={{ color: '#F2F4F5' }}>{loading ? '…' : totals.moves}</strong> moves waiting
            </span>
            <span style={{ color: totals.broken > 0 ? '#FF5A4E' : '#9AA1AB' }}>
              <strong style={{ color: totals.broken > 0 ? '#FF5A4E' : '#F2F4F5' }}>{loading ? '…' : totals.broken}</strong>{' '}
              connection broken
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div role="group" aria-label="Sort" style={{ display: 'inline-flex', padding: 3, borderRadius: 11, background: '#131519', border: '1px solid #1A1D22' }}>
            {sorts.map((s) => {
              const on = sort === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSort(s.id)}
                  style={{
                    minHeight: 36,
                    padding: '0 12px',
                    borderRadius: 8,
                    border: 0,
                    background: on ? '#262A31' : 'transparent',
                    color: on ? '#F2F4F5' : '#9AA1AB',
                    fontSize: 13,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <Link
            href="/app/connections"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 46,
              padding: '0 18px',
              borderRadius: 12,
              background: '#4DA3FF',
              color: '#0A0B0D',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 0 22px rgba(77,163,255,.4)',
            }}
          >
            Add a site
          </Link>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1180,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
          fontSize: 12,
          color: '#9AA1AB',
          marginTop: -14,
        }}
      >
        <span style={{ fontFamily: "'Geist Mono', monospace", letterSpacing: '0.06em' }}>COLOR LEGEND</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5A4E' }} />
          Red: dire, fix first
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFC53D' }} />
          Yellow: worth doing next
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DDC84' }} />
          Green: passes
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4DA3FF' }} />
          Blue: winning, locked
        </span>
      </div>

      <div
        role="list"
        aria-label="Client sites, now and where we'd like to be"
        style={{ maxWidth: 1180, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {loading ? <SkeletonCards count={3} lines={6} /> : null}
        {!loading && rows.length === 0 ? (
          <article
            role="listitem"
            style={{
              borderRadius: 22,
              background: '#101215',
              border: '1px solid #1A1D22',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>No client sites yet</h2>
            <p style={{ margin: 0, fontSize: 15, color: '#9AA1AB', lineHeight: 1.5 }}>
              Add a WordPress site to see Current vs Where we&apos;d like to be boards, health, and waiting moves — the same
              layout as the Portfolio design.
            </p>
            <Link
              href="/app/connections"
              className="pf-go"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 44,
                padding: '0 16px',
                borderRadius: 12,
                background: '#4DA3FF',
                color: '#0A0B0D',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Add a site
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </article>
        ) : null}

        {rows.map((s) => (
          <article
            key={`${s.domain}-${s.siteId || s.journeyId || s.name}`}
            role="listitem"
            aria-label={s.name}
            style={{
              borderRadius: 22,
              background: '#101215',
              border: `1px solid ${s.border}`,
              boxShadow: s.shadow,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  flex: 'none',
                  borderRadius: '50%',
                  background: s.dot,
                  boxShadow: `0 0 12px ${s.dot}`,
                  animation: s.anim,
                }}
              />
              <span style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: '#9AA1AB' }}>{s.domain}</span>
              </span>
              <span style={{ fontSize: 12, color: s.statusColor }}>{s.status}</span>
              <Link
                href={s.href}
                className="pf-go"
                aria-label={`Begin changes for ${s.name}`}
                onClick={openSite(s)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 44,
                  padding: '0 16px',
                  borderRadius: 12,
                  background: '#4DA3FF',
                  color: '#0A0B0D',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Begin changes
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>

            <div className="pf-pair" style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
              <section
                aria-label="Current"
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  borderRadius: 16,
                  background: '#0A0B0D',
                  border: '1px solid #1A1D22',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '0.06em', color: '#9AA1AB' }}>CURRENT</span>
                <div role="img" aria-label={s.now.aria} style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: '#1A1D22', gap: 2 }}>
                  <span style={{ width: s.now.rw, background: '#FF5A4E' }} />
                  <span style={{ width: s.now.yw, background: '#FFC53D' }} />
                  <span style={{ width: s.now.gw, background: '#3DDC84' }} />
                  <span style={{ width: s.now.bw, background: '#4DA3FF' }} />
                </div>
                <div aria-hidden="true" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: "'Geist Mono', monospace", fontSize: 12 }}>
                  {[
                    ['#FF5A4E', s.now.r, 'red'],
                    ['#FFC53D', s.now.y, 'yellow'],
                    ['#3DDC84', s.now.g, 'green'],
                    ['#4DA3FF', s.now.b, 'blue'],
                  ].map(([c, n, label]) => (
                    <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 7, background: '#131519' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                      {n} {label}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 12, color: '#9AA1AB' }}>Health</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: s.now.qColor }}>
                      Level {s.now.level} · {s.now.quality}
                    </span>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 12, color: '#9AA1AB' }}>Clicks / month</span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 15, fontWeight: 500 }}>{s.now.clicks}</span>
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#D7DADE', lineHeight: 1.45, paddingTop: 10, borderTop: '1px solid #16181C' }}>
                  <span style={{ color: '#9AA1AB' }}>Top problem: </span>
                  {s.problem}
                </span>
              </section>

              <div className="pf-arrow" aria-hidden="true" style={{ flex: 'none', display: 'grid', placeItems: 'center', color: '#4DA3FF' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>

              <section
                aria-label="Where we'd like to be"
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  borderRadius: 16,
                  background: '#0A0B0D',
                  border: '1px solid rgba(77,163,255,.6)',
                  boxShadow: '0 0 26px rgba(77,163,255,.22), inset 0 0 18px rgba(77,163,255,.06)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '0.06em', color: '#4DA3FF' }}>WHERE WE&apos;D LIKE TO BE</span>
                <div role="img" aria-label={s.goal.aria} style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: '#1A1D22', gap: 2 }}>
                  <span style={{ width: s.goal.rw, background: '#FF5A4E' }} />
                  <span style={{ width: s.goal.yw, background: '#FFC53D' }} />
                  <span style={{ width: s.goal.gw, background: '#3DDC84' }} />
                  <span style={{ width: s.goal.bw, background: '#4DA3FF' }} />
                </div>
                <div aria-hidden="true" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: "'Geist Mono', monospace", fontSize: 12 }}>
                  {[
                    ['#FF5A4E', s.goal.r, 'red'],
                    ['#FFC53D', s.goal.y, 'yellow'],
                    ['#3DDC84', s.goal.g, 'green'],
                    ['#4DA3FF', s.goal.b, 'blue'],
                  ].map(([c, n, label]) => (
                    <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 7, background: '#131519' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                      {n} {label}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 12, color: '#9AA1AB' }}>Target health</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: s.goal.qColor }}>
                      Level {s.goal.level} · {s.goal.quality}
                    </span>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 12, color: '#9AA1AB', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      Clicks / month{' '}
                      <span
                        style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 5,
                          border: '1px solid #5B616B',
                          color: '#D7DADE',
                        }}
                      >
                        ESTIMATE
                      </span>
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 15, fontWeight: 500 }}>{s.goal.range}</span>
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#D7DADE', lineHeight: 1.45, paddingTop: 10, borderTop: '1px solid #16181C' }}>
                  About <strong style={{ fontWeight: 600 }}>{s.fixes} fixes</strong> to get there, one at a time, each with your OK.
                </span>
              </section>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                paddingTop: 12,
                borderTop: '1px solid #1A1D22',
                fontSize: 13,
              }}
            >
              <span style={{ display: 'inline-flex', gap: 14, flexWrap: 'wrap' }}>
                <span title={s.p1title} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: s.p1color }}>
                  <PlugIcon color={s.p1color} />
                  {s.p1label}
                </span>
                <span title={s.p2title} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: s.p2color }}>
                  <PlugIcon color={s.p2color} />
                  {s.p2label}
                </span>
              </span>
              <span style={{ color: '#9AA1AB' }}>{s.waiting}</span>
            </div>
          </article>
        ))}
      </div>

      <span style={{ maxWidth: 1180, width: '100%', margin: '0 auto', fontSize: 12, color: '#9AA1AB', lineHeight: 1.5 }}>
        Targets are estimates based on each site&apos;s Google data and results from similar fixes. They&apos;re where we&apos;d like to get to, not a promise, and results usually show about a month after each fix.
      </span>
    </div>
  );
}
