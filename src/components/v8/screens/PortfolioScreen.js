'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildAuditFindings } from '@/lib/auditFindings';
import { issueCounts } from '@/lib/monthReport';
import {
  clientLabelForChange,
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
    return {
      id: s.id,
      label: hostFromUrl(raw) || String(s.id),
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
    return linked ? { ...site, status: linked.status, cmsId: linked.id } : site;
  });
  if (journeyMapped.length) return journeyMapped;
  // Fall back to CMS-only sites when journey has none ready yet.
  return cmsSites.map((site) => ({ ...site, journeyId: null }));
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
    r,
    y,
    g,
    b,
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

function goalBoard(now) {
  const r = Math.max(0, Math.floor(now.r * 0.12));
  const y = Math.max(0, Math.floor(now.y * 0.45 + now.r * 0.25));
  const g = now.g + Math.floor(now.r * 0.45) + Math.floor(now.y * 0.4);
  const b = now.b + Math.max(1, Math.floor((now.r + now.y) * 0.25));
  return [r, y, g, b];
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

function ColorBar({ slice }) {
  return (
    <div role="img" aria-label={slice.aria} style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: '#1A1D22', gap: 2 }}>
      <span style={{ width: slice.rw, background: '#FF5A4E' }} />
      <span style={{ width: slice.yw, background: '#FFC53D' }} />
      <span style={{ width: slice.gw, background: '#3DDC84' }} />
      <span style={{ width: slice.bw, background: '#4DA3FF' }} />
    </div>
  );
}

