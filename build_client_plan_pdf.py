"""Client PDF that follows the Searchify architecture canvas."""

from fpdf import FPDF
from fpdf.fonts import FontFace

OUT = r"c:\Users\zakir\Desktop\Searchify-Client-Plan.pdf"

NAVY = (22, 48, 72)
INK = (28, 32, 38)
MUTED = (90, 98, 108)
RULE = (210, 216, 222)
ZEBRA = (245, 247, 250)
WHITE = (255, 255, 255)
PALE = (232, 238, 244)


def face(fill, color=INK, emphasis=None):
    return FontFace(emphasis=emphasis, color=color, fill_color=fill)


class Plan(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*NAVY)
        self.rect(0, 0, self.w, 12, "F")
        self.set_xy(12, 3)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*WHITE)
        self.cell(120, 6, "Searchify architecture")
        self.set_font("Helvetica", "", 9)
        self.cell(self.w - 144, 6, "September 2026", align="R")
        self.set_y(18)

    def footer(self):
        self.set_y(-12)
        self.set_draw_color(*RULE)
        self.line(12, self.get_y(), self.w - 12, self.get_y())
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 8, f"Same content as the Searchify architecture canvas    {self.page_no()}", align="C")


def left(pdf):
    pdf.set_x(pdf.l_margin)


def h2(pdf, text):
    left(pdf)
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*NAVY)
    pdf.multi_cell(0, 7, text)
    pdf.ln(1)


def h3(pdf, text):
    left(pdf)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*NAVY)
    pdf.multi_cell(0, 6, text)
    pdf.ln(1)


def body(pdf, text):
    left(pdf)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, 5.2, text)
    pdf.ln(1.5)


def note(pdf, text):
    left(pdf)
    pdf.set_font("Helvetica", "I", 8.5)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 4.4, text)
    pdf.ln(1.5)


def table(pdf, headers, rows, widths):
    left(pdf)
    pdf.set_font("Helvetica", "", 8)
    head = face(NAVY, WHITE, "BOLD")
    with pdf.table(
        width=sum(widths),
        col_widths=tuple(widths),
        headings_style=head,
        line_height=4.2,
        text_align="LEFT",
        cell_fill_color=ZEBRA,
        cell_fill_mode="ROWS",
        borders_layout="HORIZONTAL_LINES",
        padding=1.4,
        repeat_headings=True,
        first_row_as_headings=True,
    ) as tbl:
        hdr = tbl.row()
        for h in headers:
            hdr.cell(h)
        for row in rows:
            r = tbl.row()
            for cell in row:
                r.cell(cell)
    pdf.ln(2)
    left(pdf)


def ensure(pdf, height):
    if pdf.get_y() + height > pdf.h - 18:
        pdf.add_page()


def card(pdf, x, y, w, h, title, sub, fill, ink):
    pdf.set_fill_color(*fill)
    pdf.set_draw_color(*NAVY)
    pdf.rect(x, y, w, h, "FD")
    pdf.set_text_color(*ink)
    pdf.set_font("Helvetica", "B", 7.5)
    pdf.set_xy(x + 1, y + 2)
    pdf.cell(w - 2, 3.6, title, align="C")
    pdf.set_font("Helvetica", "", 6.5)
    pdf.set_xy(x + 1, y + 7)
    pdf.cell(w - 2, 3.4, sub, align="C")


def varrow(pdf, x, y1, y2):
    pdf.set_draw_color(*MUTED)
    pdf.line(x, y1, x, y2 - 1.2)
    pdf.line(x, y2, x - 1.4, y2 - 2.2)
    pdf.line(x, y2, x + 1.4, y2 - 2.2)


def harrow(pdf, x1, x2, y):
    pdf.set_draw_color(*MUTED)
    pdf.line(x1, y, x2 - 1.2, y)
    step = 1 if x2 > x1 else -1
    pdf.line(x2, y, x2 - 2.2 * step, y - 1.4)
    pdf.line(x2, y, x2 - 2.2 * step, y + 1.4)


