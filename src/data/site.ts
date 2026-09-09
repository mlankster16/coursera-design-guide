/* ==========================================================================
   Site structure — the single place to edit when pages are added.
   Adding a new Learning Asset page: change that asset's `page` from
   undefined to its route, then create the page file. Nav dropdown,
   breadcrumbs, and footer links all follow automatically.
   ========================================================================== */

import { learningAssets } from './learning-assets';

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

/** Child pages of Learning Assets that are not one of the eight asset
    types. The shared-guidance page sits at the top of the dropdown's child
    list and is the only emphasized item in it — accessibility, copyright
    and AI apply to every asset, so it is the one faculty need most. */
export const sharedGuidance = {
  label: 'Accessibility, Copyright & AI',
  href: '/learning-assets/accessibility-copyright-ai',
};

/* ---------------------------------------------------------------------------
   The eight asset guides are held back as a set.

   Video and Reading are built, but CTL is not ready to share any of them
   until all eight exist, so nothing links out to an asset page yet: the
   cards read "Available soon" and the dropdown points at each asset's
   section on the Learning Assets page instead.

   Flip this to true to release them, or give an individual asset
   `released: true` in learningAssets to let just that one through.
   --------------------------------------------------------------------------- */
export const assetGuidesReleased = false;

export interface AssetLink {
  /** Matches `slug` in the learningAssets list. */
  slug: string;
  label: string;
  /** The asset's own page, when one exists. */
  page?: string;
}

/** All eight Coursera asset types, in the order they appear on the
    Learning Assets page. Derived from learningAssets so the dropdown, the
    hero rail, and the cards share one source. */
export const assetLinks: AssetLink[] = learningAssets.map((a) => ({
  slug: a.slug,
  label: a.railLabel,
  page: a.page,
}));

/** True when this asset's own page is built AND cleared for sharing. */
export function assetPageLive(a: { page?: string }): boolean {
  return Boolean(a.page) && assetGuidesReleased;
}

/** Where a dropdown item should point: its own page once the guides are
    released, otherwise the matching section on the Learning Assets page. */
export function assetHref(a: AssetLink): string {
  return assetPageLive(a) ? a.page! : `/learning-assets#${a.slug}`;
}

/* ---------------------------------------------------------------------------
   The two design templates, as view-only examples.

   Faculty do not copy these. Their Learning Experience Designer sends the
   working template their project actually needs; these exist so they can
   see the shape of the document before that meeting. That is why the links
   end in /edit rather than the /copy prompt an earlier single template used.
   --------------------------------------------------------------------------- */
export const templateExamples = {
  specialization:
    'https://docs.google.com/document/d/1qsH5U9GwQzpmc12p7Rx9avnceBAEWQWel7NsS-s16C0/edit?usp=sharing',
  course:
    'https://docs.google.com/document/d/1tLgjw6SXVDD1EQ7fnPM7rrTAR3vgoUVrbtsn61BDzn4/edit?usp=sharing',
};

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
