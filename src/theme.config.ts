/**
 * Theme & UI Mechanics Configuration (`theme.config.ts`)
 *
 * Controls visual styling, SVG logo geometry, navigation links, pagination sizes,
 * technical acronym tooltips, third-party integrations (Formspree, Umami), Open Graph
 * card labels, and footer options.
 *
 * Personal/site identity and author metadata live in `site.config.ts` (and are
 * merged into `themeConfig` below for convenient single-import access).
 */

import { siteConfig, type SiteIdentityConfig } from './site.config.ts';

export interface NavLinkConfig {
  label: string;
  href: string;
  /**
   * Set to `false` to disable this section entirely (hides it from the header/floating menus,
   * skips building its routes/sub-streams, and removes its carousels, tag sections, and feed entries).
   */
  enabled?: boolean;
  /** Additional path prefixes that should highlight this nav item as active */
  activePrefixes?: string[];
}

export type HomePageKey =
  | 'home'
  | 'blog'
  | 'about'
  | 'now'
  | 'photography'
  | 'log'
  | 'tags'
  | 'contact';

export type FeatureKey =
  | HomePageKey
  | 'contactForm'
  | 'rss'
  | 'llms';

export interface FeaturesConfig {
  /**
   * Which section is rendered at the root `/` URL (default: `'home'`).
   * For example, set `defaultHomePage: 'blog'` to make the blog index the front page of your site.
   */
  defaultHomePage: HomePageKey;
  /** Enable the `/home` personal overview & multi-stream carousels page (`true` by default) */
  home: boolean;
  /** Enable `/about/`, career experience timeline, and author profile links (`true` by default) */
  about: boolean;
  /** Enable `/now/` current focus page (`true` by default) */
  now: boolean;
  /** Enable `/blog/`, article routes, homepage blog carousel, and tag article listings (`true` by default) */
  blog: boolean;
  /** Enable `/photography/`, photo routes, homepage photo roll, `/log/photos/`, and photo feeds (`true` by default) */
  photography: boolean;
  /** Enable `/log/`, status micro-updates, changelog stream, and homepage log carousel (`true` by default) */
  log: boolean;
  /** Enable `/tags/` topic index, `/tags/[tag]/` archive pages, and interactive tag badges (`true` by default) */
  tags: boolean;
  /** Enable `/contact/` page and contact CTAs (`true` by default) */
  contact: boolean;
  /** Enable the Formspree `<ContactForm />` on `/contact/`, `/about/`, and at the bottom of blog articles (`true` by default) */
  contactForm: boolean;
  /** Enable `/rss.xml` and `/atom.xml` syndication feeds (`true` by default) */
  rss: boolean;
  /** Enable `/llms.txt`, `/llms-full.txt`, and `/llms.json` AI discovery feeds (`true` by default) */
  llms: boolean;
}

export interface PoweredByLinkConfig {
  label: string;
  href: string;
  icon: 's3' | 'mrap' | 'cloudfront' | 'info';
  highlight?: boolean;
}

export interface ThemeMechanicsConfig {
  logo: {
    /** Text wordmark rendered inside the SVG logo (`src/components/Logo.astro`) */
    text: string;
    /** Accessible label for the SVG logo (defaults to `site.title`) */
    ariaLabel?: string;
    /** Letter spacing of the SVG wordmark (default: '0.22em') */
    letterSpacing?: string;
    /** Font size of the SVG wordmark in px (default: 14) */
    fontSize?: number;
    /** Whether to render the angled compass needle emblem on the underline (default: true) */
    showCompass?: boolean;
    /** Rotation angle in degrees for the compass needle (default: 42) */
    compassAngle?: number;
  };

  integrations: {
    /**
     * Optional Formspree endpoint for the message form (`src/components/ContactForm.astro`).
     * Create a free account at https://formspree.io and paste your form URL here,
     * or set `features.contactForm: false` (or leave `endpoint` empty) to disable the form.
     */
    formspree: {
      endpoint: string;
    };

    /**
     * Optional privacy-friendly Umami Analytics (`src/components/Head.astro`).
     * Set `enabled: false` or leave `websiteId` empty to disable analytics script injection.
     */
    umami: {
      enabled: boolean;
      scriptUrl: string;
      websiteId: string;
    };
  };

