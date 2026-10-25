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

export default function PortfolioScreen() {
  const router = useRouter();
  const [sort, setSort] = useState('attention');
  const [base, setBase] = useState([]);
  const [agencyName, setAgencyName] = useState('Your agency');
  const [avatar, setAvatar] = useState('??');
  const [loading, setLoading] = useState(true);
  const [gscOk, setGscOk] = useState(true);

  const accent = '#D5F879';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProductWorkspace({ force: true }),
      listChanges({ force: true }),
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
          (prof.ok && (prof.data?.agencyName || prof.data?.businessName || prof.data?.displayName)) ||
          (plan?.id === 'agency' ? 'Your agency' : plan?.name) ||
          'Your agency';
        setAgencyName(agency);
        setAvatar(
          initials(
            (prof.ok && (prof.data?.displayName || prof.data?.name || prof.data?.email || agency)) || agency,
          ),
        );

        let sites = ws.ok ? ws.data?.sites || [] : [];
        if (!sites.length) sites = journeySitesAsCms(journey);

        const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
        const queue = queueItemsFromChanges(changes);
        const built = buildAuditFindings({ audit, pages, queries: organic, changes });
        const counts = issueCounts(built.findings);
        const google = ws.data?.google || {};
        const googleBroken = google.status === 'error' || Boolean(google.lastError);
        const googleConnected = Boolean(google.connected) && !googleBroken && google.status !== 'disconnected';
        setGscOk(googleConnected || (!googleBroken && google.status !== 'disconnected'));

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
          const red = assigned.filter((c) => mapQueueRow(c).c === 'red').length;
          const yellow = assigned.filter((c) => mapQueueRow(c).c === 'yellow').length;
          const blue = isActive
            ? counts.notices ||
              changes.filter((c) => c.status === 'monitoring' || c.status === 'applied').length
            : assigned.filter((c) => ['approved'].includes(c.status)).length;
          const cmsBroken = site.status === 'error' || site.status === 'disconnected';
          const captured = isActive ? workspaceCaptured : 0;
          const untapped = isActive
            ? workspaceUntapped
            : Math.max(assigned.length * 40, 200);
          return {
            ...mapWorkspaceSite(site, {
              queueCount: assigned.length,
              red: isActive ? Math.max(red, counts.errors) : red,
              yellow: isActive ? Math.max(yellow, counts.warnings) : yellow,
              blue,
              captured,
              untapped,
              broken: cmsBroken,
            }),
            siteId: site.id,
            journeyId: site.journeyId || null,
            gscOk: isActive ? googleConnected || (!googleBroken && sites.length === 1) : googleConnected,
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
  }, []);

  const totals = useMemo(
    () => ({
      sites: base.length,
      moves: base.reduce((s, x) => s + x.moves, 0),
      broken: base.filter((s) => s.broken).length,
    }),
    [base],
  );

  const score = (s) => (s.broken ? 1000 : 0) + s.red * 10 + s.yellow;
  const list = base.slice();
  if (sort === 'attention') list.sort((a, b) => score(b) - score(a));
  else list.sort((a, b) => a.name.localeCompare(b.name));

  const openSite = (s) => (e) => {
    e.preventDefault();
    if (s.siteId != null && !s.journeyId) setActiveSite(s.siteId);
    if (s.journeyId != null) selectJourneySite(s.journeyId);
    router.push(s.broken ? '/app/states' : '/app');
  };

  const sites = list.map((s) => {
    const untapped = Math.max(s.untapped || 1, s.captured || 0, 1);
    const pctNum = Math.min(99, Math.round((s.captured / untapped) * 100));
    const dot = s.broken ? '#FF5A4E' : s.red > 0 ? '#FF5A4E' : s.yellow > 0 ? '#FFC53D' : '#4DA3FF';
    const siteGscOk = s.gscOk !== false && gscOk;
    return {
      name: s.name,
      domain: s.domain,
      level: String(s.level),
      href: s.broken ? '/app/states' : '/app',
      siteId: s.siteId,
      journeyId: s.journeyId,
      broken: s.broken,
      captured: s.captured.toLocaleString('en-US'),
      untapped: untapped.toLocaleString('en-US'),
      pct: `${pctNum}%`,
      red: String(s.red),
      yellow: String(s.yellow),
      blue: String(s.blue),
      dot,
      anim: s.broken || s.red >= 5 ? 'sfy-flicker 1.2s ease-in-out infinite' : 'none',
      border: s.broken ? 'rgba(255,90,78,.55)' : '#1A1D22',
      shadow: s.broken ? '0 0 26px rgba(255,90,78,.18)' : 'none',
      quality: QN[s.level - 1] || 'Fair',
      qColor: QC[s.level - 1] || QC[1],
      p1color: siteGscOk ? '#3DDC84' : '#FF5A4E',
      p1label: siteGscOk ? 'Search Console' : 'Search Console · reconnect',
      p1title: siteGscOk ? 'Search Console connected' : 'Search Console needs reconnecting',
      p2color: s.broken ? '#FF5A4E' : '#3DDC84',
      p2label: s.broken ? 'WordPress · reconnect' : 'WordPress',
      p2title: s.broken ? 'WordPress needs reconnecting' : 'WordPress connected',
      waiting: s.moves > 0 ? `${s.moves}${s.moves === 1 ? ' move waiting' : ' moves waiting'}` : 'Nothing waiting',
    };
  });

  const sorts = [
    ['attention', 'Needs attention first'],
    ['az', 'A–Z'],
  ].map((o) => ({
    label: o[1],
    on: sort === o[0],
    off: sort !== o[0],
    pick: () => setSort(o[0]),
  }));

  return (
    <div style={{ flex: '999 1 560px', minWidth: 0, minHeight: 1000, background: '#0A0B0D', color: '#F2F4F5', fontFamily: "Geist, 'Helvetica Neue', sans-serif", boxSizing: 'border-box', padding: '22px clamp(16px, 4vw, 56px) 56px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
          <span style={{ fontWeight: '600', fontSize: '17px' }}>{agencyName}</span>
        </div>
        <Link
          href="/app/settings"
          aria-label="Settings"
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#262A31', display: 'grid', placeItems: 'center', color: '#F2F4F5', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}
        >
          {avatar}
        </Link>
      </header>

      <div style={{ maxWidth: '1180px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 'clamp(36px, 4.6vw, 58px)', lineHeight: 1, letterSpacing: '-1.6px', fontWeight: '700', minWidth: 0, overflowWrap: 'break-word' }}>
            Your clients
          </h1>
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '14px', color: '#9AA1AB' }}>
            <span>
              <strong style={{ color: '#F2F4F5' }}>{loading ? '…' : totals.sites}</strong> sites
            </span>
            <span>
              <strong style={{ color: '#F2F4F5' }}>{loading ? '…' : totals.moves}</strong> moves waiting
            </span>
            {totals.broken > 0 && (
              <span style={{ color: '#FF5A4E' }}>
                <strong>{totals.broken}</strong> connection broken
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div role="group" aria-label="Sort" style={{ display: 'inline-flex', padding: '3px', borderRadius: '11px', background: '#131519', border: '1px solid #1A1D22' }}>
            {sorts.map((s, i) =>
              s.on ? (
                <button key={i} type="button" aria-pressed="true" onClick={s.pick} style={{ minHeight: '36px', padding: '0 12px', borderRadius: '8px', border: 0, background: '#262A31', color: '#F2F4F5', fontSize: '13px' }}>
                  {s.label}
                </button>
              ) : (
                <button key={i} type="button" aria-pressed="false" onClick={s.pick} style={{ minHeight: '36px', padding: '0 12px', borderRadius: '8px', border: 0, background: 'transparent', color: '#9AA1AB', fontSize: '13px' }}>
                  {s.label}
                </button>
              ),
            )}
          </div>
          <Link
            href="/app/connections"
            style={{ display: 'inline-flex', alignItems: 'center', minHeight: '46px', padding: '0 18px', borderRadius: '12px', background: '#4DA3FF', color: '#0A0B0D', textDecoration: 'none', fontSize: '14px', fontWeight: '600', boxShadow: '0 0 22px rgba(77,163,255,.4)' }}
          >
            Add a site
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1180px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <SkeletonCards count={3} lines={4} />
          </div>
        ) : null}
        {!loading && sites.length === 0 && (
          <div style={{ gridColumn: '1 / -1', borderRadius: '22px', background: '#101215', border: '1px solid #1A1D22', padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <p style={{ margin: 0, fontSize: '15px', color: '#9AA1AB' }}>No client sites yet. Connect WordPress or add a site to start.</p>
            <Link href="/app/connections" style={{ color: '#4DA3FF', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Add a site
            </Link>
          </div>
        )}
        {sites.map((s, i) => (
          <a
            key={`${s.domain}-${i}`}
            href={s.href}
            onClick={openSite(s)}
            style={{ textDecoration: 'none', color: '#F2F4F5', borderRadius: '22px', background: '#101215', border: `1px solid ${s.border}`, boxShadow: s.shadow, padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: s.dot, boxShadow: `0 0 12px ${s.dot}`, animation: s.anim }} />
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '17px', fontWeight: '600' }}>{s.name}</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', color: '#9AA1AB' }}>{s.domain}</span>
              </span>
              <span style={{ fontSize: '12px', color: s.qColor, whiteSpace: 'nowrap' }}>
                Level {s.level} · {s.quality}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9AA1AB' }}>
                <span>
                  <span style={{ color: '#F2F4F5', fontFamily: "'Geist Mono', monospace" }}>{s.captured}</span> of {s.untapped} captured
                </span>
                <span>{s.pct}</span>
              </div>
              <div style={{ height: '6px', borderRadius: '4px', background: '#1A1D22', overflow: 'hidden' }}>
                <div style={{ height: '6px', background: accent, width: s.pct }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontFamily: "'Geist Mono', monospace", fontSize: '12px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 9px', borderRadius: '7px', background: '#131519' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF5A4E' }} />
                {s.red}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 9px', borderRadius: '7px', background: '#131519' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFC53D' }} />
                {s.yellow}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 9px', borderRadius: '7px', background: '#131519' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4DA3FF' }} />
                {s.blue}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid #1A1D22', fontSize: '13px' }}>
              <span style={{ display: 'inline-flex', gap: '14px', flexWrap: 'wrap' }}>
                <span title={s.p1title} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: s.p1color }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={s.p1color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 5px ${s.p1color})` }}>
                    <path d="M9 2v6" />
                    <path d="M15 2v6" />
                    <path d="M6 8h12v3a6 6 0 0 1-12 0z" />
                    <path d="M12 17v5" />
                  </svg>
                  {s.p1label}
                </span>
                <span title={s.p2title} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: s.p2color }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={s.p2color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 5px ${s.p2color})` }}>
                    <path d="M9 2v6" />
                    <path d="M15 2v6" />
                    <path d="M6 8h12v3a6 6 0 0 1-12 0z" />
                    <path d="M12 17v5" />
                  </svg>
                  {s.p2label}
                </span>
              </span>
              <span style={{ color: '#9AA1AB' }}>{s.waiting}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
