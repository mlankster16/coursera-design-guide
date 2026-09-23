/* Publish Design's static build.
 *
 * Design ships build/ as finished HTML — "copy the files, not rebuild from
 * them". Re-implementing it is what produced four rounds of near-misses, so
 * this script only does what the build cannot do for itself:
 *
 *   1. turns the nav placeholders into real links between the pages
 *   2. re-applies the few decisions CTL asked for that post-date the design
 *
 * Everything else is copied byte-for-byte. If a value looks wrong on the
 * live site, fix it in Design and re-export — do not patch it here.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2];
if (!SRC) throw new Error('usage: node scripts/deploy-design-build.mjs <build-dir>');
const OUT = 'public';
const BASE = '/coursera-design-guide';

/** Design file -> published route. */
const PAGES = {
  // Start Here replaced Overview as the landing page, so it takes the root
  // and the old Overview URL keeps working without a redirect.
  'start-here.html': '',
  'orient.html': 'orient',
  'specialization.html': 'specialization',
  'course.html': 'course',
  'module.html': 'module',
  'learning-assets.html': 'learning-assets',
  'accessibility-copyright-ai.html': 'learning-assets/accessibility-copyright-ai',
};

const NAV = {
  'Start Here': `${BASE}/`,
  Orient: `${BASE}/orient/`,
  Specialization: `${BASE}/specialization/`,
  Course: `${BASE}/course/`,
  Module: `${BASE}/module/`,
};
const LA = `${BASE}/learning-assets/`;
const A11Y = `${BASE}/learning-assets/accessibility-copyright-ai/`;

/** data-link key -> destination. Design ships every placeholder link with a
    stable key, so resolution no longer depends on the link's visible text. */
const BY_KEY = {
  'start-here': `${BASE}/`,
  orient: `${BASE}/orient/`,
  specialization: `${BASE}/specialization/`,
  course: `${BASE}/course/`,
  module: `${BASE}/module/`,
  'learning-assets': LA,
  'accessibility-copyright-ai': A11Y,
};

/** The two asset guides that are built. The other six keep their placeholder,
    which is what the release switch in guide.js expects. */
const ASSET_GUIDES = {
  video: `${BASE}/learning-assets/video/`,
  reading: `${BASE}/learning-assets/reading/`,
};


/* --- Deviations -----------------------------------------------------------
   Each is a CTL instruction that overrides or post-dates the design file.
   This list is the only place the published site may differ from the build;
   keep it short and keep the reason attached.

   CTL's instructions normally go to Design, Design exports them, and this
   script copies the result. Anything here is a patch waiting to be retired
   the moment Design's source carries it. */

/** Accessibility fixes CTL asked for, pending Design picking them up.

    1. No landmarks and no skip link on any page. The shell has clean hooks:
       [data-cap="head"] starts the page content and [data-foot] ends it, so
       <main> wraps exactly that span rather than being faked with ARIA on
       an element that means something else.
    2. Design's reflow rule wraps the nav row below 980px, but the link list
       inside it is a second flex row that does not wrap, so it still
       overflows and [data-print-shell]'s overflow:clip cuts it off. Below
       640px that hides real nav items — at 320px, Specialization, Module
       and Learning Assets — and the page cannot scroll sideways to reach
       them. One rule makes the inner list wrap too.

    Delete both the moment Design's source carries them. */
const A11Y_CSS = `
<style>
/* CTL accessibility deviations — see scripts/deploy-design-build.mjs */
.skip-link{position:absolute;left:-9999px;top:0;z-index:100;background:#012169;color:#FFFFFF;
  padding:12px 20px;font:700 15px/1.2 'Open Sans',system-ui,sans-serif;text-decoration:none;}
.skip-link:focus{left:0;}
@media screen and (max-width:980px){
  /* Design wraps [data-navrow]; its inner link list needs the same. */
  [data-navrow] > div{flex-wrap:wrap !important;row-gap:10px !important;}
}
@media screen and (max-width:640px){
  [data-cap="nav"] > div:first-child,
  [data-navrow]{padding-left:24px !important;padding-right:24px !important;}
  img[src$="ctl-logo-white.png"]{max-width:100% !important;height:auto !important;}
}
</style>`;

