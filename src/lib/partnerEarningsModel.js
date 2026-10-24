/** Build PartnerEarnings view-model from /api/v1/partners/earnings payload. */

function money(v) {
  return (v < 0 ? "−$" : "$") + Math.abs(Number(v) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const STY = {
  hold: ["In 30-day hold", "#4DA3FF"],
  cleared: ["Cleared", "#3DDC84"],
  reversed: ["Reversed", "#FFC53D"],
  paid: ["Paid", "#9AA1AB"],
};

export function buildPartnerEarningsModel(api, filter) {
  const RATE = Number(api?.rate) || 0.3;
  const PRICE = api?.prices || { Solo: 29, Pro: 79, Premium: 399 };
  const since = api?.since || "this year";
  const L = Array.isArray(api?.rows) ? api.rows : [];
  const FL = filter || "all";

  const rows = L.filter((r) => FL === "all" || r[3] === FL).map((r) => {
    const plan = r[2];
    const p = PRICE[plan] || 0;
    const c = p * RATE;
    const rev = r[3] === "reversed";
    const sty = STY[r[3]] || STY.cleared;
    return {
      date: r[0],
      who: r[1],
      plan,
      pay: money(p),
      rate: `${Math.round(RATE * 100)}%`,
      earn: rev ? money(-c) : money(c),
      earnColor: rev ? "#FFC53D" : r[3] === "paid" ? "#9AA1AB" : "#D5F879",
      strike: "none",
      status: sty[0],
      color: sty[1],
      note: r[4] || "",
    };
  });

  const D = api?.totals || { cleared: 0, hold: 0, rev: 0, paid: 0 };
  const clearedN = Number(D.cleared) || 0;
  const holdN = Number(D.hold) || 0;
  const revN = Number(D.rev) || 0;
  const paidN = Number(D.paid) || 0;
  const isFounding = (api?.tier || "standard") === "founding";

  return {
    cleared: money(clearedN),
    hold: money(holdN),
    totals: [
      { label: "Cleared", value: money(clearedN), sub: "paying on Nov 15", color: "#D5F879", dot: "#3DDC84" },
      {
        label: "In the 30-day hold",
        value: money(holdN),
        sub: "clears over the next 4 weeks",
        color: "#F2F4F5",
        dot: "#4DA3FF",
      },
      { label: "Reversed this month", value: money(revN), sub: "refunds", color: "#FFC53D", dot: "#FFC53D" },
      {
        label: "Paid out so far",
        value: money(paidN),
        sub: `since ${since}`,
        color: "#F2F4F5",
        dot: "#8A93A3",
      },
    ],
    minNote:
      clearedN >= 50
        ? `You’re over the minimum: ${money(clearedN)} goes out Nov 15.`
        : `You’re under the $50 minimum. Cleared balance: ${money(clearedN)}.`,
    rows,
    taxNote: isFounding
      ? "Commissions are fees for your referral work, separate from any dividends on your shares. You report them on your own tax return."
      : "Commissions are fees for your referral work. You report them on your own tax return. Canadian partners paid over $500 in a year also get a T4A slip.",
  };
}
