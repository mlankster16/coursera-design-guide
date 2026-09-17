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

/* --- Course page: the revised Course Design Template ---------------------
   CTL's Course Design Template gained two fields the site's template mock
   never carried — "Modules in this Course" and "Real-world application" —
   and dropped the optional Course project, which Real-world application
   now covers. Added here ahead of Design's export.

   Field guidance copy is interim: each popover carries the template's own
   one-line guidance until CTL supplies the Best-practice text. The worked
   examples are CTL's and are final.

   Replace wholesale with Design's export; do not extend this. */

/** Shared cell styling, lifted from the tables already in the build so the
    new one matches rather than approximating. */
const TH = 'box-sizing:border-box; background:#F0F6F2; padding:13px 20px;'
  + ' font-size:14px; letter-spacing:.13em; text-transform:uppercase;'
  + ' color:#125E3D; font-weight:700; text-align:left; vertical-align:top;';
const TD = 'box-sizing:border-box; padding:16px 20px; font-size:15px;'
  + ' line-height:1.6; color:#3A424E; border-left:1px solid #E4E2DD;'
  + ' text-align:left; vertical-align:top;';

const MODULE_ROWS = [
  ['1', 'Identifying and Evaluating Business Data',
   'Identify the data needed for a business question and evaluate an available dataset for relevance and quality.',
   '3 hours'],
  ['2', 'Framing Business Questions',
   'Translate a business need into a focused question that can be investigated with data.',
   '2 hours'],
  ['3', 'Preparing Data for Analysis',
   'Organize and prepare a simple dataset for an introductory business analysis.',
   '2 hours'],
];

/** One template field: label, ⓘ popover, and its value. */
const field = (n, label, guidance, value) => `
 <div style="padding:26px 26px; border-bottom:1px solid #E4E2DD;">
 <div style="position:relative; display:flex; align-items:center; gap:9px; margin:0 0 12px;">
 <p style="margin:0; font-size:15px; font-weight:700; color:#125E3D;">${label}</p>
 <span data-click="gt${n}" role="button" tabindex="0" aria-label="Guidance for ${label}" style="flex:none; display:flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; border:1px solid #CFE2D8; background:#FFFFFF; color:#125E3D; cursor:pointer;" class="g14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width:14px; height:14px; display:block;"><circle cx="12" cy="12" r="9"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></span>
 <div data-if="g${n}" hidden>
 <div style="position:absolute; z-index:40; top:calc(100% + 8px); left:0; width:420px; max-width:420px; background:#FFFFFF; border:1px solid #CFE2D8; border-top:3px solid #17724A; border-radius:3px; box-shadow:0 10px 34px rgba(1,33,105,.16); padding:20px 22px; text-align:left;">
 <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin:0 0 10px;">
 <div>
 <p style="margin:0 0 3px; font-size:14px; letter-spacing:.16em; text-transform:uppercase; color:#125E3D; font-weight:700; white-space:nowrap;">Best practice</p>
 <p style="margin:0; font-family:'EB Garamond',serif; font-size:22px; line-height:1.25; color:#012169;">${label}</p>
 </div>
 <span data-click="c${n}" style="flex:none; cursor:pointer; font-size:17px; line-height:1; color:#6B737F; padding:2px 3px;" class="g12">✕</span>
 </div>
 <p style="margin:0; font-size:15px; line-height:1.7; color:#3A424E;">${guidance}</p>
 </div>
 </div>
 </div>
${value}
 </div>`;

const valueBox = (text) =>
  ` <p style="margin:0; background:#F0F6F2; border:1px solid #CFE2D8; border-radius:2px; padding:14px 18px; font-size:17px; line-height:1.6; color:#1F2833;">${text}</p>`;

