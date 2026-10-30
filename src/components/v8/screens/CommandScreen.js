'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SkeletonCards } from '@/components/v8/SkeletonWave';
import {
  clientLabelForChange,
  hostFromUrl,
  mapQueueRow,
  planDisplayName,
  queueItemsFromChanges,
  weeklyBuckets,
} from '@/lib/v8LiveData';
import {
  ackOpsNotice,
  approveChange,
  dismissChange,
  featurePayload,
  getBusinessProfile,
  getOps,
  getProductWorkspace,
  listChanges,
  loadFeature,
  retryOps,
  runReportDefinition,
} from '@/lib/v1Api';
import { loadJourney, planById } from '@/lib/journey';
import { activeSiteContext } from '@/lib/siteContext';
import '@/styles/v8-screens.css';

const COLORS = { red: '#FF5A4E', yellow: '#FFC53D' };
const RGB = { all: '154,161,171', red: '255,90,78', yellow: '255,197,61' };
const QN = ['Poor', 'Fair', 'Good', 'Strong', 'Great', 'Excellent'];
const QC = ['#FF5A4E', '#FF9F43', '#FFC53D', '#3DDC84', '#2CC7C0', '#4DA3FF'];

function sparkPath(clicks) {
  if (!clicks?.length) return 'M4 16 L116 16';
  const lo = Math.min(...clicks);
  const hi = Math.max(...clicks);
  const span = (hi - lo) || 1;
  return clicks
    .map((v, i) => `${i ? 'L' : 'M'}${4 + i * 16} ${(28 - ((v - lo) / span) * 24).toFixed(1)}`)
    .join(' ');
}

function trendFromClicks(clicks, halves) {
  if (halves && (halves.before || halves.after)) {
    const pct = halves.before ? Math.round((halves.after / halves.before - 1) * 100) : 100;
    return { pct, trend: `${pct >= 0 ? '+' : ''}${pct}%`, trendColor: pct >= 0 ? '#3DDC84' : '#FF5A4E' };
  }
  if (halves) return { trend: '—', trendColor: '#7D848E', pct: null };
  if (!clicks?.length || clicks.length < 2) return { trend: '—', trendColor: '#7D848E', pct: null };
  const first = clicks[0] || 0;
  const last = clicks[clicks.length - 1] || 0;
  if (!first && !last) return { trend: '—', trendColor: '#7D848E', pct: null };
  const pct = first ? Math.round((last / first - 1) * 100) : last > 0 ? 100 : 0;
  return {
    pct,
    trend: `${pct >= 0 ? '+' : ''}${pct}%`,
    trendColor: pct >= 0 ? '#3DDC84' : '#FF5A4E',
  };
}

/** Clicks in the last 14 days vs the 14 before (complete days only), from the daily GSC rows. */
function halfTrend(daily) {
  if (!Array.isArray(daily) || daily.length < 8) return null;
  const rows = [...daily].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const half = Math.floor(rows.length / 2);
  const sum = (list) => list.reduce((n, r) => n + (Number(r[1]) || 0), 0);
  return { before: sum(rows.slice(0, half)), after: sum(rows.slice(rows.length - half)) };
}

