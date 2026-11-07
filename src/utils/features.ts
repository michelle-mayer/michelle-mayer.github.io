import {
  themeConfig,
  type FeatureKey,
  type HomePageKey,
  type FeaturesConfig,
} from '../theme.config.ts';

export type { FeatureKey, HomePageKey, FeaturesConfig };

export const FEATURE_ROUTE_MAP: Record<HomePageKey, string> = {
  home: '/',
  about: '/about/',
  now: '/now/',
  blog: '/blog/',
  photography: '/photography/',
  log: '/log/',
  tags: '/tags/',
  contact: '/contact/',
};

const ROUTE_SEGMENT_TO_FEATURE: Record<string, HomePageKey> = {
  about: 'about',
  now: 'now',
  blog: 'blog',
  photography: 'photography',
  log: 'log',
  tags: 'tags',
  contact: 'contact',
};

const FALLBACK_HOME_PRIORITY: HomePageKey[] = [
  'blog',
  'about',
  'now',
  'log',
  'photography',
  'tags',
  'contact',
  'home',
];

function normalizeHref(href: string): string {
  if (!href || href === '/') return '/';
  return `/${href.replace(/^\/+|\/+$/g, '')}/`;
}

function isNavHrefExplicitlyDisabled(canonicalHref: string): boolean {
  const target = normalizeHref(canonicalHref);
  const matchingItem = themeConfig.navigation.items.find(
    (item) => normalizeHref(item.href) === target,
  );
  return matchingItem ? matchingItem.enabled === false : false;
}

/**
 * Checks whether a site feature is enabled.
 * A route-backed feature can be disabled either in `themeConfig.features`
 * OR by setting `enabled: false` on its item in `themeConfig.navigation.items`.
 */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  const features = themeConfig.features;
  if (features && features[feature] === false) {
    return false;
  }

  if (feature === 'home') {
    if (features?.defaultHomePage && features.defaultHomePage !== 'home') {
      return false;
    }
    if (isNavHrefExplicitlyDisabled('/')) {
      return false;
    }
    return true;
  }

  if (feature in FEATURE_ROUTE_MAP) {
    const routeHref = FEATURE_ROUTE_MAP[feature as HomePageKey];
    if (isNavHrefExplicitlyDisabled(routeHref)) {
      return false;
    }
  }

  return true;
}

/**
 * Whether interactive Formspree contact forms should be rendered
 * (on `/contact/`, `/about/#contact`, and at the bottom of blog articles).
 */
export function isContactFormEnabled(): boolean {
  return (
    isFeatureEnabled('contact') &&
    isFeatureEnabled('contactForm') &&
    Boolean(themeConfig.integrations.formspree.endpoint?.trim())
  );
}

/**
 * Resolves which feature view should be rendered at the root `/` URL (`src/pages/index.astro`).
 */
export function getEffectiveHomePage(): HomePageKey {
  const preferred: HomePageKey = themeConfig.features?.defaultHomePage ?? 'home';

  if (preferred !== 'home' && isFeatureEnabled(preferred)) {
    return preferred;
  }

  if (preferred === 'home' && isFeatureEnabled('home')) {
    return 'home';
  }

  for (const candidate of FALLBACK_HOME_PRIORITY) {
    if (candidate === 'home') continue;
    if (isFeatureEnabled(candidate)) {
      return candidate;
    }
  }

  return 'home';
}

/**
 * Maps a navigation href (e.g. `'/photography/'`) to its corresponding `HomePageKey` if applicable.
 */
export function getFeatureForHref(href: string): HomePageKey | null {
  const normalized = normalizeHref(href);
  if (normalized === '/') return 'home';
  const firstSegment = normalized.replace(/^\/+|\/+$/g, '').split('/')[0];
  return ROUTE_SEGMENT_TO_FEATURE[firstSegment] ?? null;
}

/**
 * Checks whether a given URL or pathname belongs to an enabled feature.
 * Used by navigation, footer, sitemap filters, and post-build pruning.
 */
export function isUrlEnabled(urlOrPathname: string): boolean {
  if (!urlOrPathname) return false;

  let pathname = urlOrPathname;
  if (/^https?:\/\//i.test(urlOrPathname)) {
    try {
      const parsed = new URL(urlOrPathname);
      const siteHost = new URL(themeConfig.site.url).hostname;
      if (parsed.hostname !== siteHost) {
        return true;
      }
      pathname = parsed.pathname;
    } catch {
      return true;
    }
  } else {
    pathname = urlOrPathname.split(/[?#]/)[0] || '/';
  }

  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean) return true; // Root `/` is always served

  if (clean === 'rss.xml' || clean === 'atom.xml') {
    return isFeatureEnabled('rss');
  }
  if (clean === 'llms.txt' || clean === 'llms-full.txt' || clean === 'llms.json') {
    return isFeatureEnabled('llms');
  }

  const segments = clean.split('/');
  const first = segments[0];

  if (first === 'log' && segments[1] === 'photos' && !isFeatureEnabled('photography')) {
    return false;
  }

  const feature = ROUTE_SEGMENT_TO_FEATURE[first];
  if (feature) {
    return isFeatureEnabled(feature);
  }

  return true;
}
