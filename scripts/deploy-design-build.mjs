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
   keep it short and keep the reason attached. */

/** The revised Course Design Template adds a "Real-world application" field
    after the instructor bio. Added here ahead of Design's export so CTL can
    show it in a meeting; the popover copy and the worked example are CTL's
    to supply, so both are interim — the popover carries the template's own
    guidance line and the value cell carries the template's placeholder.
    Replace with Design's export, do not extend this. */
const realWorldApplicationField = (s, route) => {
  if (route !== 'course') return s;
  const anchor = '\n <div data-keep="" style="background:#F0F6F2; border-top:1px solid #CFE2D8;';
  if (!s.includes(anchor)) throw new Error('course: "Your templates" block not found');

  const field = `
 <div style="padding:26px 26px; border-bottom:1px solid #E4E2DD;">
 <div style="position:relative; display:flex; align-items:center; gap:9px; margin:0 0 12px;">
 <p style="margin:0; font-size:15px; font-weight:700; color:#125E3D;">Real-world application</p>
 <span data-click="gt10" role="button" tabindex="0" aria-label="Guidance for Real-world application" style="flex:none; display:flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; border:1px solid #CFE2D8; background:#FFFFFF; color:#125E3D; cursor:pointer;" class="g14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width:14px; height:14px; display:block;"><circle cx="12" cy="12" r="9"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></span>
 <div data-if="g10" hidden>
 <div style="position:absolute; z-index:40; top:calc(100% + 8px); left:0; width:420px; max-width:420px; background:#FFFFFF; border:1px solid #CFE2D8; border-top:3px solid #17724A; border-radius:3px; box-shadow:0 10px 34px rgba(1,33,105,.16); padding:20px 22px; text-align:left;">
 <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin:0 0 10px;">
 <div>
 <p style="margin:0 0 3px; font-size:14px; letter-spacing:.16em; text-transform:uppercase; color:#125E3D; font-weight:700; white-space:nowrap;">Best practice</p>
 <p style="margin:0; font-family:'EB Garamond',serif; font-size:22px; line-height:1.25; color:#012169;">Real-world application</p>
 </div>
 <span data-click="c10" style="flex:none; cursor:pointer; font-size:17px; line-height:1; color:#6B737F; padding:2px 3px;" class="g12">✕</span>
 </div>
 <p style="margin:0; font-size:15px; line-height:1.7; color:#3A424E;">Jot down any ideas for how learners could apply this Course's objectives, whether that's a <strong style="font-weight:700;color:#1F2833;">project, exercise, tool, or dataset you already have in mind</strong>, or questions for your Learning Experience Designer about what's possible.</p>
 </div>
 </div>
 </div>
 <p style="margin:0; background:#F0F6F2; border:1px solid #CFE2D8; border-radius:2px; padding:14px 18px; font-size:17px; line-height:1.6; color:#6B737F;">[ ideas, questions, tools, and/or a draft description ]</p>
 </div>`;

  // the popover count on <body> drives guide.js's tip wiring
  s = s.replace('"tips":{"count":10,', '"tips":{"count":11,');
  return s.replace(anchor, field + anchor);
};

/** CTL reworded the lead-in to the scope questions on Course step 2.
    Retire once Design's export carries it. */
const scopeQuestionsLeadIn = (s) => s.replace(
  'For each topic, resource, or activity, ask:',
  'For each Course objective, ask:');

const DEVIATIONS = [scopeQuestionsLeadIn];

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
  s = s.replace(/<a ([^>]*?)href="#"([^>]*)>([\s\S]*?)<\/a>/g, (m, pre, attrs, inner) => {
    const t = text(inner).replace(DIRECTION, '');
    const asset = ASSETS.find(([label]) => t === label);
    const href = BY_TEXT[t] ?? (asset ? `${LA}#${asset[1]}` : null);
    return href ? `<a ${pre}href="${href}"${attrs}>${inner}</a>` : m;
  });

  for (const d of DEVIATIONS) s = d(s);
  s = realWorldApplicationField(s, route);

  const dir = route ? join(OUT, route) : OUT;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), s);
  const left = (s.match(/href="#"/g) || []).length;
  console.log(`  ${file.padEnd(22)} -> /${route}${route ? '/' : ''}   ${left} placeholders left`);
}

for (const f of ['guide.css', 'guide.js']) cpSync(join(SRC, f), join(OUT, f));
cpSync(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });
console.log('  guide.css, guide.js, assets/ copied verbatim');
