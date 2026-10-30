/**
 * Shared board colour identity for Site scan + Today's moves.
 * Colours mean change urgency — not a quality score of the live title.
 */

export const DOT_COLORS = {
  red: "#FF5A4E",
  yellow: "#FFC53D",
  green: "#3DDC84",
  blue: "#4DA3FF",
};

export const DOT_RGB = {
  red: "255,90,78",
  yellow: "255,197,61",
  green: "61,220,132",
  blue: "77,163,255",
};

export const DOT_KEYS = ["red", "yellow", "green", "blue"];

export const DOT_LABEL = {
  red: "Dire",
  yellow: "Medium",
  green: "Passes",
  blue: "Locked",
};

export const DOT_TAG = {
  red: "DIRE",
  yellow: "MEDIUM",
  green: "PASSES",
  blue: "LOCKED",
};

/** Short chip / status titles — urgency of the change, not title quality. */
export const DOT_META = {
  all: {
    label: "All",
    title: "Every task, colour-coded",
    sub: "Pick a colour to make those tasks glow. Hover any dot to see the task.",
  },
  red: {
    label: "Dire",
    title: "Dire — change urgently",
    sub: "Fix these first. The colour is how urgent the change is — not a score of how good or bad the current title already is.",
    meaning:
      "Highest urgency. These pages need a change soon because they are costing the most visitors or visibility. It does not mean “this title is poorly written” as a quality grade — it means the recommended change should ship first.",
  },
  yellow: {
    label: "Medium",
    title: "Medium — change when ready",
    sub: "Worth doing after the dire ones. Still a recommended change, not a judgment that the live title is only “medium quality.”",
    meaning:
      "Useful improvements that can wait until dire fixes are shipped. Medium is about priority order — how soon the change is needed — not a rating of the words already on the page.",
  },
  green: {
    label: "Passes",
    title: "Passes — nothing urgent",
    sub: "These meet the criteria right now. Searchify rechecks them weekly; if one slips, it turns yellow or red.",
    meaning:
      "No urgent change needed. The page currently meets the checks Searchify watches. This is not praise of a title’s creativity — it means nothing needs shipping for now.",
  },
  blue: {
    label: "Locked",
    title: "Locked — leave winning pages",
    sub: "These are performing. Searchify will not change them unless rankings slip for long enough.",
    meaning:
      "Protected winners. Locked means do not touch — not that the title was “scored blue.” Automation stays off so a good result is not rewritten away.",
  },
};

export const OPEN_CHANGE_STATUSES = new Set([
  "proposed",
  "awaiting_approval",
  "approved",
  "failed",
  "needs_review",
]);

export function normalizeBoardPath(value) {
  try {
    const raw = String(value || "").includes("://")
      ? new URL(value).pathname || "/"
      : String(value || "/").split("?")[0];
    const path = raw.length > 1 ? raw.replace(/\/+$/, "") : raw || "/";
    return path.startsWith("/") ? path : `/${path}`;
  } catch {
    const raw = String(value || "/").split("?")[0];
    return raw.length > 1 ? raw.replace(/\/+$/, "") || "/" : "/";
  }
}

export function severityToBoardColor(severity) {
  const s = String(severity || "").trim();
  if (s === "Critical" || s === "critical" || s === "high" || s === "error") return "red";
  if (s === "Warning" || s === "warning" || s === "medium") return "yellow";
  if (s === "Notice" || s === "notice" || s === "info" || s === "ok") return "green";
  return "green";
}

function hasUsableLiveTitle(proposed = {}) {
  const live = String(
    proposed.liveTitle || proposed.beforeTitle || proposed.before || proposed.currentTitle || "",
  ).trim();
  if (!live) return false;
  const bad = [
    "(not set on the live page.)",
    "(no live title)",
    "(no title)",
    "untitled",
    "n/a",
  ];
  return !bad.includes(live.toLowerCase());
}

