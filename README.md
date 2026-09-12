# Coursera Design Guide

A static reference site for Duke faculty building a Coursera Course or Specialization
with a Learning Experience Designer (LXD) from Duke's Center for Teaching and Learning.

Live at **https://mlankster16.github.io/coursera-design-guide**

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:4321/coursera-design-guide/ — note the `/coursera-design-guide`
path, which matches how GitHub Pages serves the site.

`npm run build` writes the static site to `dist/`.

## Pages

The six main pages are **Design's static build, copied verbatim** — not
rebuilt. They are checked in under `public/` and served as-is.

| Page | Route | Source |
|---|---|---|
| Overview | `/` | `public/index.html` (Design) |
| Specialization | `/specialization` | `public/specialization/index.html` (Design) |
| Course | `/course` | `public/course/index.html` (Design) |
| Module | `/module` | `public/module/index.html` (Design) |
| Learning Assets | `/learning-assets` | `public/learning-assets/index.html` (Design) |
| Accessibility, Copyright & AI | `/learning-assets/accessibility-copyright-ai` | `public/learning-assets/accessibility-copyright-ai/index.html` (Design) |
| Video | `/learning-assets/video` | `src/pages/learning-assets/video.astro` |
| Reading | `/learning-assets/reading` | `src/pages/learning-assets/reading.astro` |

### Why these pages are copied, not rebuilt

Porting them into Astro produced four rounds of near-misses. Three whole
categories of formatting were invisible in the old `.dc.html` design source
and could not be recovered by reading the markup:

- **hover and focus states** were `style-hover` attributes, inert outside
  Design's runtime — 180 of them;
- **type rendering** (`font-smoothing`, `text-rendering`,
  `font-synthesis-weight`) lived in a `<helmet>` block, and without it Open
  Sans at 17px picks up weight so the page reads softer than the design even
  when every value matches;
- **emphasis markup** had accumulated damage from in-place editing — stacks
  like `<em><span style="font-style:normal"><b>…` that Design's tool renders
  bold and any other processor renders italic.

Design now ships finished HTML plus `guide.css` and `guide.js`. Copying it
removes that entire class of bug. **Do not "port" these pages, and do not
merge `guide.css` into the global stylesheet or strip its `!important`
flags** — every element carries its own inline style, so unflagged rules lose.

### Updating from a new Design package

```bash
node scripts/deploy-design-build.mjs /path/to/build
npm run build
```

The script copies the files byte-for-byte and does only two things they
cannot do for themselves: resolves the `href="#"` nav placeholders into real
routes, and re-applies the short list of CTL decisions that post-date the
design. That list lives at the top of the script — keep it short, and keep
the reason attached to each one. Anything else that looks wrong on the live
site should be fixed in Design and re-exported, not patched here.

The previous Astro implementations are kept in `src/_superseded/` for
reference. Astro ignores that directory, so they do not build.

## Where things live

- **`src/data/site.ts`** — the site's structure. The five top-level nav items, the eight
  Learning Asset types, and the "Zoom out / Zoom in" footer chain all come from here.
  This is the file to edit when adding a page.
- **`src/data/learning-assets.ts`** — the eight asset types: names, icons, and the
  "What is it? / When might you use it?" copy on the Learning Assets cards. Order here
  drives the hero rail, the cards, and the nav dropdown, so the three cannot drift
  apart. It also carries each asset's `page`, once one is published. Three assets are
  marked `plural`, which switches their card labels to "What are they? / When might you
  use them?" — the design words them that way.
- **`src/data/learning-assets-data.json`** — **no longer read by anything.** It holds an
  earlier generation of the per-asset copy (`use`, `d`, `a`, `c`). The page it fed has
  been redesigned twice since: accessibility and copyright moved to their own page, and
  the cards now use "What is it? / When might you use it?" copy that never existed in
  this file. The design handoff has since dropped it for the same reason, and warns
  against reintroducing a parallel copy source — take card copy from the design's
  `.dc.html`. Kept here only as a record; editing it changes nothing. Safe to delete.
