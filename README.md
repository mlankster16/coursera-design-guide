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

| Page | Route | File |
|---|---|---|
| Overview | `/` | `src/pages/index.astro` |
| Specialization | `/specialization` | `src/pages/specialization.astro` |
| Course | `/course` | `src/pages/course.astro` |
| Module | `/module` | `src/pages/module.astro` |
| Learning Assets | `/learning-assets` | `src/pages/learning-assets/index.astro` |
| Video | `/learning-assets/video` | `src/pages/learning-assets/video.astro` |
| Reading | `/learning-assets/reading` | `src/pages/learning-assets/reading.astro` |

## Where things live

- **`src/data/site.ts`** — the site's structure. The five top-level nav items, the eight
  Learning Asset types, and the "Zoom out / Zoom in" footer chain all come from here.
  This is the file to edit when adding a page.
- **`src/data/learning-assets-data.json`** — client-authored copy for all eight asset
  types. The Learning Assets page is generated from this file, not written by hand.
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
2. In `src/data/site.ts`, add `page: '/learning-assets/assessments'` to that asset's entry
   in `assetLinks`.

That is the whole change. The nav dropdown, the "Full guidance…" link at the foot of the
asset's section on the Learning Assets page, and the breadcrumb all update automatically.
Until an asset has a `page`, the dropdown and its guidance link point at that asset's
section on the Learning Assets page instead.

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
- **Template and example links** (`data-template-link`, "View full script", "Watch on
  Warpwire") point at `#` and need real URLs.
- **No dark version of the CTL logo** has been supplied, for use on light backgrounds.
