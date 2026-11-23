/* Generate the six static pages in public/ from the base build.
 *
 * The base build (_design-reference/base-snapshot-not-live, kept locally) is finished HTML
 * and is no longer edited. Re-implementing those pages is what produced four
 * rounds of near-misses, so this script copies them and does two things on
 * top:
 *
 *   1. turns the nav placeholders into real links between the pages
 *   2. applies DEVIATIONS — every content change made since the base build
 *
 * Everything else is copied byte-for-byte. To change a page, add or edit a
 * deviation below and re-run; an edit made directly in public/ is
 * overwritten the next time this runs.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2];
if (!SRC) throw new Error('usage: node scripts/deploy-design-build.mjs <build-dir>');
const OUT = 'public';
const BASE = '/coursera-design-guide';

/** Base build file -> published route. */
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

/** data-link key -> destination. Every placeholder link in the base build
    carries a stable key, so resolution no longer depends on the link's visible text. */
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
   Every content change made since the base build. Each one is a function
   (page, route) -> page, with the reason attached, and each checks that the
   markup it expects is still there. This list is the only place the
   published pages differ from the base build, so it is also the record of
   what has changed and why. */

/** Replace exactly one occurrence, and fail loudly if the markup is not
    what the deviation expects — a deviation that silently stops applying is worse than none. */
function swap(s, find, replace, label) {
  const n = s.split(find).length - 1;
  if (n !== 1) throw new Error(`deviation "${label}": expected 1 match, found ${n}`);
  return s.replace(find, () => replace);
}

/* Typical lengths (CTL, November 2026). Desired length and the practice
   behind it for each Learning Asset type. */
const ACTIVITY_LENGTH =
  'Varies, from 5 to 30 minutes of learner time. A longer activity is best broken into smaller parts.';
const ASSET_LENGTHS = {
  Video:
    '5–10 minutes. Bite-sized videos focused on one or two concepts work better than a long lecture.',
  Reading: 'Varies with what you ask learners to do, but usually no more than 15 minutes.',
  Assessments:
    'Practice (ungraded) assessments are typically 5–15 minutes. Graded assessments are usually 10 auto-graded questions, about 15–20 minutes.',
  'Coach Dialogue': ACTIVITY_LENGTH,
  'Coach Role Play': ACTIVITY_LENGTH,
  'Interactive Plugin': ACTIVITY_LENGTH,
  'Coursera Lab': ACTIVITY_LENGTH,
  'Programming Assignment': ACTIVITY_LENGTH,
};

/** Learning Assets: a "Typical length" block on every card, set like the
    "Use it when" block it follows. */
function assetLengths(s, route) {
  if (route !== 'learning-assets') return s;
  for (const [name, text] of Object.entries(ASSET_LENGTHS)) {
    const card = s.indexOf(`data-asset-name="${name}"`);
    const use = card < 0 ? -1 : s.indexOf('>Use it when</p>', card);
    const next = s.indexOf('data-asset-name="', card + 1);
    const close = '\n     </div>';
    const end = use < 0 ? -1 : s.indexOf(close, use);
    if (end < 0 || (next > 0 && end > next)) {
      throw new Error(`deviation "asset lengths": no "Use it when" block on the ${name} card`);
    }
    const at = end + close.length;
    s = `${s.slice(0, at)}
     <div>
      <p style="margin:0 0 4px; font-size:13px; font-weight:700; color:#8A5A0B;">Typical length</p>
      <p style="margin:0; font-size:15px; line-height:1.6; color:#1F2833; text-wrap:pretty;">${text}</p>
     </div>${s.slice(at)}`;
  }
  return s;
}

/** Start Here: the Learning Assets layer states its size the way the
    Specialization, Course and Module layers above it already do. */
function startHereLengths(s, route) {
  if (route !== '') return s;
  return swap(
    s,
    '>Videos, readings, practice, and assessments</p>',
    '>Videos, readings, practice, and assessments · 5–30 minutes each</p>',
    'start here lengths',
  );
}

/** Module: a fourth planning tip on keeping each asset short. */
function moduleLengths(s, route) {
  if (route !== 'module') return s;
  const tips = '<ol style="margin:0 0 32px; padding:0; list-style:none; display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:28px;">';
  s = swap(s, tips, tips.replace('repeat(3,', 'repeat(4,').replace('gap:28px', 'gap:24px'), 'module tips grid');
  const last = 'where learners demonstrate the Module objectives.</p></li>';
  return swap(
    s,
    last,
    `${last}
   <li style="border-top:2px solid #6B4E9E; padding:14px 0 0;"><p style="margin:0 0 6px; font-size:15px; font-weight:700; color:#012169;">Keep each asset bite-sized</p><p style="margin:0; font-size:15px; line-height:1.6; color:#3A424E; text-wrap:pretty;">Videos run 5–10 minutes, Readings up to about 15, and practice or activities 5–30. If a step needs more, split it into smaller parts.</p></li>`,
    'module length tip',
  );
}

/* The worked example's time estimates (CTL, November 2026). Module 2 is
   2 hours, not 3, so it sits inside the 30 minutes–2 hours a Module is given
   on Start Here; every asset in it carries a length that follows the typical
   lengths above, and the lengths add up to the Module's 2 hours. The Course
   and Specialization totals follow: 2 + 2 + 2 = 6 hours, 6 + 9 + 8 = 23. */
