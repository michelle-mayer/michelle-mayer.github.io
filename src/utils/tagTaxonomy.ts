import { getCollection, type CollectionEntry } from 'astro:content';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { slugify } from './slugify';
import { getChangelogEntries } from './changelog';
import { experiences, type ExperienceItem } from '../data/experiences';
import { pictureLogs, type PictureLog } from './pictureLogs';
import { isFeatureEnabled } from './features';

export interface TagSummaryEntry {
  slug: string;
  name: string;
  count: number;
  hasExperience: boolean;
  expCount: number;
  blogCount: number;
  logCount: number;
  photoCount: number;
  contentCount: number;
}

export interface PhotoOnlyTagEntry {
  name: string;
  slug: string;
  count: number;
}

export interface NormalizedLogItem {
  id: string;
  title: string;
  date: Date;
  tags: string[];
}

export interface TagArchiveData {
  tagName: string;
  posts: CollectionEntry<'blog'>[];
  logs: NormalizedLogItem[];
  photoLogs: PictureLog[];
  experiences: ExperienceItem[];
}

export interface TagTaxonomyResult {
  sortedTags: TagSummaryEntry[];
  photoTags: PhotoOnlyTagEntry[];
  archiveMap: Map<string, TagArchiveData>;
  contentTagSlugs: Set<string>;
}

let cachedTaxonomy: TagTaxonomyResult | null = null;

/**
 * Memoized cross-collection tag taxonomy builder shared by:
 * - `/tags/` directory (`tags/index.astro`)
 * - `/tags/[tag]/` archive routes (`tags/[tag].astro`)
 * - Open Graph tag card generator (`og/[...slug].jpg.ts`)
 * - Career skill badges (`ExperienceTimeline.astro`)
 */
