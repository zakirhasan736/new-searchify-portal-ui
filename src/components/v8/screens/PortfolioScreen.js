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

export default function PortfolioScreen() {
  const router = useRouter();
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
            green = 0;
            blue = assigned.filter((c) => ['approved', 'monitoring', 'applied', 'closed'].includes(c.status)).length;
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
    next.sort((a, b) => score(b) - score(a));
    return next;
  }, [base]);

  const activate = (s) => {
    if (s.siteId != null && !s.journeyId) setActiveSite(s.siteId);
    if (s.journeyId != null) selectJourneySite(s.journeyId);
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

  const grouped = useMemo(() => {
    const groupOf = (s) => {
      if (s.broken || s.red > 0) return 'need';
      if (s.yellow > 0 || s.scanning || s.moves > 0) return 'bake';
      return 'good';
    };
    const decorated = rows.map((s) => {
      const lights = s.nowArr || [s.red, s.yellow, s.green, s.blue];
      const total = lights.reduce((a, b) => a + b, 0);
      const denom = total || 1;
      const w = (n) => `${((n / denom) * 100).toFixed(2)}%`;
      const group = groupOf(s);
      const primary = group === 'need';
      const href = s.broken ? '/app/connections' : group === 'bake' ? '/app' : group === 'good' ? '/app/results' : '/app/queue';
      const cta = s.broken ? 'Reconnect' : group === 'bake' ? 'See progress' : group === 'good' ? 'View the site' : 'Fix the next one';
      const step = s.broken
        ? 'Reconnect WordPress'
        : s.red > 0
          ? `Fix the next red light on ${s.name}`
          : s.problem || 'Open the next fix';
      return {
        ...s,
        group,
        lights,
        total,
        passing: lights[2] + lights[3],
        rw: total ? w(lights[0]) : '0%',
        yw: total ? w(lights[1]) : '0%',
        gw: total ? w(lights[2]) : '0%',
        bw: total ? w(lights[3]) : '0%',
        href,
        cta,
        step,
        time: s.broken
          ? s.red > 0
            ? `About 2 minutes · unblocks ${s.red} red ${s.red === 1 ? 'fix' : 'fixes'}`
            : 'About 2 minutes · unblocks publishing'
          : s.red > 0
            ? 'A few minutes · start with the biggest red light'
            : 'A few minutes',
        nextLine: s.broken
          ? 'WordPress is disconnected, so fixes cannot publish. Reconnecting takes about 2 minutes.'
          : group === 'bake'
            ? s.blue > 0
              ? `${s.blue} published. Google is re-reading them.`
              : 'Published and live. Google is re-reading them.'
            : group === 'good'
              ? 'Doing well. We will tell you if a light turns red.'
              : s.problem || 'Open the next fix.',
        border: primary ? 'rgba(255,90,78,.3)' : '#1A1D22',
        ctaBg: primary ? 'rgba(77,163,255,.12)' : 'transparent',
        ctaBorder: primary ? 'rgba(77,163,255,.55)' : '#262A31',
        ctaColor: primary ? '#8CC4FF' : '#D7DADE',
      };
    });
    const GROUPS = [
      { id: 'need', title: 'Needs you', short: 'Do these first', explain: 'Each one takes a few minutes.', color: '#FF5A4E', soft: 'rgba(255,90,78,.14)', icon: 'M12 8v5 M12 16.5h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' },
      { id: 'bake', title: 'Fixes baking', short: 'Google is working on it', explain: 'Published and live. Nothing for you to do.', color: '#4DA3FF', soft: 'rgba(77,163,255,.14)', icon: 'M12 6v6l4 2 M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z' },
      { id: 'good', title: 'Doing well', short: 'Nothing to do', explain: 'Healthy. We will tell you if anything changes.', color: '#3DDC84', soft: 'rgba(61,220,132,.14)', icon: 'M20 6L9 17l-5-5' },
    ];
    return GROUPS.map((g) => ({ ...g, rows: decorated.filter((s) => s.group === g.id) }));
  }, [rows]);

  const nextSteps = (grouped.find((g) => g.id === 'need')?.rows || []).slice().sort((a, b) => (b.broken - a.broken) || (b.red - a.red));
  const counts = Object.fromEntries(grouped.map((g) => [g.id, g.rows.length]));
  const summary = loading
    ? ''
    : `${base.length} client ${base.length === 1 ? 'site' : 'sites'}. ${counts.need || 0} need you today, ${counts.bake || 0} ${counts.bake === 1 ? 'is' : 'are'} baking, and ${counts.good || 0} ${counts.good === 1 ? 'is' : 'are'} doing well.`;
  const nextSend = useMemo(() => {
    const d = new Date();
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const go = (s) => (e) => {
    e.preventDefault();
    activate(s);
    router.push(s.href);
  };

  return (
    <div
      style={{
        flex: '999 1 560px',
        minWidth: 0,
        minHeight: 900,
        background: '#0A0B0D',
        color: '#F2F4F5',
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: 'border-box',
        padding: '24px clamp(16px, 4vw, 56px) 56px',
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
      }}
    >
      <header style={{ maxWidth: 1060, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 16, marginRight: 'auto' }}>{agencyName}</span>
        <Link href="/app/connections" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 42, padding: '0 16px', borderRadius: 12, border: '1px solid #262A31', color: '#F2F4F5', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          Add a client site
        </Link>
        <Link href="/app/settings" aria-label="Settings" style={{ width: 40, height: 40, borderRadius: '50%', background: '#262A31', display: 'grid', placeItems: 'center', color: '#F2F4F5', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
          {avatar}
        </Link>
      </header>

      <section style={{ maxWidth: 1060, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10, animation: 'sfy-rise .4s ease both' }}>
        <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 'clamp(34px, 4.2vw, 52px)', lineHeight: 1.04, letterSpacing: '-1.5px', fontWeight: 700 }}>Your clients</h1>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: '#D7DADE', maxWidth: 720 }}>{summary}</p>
      </section>

      {loading ? (
        <div style={{ maxWidth: 1060, width: '100%', margin: '0 auto' }}>
          <SkeletonCards count={3} lines={4} />
        </div>
      ) : null}

      {!loading && base.length === 0 ? (
        <section style={{ maxWidth: 1060, width: '100%', margin: '0 auto', borderRadius: 24, background: '#101215', border: '1px solid #262A31', padding: 28, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>No client sites yet</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#D7DADE', lineHeight: 1.5 }}>Add a website and it shows up here, grouped by what needs you, what is baking, and what is already doing well.</p>
          <Link href="/app/connections" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 46, padding: '0 18px', borderRadius: 13, background: '#4DA3FF', color: '#0A0B0D', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Add a client site</Link>
        </section>
      ) : null}

      {!loading && nextSteps.length ? (
        <section aria-labelledby="next-h" style={{ maxWidth: 1060, width: '100%', margin: '0 auto', boxSizing: 'border-box', borderRadius: 24, background: '#101215', border: '1px solid #262A31', padding: 'clamp(18px, 2.4vw, 26px)', display: 'flex', flexDirection: 'column', gap: 16, animation: 'sfy-rise .4s .06s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <h2 id="next-h" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Start here: your next {nextSteps.length} {nextSteps.length === 1 ? 'step' : 'steps'}, across every client</h2>
            <span style={{ fontSize: 13, color: '#9AA1AB' }}>Most important first. Do one, then the next.</span>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nextSteps.map((n, i) => (
              <li key={`${n.domain}-step`} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 18, background: i === 0 ? 'rgba(77,163,255,.06)' : '#0D0F12', border: `1px solid ${i === 0 ? 'rgba(77,163,255,.45)' : '#1A1D22'}` }}>
                <span aria-hidden="true" style={{ width: 46, height: 46, flex: 'none', borderRadius: 14, display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.04))', border: `1.5px solid rgba(255,255,255,${i === 0 ? '.9' : '.4'})`, boxShadow: i === 0 ? '0 0 18px rgba(255,255,255,.35), 0 0 42px rgba(255,255,255,.12)' : '0 0 10px rgba(255,255,255,.12)', fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 20, fontWeight: 800, color: '#FFFFFF', textShadow: '0 0 10px rgba(255,255,255,.55)' }}>{i + 1}</span>
                <span style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9AA1AB' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.red > 0 || n.broken ? '#FF5A4E' : '#FFC53D', boxShadow: `0 0 8px ${n.red > 0 || n.broken ? '#FF5A4E' : '#FFC53D'}` }} />
                    {n.name}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35 }}>{n.step}</span>
                  <span style={{ fontSize: 13, color: '#9AA1AB' }}>{n.time}</span>
                </span>
                {i === 0 ? (
                  <a href={n.href} onClick={go(n)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '0 20px', borderRadius: 13, background: '#4DA3FF', color: '#0A0B0D', textDecoration: 'none', fontSize: 15, fontWeight: 600, boxShadow: '0 0 22px rgba(77,163,255,.4)' }}>{n.step.split(' ').slice(0, 2).join(' ')} <span aria-hidden="true">→</span></a>
                ) : (
                  <span style={{ fontSize: 13, color: '#7D848E' }}>Up next</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {!loading && base.length ? (
        <nav aria-label="Jump to a group" style={{ maxWidth: 1060, width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, animation: 'sfy-rise .4s .1s ease both' }}>
          {grouped.map((g) => (
            <a key={g.id} href={`#${g.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 18, background: '#101215', border: '1px solid #1A1D22', color: '#F2F4F5', textDecoration: 'none' }}>
              <span style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', background: g.soft }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={g.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={g.icon} /></svg>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{g.title}</span>
                <span style={{ fontSize: 12, color: '#9AA1AB' }}>{g.short}</span>
              </span>
              <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, fontWeight: 800, color: g.color }}>{g.rows.length}</span>
            </a>
          ))}
        </nav>
      ) : null}

      {!loading && base.length
        ? grouped.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} style={{ maxWidth: 1060, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10, animation: 'sfy-rise .4s .14s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '0 4px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: g.color, boxShadow: `0 0 10px ${g.color}` }} />
              <h2 id={`${g.id}-h`} style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{g.title} · {g.rows.length}</h2>
              <span style={{ fontSize: 14, color: '#9AA1AB' }}>{g.explain}</span>
            </div>
            {g.rows.map((r) => (
              <article key={`${r.domain}-${r.siteId || r.journeyId || r.name}`} className="pf-row" style={{ borderRadius: 20, background: '#101215', border: `1px solid ${r.border}`, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <span style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>{r.name}</span>
                    <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, color: '#7D848E' }}>{r.domain}</span>
                  </span>
                  <span style={{ fontSize: 14, color: '#D7DADE', lineHeight: 1.5 }}>{r.nextLine}</span>
                </span>
                <span style={{ flex: '0 1 230px', minWidth: 180, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <span role="img" aria-label={`${r.lights[0]} red, ${r.lights[1]} yellow, ${r.lights[2]} green and ${r.lights[3]} blue lights`} style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: '#1A1D22', gap: 2 }}>
                    <span style={{ width: r.rw, background: '#FF5A4E' }} />
                    <span style={{ width: r.yw, background: '#FFC53D' }} />
                    <span style={{ width: r.gw, background: '#3DDC84' }} />
                    <span style={{ width: r.bw, background: '#4DA3FF' }} />
                  </span>
                  <span style={{ fontSize: 12, color: '#9AA1AB' }}>{r.total ? <><strong style={{ color: '#F2F4F5', fontWeight: 600 }}>{r.passing}</strong> of {r.total} lights green or blue</> : 'No lights measured yet'}</span>
                </span>
                <a href={r.href} onClick={go(r)} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 170, minHeight: 46, padding: '0 18px', boxSizing: 'border-box', borderRadius: 13, background: r.ctaBg, border: `1px solid ${r.ctaBorder}`, color: r.ctaColor, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>{r.cta} <span aria-hidden="true">→</span></a>
              </article>
            ))}
          </section>
        ))
        : null}

      <div style={{ maxWidth: 1060, width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '16px 20px', borderRadius: 18, background: 'rgba(61,220,132,.06)', border: '1px solid rgba(61,220,132,.35)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6v20h12V6z" /><path d="M14 2v4h4" /><path d="M8 13h8M8 17h5" /></svg>
        <span style={{ flex: '1 1 300px', fontSize: 15, color: '#F2F4F5' }}>Client reports send themselves on the 1st of each month, under your logo. Next send: {nextSend}.</span>
        <Link href="/app/month" style={{ fontSize: 14, fontWeight: 600, color: '#3DDC84', textDecoration: 'none' }}>Preview a report →</Link>
      </div>
    </div>
  );
}
