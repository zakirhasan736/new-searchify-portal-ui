# Searchify UI prototype

Clickable prototype of the Searchify V2 experience (plus the earlier V1 direction for reference).

## Open it

Unzip, then open `index.html` in Chrome, Edge, Safari or Firefox. No install or build step.
An internet connection is only needed for the Google Fonts (Bricolage Grotesque, Geist, Geist Mono); without it the screens fall back to system fonts.

## What's inside

```
index.html              start page linking to every screen
presentation/           the full demo flow: landing page → sign in → Plug in → … (open presentation/index.html)
screens/*.dc.html       one file per screen (27 V2 screens + 5 V1 screens)
screens/support.js      small runtime that renders the screens (bundles React 19)
design-source/          editable canvas sources (canvas.json + every screen, including the shared side menu Nav.dc.html)
LICENSES.txt            third-party licence (React, MIT)
```

## What's new in this version

- **Backlinks tracker** (`Backlinks.dc.html`): websites linking to the site, new and lost links, strength, your most-linked pages, pages with no links, competitor gap, low-trust links, and "link moves" with outreach drafts. Also added to the side menu, the agency command centre (linking sites per client) and the client report.
- **Searchify HQ tools**: `HQCustomers`, `HQPartners`, `HQProblems`, `HQShareholders`, linked by a tab bar from `Admin.dc.html`.
- **Partner centre**: rate progress on `Affiliate.dc.html` (preview as a partner or founding partner), plus `PartnerEarnings`, `PartnerPayout` and `PartnerTerms`. Password reset on `AffiliateLogin.dc.html`.

Backlink data needs a paid link-data provider (for example DataForSEO, Ahrefs, Semrush or Moz). Google Search Console does not offer its Links report through its API.

## How a screen file works

Each `*.dc.html` file is self-contained:

- **Markup** sits inside `<x-dc>`. Styles are inline so each element can be read on its own.
- **`{{name}}` holes** are filled from the screen's `renderVals()`.
- **`<sc-for list="{{items}}" as="item">`** repeats its children; **`<sc-if value="{{flag}}">`** shows them only when true.
- **Events** are attributes like `onClick="{{ship}}"`, where `ship` is a function returned by `renderVals()`.
- **Logic** lives in `<script type="text/x-dc" data-dc-script>` as `class Component extends DCLogic` — a React class component (`this.state`, `this.setState`, `componentDidMount`, …).
- **`data-props`** on that script declares design levers (for example the `accent` brand colour) and their defaults.
- **Navigation** is plain links between files, such as `<a href="Home.dc.html">`.

For production, a developer would typically port each screen to React/Next.js components. The markup and state logic translate almost one to one.

## Design system in use

| Token | Value | Use |
|---|---|---|
| Ground | `#0A0B0D` | page background |
| Surface | `#101215` / `#131519` | cards |
| Line | `#1A1D22` / `#262A31` | borders |
| Text / muted | `#F2F4F5` / `#9AA1AB` | copy |
| Lime (brand) | `#D5F879` | logo, metrics, progress |
| Blue (action + live) | `#4DA3FF` | every Start / Next / Ship button, live connections |
| Red | `#FF5A4E` | needs dire improvement, broken connection |
| Yellow | `#FFC53D` | medium priority, connecting |
| Green | `#3DDC84` | passes the criteria |
| Fonts | Bricolage Grotesque (display), Geist (UI), Geist Mono (numbers, labels) | |

## Important

This is a front-end prototype only. Nothing connects to Google, WordPress, Shopify, Webflow, a payment provider or any API, and all state resets on reload.
Every company, person, site and number is sample data. Placeholders still to fill before launch:
- Testimonials on the landing page (clearly marked placeholder cards — use real customer quotes only).
- Integration logos in the landing "Plugs into" strip (each tile has a `data-logo` attribute; drop in the official SVG from each brand's press kit).
- Enterprise plan features, `[site key]`, and the renewal `[date]`.

Presentation sign-ins (demo gates only, not real security):
- Customer app: demo@searchify.io / Northline-2026
- Partner centre: partner@searchify.io / Partner-2026

Affiliate terms shown (30% for 12 months, 60-day tracking, $50 minimum) are placeholders to confirm.