function gainClicks(proposed = {}, opportunity = "") {
  const blob = `${proposed.expectedGain || ""} ${proposed.gain || ""} ${opportunity || ""}`;
  const m = blob.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

/**
 * One colour for a change — same on Today's moves and Site scan.
 * Urgency of shipping a change, not a grade of the existing title text.
 */
export function changeBoardColor(change) {
  if (!change) return "yellow";
  const status = String(change.status || "").toLowerCase();
  if (status === "monitoring" || status === "applied") return "blue";
  if (status === "closed") return "green";

  const proposed = change.proposed || {};
  const explicit = String(change.priority || proposed.priority || proposed.urgency || "").toLowerCase();
  if (["high", "critical", "dire", "urgent"].includes(explicit)) return "red";
  if (["medium", "low", "normal"].includes(explicit)) return "yellow";

  const opp = String(change.opportunity || "").toLowerCase();
  if (
    !hasUsableLiveTitle(proposed) ||
    opp.includes("no title") ||
    opp.includes("missing title") ||
    opp.includes("empty title")
  ) {
    return "red";
  }

  if (gainClicks(proposed, change.opportunity) >= 40) return "red";

  // Open meta rewrites with a live title → medium urgency by default.
  return "yellow";
}

export function findingBoardColor(finding) {
  return severityToBoardColor(finding?.severity);
}

/** Prefer the change colour when both exist so scan + moves stay identical. */
export function resolveBoardColor({ finding = null, change = null } = {}) {
  if (change && OPEN_CHANGE_STATUSES.has(String(change.status || "").toLowerCase())) {
    return changeBoardColor(change);
  }
  if (change && (change.status === "monitoring" || change.status === "applied")) {
    return "blue";
  }
  if (finding) return findingBoardColor(finding);
  if (change) return changeBoardColor(change);
  return "yellow";
}

export function boardColorLegend(color) {
  return DOT_META[color] || DOT_META.yellow;
}

/**
 * Stable identity so the same page/suggestion can be found on both boards.
 * Prefer change id when present; otherwise path + kind/finding name.
 */
export function boardTaskKey({ changeId = null, path = "/", kind = "" } = {}) {
  if (changeId != null && changeId !== "") return `change:${changeId}`;
  return `page:${normalizeBoardPath(path)}::${String(kind || "").trim().toLowerCase()}`;
}

export function emptyBoardBuckets() {
  return { red: [], yellow: [], green: [], blue: [], all: [] };
}

/**
 * Build colour buckets shared by Site scan.
 * When a change exists for a finding's page, the change colour wins.
 */
export function buildColourBoard({ findings = [], changes = [], lockedPaths = [] } = {}) {
  const buckets = emptyBoardBuckets();
  const byPath = new Map();
  const openChanges = [];

  for (const change of changes || []) {
    const path = normalizeBoardPath(
      (() => {
        try {
          return change?.targetUrl ? new URL(change.targetUrl).pathname : "/";
        } catch {
          return change?.targetUrl || "/";
        }
      })(),
    );
    const status = String(change.status || "").toLowerCase();
    if (OPEN_CHANGE_STATUSES.has(status)) {
      openChanges.push(change);
      if (!byPath.has(path)) byPath.set(path, change);
    }
  }

  const seen = new Set();
  const push = (task) => {
    const key = boardTaskKey(task);
    if (seen.has(key)) return;
    seen.add(key);
    const color = task.c;
    if (!buckets[color]) return;
    buckets[color].push(task.t);
    buckets.all.push(task);
  };

  for (const finding of findings || []) {
    const page = finding.pages?.[0] || finding.detail || "/";
    const path = normalizeBoardPath(page);
    const change = byPath.get(path) || null;
    const kind = String(finding.name || "Finding").trim() || "Finding";
    const color = resolveBoardColor({ finding, change });
    push({
      c: color,
      t: `${kind} · ${path}`,
      path,
      kind,
      changeId: change?.id ?? null,
      findingKey: finding.key || finding.name || "",
    });
  }

  for (const change of openChanges) {
    let path = "/";
    try {
      path = normalizeBoardPath(change.targetUrl ? new URL(change.targetUrl).pathname : "/");
    } catch {
      path = normalizeBoardPath(change.targetUrl || "/");
    }
    const opp = String(change.opportunity || "").trim();
    const kind = opp
      ? opp.split("·")[0].split("—")[0].trim().slice(0, 48) || "Title rewrite"
      : String(change.changeType || "meta").toLowerCase() === "meta"
        ? "Title rewrite"
        : "Page update";
    const key = boardTaskKey({ changeId: change.id, path, kind });
    if (seen.has(key)) continue;
    // Skip if a finding already covers this path with same change id
    if (buckets.all.some((row) => row.changeId === change.id || (row.path === path && row.changeId))) {
      continue;
    }
    const color = changeBoardColor(change);
    push({
      c: color,
      t: `${kind} · ${path}`,
      path,
      kind,
      changeId: change.id,
      findingKey: "",
    });
  }

  for (const locked of lockedPaths || []) {
    const path = normalizeBoardPath(locked);
    push({
      c: "blue",
      t: `Winning — leave as is · ${path}`,
      path,
      kind: "Winning — leave as is",
      changeId: null,
      findingKey: "",
    });
  }

  return buckets;
}
