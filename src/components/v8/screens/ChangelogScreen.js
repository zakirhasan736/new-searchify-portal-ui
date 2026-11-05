'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { activeSiteContext } from '@/lib/siteContext';
import {
  changePath,
  historyItems,
  listChanges,
  undoChange,
  getBusinessProfile,
  getProductUsage,
} from '@/lib/v1Api';
import { loadJourney, planById } from '@/lib/journey';
import { SkeletonRows } from '@/components/v8/SkeletonWave';
import '@/styles/v8-screens.css';

function formatChangelogDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).replace(',', '');
}

function changelogType(c) {
  const t = String(c.changeType || '').toLowerCase();
  if (t === 'meta') {
    const beforeDesc = c.proposed?.beforeMetaDescription ?? c.proposed?.beforeDescription;
    const afterDesc = c.proposed?.metaDescription;
    if (beforeDesc != null && afterDesc != null && String(beforeDesc) !== String(afterDesc)) return 'desc';
    return 'title';
  }
  const map = { image: 'image', schema: 'schema', link: 'links', links: 'links', content: 'content', performance: 'content' };
  return map[t] || 'title';
}

function changeSummary(c) {
  const opp = String(c.opportunity || '').trim();
  if (opp) return opp;
  const ct = String(c.changeType || 'change');
  if (ct === 'meta') return 'Title and description updated';
  if (ct === 'image') return 'Image updated';
  return `${ct.charAt(0).toUpperCase()}${ct.slice(1)} applied`;
}

function changelogOutcome(c) {
  const mon = c.monitoring || {};
  if (c.status === 'undone') {
    return { res: 'undone', result: mon.note || 'Change undone' };
  }
  const rawDelta = mon.clickDelta ?? mon.click_delta ?? mon.visitorsDelta ?? mon.visitors_delta ?? mon.delta;
  if (rawDelta != null && rawDelta !== '') {
    const n = Number(rawDelta);
    if (Number.isFinite(n) && n > 0) {
      return { res: 'up', delta: Math.round(n), result: `+${Math.round(n)} visitors / mo` };
    }
    if (Number.isFinite(n) && n < 0) {
      return { res: 'undone', result: `${n} visitors · auto-undone` };
    }
    if (Number.isFinite(n) && n === 0) {
      return { res: 'flat', result: 'No clear effect' };
    }
  }
  if (mon.outcome === 'flat' || mon.verdict === 'flat' || c.status === 'closed') {
    return { res: 'flat', result: mon.note || 'No clear effect' };
  }
  if (['applied', 'monitoring', 'published_unverified'].includes(c.status)) {
    const day = mon.day ?? mon.daysElapsed;
    const dayNote = day != null ? ` · day ${day} of 28` : '';
    return { res: 'measuring', result: mon.note || `Measuring${dayNote}` };
  }
  return { res: 'measuring', result: mon.note || 'Measuring' };
}

function mapApiChange(c) {
  const outcome = changelogOutcome(c);
  const proposed = c.proposed || {};
  return {
    id: String(c.id),
    changeId: c.id,
    date: formatChangelogDate(c.appliedAt || c.updatedAt || c.createdAt),
    type: changelogType(c),
    change: changeSummary(c),
    page: changePath(c),
    ...outcome,
    by: c.approvedByName || c.appliedByName || 'you',
    before: proposed.beforeTitle || proposed.beforeMetaDescription || proposed.beforeDescription || proposed.before || '(unknown)',
    after: proposed.title || proposed.metaDescription || proposed.after || '—',
    beforeTitle: proposed.beforeTitle || proposed.liveTitle || '',
    afterTitle: proposed.title || '',
    beforeDescription: proposed.liveMetaDescription || proposed.beforeMetaDescription || proposed.beforeDescription || '',
    afterDescription: proposed.metaDescription || '',
  };
}

