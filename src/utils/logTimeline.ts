import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {
  pictureLogs,
  comparePhotoPathsByDateDesc,
  type PictureLog,
} from './pictureLogs';
import { getChangelogEntries, type ChangelogEntry } from './changelog';
import { loadPhotoImage } from './photoImages';
import { LOG_PAGE_SIZE, GALLERY_PAGE_SIZE, getPaginatedHref } from './pagination';
import { isFeatureEnabled } from './features';

export interface NoteTimelineItem {
  kind: 'note';
  isChangelog: false;
  id: string;
  date: Date;
  entry: CollectionEntry<'log'>;
  Content: Awaited<ReturnType<typeof render>>['Content'];
}

export interface PhotoTimelineItem {
  kind: 'photo';
  id: string;
  date: Date;
  photo: PictureLog;
  imageMetadata: ImageMetadata | null;
}

export type TimelineItem = NoteTimelineItem | ChangelogEntry | PhotoTimelineItem;

export type LogFilterKind = 'all' | 'note' | 'changelog' | 'photo';

export interface LogDataBundle {
  timeline: TimelineItem[];
  noteEntries: NoteTimelineItem[];
  changelogEntries: ChangelogEntry[];
  photoEntries: PhotoTimelineItem[];
  anchorToPage: Record<string, number>;
}

let cachedLogBundlePromise: Promise<LogDataBundle> | null = null;

export function getLogDataBundle(): Promise<LogDataBundle> {
  if (!cachedLogBundlePromise) {
    cachedLogBundlePromise = (async () => {
      const rawEntries = await getCollection('log');
      const noteEntries: NoteTimelineItem[] = await Promise.all(
        rawEntries.map(async (entry) => {
          const { Content } = await render(entry);
          const id = entry.id.replace(/\.[^/.]+$/, '');
          return {
            kind: 'note' as const,
            isChangelog: false as const,
            id,
            date: entry.data.date,
            entry,
            Content,
          };
        }),
      );

      const changelogEntries = await getChangelogEntries();

      const photoEntries: PhotoTimelineItem[] = isFeatureEnabled('photography')
        ? await Promise.all(
            pictureLogs.map(async (photo) => {
              const imageMetadata = await loadPhotoImage(photo.imageKey);
              return {
                kind: 'photo' as const,
                id: `photo-${photo.id}`,
                date: photo.pubDate,
                photo,
                imageMetadata,
              };
            }),
          )
        : [];

      const timeline: TimelineItem[] = [
        ...noteEntries,
        ...changelogEntries,
        ...photoEntries,
      ].sort((a, b) => b.date.valueOf() - a.date.valueOf());

      const anchorToPage: Record<string, number> = {};
      timeline.forEach((item, idx) => {
        const page = Math.floor(idx / LOG_PAGE_SIZE) + 1;
        anchorToPage[item.id] = page;
      });

      return {
        timeline,
        noteEntries: [...noteEntries].sort((a, b) => b.date.valueOf() - a.date.valueOf()),
        changelogEntries: [...changelogEntries].sort((a, b) => b.date.valueOf() - a.date.valueOf()),
        photoEntries: [...photoEntries].sort((a, b) => b.date.valueOf() - a.date.valueOf()),
        anchorToPage,
      };
    })();
  }
  return cachedLogBundlePromise;
}

/**
 * Lightweight build-time lookup returning the exact static paginated `/log/`
 * route + `#anchor` for any log entry, changelog, or photo roll.
 */
let cachedAnchorToPagePromise: Promise<Record<string, number>> | null = null;

export function getLogAnchorPageMap(): Promise<Record<string, number>> {
  if (!cachedAnchorToPagePromise) {
    cachedAnchorToPagePromise = (async () => {
      const rawEntries = await getCollection('log');
      const changelogEntries = await getChangelogEntries();

      const lightweightItems: { id: string; date: Date }[] = [
        ...rawEntries.map((e) => ({
          id: e.id.replace(/\.[^/.]+$/, ''),
          date: e.data.date,
        })),
        ...changelogEntries.map((c) => ({
          id: c.id,
          date: c.date,
        })),
        ...(isFeatureEnabled('photography')
          ? pictureLogs.map((p) => ({
              id: `photo-${p.id}`,
              date: p.pubDate,
            }))
          : []),
      ].sort((a, b) => b.date.valueOf() - a.date.valueOf());

      const map: Record<string, number> = {};
      lightweightItems.forEach((item, idx) => {
        map[item.id] = Math.floor(idx / LOG_PAGE_SIZE) + 1;
      });
      return map;
    })();
  }
  return cachedAnchorToPagePromise;
}

export async function getLogEntryHref(anchorId: string): Promise<string> {
  const map = await getLogAnchorPageMap();
  const page = map[anchorId] ?? 1;
  return getPaginatedHref('/log', page, `#${anchorId}`);
}

/**
 * Returns the static paginated `/photography/` URL for a given photo ID
 * based on default descending publication date sort order.
 */
const sortedPhotoIdsDesc = [...pictureLogs]
  .sort((a, b) => comparePhotoPathsByDateDesc(a.filename, b.filename))
  .map((p) => p.id);

const photoIdToGalleryPage = new Map<number, number>();
sortedPhotoIdsDesc.forEach((id, idx) => {
  photoIdToGalleryPage.set(id, Math.floor(idx / GALLERY_PAGE_SIZE) + 1);
});

export function getGalleryPhotoHref(photoId: number): string {
  const page = photoIdToGalleryPage.get(photoId) ?? 1;
  const base = getPaginatedHref('/photography', page);
  return `${base}?photo=${photoId}`;
}

const LOG_TEMPLATE_DIGEST = (() => {
  const h = crypto.createHash('sha256');
  for (const p of [
    'src/components/pages/LogIndexView.astro',
    'src/layouts/BaseLayout.astro',
    'src/components/Footer.astro',
    'src/components/TagList.astro',
    'src/styles/global.css',
    'src/theme.config.ts',
    'src/data/techTerms.ts',
    'src/plugins/rehype-tech-tooltips.mjs',
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
 * Computes a deterministic cache key for a paginated log sub-stream route.
 * Changes only when the entries displayed on this specific page (or total count or templates) change.
 */
export function computeLogPageCacheKey(
  filter: LogFilterKind,
  currentPage: number,
  allItems: TimelineItem[]
): string {
  const hash = crypto.createHash('sha256');
  hash.update(LOG_TEMPLATE_DIGEST);
  hash.update(filter);
  hash.update(String(currentPage));
  hash.update(String(allItems.length));
  const startIndex = (currentPage - 1) * LOG_PAGE_SIZE;
  const pageItems = allItems.slice(startIndex, startIndex + LOG_PAGE_SIZE);
  for (const item of pageItems) {
    hash.update(item.id);
    hash.update(String(item.date?.valueOf() || ''));
    if (item.kind === 'note') {
      hash.update(item.entry.data.title || '');
      hash.update(item.entry.body || '');
    } else if (item.kind === 'changelog') {
      hash.update(item.title || '');
      hash.update(item.rawMarkdown || '');
    } else if (item.kind === 'photo') {
      hash.update(item.photo.title || '');
      hash.update(item.photo.imageKey || '');
    }
  }
  return hash.digest('hex');
}