const modulesTable = () => ` <div style="border:1px solid #D8DEE7; border-radius:3px; overflow:hidden;">
 <table style="table-layout:fixed; width:100%; border-collapse:collapse; margin:0;">
 <caption style="position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap;">The Modules in this Course, what learners can do after each, and the estimated learner time</caption>
 <thead>
 <tr>
 <th scope="col" style="width:7%; ${TH}">#</th>
 <th scope="col" style="width:28%; ${TH} border-left:1px solid #CFE2D8;">Module title</th>
 <th scope="col" style="width:45%; ${TH} border-left:1px solid #CFE2D8;">Main outcomes</th>
 <th scope="col" style="width:20%; ${TH} border-left:1px solid #CFE2D8;">Est. time</th>
 </tr>
 </thead>
 <tbody>${MODULE_ROWS.map(([n, title, outcome, time], i) => `
 <tr${i < MODULE_ROWS.length - 1 ? ' style="border-bottom:1px solid #E4E2DD;"' : ''}>
 <th scope="row" style="box-sizing:border-box; padding:16px 20px; font-size:17px; font-weight:700; line-height:1.4; color:#125E3D; text-align:left; vertical-align:top;">${n}</th>
 <td style="${TD} font-size:17px; font-weight:600; color:#1F2833;">${title}</td>
 <td style="${TD}">${outcome}</td>
 <td style="${TD} white-space:nowrap;">${time}</td>
 </tr>`).join('')}
 </tbody>
 </table>
 </div>`;

const courseTemplateRevision = (s, route) => {
  if (route !== 'course') return s;

  // The new fields sit after the instructor bio, which is the last field
  // before the "Your templates" footer.
  const anchor = '\n <div data-keep="" style="background:#F0F6F2; border-top:1px solid #CFE2D8;';
  if (!s.includes(anchor)) throw new Error('course: "Your templates" block not found');

  const added =
    field(10, 'Modules in this Course',
      'For each Module, summarize what learners will be able to do after completing it. '
      + 'Outcomes should build toward the Course objectives rather than restate the Module topic.',
      modulesTable())
    + field(11, 'Real-world application',
      "Jot down any ideas for how learners could apply this Course's objectives, whether that's a "
      + '<strong style="font-weight:700;color:#1F2833;">project, exercise, tool, or dataset you already have in mind</strong>, '
      + 'or questions for your Learning Experience Designer about what’s possible.',
      valueBox('I have a realistic workplace dataset that might be useful for a hands-on activity. '
        + 'I’m imagining that learners could use it to move from a business need to a focused question, '
        + 'assess whether the data is suitable for that question, and prepare it for an introductory analysis. '
        + 'A short business brief, data-quality checklist, and guiding questions could support their decisions. '
        + 'The activity could be completed in a spreadsheet, without requiring specialized or paid software.'));

  s = s.replace('"tips":{"count":10,', '"tips":{"count":12,');
  return s.replace(anchor, added + anchor);
};

/** CTL reworded the step-2 scope prompt and its three questions, so they
    interrogate each Course objective rather than each candidate asset. */
const scopeQuestions = (s) => {
  s = s.replace('For each topic, resource, or activity, ask:', 'For each Course objective, ask:');
  const was = [
    'What knowledge or skills will learners gain from this?',
    'Do learners need it to achieve a course objective?',
    'Will it give learners an opportunity to practice or demonstrate what they should be able to do?',
  ];
  const now = [
    'What do learners need to know or be able to do to achieve this objective?',
    'What concepts, skills, or decisions make up this objective?',
    'How will learners practice and demonstrate this capability?',
  ];
  was.forEach((old, i) => { s = s.replace(old, now[i]); });
  return s;
};

const DEVIATIONS = [scopeQuestions];

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
  s = courseTemplateRevision(s, route);

  const dir = route ? join(OUT, route) : OUT;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), s);
  const left = (s.match(/href="#"/g) || []).length;
  console.log(`  ${file.padEnd(22)} -> /${route}${route ? '/' : ''}   ${left} placeholders left`);
}

for (const f of ['guide.css', 'guide.js']) cpSync(join(SRC, f), join(OUT, f));
cpSync(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });
console.log('  guide.css, guide.js, assets/ copied verbatim');