const a11yShell = (s) => {
  const head = s.indexOf('<div data-cap="head"');
  const foot = s.indexOf('<div data-foot');
  if (head < 0) throw new Error('a11y: [data-cap="head"] not found');
  if (foot < 0 || foot < head) throw new Error('a11y: [data-foot] not found after the header');

  // <main> spans the page header through to just before the footer.
  s = s.slice(0, foot) + '</main>\n ' + s.slice(foot);
  s = s.slice(0, head) + '<main id="main-content" tabindex="-1">\n ' + s.slice(head);

  s = s.replace('<div data-foot', '<div role="contentinfo" data-foot');
  s = s.replace('<div data-navrow', '<div role="navigation" aria-label="Main" data-navrow');
  // Only five of the seven pages wrap their nav in a [data-cap="nav"] block.
  s = s.replace('<div data-cap="nav"', '<div role="banner" data-cap="nav"');

  s = s.replace(/(<body[^>]*>)/,
    '$1\n<a class="skip-link" href="#main-content">Skip to main content</a>');
  return s.includes('</head>') ? s.replace('</head>', `${A11Y_CSS}\n</head>`)
                               : s.replace(/(<body[^>]*>)/, `${A11Y_CSS}\n$1`);
};

const DEVIATIONS = [a11yShell];

for (const [file, route] of Object.entries(PAGES)) {
  let s = readFileSync(join(SRC, file), 'utf8');

  // The pages live at different depths, so root-relative the shared assets.
  s = s.replace(/(href|src)="(guide\.css|guide\.js|assets\/[^"]+)"/g, `$1="${BASE}/$2"`);

  // Every remaining placeholder resolves by its own link text. Footer links
  // read "<direction> <destination>", so drop the direction and match the
  // destination that follows it.
  const DIRECTION = /^(?:←\s*(?:Back to|Back|Zoom out)|Zoom in\s*→|Next\s*→|Asset guidance\s*→|Helpful throughout\s*→)\s*/;
  // An "asset/<slug>" key means two different things: the nav dropdown item,
  // which anchors into the Learning Assets page, and the card's "Explore →"
  // button, which points at the guide itself. They are told apart by
  // structure, not copy — only the button sits inside a data-asset-cta block
  // — so mark those first, walking backwards to keep the indices valid.
  const ctas = [...s.matchAll(/data-asset-cta="([^"]+)"/g)].reverse();
  for (const m of ctas) {
    const link = new RegExp(`<a (?=[^>]*data-link="asset/${m[1]}")`, 'g');
    link.lastIndex = m.index;
    const hit = link.exec(s);
    if (hit) s = `${s.slice(0, hit.index)}<a data-cta ${s.slice(hit.index + 3)}`;
  }

  s = s.replace(/<a ([^>]*?)href="#"([^>]*)>/g, (m, pre, post) => {
    const attrs = pre + post;
    const key = (attrs.match(/data-link="([^"]+)"/) || [])[1];
    if (!key) throw new Error(`${file}: placeholder link with no data-link key`);
    const asset = key.startsWith('asset/') && key.slice(6);
    const href = asset
      ? (/\bdata-cta\b/.test(attrs) ? ASSET_GUIDES[asset] : `${LA}#${asset}`)
      : BY_KEY[key];
    if (!href && !asset) throw new Error(`${file}: unknown data-link key "${key}"`);
    return href ? `<a ${pre}href="${href}"${post}>` : m;
  });
  s = s.replace(/<a data-cta /g, '<a ');

  for (const d of DEVIATIONS) s = d(s, route);

  const dir = route ? join(OUT, route) : OUT;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), s);
  const left = (s.match(/href="#"/g) || []).length;
  console.log(`  ${file.padEnd(22)} -> /${route}${route ? '/' : ''}   ${left} placeholders left`);
}

for (const f of ['guide.css', 'guide.js']) cpSync(join(SRC, f), join(OUT, f));
cpSync(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });
console.log('  guide.css, guide.js, assets/ copied verbatim');