export async function getTagTaxonomy(): Promise<TagTaxonomyResult> {
  if (cachedTaxonomy) return cachedTaxonomy;

  const showBlog = isFeatureEnabled('blog');
  const showLog = isFeatureEnabled('log');
  const showAbout = isFeatureEnabled('about');
  const showPhotography = isFeatureEnabled('photography');

  const [allPosts, allLogs, changelogEntries] = await Promise.all([
    showBlog ? getCollection('blog') : Promise.resolve([]),
    showLog ? getCollection('log') : Promise.resolve([]),
    showLog ? getChangelogEntries() : Promise.resolve([]),
  ]);

  const tagMap = new Map<string, Omit<TagSummaryEntry, 'slug'>>();
  const archiveMap = new Map<string, TagArchiveData>();
  const contentTagSlugs = new Set<string>();

  const ensureSummary = (tag: string) => {
    const slug = slugify(tag);
    let entry = tagMap.get(slug);
    if (!entry) {
      entry = {
        name: tag,
        count: 0,
        hasExperience: false,
        expCount: 0,
        blogCount: 0,
        logCount: 0,
        photoCount: 0,
        contentCount: 0,
      };
      tagMap.set(slug, entry);
    }
    return entry;
  };

  const ensureArchive = (tag: string): TagArchiveData => {
    const slug = slugify(tag);
    let archive = archiveMap.get(slug);
    if (!archive) {
      archive = { tagName: tag, posts: [], logs: [], photoLogs: [], experiences: [] };
      archiveMap.set(slug, archive);
    }
    return archive;
  };

  // 1. Blog posts
  for (const post of allPosts) {
    for (const tag of post.data.tags) {
      const slug = slugify(tag);
      contentTagSlugs.add(slug);
      const summary = ensureSummary(tag);
      summary.count += 1;
      summary.contentCount += 1;
      summary.blogCount += 1;
      ensureArchive(tag).posts.push(post);
    }
  }

  // 2. Micro-updates + Changelogs
  const allLogItems: NormalizedLogItem[] = [
    ...allLogs.map((log) => ({
      id: log.id.replace(/\.[^/.]+$/, ''),
      title: log.data.title,
      date: log.data.date,
      tags: log.data.tags || [],
    })),
    ...changelogEntries.map((cl) => ({
      id: cl.id,
      title: cl.title,
      date: cl.date,
      tags: cl.tags || [],
    })),
  ];

  for (const log of allLogItems) {
    for (const tag of log.tags) {
      const slug = slugify(tag);
      contentTagSlugs.add(slug);
      const summary = ensureSummary(tag);
      summary.count += 1;
      summary.contentCount += 1;
      summary.logCount += 1;
      ensureArchive(tag).logs.push(log);
    }
  }

  // 3. Career experiences
  if (showAbout) {
    for (const exp of experiences) {
      for (const skill of exp.skills) {
        const summary = ensureSummary(skill);
        summary.count += 1;
        summary.expCount += 1;
        summary.hasExperience = true;
        ensureArchive(skill).experiences.push(exp);
      }
    }
  }

  // 4. Photography photo rolls
  // Photo tags that also appear in Engineering/Career/Blog/Log merge into `tagMap`;
  // photo-exclusive tags go into `photoTagMap`, while `archiveMap` indexes ALL tags.
  const photoTagMap = new Map<string, PhotoOnlyTagEntry>();
  if (showPhotography) {
    for (const photo of pictureLogs) {
      for (const tag of photo.tags) {
        const slug = slugify(tag);
        ensureArchive(tag).photoLogs.push(photo);

        const existing = tagMap.get(slug);
        if (existing) {
          existing.count += 1;
          existing.contentCount += 1;
          existing.photoCount += 1;
        } else {
          let pEntry = photoTagMap.get(slug);
          if (!pEntry) {
            pEntry = { name: tag, slug, count: 0 };
            photoTagMap.set(slug, pEntry);
          }
          pEntry.count += 1;
        }
      }
    }
  }

  // Sort items within each archive descending by date
  for (const data of archiveMap.values()) {
    data.posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
    data.logs.sort((a, b) => b.date.valueOf() - a.date.valueOf());
    data.photoLogs.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
  }

  const sortedTags: TagSummaryEntry[] = Array.from(tagMap.entries())
    .map(([slug, data]) => ({ slug, ...data }))
    .sort((a, b) => {
      const tierA = a.hasExperience ? 1 : a.blogCount > 0 ? 2 : a.logCount > 0 ? 3 : 4;
      const tierB = b.hasExperience ? 1 : b.blogCount > 0 ? 2 : b.logCount > 0 ? 3 : 4;
      if (tierA !== tierB) return tierA - tierB;
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });

  const photoTags: PhotoOnlyTagEntry[] = Array.from(photoTagMap.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  cachedTaxonomy = { sortedTags, photoTags, archiveMap, contentTagSlugs };
  return cachedTaxonomy;
}

const TAG_TEMPLATE_DIGEST = (() => {
  const h = crypto.createHash('sha256');
  for (const p of [
    'src/pages/tags/[tag].astro',
    'src/layouts/BaseLayout.astro',
    'src/components/Footer.astro',
    'src/components/TagList.astro',
    'src/styles/global.css',
    'src/theme.config.ts',
  ]) {
    try {
      h.update(fs.readFileSync(p));
    } catch {
      // ignore if path unavailable
    }
  }
  return h.digest('hex');
})();

/**
 * Computes a deterministic cache key for a tag archive page.
 * Changes only when the articles, logs, photos, experiences, or templates
 * associated with this specific tag change.
 */
export function computeTagCacheKey(slug: string, data: TagArchiveData): string {
  const hash = crypto.createHash('sha256');
  hash.update(TAG_TEMPLATE_DIGEST);
  hash.update(slug);
  hash.update(data.tagName || '');

  for (const post of data.posts || []) {
    hash.update(post.id);
    hash.update(String(post.data?.pubDate?.valueOf() || ''));
    hash.update(String(post.data?.updatedDate?.valueOf() || ''));
    hash.update(post.data?.title || '');
    hash.update(post.data?.description || '');
  }

  for (const log of data.logs || []) {
    hash.update(log.id);
    hash.update(String(log.date?.valueOf() || ''));
    hash.update(log.title || '');
  }

  for (const photo of data.photoLogs || []) {
    hash.update(String(photo.id));
    hash.update(photo.imageKey || '');
    hash.update(photo.title || '');
  }

  for (const exp of data.experiences || []) {
    hash.update(exp.year || exp.period || "");
    hash.update(exp.role || '');
    hash.update(exp.company || '');
  }

  return hash.digest('hex');
}