function ColorChips({ slice }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: "'Geist Mono', monospace", fontSize: 12 }}>
      {[
        ['#FF5A4E', slice.r, 'red'],
        ['#FFC53D', slice.y, 'yellow'],
        ['#3DDC84', slice.g, 'green'],
        ['#4DA3FF', slice.b, 'blue'],
      ].map(([c, n, label]) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 7, background: '#131519' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          {n} {label}
        </span>
      ))}
    </div>
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
          (prof.ok && (prof.data?.agencyName || prof.data?.businessName || prof.data?.displayName || prof.data?.agency)) ||
          (plan?.id === 'agency' || plan?.alias === 'premium' ? 'Your agency' : plan?.name) ||
          'Your agency';
        setAgencyName(agency);
        setAvatar(
          initials(
            (prof.ok && (prof.data?.displayName || prof.data?.name || prof.data?.email || agency)) || agency,
          ),
        );

        const cmsSites = ws.ok ? ws.data?.sites || [] : [];
        const sites = clientSites(journey, cmsSites);

        const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
        const queue = queueItemsFromChanges(changes);
        const built = buildAuditFindings({ audit, pages, queries: organic, changes });
        const counts = issueCounts(built.findings);
        const topFinding =
          built.findings?.find((f) => /error|critical|dire/i.test(String(f.severity || f.level || ''))) ||
          built.findings?.[0];
        const topProblem =
          topFinding?.title ||
          topFinding?.summary ||
          topFinding?.message ||
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
        const passes =
          Number(counts.passes || counts.ok || 0) ||
          Math.max(0, (built.findings?.length || 0) - (counts.errors || 0) - (counts.warnings || 0));

        const mapped = sites.map((site) => {
          const domain = hostFromUrl(site.siteUrl);
          const isActive = domain === activeHost || sites.length === 1;
          const siteQueue = queue.filter((c) => siteMatchesChange(sites, site, c));
          const assigned = siteQueue.length ? siteQueue : sites.length === 1 ? queue : [];
          const redQ = assigned.filter((c) => mapQueueRow(c).c === 'red').length;
          const yellowQ = assigned.filter((c) => mapQueueRow(c).c === 'yellow').length;
          const red = isActive ? Math.max(redQ, counts.errors || 0) : redQ;
          const yellow = isActive ? Math.max(yellowQ, counts.warnings || 0) : yellowQ;
          const green = isActive
            ? Math.max(passes, 2)
            : Math.max(2, 10 - red - yellow);
          const blue = isActive
            ? Math.max(
                counts.notices || 0,
                changes.filter((c) => c.status === 'monitoring' || c.status === 'applied').length,
                1,
              )
            : Math.max(0, assigned.filter((c) => ['approved', 'monitoring'].includes(c.status)).length);
          const cmsBroken = site.status === 'error' || site.status === 'disconnected';
          const captured = isActive ? workspaceCaptured : Math.max(0, assigned.length * 12);
          const untapped = isActive ? workspaceUntapped : Math.max(assigned.length * 40, captured + 120, 200);
          const problem = isActive
            ? topProblem
            : assigned[0]?.opportunity ||
              assigned[0]?.title ||
              (cmsBroken ? 'WordPress is disconnected — reconnect to keep shipping fixes.' : 'Waiting for a full scan on this site.');
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
            fixes: Math.max(red + yellow, assigned.length),
          });
          return {
            ...row,
            siteId: site.id,
            journeyId: site.journeyId || null,
            gscOk: isActive ? googleConnected || (!googleBroken && sites.length === 1) : googleConnected,
            scanning: captured === 0 && assigned.length === 0 && !cmsBroken,
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
  const list = base.slice();
  if (sort === 'attention') list.sort((a, b) => score(b) - score(a));
  else list.sort((a, b) => a.name.localeCompare(b.name));

  const openSite = (s) => (e) => {
    e.preventDefault();
    if (s.siteId != null && !s.journeyId) setActiveSite(s.siteId);
    if (s.journeyId != null) selectJourneySite(s.journeyId);
    router.push(s.broken ? '/app/connections' : '/app');
  };

  const rows = list.map((s) => {
    const nowCounts = [s.red, s.yellow, s.green, s.blue];
    const now = boardSlice(nowCounts, s.level, 'Current', s.captured.toLocaleString('en-US'));
    const goalCounts = goalBoard({ r: s.red, y: s.yellow, g: s.green, b: s.blue });
    const goal = boardSlice(
      goalCounts,
      s.goalLevel,
      'Target',
      `${Number(s.goalLo).toLocaleString('en-US')}–${Number(s.goalHi).toLocaleString('en-US')}`,
    );
    const dot = s.broken ? '#FF5A4E' : s.red > 0 ? '#FF5A4E' : s.yellow > 0 ? '#FFC53D' : '#3DDC84';
    const siteGscOk = s.gscOk !== false;
    return {
      ...s,
      now,
      goal,
      dot,
      anim: s.broken || s.red >= 5 ? 'sfy-flicker 1.2s ease-in-out infinite' : 'none',
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
      waiting: s.moves > 0 ? `${s.moves} ${s.moves === 1 ? 'move' : 'moves'} waiting` : 'Nothing waiting',
      fixes: String(s.fixes || Math.max(s.red + s.yellow, s.moves)),
    };
  });

  const sorts = [
    ['attention', 'Needs attention first'],
    ['az', 'A–Z'],
  ];

  return (
    <div style={{ flex: '999 1 560px', minWidth: 0, minHeight: 1000, background: '#0A0B0D', color: '#F2F4F5', fontFamily: "Geist, 'Helvetica Neue', sans-serif", boxSizing: 'border-box', padding: '22px clamp(16px, 4vw, 56px) 56px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
          <span style={{ fontWeight: 600, fontSize: 17 }}>{agencyName}</span>
        </div>
        <Link
          href="/app/settings"
          aria-label="Settings"
          style={{ width: 40, height: 40, borderRadius: '50%', background: '#262A31', display: 'grid', placeItems: 'center', color: '#F2F4F5', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
        >
          {avatar}
        </Link>
      </header>

      <div style={{ maxWidth: 1180, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 'clamp(36px, 4.6vw, 58px)', lineHeight: 1, letterSpacing: '-1.6px', fontWeight: 700, minWidth: 0, overflowWrap: 'break-word' }}>
            Your clients
          </h1>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14, color: '#9AA1AB' }}>
            <span>
              <strong style={{ color: '#F2F4F5' }}>{loading ? '…' : totals.sites}</strong> sites
            </span>
            <span>
              <strong style={{ color: '#F2F4F5' }}>{loading ? '…' : totals.moves}</strong> moves waiting
            </span>
            {totals.broken > 0 ? (
              <span style={{ color: '#FF5A4E' }}>
                <strong>{totals.broken}</strong> connection broken
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div role="group" aria-label="Sort" style={{ display: 'inline-flex', padding: 3, borderRadius: 11, background: '#131519', border: '1px solid #1A1D22' }}>
            {sorts.map(([id, label]) => {
              const on = sort === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSort(id)}
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
                  {label}
                </button>
              );
            })}
          </div>
          <Link
            href="/app/connections"
            style={{ display: 'inline-flex', alignItems: 'center', minHeight: 46, padding: '0 18px', borderRadius: 12, background: '#4DA3FF', color: '#0A0B0D', textDecoration: 'none', fontSize: 14, fontWeight: 600, boxShadow: '0 0 22px rgba(77,163,255,.4)' }}
          >
            Add a site
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1180, width: '100%', margin: '0 auto', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: '#9AA1AB', marginTop: -14 }}>
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

      <div role="list" aria-label="Client sites, now and where we'd like to be" style={{ maxWidth: 1180, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? <SkeletonCards count={3} lines={5} /> : null}
        {!loading && rows.length === 0 ? (
          <div style={{ borderRadius: 22, background: '#101215', border: '1px solid #1A1D22', padding: 28, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            <p style={{ margin: 0, fontSize: 15, color: '#9AA1AB' }}>No client sites yet. Connect WordPress or add a site to start.</p>
            <Link href="/app/connections" style={{ color: '#4DA3FF', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Add a site
            </Link>
          </div>
        ) : null}

        {rows.map((s) => (
          <article
            key={`${s.domain}-${s.siteId || s.journeyId || s.name}`}
            role="listitem"
            aria-label={s.name}
            style={{ borderRadius: 22, background: '#101215', border: `1px solid ${s.border}`, boxShadow: s.shadow, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className="v8-pf-dot" style={{ width: 12, height: 12, flex: 'none', borderRadius: '50%', background: s.dot, boxShadow: `0 0 12px ${s.dot}`, animation: s.anim }} />
              <span style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: '#9AA1AB' }}>{s.domain}</span>
              </span>
              <span style={{ fontSize: 12, color: s.statusColor }}>{s.status}</span>
              <button
                type="button"
                className="v8-pf-go"
                aria-label={`Begin changes for ${s.name}`}
                onClick={openSite(s)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 16px', borderRadius: 12, border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Begin changes
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>

            <div className="v8-pf-pair">
              <section aria-label="Current" style={{ flex: '1 1 0', minWidth: 0, borderRadius: 16, background: '#0A0B0D', border: '1px solid #1A1D22', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '0.06em', color: '#9AA1AB' }}>CURRENT</span>
                <ColorBar slice={s.now} />
                <ColorChips slice={s.now} />
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

              <div className="v8-pf-arrow" aria-hidden="true">
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
                <ColorBar slice={s.goal} />
                <ColorChips slice={s.goal} />
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
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, padding: '1px 6px', borderRadius: 5, border: '1px solid #5B616B', color: '#D7DADE' }}>ESTIMATE</span>
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 15, fontWeight: 500 }}>{s.goal.range}</span>
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#D7DADE', lineHeight: 1.45, paddingTop: 10, borderTop: '1px solid #16181C' }}>
                  About <strong style={{ fontWeight: 600 }}>{s.fixes} fixes</strong> to get there, one at a time, each with your OK.
                </span>
              </section>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #1A1D22', fontSize: 13 }}>
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
