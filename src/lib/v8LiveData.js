import { changePath, featurePayload, historyItems, queueItems } from '@/lib/v1Api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function hostFromUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  try {
    return new URL(s.includes('://') ? s : `https://${s}`).hostname.replace(/^www\./, '');
  } catch {
    return s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  }
}

export function weeklyBuckets(gscPayload) {
  const gsc = gscPayload || {};
  if (Array.isArray(gsc.weekly) && gsc.weekly.length) return gsc.weekly;
  if (Array.isArray(gsc.panels?.weeklyClicks) && gsc.panels.weeklyClicks.length) return gsc.panels.weeklyClicks;
  if (!Array.isArray(gsc.daily) || !gsc.daily.length) return [];
  const ordered = [...gsc.daily].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const buckets = [];
  for (let i = 0; i < ordered.length; i += 7) {
    const chunk = ordered.slice(i, i + 7);
    const clicks = chunk.reduce((s, r) => s + (Number(r[1]) || 0), 0);
    const impr = chunk.reduce((s, r) => s + (Number(r[2]) || 0), 0);
    const withPos = chunk.filter((r) => r[4] != null && r[4] !== '');
    const posWeighted = withPos.reduce((s, r) => s + (Number(r[4]) || 0) * (Number(r[2]) || 1), 0);
    const posImpr = withPos.reduce((s, r) => s + (Number(r[2]) || 0), 0);
    const position = posImpr ? posWeighted / posImpr : null;
    const start = String(chunk[0][0] || '');
    const parts = start.split('-');
    const label =
      parts.length === 3 ? `${MONTHS[Number(parts[1]) - 1]} ${Number(parts[2])}` : start.slice(5) || start;
    buckets.push({ label, clicks, impr, position, start });
  }
  return buckets.map((b) => [b.label, b.clicks, b.impr, b.position, b.start]);
}

function weekIndexForDate(weekRows, iso) {
  if (!iso || !weekRows.length) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  for (let i = 0; i < weekRows.length; i++) {
    const start = weekRows[i][4];
    if (!start) continue;
    const ws = new Date(`${start}T00:00:00Z`).getTime();
    const we = ws + 7 * 864e5;
    if (t >= ws && t < we) return i;
  }
  return weekRows.length - 1;
}

function changeTypeLabel(c) {
  const t = String(c.changeType || 'change').toLowerCase();
  if (t === 'meta') return 'META';
  if (t === 'image') return 'IMAGES';
  if (t === 'link' || t === 'links') return 'LINKS';
  if (t === 'content' || t === 'performance') return 'CONTENT';
  return t.toUpperCase().slice(0, 8) || 'CHANGE';
}

function changeResultMeta(c) {
  const mon = c.monitoring || {};
  if (c.status === 'undone') {
    return { ok: -1, res: mon.note || 'Undone', lift: -6 };
  }
  const rawDelta = mon.clickDelta ?? mon.click_delta ?? mon.visitorsDelta ?? mon.visitors_delta ?? mon.delta;
  if (rawDelta != null && rawDelta !== '') {
    const n = Number(rawDelta);
    if (Number.isFinite(n) && n > 0) {
      return { ok: 1, res: `+${Math.round(n)}% clicks`, lift: Math.min(40, Math.max(4, Math.round(n / 5))) };
    }
    if (Number.isFinite(n) && n < 0) {
      return { ok: -1, res: `Undone · ${n}% clicks`, lift: Math.max(-20, Math.round(n / 5)) };
    }
    if (Number.isFinite(n) && n === 0) {
      return { ok: 0, res: 'No clear effect', lift: 0 };
    }
  }
  if (['applied', 'monitoring', 'published_unverified'].includes(c.status)) {
    const day = mon.day ?? mon.daysElapsed;
    const dayNote = day != null ? ` · day ${day} of 28` : '';
    return { ok: 0, res: mon.note || `Measuring${dayNote}`, lift: 4 };
  }
  return { ok: 0, res: mon.note || 'Measuring', lift: 2 };
}

