'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  researchBacklinks,
  loadFeature,
  featurePayload,
  getBusinessProfile,
} from '@/lib/v1Api';
import { activeSiteContext } from '@/lib/siteContext';
import { loadJourney } from '@/lib/journey';
import { SkeletonCards } from '@/components/v8/SkeletonWave';
import '@/styles/v8-screens.css';

function strengthScore(link) {
  const raw = link.domainRank ?? link.rank ?? 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return n > 100 ? Math.min(100, Math.round(n / 10)) : Math.round(n);
}

function linkKind(link) {
  const title = String(link.pageTitle || '').trim();
  if (title) return title.length > 42 ? `${title.slice(0, 39)}…` : title;
  return 'Referring site';
}

function mapLinkRow(link) {
  const stateRaw = String(link.state || 'Active');
  const statusKey = stateRaw === 'Lost' ? 'lost' : stateRaw === 'New' ? 'new' : 'live';
  let page = '/';
  try {
    page = new URL(link.target || 'https://example.com/').pathname || '/';
  } catch {
    page = link.target || '/';
  }
  const when =
    statusKey === 'lost'
      ? link.lostDate || link.lastSeen || '—'
      : statusKey === 'new'
        ? link.firstSeen || link.lastSeen || '—'
        : link.firstSeen ? `since ${String(link.firstSeen).slice(0, 7)}` : 'live';
  return [
    link.domain || 'unknown',
    linkKind(link),
    strengthScore(link),
    page,
    link.anchor || link.domain || '',
    link.follow === 'Follow' ? 'follow' : 'nofollow',
    statusKey,
    when,
  ];
}

function guessEmail(domain) {
  const d = String(domain || '').replace(/^www\./, '');
  if (!d || d === 'unknown') return '';
  return `editor@${d}`;
}

function buildOutreachMoves(links, concepts, hostname) {
  const moves = [];
  const lost = links.filter((l) => String(l.state) === 'Lost');
  if (lost[0]) {
    const link = lost[0];
    moves.push({
      tag: 'WIN BACK A LOST LINK',
      title: `${link.domain} removed its link to your page.`,
      why: link.seen || `It pointed at ${link.target || hostname}. Open the source page before outreach.`,
      cta: 'Draft the email',
      to: guessEmail(link.domain),
      subject: `Small fix on your link to ${hostname}`,
      body: `Hi there,\n\nIt looks like a link to our page went missing:\n${link.target || hostname}\n\nWould you be able to add it back? We just refreshed the page, so it should still be useful for your readers.\n\nThanks,\n${hostname}`,
      done: "Sent. We'll check that page every week and tell you when the link is back.",
      sourceUrl: link.url || link.sourceUrl || '',
    });
  }
  const mention = (concepts || []).find((row) => {
    const blob = `${row.concept || ''} ${row.title || ''} ${row.why || ''}`.toLowerCase();
    return blob.includes('mention') || blob.includes('unlinked') || blob.includes('without a link');
  });
  if (mention && moves.length < 3) {
    moves.push({
      tag: 'TURN A MENTION INTO A LINK',
      title: `${mention.title || mention.domain || 'A site'} mentioned you without a link.`,
      why: mention.why || mention.detail || 'Asking to add a link to a mention that’s already there is the easiest link to get.',
      cta: 'Draft the email',
      to: guessEmail(mention.domain),
      subject: `Thanks for mentioning ${hostname}`,
      body: `Hi,\n\nThanks for mentioning us. Would you be open to linking our name to ${hostname} so readers can find us easily?\n\nBest,\n${hostname}`,
      done: 'Sent. Mentions that already name you get a link back more often than any other request.',
      sourceUrl: mention.url || '',
    });
  }
  const gapConcept = (concepts || []).find((row) => {
    const blob = `${row.concept || ''} ${row.title || ''}`.toLowerCase();
    return blob.includes('gap') || blob.includes('directory') || blob.includes('competitor');
  });
  if (gapConcept && moves.length < 3) {
    moves.push({
      tag: 'GET LISTED',
      title: gapConcept.title || `${gapConcept.domain || 'A trusted directory'} lists competitors but not you.`,
      why: gapConcept.why || gapConcept.detail || 'Trusted local directories are strong signals and customers browse them.',
      cta: gapConcept.cta || 'Open the application',
      to: '',
      subject: '',
      body: '',
      done: 'Application started with your business details. Finish it on their site.',
      sourceUrl: gapConcept.url || '',
    });
  }
  const active = links.filter((l) => String(l.state) === 'Active' || String(l.state) === 'New');
  const strong = active.filter((l) => strengthScore(l) >= 40);
  if (strong[0] && moves.length < 3) {
    const link = strong[0];
    moves.push({
      tag: 'GET LISTED',
      title: `${link.domain} is a strong link to ${pageFromTarget(link.target)}.`,
      why: `Strength ${strengthScore(link)}. Keep this relationship — ask for another mention when you publish an update.`,
      cta: 'Open the source page',
      to: '',
      subject: '',
      body: '',
      done: 'Source page opened. Searchify will recheck this domain on the next weekly scan.',
      sourceUrl: link.url || link.sourceUrl || '',
    });
  }
  return moves.slice(0, 3);
}