const MODULE_2_MINUTES = {
  'Start With the Business Question': 6,
  'From a Business Question to Data Requirements': 10,
  'What Data Would You Need?': 10,
  'Is the Data Fit for the Question?': 8,
  'Data Fitness Criteria and Checklist': 10,
  'Think Aloud: Inspecting a Sample Dataset': 10,
  'Practice a Guided Data Fitness Check': 10,
  'Practice Data Fitness Review': 20,
  'Documenting Data Limitations': 6,
  'Which Limitations Matter?': 10,
  'Data Fitness Review': 20,
};
const MODULE_2_HOURS = 2;

function swapAll(s, find, replace, count, label) {
  const parts = s.split(find);
  if (parts.length - 1 !== count) {
    throw new Error(`deviation "${label}": expected ${count} matches, found ${parts.length - 1}`);
  }
  return parts.join(replace);
}

/** Module: an "Est. time" column on the learning path table, with a total. */
function moduleTimes(s, route) {
  if (route !== 'module') return s;
  const total = Object.values(MODULE_2_MINUTES).reduce((a, b) => a + b, 0);
  if (total > MODULE_2_HOURS * 60) {
    throw new Error(`deviation "module times": assets total ${total} min, over ${MODULE_2_HOURS} hours`);
  }
  const label = 'module times';
  s = swap(s, 'and their learning purpose</caption>', 'their learning purpose, and estimated time</caption>', label);
  s = swap(s, '<th scope="col" style="width:26%;', '<th scope="col" style="width:24%;', label);
  s = swap(s, '<th scope="col" style="width:32%;', '<th scope="col" style="width:30%;', label);
  const purposeHead = '<th scope="col" style="text-align:left; padding:12px 0 12px 16px; border-bottom:2px solid #6B4E9E; font-size:14px; color:#5A6472;">Learning purpose</th>';
  s = swap(
    s,
    purposeHead,
    `${purposeHead.replace('padding:12px 0 12px 16px', 'padding:12px 16px')}
    <th scope="col" style="width:11%; text-align:left; padding:12px 0 12px 16px; border-bottom:2px solid #6B4E9E; font-size:14px; color:#5A6472;">Est. time</th>`,
    label,
  );
  s = swapAll(s, '<th colspan="3" scope="colgroup"', '<th colspan="4" scope="colgroup"', 3, label);

  const purposeCell = '<td style="vertical-align:top; padding:16px 0 16px 16px; font-size:15px; line-height:1.6; color:#3A424E;">';
  const rowEnd = '</td>\n     </tr>';
  for (const [title, minutes] of Object.entries(MODULE_2_MINUTES)) {
    const name = `color:#1F2833;">${title}</span></td>`;
    if (s.split(name).length !== 2) throw new Error(`deviation "${label}": no single row for "${title}"`);
    const cell = s.indexOf(purposeCell, s.indexOf(name));
    const end = s.indexOf(rowEnd, cell);
    if (cell < 0 || end < 0) throw new Error(`deviation "${label}": row for "${title}" has moved on`);
    s = `${s.slice(0, cell)}${purposeCell.replace('padding:16px 0 16px 16px', 'padding:16px')}${s.slice(cell + purposeCell.length, end)}</td>
      <td style="vertical-align:top; padding:16px 0 16px 16px; font-size:15px; line-height:1.6; color:#3A424E; white-space:nowrap;">${minutes} min${s.slice(end)}`;
  }

  const hours = total / 60;
  const totalText = Number.isInteger(hours) ? `${hours} hours` : `${total} min`;
  return swap(
    s,
    '</tbody>\n   \n  </table>',
    `</tbody>
   <tfoot>
    <tr>
     <th colspan="3" scope="row" style="text-align:left; padding:18px 16px 18px 0; border-top:2px solid #6B4E9E; font-size:15px; font-weight:600; color:#012169;">Estimated time for this Module</th>
     <td style="padding:18px 0 18px 16px; border-top:2px solid #6B4E9E; font-size:15px; font-weight:600; color:#012169; white-space:nowrap;">${totalText}</td>
    </tr>
   </tfoot>
  </table>`,
    label,
  );
}

/** Course and Specialization: the totals that follow from a 2-hour Module 2. */
function exampleTotals(s, route) {
  if (route === 'course') {
    s = swap(s, 'color:#3A424E;">3 hours</td>', `color:#3A424E;">${MODULE_2_HOURS} hours</td>`, 'module 2 hours');
    return swap(s, '>Approximately 7 hours</p>', '>Approximately 6 hours</p>', 'course total');
  }
  if (route === 'specialization') {
    s = swap(s, 'color:#3A424E;">7 hours</td>', 'color:#3A424E;">6 hours</td>', 'course 1 hours');
    return swap(s, '>Approximately 24 hours</p>', '>Approximately 23 hours</p>', 'specialization total');
  }
  return s;
}

const DEVIATIONS = [assetLengths, startHereLengths, moduleLengths, moduleTimes, exampleTotals];

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
