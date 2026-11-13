import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage, computeOgCacheKey, type OgImageProps } from '../../utils/generateOgImage';
import { getReadingTime } from '../../utils/readingTime';
import { getTagTaxonomy } from '../../utils/tagTaxonomy';
import { isHardLinkedTag, tagHref } from '../../utils/tagHref';
import { pictureLogs } from '../../utils/pictureLogs';
import { siteConfig } from '../../site.config';
import { isFeatureEnabled, isUrlEnabled, type HomePageKey } from '../../utils/features';

export const prerender = true;

interface StaticPathEntry {
  params: { slug: string };
  props: OgImageProps;
  cacheKey: string;
}

export async function getStaticPaths() {
  const paths: StaticPathEntry[] = [];

  // 1. Blog Posts
  if (isFeatureEnabled('blog')) {
    const allPosts = await getCollection('blog');
    for (const post of allPosts) {
      const props: OgImageProps = {
        badge: 'Engineering Article',
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        updatedDate: post.data.updatedDate,
        readingTime: getReadingTime(post.body),
        tags: post.data.tags || [],
        theme: 'lavender',
      };
      paths.push({
        params: { slug: `blog/${post.id}` },
        props,
        cacheKey: computeOgCacheKey(props),
      });
    }
  }

  // 2. Unique Topic / Tag Archives
  if (isFeatureEnabled('tags')) {
    const { archiveMap } = await getTagTaxonomy();
    for (const [tagSlug, data] of archiveMap.entries()) {
      if (isHardLinkedTag(tagSlug) && isUrlEnabled(tagHref(tagSlug))) continue;
      const tag = data.tagName;
      const props: OgImageProps = {
        badge: 'Topic Archive',
        title: `#${tag}`,
        description: `Explore engineering write-ups, homelab notes, career experience, and photography topics on #${tag} by ${siteConfig.author.name}.`,
        tags: [tag],
        theme: 'lavender',
      };
      paths.push({
        params: { slug: `tags/${tagSlug}` },
        props,
        cacheKey: computeOgCacheKey(props),
      });
    }
  }

  // 4. Core Static Pages (derived from `src/content/pages/*.md` + `siteConfig`)
  const allPages = await getCollection('pages');
  const pagesMap = new Map(allPages.map((p) => [p.id.replace(/\.[^/.]+$/, ''), p.data]));
  const defaultTags = siteConfig.site.defaultKeywords.slice(0, 4);

  const pageMeta = (
    slug: string,
    fallbackTitle: string,
    fallbackDesc: string,
    fallbackTags: string[],
  ) => {
    const entry = pagesMap.get(slug);
    return {
      title: entry?.ogTitle || entry?.pageTitle || fallbackTitle,
      description: entry?.description || fallbackDesc,
      tags: entry?.ogTags && entry.ogTags.length > 0 ? entry.ogTags : fallbackTags,
    };
  };

  const corePages: Record<string, OgImageProps> = {
    home: {
      badge: siteConfig.author.jobTitle,
      ...pageMeta(
        'home',
        `${siteConfig.author.name} — ${siteConfig.author.tagline}`,
        siteConfig.site.description,
        defaultTags,
      ),
      theme: 'lavender',
    },
    about: {
      badge: 'Profile & Background',
      ...pageMeta(
        'about',
        `About ${siteConfig.author.name}`,
        siteConfig.author.bio,
        defaultTags,
      ),
      theme: 'lavender',
    },
    now: {
      badge: 'Living Snapshot',
      ...pageMeta(
        'now',
        'What I’m Doing Now — /now',
        siteConfig.site.description,
        ['Now', ...defaultTags.slice(0, 3)],
      ),
      theme: 'lavender',
    },
    log: {
      badge: pagesMap.get('log')?.badge || 'Stream • Changelogs, Status-Updates & Photo Rolls',
      ...pageMeta(
        'log',
        'Log Stream & Status-Updates',
        'A chronological stream of status-updates, site changelogs, and photo rolls.',
        ['Changelogs', 'Status-Updates', 'Photo Rolls'],
      ),
      theme: 'lavender',
    },
    blog: {
      badge: 'Blog',
      ...pageMeta(
        'blog',
        'From the Blog',
        siteConfig.site.description,
        ['Writing', 'Ideas', 'Updates'],
      ),
      theme: 'lavender',
    },
    photography: {
      badge: 'Visual Gallery',
      ...pageMeta(
        'photography',
        'Photography Roll — Moments & Landscapes',
        `Photography gallery by ${siteConfig.author.name}.`,
        ['Photography', 'Architecture', 'Landscapes'],
      ),
      theme: 'lavender',
    },
    contact: {
      badge: 'Direct Connect',
      ...pageMeta(
        'contact',
        `Get in Touch — ${siteConfig.author.name}`,
        `Get in touch with ${siteConfig.author.name}.`,
        ['Contact', 'Email'],
      ),
      theme: 'lavender',
    },
    tags: {
      badge: 'Topic Directory',
      ...pageMeta(
        'tags',
        'Topics & Taxonomy',
        'Explore articles, status updates, career experience, and photos by technology, location, and theme.',
        ['Topics', 'Tags', 'Index'],
      ),
      theme: 'lavender',
    },
    default: {
      badge: siteConfig.author.jobTitle,
      title: `${siteConfig.author.name} — ${siteConfig.site.domain}`,
      description: siteConfig.site.description,
      tags: defaultTags,
      theme: 'lavender',
    },
  };

  for (const [pageSlug, props] of Object.entries(corePages)) {
    if (
      pageSlug !== 'home' &&
      pageSlug !== 'default' &&
      !isFeatureEnabled(pageSlug as HomePageKey)
    ) {
      continue;
    }
    paths.push({
      params: { slug: pageSlug },
      props,
      cacheKey: computeOgCacheKey(props),
    });
  }

  // 5. Individual Photographs (/og/photography/[id].jpg)
  if (isFeatureEnabled('photography')) {
    for (const photo of pictureLogs) {
      const props: OgImageProps = {
        badge: `Photograph #${photo.id}`,
        title: photo.title,
        description: photo.story ? `${photo.location} — ${photo.story}` : photo.location,
        pubDate: photo.pubDate,
        tags: photo.tags || ['Photography'],
        ctaText: 'View Photo',
        photoFilename: photo.filename,
        theme: 'lavender',
      };
      paths.push({
        params: { slug: `photography/${photo.id}` },
        props,
        cacheKey: computeOgCacheKey(props),
      });
    }
  }

  return paths;
}

export const GET: APIRoute = async ({ props }) => {
  try {
    const jpegBuffer = await generateOgImage(props as OgImageProps);
    return new Response(new Uint8Array(jpegBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to generate OG image:', error);
    return new Response('Failed to generate OG image', { status: 500 });
  }
};
