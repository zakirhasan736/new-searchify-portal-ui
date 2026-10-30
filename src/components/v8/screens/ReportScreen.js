'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SkeletonCards } from '@/components/v8/SkeletonWave';
import ProblemNotice from '@/components/v8/ProblemNotice';
import { problemsFrom } from '@/lib/problems';
import { buildAuditFindings } from '@/lib/auditFindings';
import { activeSiteContext } from '@/lib/siteContext';
import { clickHalves, issueCounts, monthEmail, publishedRows } from '@/lib/monthReport';
import {
  changePath,
  featureKpi,
  featurePayload,
  getBusinessProfile,
  getGoogleStatus,
  getProductWorkspace,
  historyItems,
  listChanges,
  loadFeature,
  researchAudit,
  researchBacklinks,
} from '@/lib/v1Api';
import { loadJourney } from '@/lib/journey';
import { authHeaders } from '@/utils/users/Helpers';
import '@/styles/v8-screens.css';

function formatShortDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function changeRowCopy(c) {
  const mon = c.monitoring || {};
  const opp = String(c.opportunity || '').trim() || 'Change shipped';
  const rawDelta = mon.clickDelta ?? mon.click_delta ?? mon.visitorsDelta ?? mon.visitors_delta ?? mon.delta;
  if (rawDelta != null && Number(rawDelta) > 0) {
    return { title: opp, sub: formatShortDate(c.appliedAt), result: `+${Math.round(Number(rawDelta))} visitors / mo`, accent: true };
  }
  if (['applied', 'monitoring', 'published_unverified'].includes(c.status)) {
    const applied = c.appliedAt ? new Date(c.appliedAt) : null;
    const due =
      applied && !Number.isNaN(applied.getTime())
        ? formatShortDate(new Date(applied.getTime() + 28 * 864e5).toISOString())
        : null;
    return {
      title: opp,
      sub: formatShortDate(c.appliedAt || c.updatedAt),
      result: due ? `Measuring — results ${due}` : 'Measuring — results in ~28 days',
      accent: false,
    };
  }
  return { title: opp, sub: formatShortDate(c.appliedAt), result: mon.note || 'Shipped', accent: false };
}

// Search Console performance report for the connected property. Prefer the backend link;
// build the same URL here when an older backend has not sent one yet.
function searchConsoleLink(connection) {
  const gsc = connection?.gsc || {};
  if (gsc.links?.performance) return gsc.links.performance;
  const property = String(gsc.siteUrl || connection?.gscSiteUrl || '').trim();
  if (!property) return '';
  return `https://search.google.com/search-console/performance/search-analytics?resource_id=${encodeURIComponent(property)}`;
}

function kpiNum(payload, part) {
  const raw = featureKpi(payload, part, '');
  if (!raw || raw === '—') return 0;
  return Number(String(raw).replace(/[^\d.]/g, '')) || 0;
}

const EMPTY = {
  agency: 'Your agency',
  contact: '',
  month: 'Monthly report',
  nextMonth: 'next month',
  headline: 'Your site report will fill in from live data.',
  visitors: '—',
  visitorsSub: 'From Search Console',
  calls: '—',
  changes: [],
  linksTotal: '0',
  linksTotalSub: 'websites link to you',
  linksNew: '0',
  linksNewSub: 'new this month',
  linksLost: '0',
  linksLostSub: 'lost this month',
  health: { red: 0, yellow: 0, green: 0, blue: 0 },
  next: [],
  pendingNote: 'No pending approvals.',
  emailBody: '',
};

