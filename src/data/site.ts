/* ==========================================================================
   Site structure — the single place to edit when pages are added.
   Adding a new Learning Asset page: change that asset's `page` from
   undefined to its route, then create the page file. Nav dropdown,
   breadcrumbs, and footer links all follow automatically.
   ========================================================================== */

export type LevelKey = 'overview' | 'specialization' | 'course' | 'module' | 'assets';

/** Accent used for the active nav underline and footer neighbour names. */
export const levelColor: Record<LevelKey, string> = {
  overview: '#339898',
  specialization: '#00539B',
  course: '#17724A',
  module: '#6B4E9E',
  assets: '#B4700C',
};

export interface NavPage {
  key: LevelKey;
  label: string;
  href: string;
}

/** The five top-level pages, in hierarchy order. Drives the nav and the
    "Zoom out / Zoom in" footer chain. */
export const pages: NavPage[] = [
  { key: 'overview', label: 'Overview', href: '/' },
  { key: 'specialization', label: 'Specialization', href: '/specialization' },
  { key: 'course', label: 'Course', href: '/course' },
  { key: 'module', label: 'Module', href: '/module' },
  { key: 'assets', label: 'Learning Assets', href: '/learning-assets' },
];

export interface AssetLink {
  /** Matches `slug` in learning-assets-data.json. */
  slug: string;
  label: string;
  /** Label on the "Full guidance…" link at the foot of the asset's section.
      Wording is client-authored and varies per asset — keep it verbatim. */
  guidance: string;
  /** Set once the asset has its own page. Until then the dropdown links to
      the asset's section on the Learning Assets page. */
  page?: string;
}

/** All eight Coursera asset types, in the order they appear on the
    Learning Assets page. */
export const assetLinks: AssetLink[] = [
  {
    slug: 'video',
    label: 'Video',
    guidance: 'Full guidance for designing videos →',
    page: '/learning-assets/video',
  },
  {
    slug: 'reading',
    label: 'Reading',
    guidance: 'Full guidance for designing Readings →',
    page: '/learning-assets/reading',
  },
  {
    slug: 'plugin',
    label: 'Interactive Plugin',
    guidance: 'Full guidance for designing Interactive Plugin →',
  },
  { slug: 'dialogue', label: 'Coach Dialogue', guidance: 'Full guidance for designing Coach Dialogue →' },
  { slug: 'roleplay', label: 'Coach Role Play', guidance: 'Full guidance for designing Coach Role Play →' },
  { slug: 'assessments', label: 'Assessments', guidance: 'Full guidance for designing assessments →' },
  {
    slug: 'programming',
    label: 'Programming Assignments',
    guidance: 'Full guidance for designing Programming Assignments →',
  },
  { slug: 'labs', label: 'Coursera Labs', guidance: 'Full guidance for designing Coursera Labs →' },
];

/** Where a dropdown item should point: its own page if built, otherwise the
    matching section on the Learning Assets page. */
export function assetHref(a: AssetLink): string {
  return a.page ?? `/learning-assets#${a.slug}`;
}

/** The Duke Coursera Design Template faculty fill in alongside this guide.
    The /copy suffix is deliberate: it opens Google's "make a copy" prompt
    so each person gets their own, rather than editing the master. */
export const designTemplateUrl =
  'https://docs.google.com/document/d/1C-7HTxae1Xu6AXL8WQou78ctfzDw_s5j76eKeQAMlLI/copy?usp=sharing';

/** Prefix a site-root path with the configured base so links work both at
    the repo root and under /coursera-design-guide on GitHub Pages. */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (path === '/') return base || '/';
  const [p, hash] = path.split('#');
  return `${base}${p}${hash ? `#${hash}` : ''}`;
}

/** Neighbours in the hierarchy chain, for the page footer. */
export function neighbours(key: LevelKey) {
  const i = pages.findIndex((p) => p.key === key);
  return {
    prev: i > 0 ? pages[i - 1] : undefined,
    next: i >= 0 && i < pages.length - 1 ? pages[i + 1] : undefined,
  };
}
