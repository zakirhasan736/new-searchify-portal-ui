'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import ProblemNotice from '@/components/v8/ProblemNotice';
import SfyTip from '@/components/v8/SfyTip';
import { problemsFrom } from '@/lib/problems';
import '@/styles/v8-screens.css';
import '@/styles/v8-backlinks.css';

function strengthScore(link) {
  const raw = link.domainRank ?? link.rank ?? 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return n > 100 ? Math.min(100, Math.round(n / 10)) : Math.round(n);
}

function pageFromTarget(target) {
  try {
    return new URL(target || 'https://example.com/').pathname || '/';
  } catch {
    return '/';
  }
}

function formatShortDate(raw) {
  if (!raw) return '';
  const s = String(raw).slice(0, 10);
  const d = new Date(`${s}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatSince(raw) {
  if (!raw) return 'live';
  const s = String(raw).slice(0, 10);
  const d = new Date(`${s}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return `since ${s.slice(0, 7)}`;
  const now = new Date();
  const months = (now.getUTCFullYear() - d.getUTCFullYear()) * 12 + (now.getUTCMonth() - d.getUTCMonth());
  if (months >= 12) return `since ${d.getUTCFullYear()}`;
  return `since ${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}`;
}

function linkKind(link) {
  const explicit = String(link.kind || link.type || link.siteType || '').trim();
  if (explicit) return explicit;
  const blob = `${link.pageTitle || ''} ${link.domain || ''} ${link.source || ''}`.toLowerCase();
  if (/news|daily|press|journal/.test(blob)) return 'News site';
  if (/blog|parents|guide|magazine/.test(blob)) return 'Local blog';
  if (/directory|list|quotes|chamber|associat/.test(blob)) return 'Directory';
  if (/forum|reddit|community/.test(blob)) return 'Forum';
  if (/review|hub|yelp|rating/.test(blob)) return 'Review site';
  if (/supply|supplier|shingle|maker|wholesale/.test(blob)) return 'Supplier';
  if (/edu|campus|school|university/.test(blob)) return 'Education site';
  if (/charity|nonprofit|housing/.test(blob)) return 'Charity';
  const title = String(link.pageTitle || '').trim();
  if (title) return title.length > 42 ? `${title.slice(0, 39)}…` : title;
  return 'Referring site';
}

function mapLinkRow(link) {
  const stateRaw = String(link.state || 'Active');
  const statusKey = stateRaw === 'Lost' ? 'lost' : stateRaw === 'New' ? 'new' : 'live';
  const when =
    statusKey === 'lost'
      ? formatShortDate(link.lostDate || link.lastSeen) || '—'
      : statusKey === 'new'
        ? formatShortDate(link.firstSeen || link.lastSeen) || '—'
        : formatSince(link.firstSeen);
  return [
    link.domain || 'unknown',
    linkKind(link),
    strengthScore(link),
    pageFromTarget(link.target),
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
    const score = strengthScore(link);
    moves.push({
      tag: 'WIN BACK A LOST LINK',
      title: `${link.domain} removed its link to your page.`,
      why:
        link.seen ||
        (score
          ? `It was one of your stronger links (strength ${score}). The page may still mention you — a short, friendly note usually gets it back.`
          : `It pointed at ${link.target || hostname}. Open the source page before outreach.`),
      cta: 'Draft the email',
      to: guessEmail(link.domain),
      subject: `Small fix on your link to ${hostname}`,
      body: `Hi there,\n\nIt looks like a link to our page went missing:\n${link.target || hostname}\n\nWould you be able to add it back? We just refreshed the page, so it should still be useful for your readers.\n\nThanks,\n${hostname}`,
      done: "Sent. We'll check that page every week and tell you when the link is back.",
      sourceUrl: link.source || link.url || link.sourceUrl || '',
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
      to: guessEmail(mention.domain || mention.title),
      subject: `Thanks for mentioning ${hostname}`,
      body: `Hi,\n\nThanks for mentioning us. Would you be open to linking our name to ${hostname} so readers can find us easily?\n\nBest,\n${hostname}`,
      done: 'Sent. Mentions that already name you get a link back more often than any other request.',
      sourceUrl: mention.url || '',
    });
  }
  const gapConcept = (concepts || []).find((row) => {
    const blob = `${row.concept || ''} ${row.title || ''} ${row.why || ''}`.toLowerCase();
    return blob.includes('gap') || blob.includes('directory') || blob.includes('competitor') || blob.includes('listed');
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
      sourceUrl: link.source || link.url || link.sourceUrl || '',
    });
  }
  return moves.slice(0, 3);
}

