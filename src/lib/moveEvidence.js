/**
 * Dynamic gain / proof / ships copy for Today's moves (and related cards).
 * Prefer stored Search Console evidence + the selected option's scores — never invent a fixed +10–30.
 */

function asNumber(value) {
  if (value == null || value === "" || value === "—") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function asCtr(value, clicks, impressions) {
  if (value != null && value !== "") {
    const raw = Number(String(value).replace(/%/g, "").trim());
    if (Number.isFinite(raw)) return raw > 1 ? raw / 100 : raw;
  }
  if (clicks != null && impressions != null && impressions > 0) return clicks / impressions;
  return null;
}

function cleanKeyword(raw) {
  return String(raw || "")
    .replace(/\s+/g, " ")
    .replace(/"+/g, '"')
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();
}

function cleanProofText(raw) {
  let text = String(raw || "").replace(/\s+/g, " ").trim();
  // Fix writer quirks like: Best keyword “"huey lam suits" "calgary"”.
  text = text.replace(/Best keyword\s*[“"']+\s*([\s\S]*?)\s*[”"']+(?=\.\s|Scored|\.|$)/gi, (_, inner) => {
    const keyword = String(inner)
      .replace(/[“”"'`]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return keyword ? `Best keyword “${keyword}”` : "Best keyword";
  });
  return text.replace(/\s+/g, " ").trim();
}

export function monthLabel(date = new Date()) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function monthShort(date = new Date()) {
  return date.toLocaleString("en-US", { month: "long" });
}

/** Prefer page-level GSC block stored on the change. */
export function evidenceOf(proposed = {}) {
  const ev = proposed.evidence || proposed.gsc || proposed.evidenceRecord?.gsc || {};
  return ev && typeof ev === "object" ? ev : {};
}

/**
 * Honest click-gain line from this page's Search Console numbers + score gap.
 * Falls back to a clear “not enough data” state instead of a fake +10–30.
 */
export function estimateClickGain(proposed = {}, selected = {}, when = new Date()) {
  const stored = String(proposed.expectedGain || proposed.gain || "").trim();
  const fakeDefaults = ["+10–30 clicks / mo", "+10-30 clicks / mo", "+40–90 visitors / mo", "+40-90 visitors / mo"];
  const hasRealStored = stored && !fakeDefaults.includes(stored);

  const ev = evidenceOf(proposed);
  const clicks = asNumber(ev.clicks);
  const impressions = asNumber(ev.impressions);
  const ctr = asCtr(ev.ctr, clicks, impressions);
  const judge = asNumber(selected.judgeScore ?? proposed.judgeScore) || 0;
  const live = asNumber(proposed.liveScore) || 0;
  const labelMonth = monthShort(when);
  const fullMonth = monthLabel(when);

  if (hasRealStored) {
    const withMonth = /month|mo\b|october|november|december|january|february|march|april|may|june|july|august|september/i.test(stored)
      ? stored
      : `${stored.replace(/\s*\/\s*mo\.?$/i, "").trim()} this month`;
    return {
      label: withMonth,
      mid: Math.round(asNumber(stored.match(/(\d+)/)?.[1]) || proposed.gainMid || 0),
      basis:
        String(proposed.gainBasis || "").trim() ||
        (clicks != null
          ? `${Math.round(clicks).toLocaleString("en-US")} Search Console clicks on this page · ${fullMonth}`
          : `Stored estimate · ${fullMonth}`),
      hasData: true,
    };
  }

  const scoreGap = Math.max(0, judge - live) / 100;

  if (impressions != null && impressions > 0) {
    const currentCtr = ctr != null ? ctr : clicks != null ? clicks / impressions : 0.02;
    // Modest, evidence-tied lift — wider when the blind review beat the live listing by more.
    const lift = Math.min(0.045, Math.max(0.004, currentCtr * (0.12 + scoreGap * 0.55) + scoreGap * 0.01));
    let low = Math.max(1, Math.round(impressions * lift * 0.55));
    let high = Math.max(low + 1, Math.round(impressions * lift * 1.25));
    // Cap relative to current clicks so we never promise absurd jumps.
    if (clicks != null && clicks > 0) {
      high = Math.min(high, Math.max(low + 1, Math.round(clicks * 0.6) + low));
    }
    return {
      label: `+${low}–${high} clicks this month`,
      mid: Math.round((low + high) / 2),
      basis:
        clicks != null
          ? `${Math.round(clicks).toLocaleString("en-US")} clicks · ${Math.round(impressions).toLocaleString("en-US")} impressions on this page in Search Console (${fullMonth})`
          : `${Math.round(impressions).toLocaleString("en-US")} impressions on this page in Search Console (${fullMonth})`,
      hasData: true,
    };
  }

  if (clicks != null && clicks > 0) {
    const low = Math.max(1, Math.round(clicks * (0.06 + scoreGap * 0.1)));
    const high = Math.max(low + 1, Math.round(clicks * (0.18 + scoreGap * 0.2)));
    return {
      label: `+${low}–${high} clicks this month`,
      mid: Math.round((low + high) / 2),
      basis: `${Math.round(clicks).toLocaleString("en-US")} Search Console clicks on this page · ${fullMonth}`,
      hasData: true,
    };
  }

  return {
    label: `Clicks measured after ship · ${labelMonth}`,
    mid: 0,
    basis: `No Search Console clicks or impressions are stored for this page yet (${fullMonth}). The gain fills in from live data after you ship.`,
    hasData: false,
  };
}

/** Proof line for the selected option — scores + keyword, cleaned. */
export function buildMoveProof(proposed = {}, selected = {}) {
  const reason = cleanProofText(selected.reason || proposed.reason || "");
  const keyword = cleanKeyword(proposed.target || selected.keyword || proposed.primaryKeyword || "");
  const judge = asNumber(selected.judgeScore ?? proposed.judgeScore);
  const live = asNumber(proposed.liveScore);
  const weakness = String(
    proposed.evaluation?.liveWeakness ||
      proposed.jev?.liveNote ||
      proposed.analysis?.liveWeakness ||
      "",
  ).trim();

  if (reason) {
    // Ensure keyword prefix when the writer omitted it but we have a target.
    if (keyword && !/best keyword/i.test(reason)) {
      return cleanProofText(`Best keyword “${keyword}”. ${reason}`);
    }
    return reason;
  }

  const parts = [];
  if (keyword) parts.push(`Best keyword “${keyword}”.`);
  if (judge != null && judge > 0) {
    parts.push(
      `Scored ${Math.round(judge)}/100 in a blind review` +
        (live != null && live > 0 ? ` vs ${Math.round(live)}/100 for the live listing` : "") +
        ".",
    );
  }
  if (weakness) parts.push(`Live listing weakness: ${weakness}`);
  if (!parts.length) {
    return "Based on Search Console and the live page read for this URL.";
  }
  return cleanProofText(parts.join(" "));
}

/** Publish path line — reflects real connection state. */
export function buildShipsLine(connectionStatus = {}, changeType = "meta") {
  const wp = !!connectionStatus.wordpress;
  const gsc = !!connectionStatus.gsc;
  const kind = String(changeType || "meta").toLowerCase();
  if (kind === "meta" || kind === "content" || !kind) {
    if (wp) return "Ships to WordPress · checked live · one-click undo";
    if (gsc) return "Needs WordPress to publish · Search Console is connected · one-click undo after ship";
    return "Connect WordPress to publish · checked live · one-click undo";
  }
  if (wp) return "Ships to WordPress · checked live · one-click undo";
  return "Connect WordPress to publish · checked live · one-click undo";
}