- **`src/styles/tokens.css`** — every color, type size, and measure in the design system.
- **`src/styles/global.css`** — base styles and the patterns shared across pages
  (chrome, sections, panels, the level-page skeleton, accordion, print rules).
- **`src/components/`** — masthead + nav (with the Learning Assets dropdown), page footer,
  accordion.
- **`src/layouts/PageLayout.astro`** — the shell every page renders inside.
The original design files and the design handoff live in `_design-reference/` on the
LX team's machine. They are deliberately untracked (see `.gitignore`), because they
carry internal notes on client preferences and open questions and this repo is public.

Page-specific layout lives in each page's own scoped `<style>` block.

## Adding a Learning Asset page

1. Create the page, e.g. `src/pages/learning-assets/assessments.astro`. Copy
   `video.astro` as a starting point — it already has the breadcrumb and
   "← Back to Learning Assets" footer wired up.
2. In `src/data/learning-assets.ts`, add `page: '/learning-assets/assessments'` to that
   asset's entry.

The nav dropdown, the card's link, and the breadcrumb all follow from that.

## Releasing the asset guides

The eight guides are held back as a set: **`assetGuidesReleased` in `src/data/site.ts`
is `false`**, so no card links out. Each card shows an "Available soon" badge, and the
dropdown sends every asset to its section on the Learning Assets page rather than to a
page that isn't ready to share. Video and Reading are built and still build — they are
simply unlinked, and remain reachable by URL for previewing.

Flip that constant to `true` when all eight are ready. Every asset with a `page` then
links out on its own.

## Adding a top-level page

Add an entry to `pages` in `src/data/site.ts` and create the matching file in
`src/pages/`. The nav and the footer chain follow from that list, so the neighbouring
pages' "Zoom out / Zoom in" links update on their own.

## Design constraints worth knowing

These come from the design handoff and are deliberate:

- **Level colors are semantic**, not decorative. Each matches the color faculty already
  see in the Google Docs design template they fill in.
- **All five nav labels are the same color** regardless of level. Only the active
  underline is level-colored. This was an explicit client correction.
- **Every text/background pair was checked against WCAG AA.** Several tokens exist only
  as darker variants for that reason (`--level-module-dark`, `--level-assets-dark`,
  `--dim-a11y-text`). Re-check contrast before substituting a color — the Learning Assets
  page instructs faculty on contrast, so the site must not violate its own guidance.
- **Container width and measure are separate rules.** A panel always spans its column;
  line length is capped on the text inside it, using one of three fixed pixel values
  (`--measure-section`, `--measure-body`, `--measure-hero`).
- **EB Garamond never goes above weight 500.** It is set at display sizes.
- **Accordions force open before printing.** These pages get exported to PDF for review,
  so nothing may be hidden in the print output. Elements marked `data-keep` will not
  split across pages.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and
publishes it to GitHub Pages. In the repository's **Settings → Pages**, set
**Source** to **GitHub Actions**.

## Known gaps

- **Responsive behavior is undesigned.** Every page assumes a desktop viewport and the
  1080px card. Faculty are likely to open this on tablets, so breakpoints need a design
  decision before launch.
- **"What can a Reading include?"** on the Reading page is a placeholder — the section was
  collapsed in the source document, so its contents were never available.
- **Image placeholders** on the Video page (slide rebuild, caption safe zones) are dashed
  boxes awaiting real screenshots.
- **Example links on the Video page** ("Make a copy", "View full script", "Watch on
  Warpwire") still point at `#` and need real URLs. The Specialization, Course, Module,
  and Overview template links are live — they are the two view-only sample documents in
  `templateExamples` (`src/data/site.ts`).
- **No dark version of the CTL logo** has been supplied, for use on light backgrounds.