function normalizeLinksPayload(data) {
  if (!data) return { links: [], summary: null, concepts: [], fetchedAt: '' };
  const root = data.links || data.payload || data;
  const links = Array.isArray(root?.links)
    ? root.links
    : Array.isArray(root)
      ? root
      : Array.isArray(data.rows)
        ? data.rows.map((r) =>
            Array.isArray(r)
              ? {
                  domain: r[0],
                  pageTitle: r[1],
                  domainRank: r[2],
                  target: r[3],
                  anchor: r[4],
                  follow: r[5] === 'follow' || r[5] === 'Follow' ? 'Follow' : 'Nofollow',
                  state: r[6] === 'new' ? 'New' : r[6] === 'lost' ? 'Lost' : 'Active',
                  firstSeen: r[7],
                }
              : r,
          )
        : [];
  return {
    links,
    summary: root?.summary || data.summary || null,
    concepts: Array.isArray(root?.concepts) ? root.concepts : Array.isArray(data.concepts) ? data.concepts : [],
    fetchedAt: root?.fetchedAt || data.fetchedAt || '',
  };
}

function monthLabels() {
  const labels = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString('en-US', { month: 'short' }));
  }
  return labels;
}

function buildTrend(domainsNow, newN, lostN, history) {
  if (Array.isArray(history) && history.length >= 6) {
    const slice = history.slice(-12);
    while (slice.length < 12) slice.unshift(slice[0] || { total: domainsNow, neu: 0, lost: 0 });
    return {
      TOT: slice.map((h) => Number(h.total ?? h.domains ?? domainsNow) || 0),
      NEW: slice.map((h) => Number(h.new ?? h.neu ?? 0) || 0),
      LOST: slice.map((h) => Number(h.lost ?? 0) || 0),
    };
  }
  const start = Math.max(0, domainsNow - Math.max(newN * 4, 8));
  const TOT = Array.from({ length: 12 }, (_, i) => Math.round(start + ((domainsNow - start) * i) / 11));
  const NEW = Array.from({ length: 12 }, (_, i) => (i === 11 ? newN : i > 7 ? Math.max(0, Math.round(newN / 3)) : 0));
  const LOST = Array.from({ length: 12 }, (_, i) => (i === 11 ? lostN : i > 8 ? Math.max(0, Math.round(lostN / 2)) : 0));
  return { TOT, NEW, LOST };
}

function pageFromTarget(target) {
  try {
    return new URL(target || 'https://example.com/').pathname || '/';
  } catch {
    return '/';
  }
}