function ago(iso) {
  const t = new Date(iso || '').getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function noticeHref(kind) {
  if (kind === 'publish') return '/app/history';
  if (kind === 'sync') return '/app/states';
  return '/app/connect';
}

function noticeCta(kind, title) {
  const t = String(title || '').toLowerCase();
  if (kind === 'publish' || t.includes('wordpress') || t.includes('unplug')) return 'Reconnect';
  if (kind === 'sync') return 'Retry sync';
  if (t.includes('scan')) return 'Review';
  return 'Review';
}

function formatDue(isoOrSchedule) {
  if (!isoOrSchedule) return 'Monthly report';
  const d = new Date(isoOrSchedule);
  if (!Number.isNaN(d.getTime())) {
    return `Due ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
  }
  const s = String(isoOrSchedule);
  if (s === 'weekly') return 'Weekly report · due this week';
  if (s === 'monthly') return 'Monthly report · due this week';
  return s;
}

function reportDueThisWeek(row) {
  const sched = String(row.schedule || 'monthly').toLowerCase();
  if (sched === 'weekly' || sched === 'daily') return true;
  if (!row.lastRunAt) return true;
  const last = new Date(row.lastRunAt).getTime();
  if (Number.isNaN(last)) return true;
  const weekAgo = Date.now() - 7 * 864e5;
  return last < weekAgo;
}

export default function CommandScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = (searchParams.get('q') || '').trim().toLowerCase();

  const [status, setStatus] = useState({});
  const [filter, setFilter] = useState('all');
  const [fixed, setFixed] = useState({});
  const [sent, setSent] = useState({});
  const [Q, setQ] = useState([]);
  const [A, setA] = useState([]);
  const [C, setC] = useState([]);
  const [reports, setReports] = useState([]);
  const [subline, setSubline] = useState('Workspace');
  const [brokenSites, setBrokenSites] = useState([]);
  const [gscOk, setGscOk] = useState(true);
  const [retry, setRetry] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProductWorkspace({ force: true }),
      listChanges({ force: true }),
      getOps(),
      loadFeature('organic-search'),
      loadFeature('backlinks'),
      getBusinessProfile().catch(() => ({ ok: false })),
    ])
      .then(([ws, chRes, opsRes, organic, backlinks, prof]) => {
        if (cancelled) return;
        const journey = loadJourney();
        const plan = planById(journey.planId);
        const { hostname: activeHost } = activeSiteContext(journey);
        const sites = ws.ok ? ws.data?.sites || [] : [];
        const agencyClients = ws.ok ? ws.data?.clients || [] : [];
        const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
        const queue = queueItemsFromChanges(changes);
        const mappedQueue = queue.map((c) =>
          mapQueueRow(c, clientLabelForChange(sites, c) || sites[0]?.label || agencyClients[0]?.name || 'Your site'),
        );
        setQ(mappedQueue);

        const notices = (opsRes.ok ? opsRes.data?.notices : null) || ws.data?.notices || [];
        const googleNow = ws.data?.google || {};
        const googleHealthy =
          (opsRes.ok ? opsRes.data?.googleStatus : googleNow.status) === 'connected' &&
          !(opsRes.ok ? opsRes.data?.googleError : googleNow.lastError);
        const lastSync = new Date(googleNow.lastSyncAt || 0).getTime();
        // One row per problem (older versions stacked the same "sync failed" every run), and a
        // sync failure that a later successful sync already fixed is not shown.
        const grouped = new Map();
        for (const n of notices) {
          if (n.status && n.status !== 'open') continue;
          if ((n.kind === 'sync' || n.kind === 'retry') && googleHealthy && new Date(n.createdAt || 0).getTime() <= (lastSync || Date.now())) continue;
          const key = `${n.kind}|${String(n.detail || n.title || '').slice(0, 200)}`;
          const prev = grouped.get(key);
          if (prev) {
            prev.count += 1;
            prev.ids.push(n.id);
          } else grouped.set(key, { ...n, count: 1, ids: [n.id] });
        }
        const openNotices = [...grouped.values()];
        setA(
          openNotices.slice(0, 8).map((n, i) => {
            const kind = n.kind || '';
            const blocking = kind === 'publish' || n.severity === 'error' || kind === 'sync';
            return {
              id: String(n.id || `n${i}`),
              noticeId: n.id,
              kind,
              noticeIds: n.ids,
              client: `${n.title?.split('·')[0]?.trim() || sites[0]?.label || 'Workspace'}${n.count > 1 ? ` ×${n.count}` : ''}`,
              text: `${n.detail || n.title || 'Needs attention'}${n.createdAt ? ` · last seen ${ago(n.createdAt)}` : ''}`,
              cta: noticeCta(kind, n.title),
              doneLabel: kind === 'publish' || kind === 'sync' ? 'Reconnected' : 'Reviewed',
              color: blocking ? '#FF5A4E' : kind === 'scan' ? '#4DA3FF' : '#FFC53D',
              blocking,
              href: noticeHref(kind),
            };
          }),
        );

        const organicPayload = featurePayload(organic);
        const halves = halfTrend(organicPayload.daily);
        const weeks = weeklyBuckets(organicPayload);
        // Weeks counted back from the last complete day, so a half-finished week doesn't look like a drop.
        const dailyRows = Array.isArray(organicPayload.daily)
          ? [...organicPayload.daily].sort((a, b) => String(a[0]).localeCompare(String(b[0])))
          : [];
        const clickSeries = dailyRows.length >= 14
          ? Array.from({ length: Math.floor(dailyRows.length / 7) }, (_, i) =>
              dailyRows
                .slice(dailyRows.length - (Math.floor(dailyRows.length / 7) - i) * 7, dailyRows.length - (Math.floor(dailyRows.length / 7) - i - 1) * 7)
                .reduce((n, r) => n + (Number(r[1]) || 0), 0),
            ).slice(-8)
          : weeks.slice(-8).map((w) => Number(w[1]) || 0);
        const bl = featurePayload(backlinks);
        const linkRows = Array.isArray(bl.rows) ? bl.rows : Array.isArray(bl.domains) ? bl.domains : [];
        const linkCount = linkRows.length || Number(bl.kpis?.[0]?.[1]) || 0;
        const google = ws.data?.google || {};
        const googleBroken = google.status === 'error' || Boolean(google.lastError);
        setGscOk(!(googleBroken || google.status === 'disconnected' || google.connected === false));

        const broken = sites.filter((s) => s.status === 'error' || s.status === 'disconnected');
        setBrokenSites(broken);

        const redByClient = {};
        for (const row of mappedQueue) {
          if (row.c === 'red') redByClient[row.client] = (redByClient[row.client] || 0) + 1;
        }
        const totalRed = mappedQueue.filter((r) => r.c === 'red').length;

        let clientRows =
          agencyClients.length > 0
            ? agencyClients.map((cl) => {
                const linked = sites.filter((s) => (cl.siteIds || []).includes(s.id));
                const primary = linked[0] || sites[0];
                const domain = hostFromUrl(primary?.siteUrl) || '—';
                const name = cl.name || domain;
                const siteLabels = new Set(
                  linked.map((s) => s.label || hostFromUrl(s.siteUrl)).filter(Boolean),
                );
                siteLabels.add(name);
                const red = [...siteLabels].reduce((n, lab) => n + (redByClient[lab] || 0), 0);
                const siteBroken = linked.some((s) => s.status === 'error' || s.status === 'disconnected');
                const isActive = primary && hostFromUrl(primary.siteUrl) === activeHost;
                return {
                  id: `c${cl.id}`,
                  name,
                  aliases: [...siteLabels],
                  domain,
                  level: Math.min(6, Math.max(1, 2 + (mappedQueue.length > 0 ? 1 : 0))),
                  red,
                  clicks: isActive && clickSeries.length >= 2 ? clickSeries : [],
                  halves: isActive ? halves : null,
                  broken: siteBroken,
                  links: isActive ? linkCount : 0,
                  ld: 0,
                };
              })
            : sites.map((site) => {
                const name = site.label || hostFromUrl(site.siteUrl) || 'Site';
                const domain = hostFromUrl(site.siteUrl) || '—';
                const isActive = hostFromUrl(site.siteUrl) === activeHost || sites.length === 1;
                return {
                  id: `s${site.id}`,
                  name,
                  aliases: [name, domain],
                  domain,
                  level: Math.min(6, Math.max(1, 2 + (isActive && clickSeries.length ? 1 : 0))),
                  red: redByClient[name] || (sites.length === 1 ? totalRed : 0),
                  clicks: isActive && clickSeries.length >= 2 ? clickSeries : [],
                  halves: isActive ? halves : null,
                  broken: site.status === 'error' || site.status === 'disconnected',
                  links: isActive ? linkCount : 0,
                  ld: 0,
                };
              });

        if (!clientRows.length) {
          clientRows = [
            {
              id: 'workspace',
              name: activeHost || 'Your site',
              aliases: [activeHost || 'Your site'],
              domain: activeHost || '—',
              level: 2,
              red: totalRed,
              clicks: clickSeries.length >= 2 ? clickSeries : [],
              halves,
              broken: googleBroken,
              links: linkCount,
              ld: 0,
            },
          ];
        }
        setC(clientRows);

        const repRows = (ws.data?.reports || []).filter(reportDueThisWeek);
        setReports(
          repRows.slice(0, 8).map((r, i) => ({
            id: String(r.id || `r${i}`),
            reportId: r.id,
            client: r.name || 'Report',
            when: r.lastRunAt
              ? `Last run · ${formatDue(r.lastRunAt)}`
              : formatDue(r.schedule || 'monthly'),
          })),
        );

        const agency =
          (prof.ok && (prof.data?.agencyName || prof.data?.businessName)) ||
          (plan?.id === 'agency' ? 'Your agency' : null) ||
          'Workspace';
        const planName = plan?.name || planDisplayName(journey.planId) || 'Starter';
        const n = Math.max(clientRows.length, sites.length);
        setSubline(`${agency} · ${n} client site${n === 1 ? '' : 's'} · ${planName}`);
      })
      .catch(() => {
        if (!cancelled) setSubline('Workspace');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (id, v) => setStatus((prev) => ({ ...prev, [id]: v }));

  const qFiltered = useMemo(() => {
    if (!qParam) return Q;
    return Q.filter(
      (q) =>
        String(q.what || '').toLowerCase().includes(qParam) ||
        String(q.page || '').toLowerCase().includes(qParam) ||
        String(q.client || '').toLowerCase().includes(qParam),
    );
  }, [Q, qParam]);

  const shown = qFiltered.filter((q) => filter === 'all' || q.c === filter);
  const open = qFiltered.filter((q) => !status[q.id]);
  const lowOpen = open.filter((q) => q.low);

  const queue = shown.map((q) => {
    const s = status[q.id];
    return {
      id: q.id,
      client: q.client,
      page: q.page,
      what: q.what,
      gain: q.gain,
      changeId: q.changeId,
      color: COLORS[q.c] || COLORS.yellow,
      lowRisk: q.low && !s,
      open: !s,
      done: !!s,
      doneLabel: s === 'approved' ? 'Approved · ships tonight' : 'Skipped for now',
      doneColor: s === 'approved' ? '#3DDC84' : '#9AA1AB',
      bg: s === 'approved' ? 'rgba(61,220,132,.06)' : '#0A0B0D',
      border: s === 'approved' ? 'rgba(61,220,132,.35)' : '#1A1D22',
      approve: () => {
        set(q.id, 'approved');
        if (q.changeId) approveChange(q.changeId).catch(() => {});
      },
      skip: () => {
        set(q.id, 'skipped');
        if (q.changeId) dismissChange(q.changeId).catch(() => {});
      },
      undo: () => set(q.id, undefined),
    };
  });

  const filters = [
    ['all', 'All', '#9AA1AB'],
    ['red', 'Dire', '#FF5A4E'],
    ['yellow', 'Medium', '#FFC53D'],
  ].map((x) => ({
    label: `${x[1]} ${qFiltered.filter((q) => (x[0] === 'all' || q.c === x[0]) && !status[q.id]).length}`,
    color: x[2],
    tint: `rgba(${RGB[x[0]]},.14)`,
    glow: `rgba(${RGB[x[0]]},.4)`,
    on: filter === x[0],
    off: filter !== x[0],
    pick: () => setFilter(x[0]),
  }));

  const alerts = A.map((a) => ({
    id: a.id,
    client: a.client,
    text: retry[a.id]?.error ? `Retry failed: ${retry[a.id].error}` : a.text,
    cta: retry[a.id]?.busy ? 'Retrying…' : retry[a.id]?.error ? 'Fix in Connections' : a.cta,
    doneLabel: a.kind === 'sync' ? 'Synced' : a.doneLabel,
    color: fixed[a.id] ? '#3DDC84' : a.color,
    border: fixed[a.id] ? 'rgba(61,220,132,.35)' : a.blocking ? 'rgba(255,90,78,.45)' : '#1A1D22',
    anim: a.blocking && !fixed[a.id] ? 'sfy-flicker 1.2s ease-in-out infinite' : 'none',
    open: !fixed[a.id],
    done: !!fixed[a.id],
    act: async () => {
      if (a.kind === 'sync') {
        // Actually re-run the Google sync instead of only hiding the notice.
        if (retry[a.id]?.busy) return;
        if (retry[a.id]?.error) {
          router.push('/app/connections/google');
          return;
        }
        setRetry((prev) => ({ ...prev, [a.id]: { busy: true } }));
        const res = await retryOps().catch(() => ({ ok: false }));
        if (res.ok) {
          setRetry((prev) => ({ ...prev, [a.id]: {} }));
          setGscOk(true);
          setFixed((prev) => {
            const next = { ...prev };
            A.filter((x) => x.kind === 'sync').forEach((x) => {
              next[x.id] = true;
            });
            return next;
          });
        } else {
          const detail = res.data?.detail;
          const message = typeof detail === 'string' ? detail : detail?.message || res.data?.problem?.message || 'Google sync still fails.';
          setRetry((prev) => ({ ...prev, [a.id]: { error: message.slice(0, 260) } }));
        }
        return;
      }
      setFixed((prev) => ({ ...prev, [a.id]: true }));
      (a.noticeIds || [a.noticeId]).filter(Boolean).forEach((id) => ackOpsNotice(id, 'acked').catch(() => {}));
      if (a.href) router.push(a.href);
    },
  }));

  const reportRows = reports.map((r) => ({
    id: r.id,
    client: r.client,
    when: r.when,
    open: !sent[r.id],
    sent: !!sent[r.id],
    send: () => {
      setSent((prev) => ({ ...prev, [r.id]: true }));
      if (r.reportId) runReportDefinition(r.reportId).catch(() => {});
    },
  }));

  const clients = C.map((c) => {
    const { trend, trendColor } = trendFromClicks(c.clicks, c.halves);
    const aliases = new Set([c.name, ...(c.aliases || [])]);
    const waiting = Q.filter((q) => aliases.has(q.client) && !status[q.id]).length;
    const resolved =
      fixed[c.id] ||
      Object.keys(fixed).some((k) => fixed[k] && A.find((a) => a.id === k && (a.client === c.name || aliases.has(a.client))));
    const wpBroken = c.broken && !resolved;
    const gscColor = gscOk ? '#3DDC84' : '#FF5A4E';
    return {
      name: c.name,
      domain: c.domain,
      level: String(c.level),
      quality: QN[c.level - 1] || 'Fair',
      qColor: QC[c.level - 1] || QC[1],
      spark: sparkPath(c.clicks.length ? c.clicks : [0, 0, 0, 0, 0, 0, 0, 0]),
      trend,
      trendColor,
      waiting: waiting ? `${waiting}${waiting === 1 ? ' move' : ' moves'}` : '—',
      red: c.red ? `${c.red} dire` : 'none',
      redColor: c.red ? '#FF5A4E' : '#7D848E',
      gscColor,
      wpColor: wpBroken ? '#FF5A4E' : '#3DDC84',
      links: String(c.links || 0),
      linkDelta: c.ld > 0 ? `+${c.ld} this month` : c.ld < 0 ? `${c.ld} this month` : 'no change',
      linkColor: c.ld > 0 ? '#3DDC84' : c.ld < 0 ? '#FF8A80' : '#7D848E',
    };
  });

  const improving = clients.filter((c) => c.trend.startsWith('+')).length;
  const liveBroken = brokenSites.filter((s) => {
    const label = s.label || hostFromUrl(s.siteUrl);
    return !Object.keys(fixed).some((k) => fixed[k] && A.find((a) => a.id === k && (a.client === label || a.kind === 'publish' || a.kind === 'sync')));
  });
  const brokenCount = liveBroken.length + (gscOk ? 0 : brokenSites.length ? 0 : 1);
  const brokenSub = (() => {
    if (!brokenCount) return 'All cables live';
    if (liveBroken[0]) return `${liveBroken[0].label || hostFromUrl(liveBroken[0].siteUrl)} · WordPress`;
    if (!gscOk) return 'Search Console · needs reconnect';
    return 'Connection issue';
  })();
  const approvedN = Q.filter((q) => status[q.id] === 'approved').length;
  const reportsOpen = reportRows.filter((r) => r.open).length;

  const stats = [
    {
      label: 'Moves waiting',
      value: String(open.length),
      sub: approvedN
        ? `${approvedN} approved today`
        : `across ${new Set(open.map((q) => q.client)).size || 0} clients`,
      color: '#4DA3FF',
      border: '#1A1D22',
    },
    {
      label: 'Broken connections',
      value: String(brokenCount),
      sub: brokenSub,
      color: brokenCount ? '#FF5A4E' : '#3DDC84',
      border: brokenCount ? 'rgba(255,90,78,.45)' : '#1A1D22',
    },
    {
      label: 'Reports due this week',
      value: String(reportsOpen),
      sub: reportsOpen ? 'Ready to send' : 'None scheduled',
      color: '#FFC53D',
      border: '#1A1D22',
    },
    {
      label: 'Clients improving',
      value: clients.length ? `${improving} of ${clients.length}` : '0 of 0',
      sub: 'clicks up over 30 days',
      color: '#3DDC84',
      border: '#1A1D22',
    },
  ];

  const headline = loading
    ? 'Loading your client queue…'
    : open.length
      ? `${open.length} moves waiting across your clients.`
      : 'Everything is approved. Nice work.';

  const approveLowRisk = () => {
    const s = { ...status };
    lowOpen.forEach((q) => {
      s[q.id] = 'approved';
      if (q.changeId) approveChange(q.changeId).catch(() => {});
    });
    setStatus(s);
  };

  return (
    <div style={{ flex: '999 1 560px', minWidth: 0, minHeight: 1100, background: '#0A0B0D', color: '#F2F4F5', fontFamily: "Geist, 'Helvetica Neue', sans-serif", boxSizing: 'border-box', padding: '28px clamp(16px, 4vw, 48px) 56px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: '15px', fontWeight: '800', letterSpacing: '1.6px' }}>AGENCY COMMAND CENTRE</span>
          <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 'clamp(30px, 3.6vw, 44px)', lineHeight: '1.04', letterSpacing: '-1.2px', fontWeight: '700', minWidth: 0, overflowWrap: 'break-word' }}>{headline}</h1>
          <span style={{ fontSize: '15px', color: '#9AA1AB' }}>
            {subline}
            {qParam ? ` · filter “${searchParams.get('q')}”` : ''}
          </span>
        </div>
        {lowOpen.length > 0 && (
          <button type="button" onClick={approveLowRisk} style={{ minHeight: '52px', padding: '0 22px', borderRadius: '14px', border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: '15px', fontWeight: '600', boxShadow: '0 0 22px rgba(77,163,255,.45)' }}>
            Approve all low-risk ({lowOpen.length})
          </button>
        )}
      </header>

      <section aria-label="This week" style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {loading ? <div style={{ gridColumn: '1 / -1' }}><SkeletonCards count={4} lines={2} /></div> : stats.map((s, i) => (
          <div key={i} style={{ borderRadius: '18px', padding: '18px', background: '#101215', border: `1px solid ${s.border}`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9AA1AB' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              {s.label}
            </span>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: '34px', fontWeight: '800', letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: '13px', color: '#7D848E' }}>{s.sub}</span>
          </div>
        ))}
      </section>

      <div style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        <section aria-labelledby="queue-h" style={{ flex: '2 1 520px', minWidth: 0, borderRadius: '22px', background: '#101215', border: '1px solid #1A1D22', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <h2 id="queue-h" style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>Waiting for your approval</h2>
            <div role="group" aria-label="Filter" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {filters.map((f, i) =>
                f.on ? (
                  <button key={i} type="button" aria-pressed="true" onClick={f.pick} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '34px', padding: '0 12px', borderRadius: '999px', border: `1px solid ${f.color}`, background: f.tint, color: '#F2F4F5', fontSize: '13px', fontWeight: '600', boxShadow: `0 0 14px ${f.glow}` }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.color }} />
                    {f.label}
                  </button>
                ) : (
                  <button key={i} type="button" aria-pressed="false" onClick={f.pick} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '34px', padding: '0 12px', borderRadius: '999px', border: '1px solid #262A31', background: 'transparent', color: '#D7DADE', fontSize: '13px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.color }} />
                    {f.label}
                  </button>
                ),
              )}
            </div>
          </div>
          {!loading && queue.length === 0 && (
            <p style={{ margin: '8px 0', fontSize: '14px', color: '#9AA1AB' }}>
              {qParam ? 'No moves match that search.' : 'Nothing waiting — propose from Search Console or run a site scan.'}
            </p>
          )}
          {queue.map((q) => (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px 14px', borderRadius: '14px', background: q.bg, border: `1px solid ${q.border}`, transition: 'background .3s ease, border-color .3s ease' }}>
              <span style={{ width: '10px', height: '10px', flex: 'none', borderRadius: '50%', background: q.color, boxShadow: `0 0 8px ${q.color}` }} />
              <span style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', color: '#9AA1AB' }}>
                  {q.client}
                  <span style={{ color: '#3A404A' }}> · </span>
                  <span style={{ fontFamily: "'Geist Mono', monospace" }}>{q.page}</span>
                </span>
                <span style={{ fontSize: '15px', fontWeight: '500' }}>{q.what}</span>
              </span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#D5F879', whiteSpace: 'nowrap' }}>{q.gain}</span>
              {q.lowRisk && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', padding: '3px 7px', borderRadius: '6px', border: '1px solid #262A31', color: '#9AA1AB' }}>LOW RISK</span>}
              {q.open && (
                <span style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={q.skip} style={{ minHeight: '38px', padding: '0 14px', borderRadius: '11px', border: '1px solid #262A31', background: 'transparent', color: '#F2F4F5', fontSize: '13px' }}>Skip</button>
                  <button type="button" onClick={q.approve} style={{ minHeight: '38px', padding: '0 16px', borderRadius: '11px', border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: '13px', fontWeight: '600', boxShadow: '0 0 14px rgba(77,163,255,.4)' }}>Approve</button>
                </span>
              )}
              {q.done && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: q.doneColor }}>{q.doneLabel}</span>
                  <button type="button" onClick={q.undo} style={{ minHeight: '34px', padding: '0 12px', borderRadius: '10px', border: '1px solid #262A31', background: 'transparent', color: '#9AA1AB', fontSize: '12px' }}>Undo</button>
                </span>
              )}
            </div>
          ))}
          <span style={{ fontSize: '12px', color: '#7D848E' }}>Approved moves ship tonight, are checked live, and land in each client&apos;s change log and monthly report.</span>
        </section>

        <aside style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section aria-labelledby="att-h" style={{ borderRadius: '22px', background: '#101215', border: '1px solid #1A1D22', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 id="att-h" style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>Needs attention</h2>
            {!loading && alerts.length === 0 && (
              <div style={{ fontSize: '14px', color: '#9AA1AB', textAlign: 'center', padding: '20px' }}>All clear · no urgent alerts</div>
            )}
            {alerts.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px', background: '#0A0B0D', border: `1px solid ${a.border}` }}>
                <span style={{ width: '10px', height: '10px', flex: 'none', borderRadius: '50%', background: a.color, boxShadow: `0 0 8px ${a.color}`, animation: a.anim }} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{a.client}</span>
                  <span style={{ fontSize: '12px', color: '#9AA1AB' }}>{a.text}</span>
                </span>
                {a.open && (
                  <button type="button" onClick={a.act} style={{ minHeight: '36px', padding: '0 12px', borderRadius: '10px', border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: '13px', fontWeight: '600' }}>
                    {a.cta}
                  </button>
                )}
                {a.done && <span style={{ fontSize: '12px', fontWeight: '600', color: '#3DDC84' }}>{a.doneLabel}</span>}
              </div>
            ))}
          </section>

          <section aria-labelledby="rep-h" style={{ borderRadius: '22px', background: '#101215', border: '1px solid #1A1D22', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 id="rep-h" style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>Reports due this week</h2>
            {!loading && reportRows.length === 0 && (
              <div style={{ fontSize: '14px', color: '#9AA1AB', padding: '8px 0' }}>
                No reports scheduled.{' '}
                <Link href="/app/history" style={{ color: '#4DA3FF', textDecoration: 'none' }}>
                  Create one
                </Link>
              </div>
            )}
            {reportRows.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', background: '#0A0B0D', border: '1px solid #1A1D22' }}>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px' }}>{r.client}</span>
                  <span style={{ fontSize: '12px', color: '#9AA1AB' }}>{r.when}</span>
                </span>
                <Link href="/app/month" style={{ fontSize: '12px', color: '#9AA1AB', textDecoration: 'none' }}>
                  Preview
                </Link>
                {r.open && (
                  <button type="button" onClick={r.send} style={{ minHeight: '34px', padding: '0 12px', borderRadius: '10px', border: '1px solid #4DA3FF', background: 'transparent', color: '#4DA3FF', fontSize: '13px', fontWeight: '600' }}>
                    Send
                  </button>
                )}
                {r.sent && <span style={{ fontSize: '12px', fontWeight: '600', color: '#3DDC84' }}>Sent</span>}
              </div>
            ))}
          </section>
        </aside>
      </div>

      <section aria-labelledby="health-h" style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="health-h" style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>Client health · last 30 days</h2>
        <div style={{ borderRadius: '20px', background: '#101215', border: '1px solid #1A1D22', overflowX: 'auto' }}>
          <div style={{ minWidth: '880px' }}>
            <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) 120px minmax(0, 1.6fr) 110px 90px 90px 120px', gap: '12px', padding: '12px 18px', fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#7D848E', borderBottom: '1px solid #1A1D22' }}>
              <span>CLIENT</span>
              <span>LEVEL</span>
              <span>CLICKS, 30 DAYS</span>
              <span>LINKING SITES</span>
              <span>WAITING</span>
              <span>RED TASKS</span>
              <span>CONNECTIONS</span>
            </div>
            {!loading && clients.length === 0 && (
              <p style={{ margin: '18px', fontSize: '14px', color: '#9AA1AB' }}>
                No client sites yet.{' '}
                <Link href="/app/workspace" style={{ color: '#4DA3FF', textDecoration: 'none' }}>
                  Add a site
                </Link>
              </p>
            )}
            {clients.map((c, i) => (
              <div key={`${c.name}-${i}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) 120px minmax(0, 1.6fr) 110px 90px 90px 120px', gap: '12px', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #16181C', fontSize: '14px' }}>
                <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '500' }}>{c.name}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#7D848E' }}>{c.domain}</span>
                </span>
                <span style={{ fontSize: '13px', color: c.qColor }}>
                  Level {c.level} · {c.quality}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg viewBox="0 0 120 32" width="120" height="32" aria-hidden="true">
                    <path d={c.spark} fill="none" stroke={c.trendColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: c.trendColor }}>{c.trend}</span>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', color: '#D7DADE' }}>{c.links}</span>
                  <span style={{ fontSize: '11px', color: c.linkColor }}>{c.linkDelta}</span>
                </span>
                <span style={{ fontSize: '13px', color: '#D7DADE' }}>{c.waiting}</span>
                <span style={{ fontSize: '13px', color: c.redColor }}>{c.red}</span>
                <span style={{ display: 'flex', gap: '6px' }}>
                  <span title="Search Console" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', padding: '3px 6px', borderRadius: '6px', border: `1px solid ${c.gscColor}`, color: c.gscColor }}>
                    GSC
                  </span>
                  <span title="WordPress" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', padding: '3px 6px', borderRadius: '6px', border: `1px solid ${c.wpColor}`, color: c.wpColor }}>
                    WP
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
