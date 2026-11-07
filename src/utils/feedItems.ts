import { getCollection } from 'astro:content';
import { SITE_AUTHOR } from './consts';
import { getChangelogEntries } from './changelog';
import { getPictureLogs } from './pictureLogs';
import { getLogAnchorPageMap, getGalleryPhotoHref } from './logTimeline';
import { getPaginatedHref } from './pagination';
import { siteConfig } from '../site.config';
import { isFeatureEnabled } from './features';

export interface UnifiedFeedItem {
  title: string;
  link: string;
  id: string;
  published: Date;
  updated: Date;
  summary: string;
  categories: string[];
  content?: string;
  author: string;
}

export function cleanChangelogDescription(markdown: string): string {
  if (!markdown) return 'Site release update and operational improvements.';

  const bullets = Array.from(
    markdown.matchAll(/-\s*\*\*([^*]+)\*\*(?::\s*)?(.*?)(?=(?:\n-\s*\*\*|$))/gs)
  ).map((b) => {
    const title = b[1].trim();
    const details = b[2]
      .replace(/\[`?([^\]`]+)`?\]\([^)]+\)/g, '$1')
      .replace(/[`*]|(?<!\w)_|_(?!\w)/g, '')
      .trim();
    const firstSentence = details.split('\n')[0].replace(/^-\s*/, '').trim();
    return title + (firstSentence ? `: ${firstSentence}` : '');
  });

  if (bullets.length > 0) {
    return bullets.slice(0, 3).join(' • ');
  }

  const plain = markdown
    .replace(/\[`?([^\]`]+)`?\]\([^)]+\)/g, '$1')
    .replace(/[`*#]|(?<!\w)_|_(?!\w)/g, '')
    .trim();

  return plain.length > 280 ? `${plain.slice(0, 277)}...` : plain;
}

const feedCache = new Map<string, UnifiedFeedItem[]>();

/**
 * Aggregates and sorts all 4 site content streams (Blog, Status-Updates,
 * Changelogs, and Photo Rolls) once per build for both RSS and Atom feeds.
 */
export async function getUnifiedFeedItems(siteUrlInput?: string): Promise<UnifiedFeedItem[]> {
  const siteUrl = (siteUrlInput || siteConfig.site.url).replace(/\/+$/, '');
  const cached = feedCache.get(siteUrl);
  if (cached) return cached;

  const toUrl = (p: string) =>
    p.startsWith('http') ? p : `${siteUrl}${p.startsWith('/') ? p : `/${p}`}`;

  const showBlog = isFeatureEnabled('blog');
  const showLog = isFeatureEnabled('log');
  const showPhotography = isFeatureEnabled('photography');

  const [blogPosts, logNotes, changelogs, photoLogs, logAnchorPages] = await Promise.all([
    showBlog ? getCollection('blog') : Promise.resolve([]),
    showLog ? getCollection('log') : Promise.resolve([]),
    showLog ? getChangelogEntries() : Promise.resolve([]),
    showPhotography ? getPictureLogs() : Promise.resolve([]),
    showLog ? getLogAnchorPageMap() : Promise.resolve({} as Record<string, number>),
  ]);

  const blogItems: UnifiedFeedItem[] = blogPosts.map((post) => {
    const url = toUrl(`/blog/${post.id}/`);
    return {
      title: post.data.title,
      link: url,
      id: url,
      published: post.data.pubDate,
      updated: post.data.updatedDate || post.data.pubDate,
      summary: post.data.description,
      categories: ['Blog', ...(post.data.tags || [])],
      author: post.data.author || SITE_AUTHOR,
    };
  });

  const noteItems: UnifiedFeedItem[] = logNotes.map((entry) => {
    const bodyText = (entry.body || '').trim();
    const slug = entry.id.replace(/\.[^/.]+$/, '');
    const itemUrl = toUrl(getPaginatedHref('/log', logAnchorPages[slug] ?? 1, `#${slug}`));
    const htmlContent = bodyText
      ? `<p>${bodyText.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>')}</p><p><a href="${itemUrl}">View in Log stream &rarr;</a></p>`
      : undefined;

    return {
      title: `Status-Update: ${entry.data.title}`,
      link: itemUrl,
      id: itemUrl,
      published: entry.data.date,
      updated: entry.data.date,
      summary: bodyText || entry.data.title,
      categories: ['Status-Update', 'Log', ...(entry.data.tags || [])],
      content: htmlContent,
      author: SITE_AUTHOR,
    };
  });

  const changelogItems: UnifiedFeedItem[] = changelogs.map((entry) => {
    const itemUrl = toUrl(getPaginatedHref('/log', logAnchorPages[entry.id] ?? 1, `#${entry.id}`));
    return {
      title: `Changelog: ${entry.title}`,
      link: itemUrl,
      id: itemUrl,
      published: entry.date,
      updated: entry.date,
      summary: cleanChangelogDescription(entry.rawMarkdown),
      categories: ['Changelog', 'Log', ...(entry.tags || [])],
      content: `${entry.html}<p><a href="${itemUrl}">View in Log stream &rarr;</a></p>`,
      author: SITE_AUTHOR,
    };
  });

  const photoItems: UnifiedFeedItem[] = photoLogs.map((photo) => {
    const galleryUrl = toUrl(getGalleryPhotoHref(photo.id));
    const logAnchor = `photo-${photo.id}`;
    const logUrl = toUrl(getPaginatedHref('/log', logAnchorPages[logAnchor] ?? 1, `#${logAnchor}`));
    const linksHtml = showLog
      ? `<p><a href="${galleryUrl}">View in Photo Gallery &rarr;</a> &bull; <a href="${logUrl}">View in Log Stream &rarr;</a></p>`
      : `<p><a href="${galleryUrl}">View in Photo Gallery &rarr;</a></p>`;
    return {
      title: `Photo: ${photo.title}`,
      link: galleryUrl,
      id: galleryUrl,
      published: photo.pubDate,
      updated: photo.pubDate,
      summary: `${photo.location} — ${photo.story}`,
      categories: ['Photo', 'Photography', photo.category, ...(photo.tags || [])],
      content: `<p><strong>Location:</strong> ${photo.location}<br/><strong>Category:</strong> ${photo.category}<br/><strong>Captured:</strong> ${photo.dateFormatted}</p><p>${photo.story}</p>${linksHtml}`,
      author: SITE_AUTHOR,
    };
  });

  const allItems = [...blogItems, ...noteItems, ...changelogItems, ...photoItems].sort(
    (a, b) => b.published.valueOf() - a.published.valueOf()
  );

  feedCache.set(siteUrl, allItems);
  return allItems;
}
