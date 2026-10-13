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
  // Start Here is the landing page, so it takes the root. Orient was folded
  // into it in the October redesign; /orient/ keeps working as a redirect,
  // written below.
  'start-here.html': '',
  'specialization.html': 'specialization',
  'course.html': 'course',
  'module.html': 'module',
  'learning-assets.html': 'learning-assets',
  'accessibility-copyright-ai.html': 'learning-assets/accessibility-copyright-ai',
};

const NAV = {
  'Start Here': `${BASE}/`,
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

const DEVIATIONS = [];

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

/* Orient was folded into Start Here in the October redesign. Its URL was
   live and shared, so it redirects rather than 404s. The refresh is
   immediate and the page still carries a real link, so it does not become a
   timed redirect a reader has to beat. */
const REDIRECTS = { orient: `${BASE}/` };
for (const [from, to] of Object.entries(REDIRECTS)) {
  const dir = join(OUT, from);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Page moved — Coursera Design Guide</title>
<link rel="canonical" href="${to}">
<meta http-equiv="refresh" content="0; url=${to}">
<style>body{font-family:'Open Sans',system-ui,sans-serif;background:#EFEDE8;color:#3A424E;margin:0;padding:80px 24px;}
main{max-width:620px;margin:0 auto;background:#FFF;border-radius:3px;padding:40px 44px;box-shadow:0 2px 40px rgba(1,33,105,.10);}
h1{font-family:'EB Garamond',Garamond,serif;font-weight:500;color:#012169;margin:0 0 12px;font-size:28px;}
p{font-size:17px;line-height:1.7;margin:0;}a{color:#00539B;}</style>
</head>
<body>
<main>
<h1>This page has moved</h1>
<p>Orienting to Coursera is now part of <a href="${to}">Start Here</a>.</p>
</main>
</body>
</html>
`);
  console.log(`  ${from.padEnd(22)} -> redirect to ${to}`);
}

for (const f of ['guide.css', 'guide.js']) cpSync(join(SRC, f), join(OUT, f));
cpSync(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });
console.log('  guide.css, guide.js, assets/ copied verbatim');
