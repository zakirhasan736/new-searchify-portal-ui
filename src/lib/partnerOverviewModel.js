/** Build PartnerOverview view-model from /api/v1/partners/overview payload. */

function money(v) {
  return `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PRICE = { Solo: 29, Pro: 79, Premium: 399 };

function nextPayoutLabel(now = new Date()) {
  const day = now.getDate() > 15 ? new Date(now.getFullYear(), now.getMonth() + 1, 15) : new Date(now.getFullYear(), now.getMonth(), 15);
  return day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function buildPartnerOverviewModel(api, state) {
  const F = (api?.tier || "standard") === "founding";
  const RATE = Number(api?.rate) || (F ? 0.35 : 0.3);
  const CLICKS = Array.isArray(api?.clicks) && api.clicks.length ? api.clicks : Array(8).fill(0);
  const SIGNUPS = Array.isArray(api?.signups) && api.signups.length ? api.signups : Array(CLICKS.length).fill(0);
  const PAYING = Array.isArray(api?.payingSeries) && api.payingSeries.length ? api.payingSeries : Array(CLICKS.length).fill(0);
  const MIX = api?.mix || { Solo: 0, Pro: 0, Premium: 0 };
  const PAY = Array.isArray(api?.payouts) ? api.payouts : [];
  const REFS = Array.isArray(api?.refs) ? api.refs : [];
  const N = CLICKS.length;
  const monthly = Number(api?.monthlyCommission) || Object.keys(PRICE).reduce((a, k) => a + (MIX[k] || 0) * PRICE[k] * RATE, 0);
  const refMrr = Number(api?.refMrr) || Object.keys(PRICE).reduce((a, k) => a + (MIX[k] || 0) * PRICE[k], 0);
  const paid = Number(api?.paidOut) || PAY.reduce((a, p) => a + (Number(p?.[1]) || 0), 0);
  const hold = Number(api?.hold) || 0;
  const since = api?.since || "this year";
  const handle = api?.handle || "partner";
  const qual = Math.min(Number(api?.qualified) || 0, 10);

  const R = state.range;
  const W = { 30: Math.min(4, N), 90: Math.min(13, N), all: N }[R] || N;
  const sum = (arr) => arr.slice(N - W).reduce((a, b) => a + (Number(b) || 0), 0);
  const cl = sum(CLICKS);
  const su = sum(SIGNUPS);
  const pa = sum(PAYING);
  const last2 = PAY.slice(-2).reduce((a, p) => a + (Number(p?.[1]) || 0), 0);
  const earnedRange = R === "all" ? paid + monthly : R === "90" ? last2 + monthly : monthly;
  const M = state.metric;

  const metricDefs = [
    ["clicks", "Link clicks", cl.toLocaleString("en-US"), "people who clicked your link"],
    ["signups", "Sign-ups", String(su), `${((su / Math.max(1, cl)) * 100).toFixed(1)}% of clicks`],
    ["paying", "Became paying", String(pa), `${Math.round((pa / Math.max(1, su)) * 100)}% of sign-ups`],
  ];
  const kpis = metricDefs.map((d) => {
    const on = d[0] === M;
    return {
      key: d[0],
      label: d[1],
      value: d[2],
      sub: d[3],
      valueColor: "#F2F4F5",
      pressed: on,
      cursor: "pointer",
      bg: on ? "rgba(213,248,121,.06)" : "#101215",
      border: on ? "#D5F879" : "#1A1D22",
      glow: on ? "0 0 22px rgba(213,248,121,.15)" : "none",
    };
  });
  const nPaying = Object.keys(MIX).reduce((a, k) => a + (MIX[k] || 0), 0);
  kpis.push({
    key: "paying-now",
    label: "Paying right now",
    value: String(nPaying),
    sub: `${MIX.Solo || 0} Solo · ${MIX.Pro || 0} Pro · ${MIX.Premium || 0} Premium`,
    valueColor: "#F2F4F5",
    pressed: false,
    cursor: "default",
    bg: "#101215",
    border: "#1A1D22",
    glow: "none",
  });
  kpis.push({
    key: "earned",
    label: "You earned",
    value: money(earnedRange),
    sub: R === "all" ? "since you joined, incl. this month" : "in this period",
    valueColor: "#D5F879",
    pressed: false,
    cursor: "default",
    bg: "#101215",
    border: "#1A1D22",
    glow: "none",
  });

  const series = { clicks: CLICKS, signups: SIGNUPS, paying: PAYING }[M].slice(N - W);
  const hi = Math.max(2, Math.max(...series, 0) * 1.15);
  const bw = Math.min(40, (668 / Math.max(1, W)) * 0.62);
  const COL = { clicks: "#4DA3FF", signups: "#D5F879", paying: "#3DDC84" };
  const bars = series.map((v, i) => {
    const h = (v / hi) * 200;
    const slot = 668 / Math.max(1, W);
    return {
      x: (44 + i * slot + (slot - bw) / 2).toFixed(1),
      w: bw.toFixed(1),
      y: (230 - h).toFixed(1),
      h: Math.max(0, h).toFixed(1),
      color: COL[M],
    };
  });
  const raw = hi / 4;
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const gstep = [1, 2, 5, 10].map((m) => m * mag).find((v) => v >= raw) || 1;
  const grid = [];
  for (let v = gstep; v < hi; v += gstep) {
    grid.push({
      y: (230 - (v / hi) * 200).toFixed(1),
      ty: (234 - (v / hi) * 200).toFixed(1),
      label: String(Math.round(v * 10) / 10),
    });
  }
  const wk = (i) => {
    const d = new Date(Date.now() - (N - 1 - i) * 7 * 864e5);
    return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]} ${d.getDate()}`;
  };
  const every = W <= 4 ? 1 : W <= 13 ? 3 : 5;
  const xl = [];
  for (let i = 0; i < W; i += every) {
    const slot = 668 / Math.max(1, W);
    xl.push({ x: (44 + i * slot + slot / 2).toFixed(1), label: wk(N - W + i) });
  }
  const tag = state.tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
  const q = `?ref=${handle}${tag ? `&c=${tag}` : ""}`;
  const link =
    state.dest === "agencies"
      ? `https://searchify.io/${q}#agencies`
      : `https://searchify.io${state.dest === "pricing" ? "/pricing" : "/"}${q}`;
  const ST = {
    paying: ["Paying", "#3DDC84"],
    trial: ["In free trial", "#4DA3FF"],
    cancelled: ["Cancelled", "#7D848E"],
  };
  const refs = REFS.map((r) => ({
    date: r[0],
    who: r[1],
    plan: r[2],
    status: (ST[r[3]] || ST.cancelled)[0],
    color: (ST[r[3]] || ST.cancelled)[1],
    earn:
      r[3] === "paying"
        ? money(PRICE[r[2]] * RATE)
        : r[3] === "trial"
          ? `from ${money(PRICE[r[2]] * RATE)}`
          : "—",
    earnColor: r[3] === "paying" ? "#D5F879" : "#7D848E",
  }));
  const payouts = [
    {
      date: "Next payout · 15th",
      amount: money(monthly),
      status: "Scheduled",
      color: "#4DA3FF",
      bg: "rgba(77,163,255,.12)",
      method: "Cleared commissions so far",
    },
  ].concat(
    PAY.slice()
      .reverse()
      .map((p) => ({
        date: p[0],
        amount: money(p[1]),
        status: "Paid",
        color: "#3DDC84",
        bg: "rgba(61,220,132,.12)",
        method: "PayPal",
      })),
  );
  const rate = F
    ? {
        title: "Your founding partner rate",
        sub: "Of every payment, for each customer’s first 12 months. Locked in by your agreement.",
        now: `${Math.round(RATE * 100)}%`,
        next: "40% for good",
        hasNext: true,
        border: "rgba(213,248,121,.35)",
        count: String(qual),
        window: "6-month qualification window",
        toGo: `${Math.max(0, 10 - qual)} more qualified referrals unlocks 40% for good.`,
        aria: `${qual} of 10 qualified referrals`,
        dots: Array.from({ length: 10 }, (_, i) => ({
          bg: i < qual ? "#D5F879" : "#1A1D22",
          glow: i < qual ? "0 0 8px rgba(213,248,121,.35)" : "none",
        })),
      }
    : {
        title: "Your rate",
        sub: `Of every payment, for each customer’s first 12 months. ${api?.qualified || 0} qualified referrals in the last 6 months.`,
        now: `${Math.round(RATE * 100)}%`,
        next: "",
        hasNext: false,
        border: "#1A1D22",
        count: "",
        window: "",
        toGo: "",
        aria: "",
        dots: [],
      };
  const balances = [
    { label: "Cleared, paying next 15th", sub: "past the 30-day hold", value: money(monthly), color: "#3DDC84", valueColor: "#D5F879" },
    { label: "In the 30-day hold", sub: "clears over the next weeks", value: money(hold), color: "#4DA3FF", valueColor: "#F2F4F5" },
    { label: "Paid out so far", sub: `since ${since}`, value: money(paid), color: "#8A93A3", valueColor: "#F2F4F5" },
  ];

  return {
    nextPayout: money(monthly),
    payoutOn: nextPayoutLabel(),
    earnedLine: `${money(paid + monthly)} earned since ${since} · ${money(paid)} already paid out · your referrals bring in ${money(refMrr)} a month`,
    rate,
    balances,
    kpis,
    bars,
    grid,
    xl,
    link,
    refs,
    payouts,
    refSummary: api?.refSummary || `${su} sign-ups · ${nPaying} paying`,
    empty: N === 0 || (cl === 0 && su === 0 && nPaying === 0 && !REFS.length),
  };
}
