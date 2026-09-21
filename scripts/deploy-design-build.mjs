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
  'overview.html': '',
  'specialization.html': 'specialization',
  'course.html': 'course',
  'module.html': 'module',
  'learning-assets.html': 'learning-assets',
  'accessibility-copyright-ai.html': 'learning-assets/accessibility-copyright-ai',
};

const NAV = {
  Overview: `${BASE}/`,
  Specialization: `${BASE}/specialization/`,
  Course: `${BASE}/course/`,
  Module: `${BASE}/module/`,
};
const LA = `${BASE}/learning-assets/`;
const A11Y = `${BASE}/learning-assets/accessibility-copyright-ai/`;

/** The eight asset types, in page order, for the dropdown anchors. */
const ASSETS = [
  ['Video', 'video'], ['Reading', 'reading'], ['Interactive Plugin', 'plugin'],
  ['Coach Dialogue', 'dialogue'], ['Coach Role Play', 'roleplay'],
  ['Assessments', 'assessment'], ['Programming Assignments', 'programming'],
  ['Coursera Labs', 'labs'],
];

/** Link text -> destination, for everything that is not an asset anchor. */
const BY_TEXT = {
  'All Learning Assets': LA,
  // Shown only when guide.js releases the asset. The other six guides are
  // not built, so their links stay placeholders until they are.
  'Explore Video →': `${BASE}/learning-assets/video/`,
  'Explore Reading →': `${BASE}/learning-assets/reading/`,
  'Accessibility, Copyright & AI': A11Y,
  'Accessibility, Copyright & AI →': A11Y,
  'Review guidance →': A11Y,
  Overview: NAV.Overview,
  Specialization: NAV.Specialization,
  Course: NAV.Course,
  Module: NAV.Module,
  'Learning Assets': LA,
};

const text = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/* --- Deviations -----------------------------------------------------------
   Each is a CTL instruction that overrides or post-dates the design file.
   This list is the only place the published site may differ from the build;
   keep it short and keep the reason attached.

   CTL's instructions normally go to Design, Design exports them, and this
   script copies the result. Anything here is a patch waiting to be retired
   the moment Design's source carries it. */

/** CTL: "working statement" reads like jargon where "work in progress" is
    plain. Design's rework adopted the plainer phrasing in Step 2's body
    ("Keep the objectives as works in progress at this stage") but left the
    older wording in the "Questions to consider" shelf panel, so the page
    says it both ways. This aligns the survivor.

    The companion change — naming the Learning Experience Designer alongside
    the four questions — is retired: that sentence is gone in the rework, and
    Step 2 now says "Capture questions to explore with your Learning
    Experience Designer" in its own right. */
const stepTwoWording = (s, route) => {
  if (route !== 'course') return s;
  const from = 'Course objectives are working statements at this stage.';
  const to = 'Course objectives are works in progress at this stage.';
  if (!s.includes(from)) throw new Error('course: Step 2 wording string not found');
  return s.replace(from, to);
};

const DEVIATIONS = [stepTwoWording];

for (const [file, route] of Object.entries(PAGES)) {
  let s = readFileSync(join(SRC, file), 'utf8');

  // The pages live at different depths, so root-relative the shared assets.
  s = s.replace(/(href|src)="(guide\.css|guide\.js|assets\/[^"]+)"/g, `$1="${BASE}/$2"`);

  // Top-level nav items ship as spans. Only the current page is styled as
  // current, so every other one becomes a link to its route.
  s = s.replace(
    /<span style="color:#5A6472; white-space:nowrap;">(Overview|Specialization|Course|Module)<\/span>/g,
    (_m, label) =>
      `<a href="${NAV[label]}" style="color:#5A6472; white-space:nowrap; text-decoration:none;">${label}</a>`);

  // Every remaining placeholder resolves by its own link text. Footer links
  // read "<direction> <destination>", so drop the direction and match the
  // destination that follows it.
  const DIRECTION = /^(?:←\s*(?:Back to|Back|Zoom out)|Zoom in\s*→|Asset guidance\s*→|Helpful throughout\s*→)\s*/;
  // The Overview's four level cards are one link wrapping a whole card, so
  // their text is "<level> <question> Open →" rather than the bare label.
  const CARD = /^(Specialization|Course|Module|Learning Assets)\b.*Open\s*→$/;
  s = s.replace(/<a ([^>]*?)href="#"([^>]*)>([\s\S]*?)<\/a>/g, (m, pre, attrs, inner) => {
    const t = text(inner).replace(DIRECTION, '');
    const card = t.match(CARD);
    const asset = ASSETS.find(([label]) => t === label);
    const href = BY_TEXT[t] ?? (card ? BY_TEXT[card[1]] : null)
      ?? (asset ? `${LA}#${asset[1]}` : null);
    return href ? `<a ${pre}href="${href}"${attrs}>${inner}</a>` : m;
  });

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
