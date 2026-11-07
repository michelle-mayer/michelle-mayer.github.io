import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_TITLE } from '../utils/consts';
import { getTagTaxonomy } from '../utils/tagTaxonomy';
import { tagHref } from '../utils/tagHref';
import { pictureLogs } from '../utils/pictureLogs';
import { siteConfig } from '../site.config';
import { isFeatureEnabled, isUrlEnabled } from '../utils/features';

/**
 * Machine-readable counterpart to `/llms.txt` and `/llms-full.txt`.
 * Built from the content collections at build time so it never drifts
 * out of sync with published articles, topics, or photography.
 */
export async function GET(context: APIContext) {
  const siteUrl = (context.site ? context.site.href : siteConfig.site.url).replace(/\/+$/, '');
  const abs = (path: string) => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const showHome = isFeatureEnabled('home');
  const showAbout = isFeatureEnabled('about');
  const showNow = isFeatureEnabled('now');
  const showLog = isFeatureEnabled('log');
  const showBlog = isFeatureEnabled('blog');
  const showPhotography = isFeatureEnabled('photography');
  const showTags = isFeatureEnabled('tags');
  const showContact = isFeatureEnabled('contact');
  const showRss = isFeatureEnabled('rss');

  const [posts, taxonomy] = await Promise.all([
    showBlog ? getCollection('blog') : Promise.resolve([]),
    showTags ? getTagTaxonomy() : Promise.resolve({ sortedTags: [], photoTags: [], archiveMap: new Map(), contentTagSlugs: new Set() }),
  ]);

  const articles = posts
    .slice()
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => ({
      title: post.data.title,
      url: abs(`/blog/${post.id}/`),
      description: post.data.description,
      published: post.data.pubDate.toISOString(),
      updated: (post.data.updatedDate || post.data.pubDate).toISOString(),
      author: post.data.author || SITE_AUTHOR,
      tags: post.data.tags,
    }));

  const topics = taxonomy.sortedTags.map((tag) => {
    const candidateHref = tagHref(tag.slug);
    const resolvedHref = isUrlEnabled(candidateHref) ? candidateHref : `/tags/${tag.slug}/`;
    return {
      name: tag.name,
      url: abs(resolvedHref),
      counts: {
        total: tag.count,
        articles: tag.blogCount,
        log: tag.logCount,
        photos: tag.photoCount,
        career: tag.expCount,
      },
    };
  });

  const newestPhoto = showPhotography
    ? pictureLogs.reduce<Date | null>(
        (latest, p) => (!latest || p.pubDate > latest ? p.pubDate : latest),
        null,
      )
    : null;

  const pages = [
    showHome ? { name: 'Home', url: abs('/'), description: 'Overview, featured photography, and recent articles.' } : null,
    showAbout ? { name: 'About', url: abs('/about/'), description: 'Career history, homelab philosophy, and recommendations.' } : null,
    showNow ? { name: 'Now', url: abs('/now/'), description: 'What Ed is currently working on and focused on.' } : null,
    showLog ? { name: 'Log', url: abs('/log/'), description: showPhotography ? 'Micro-updates, site changelogs, and photo rolls.' : 'Micro-updates and site changelogs.' } : null,
    showBlog ? { name: 'Blog', url: abs('/blog/'), description: 'Technical articles and homelab write-ups.' } : null,
    showPhotography ? { name: 'Photography', url: abs('/photography/'), description: 'Portfolio of landscape, architecture, and street photography.' } : null,
    showTags ? { name: 'Tags', url: abs('/tags/'), description: 'Cross-collection topic directory.' } : null,
    showContact ? { name: 'Contact', url: abs('/contact/'), description: 'How to get in touch.' } : null,
  ].filter(Boolean);

  const body = {
    $schema: abs('/llms.json'),
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: abs('/'),
    language: 'en',
    updated: articles[0]?.updated ?? null,
    owner: {
      name: SITE_AUTHOR,
      ...(siteConfig.author.alternateName ? { alternateName: siteConfig.author.alternateName } : {}),
      role: siteConfig.author.jobTitle,
      location: siteConfig.author.location,
      email: siteConfig.author.email,
      links: {
        website: abs('/'),
        ...siteConfig.socials,
      },
    },
    llmFiles: [
      {
        name: 'llms.txt',
        url: abs('/llms.txt'),
        type: 'text/markdown',
        description: 'Concise site overview and index of key pages, written for LLMs.',
      },
      {
        name: 'llms-full.txt',
        url: abs('/llms-full.txt'),
        type: 'text/markdown',
        description: 'Concatenated Markdown archive of profile and article content for ingestion and RAG.',
      },
      {
        name: 'llms.json',
        url: abs('/llms.json'),
        type: 'application/json',
        description: 'This file: structured index of pages, articles, topics, and feeds, generated at build time.',
      },
    ],
    feeds: {
      ...(showRss ? { rss: abs('/rss.xml'), atom: abs('/atom.xml') } : {}),
      sitemap: abs('/sitemap-index.xml'),
    },
    pages,
    ...(showBlog ? { articles } : {}),
    ...(showTags ? { topics } : {}),
    ...(showPhotography
      ? {
          photography: {
            url: abs('/photography/'),
            count: pictureLogs.length,
            latest: newestPhoto ? newestPhoto.toISOString() : null,
          },
        }
      : {}),
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