export default function BacklinksScreen() {
  const [move, setMove] = useState(0);
  const [stage, setStage] = useState('idle');
  const [tab, setTab] = useState('newlost');
  const [followOnly, setFollowOnly] = useState(false);
  const [gapDone, setGapDone] = useState({});
  const [flagState, setFlagState] = useState({});
  const [done, setDone] = useState([]);
  const [draftBody, setDraftBody] = useState('');
  const [liveLinks, setLiveLinks] = useState(null);
  const [liveSummary, setLiveSummary] = useState(null);
  const [liveConcepts, setLiveConcepts] = useState([]);
  const [fetchedAt, setFetchedAt] = useState('');
  const [orphans, setOrphans] = useState([]);
  const [senderEmail, setSenderEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const { hostname, href } = activeSiteContext(loadJourney());

  useEffect(() => {
    const site = href || activeSiteContext(loadJourney()).href || '';
    let cancel = false;
    setLoading(true);
    Promise.all([
      site ? researchBacklinks({ site, force: true }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
      loadFeature('backlinks').catch(() => ({ ok: false })),
      loadFeature('top-pages').catch(() => ({ ok: false })),
      getBusinessProfile().catch(() => ({ ok: false })),
    ])
      .then(([res, feat, pagesFeat, prof]) => {
        if (cancel) return;
        const fromResearch = res?.ok ? normalizeLinksPayload(res.data) : null;
        const fromFeat = normalizeLinksPayload(featurePayload(feat));
        const pick =
          fromResearch?.links?.length >= (fromFeat.links?.length || 0) ? fromResearch : fromFeat.links?.length ? fromFeat : fromResearch || fromFeat;
        setLiveLinks(pick.links || []);
        setLiveSummary(pick.summary || null);
        setLiveConcepts(pick.concepts || []);
        setFetchedAt(pick.fetchedAt || '');

        if (prof?.ok && prof.data) {
          setSenderEmail(prof.data.email || prof.data.workEmail || '');
        }

        const linked = new Set((pick.links || []).map((l) => pageFromTarget(l.target)));
        const tp = featurePayload(pagesFeat);
        const pageRows = tp.rows || tp.pages || [];
        const orphanRows = [];
        for (const row of pageRows) {
          const raw = Array.isArray(row) ? row[0] : row?.url || row?.page || row?.path;
          let path = '/';
          try {
            path = raw?.startsWith?.('http') ? new URL(raw).pathname : String(raw || '/');
          } catch {
            path = String(raw || '/');
          }
          if (!path || path === '/' || linked.has(path)) continue;
          orphanRows.push({
            path,
            why: '0 outside links so far. Local directories, partners and community pages are a good fit.',
          });
          if (orphanRows.length >= 3) break;
        }
        setOrphans(orphanRows);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [hostname, href]);

  const MOVES = useMemo(() => {
    if (!liveLinks?.length) return [];
    return buildOutreachMoves(liveLinks, liveConcepts, hostname);
  }, [liveLinks, liveConcepts, hostname]);

  const idx = move;
  const has = MOVES.length > 0 && idx < MOVES.length;
  const mv = has ? MOVES[idx] : null;

  const nextMove = (skipped) => {
    setMove(idx + 1);
    setStage('idle');
    setDraftBody('');
    setDone(skipped ? done : [...done, idx]);
  };

  const openDraft = () => {
    if (mv?.body) {
      setDraftBody(mv.body);
      setStage('draft');
      return;
    }
    if (mv?.sourceUrl) {
      try {
        window.open(mv.sourceUrl, '_blank', 'noopener,noreferrer');
      } catch {
        /* ignore */
      }
    }
    setStage('done');
  };

  const sendDraft = () => {
    const to = mv?.to || '';
    const subject = encodeURIComponent(mv?.subject || '');
    const body = encodeURIComponent(draftBody || mv?.body || '');
    if (to) {
      try {
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      } catch {
        /* ignore */
      }
    }
    setStage('done');
  };

  const months = monthLabels();
  const domainsNow = liveSummary?.referringDomains ?? liveLinks?.length ?? 0;
  const newCount = (liveLinks || []).filter((l) => String(l.state) === 'New').length;
  const lostCount = (liveLinks || []).filter((l) => String(l.state) === 'Lost').length;
  const { TOT, NEW, LOST } =
    domainsNow > 0
      ? buildTrend(domainsNow, newCount, lostCount, liveSummary?.history || liveSummary?.monthly)
      : { TOT: [], NEW: [], LOST: [] };
  const chartMax = Math.max(45, ...TOT, 1);
  const X = (i) => 60 + i * (562 / 11);
  const Y = (v) => 150 - (v / chartMax) * 140;
  const line = TOT.length ? TOT.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ') : '';
  const area = line ? line + ' L' + X(11).toFixed(1) + ' 150 L' + X(0).toFixed(1) + ' 150 Z' : '';
  const pts = TOT.map((v, i) => ({ x: X(i).toFixed(1), y: Y(v).toFixed(1), label: months.at(i), bx: (X(i) - 5).toFixed(1), ny: (196 - (NEW.at(i) || 0) * 8).toFixed(1), nh: String((NEW.at(i) || 0) * 8), lh: String((LOST.at(i) || 0) * 8) }));
  const grid = [0.25, 0.5, 0.75, 1].map((f) => {
    const v = Math.round(chartMax * f);
    return { y: Y(v).toFixed(1), ty: (Y(v) + 4).toFixed(1), label: String(v) };
  });

  const L = useMemo(() => {
    if (liveLinks?.length) return liveLinks.map(mapLinkRow);
    return [];
  }, [liveLinks]);

  const pageCounts = useMemo(() => {
    const counts = new Map();
    (liveLinks || []).forEach((link) => {
      const path = pageFromTarget(link.target);
      counts.set(path, (counts.get(path) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [liveLinks]);

  const P = useMemo(() => {
    if (pageCounts.length) return pageCounts.slice(0, 6);
    return [];
  }, [pageCounts]);

  const headerStats = useMemo(() => {
    if (!liveSummary && !liveLinks?.length) {
      return { domains: 0, newN: 0, lostN: 0, totalLinks: 0, strong: 0, flagged: 0 };
    }
    const links = liveLinks || [];
    const domains = liveSummary?.referringDomains ?? links.length;
    const newN = links.filter((l) => String(l.state) === 'New').length;
    const lostN = links.filter((l) => String(l.state) === 'Lost').length;
    const strong = links.filter((l) => strengthScore(l) >= 40).length;
    const flagged = links.filter((l) => Number(l.spamScore) >= 60).length;
    return {
      domains: domains ?? links.length,
      newN,
      lostN,
      totalLinks: liveSummary?.backlinks ?? links.length,
      strong,
      flagged,
    };
  }, [liveLinks, liveSummary]);

  const updatedLabel = loading
    ? 'Loading link index…'
    : fetchedAt
      ? `Updated weekly · last check ${String(fetchedAt).slice(0, 10)}`
      : liveLinks != null
        ? 'Updated weekly'
        : 'No link crawl yet';

  const sendLabel = senderEmail ? `Send from ${senderEmail}` : 'Send email draft';
  const moveTotal = Math.max(MOVES.length, 1);

  const ST = { new: ['New', '#3DDC84'], lost: ['Lost', '#FF8A80'], live: ['Linking', '#9AA1AB'] };
  let src = tab === 'newlost' ? L.filter((r) => r.at(6) !== 'live') : L.slice().sort((a, b) => b.at(2) - a.at(2));
  if (tab === 'all' && followOnly) src = src.filter((r) => r.at(5) === 'follow');

  const rows = src.map((r) => ({
    site: r.at(0),
    kind: r.at(1),
    str: String(r.at(2)),
    bar: r.at(2) + '%',
    barColor: r.at(2) >= 50 ? '#3DDC84' : (r.at(2) >= 30 ? '#2CC7C0' : '#7D848E'),
    page: r.at(3),
    anchor: r.at(4),
    type: r.at(5) === 'follow' ? 'Passes strength' : 'Nofollow',
    typeColor: r.at(5) === 'follow' ? '#3DDC84' : '#7D848E',
    status: ST[r.at(6)].at(0),
    color: ST[r.at(6)].at(1),
    when: r.at(7)
  }));

  const G = (liveConcepts || [])
    .filter((row) => String(row.concept || '').toLowerCase().includes('gap') || String(row.concept || '').toLowerCase().includes('competitor'))
    .slice(0, 6)
    .map((row) => [
      row.domain || row.title || 'Competitor site',
      strengthScore(row) || row.strength || 0,
      row.who || row.competitors || '—',
      row.type || 'Opportunity',
      row.action === 'pitch' ? 'pitch' : 'apply',
      row.cta || (row.action === 'pitch' ? 'Draft a story pitch' : 'Open application'),
    ]);

  const gap = G.map((g, i) => ({
    site: g.at(0),
    str: String(g.at(1)),
    who: g.at(2),
    type: g.at(3),
    label: gapDone[i] ? (g.at(4) === 'apply' ? 'Started' : 'Draft saved') : g.at(5),
    bg: gapDone[i] ? 'transparent' : '#4DA3FF',
    fg: gapDone[i] ? '#3DDC84' : '#0A0B0D',
    border: gapDone[i] ? '1px solid rgba(61,220,132,.5)' : '0'
  }));

  const FL = (liveLinks || [])
    .filter((l) => Number(l.spamScore) >= 60)
    .slice(0, 8)
    .map((l) => [l.domain || 'unknown', l.seen || `Spam score ${l.spamScore}`]);
  const flags = FL.map((f, i) => ({
    site: f.at(0),
    why: f.at(1),
    open: !flagState[i],
    state: flagState[i] === 'ignore' ? 'Ignored' : (flagState[i] === 'disavow' ? 'On your disavow list' : `Low trust · ${FL.length}`),
    color: flagState[i] === 'disavow' ? '#FFC53D' : (flagState[i] ? '#9AA1AB' : '#FF8A80')
  }));

  const nd = done.length;

  return (
      <div style={{ flex: '999 1 560px', minWidth: 0, minHeight: 1400, background: '#0A0B0D', color: '#F2F4F5', fontFamily: 'Geist, \'Helvetica Neue\', sans-serif', boxSizing: 'border-box', padding: '28px clamp(16px, 4vw, 48px) 56px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        <header style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: '\'Bricolage Grotesque\', Geist, sans-serif', fontSize: '15px', fontWeight: '800', letterSpacing: '1.6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2CC7C0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"></path><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path></svg>
              BACKLINKS
            </span>
            <h1 style={{ margin: '0', fontFamily: '\'Bricolage Grotesque\', Geist, sans-serif', fontSize: 'clamp(30px, 3.6vw, 46px)', lineHeight: '1.04', letterSpacing: '-1.3px', fontWeight: '700', minWidth: 0, overflowWrap: 'break-word' }}>
              {headerStats.domains} websites link to you.
              {headerStats.newN > 0 ? (
                <>
                  {' '}
                  <span style={{ color: '#3DDC84' }}>{headerStats.newN} new</span>
                  {headerStats.lostN > 0 ? ' this month, ' : ' this month.'}
                </>
              ) : null}
              {headerStats.lostN > 0 ? (
                <span style={{ color: '#FF8A80' }}>{headerStats.lostN} lost</span>
              ) : null}
              {headerStats.lostN > 0 ? '.' : null}
            </h1>
            <span style={{ fontSize: '15px', color: '#9AA1AB' }}>Other websites linking to {hostname}. Links from trusted local sites are one of the strongest signs to Google that you&apos;re worth ranking.</span>
          </div>
          <span style={{ fontSize: '12px', color: '#7D848E' }}>{updatedLabel}</span>
        </header>

        <section aria-label="Totals" style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          {[
            {
              label: 'Websites linking to you',
              value: loading ? '…' : String(headerStats.domains),
              sub: headerStats.newN ? `+${headerStats.newN} new in this list` : 'From live link index',
              color: '#3DDC84',
            },
            {
              label: 'Total links',
              value: loading ? '…' : String(headerStats.totalLinks),
              sub: 'many sites link more than once',
              color: '#9AA1AB',
            },
            {
              label: 'Strong links',
              value: loading ? '…' : String(headerStats.strong),
              sub: 'from sites with strength 40+',
              color: '#3DDC84',
            },
            {
              label: 'Flagged as low trust',
              value: loading ? '…' : String(headerStats.flagged),
              sub: 'usually nothing to do',
              color: '#FFC53D',
            },
          ].map((k, i) => (
            <div key={i} style={{ borderRadius: '18px', padding: '16px 18px', background: '#101215', border: '1px solid #1A1D22', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#9AA1AB' }}>{k.label}</span>
              <span style={{ fontFamily: '\'Bricolage Grotesque\', Geist, sans-serif', fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', lineHeight: '1' }}>{k.value}</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: k.color }}>{k.sub}</span>
            </div>
          ))}
        </section>

        <div style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' }}>
          <section aria-labelledby="move-h" style={{ flex: '1 1 380px', minWidth: '0', borderRadius: '22px', background: '#131519', border: '1.5px solid #4DA3FF', boxShadow: '0 0 26px rgba(77,163,255,.18)', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', animation: 'sfy-rise .3s ease both' }}>
            {has ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontFamily: '\'Geist Mono\', monospace', fontSize: '12px', fontWeight: '500', color: '#4DA3FF', background: 'rgba(77,163,255,.1)', border: '1px solid rgba(77,163,255,.5)', padding: '5px 10px', borderRadius: '999px' }}>{mv.tag}</span>
                  <span style={{ fontSize: '12px', color: '#7D848E' }}>
                    Link move {idx + 1} of {moveTotal}
                  </span>
                </span>
                <h2 id="move-h" style={{ margin: '0', fontSize: '21px', fontWeight: '600', lineHeight: '1.3' }}>{mv.title}</h2>
                <span style={{ fontSize: '14px', color: '#9AA1AB', lineHeight: '1.55' }}>{mv.why}</span>
                {stage === 'draft' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'sfy-rise .25s ease both' }}>
                    <span style={{ fontSize: '13px', color: '#9AA1AB' }}>To: <span style={{ color: '#F2F4F5' }}>{mv.to || '—'}</span></span>
                    <span style={{ fontSize: '13px', color: '#9AA1AB' }}>Subject: <span style={{ color: '#F2F4F5' }}>{mv.subject}</span></span>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#9AA1AB' }}>
                      Message (edit anything)
                      <textarea
                        rows="7"
                        value={draftBody}
                        onChange={(e) => setDraftBody(e.target.value)}
                        style={{ padding: '12px', borderRadius: '12px', border: '1px solid #262A31', background: '#0A0B0D', color: '#F2F4F5', font: 'inherit', fontSize: '14px', lineHeight: '1.5', resize: 'vertical' }}
                      />
                    </label>
                  </div>
                )}
                {stage === 'done' && <p role="status" style={{ margin: '0', fontSize: '14px', color: '#3DDC84', lineHeight: '1.5' }}>{mv.done}</p>}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {stage === 'idle' && (
                    <button
                      type="button"
                      onClick={openDraft}
                      style={{ minHeight: '48px', padding: '0 20px', borderRadius: '13px', border: '0', background: '#4DA3FF', color: '#0A0B0D', fontSize: '15px', fontWeight: '600', boxShadow: '0 0 22px rgba(77,163,255,.4)' }}
                    >
                      {mv.cta}
                    </button>
                  )}
                  {stage === 'draft' && (
                    <button
                      type="button"
                      onClick={sendDraft}
                      style={{ minHeight: '48px', padding: '0 20px', borderRadius: '13px', border: '0', background: '#4DA3FF', color: '#0A0B0D', fontSize: '15px', fontWeight: '600', boxShadow: '0 0 22px rgba(77,163,255,.4)' }}
                    >
                      {sendLabel}
                    </button>
                  )}
                  {stage === 'done' && (
                    <button
                      type="button"
                      onClick={() => nextMove(false)}
                      style={{ minHeight: '48px', padding: '0 20px', borderRadius: '13px', border: '0', background: '#4DA3FF', color: '#0A0B0D', fontSize: '15px', fontWeight: '600' }}
                    >
                      Next link move
                    </button>
                  )}
                  {stage !== 'done' && (
                    <button
                      type="button"
                      onClick={() => nextMove(true)}
                      style={{ minHeight: '48px', padding: '0 18px', borderRadius: '13px', border: '1px solid #262A31', background: 'transparent', color: '#D7DADE', fontSize: '15px' }}
                    >
                      Skip for now
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loading ? <SkeletonCards count={2} lines={3} /> : null}
                {!loading && (
                <h2 style={{ margin: '0', fontSize: '21px', fontWeight: '600' }}>
                  {liveLinks?.length
                      ? "That's every link move for this week."
                      : 'No link moves yet.'}
                </h2>
                )}
                {!loading && (
                <span style={{ fontSize: '14px', color: '#9AA1AB', lineHeight: '1.5' }}>
                  {liveLinks?.length
                      ? (nd ? `You sent or started ${nd}.` : "You skipped them all; they'll come back next week.") +
                        " We'll check those pages weekly and tell you when a link appears."
                      : 'Run a backlink refresh or wait for the weekly crawl to draft outreach here.'}
                </span>
                )}
                {!loading && !liveLinks?.length && (
                  <Link
                    href="/app/connections"
                    style={{
                      alignSelf: 'flex-start',
                      minHeight: 44,
                      padding: '0 16px',
                      borderRadius: 12,
                      background: '#4DA3FF',
                      color: '#0A0B0D',
                      textDecoration: 'none',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    Plug in
                  </Link>
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="trend-h" style={{ flex: '999 1 460px', minWidth: '0', borderRadius: '22px', background: '#101215', border: '1px solid #1A1D22', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <h2 id="trend-h" style={{ margin: '0', fontSize: '17px', fontWeight: '600' }}>Websites linking to you · 12 months</h2>
              <span style={{ display: 'inline-flex', gap: '12px', fontSize: '12px', color: '#9AA1AB' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3DDC84' }}></span>New</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#FF5A4E' }}></span>Lost</span>
              </span>
            </div>
            {TOT.length ? (
              <svg viewBox="0 0 640 230" role="img" aria-label={`Websites linking to you · ${domainsNow} referring domains`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                {grid.map((g, i) => (
                  <g key={i}>
                    <line x1="40" x2="632" y1={g.y} y2={g.y} stroke="#1A1D22"></line>
                    <text x="32" y={g.ty} textAnchor="end" fontSize="11" fill="#7D848E" fontFamily="Geist Mono, monospace">{g.label}</text>
                  </g>
                ))}
                <path d={area} fill="rgba(44,199,192,.12)"></path>
                <path d={line} fill="none" stroke="#2CC7C0" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ strokeDasharray: '1400', animation: 'sfy-draw 1.2s ease both' }}></path>
                {pts.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3" fill="#2CC7C0"></circle>
                    <rect x={p.bx} y={p.ny} width="10" height={p.nh} rx="2" fill="#3DDC84"></rect>
                    <rect x={p.bx} y="196" width="10" height={p.lh} rx="2" fill="#FF5A4E"></rect>
                    <text x={p.x} y="226" textAnchor="middle" fontSize="11" fill="#7D848E" fontFamily="Geist Mono, monospace">{p.label}</text>
                  </g>
                ))}
                <line x1="40" x2="632" y1="196" y2="196" stroke="#262A31"></line>
                <text x={pts[11].x} y={(Y(domainsNow) - 10).toFixed(1)} textAnchor="middle" fontSize="13" fontWeight="600" fill="#F2F4F5" fontFamily="Geist, sans-serif">{domainsNow}</text>
              </svg>
            ) : (
              <p style={{ margin: 0, fontSize: '14px', color: '#9AA1AB', padding: '24px 0' }}>No link history yet.</p>
            )}
            <span style={{ fontSize: '12px', color: '#7D848E' }}>Line: total websites linking to you. Bars: links gained and lost each month.</span>
          </section>
        </div>

        <section aria-label="Link details" style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div role="tablist" aria-label="Link views" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[['newlost', `New and lost (${L.filter((r) => r.at(6) !== 'live').length})`], ['all', 'All linking websites'], ['pages', 'Your pages'], ['gap', `Competitor gap (${G.length})`], ['flag', `Flagged (${headerStats.flagged})`]].map((t) => (
              <button key={t[0]} type="button" role="tab" aria-selected={tab === t[0] ? 'true' : 'false'} onClick={() => setTab(t[0])} style={{ minHeight: '40px', padding: '0 15px', borderRadius: '999px', border: tab === t[0] ? '1px solid #F2F4F5' : '1px solid #262A31', background: tab === t[0] ? '#F2F4F5' : 'transparent', color: tab === t[0] ? '#0A0B0D' : '#D7DADE', fontSize: '14px', fontWeight: tab === t[0] ? '600' : '400' }}>{t[1]}</button>
            ))}
          </div>

          {(tab === 'newlost' || tab === 'all') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tab === 'all' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#D7DADE', minHeight: '36px' }}>
                  <input type="checkbox" checked={followOnly} onChange={(e) => setFollowOnly(e.target.checked)} />
                  Only links that pass strength to you (not "nofollow")
                </label>
              )}
              <div style={{ borderRadius: '20px', background: '#101215', border: '1px solid #1A1D22', overflowX: 'auto' }}>
                <div style={{ minWidth: '820px' }}>
                  <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) 90px minmax(0, 1.2fr) minmax(0, 1fr) 90px 150px', gap: '12px', padding: '12px 18px', fontFamily: '\'Geist Mono\', monospace', fontSize: '11px', color: '#7D848E', borderBottom: '1px solid #1A1D22' }}>
                    <span>LINKING WEBSITE</span><span>STRENGTH</span><span>LINKS TO YOUR PAGE</span><span>LINK TEXT</span><span>TYPE</span><span>STATUS</span>
                  </div>
                  {rows.length === 0 && (
                    <p style={{ margin: 0, padding: '18px', fontSize: '14px', color: '#9AA1AB' }}>No linking websites in this view yet.</p>
                  )}
                  {rows.map((r, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) 90px minmax(0, 1.2fr) minmax(0, 1fr) 90px 150px', gap: '12px', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #16181C', fontSize: '14px' }}>
                      <span style={{ minWidth: '0', display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.site}</span><span style={{ fontSize: '12px', color: '#7D848E' }}>{r.kind}</span></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '34px', height: '6px', borderRadius: '3px', background: '#1A1D22', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: r.bar, background: r.barColor }}></span></span><span style={{ fontFamily: '\'Geist Mono\', monospace', fontSize: '13px' }}>{r.str}</span></span>
                      <span style={{ fontFamily: '\'Geist Mono\', monospace', fontSize: '12px', color: '#D7DADE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.page}</span>
                      <span style={{ fontSize: '13px', color: '#9AA1AB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&quot;{r.anchor}&quot;</span>
                      <span style={{ fontSize: '12px', color: r.typeColor }}>{r.type}</span>
                      <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '12px', fontWeight: '600', color: r.color }}>{r.status}</span><span style={{ fontSize: '11px', color: '#7D848E' }}>{r.when}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'pages' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ flex: '999 1 480px', minWidth: '0', borderRadius: '20px', background: '#101215', border: '1px solid #1A1D22', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>Your most-linked pages</h3>
                {P.length === 0 && <p style={{ margin: 0, fontSize: '14px', color: '#9AA1AB' }}>No linked pages yet.</p>}
                {P.map((p, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px 0' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '14px' }}><span style={{ fontFamily: '\'Geist Mono\', monospace', fontSize: '13px' }}>{p[0]}</span><span style={{ color: '#9AA1AB' }}>{p[1]} sites</span></span>
                    <div style={{ height: '8px', borderRadius: '4px', background: '#1A1D22', overflow: 'hidden' }}><div style={{ height: '100%', width: Math.round(p[1] / Math.max(P[0]?.[1] || 1, 1) * 100) + '%', borderRadius: '4px', background: '#2CC7C0' }}></div></div>
                  </div>
                ))}
              </div>
              <div style={{ flex: '1 1 320px', minWidth: '0', borderRadius: '20px', background: '#101215', border: '1px solid rgba(255,197,61,.4)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>Important pages no one links to</h3>
                {orphans.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '14px', color: '#9AA1AB', lineHeight: '1.45' }}>
                    No orphan-page suggestions yet. After a crawl, Searchify will list money pages with zero outside links.
                  </p>
                ) : (
                  orphans.map((o) => (
                    <div
                      key={o.path}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: '#0A0B0D',
                        border: '1px solid #1A1D22',
                      }}
                    >
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '13px' }}>{o.path}</span>
                      <span style={{ fontSize: '13px', color: '#9AA1AB', lineHeight: '1.45' }}>{o.why}</span>
                    </div>
                  ))
                )}
                <span style={{ fontSize: '12px', color: '#7D848E' }}>Pages that bring in money but have no outside links usually rank lower than they could.</span>
              </div>
            </div>
          )}

          {tab === 'gap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '14px', color: '#9AA1AB' }}>
                Websites that link to competitors but not to you
                {G.length ? ` · ${G.length} opportunities` : ''}.
              </span>
              <div style={{ borderRadius: '20px', background: '#101215', border: '1px solid #1A1D22', overflowX: 'auto' }}>
                <div style={{ minWidth: '760px' }}>
                  <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) 90px minmax(0, 1.4fr) 110px 170px', gap: '12px', padding: '12px 18px', fontFamily: '\'Geist Mono\', monospace', fontSize: '11px', color: '#7D848E', borderBottom: '1px solid #1A1D22' }}>
                    <span>WEBSITE</span><span>STRENGTH</span><span>LINKS TO</span><span>TYPE</span><span style={{ textAlign: 'right' }}>NEXT STEP</span>
                  </div>
                  {gap.length === 0 && (
                    <p style={{ margin: 0, padding: '18px', fontSize: '14px', color: '#9AA1AB' }}>No competitor-gap opportunities yet.</p>
                  )}
                  {gap.map((g, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) 90px minmax(0, 1.4fr) 110px 170px', gap: '12px', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #16181C', fontSize: '14px' }}>
                      <span style={{ fontWeight: '500', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.site}</span>
                      <span style={{ fontFamily: '\'Geist Mono\', monospace', fontSize: '13px' }}>{g.str}</span>
                      <span style={{ fontSize: '13px', color: '#9AA1AB' }}>{g.who}</span>
                      <span style={{ fontSize: '12px', color: '#D7DADE' }}>{g.type}</span>
                      <span style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" onClick={() => setGapDone({ ...gapDone, [i]: true })} style={{ minHeight: '36px', padding: '0 12px', borderRadius: '10px', border: g.border, background: g.bg, color: g.fg, fontSize: '13px', fontWeight: '600' }}>{g.label}</button></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'flag' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ flex: '999 1 520px', minWidth: '0', borderRadius: '20px', background: '#101215', border: '1px solid #1A1D22', padding: '6px' }}>
                {flags.length === 0 && (
                  <p style={{ margin: 0, padding: '14px', fontSize: '14px', color: '#9AA1AB' }}>No low-trust links flagged.</p>
                )}
                {flags.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '14px 14px', borderBottom: '1px solid #16181C' }}>
                    <span style={{ flex: '1 1 260px', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '14px', fontWeight: '500' }}>{f.site}</span><span style={{ fontSize: '12px', color: '#9AA1AB' }}>{f.why}</span></span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: f.color }}>{f.state}</span>
                    {f.open && (
                      <span style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" onClick={() => setFlagState({ ...flagState, [i]: 'ignore' })} style={{ minHeight: '36px', padding: '0 12px', borderRadius: '10px', border: '1px solid #262A31', background: 'transparent', color: '#F2F4F5', fontSize: '13px' }}>Ignore it</button>
                        <button type="button" onClick={() => setFlagState({ ...flagState, [i]: 'disavow' })} style={{ minHeight: '36px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(255,197,61,.5)', background: 'transparent', color: '#FFC53D', fontSize: '13px' }}>Add to disavow list</button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ flex: '1 1 300px', minWidth: '0', borderRadius: '20px', background: '#101215', border: '1px solid #1A1D22', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>Should I worry?</h3>
                <span style={{ fontSize: '14px', color: '#9AA1AB', lineHeight: '1.55' }}>Usually not. Every site picks up some junk links, and Google mostly ignores them. Google's own advice is to use a disavow file only if you've had a manual penalty or bought links in the past. Searchify never uploads one for you.</span>
              </div>
            </div>
          )}
          <span style={{ fontSize: '12px', color: '#7D848E' }}>Strength is a 0 to 100 score for how much a website is trusted, from our link data provider. It's not a Google number, but it tracks closely with what helps rankings.</span>
        </section>
      </div>
  );
}