export function mapHistoryForResultsChart(changes, weekRows) {
  return historyItems(changes || [])
    .map((c) => {
      const w = weekIndexForDate(weekRows, c.appliedAt || c.updatedAt || c.createdAt);
      if (w == null) return null;
      const meta = changeResultMeta(c);
      const opp = String(c.opportunity || '').trim();
      return {
        id: String(c.id),
        w,
        type: changeTypeLabel(c),
        what: opp || `${changeTypeLabel(c)} update`,
        page: changePath(c),
        res: meta.res,
        ok: meta.ok,
        lift: meta.lift,
        appliedIso: c.appliedAt || c.updatedAt || c.createdAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.w - b.w);
}

export function buildResultsSeries(weekRows, trafficPayload, chartChanges) {
  const ga = trafficPayload || {};
  const gaDaily = Array.isArray(ga.daily) ? ga.daily : [];
  const gaByWeek = [];
  if (gaDaily.length) {
    const ordered = [...gaDaily].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    for (let i = 0; i < ordered.length; i += 7) {
      const chunk = ordered.slice(i, i + 7);
      const sessions = chunk.reduce((s, r) => s + (Number(r[1]) || 0), 0);
      gaByWeek.push(sessions);
    }
  }

  const N = weekRows.length;
  const clicks = [];
  const impr = [];
  const pos = [];
  const leads = [];
  // Live GSC rows already reflect outcomes — do not add synthetic lift to the series.
  for (let i = 0; i < N; i++) {
    const row = weekRows[i];
    const c = Number(row[1]) || 0;
    const im = Number(row[2]) || 0;
    const p = row[3] != null && row[3] !== "" ? Number(row[3]) : null;
    clicks.push(Math.max(0, Math.round(c)));
    impr.push(Math.max(0, Math.round(im || c * 40)));
    pos.push(p != null && Number.isFinite(p) ? Math.round(p * 10) / 10 : 12);
    const gaS = gaByWeek[i];
    leads.push(Math.max(0, gaS != null ? Math.round(gaS / 7) : Math.max(0, Math.round(clicks[i] / 70))));
  }
  const firstShip = chartChanges?.[0]?.w;
  const START = Math.max(1, Math.min(N - 1, firstShip != null ? firstShip : Math.floor(N * 0.55)));
  const weekLabels = weekRows.map((row) => String(row[0] || ""));
  return { N, START, clicks, impr, pos, leads, weekLabels };
}

export function mapQueueRow(c, clientLabel = '') {
  const proposed = c.proposed || {};
  const sev = c.priority === 'high' || c.severity === 'critical' ? 'red' : 'yellow';
  const gainBits = proposed.evidence
    ? `+${proposed.evidence.clicks ?? '—'} clicks/mo`
    : String(c.opportunity || '').includes('click')
      ? c.opportunity
      : '+5–25 clicks/mo';
  return {
    id: String(c.id),
    client: clientLabel || 'Your site',
    c: sev,
    what: String(c.opportunity || proposed.title || 'Review this change').trim(),
    page: changePath(c),
    gain: gainBits,
    low: sev === 'yellow' || c.changeType === 'meta',
    changeId: c.id,
  };
}

export function clientLabelForChange(sites, change) {
  const pathHost = hostFromUrl(change?.targetUrl);
  if (!pathHost || !sites?.length) return '';
  const hit = sites.find((s) => hostFromUrl(s.siteUrl) === pathHost);
  return hit?.label || hit?.name || pathHost;
}

export function mapWorkspaceSite(site, { queueCount = 0, red = 0, yellow = 0, blue = 0, captured = 0, untapped = 0, broken = false } = {}) {
  const domain = hostFromUrl(site.siteUrl) || 'example.com';
  const name = site.label || domain;
  const level = Math.min(6, Math.max(1, 2 + Math.floor((captured || 0) / 200)));
  return {
    name,
    domain,
    level,
    captured: captured || 0,
    untapped: untapped || Math.max(captured * 4, 500),
    red,
    yellow,
    blue,
    moves: queueCount,
    broken: broken || site.status === 'error' || site.status === 'disconnected',
  };
}

export function severityToBoardColor(severity) {
  if (severity === 'Critical') return 'red';
  if (severity === 'Warning') return 'yellow';
  return 'green';
}

export function findingsToScanTasks(findings, { lockedPaths = [] } = {}) {
  const red = [];
  const yellow = [];
  const green = [];
  const blue = lockedPaths.map((p) => `Winning — leave as is · ${p}`);
  for (const f of findings || []) {
    const path = f.pages?.[0] ? tryPath(f.pages[0]) : f.detail || '/';
    const line = `${f.name} · ${path}`;
    const color = severityToBoardColor(f.severity);
    if (color === 'red') red.push(line);
    else if (color === 'yellow') yellow.push(line);
    else green.push(line);
  }
  return { red, yellow, green, blue };
}

function tryPath(url) {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return String(url || '/');
  }
}

export function queueItemsFromChanges(data) {
  const list = Array.isArray(data) ? data : data?.changes || [];
  return queueItems(list);
}

export function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function planDisplayName(planId) {
  const map = { starter: 'Starter', growth: 'Growth', agency: 'Agency', premium: 'Premium', pro: 'Pro' };
  return map[String(planId || '').toLowerCase()] || (planId ? String(planId) : 'Starter');
}
