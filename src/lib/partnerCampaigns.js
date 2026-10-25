/**
 * Ready-made partner campaign messages. Every one carries the partner's own link and a commission disclosure,
 * and none promises rankings or traffic (partner rules + US FTC endorsement guides).
 */

export function referralLink(handle) {
  return `searchify.io/?ref=${handle || "your-handle"}`;
}

export function campaignMessages(handle) {
  const link = referralLink(handle);
  return [
    {
      id: "page-two",
      title: "The page-2 problem",
      channel: "Instagram or Facebook",
      text:
        `Your best page might be sitting on page 2 of Google, where almost nobody looks.\n\n` +
        `I use Searchify on WordPress sites to find the pages that are close to ranking, rewrite their titles and descriptions, and fix what's slowing them down. Nothing goes live until I approve it, and any change can be undone.\n\n` +
        `Try it: ${link}\n(I earn a commission if you sign up, at no extra cost to you.)`,
    },
    {
      id: "titles",
      title: "Titles that earn the click",
      channel: "LinkedIn",
      text:
        `Most WordPress sites leave clicks on the table with titles like "Home" or "Services".\n\n` +
        `Searchify reads your real Search Console data, then suggests a title and description for every page, written for what people actually search. You review each one before it ships, and results are measured afterwards.\n\n` +
        `I've been using it for client sites. Partner link (I earn a commission): ${link}`,
    },
    {
      id: "local",
      title: "For local businesses",
      channel: "Facebook group or community",
      text:
        `For local business owners on WordPress: if people in your area search for what you do and find a competitor first, start with the basics: clear page titles, real keywords and a contact page Google understands.\n\n` +
        `Searchify does that page by page and asks before changing anything. Plans start at $29 a month.\n\n` +
        `${link}. Disclosure: that's my partner link, so I earn a commission if you join.`,
    },
    {
      id: "agency",
      title: "Agency time-saver",
      channel: "LinkedIn or email to agencies",
      text:
        `If you look after several client sites, SEO upkeep is the job that never gets done.\n\n` +
        `Searchify scans every client site, drafts the title, description and keyword fixes, and puts them in one approval queue. Approve, ship, and keep a change log you can show the client.\n\n` +
        `Worth a look: ${link}. I'm a Searchify partner and earn a commission if you sign up.`,
    },
    {
      id: "short-video",
      title: "Short video caption",
      channel: "TikTok, Reels or Shorts",
      text: `3 SEO fixes most WordPress sites skip: page titles, meta descriptions, broken links. Searchify finds all three and asks before fixing. ${link} #ad I earn a commission if you sign up.`,
    },
    {
      id: "youtube",
      title: "Video description",
      channel: "YouTube or podcast",
      text:
        `Tool from this video: Searchify, SEO for WordPress sites. It scans your pages, suggests better titles, descriptions and keywords from real search data, and only changes what you approve.\n\n` +
        `Affiliate link: ${link}. I earn a commission if you subscribe, at no extra cost to you.`,
    },
    {
      id: "x-post",
      title: "Short post",
      channel: "X / Threads",
      text: `SEO doesn't have to be guesswork. Searchify shows which WordPress pages are close to ranking and drafts the fixes for you to approve. ${link} (#ad, I earn a commission)`,
    },
    {
      id: "newsletter",
      title: "Newsletter feature",
      channel: "Email or newsletter",
      text:
        `Subject: The SEO tool I actually use\n\n` +
        `Quick recommendation this week. If you run a WordPress site, Searchify connects to it, scans every page and suggests better titles, descriptions and keywords based on real search data. It reads Google Search Console so you can see what changed, and nothing goes live without your OK.\n\n` +
        `Plans start at $29 a month: ${link}\n\n` +
        `Heads up: this is a partner link, so I get paid if you become a customer. I only recommend tools I use.`,
    },
    {
      id: "store",
      title: "For online stores",
      channel: "WooCommerce communities",
      text:
        `WooCommerce store owners: product and category pages with weak titles and empty descriptions are easy SEO wins.\n\n` +
        `Searchify drafts them for every page from real search data, checks each change live, and you approve before anything ships.\n\n` +
        `${link}. I earn a commission if you sign up through it.`,
    },
    {
      id: "dm",
      title: "Message to a friend",
      channel: "WhatsApp or DM",
      text: `Hey! You mentioned your site isn't getting found on Google. I've been using Searchify for that: it suggests better titles and keywords and only changes what you approve. ${link}. Full disclosure, it's my partner link, so I'd earn a commission.`,
    },
  ];
}

/** Plain-text pack: all messages plus a 3-email welcome sequence, for the "Sample posts and emails" download. */
export function copyPackText(handle, name = "") {
  const link = referralLink(handle);
  const lines = [
    "SEARCHIFY PARTNER COPY PACK",
    `Your link: https://${link}`,
    "",
    "Rules: say you earn a commission before people click; describe Searchify accurately; never promise rankings or traffic.",
    "",
    "================ POSTS ================",
  ];
  for (const m of campaignMessages(handle)) {
    lines.push("", `--- ${m.title} (${m.channel}) ---`, m.text);
  }
  lines.push(
    "",
    "================ 3-EMAIL SEQUENCE ================",
    "",
    "EMAIL 1 (day 0)",
    "Subject: Is your website showing up on Google?",
    "",
    `Hi {first name},\n\nMost WordPress sites lose visitors to small things: page titles that say "Home", missing descriptions, broken links. They're easy to fix once you know where they are.\n\nI use Searchify for this. It scans every page and lists the fixes, and nothing changes without your approval.\n\nHave a look: https://${link}\n\n${name || "{your name}"}\n\nP.S. This is a partner link, so I earn a commission if you sign up.`,
    "",
    "EMAIL 2 (day 3)",
    "Subject: The 3 fixes I'd start with",
    "",
    `Hi {first name},\n\nIf you only do three things for SEO this month:\n1. Give every important page a clear title with the words people search.\n2. Write a description that makes someone want to click.\n3. Fix broken links and slow pages.\n\nSearchify drafts all three from your real Google data and checks every change live: https://${link}\n\n${name || "{your name}"}\n(Partner link: I earn a commission.)`,
    "",
    "EMAIL 3 (day 7)",
    "Subject: Last note on this",
    "",
    `Hi {first name},\n\nLast email on this one. If you'd like your site to do more of the work, Searchify plans start at $29 a month, you approve every change, and anything can be undone.\n\nhttps://${link}\n\nEither way, happy to answer questions.\n${name || "{your name}"}\n\nDisclosure: I earn a commission if you become a customer.`,
  );
  return lines.join("\n");
}
