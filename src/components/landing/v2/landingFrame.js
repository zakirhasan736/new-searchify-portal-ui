const KEYS = ["red", "yellow", "green", "blue"];
const COLORS = { red: "#FF5A4E", yellow: "#FFC53D", green: "#3DDC84", blue: "#4DA3FF" };
const LABELS = { red: "5 URGENT", yellow: "9 WORTH DOING", green: "18 WORKING", blue: "8 WINNING" };
const PATTERN = "gbgygrbgggybgygrbggybggrgbyggbgybgygb";
const MAP = { r: "red", y: "yellow", g: "green", b: "blue" };
const TILE = {
  red: ["Urgent", "Costing you the most. Fix first."],
  yellow: ["Worth doing", "Do these after the reds."],
  green: ["Working", "Meets the criteria. Rechecked weekly."],
  blue: ["Winning", "Winning pages Searchify never touches."],
};
const RGB = { red: "255,90,78", yellow: "255,197,61", green: "61,220,132", blue: "77,163,255" };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function buildLandingFrame(T, data) {
  const D = data;
  const clients = D.clients || {};

  const HC = 150;
  const ht = T % HC;
  const SCAN = 60;
  const lit = Math.min(40, Math.floor((ht * 40) / SCAN));
  const scanning = ht < SCAN;
  const focus = KEYS[Math.floor(Math.max(0, ht - SCAN) / 22) % 4];
  const dots = [];
  for (let i = 0; i < 40; i += 1) {
    const c = MAP[PATTERN[i % PATTERN.length]];
    const ord = (i * 17) % 40;
    if (scanning) {
      const on = ord < lit;
      const fresh = on && ord >= lit - 2;
      dots.push(
        fresh
          ? { color: "#FFFFFF", op: 1, shadow: `0 0 18px #FFFFFF, 0 0 34px ${COLORS[c]}`, scale: 1.25, anim: "none" }
          : on
            ? { color: COLORS[c], op: 1, shadow: `0 0 12px ${COLORS[c]}`, scale: 1, anim: "none" }
            : { color: "#1A1D22", op: 1, shadow: "none", scale: 0.85, anim: "none" },
      );
    } else {
      const on = c === focus;
      dots.push({
        color: COLORS[c],
        op: on ? 1 : 0.18,
        shadow: on ? `0 0 20px ${COLORS[c]}` : "none",
        scale: 1,
        anim: on ? "sfy-flicker 1.4s ease-in-out infinite" : "none",
      });
    }
  }
  const scanPct = `${Math.round((lit / 40) * 100)}%`;

  const examples = D.aiExamples || [];
  const plan = examples.map((item) => {
    const q = item.question.length;
    const a = item.answer.before.length + item.answer.business.length + item.answer.middle.length;
    const z = item.answer.after.length;
    const tq = Math.ceil(q / 3);
    const th = 9;
    const ta = Math.ceil(a / 5);
    const tz = Math.ceil(z / 5);
    return { item, tq, th, ta, tz, tot: tq + 4 + th + ta + tz + 45 };
  });
  const cycle = Math.max(1, plan.reduce((sum, row) => sum + row.tot, 0));
  let ct = plan.length ? T % cycle : 0;
  let ei = 0;
  if (plan.length) {
    while (ct >= plan[ei].tot) {
      ct -= plan[ei].tot;
      ei += 1;
    }
  }
  const current = plan[ei];
  const parts = current ? [current.item.answer.before, current.item.answer.business, current.item.answer.middle, current.item.answer.site, current.item.answer.after] : ["", "", "", "", ""];
  const qShow = current ? Math.min(current.item.question.length, ct * 3) : 0;
  const aStart = current ? current.tq + 4 + current.th : 0;
  const aT = ct - aStart;
  const aChars = current ? Math.max(0, Math.min(parts[0].length + parts[1].length + parts[2].length, aT * 5)) : 0;
  const cut = (str, from) => str.slice(0, Math.max(0, Math.min(str.length, aChars - from)));
  const zT = current ? aT - current.ta : 0;
  const chat = current
    ? {
        topic: current.item.topic,
        q: current.item.question.slice(0, qShow),
        qCaret: qShow < current.item.question.length ? "inline-block" : "none",
        showA: ct >= current.tq + 4,
        thinking: ct >= current.tq + 4 && ct < aStart,
        a1: cut(parts[0], 0),
        a2: cut(parts[1], parts[0].length),
        a3: cut(parts[2], parts[0].length + parts[1].length),
        showSite: aT >= current.ta,
        site: parts[3],
        a4: zT > 0 ? parts[4].slice(0, zT * 5) : "",
        done: zT >= current.tz + 4,
        pips: examples.map((_, index) => (index === ei ? "#3DDC84" : "#262A31")),
      }
    : { topic: "", q: "", qCaret: "none", showA: false, thinking: false, a1: "", a2: "", a3: "", showSite: false, site: "", a4: "", done: false, pips: [] };

  const p1 = T % 70;
  const plug = (name, on, done) => {
    const st = p1 < on ? "off" : p1 < done ? "conn" : "live";
    return {
      name,
      cable: st === "live" ? "#4DA3FF" : "#3A404A",
      glow: st === "live" ? "0 0 12px rgba(77,163,255,.6)" : "none",
      shift: st === "off" ? "-14px" : "0px",
      socket: st === "live" ? "#4DA3FF" : "#262A31",
      led: st === "live" ? "#3DDC84" : st === "conn" ? "#FFC53D" : "#262A31",
      ledGlow: st === "live" ? "0 0 8px #3DDC84" : "none",
      status: st === "live" ? "✓ Connected" : st === "conn" ? "Connecting…" : "Not yet",
      statusColor: st === "live" ? "#3DDC84" : st === "conn" ? "#FFC53D" : "#7D848E",
    };
  };
  const p2 = T % 100;
  const NEWT = "Roof Repair in Calgary | 24/7 Emergency Leaks";
  const typedN = clamp((p2 - 4) * 2, 0, NEWT.length);
  const litN = clamp(Math.floor((p2 - 30) / 7), 0, 4);
  const published = p2 >= 66;
  const CRIT = ["Has the words people search", "Says where you work", "Right length for Google", "A clear reason to click"];
  const p3 = T % 95;
  const prog = clamp(p3 / 70, 0, 1);
  const baked = p3 >= 72;
  const SEG = [["Published", "Live right away"], ["Google re-reads", "A few days"], ["Measuring", "About 4 weeks"], ["Result in", "Proven, or undone"]];
  const p4 = T % 85;
  const ez = 1 - (1 - clamp(p4 / 45, 0, 1)) ** 3;
  const BEFORE = [44, 40, 46, 42];
  const AFTER = [52, 63, 74, 86];
  const how = {
    plugs: [plug("Google Search Console", 8, 16), plug("WordPress", 22, 30)],
    plugDone: p1 >= 34,
    typed: NEWT.slice(0, typedN),
    caret: typedN < NEWT.length ? "inline-block" : "none",
    newLabel: litN === 4 ? "SEARCHIFY CRITERIA MET" : typedN < NEWT.length ? "SEARCHIFY IS WRITING…" : "CHECKING IT…",
    newLabelColor: litN === 4 ? "#3DDC84" : "#4DA3FF",
    newBorder: litN === 4 ? "#3DDC84" : "#4DA3FF",
    crit: CRIT.map((label, index) => ({
      t: label,
      dot: index < litN ? "#3DDC84" : "#262A31",
      anim: index < litN ? `sfy-gl2 1.8s ${index * 0.3}s ease-in-out infinite` : "none",
      color: index < litN ? "#F2F4F5" : "#7D848E",
    })),
    canPub: !published,
    published,
    pubBg: litN === 4 ? "#4DA3FF" : "#262A31",
    pubGlow: litN === 4 ? "0 0 20px rgba(77,163,255,.5)" : "none",
    pubScale: p2 >= 62 ? 0.95 : 1,
    dayLabel: baked ? "Day 28 · done" : `Day ${Math.max(1, Math.round(prog * 28))} of 28`,
    dayColor: baked ? "#3DDC84" : "#F2F4F5",
    segs: SEG.map((row, index) => {
      const amount = clamp(prog * 4 - index, 0, 1);
      const cur = !baked && amount > 0 && amount < 1;
      const col = baked ? "#3DDC84" : index === 2 ? "#FFC53D" : "#4DA3FF";
      return {
        label: row[0],
        sub: row[1],
        w: `${baked ? 100 : Math.round(amount * 100)}%`,
        fill: cur ? `repeating-linear-gradient(135deg, ${col} 0 6px, rgba(255,255,255,.35) 6px 12px)` : col,
        anim: cur ? "sfy-march 1s linear infinite" : "none",
        labelColor: baked || amount > 0 ? "#F2F4F5" : "#7D848E",
      };
    }),
    baking: !baked,
    baked,
    vis: String(Math.round(64 * ez)),
    rank: String(9 - Math.round(4 * ez)),
    calls: String(Math.max(0, Math.round(2 * ez))),
    bars: BEFORE.map((h) => ({ h: `${h}%`, c: "#3A404A" })).concat(AFTER.map((h) => ({ h: `${Math.round(42 + (h - 42) * ez)}%`, c: "#3DDC84" }))),
    earned: p4 >= 50,
  };

  const soapKeywords = clients.soap?.keywords || [];
  const soapRows = soapKeywords.map((keyword, index) => ({ kw: keyword, up: String(3 + ((index * 7) % 14)) }));
  const soapCountMax = clients.soap?.keywordCount || 0;
  const soap = {
    rows: soapRows.concat(soapRows),
    count: `${Math.min(soapCountMax, Math.round(((T % 120) / 60) * soapCountMax))}${(T % 120) >= 60 ? "+" : ""}`,
  };

  const ac = T % 80;
  const acaRank = ac < 10 ? 5 : ac < 20 ? 4 : ac < 30 ? 3 : ac < 40 ? 2 : 1;
  const others = ["72%", "58%", "66%", "50%"];
  const acaRows = [{ key: "us" }, ...others.map((width, index) => ({ key: `o${index}`, w: width }))].map((row) => {
    const us = row.key === "us";
    let rank = acaRank;
    if (!us) {
      const oIdx = parseInt(row.key.slice(1), 10);
      let n = 0;
      for (let r = 1; r <= 5; r += 1) {
        if (r === acaRank) continue;
        if (n === oIdx) {
          rank = r;
          break;
        }
        n += 1;
      }
    }
    const top1 = us && rank === 1;
    return {
      key: row.key,
      isUs: us,
      w: row.w || "",
      rank: String(rank),
      top: `${66 + (rank - 1) * 50}px`,
      showTop: top1 && ac >= 44,
      bg: us ? (top1 ? "rgba(61,220,132,.12)" : "rgba(77,163,255,.1)") : "#101215",
      border: us ? (top1 ? "rgba(61,220,132,.7)" : "rgba(77,163,255,.55)") : "#1A1D22",
      glow: top1 ? "0 0 24px rgba(61,220,132,.3)" : "none",
      rankColor: us ? (top1 ? "#3DDC84" : "#8CC4FF") : "#5B616B",
    };
  });

  const pc = T % 110;
  const filled = Math.min(20, Math.floor(pc / 5));
  const ringing = pc % 5 < 3 && filled < 20;
  const SLOTORD = [3, 11, 6, 17, 0, 14, 8, 19, 5, 12, 1, 16, 9, 4, 18, 13, 7, 2, 15, 10];
  const TIMES = ["9:00", "10:30", "1:00", "2:30", "4:00"];
  const phys = {
    booked: String(filled),
    callTitle: filled >= 20 ? "Week fully booked" : ringing ? "Incoming call" : "Booked",
    callSub: filled >= 20 ? "Same again next week" : ringing ? "Found you on Google" : "Added to the calendar",
    callBg: ringing ? "#3DDC84" : "#4DA3FF",
    callBorder: ringing ? "rgba(61,220,132,.6)" : "#262A31",
    ring: ringing ? "sfy-ring3 .9s ease-in-out infinite" : "none",
    days: ["MON", "TUE", "WED", "THU", "FRI"].map((name, day) => ({
      name,
      slots: [0, 1, 2, 3].map((slot) => {
        const idx = day * 4 + slot;
        const rank = SLOTORD.indexOf(idx);
        const on = rank > -1 && rank < filled;
        const fresh = rank === filled - 1;
        return {
          t: on ? TIMES[slot] : "",
          bg: on ? "#3DDC84" : "#101215",
          border: on ? "#3DDC84" : "#1A1D22",
          anim: fresh ? "sfy-pop2 .4s ease-out both" : "none",
        };
      }),
    })),
  };

  const aiCards = [
    { n: "01", title: "Let AI in the door", body: "Many sites accidentally block the bots ChatGPT and Perplexity use to read the web. We check, and fix it on WordPress.", tag: "Included", tagColor: "#3DDC84", tagBg: "rgba(61,220,132,.12)" },
    { n: "02", title: "Say it plainly", body: "AI quotes pages that answer clearly: what you do, where, and for whom. Searchify rewrites the pages that don’t.", tag: "Included", tagColor: "#3DDC84", tagBg: "rgba(61,220,132,.12)" },
    { n: "03", title: "Get seen beyond Google", body: "Every change is pushed to Bing too, which feeds Copilot and is one of the sources ChatGPT draws on.", tag: "Included", tagColor: "#3DDC84", tagBg: "rgba(61,220,132,.12)" },
    { n: "04", title: "See if AI mentions you", body: "Check whether ChatGPT, Perplexity and Google’s AI bring up your business for the searches that matter.", tag: "Coming soon", tagColor: "#FFC53D", tagBg: "rgba(255,197,61,.12)" },
  ];
  const vsRows = [
    { what: "Sees your real Google data", chat: "Only what you paste in", us: "Connected to Search Console and Analytics, with months of history" },
    { what: "Knows your competitors’ rankings", chat: "Guesses", us: "Real search data on who outranks you, and for what" },
    { what: "Changes your website", chat: "No, you copy and paste", us: "Publishes the fix to your website once you approve it" },
    { what: "Checks the change worked", chat: "No", us: "Reads the page back to confirm it’s live" },
    { what: "Measures the result", chat: "No", us: "Before and after, about a month later" },
    { what: "Undo", chat: "No", us: "One click, with a full change log" },
    { what: "Keeps watching", chat: "Only when you ask", us: "Every week, and alerts you if something slips" },
  ];

  return {
    D,
    dots,
    scanPct,
    scanDone: !scanning,
    litLabel: scanning ? `SCANNING · ${scanPct}` : LABELS[focus],
    litColor: scanning ? "#F2F4F5" : COLORS[focus],
    chat,
    how,
    soap,
    acaRows,
    phys,
    aiCards,
    vsRows,
    colors: COLORS,
    rgb: RGB,
    tileCopy: TILE,
    keys: KEYS,
  };
}