export default function ReportScreen() {
  const searchParams = useSearchParams();
  const clientView = searchParams.get('share') === '1' || searchParams.get('client') === '1';
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [gscLink, setGscLink] = useState('');
  const [problems, setProblems] = useState([]);
  const accent = '#D5F879';

  useEffect(() => {
    if (clientView) return undefined;
    let cancelled = false;
    getGoogleStatus()
      .then((res) => {
        if (cancelled) return;
        setGscLink(searchConsoleLink(res?.data?.connection));
        const saved = res?.data?.connection?.problem;
        if (saved) setProblems((list) => [saved, ...list.filter((p) => p.code !== saved.code)]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [clientView]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const journey = loadJourney();
    const { hostname, site, href } = activeSiteContext(journey);
    const brand = site?.answers?.businessName || site?.answers?.businessType || site?.label || hostname;
    const now = new Date();
    const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const nextMonthName = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleString('en-US', { month: 'long' });

    Promise.all([
      listChanges({ force: true }),
      loadFeature('organic-search'),
      loadFeature('traffic-analytics'),
      loadFeature('top-pages'),
      loadFeature('site-audit'),
      loadFeature('ga4-landing-pages'),
      loadFeature('backlinks'),
      href ? researchAudit({ site: href, force: false }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
      href ? researchBacklinks({ site: href, force: false }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
      getProductWorkspace().catch(() => ({ ok: false })),
      getBusinessProfile({ force: true }).catch(() => ({ ok: false })),
      fetch('/api/v1/profile', { headers: authHeaders() }).then((r) => r.json().catch(() => null)).catch(() => null),
    ])
      .then(([chRes, organic, traffic, pages, audit, landings, backlinks, auditRes, linkRes, workspace, biz, acct]) => {
        if (cancelled) return;
        if (!clientView && href) {
          const found = [...problemsFrom(auditRes, 'site_audit'), ...problemsFrom(linkRes, 'backlinks')];
          setProblems((list) => [...list.filter((p) => p.area === 'search_console' || p.area === 'analytics' || p.area === 'google'), ...found]);
        }
        const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
        const gsc = featurePayload(organic);
        const ga = featurePayload(traffic);
        const halves = clickHalves(gsc.daily);
        const crawl = auditRes?.ok ? auditRes.data : null;
        const built = buildAuditFindings({
          audit,
          pages,
          queries: organic,
          landings,
          changes,
          crawl,
        });
        const counts = issueCounts(built.findings);
        const history = historyItems(changes);
        const recent = [...history]
          .sort((a, b) => String(b.appliedAt || b.updatedAt || '').localeCompare(String(a.appliedAt || a.updatedAt || '')))
          .slice(0, 8);
        const monthChanges = recent.map(changeRowCopy);
        const published = publishedRows(
          changes,
          (featurePayload(pages).rows || []).map((r) => ({ label: r[0], clicks: r[1], impressions: r[2], position: r[4] })),
        );
        const visitorDelta =
          halves && halves.earlier.clicks != null
            ? halves.latest.clicks - halves.earlier.clicks
            : null;
        const clicksMo = kpiNum(gsc, 'click');
        const sessions = kpiNum(ga, 'session');
        const events = kpiNum(ga, 'event') || kpiNum(ga, 'engag') || kpiNum(ga, 'conver');
        const storedLinks = featurePayload(backlinks);
        const liveLinks = linkRes?.ok ? linkRes.data || {} : {};
        const bl = (liveLinks.links || []).length >= (storedLinks.rows || storedLinks.links || []).length ? liveLinks : storedLinks;
        const refDomains =
          Number(bl.summary?.referringDomains) ||
          Number(bl.rows?.length) ||
          Number(String(bl.kpis?.[0]?.[1] || '').replace(/[^\d.]/g, '')) ||
          Number((bl.links || []).length) ||
          0;
        const linkRows = Array.isArray(bl.rows) ? bl.rows : Array.isArray(bl.links) ? bl.links : [];
        const linksNew = linkRows.filter((r) => {
          const state = Array.isArray(r) ? r[6] || r[3] : r.state || r.status;
          return String(state || '').toLowerCase() === 'new';
        }).length;
        const linksLost = linkRows.filter((r) => {
          const state = Array.isArray(r) ? r[6] || r[3] : r.state || r.status;
          return String(state || '').toLowerCase() === 'lost';
        }).length;
        const newNames = linkRows
          .filter((r) => {
            const state = Array.isArray(r) ? r[6] || r[3] : r.state || r.status;
            return String(state || '').toLowerCase() === 'new';
          })
          .slice(0, 2)
          .map((r) => (Array.isArray(r) ? r[0] : r.domain || r.source || ''))
          .filter(Boolean);
        const queueNext = changes
          .filter((c) => ['proposed', 'awaiting_approval', 'approved'].includes(c.status))
          .slice(0, 3)
          .map((c) => String(c.opportunity || c.proposed?.title || changePath(c)).trim())
          .filter(Boolean);
        const winning = changes.filter((c) => c.status === 'monitoring' || c.status === 'applied').length;
        const passing =
          Math.max(0, (built.findings?.length || 0) - counts.errors - counts.warnings) || counts.notices;

        const bizProfile = biz?.ok ? biz.data?.profile || biz.data || {} : {};
        const agency =
          bizProfile.business ||
          bizProfile.agencyName ||
          bizProfile.businessName ||
          (workspace.ok && workspace.data?.members?.find((m) => m.role === 'owner')?.displayName) ||
          acct?.displayName ||
          EMPTY.agency;
        const contact = acct?.email || '';

        let visitorsDisplay = '—';
        let visitorsSub = 'From Search Console';
        if (visitorDelta != null && visitorDelta !== 0) {
          visitorsDisplay = `${visitorDelta > 0 ? '+' : ''}${visitorDelta}`;
          visitorsSub = 'Latest 14 days vs prior 14 (Search Console)';
        } else if (clicksMo) {
          visitorsDisplay = `+${clicksMo}`;
          visitorsSub = 'Monthly clicks from Search Console';
        } else if (visitorDelta === 0) {
          visitorsDisplay = '0';
          visitorsSub = 'Clicks held steady over the last 28 days';
        }

        let callsDisplay = '—';
        if (events) callsDisplay = `≈ ${Math.round(events)}`;
        else if (sessions) callsDisplay = `≈ ${Math.max(1, Math.round(sessions / 30))}`;

        const emailBody = monthEmail({
          host: hostname,
          halves,
          published,
          counts,
          visibility: null,
          plan: queueNext.map((keyword) => ({ keyword, status: 'Queued', date: '' })),
        });

        setView({
          agency,
          contact,
          month: `${monthName} report`,
          nextMonth: nextMonthName,
          headline: brand && brand !== 'your-site' ? `${brand} is getting found more often.` : EMPTY.headline,
          visitors: visitorsDisplay,
          visitorsSub,
          calls: callsDisplay,
          changes: monthChanges,
          linksTotal: String(refDomains),
          linksTotalSub: refDomains ? 'websites link to you' : 'no referring sites stored yet',
          linksNew: linksNew ? `+${linksNew}` : '0',
          linksNewSub: newNames.length ? `new this month, including ${newNames[0]}` : 'new this month',
          linksLost: String(linksLost),
          linksLostSub: linksLost ? 'lost this month' : 'lost this month',
          health: {
            red: counts.errors || 0,
            yellow: counts.warnings || 0,
            green: passing || 0,
            blue: winning || published.length || 0,
          },
          next: queueNext,
          pendingNote:
            queueNext.length > 0
              ? `${queueNext.length} of these need your OK before they go live.`
              : 'Nothing waiting for approval.',
          emailBody,
        });
      })
      .catch(() => {
        if (!cancelled) setView(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/app/month?share=1';
    const u = new URL(window.location.href);
    u.searchParams.set('share', '1');
    return u.toString();
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const downloadPdf = () => {
    const body = view.emailBody || `Searchify report — ${view.month}\n${view.headline}`;
    const blob = new Blob(
      [
        `<!doctype html><html><head><meta charset="utf-8"><title>${view.month}</title>`,
        `<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#111;line-height:1.5}h1{font-size:28px}pre{white-space:pre-wrap}</style>`,
        `</head><body><h1>${view.agency} · ${view.month}</h1><p>${view.headline}</p><pre>${body.replace(/</g, '&lt;')}</pre>`,
        `<p style="color:#666;font-size:12px">Every change listed here can be undone. · Made with Searchify</p></body></html>`,
      ].join(''),
      { type: 'text/html' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `searchify-report-${view.month.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ minHeight: 1550, background: '#0A0B0D', color: '#F2F4F5', fontFamily: "Geist, 'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {!clientView && (
        <div style={{ background: '#131519', borderBottom: '1px solid #262A31' }} className="sfy-report-toolbar">
          <div style={{ maxWidth: '900px', margin: '0 auto', boxSizing: 'border-box', padding: '12px clamp(16px, 4vw, 32px)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#9AA1AB', marginRight: 'auto' }}>Only you see this bar · the client sees the report below</span>
            <Link href="/app/history" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '38px', padding: '0 12px', borderRadius: '10px', border: '1px solid #262A31', color: '#D7DADE', textDecoration: 'none', fontSize: '13px' }}>
              Edit sections
            </Link>
            {gscLink ? (
              <a href={gscLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '38px', padding: '0 12px', borderRadius: '10px', border: '1px solid #262A31', color: '#D7DADE', textDecoration: 'none', fontSize: '13px' }}>
                Open Search Console ↗
              </a>
            ) : null}
            <button type="button" onClick={downloadPdf} style={{ minHeight: '38px', padding: '0 12px', borderRadius: '10px', border: '1px solid #262A31', background: 'transparent', color: '#D7DADE', fontSize: '13px' }}>
              Download PDF
            </button>
            <button type="button" onClick={copyLink} style={{ minHeight: '38px', padding: '0 14px', borderRadius: '10px', border: 0, background: '#4DA3FF', color: '#0A0B0D', fontSize: '13px', fontWeight: '600', boxShadow: '0 0 18px rgba(77,163,255,.4)' }}>
              {copied ? 'Link copied' : 'Copy client link'}
            </button>
          </div>
        </div>
      )}

      <main style={{ maxWidth: '900px', width: '100%', margin: '0 auto', boxSizing: 'border-box', padding: '48px clamp(16px, 4vw, 32px) 72px', display: 'flex', flexDirection: 'column', gap: '44px' }}>
        {loading ? <SkeletonCards count={3} lines={4} /> : (
        <>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: '#9AA1AB' }}>
            <span style={{ fontWeight: '600', color: '#F2F4F5' }}>{view.agency}</span>
            <span>{view.month}</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1, letterSpacing: '-1.8px', fontWeight: '700', minWidth: 0, overflowWrap: 'break-word' }}>
            {view.headline}
          </h1>
        </header>

        {!clientView ? <ProblemNotice problems={problems} /> : null}

        <section aria-label="Headline results" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <div style={{ borderRadius: '22px', background: '#101215', border: '1px solid #1A1D22', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: '64px', lineHeight: '0.9', fontWeight: '800', letterSpacing: '-2px', color: accent }}>{view.visitors}</span>
            <span style={{ fontSize: '15px' }}>more visitors a month from Google</span>
            <span style={{ fontSize: '13px', color: '#9AA1AB' }}>{view.visitorsSub}</span>
          </div>
          <div style={{ borderRadius: '22px', background: '#101215', border: '1px solid #1A1D22', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: '64px', lineHeight: '0.9', fontWeight: '800', letterSpacing: '-2px', color: accent }}>{view.calls}</span>
            <span style={{ fontSize: '15px' }}>extra calls or quote requests a month</span>
            <span style={{ fontSize: '13px', color: '#9AA1AB' }}>From your Google Analytics</span>
          </div>
        </section>

        <section aria-labelledby="did-h" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 id="did-h" style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>What we changed this month</h2>
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #1A1D22' }}>
            {view.changes.length ? (
              view.changes.map((row, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: '1px solid #1A1D22', flexWrap: 'wrap' }}>
                  <span style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '15px' }}>{row.title}</span>
                    <span style={{ fontSize: '13px', color: '#9AA1AB' }}>{row.sub}</span>
                  </span>
                  <span style={{ fontSize: '14px', color: row.accent ? accent : '#9AA1AB' }}>{row.result}</span>
                </div>
              ))
            ) : (
              <p style={{ margin: '16px 0', fontSize: '14px', color: '#9AA1AB' }}>No shipped changes in this window yet.</p>
            )}
          </div>
        </section>

        <section aria-labelledby="links-h" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 id="links-h" style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Websites linking to you</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div style={{ borderRadius: '16px', border: '1px solid #262A31', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '26px', fontWeight: '700' }}>{view.linksTotal}</span>
              <span style={{ fontSize: '13px', color: '#9AA1AB' }}>{view.linksTotalSub}</span>
            </div>
            <div style={{ borderRadius: '16px', border: '1px solid #262A31', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '26px', fontWeight: '700', color: accent }}>{view.linksNew}</span>
              <span style={{ fontSize: '13px', color: '#9AA1AB' }}>{view.linksNewSub}</span>
            </div>
            <div style={{ borderRadius: '16px', border: '1px solid #262A31', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '26px', fontWeight: '700' }}>{view.linksLost}</span>
              <span style={{ fontSize: '13px', color: '#9AA1AB' }}>{view.linksLostSub}</span>
            </div>
          </div>
          <span style={{ fontSize: '14px', color: '#9AA1AB', lineHeight: '1.5' }}>Links from trusted local websites tell Google you&apos;re a real, recommended business.</span>
        </section>

        <section aria-labelledby="health-h" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 id="health-h" style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Your site&apos;s health</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
            <div style={{ borderRadius: '16px', border: '1px solid rgba(255,90,78,.5)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '26px', fontWeight: '700' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5A4E' }} />
                {view.health.red}
              </span>
              <span style={{ fontSize: '13px', color: '#9AA1AB' }}>urgent fixes</span>
            </div>
            <div style={{ borderRadius: '16px', border: '1px solid #262A31', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '26px', fontWeight: '700' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFC53D' }} />
                {view.health.yellow}
              </span>
              <span style={{ fontSize: '13px', color: '#9AA1AB' }}>can wait</span>
            </div>
            <div style={{ borderRadius: '16px', border: '1px solid #262A31', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '26px', fontWeight: '700' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3DDC84' }} />
                {view.health.green}
              </span>
              <span style={{ fontSize: '13px', color: '#9AA1AB' }}>passing</span>
            </div>
            <div style={{ borderRadius: '16px', border: '1px solid #262A31', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '26px', fontWeight: '700' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4DA3FF' }} />
                {view.health.blue}
              </span>
              <span style={{ fontSize: '13px', color: '#9AA1AB' }}>winning, protected</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="next-h" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 id="next-h" style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>
            Coming up in {view.nextMonth}
          </h2>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {view.next.length === 0 && <li style={{ fontSize: '14px', color: '#9AA1AB' }}>No queued moves yet.</li>}
            {view.next.map((line, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '14px', fontSize: '15px' }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", color: '#9AA1AB' }}>{String(idx + 1).padStart(2, '0')}</span>
                {line}
              </li>
            ))}
          </ol>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', padding: '18px', borderRadius: '18px', border: '1px solid #4DA3FF', boxShadow: '0 0 24px rgba(77,163,255,.18)' }}>
            <span style={{ flex: '1 1 260px', fontSize: '15px' }}>{view.pendingNote}</span>
            {view.next.length > 0 && (
              <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '48px', padding: '0 20px', borderRadius: '12px', background: '#4DA3FF', color: '#0A0B0D', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>
                Review them
              </Link>
            )}
          </div>
        </section>

        <footer style={{ paddingTop: '20px', borderTop: '1px solid #1A1D22', fontSize: '13px', color: '#7D848E', lineHeight: '1.6' }}>
          Every change listed here can be undone.
          {view.contact ? (
            <>
              {' '}
              Questions? Contact {view.contact}.
            </>
          ) : null}{' '}
          · Made with Searchify
        </footer>
        </>
        )}
      </main>
    </div>
  );
}
