/** Build HQ overview view-model from /api/v1/hq/overview payload. */

function money(v) {
  return `$${Math.round(Number(v) || 0).toLocaleString("en-US")}`;
}

export function buildHqOverviewModel(api, range) {
  const PRICE = { ...(api?.prices || { solo: 29, pro: 79, premium: 399, ent: 1250 }) };
  const months = Array.isArray(api?.months) && api.months.length
    ? api.months
    : ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const P =
    Array.isArray(api?.planCounts) && api.planCounts.length
      ? api.planCounts
      : [
          [6, 3, 1, 0],
          [10, 5, 2, 0],
          [15, 8, 3, 0],
          [19, 11, 5, 0],
          [24, 15, 7, 1],
          [29, 19, 10, 1],
          [34, 24, 13, 1],
          [38, 29, 17, 2],
          [44, 34, 21, 2],
          [49, 39, 25, 3],
          [54, 44, 28, 3],
          [58, 49, 31, 4],
        ];
  const parts = P.map((p) => [p[0] * PRICE.solo, p[1] * PRICE.pro, p[2] * PRICE.premium, p[3] * PRICE.ent]);
  const tot = parts.map((x) => x.reduce((a, b) => a + b, 0));
  const max = 25000;
  const Yv = (v) => 250 - (v / max) * 226;
  const bw = 38;
  const gap = (654 - 12 * bw) / 12;
  const bars = parts.map((x, i) => {
    const px = 58 + gap / 2 + i * (bw + gap);
    let acc = 0;
    const seg = x.map((v) => {
      const y0 = Yv(acc);
      const y1 = Yv(acc + v);
      acc += v;
      return { y: y1, h: Math.max(0, y0 - y1) };
    });
    return {
      x: px,
      w: bw,
      cx: px + bw / 2,
      label: months[i] || "",
      y1: seg[0].y,
      h1: seg[0].h,
      y2: seg[1].y,
      h2: seg[1].h,
      y3: seg[2].y,
      h3: seg[2].h,
      y4: seg[3].y,
      h4: seg[3].h,
    };
  });
  const mgrid = [5000, 10000, 15000, 20000, 25000].map((v) => ({
    y: Yv(v),
    ty: Yv(v) + 4,
    label: `$${v / 1000}k`,
  }));
  const lastBar = bars[bars.length - 1];
  const last = { cx: lastBar.cx, ty: Yv(tot[tot.length - 1]) - 8, value: money(tot[tot.length - 1]) };
  const custs = P.map((p) => p.reduce((a, b) => a + b, 0));
  const mrrNow = tot[tot.length - 1];
  const mrrPrev = tot[tot.length - 2] || mrrNow;
  const R = range || "30";
  const funnels = api?.funnels || {
    30: [12400, 1860, 212, 123, 16],
    90: [34100, 5050, 581, 331, 57],
    365: [118000, 17400, 1980, 1130, 189],
  };
  const healthMap = api?.health || {
    30: [96, "3.8%", "69%", "7 min"],
    90: [262, "4.1%", "67%", "8 min"],
    365: [804, "4.6%", "64%", "11 min"],
  };
  const F = funnels[R] || funnels["30"];
  const H = healthMap[R] || healthMap["30"];
  const label = { 30: "last 30 days", 90: "last 90 days", 365: "last 12 months" }[R];
  const names = ["Site visitors", "Free scans run", "Sign-ups", "Activated (both plug-ins)", "Became paying"];
  const fcol = ["#5B616B", "#8A93A3", "#B9D96A", "#C9EC72", "#D5F879"];
  const funnel = F.map((v, i) => ({
    name: names[i],
    value: Number(v).toLocaleString("en-US"),
    pct: `${Math.max(1.5, (v / F[0]) * 100).toFixed(1)}%`,
    color: fcol[i],
    step: i === 0 ? "Landing page and pricing" : `${Math.round((v / F[i - 1]) * 100)}% of the step before`,
  }));
  const kpis = [
    {
      label: "Monthly recurring revenue",
      value: money(mrrNow),
      sub: `+${(((mrrNow / mrrPrev - 1) * 100).toFixed(1))}% vs last month`,
      color: "#3DDC84",
    },
    {
      label: "Paying customers",
      value: String(custs[custs.length - 1]),
      sub: `+${custs[custs.length - 1] - custs[custs.length - 2]} net this month`,
      color: "#3DDC84",
    },
    { label: "Revenue per customer", value: money(mrrNow / Math.max(1, custs[custs.length - 1])), sub: "per month", color: "#9AA1AB" },
    {
      label: "Activation",
      value: `${Math.round((F[3] / Math.max(1, F[2])) * 100)}%`,
      sub: "target 60%",
      color: F[3] / Math.max(1, F[2]) >= 0.6 ? "#3DDC84" : "#FFC53D",
    },
    {
      label: "Trial to paid",
      value: `${Math.round((F[4] / Math.max(1, F[3])) * 100)}%`,
      sub: "target 25%",
      color: F[4] / Math.max(1, F[3]) >= 0.25 ? "#3DDC84" : "#FFC53D",
    },
    {
      label: "Monthly churn",
      value: api?.churn || "2.1%",
      sub: api?.churnNote || "3 cancellations · target under 3%",
      color: "#3DDC84",
    },
  ];
  const health = [
    { label: "Moves shipped", sub: "approved and live", value: String(Number(H[0]) * 10), color: "#F2F4F5" },
    { label: "Undo rate", sub: "target under 5%", value: H[1], color: "#3DDC84" },
    { label: "Win rate", sub: "measured changes with a positive result", value: H[2], color: "#3DDC84" },
    { label: "Time to first ship", sub: "median, sign-up to first approved move", value: H[3], color: "#3DDC84" },
  ];
  const pc = ["#4A5160", "#8A93A3", "#D5F879", "#9FE7F5"];
  const pn = ["Solo · $29", "Pro · $79", "Premium · $399", "Enterprise"];
  const mix = parts[parts.length - 1].map((v, i) => ({
    name: pn[i],
    color: pc[i],
    count: String(P[P.length - 1][i]),
    mrr: money(v),
    share: `${Math.round((v / Math.max(1, mrrNow)) * 100)}%`,
  }));
  const legend = pn.map((n, i) => ({ name: n.split(" ·")[0], color: pc[i] }));
  const affiliates = Array.isArray(api?.affiliates) ? api.affiliates : [];

  return {
    headline: `${money(mrrNow)} a month, up ${(((mrrNow / mrrPrev - 1) * 100).toFixed(1))}% on last month.`,
    rangeLabel: label,
    kpis,
    bars,
    mgrid,
    last,
    legend,
    mrrAria: `Monthly recurring revenue by plan, last 12 months, now ${money(mrrNow)}`,
    funnel,
    health,
    mix,
    affiliates,
    problemsCount: String(api?.problemsCount ?? 9),
    live: Boolean(api?.live),
  };
}