function downloadCsv(rows, hostname) {
  const header = ['date', 'type', 'change', 'page', 'result', 'approved_by', 'before', 'after'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [r.date, r.type, r.change, r.page, r.result, r.by, r.before, r.after].map(escape).join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `searchify-changelog-${(hostname || 'site').replace(/[^\w.-]+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const REPORT_TOPICS = [
  { id: 'results', label: 'Results: visitors and calls gained' },
  { id: 'changelog', label: 'Change log with before and after' },
  { id: 'health', label: 'Site health board' },
  { id: 'compare', label: 'How you compare with similar businesses' },
  { id: 'next', label: 'Coming up next month' },
];

const MONO = '"Open Sans", sans-serif';
const BENCH = 'Measured from your own Search Console data: 4 weeks before vs 4 weeks after';

function stampOf(change) {
  const iso = change.appliedAt || change.updatedAt || change.createdAt;
  const time = iso ? new Date(iso).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

function exportCaps(planId) {
  const id = String(planId || '').toLowerCase();
  if (id === 'agency' || id === 'premium') return { pdf: null, sends: null, logins: null };
  if (id === 'growth' || id === 'pro') return { pdf: 5, sends: 1, logins: 3 };
  return { pdf: 1, sends: null, logins: null };
}

function capLabel(usedCount, cap) {
  if (cap == null) return 'Unlimited';
  return `${usedCount} of ${cap}`;
}

export default function ChangelogScreen() {
  const [tab, setTab] = useState('log');
  const [type, setType] = useState('all');
  const [result, setResult] = useState('all');
  const [open, setOpen] = useState(null);
  const [used, setUsed] = useState(0);
  const [made, setMade] = useState(false);
  const [csv, setCsv] = useState(false);
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState(null);
  const [confirmUndo, setConfirmUndo] = useState(null);
  const [agencyName, setAgencyName] = useState('Searchify (default)');
  const [planLabel, setPlanLabel] = useState('PRO');
  const [planId, setPlanId] = useState('growth');
  const [periodLabel, setPeriodLabel] = useState('');
  const [include, setInclude] = useState(() => Object.fromEntries(REPORT_TOPICS.map((topic) => [topic.id, true])));

  const [all, setAll] = useState([]);
  const [hostname, setHostname] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const journey = loadJourney();
      setHostname(activeSiteContext(journey).hostname || 'Your site');
      const [chRes, prof, usage] = await Promise.all([
        listChanges({ force: true }),
        getBusinessProfile().catch(() => ({ ok: false })),
        getProductUsage().catch(() => ({ ok: false })),
      ]);
      const raw = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
      const mapped = historyItems(raw).slice().sort((a, b) => stampOf(b) - stampOf(a)).map(mapApiChange);
      setAll(mapped);
      setOpen((prev) => (mapped.some((m) => m.id === prev) ? prev : mapped[0]?.id || ''));

      if (prof?.ok && prof.data) {
        const name = prof.data.agencyName || prof.data.businessName || '';
        if (name) setAgencyName(name);
      }
      const u = usage?.ok ? usage.data : {};
      const nextPlan = u.plan || journey.planId || 'starter';
      const plan = planById(nextPlan);
      setPlanId(nextPlan);
      setPlanLabel(String(plan?.name || nextPlan || 'PRO').toUpperCase());
      if (typeof u.reportsUsed === 'number') setUsed(Math.min(5, u.reportsUsed));
      else if (typeof u.pdfReports === 'number') setUsed(Math.min(5, u.pdfReports));
    } catch {
      setAll([]);
      setOpen('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    setPeriodLabel(now.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
    reload();
  }, [reload]);

  const handleUndo = async (changeId) => {
    if (!changeId || undoing) return;
    setUndoing(changeId);
    try {
      await undoChange(changeId);
      setConfirmUndo(null);
      await reload();
    } finally {
      setUndoing(null);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      all.filter((r) => (type === 'all' || r.type === type) && (result === 'all' || r.res === result)),
      hostname,
    );
    setCsv(true);
  };

  const accent = '#3DDC84';

  const TYPES = { title: 'TITLE TAG', desc: 'DESCRIPTION', image: 'IMAGES', schema: 'SCHEMA', links: 'LINKS', content: 'CONTENT' };

  const LOOK = { up: { dot: '#3DDC84', color: '#F2F4F5' }, measuring: { dot: '#FFC53D', color: '#9AA1AB' }, flat: { dot: '#3A404A', color: '#9AA1AB' }, undone: { dot: '#FF5A4E', color: '#9AA1AB' } };

  const rows = all.filter((r) => (type === 'all' || r.type === type) && (result === 'all' || r.res === result)).map((r) => {
    const isOpen = open === r.id;
    const index = all.findIndex((item) => item.id === r.id);
    const n = all.length - index;
    const latest = n === all.length;
    const first = n === 1;
    return {
      ...r,
      n: String(n),
      isLatest: latest,
      isFirst: first,
      numBg: latest ? 'rgba(77,163,255,.12)' : (first ? 'rgba(61,220,132,.1)' : '#16181C'),
      numBorder: latest ? '#4DA3FF' : (first ? 'rgba(61,220,132,.6)' : '#262A31'),
      numColor: latest ? '#4DA3FF' : (first ? '#3DDC84' : '#D7DADE'),
      typeLabel: TYPES[r.type] || 'CHANGE',
      bench: BENCH,
      dot: (LOOK[r.res] || LOOK.measuring).dot,
      resultColor: (LOOK[r.res] || LOOK.measuring).color,
      open: isOpen,
      openStr: String(isOpen),
      chev: isOpen ? 'rotate(180deg)' : 'none',
      canUndo: r.res !== 'undone'
    };
  });

  const tdefs = [['all', 'All'], ['title', 'Title tags'], ['desc', 'Descriptions'], ['image', 'Images'], ['schema', 'Schema'], ['links', 'Links'], ['content', 'Content']];
  const types = tdefs.map((d) => ({
    label: d[1],
    count: String(d[0] === 'all' ? all.length : all.filter((r) => r.type === d[0]).length),
    on: type === d[0],
    off: type !== d[0]
  }));

  const rdefs = [['all', 'Any result', '#9AA1AB'], ['up', 'Worked', '#3DDC84'], ['measuring', 'Measuring', '#FFC53D'], ['flat', 'No effect', '#3A404A'], ['undone', 'Undone', '#FF5A4E']];
  const results = rdefs.map((d) => ({
    label: d[1],
    dot: d[2],
    on: result === d[0],
    off: result !== d[0]
  }));

  const gained = rows.reduce((a, r) => a + (r.delta || 0), 0);
  const caps = exportCaps(planId);
  const pdfCap = caps.pdf;
  const pdfUsed = pdfCap == null ? used : Math.min(used, pdfCap);
  const slotCount = pdfCap == null ? 0 : pdfCap;
  const slots = Array.from({ length: slotCount }, (_, i) => ({ color: i < pdfUsed ? '#4DA3FF' : '#262A31', glow: i < pdfUsed ? '0 0 8px rgba(77,163,255,.5)' : 'none' }));
  const atPdfLimit = pdfCap != null && pdfUsed >= pdfCap;
  const reports = made
    ? [{ name: `${periodLabel || 'This month'} · monthly`, meta: 'Branded PDF · just now', href: '/app/month' }]
    : [];
  const nextReset = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    return d.toLocaleString('en-US', { month: 'long', day: 'numeric' });
  })();

  const monthName = (periodLabel || '').split(' ')[0] || 'Monthly';

  return (
      <div style={{ flex: '999 1 560px', minWidth: 0, minHeight: 1240, background: '#0A0B0D', color: '#F2F4F5', fontFamily: 'Geist, \'Helvetica Neue\', sans-serif', boxSizing: 'border-box', padding: '22px clamp(16px, 4vw, 56px) 56px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '40px', padding: '0 14px', borderRadius: '999px', border: '1px solid #262A31', color: '#F2F4F5', textDecoration: 'none', fontSize: '13px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg>
            Home
          </Link>
          <Link href="/app/workspace" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '40px', padding: '0 12px', borderRadius: '10px', color: '#F2F4F5', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>
            {hostname}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M7 10l5 5 5-5"></path></svg>
          </Link>
        </header>

        <div style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
            <h1 style={{ margin: '0', fontFamily: '\'Bricolage Grotesque\', Geist, sans-serif', fontSize: 'clamp(36px, 4.6vw, 58px)', lineHeight: '1', letterSpacing: '-1.6px', fontWeight: '700', minWidth: 0, overflowWrap: 'break-word' }}>Reports and change log</h1>
          </div>
          <div role="tablist" aria-label="View" style={{ display: 'inline-flex', padding: '4px', borderRadius: '14px', background: '#131519', border: '1px solid #262A31' }}>
            {[['log', 'Change log'], ['reports', 'Reports']].map((t) => (
              <button key={t[0]} type="button" role="tab" aria-selected={tab === t[0] ? 'true' : 'false'} onClick={() => setTab(t[0])} style={{ minHeight: '42px', padding: '0 18px', borderRadius: '10px', border: '0', background: tab === t[0] ? '#262A31' : 'transparent', color: tab === t[0] ? '#F2F4F5' : '#9AA1AB', fontSize: '14px', fontWeight: tab === t[0] ? '600' : '400' }}>{t[1]}</button>
            ))}
          </div>
        </div>

        <div role="note" style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 20px', borderRadius: '16px', background: 'rgba(255,197,61,.08)', border: '1px solid rgba(255,197,61,.5)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFC53D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', marginTop: '1px' }}><circle cx="12" cy="12" r="9"></circle><path d="M12 11v6"></path><path d="M12 7.5h.01"></path></svg>
          <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><strong style={{ fontSize: '16px', color: '#F2F4F5' }}>You don&apos;t have to do anything here.</strong><span style={{ fontSize: '15px', lineHeight: 1.55, color: '#D7DADE' }}>This page is simply a record of every change made to your website and what each one earned. Come back whenever you&apos;re curious, or when you need a report to share.</span></span>
        </div>

        {tab === 'log' && (
          <div style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'sfy-rise .25s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '1 1 560px' }}>
                <div role="group" aria-label="Filter by what changed" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '11px', color: '#7D848E', width: '64px' }}>FILTER BY</span>
                  {tdefs.map((d) => {
                    const f = types.find((t) => t.label === d[1]) || { label: d[1], count: '0', on: false };
                    return (
                    <button key={d[0]} type="button" aria-pressed={f.on ? 'true' : 'false'} onClick={() => setType(d[0])} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', minHeight: '38px', padding: '0 13px', borderRadius: '999px', border: f.on ? '1px solid #4DA3FF' : '1px solid #262A31', background: f.on ? 'rgba(77,163,255,.12)' : 'transparent', color: f.on ? '#F2F4F5' : '#D7DADE', fontSize: '13px', fontWeight: f.on ? '600' : '400', boxShadow: f.on ? '0 0 18px rgba(77,163,255,.3)' : 'none' }}>
                      {f.label} <span style={{ fontFamily: '\'Geist Mono\', monospace', color: f.on ? '#F2F4F5' : '#9AA1AB' }}>{f.count}</span>
                    </button>
                    );
                  })}
                </div>
                <div role="group" aria-label="Filter by result" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '11px', color: '#7D848E', width: '64px' }}>FILTER BY</span>
                  {rdefs.map((d) => {
                    const f = results.find((t) => t.label === d[1]) || { label: d[1], dot: d[2], on: false };
                    return (
                    <button key={d[0]} type="button" aria-pressed={f.on ? 'true' : 'false'} onClick={() => setResult(d[0])} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', minHeight: '34px', padding: '0 12px', borderRadius: '999px', border: f.on ? '1px solid #F2F4F5' : '1px solid #262A31', background: f.on ? '#F2F4F5' : 'transparent', color: f.on ? '#0A0B0D' : '#D7DADE', fontSize: '12px', fontWeight: f.on ? '600' : '400' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.dot }}></span>
                      {f.label}
                    </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="button" onClick={handleExportCsv} disabled={!all.length} style={{ minHeight: '44px', padding: '0 16px', borderRadius: '12px', border: '1px solid #262A31', background: 'transparent', color: '#F2F4F5', fontSize: '14px', opacity: all.length ? 1 : 0.5 }}>{csv ? 'CSV downloaded' : 'Export CSV'}</button>
                <button type="button" onClick={() => setTab('reports')} style={{ minHeight: '44px', padding: '0 18px', borderRadius: '12px', border: '0', background: '#4DA3FF', color: '#0A0B0D', fontSize: '14px', fontWeight: '600', boxShadow: '0 0 20px rgba(77,163,255,.4)' }}>Create report</button>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#9AA1AB' }}>
              {loading
                ? 'Loading shipped changes…'
                : all.length === 0
                ? 'No shipped changes yet.'
                : `Showing ${rows.length} ${rows.length === 1 ? 'change' : 'changes'}${gained > 0 ? ` · +${gained} visitors / mo from these` : ''}`}
            </div>
            {loading ? <SkeletonRows count={6} /> : null}

            <div style={{ borderRadius: '22px', background: '#101215', border: '1px solid #1A1D22', overflow: 'hidden' }}>
              {rows.length === 0 && (
                <p style={{ margin: 0, padding: '22px', fontSize: '14px', color: '#9AA1AB' }}>
                  Ship a move from Home and it will show up here with before/after and results.
                </p>
              )}
              {rows.map((r) => (
                <div key={r.id} style={{ borderBottom: '1px solid #1A1D22' }}>
                  <button type="button" onClick={() => setOpen(r.open ? null : r.id)} aria-expanded={r.openStr} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: '0', color: '#F2F4F5', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <span aria-label={`Change number ${r.n}`} style={{ flex: 'none', width: '46px', height: '32px', borderRadius: '9px', background: r.numBg, border: `1px solid ${r.numBorder}`, color: r.numColor, display: 'grid', placeItems: 'center', fontFamily: '\'Bricolage Grotesque\', Geist, sans-serif', fontSize: '15px', fontWeight: 800 }}>#{r.n}</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '12px', color: '#7D848E', width: '52px' }}>{r.date}</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #262A31', color: '#D7DADE', width: '104px', textAlign: 'center', boxSizing: 'border-box' }}>{r.typeLabel}</span>
                    <span style={{ flex: '1 1 240px', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px' }}>{r.change}</span>
                        {r.isLatest ? <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '10px', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '6px', border: '1px solid #4DA3FF', color: '#4DA3FF' }}>LATEST</span> : null}
                        {r.isFirst ? <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '10px', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '6px', border: '1px solid #3DDC84', color: '#3DDC84' }}>YOUR FIRST FIX</span> : null}
                      </span>
                      <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '12px', color: '#9AA1AB' }}>{r.page}</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', width: '190px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.dot }}></span>
                      <span style={{ fontSize: '14px', color: r.resultColor }}>{r.result}</span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ transform: r.chev, transition: 'transform .2s ease' }}><path d="M7 10l5 5 5-5"></path></svg>
                  </button>
                  {r.open && (
                    <div className="v8-log-detail" style={{ padding: '0 22px 20px 152px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'sfy-rise .2s ease both' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                        <div style={{ borderRadius: '12px', background: '#0A0B0D', border: '1px solid #1A1D22', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontFamily: '\'Geist Mono\', monospace', fontSize: '11px', color: '#7D848E' }}>BEFORE</span><span style={{ fontSize: '14px', color: '#9AA1AB' }}>{r.before}</span></div>
                        <div style={{ borderRadius: '12px', background: 'rgba(77,163,255,.06)', border: '1px solid #4DA3FF', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontFamily: '\'Geist Mono\', monospace', fontSize: '11px', color: '#4DA3FF' }}>AFTER</span><span style={{ fontSize: '14px' }}>{r.after}</span></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '13px', color: '#9AA1AB' }}>
                        <span>Approved by {r.by} · checked live {r.date}</span>
                        <span style={{ color: '#3A404A' }}>|</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 19V5"></path><path d="M4 19h16"></path><path d="M8 15l4-4 3 3 5-6"></path></svg>{r.bench}</span>
                        <span style={{ marginLeft: 'auto' }}></span>
                        {r.canUndo && confirmUndo !== r.id && (
                          <button
                            type="button"
                            disabled={!!undoing}
                            onClick={() => setConfirmUndo(r.id)}
                            style={{ minHeight: '36px', padding: '0 12px', borderRadius: '9px', border: '1px solid #262A31', background: 'transparent', color: '#D7DADE', fontSize: '13px' }}
                          >
                            Undo this change
                          </button>
                        )}
                      </div>
                      {confirmUndo === r.id && (
                        <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#0A0B0D', border: '1px solid #262A31', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'sfy-rise .25s ease both' }}>
                          <span style={{ fontSize: '14px', color: '#D7DADE' }}>This puts the old version back on your live site:</span>
                          <span style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', background: '#131519' }}>{r.before}</span>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              disabled={undoing === r.changeId}
                              onClick={() => handleUndo(r.changeId)}
                              style={{ minHeight: '44px', padding: '0 18px', borderRadius: '11px', border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: '14px', fontWeight: 600, boxShadow: '0 0 20px rgba(77,163,255,.4)', opacity: undoing === r.changeId ? 0.7 : 1 }}
                            >
                              {undoing === r.changeId ? 'Restoring…' : 'Restore old version'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmUndo(null)}
                              style={{ minHeight: '44px', padding: '0 16px', borderRadius: '11px', border: '1px solid #262A31', background: 'transparent', color: '#D7DADE', fontSize: '14px' }}
                            >
                              Keep the change
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start', animation: 'sfy-rise .25s ease both' }}>
            <section aria-label="Create a report" style={{ flex: '999 1 520px', minWidth: '0', borderRadius: '24px', background: '#131519', border: '1px solid #262A31', padding: '26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ margin: '0', fontSize: '22px', fontWeight: '600' }}>Create a report</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#9AA1AB' }}>
                  Period
                  <select style={{ minHeight: '46px', padding: '0 12px', borderRadius: '12px', border: '1px solid #262A31', background: '#0A0B0D', color: '#F2F4F5', font: 'inherit', fontSize: '15px' }}>
                    <option>{periodLabel || 'This month'}</option>
                    <option>Last 90 days</option>
                    <option>Since we started</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#9AA1AB' }}>
                  Branding
                  <select style={{ minHeight: '46px', padding: '0 12px', borderRadius: '12px', border: '1px solid #262A31', background: '#0A0B0D', color: '#F2F4F5', font: 'inherit', fontSize: '15px' }}>
                    <option>{agencyName}</option>
                    <option>Searchify (default)</option>
                  </select>
                </label>
              </div>
              <fieldset style={{ border: '0', margin: '0', padding: '0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <legend style={{ fontSize: '13px', color: '#9AA1AB', marginBottom: '8px' }}>Include</legend>
                {REPORT_TOPICS.map((topic) => (
                  <label key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
                    <input
                      type="checkbox"
                      checked={include[topic.id] !== false}
                      onChange={() => setInclude((prev) => ({ ...prev, [topic.id]: !prev[topic.id] }))}
                      style={{ width: '18px', height: '18px', accentColor: '#4DA3FF' }}
                    />
                    {topic.label}
                  </label>
                ))}
              </fieldset>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {!atPdfLimit ? (
                  <button type="button" onClick={() => { setUsed(pdfCap == null ? used + 1 : Math.min(pdfCap, used + 1)); setMade(true); }} style={{ minHeight: '52px', padding: '0 24px', borderRadius: '13px', border: '0', background: '#4DA3FF', color: '#0A0B0D', fontSize: '15px', fontWeight: '600', boxShadow: '0 0 22px rgba(77,163,255,.45)' }}>Generate branded PDF</button>
                ) : (
                  <Link href="/app/billing" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '52px', padding: '0 22px', borderRadius: '13px', background: '#4DA3FF', color: '#0A0B0D', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>Upgrade for unlimited reports</Link>
                )}
                <Link href="/app/month" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '52px', padding: '0 18px', borderRadius: '13px', border: '1px solid #262A31', color: '#F2F4F5', textDecoration: 'none', fontSize: '15px' }}>Preview as client</Link>
              </div>
              {made && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4DA3FF' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4DA3FF', boxShadow: '0 0 10px #4DA3FF' }}></span>{monthName} report ready · added to the list</span>
              )}
            </section>

            <aside style={{ flex: '1 1 320px', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ borderRadius: '24px', background: '#101215', border: '1px solid #1A1D22', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: '16px', fontWeight: '600' }}>Your exports</span><span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '11px', color: '#9AA1AB' }}>{planLabel} · THIS SITE · {monthName.toUpperCase()}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span>Branded PDF reports</span><span style={{ fontFamily: MONO, fontWeight: 700, color: atPdfLimit ? '#FFC53D' : (pdfCap == null ? '#3DDC84' : '#F2F4F5') }}>{capLabel(pdfUsed, pdfCap)}</span></div>
                  {slotCount > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))`, gap: '4px' }}>
                      {slots.map((s, i) => <div key={i} style={{ height: '8px', borderRadius: '4px', background: s.color, boxShadow: s.glow }}></div>)}
                    </div>
                  ) : null}
                  <span style={{ fontSize: '12px', color: '#7D848E' }}>{pdfCap == null ? 'Included on this plan' : `Resets ${nextReset}`}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid #1A1D22', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><span>Scheduled client sends</span><span style={{ fontFamily: MONO, fontWeight: 700, color: caps.sends == null ? '#3DDC84' : '#9AA1AB' }}>{caps.sends == null ? (planId === 'starter' || planId === 'solo' ? 'Not on Solo' : 'Unlimited') : `0 of ${caps.sends}`}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><span>Client logins</span><span style={{ fontFamily: MONO, fontWeight: 700, color: caps.logins == null ? '#3DDC84' : '#9AA1AB' }}>{caps.logins == null ? (planId === 'starter' || planId === 'solo' ? 'Not on Solo' : 'Unlimited') : `0 of ${caps.logins}`}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><span>CSV of your change log</span><span style={{ color: '#3DDC84' }}>Unlimited, always</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><span>White-label (no Searchify name)</span>{planId === 'agency' || planId === 'premium' ? <span style={{ color: '#3DDC84' }}>Included</span> : <Link href="/app/billing" style={{ color: '#9AA1AB', fontSize: '13px' }}>Premium</Link>}</div>
                </div>
              </div>

              <div style={{ borderRadius: '24px', background: '#101215', border: '1px solid #1A1D22', padding: '8px 22px' }}>
                {reports.length === 0 && (
                  <p style={{ margin: '14px 0', fontSize: '14px', color: '#9AA1AB' }}>No reports generated yet.</p>
                )}
                {reports.map((rp, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: i < reports.length - 1 ? '1px solid #1A1D22' : 'none' }}>
                    <span style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '14px' }}>{rp.name}</span><span style={{ fontSize: '12px', color: '#9AA1AB' }}>{rp.meta}</span></span>
                    <Link href={rp.href || '/app/month'} style={{ color: '#4DA3FF', fontSize: '13px', textDecoration: 'none' }}>Open</Link>
                  </div>
                ))}
              </div>
            </aside>

            <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
              <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 600 }}>In this report</h2>
              {include.gsc ? (
                <TopicCard title="Search Console">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                    {gscKpis.map((kpi) => (
                      <span key={kpi[0]} style={{ minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#7D848E' }}>{kpi[0]}</span>
                        <span style={{ fontSize: '18px' }}>{kpi[1]}</span>
                      </span>
                    ))}
                  </div>
                  <ReportLines rows={gscQueries} empty="Search Console has no stored queries for this site yet." />
                </TopicCard>
              ) : null}
              {include.speed ? (
                <TopicCard title="Speed Insights">
                  {speedKpis.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                      {speedKpis.map((kpi, index) => (
                        <span key={`${kpi[0]}-${index}`} style={{ minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#7D848E' }}>{kpi[0]}</span>
                          <span style={{ fontSize: '18px' }}>{kpi[1] ?? '—'}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '14px', color: '#9AA1AB' }}>Speed Insights has not been read for this site yet.</p>
                  )}
                </TopicCard>
              ) : null}
              {include.title ? <TopicCard title="Title tags"><ReportLines rows={titleRows} empty="No title changes have shipped yet." /></TopicCard> : null}
              {include.desc ? <TopicCard title="Descriptions"><ReportLines rows={descRows} empty="No description changes have shipped yet." /></TopicCard> : null}
              {include.image ? <TopicCard title="Images"><ReportLines rows={imageRows} empty="No image changes have shipped yet." /></TopicCard> : null}
              {include.schema ? <TopicCard title="Schema"><ReportLines rows={schemaRows} empty="No schema changes have shipped yet." /></TopicCard> : null}
              {include.links ? <TopicCard title="Links"><ReportLines rows={linkRows} empty="No link changes have shipped yet." /></TopicCard> : null}
              {include.content ? <TopicCard title="Content"><ReportLines rows={contentRows} empty="No content changes have shipped yet." /></TopicCard> : null}
              {include.results ? (
                <TopicCard title="Results: visitors and calls gained">
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
                    Shipped changes account for <strong style={{ color: '#4DA3FF' }}>+{totalCaptured}</strong> visitors / mo.
                    {' '}Search Console clicks for this site: {featureKpi(sources.gsc, 'click')}. Calls are shown when Analytics has stored them.
                  </p>
                </TopicCard>
              ) : null}
              {include.changelog ? <TopicCard title="Change log with before and after"><ReportLines rows={logRows} empty="No shipped changes to show yet." /></TopicCard> : null}
              {include.health ? (
                <TopicCard title="Site health board">
                  {speedKpis.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                      {speedKpis.map((kpi, index) => (
                        <span key={`health-${kpi[0]}-${index}`} style={{ fontSize: '14px' }}>{kpi[0]} · {kpi[1] ?? '—'}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '14px', color: '#9AA1AB' }}>Site health has not been read for this site yet.</p>
                  )}
                </TopicCard>
              ) : null}
              {include.compare ? (
                <TopicCard title="How you compare with similar businesses">
                  <ReportLines
                    rows={Object.entries(BENCH).map(([key, text]) => ({ key, meta: TYPES[key] || key, text }))}
                    empty="No comparison notes yet."
                  />
                </TopicCard>
              ) : null}
              {include.next ? (
                <TopicCard title="Coming up next month">
                  <ReportLines
                    rows={sources.queue.map((item, index) => ({ key: `next-${index}`, meta: item.page, text: item.change }))}
                    empty="Nothing is waiting in the queue for next month."
                  />
                </TopicCard>
              ) : null}
            </div>
          </div>
        )}
      </div>
  );
}
