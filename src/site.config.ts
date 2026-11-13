/**
 * Site & Author Identity Configuration (`site.config.ts`)
 *
 * Single source of truth for personal/site identity, author profile, headshots,
 * and social links. Separated from `theme.config.ts` (which controls UI mechanics,
 * layout, pagination, tooltips, and integrations).
 */

export interface SiteIdentityConfig {
  site: {
    /** Canonical production URL (no trailing slash) */
    url: string;
    /** Display domain name used in footer headers, OG cards, and Schema.org */
    domain: string;
    /** Default site title and brand name */
    title: string;
    /** Default meta description */
    description: string;
    /** Open Graph locale tag */
    locale: string;
    /** RSS/Atom feed language code */
    language: string;
    /**
     * IANA timezone identifier (e.g. `'America/Los_Angeles'`, `'Asia/Tokyo'`, `'Europe/Amsterdam'`)
     * used to interpret date-only frontmatter strings (`YYYY-MM-DD`) and format visible dates
     * identically across local machines and UTC CI runners.
     */
    timeZone: string;
    /** Default SEO keywords merged with page-specific tags */
    defaultKeywords: string[];
  };

  author: {
    /** Primary display name (also used as the default blog post author in `src/content.config.ts`) */
    name: string;
    /** Full or alternate name for Schema.org Person structured data */
    alternateName?: string;
    /** Image in `src/images/` used for the author avatar chip and blog author bio box */
    avatar: string;
    /** Image in `src/images/` used for the `/about/` portrait (can be the same as `avatar` or a separate file) */
    aboutImage?: string;
    /** Accessible description of the About image (defaults to the author name) */
    aboutImageAlt?: string;
    /** Short subtitle shown beneath the author name in AuthorChip */
    tagline: string;
    /** Formal role title used in Schema.org Person / ProfilePage */
    jobTitle: string;
    /** Short bio used in Schema.org Person, blog author box, and LLM index endpoints */
    bio: string;
    /** Geographic location label (shown on OG cards and metadata) */
    location: string;
    /** Public contact email address */
    email: string;
    /** Core topics listed in Schema.org `knowsAbout` */
    knowsAbout: string[];
  };

  socials: {
    github?: string;
    gitlab?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    bluesky?: string;
    mastodon?: string;
  };
}

export const siteConfig: SiteIdentityConfig = {
  site: {
    url: 'https://michelle-mayer.github.io',
    domain: 'michelle-mayer.github.io',
    title: 'Michelle Mayer',
    description:
      'Writing on technology, AI safety, and life beyond the keyboard. Based on The Navigator theme by Ed Stuurman.',
    locale: 'en_US',
    language: 'en-us',
    timeZone: 'UTC',
    defaultKeywords: [
      'Personal website',
      'Astro',
      'Tailwind CSS',
    ],
  },

  author: {
    name: 'Michelle Mayer',
    avatar: 'author.jpg',
    aboutImage: 'cat-laptop-transparent.png',
    aboutImageAlt: 'An illustrated calico cat using a laptop',
    tagline: 'A personal site in progress',
    jobTitle: 'Software Engineer',
    bio: 'A creative, people-minded software engineer exploring AI safety, ethics, mental health, and life beyond the keyboard.',
    location: 'Charlotte, NC',
    email: 'Michelle.Mayer43@gmail.com',
    knowsAbout: [],
  },

  socials: {
    github: 'https://github.com/michelle-mayer',
    linkedin: 'https://www.linkedin.com/in/michelle-leigh-mayer/',
  },
};

export default siteConfig;