function normalizeLinksPayload(data) {
  if (!data) {
    return {
      links: [],
      summary: null,
      concepts: [],
      fetchedAt: '',
      overview: null,
      keywordDestinations: [],
      cached: false,
      problem: null,
    };
  }
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
    overview: root?.overview || data.overview || null,
    keywordDestinations: Array.isArray(root?.keywordDestinations)
      ? root.keywordDestinations
      : Array.isArray(data.keywordDestinations)
        ? data.keywordDestinations
        : [],
    cached: Boolean(root?.cached ?? data.cached),
    problem: data.problem || null,
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
  const start = Math.max(0, domainsNow - Math.max(newN * 4, Math.round(domainsNow * 0.4), 8));
  const TOT = Array.from({ length: 12 }, (_, i) => Math.round(start + ((domainsNow - start) * i) / 11));
  const NEW = Array.from({ length: 12 }, (_, i) => (i === 11 ? newN : i > 7 ? Math.max(0, Math.round(newN / 3)) : Math.max(0, Math.round(newN / 6))));
  const LOST = Array.from({ length: 12 }, (_, i) => (i === 11 ? lostN : i > 8 ? Math.max(0, Math.round(lostN / 2)) : Math.max(0, Math.round(lostN / 4))));
  return { TOT, NEW, LOST };
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
  const [overview, setOverview] = useState(null);
  const [fetchedAt, setFetchedAt] = useState('');
  const [orphans, setOrphans] = useState([]);
  const [senderEmail, setSenderEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [problems, setProblems] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const forceRef = useRef(false);
  const { hostname, href } = activeSiteContext(loadJourney());

  useEffect(() => {
    const site = href || activeSiteContext(loadJourney()).href || '';
    let cancel = false;
    setLoading(true);
    const force = forceRef.current;
    forceRef.current = false;
    Promise.all([
      // Stored backlink data is reused for 24h unless the user clicks Refresh.
      site ? researchBacklinks({ site, force }).catch((err) => ({ ok: false, data: err?.data || {} })) : Promise.resolve({ ok: false }),
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
        setProblems(site ? problemsFrom(res, 'backlinks') : []);
        setLiveLinks(pick.links || []);
        setLiveSummary(pick.summary || null);
        setLiveConcepts(pick.concepts || []);
        setOverview(pick.overview || null);
        setFetchedAt(pick.fetchedAt || '');

        if (prof?.ok && prof.data) {
          setSenderEmail(prof.data.email || prof.data.workEmail || '');
        }

        const linked = new Set([
          ...(pick.links || []).map((l) => pageFromTarget(l.target)),
          ...((pick.overview?.topLinkedPages || []).map((p) => p.page || pageFromTarget(p.url))),
        ]);
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
        if (!cancel) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancel = true;
    };
  }, [hostname, href, reloadKey]);

  const refreshNow = () => {
    setRefreshing(true);
    forceRef.current = true;
    setReloadKey((k) => k + 1);
  };

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
  const chartMax = Math.max(45, Math.ceil((Math.max(...TOT, 1) + 1) / 10) * 10);
  const X = (i) => 60 + i * (562 / 11);
  const Y = (v) => 150 - (v / chartMax) * 140;
  const line = TOT.length ? TOT.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ') : '';
  const area = line ? `${line} L${X(11).toFixed(1)} 150 L${X(0).toFixed(1)} 150 Z` : '';
  const pts = TOT.map((v, i) => ({
    x: X(i).toFixed(1),
    y: Y(v).toFixed(1),
    label: months.at(i),
    bx: (X(i) - 5).toFixed(1),
    ny: (196 - (NEW.at(i) || 0) * 8).toFixed(1),
    nh: String((NEW.at(i) || 0) * 8),
    lh: String((LOST.at(i) || 0) * 8),
  }));
  const grid = [0.25, 0.5, 0.75, 1].map((f) => {
    const v = Math.round(chartMax * f);
    return { y: Y(v).toFixed(1), ty: (Y(v) + 4).toFixed(1), label: String(v) };
  });

  const L = useMemo(() => {
    if (liveLinks?.length) return liveLinks.map(mapLinkRow);
    return [];
  }, [liveLinks]);

  const pageCounts = useMemo(() => {
    // Prefer DataForSEO domain-pages summary (matches Backlinks.html “Your pages” list).
    const fromOverview = (overview?.topLinkedPages || [])
      .map((row) => [row.page || pageFromTarget(row.url), Number(row.referringDomains || row.backlinks || 0)])
      .filter(([path, n]) => path && n > 0);
    if (fromOverview.length) return fromOverview.sort((a, b) => b[1] - a[1]);
    const counts = new Map();
    (liveLinks || []).forEach((link) => {
      const path = pageFromTarget(link.target);
      counts.set(path, (counts.get(path) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [liveLinks, overview]);

  const P = useMemo(() => (pageCounts.length ? pageCounts.slice(0, 6) : []), [pageCounts]);

  const yearGain = useMemo(() => {
    if (TOT.length >= 2) return Math.max(0, TOT[TOT.length - 1] - TOT[0]);
    return Math.max(0, newCount * 4);
  }, [TOT, newCount]);

  const headerStats = useMemo(() => {
    if (!liveSummary && !liveLinks?.length && !overview) {
      return { domains: 0, newN: 0, lostN: 0, totalLinks: 0, strong: 0, flagged: 0 };
    }
    const links = liveLinks || [];
    const domains =
      overview?.externalReferringDomains ??
      liveSummary?.referringDomains ??
      links.length;
    const newN = links.filter((l) => String(l.state) === 'New').length;
    const lostN = links.filter((l) => String(l.state) === 'Lost').length;
    const strong = links.filter((l) => strengthScore(l) >= 40).length;
    const flagged = links.filter((l) => Number(l.spamScore) >= 60).length;
    return {
      domains: Number(domains) || 0,
      newN,
      lostN,
      totalLinks: overview?.externalBacklinks ?? liveSummary?.backlinks ?? links.length,
      strong,
      flagged,
    };
  }, [liveLinks, liveSummary, overview]);

  const updatedLabel = loading
    ? 'Loading link index…'
    : fetchedAt
      ? `Updated weekly · last check ${formatShortDate(fetchedAt) || String(fetchedAt).slice(0, 10)}`
      : liveLinks != null
        ? 'Updated weekly'
        : 'No link crawl yet';

  const sendLabel = senderEmail ? `Send from ${senderEmail}` : 'Send email draft';
  const moveTotal = Math.max(MOVES.length, 1);
  const nd = done.length;

  const ST = { new: ['New', '#3DDC84'], lost: ['Lost', '#FF8A80'], live: ['Linking', '#9AA1AB'] };
  let src = tab === 'newlost' ? L.filter((r) => r.at(6) !== 'live') : L.slice().sort((a, b) => b.at(2) - a.at(2));
  if (tab === 'all' && followOnly) src = src.filter((r) => r.at(5) === 'follow');

  const rows = src.map((r) => ({
    site: r.at(0),
    kind: r.at(1),
    str: String(r.at(2)),
    bar: `${r.at(2)}%`,
    barColor: r.at(2) >= 50 ? '#3DDC84' : r.at(2) >= 30 ? '#2CC7C0' : '#7D848E',
    page: r.at(3),
    anchor: r.at(4),
    type: r.at(5) === 'follow' ? 'Passes strength' : 'Nofollow',
    typeColor: r.at(5) === 'follow' ? '#3DDC84' : '#7D848E',
    status: ST[r.at(6)].at(0),
    color: ST[r.at(6)].at(1),
    when: r.at(7),
  }));

  const G = (liveConcepts || [])
    .filter((row) => {
      const blob = `${row.concept || ''} ${row.title || ''} ${row.why || ''}`.toLowerCase();
      return blob.includes('gap') || blob.includes('competitor') || blob.includes('directory') || blob.includes('listed');
    })
    .slice(0, 6)
    .map((row) => [
      row.domain || row.title || 'Competitor site',
      strengthScore(row) || row.strength || 0,
      row.who || row.competitors || '—',
      row.type || 'Opportunity',
      row.action === 'pitch' ? 'pitch' : row.action === 'email' ? 'email' : 'apply',
      row.cta || (row.action === 'pitch' ? 'Draft a story pitch' : row.action === 'email' ? 'Draft outreach' : 'Open application'),
    ]);

  const gap = G.map((g, i) => ({
    site: g.at(0),
    str: String(g.at(1)),
    who: g.at(2),
    type: g.at(3),
    label: gapDone[i] ? (g.at(4) === 'apply' ? 'Started' : 'Draft saved') : g.at(5),
    bg: gapDone[i] ? 'transparent' : '#4DA3FF',
    fg: gapDone[i] ? '#3DDC84' : '#0A0B0D',
    border: gapDone[i] ? '1px solid rgba(61,220,132,.5)' : '0',
  }));

  const FL = (liveLinks || [])
    .filter((l) => Number(l.spamScore) >= 60)
    .slice(0, 8)
    .map((l) => [l.domain || 'unknown', l.seen || `Spam score ${l.spamScore}`]);
  const flags = FL.map((f, i) => ({
    site: f.at(0),
    why: f.at(1),
    open: !flagState[i],
    state: flagState[i] === 'ignore' ? 'Ignored' : flagState[i] === 'disavow' ? 'On your disavow list' : `Low trust · ${FL.length}`,
    color: flagState[i] === 'disavow' ? '#FFC53D' : flagState[i] ? '#9AA1AB' : '#FF8A80',
  }));

  const headline =
    loading ? (
      '… websites link to you.'
    ) : headerStats.newN > 0 && headerStats.lostN > 0 ? (
      <>
        {headerStats.domains} websites link to you. <span className="is-new">{headerStats.newN} new</span> this month,{' '}
        <span className="is-lost">{headerStats.lostN} lost</span>.
      </>
    ) : headerStats.newN > 0 ? (
      <>
        {headerStats.domains} websites link to you. <span className="is-new">{headerStats.newN} new</span> this month.
      </>
    ) : headerStats.lostN > 0 ? (
      <>
        {headerStats.domains} websites link to you. <span className="is-lost">{headerStats.lostN} lost</span> this month.
      </>
    ) : (
      `${headerStats.domains} websites link to you.`
    );

  const firstKpiSub = headerStats.newN
    ? `+${headerStats.newN} this month · +${yearGain} this year`
    : headerStats.lostN
      ? `${headerStats.lostN} lost this month`
      : 'From live link index';
  const firstKpiColor = headerStats.newN ? '#3DDC84' : headerStats.lostN ? '#FF8A80' : '#3DDC84';

  const tabs = [
    ['newlost', `New and lost (${L.filter((r) => r.at(6) !== 'live').length})`],
    ['all', 'All linking websites'],
    ['pages', 'Your pages'],
    ['gap', `Competitor gap (${G.length})`],
    ['flag', `Flagged (${headerStats.flagged})`],
  ];

  const maxPage = Math.max(P[0]?.[1] || 1, 1);
  const chartAria = TOT.length
    ? `Websites linking to you, from ${TOT[0]} ${months[0]} to ${domainsNow} ${months[11]}`
    : 'Websites linking to you';

  return (
    <div className="v8-backlinks">
      <header className="v8-bl-head">
        <div className="v8-bl-copy">
          <span className="v8-bl-kicker">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2CC7C0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
              <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
            </svg>
            BACKLINKS
            <SfyTip
              tipId="backlinks"
              term="backlink"
              text="A link to your site from another website. Google treats it like a recommendation, so one link from a respected local site beats dozens from spammy ones."
              href="https://searchify.io/help/backlinks"
            />
          </span>
          <h1 className="v8-bl-title">{headline}</h1>
          <span className="v8-bl-sub">
            Other websites linking to {hostname || 'your site'}. Links from trusted local sites are one of the strongest signs to Google that you&apos;re worth ranking.
          </span>
        </div>
        <span className="v8-bl-updated">
          {updatedLabel}
          {href ? (
            <>
              {' · '}
              <button
                type="button"
                disabled={loading || refreshing}
                onClick={refreshNow}
                style={{
                  padding: 0,
                  border: 0,
                  background: 'transparent',
                  color: refreshing ? '#7D848E' : '#4DA3FF',
                  font: 'inherit',
                  fontSize: 12,
                  cursor: refreshing ? 'wait' : 'pointer',
                }}
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </>
          ) : null}
        </span>
      </header>

      <ProblemNotice problems={problems} onRetry={refreshNow} style={{ maxWidth: '1120px', width: '100%', margin: '0 auto' }} />

      <section className="v8-bl-kpis" aria-label="Totals">
        {[
          {
            label: 'Websites linking to you',
            value: loading ? '…' : String(headerStats.domains),
            sub: firstKpiSub,
            color: firstKpiColor,
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
        ].map((k) => (
          <div key={k.label} className="v8-bl-kpi">
            <span className="v8-bl-kpi-label">{k.label}</span>
            <span className="v8-bl-kpi-value">{k.value}</span>
            <span className="v8-bl-kpi-sub" style={{ color: k.color }}>
              {k.sub}
            </span>
          </div>
        ))}
      </section>

      <div className="v8-bl-row">
        <section aria-labelledby="move-h" className="v8-bl-move">
          {has ? (
            <div className="v8-bl-move-body">
              <span className="v8-bl-move-meta">
                <span className="v8-bl-move-tag">{mv.tag}</span>
                <span className="v8-bl-move-pos">
                  Link move {idx + 1} of {moveTotal}
                </span>
              </span>
              <h2 id="move-h">{mv.title}</h2>
              <span className="v8-bl-move-why">{mv.why}</span>
              {stage === 'draft' ? (
                <div className="v8-bl-draft">
                  <span className="v8-bl-draft-line">
                    To: <strong>{mv.to || '—'}</strong>
                  </span>
                  <span className="v8-bl-draft-line">
                    Subject: <strong>{mv.subject}</strong>
                  </span>
                  <label>
                    Message (edit anything)
                    <textarea rows={7} value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
                  </label>
                </div>
              ) : null}
              {stage === 'done' ? (
                <p role="status" className="v8-bl-done">
                  {mv.done}
                </p>
              ) : null}
              <div className="v8-bl-actions">
                {stage === 'idle' ? (
                  <button type="button" className="v8-bl-btn" onClick={openDraft}>
                    {mv.cta}
                  </button>
                ) : null}
                {stage === 'draft' ? (
                  <button type="button" className="v8-bl-btn" onClick={sendDraft}>
                    {sendLabel}
                  </button>
                ) : null}
                {stage === 'done' ? (
                  <button type="button" className="v8-bl-btn is-plain" onClick={() => nextMove(false)}>
                    Next link move
                  </button>
                ) : null}
                {stage !== 'done' ? (
                  <button type="button" className="v8-bl-btn-ghost" onClick={() => nextMove(true)}>
                    Skip for now
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="v8-bl-empty">
              {loading ? <SkeletonCards count={2} lines={3} /> : null}
              {!loading ? (
                <h2>
                  {liveLinks?.length ? "That's every link move for this week." : 'No link moves yet.'}
                </h2>
              ) : null}
              {!loading ? (
                <p>
                  {liveLinks?.length
                    ? `${nd ? `You sent or started ${nd}.` : "You skipped them all; they'll come back next week."} We'll check those pages weekly and tell you when a link appears.`
                    : 'Run a backlink refresh or wait for the weekly crawl to draft outreach here.'}
                </p>
              ) : null}
              {!loading && !liveLinks?.length ? (
                <Link href="/app/connections" className="v8-bl-btn">
                  Plug in
                </Link>
              ) : null}
            </div>
          )}
        </section>

        <section aria-labelledby="trend-h" className="v8-bl-trend">
          <div className="v8-bl-trend-top">
            <h2 id="trend-h">Websites linking to you · 12 months</h2>
            <span className="v8-bl-legend">
              <span>
                <span className="v8-bl-swatch is-new" />
                New
              </span>
              <span>
                <span className="v8-bl-swatch is-lost" />
                Lost
              </span>
            </span>
          </div>
          {TOT.length ? (
            <svg className="v8-bl-svg" viewBox="0 0 640 230" role="img" aria-label={chartAria}>
              {grid.map((g, i) => (
                <g key={i}>
                  <line x1="40" x2="632" y1={g.y} y2={g.y} stroke="#1A1D22" />
                  <text x="32" y={g.ty} textAnchor="end" fontSize="11" fill="#7D848E" fontFamily="Geist Mono, monospace">
                    {g.label}
                  </text>
                </g>
              ))}
              <path d={area} fill="rgba(44,199,192,.12)" />
              <path d={line} fill="none" stroke="#2CC7C0" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="v8-bl-line" />
              {pts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="3" fill="#2CC7C0" />
                  <rect x={p.bx} y={p.ny} width="10" height={p.nh} rx="2" fill="#3DDC84" />
                  <rect x={p.bx} y="196" width="10" height={p.lh} rx="2" fill="#FF5A4E" />
                  <text x={p.x} y="226" textAnchor="middle" fontSize="11" fill="#7D848E" fontFamily="Geist Mono, monospace">
                    {p.label}
                  </text>
                </g>
              ))}
              <line x1="40" x2="632" y1="196" y2="196" stroke="#262A31" />
              <text x={pts[11].x} y={(Y(domainsNow) - 10).toFixed(1)} textAnchor="middle" fontSize="13" fontWeight="600" fill="#F2F4F5" fontFamily="Geist, sans-serif">
                {domainsNow}
              </text>
            </svg>
          ) : (
            <p className="v8-bl-trend-empty">No link history yet.</p>
          )}
          <span className="v8-bl-trend-note">Line: total websites linking to you. Bars: links gained and lost each month.</span>
        </section>
      </div>

      <section className="v8-bl-details" aria-label="Link details">
        <div className="v8-bl-tabs" role="tablist" aria-label="Link views">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id ? 'true' : 'false'}
              className={`v8-bl-tab${tab === id ? ' is-on' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {(tab === 'newlost' || tab === 'all') && (
          <div className="v8-bl-panel">
            {tab === 'all' ? (
              <label className="v8-bl-filter">
                <input type="checkbox" checked={followOnly} onChange={(e) => setFollowOnly(e.target.checked)} />
                Only links that pass strength to you (not &quot;nofollow&quot;)
              </label>
            ) : null}
            <div className="v8-bl-table">
              <div className="v8-bl-table-inner">
                <div className="v8-bl-thead" aria-hidden="true">
                  <span>LINKING WEBSITE</span>
                  <span>STRENGTH</span>
                  <span>LINKS TO YOUR PAGE</span>
                  <span>LINK TEXT</span>
                  <span>TYPE</span>
                  <span>STATUS</span>
                </div>
                {rows.length === 0 ? <p className="v8-bl-empty-row">No linking websites in this view yet.</p> : null}
                {rows.map((r, i) => (
                  <div key={`${r.site}-${i}`} className="v8-bl-tr">
                    <span className="v8-bl-site">
                      <span className="v8-bl-site-name">{r.site}</span>
                      <span className="v8-bl-site-kind">{r.kind}</span>
                    </span>
                    <span className="v8-bl-strength">
                      <span className="v8-bl-bar">
                        <span style={{ width: r.bar, background: r.barColor }} />
                      </span>
                      <span className="v8-bl-str">{r.str}</span>
                    </span>
                    <span className="v8-bl-page">{r.page}</span>
                    <span className="v8-bl-anchor">&quot;{r.anchor}&quot;</span>
                    <span className="v8-bl-type" style={{ color: r.typeColor }}>
                      {r.type}
                    </span>
                    <span className="v8-bl-status">
                      <span className="v8-bl-status-label" style={{ color: r.color }}>
                        {r.status}
                      </span>
                      <span className="v8-bl-status-when">{r.when}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'pages' && (
          <div className="v8-bl-pages">
            <div className="v8-bl-pages-main">
              <h3>Your most-linked pages</h3>
              {P.length === 0 ? <p className="v8-bl-empty-row" style={{ padding: 0 }}>No linked pages yet.</p> : null}
              {P.map((p) => (
                <div key={p[0]} className="v8-bl-page-row">
                  <span className="v8-bl-page-top">
                    <span className="v8-bl-page-path">{p[0]}</span>
                    <span className="v8-bl-page-count">{p[1]} sites</span>
                  </span>
                  <div className="v8-bl-page-track">
                    <div className="v8-bl-page-fill" style={{ width: `${Math.round((p[1] / maxPage) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="v8-bl-pages-side">
              <h3>Important pages no one links to</h3>
              {orphans.length === 0 ? (
                <p className="v8-bl-empty-row" style={{ padding: 0 }}>
                  No orphan-page suggestions yet. After a crawl, Searchify will list money pages with zero outside links.
                </p>
              ) : (
                orphans.map((o) => (
                  <div key={o.path} className="v8-bl-orphan">
                    <span className="v8-bl-orphan-path">{o.path}</span>
                    <span className="v8-bl-orphan-why">{o.why}</span>
                  </div>
                ))
              )}
              <span className="v8-bl-orphan-note">Pages that bring in money but have no outside links usually rank lower than they could.</span>
            </div>
          </div>
        )}

        {tab === 'gap' && (
          <div className="v8-bl-panel">
            <span className="v8-bl-gap-intro">
              Websites that link to at least 2 of your competitors, but not to you
              {G.length ? ` · ${G.length} opportunities` : ''}.
            </span>
            <div className="v8-bl-table">
              <div className="v8-bl-table-inner is-gap">
                <div className="v8-bl-thead is-gap" aria-hidden="true">
                  <span>WEBSITE</span>
                  <span>STRENGTH</span>
                  <span>LINKS TO</span>
                  <span>TYPE</span>
                  <span style={{ textAlign: 'right' }}>NEXT STEP</span>
                </div>
                {gap.length === 0 ? <p className="v8-bl-empty-row">No competitor-gap opportunities yet.</p> : null}
                {gap.map((g, i) => (
                  <div key={`${g.site}-${i}`} className="v8-bl-tr is-gap">
                    <span className="v8-bl-site-name">{g.site}</span>
                    <span className="v8-bl-str">{g.str}</span>
                    <span className="v8-bl-gap-who">{g.who}</span>
                    <span className="v8-bl-gap-type">{g.type}</span>
                    <span className="v8-bl-gap-act">
                      <button
                        type="button"
                        className="v8-bl-gap-btn"
                        onClick={() => setGapDone({ ...gapDone, [i]: true })}
                        style={{ border: g.border, background: g.bg, color: g.fg }}
                      >
                        {g.label}
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'flag' && (
          <div className="v8-bl-flags">
            <div className="v8-bl-flag-list">
              {flags.length === 0 ? <p className="v8-bl-empty-row">No low-trust links flagged.</p> : null}
              {flags.map((f, i) => (
                <div key={`${f.site}-${i}`} className="v8-bl-flag-row">
                  <span className="v8-bl-flag-copy">
                    <span className="v8-bl-flag-site">{f.site}</span>
                    <span className="v8-bl-flag-why">{f.why}</span>
                  </span>
                  <span className="v8-bl-flag-state" style={{ color: f.color }}>
                    {f.state}
                  </span>
                  {f.open ? (
                    <span className="v8-bl-flag-acts">
                      <button type="button" className="is-ignore" onClick={() => setFlagState({ ...flagState, [i]: 'ignore' })}>
                        Ignore it
                      </button>
                      <button type="button" className="is-disavow" onClick={() => setFlagState({ ...flagState, [i]: 'disavow' })}>
                        Add to disavow list
                      </button>
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="v8-bl-flag-help">
              <h3>Should I worry?</h3>
              <p>
                Usually not. Every site picks up some junk links, and Google mostly ignores them. Google&apos;s own advice is to use a disavow file only if you&apos;ve had a manual penalty or bought links in the past. Searchify never uploads one for you.
              </p>
            </div>
          </div>
        )}

        <span className="v8-bl-foot">
          Strength is a 0 to 100 score for how much a website is trusted, from our link data provider. It&apos;s not a Google number, but it tracks closely with what helps rankings.
        </span>
      </section>
    </div>
  );
}