  navigation: {
    /** Primary site navigation links rendered in the top bar and floating capsule menu */
    items: NavLinkConfig[];
  };

  /**
   * End-to-end feature toggles and configurable root homepage.
   * Disabling a feature here (or setting `enabled: false` on its item in `navigation.items`)
   * completely disables its routes, carousels, sub-streams, tag sections, and feed entries.
   */
  features: FeaturesConfig;

  pagination: {
    /** Number of older blog articles per page on `/blog/` */
    olderBlogsCount: number;
    /** Number of timeline entries per page on `/log/` */
    logCount: number;
    /** Number of photographs per page on `/photography/` */
    galleryCount: number;
    /** Number of cards in each homepage horizontal carousel (`#photos`, `#blog`, `#log`) */
    homepageCarouselCount: number;
  };

  openGraph: {
    /** Uppercase brand label rendered in the top-right corner of 1200x630 OG cards */
    brandLabel: string;
    /** Location pin text rendered in the bottom metadata bar of OG cards */
    locationPinLabel: string;
  };

  tooltips: {
    /** Enable technical acronym tooltips across Markdown articles and logs */
    enabled: boolean;
    /**
     * Automatically detect and wrap plain-text occurrences of dictionary terms from `src/data/techTerms.ts`
     * in Markdown without needing manual `<abbr>` tags:
     * - `'first'`: Auto-wrap the first occurrence of each term per article/entry (recommended)
     * - `'all'`: Auto-wrap every occurrence of each term
     * - `'off'`: Only upgrade explicit `<abbr>` tags
     */
    autoLink: 'first' | 'all' | 'off';
  };

  footer: {
    /** Heading for the site links column in the footer */
    siteColumnTitle: string;
    /** Show the "Powered by" infrastructure column in the footer */
    showPoweredBy: boolean;
    /** Links displayed under the "Powered by" column in the footer */
    poweredByLinks: PoweredByLinkConfig[];
    /**
     * Toggle the credit to The Navigator theme by Ed Stuurman in the footer.
     * This is a free theme — feel free to set this to `false`, though it'd be cool to keep that one link!
     */
    showThemeAttribution: boolean;
  };
}

export type ThemeConfig = SiteIdentityConfig & ThemeMechanicsConfig;

export const themeMechanics: ThemeMechanicsConfig = {
  logo: {
    text: 'MY SITE',
    ariaLabel: siteConfig.site.title,
    letterSpacing: '0.22em',
    fontSize: 14,
    showCompass: true,
    compassAngle: 42,
  },

  integrations: {
    formspree: {
      endpoint: '',
    },
    umami: {
      enabled: false,
      scriptUrl: 'https://cloud.umami.is/script.js',
      websiteId: '',
    },
  },

  navigation: {
    items: [
      { label: 'Home', href: '/', enabled: true },
      { label: 'About', href: '/about/', enabled: true },
      { label: 'Now', href: '/now/', enabled: true },
      { label: 'Blog', href: '/blog/', enabled: true, activePrefixes: ['/tags'] },
      { label: 'Photography', href: '/photography/', enabled: true },
      { label: 'Log', href: '/log/', enabled: true },
      { label: 'Contact', href: '/contact/', enabled: true },
    ],
  },

  features: {
    defaultHomePage: 'home',
    home: true,
    about: true,
    now: true,
    blog: true,
    photography: false,
    log: false,
    tags: true,
    contact: true,
    contactForm: false,
    rss: true,
    llms: true,
  },

  pagination: {
    olderBlogsCount: 10,
    logCount: 20,
    galleryCount: 50,
    homepageCarouselCount: 7,
  },

  openGraph: {
    brandLabel: 'MY SITE',
    locationPinLabel: siteConfig.author.location,
  },

  tooltips: {
    enabled: true,
    autoLink: 'first',
  },

  footer: {
    siteColumnTitle: siteConfig.site.domain,
    showPoweredBy: false,
    poweredByLinks: [],
    // It's a free theme — set this to `true` if you'd like to display the footer credit!
    showThemeAttribution: true,
  },
};

export const themeConfig: ThemeConfig = {
  ...siteConfig,
  ...themeMechanics,
};

export default themeConfig;