export const BOARD = {
  red: {
    tag: "URGENT · NEW GOOGLE TITLE",
    page: "/services/roof-repair",
    title: "Your title hides the two words people search for.",
    isFix: true,
    beforeT: "Roof Repair Services | Northline Roofing",
    beforeD: "Learn more about our roof repair services.",
    afterT: "Roof Repair in Calgary — 24/7 Emergency Leaks | Northline",
    afterD: "Same-day leak repairs across Calgary. Written quote before any work starts.",
    gain: "+40–90 visitors / month",
  },
  yellow: {
    tag: "WORTH DOING · DESCRIPTION",
    page: "/services/siding",
    title: "Google is guessing your description. Give it a real one.",
    isFix: true,
    beforeT: "Siding | Northline Roofing",
    beforeD: "(No description. Google shows a random sentence from the page.)",
    afterT: "Siding Repair & Replacement in Calgary | Northline",
    afterD: "Hail-damaged siding? Calgary crews, insurance help, quotes in 24 hours.",
    gain: "+10–20 visitors / month",
  },
  green: {
    tag: "WORKING · 4 CHECKS",
    page: "/contact",
    title: "This page passes. Nothing to fix.",
    isList: true,
    rows: [
      ["Title length OK", "52 characters"],
      ["Indexed by Google", "last crawl 3 days ago"],
      ["Mobile-friendly", "no layout issues"],
      ["Loads fast", "1.8s on phones"],
    ].map((row) => ({ title: row[0], sub: row[1], icon: "✓", bg: "rgba(61,220,132,.15)", fg: "#3DDC84" })),
    foot: "Searchify rechecks green pages every week. If one slips, it turns yellow and lands in your queue.",
  },
  blue: {
    tag: "WINNING · LOCKED",
    page: "/services/flat-roofs",
    title: "This page is winning. Searchify won’t touch it.",
    isList: true,
    rows: [
      ["#2 on Google", "flat roof repair calgary"],
      ["+71% visitors", "since the September change"],
      ["3 leads a month", "from this page alone"],
      ["Locked", "unlocks only if rankings drop for 2 weeks"],
    ].map((row, index) => ({ title: row[0], sub: row[1], icon: index === 3 ? "🔒" : "▲", bg: "rgba(77,163,255,.15)", fg: "#4DA3FF" })),
    foot: "Locked pages are protected from automation, so a good result never gets “optimised” away.",
  },
};

export const CHANGE_LOG = [
  { id: "a", type: "TITLE", what: "Roof repair title now mentions Calgary + 24/7", sub: "/services/roof-repair · Oct 14" },
  { id: "b", type: "IMAGE", what: "Alt text added to 9 skylight photos", sub: "/services/skylights · Oct 12" },
  { id: "c", type: "META", what: "New description for the siding page", sub: "/services/siding · Oct 9" },
  { id: "d", type: "LINKS", what: "3 posts now link to gutter guards", sub: "/services/gutter-guards · Oct 6" },
];

export const LOOK_FOR = ["Google", "ChatGPT", "Google AI Overviews", "Perplexity", "Gemini", "Microsoft Copilot", "Claude", "Bing"];