def main():
    pdf = Plan(format="A4")
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(12, 16, 12)
    pdf.add_page()

    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, 210, 46, "F")
    pdf.set_xy(14, 12)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(190, 210, 230)
    pdf.cell(0, 5, "CLIENT COPY OF THE ARCHITECTURE CANVAS")
    pdf.set_xy(14, 20)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 10, "Searchify architecture")
    pdf.set_xy(14, 34)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(220, 230, 240)
    pdf.cell(0, 5, "September 2026")

    pdf.set_y(54)
    body(
        pdf,
        "Three doors, one API, one database. The web app, the WordPress plugin, and the browser extension all call the Python API. PostgreSQL stores the facts. Workers fill that database from Google, a crawler, and a SERP index. Qwen writes, Astra reports on a schedule, and Jev scores. A person publishes.",
    )
    table(
        pdf,
        ["", ""],
        [
            ["3 doors", "Web app, WordPress plugin, browser extension"],
            ["25 current pages", "Kept on the same paths"],
            ["7 popups", "Kept on those pages"],
            ["35 new screens", "Added beside the current pages"],
            ["10 surface actions", "Plugin and extension"],
        ],
        (42, 144),
    )

    h2(pdf, "Current pages")
    body(
        pdf,
        "These 25 pages stay in the new app on the same paths. The warning rows are the current gaps: the Site optimization sidebar path uses different casing, Traffic Analytics home is empty, and admin tag management has no route yet. The rebuild keeps each page and closes those three gaps.",
    )
    pages = [
        ["Sign in", "/ and /signin", "Username and password. Client goes to My works. Admin goes to tag management."],
        ["Sign up", "/signup", "Creates a user with role ROLE_CLIENT."],
        ["Forgot password", "/forgotpassword", "Password recovery form."],
        ["My works", "/works", "Client home. Project catalog for adding sites. Sidebar label: My works."],
        ["Site optimization *", "/seooptimization", "Crawl a stored website, page overview, and search insight. Sidebar link uses /SeoOptimization."],
        ["New optimization", "/seooptimization/new", "Opened when no website is saved yet."],
        ["Optimization editing", "/optimizationediting", "Edit an existing optimization."],
        ["Project making", "/projectmaking", "Tags, domains, title fields, suggestion cards, and deep suggestions."],
        ["Website overview", "/dashboard", "Visits, engagement, countries. Sidebar: Dashboard. The route is registered twice."],
        ["Keyword ranking", "/SEOranking", "Rank cards and a ranking table. Sidebar: Keywords."],
        ["Keyword Analyze", "/keywordanalyze/home, /overview", "Search keywords and save groups. Home opens the new-list popup."],
        ["Website Keywords", "/websitekeyword/home, /overview", "Look up a domain. Overview shows organic vs paid and a new-list popup."],
        ["Generate Keywords", "/keywordgeneretor/home, /overview", "Keyword ideas, then a results table of volume and visits."],
        ["Traffic Analytics *", "/trafficsAnalytics/home, /overview", "Home component is empty. Sidebar opens the overview, which has the competitor-list popup."],
        ["Keyword Gap", "/keywordgap/home, /overview", "Compare keywords against competitors, with range filters."],
        ["Keyword Manager", "/keywordmannager/home, /overview", "Own lists and shared lists. Create-list and share popups."],
        ["Organic Research", "/organicsearch/home, /overview", "Organic search landing plus six filter tabs on the detail view."],
        ["Keyword Overview", "/keywordoverview/home, /overview", "Landing page for keyword metrics, then a detail view."],
        ["Domain Overview", "/domainoverview/home, /overview", "Domain-level SEO snapshot, then a detail view."],
        ["Backlink Analytics", "/backlink/home, /overview", "Backlink landing page and a filtered detail view."],
        ["AI Features", "/features", "Local catalog filtered by All, Ads, Grammar, and Blog. Not in the sidebar."],
        ["Text generator", "/text-generator/:id", "Opened from an AI feature card."],
        ["Announcements", "/news", "Static news cards. Not in the sidebar."],
        ["User profile", "/UserProfile", "Photo and editable profile fields. Opened from the header menu."],
        ["Admin tag management *", "/admin/tagmgmt", "Admin login sends the user here. No matching Route exists in this app."],
    ]
    table(pdf, ["Area", "Path", "What the user does"], pages, (40, 52, 94))
    note(pdf, "25 pages. Rows marked * are the current gaps: Site optimization casing, empty Traffic Analytics home, missing admin route.")

    h2(pdf, "Popup behavior")
    table(
        pdf,
        ["Popup", "Opened from", "What it collects"],
        [
            ["Account menu", "Header profile control", "Account settings, Get Help, Sign Out. Shows the JWT subject as the name."],
            ["Analytics menu", "Sidebar Analytics arrow", "Links to the 11 analytics tools. Dashboard, Site optimization, and My works stay outside this menu."],
            ["Create keyword list", "Keyword Manager home, Create List", "List name. Create is enabled after more than 3 characters."],
            ["Share keyword lists", "Keyword Manager home and overview", "Pick a list, enter emails, choose Viewer permission, then create."],
            ["New keyword group", "Keyword Analyze, New list", "Group name and keywords (shown as count / 200). Paste, edit, remove, save, or cancel."],
            ["New list", "Website Keywords overview", "Group name and a keyword field. The save action is thinner than Keyword Analyze."],
            ["Create competitor list", "Traffic Analytics overview", "List name, country, and up to 20 domains, then Create and analyze."],
        ],
        (40, 52, 94),
    )
    note(pdf, "7 popups. These stay on the pages above.")

    h2(pdf, "Architecture")
    body(
        pdf,
        "Read this top to bottom. The three doors enter the API. The API owns PostgreSQL and the workers. Workers pull data and call models. Only a scored draft continues to publish.",
    )
    ensure(pdf, 118)
    y = pdf.get_y()
    boxes = [
        (14, "Web app", "Next.js", NAVY, WHITE),
        (77, "WP plugin", "editor sidebar", NAVY, WHITE),
        (140, "Extension", "page inspect", NAVY, WHITE),
    ]
    for x, title, sub, fill, ink in boxes:
        card(pdf, x, y, 56, 14, title, sub, fill, ink)
        varrow(pdf, x + 28, y + 14, y + 22)
    card(pdf, 77, y + 22, 56, 14, "Python API", "the only door in", PALE, INK)
    varrow(pdf, 91, y + 36, y + 46)
    varrow(pdf, 119, y + 36, y + 46)
    card(pdf, 28, y + 46, 56, 14, "PostgreSQL", "everything saved", PALE, INK)
    card(pdf, 112, y + 46, 56, 14, "Workers", "sync, crawl, AI", PALE, INK)
    varrow(pdf, 126, y + 60, y + 70)
    varrow(pdf, 140, y + 60, y + 70)
    varrow(pdf, 154, y + 60, y + 70)
    card(pdf, 14, y + 70, 50, 14, "Data feeds", "Google, crawl, index", PALE, INK)
    card(pdf, 70, y + 70, 40, 14, "Astra", "scheduled reports", PALE, INK)
    card(pdf, 116, y + 70, 40, 14, "Qwen", "writes drafts", PALE, INK)
    varrow(pdf, 136, y + 84, y + 92)
    card(pdf, 116, y + 92, 40, 14, "Jev", "scores the draft", (255, 248, 230), INK)
    varrow(pdf, 136, y + 106, y + 114)
    card(pdf, 108, y + 114, 56, 14, "Publish", "after a person agrees", NAVY, WHITE)
    pdf.set_y(y + 134)

    h3(pdf, "What each layer does")
    table(
        pdf,
        ["Layer", "Piece", "What it is responsible for"],
        [
            ["Door", "Next.js web app", "All pages: account, projects, current analytics, and the new lists."],
            ["Door", "WordPress plugin", "SEO fields inside the post editor, plus sitemap, schema, and Apply."],
            ["Door", "Browser extension", "Inspect any page. Queue a crawl. Never publish."],
            ["Application", "Python FastAPI", "Auth, projects, reports, rules, and the approval API. The only public door."],
            ["Application", "Python workers", "Search Console and GA4 sync, crawl, index pulls, and model calls."],
            ["Record", "PostgreSQL", "Users, sites, traffic, keywords, links, prompts, content, rules, approvals."],
            ["Facts", "Search Console, GA4, Places, PageSpeed", "This site's queries, traffic, local listing, and speed."],
            ["Facts", "Our crawler", "Titles, metas, headings, links, and indexability on the live URL."],
            ["Facts", "SERP and backlink index", "Volume, rankings, AI answers, backlinks, and referring domains."],
            ["Writer", "Qwen-Plus", "Articles, briefs, rewrites, and the Improve draft. About $0.40 / $1.20 per million tokens."],
            ["Analyst", "GPT-6 Astra", "Scheduled market, visibility, and competitor notes. About $10 / $50 per million tokens. Saved after one run."],
            ["Judge", "Jev", "Yes, no, or a score against our rules. It writes no paragraph."],
            ["Exit", "Publish", "WordPress Apply, Shopify app, Webflow API, or a REST POST. A person goes first."],
        ],
        (28, 58, 100),
    )
    note(pdf, "Token prices are published list rates for September 2026, Qwen-Plus international under 256K tokens, and GPT-6 Astra. The index bill is separate from tokens.")

    h2(pdf, "Plan flow")
    body(
        pdf,
        "A client signs in and adds a site. We sync data. They research. A draft starts only when they ask. Jev scores it. They approve in the inbox or click Apply in WordPress. Tracking continues.",
    )
    ensure(pdf, 48)
    y = pdf.get_y()
    steps = [
        ("1. Sign in", "client or admin"),
        ("2. Add a site", "My works"),
        ("3. Sync", "Google, crawl, index"),
        ("4. Research", "charts and tools"),
        ("5. Draft", "only if they ask"),
        ("6. Score", "Jev and our rules"),
        ("7. Approve", "inbox or Apply"),
        ("8. Watch", "ranks, traffic, prompts"),
    ]
    bw, bh, gap = 44, 16, 3
    for i, (title, sub) in enumerate(steps):
        col = i % 4
        row = i // 4
        x = 12 + col * (bw + gap)
        yy = y + row * 28
        fill, ink = (NAVY, WHITE) if i in (0, 1, 6) else (PALE, INK)
        if i == 5:
            fill = (255, 248, 230)
        card(pdf, x, yy, bw, bh, title, sub, fill, ink)
        if col < 3:
            harrow(pdf, x + bw, x + bw + gap, yy + 8)
    pdf.set_y(y + 62)

    h3(pdf, "Read path")
    body(pdf, "Opening Traffic Analytics, Top Pages, keyword tables, or backlinks reads PostgreSQL. The screen does not call Qwen or Astra. Astra has already written any report on a schedule.")
    h3(pdf, "Write path")
    body(pdf, "Improve, an article, a brief, or an on-page edit calls Qwen once. Jev scores that draft. Above the rule line it enters the inbox. Apply or the connector is what changes the live site.")
    h3(pdf, "Two pairs that are easy to mix up")
    body(pdf, "AI Traffic counts visits that arrived from an AI product. AI Visibility tracks whether AI answers mention the brand. Competitor Monitoring is traffic share over time. Competitor Research is what those sites rank for. The current Traffic Analytics page and its competitor-list popup stay; the new Traffic and Market screens sit beside them.")

    h2(pdf, "Every feature")
    body(pdf, "Kept pages are the current product. New screens are added beside them. Popups stay on those pages. Surfaces are the plugin and the extension. Full catalog: 25 kept pages, 7 popups, 35 new screens, 10 plugin and extension actions.")

    features = [
        ["Kept pages", "Account", "Sign in", "/ and /signin", "Username and password. Client opens My works. Admin opens tag management."],
        ["Kept pages", "Account", "Sign up", "/signup", "Creates a user with role ROLE_CLIENT."],
        ["Kept pages", "Account", "Forgot password", "/forgotpassword", "Password recovery form."],
        ["Kept pages", "Account", "User profile", "/UserProfile", "Photo and profile fields, from the header menu."],
        ["Kept pages", "Account", "Admin tag management", "/admin/tagmgmt", "Admin home. The route is registered in the new app."],
        ["Kept pages", "Projects", "My works", "/works", "Client home. Project catalog for adding sites."],
        ["Kept pages", "Projects", "Site optimization", "/seooptimization", "Crawl a saved site, page overview, and search insight."],
        ["Kept pages", "Projects", "New optimization", "/seooptimization/new", "Opens when no website is saved yet."],
        ["Kept pages", "Projects", "Optimization editing", "/optimizationediting", "Edit an existing optimization."],
        ["Kept pages", "Projects", "Project making", "/projectmaking", "Tags, domains, titles, suggestion cards, and deep suggestions."],
        ["Kept pages", "Analytics", "Website overview", "/dashboard", "Visits, engagement, and countries. Sidebar: Dashboard."],
        ["Kept pages", "Analytics", "Keyword ranking", "/SEOranking", "Rank cards and a ranking table. Sidebar: Keywords."],
        ["Kept pages", "Analytics", "Keyword Analyze", "/keywordanalyze/home, /overview", "Search keywords and save groups. Home opens the new-list popup."],
        ["Kept pages", "Analytics", "Website Keywords", "/websitekeyword/home, /overview", "Look up a domain. Overview shows organic versus paid and a new-list popup."],
        ["Kept pages", "Analytics", "Generate Keywords", "/keywordgeneretor/home, /overview", "Keyword ideas, then volume and visits."],
        ["Kept pages", "Analytics", "Traffic Analytics", "/trafficsAnalytics/home, /overview", "Home and overview both render. Overview keeps the competitor-list popup."],
        ["Kept pages", "Analytics", "Keyword Gap", "/keywordgap/home, /overview", "Compare keywords against competitors, with range filters."],
        ["Kept pages", "Analytics", "Keyword Manager", "/keywordmannager/home, /overview", "Own lists and shared lists. Create-list and share popups."],
        ["Kept pages", "Analytics", "Organic Research", "/organicsearch/home, /overview", "Landing page plus six filter tabs on the detail view."],
        ["Kept pages", "Analytics", "Keyword Overview", "/keywordoverview/home, /overview", "Keyword metrics landing, then a detail view."],
        ["Kept pages", "Analytics", "Domain Overview", "/domainoverview/home, /overview", "Domain snapshot, then a detail view."],
        ["Kept pages", "Analytics", "Backlink Analytics", "/backlink/home, /overview", "Backlink landing page and a filtered detail view."],
        ["Kept pages", "AI today", "AI Features", "/features", "Catalog filtered by All, Ads, Grammar, and Blog."],
        ["Kept pages", "AI today", "Text generator", "/text-generator/:id", "Opened from an AI feature card."],
        ["Kept pages", "AI today", "Announcements", "/news", "News cards."],
        ["Popups", "Shell", "Account menu", "Header", "Account settings, Get Help, Sign Out. Shows the signed-in name."],
        ["Popups", "Shell", "Analytics menu", "Sidebar Analytics arrow", "The 11 analytics tools. Dashboard, Site optimization, and My works stay outside it."],
        ["Popups", "Keywords", "Create keyword list", "Keyword Manager home", "List name. Create enables after more than 3 characters."],
        ["Popups", "Keywords", "Share keyword lists", "Keyword Manager home and overview", "Pick a list, enter emails, choose Viewer, then create."],
        ["Popups", "Keywords", "New keyword group", "Keyword Analyze", "Group name and up to 200 keywords. Paste, edit, remove, save, or cancel."],
        ["Popups", "Keywords", "New list", "Website Keywords overview", "Group name and a keyword field."],
        ["Popups", "Traffic", "Create competitor list", "Traffic Analytics overview", "List name, country, and up to 20 domains, then Create and analyze."],
        ["New screens", "Traffic and Market", "Get Started", "Web app", "Connect the site, Search Console, and GA4, then run the first crawl."],
        ["New screens", "Traffic and Market", "Traffic Analytics", "Web app", "Sessions, users, and engagement over time from GA4."],
        ["New screens", "Traffic and Market", "Market Overview", "Web app", "Category demand and competitor share. Astra stores a scheduled note."],
        ["New screens", "Traffic and Market", "Top Pages", "Web app", "GA4 landing pages joined to Search Console pages."],
        ["New screens", "Traffic and Market", "Competitor Monitoring", "Web app", "Competitor traffic and keyword overlap, saved each week."],
        ["New screens", "Traffic and Market", "Traffic Distribution", "Web app", "Organic, direct, paid, referral, social, and email."],
        ["New screens", "Traffic and Market", "AI Traffic", "Web app", "Visits that arrived from an AI product."],
        ["New screens", "Traffic and Market", "Referral", "Web app", "Referring sites, source, and medium."],
        ["New screens", "Traffic and Market", "Organic Search", "Web app", "Clicks, impressions, CTR, and average position."],
        ["New screens", "AI Search", "AI Search", "Web app", "Stored AI-answer snapshots and a scheduled Astra summary."],
        ["New screens", "AI Search", "AI Search Audit", "Web app", "Crawl plus SERP. Qwen lists fixes. Jev scores each fix."],
        ["New screens", "AI Search", "AI Search Visibility Report", "Web app", "Astra writes the report once per period. Later views read the save."],
        ["New screens", "Writing", "SEO Writing Assistant", "Web app and plugin", "Qwen drafts from the page and a brief."],
        ["New screens", "Writing", "Topic Research", "Web app", "Qwen clusters keywords already stored from the index and Search Console."],
        ["New screens", "Writing", "SEO Content Template", "Web app", "Qwen builds a template from the topic and SERP headings."],
        ["New screens", "Links", "Link Building", "Web app", "Prospects and a Qwen outreach draft. A person sends it."],
        ["New screens", "Links", "Backlinks", "Web app", "Backlink table from the index. Viewing does not call a model."],
        ["New screens", "Links", "Referring Domains", "Web app", "Domains that link to the site."],
        ["New screens", "Links", "Backlink Audit", "Web app", "Jev flags rows. A person reviews the queue."],
        ["New screens", "Site", "On Page SEO Checker", "Web app", "Crawler findings. Jev scores them. Qwen drafts the edit."],
        ["New screens", "Site", "Site Audit", "Web app", "Site-wide crawl plus PageSpeed. Monitor reuses this job."],
        ["New screens", "Site", "Position Tracking", "Web app", "Rank history from Search Console and SERP checks."],
        ["New screens", "AI Visibility", "AI Analysis", "Web app", "Astra summary of prompt runs and AI answers, then stored."],
        ["New screens", "AI Visibility", "Visibility Overview", "Web app", "Search Console plus stored AI answers. A dashboard read."],
        ["New screens", "AI Visibility", "Competitor Research", "Web app", "What competitors rank for. Astra stores the narrative."],
        ["New screens", "AI Visibility", "Prompt Research", "Web app", "Qwen suggests prompts. The answers are stored."],
        ["New screens", "Monitor", "Prompt Tracking", "Web app", "The same prompts run on a schedule. The trend is stored."],
        ["New screens", "Monitor", "Content Creation", "Web app", "Qwen writes from an approved brief, then Jev scores it."],
        ["New screens", "Content", "Content Dashboard", "Web app", "Pieces, status, and approvals."],
        ["New screens", "Content", "AI Article Generator", "Web app", "Qwen writes from the brief and stored research."],
        ["New screens", "Content", "Content Optimizer", "Web app", "Qwen drafts an edit. Jev scores it. A person publishes."],
        ["New screens", "Content", "Content Repurposing", "Web app", "Qwen rewrites a piece already in My Content."],
        ["New screens", "Content", "Topic Finder", "Web app", "Qwen ranks stored keywords from the index and Search Console."],
        ["New screens", "Content", "SEO Brief Generator", "Web app", "Qwen builds a brief from SERP headings and keyword rows."],
        ["New screens", "Content", "My Content", "Web app", "The library. Publish goes out through a connector."],
        ["Surfaces", "WordPress plugin", "SEO sidebar", "Posts, pages, products", "Title, meta, focus keyword, canonical, and index setting."],
        ["Surfaces", "WordPress plugin", "Live checks", "Editor", "Length and keyword checks run in the browser. Typing does not call the API."],
        ["Surfaces", "WordPress plugin", "Improve with Searchify", "Editor", "One Qwen draft, one Jev score, then Apply writes the post."],
        ["Surfaces", "WordPress plugin", "Site SEO tools", "WordPress admin", "Sitemap, schema, Open Graph, breadcrumbs, and redirects."],
        ["Surfaces", "WordPress plugin", "Project link", "WordPress admin", "A site key connects this site to the Searchify project."],
        ["Surfaces", "Browser extension", "Page inspect", "Any URL", "Title, meta, H1, canonical, indexability, and status."],
        ["Surfaces", "Browser extension", "Project overlay", "A domain already in the project", "Stored audit issues, Search Console clicks, and position."],
        ["Surfaces", "Browser extension", "Query lookup", "Google results page", "Volume and difficulty for that query, from our index."],
        ["Surfaces", "Browser extension", "Audit this URL", "Extension", "Queues a crawl. The extension does not publish."],
        ["Surfaces", "Browser extension", "Open in Searchify", "Extension", "Jumps to the page in the web app."],
    ]
    # 5 columns will not fit A4 portrait. Use Set + Feature + Where + What, and prefix group into Feature.
    packed = [[a, f"{b} / {c}", d, e] for a, b, c, d, e in features]
    table(pdf, ["Set", "Group / feature", "Where", "What happens"], packed, (28, 52, 42, 64))
    note(pdf, "77 rows. 25 kept pages, 7 popups, 35 new screens, 10 plugin and extension actions.")

    pdf.output(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
