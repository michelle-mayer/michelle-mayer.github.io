import { getCollection, type CollectionEntry } from 'astro:content';
import { formatSiteDate } from './dates';

export interface PictureLog {
  id: number;
  filename: string;
  imageKey: string;
  title: string;
  pubDate: Date;
  dateFormatted: string;
  category: string;
  location: string;
  attribution?: string;
  story: string;
  tags: string[];
}

export function toPictureLog(entry: CollectionEntry<'photography'>): PictureLog {
  const d = entry.data;
  return {
    id: d.id,
    filename: d.filename,
    imageKey: `/src/images/photography/${d.filename}`,
    title: d.title,
    pubDate: d.pubDate,
    dateFormatted: d.dateFormatted || formatSiteDate(d.pubDate),
    category: d.category,
    location: d.location,
    attribution: d.attribution,
    story: entry.body?.trim() || '',
    tags: d.tags,
  };
}

// Top-level await supported across Astro modules
const rawPhotoLogs = await getCollection('photography');

export const pictureLogs: PictureLog[] = rawPhotoLogs
  .map(toPictureLog)
  .sort((a, b) => a.id - b.id);

export const pictureLogsMap = new Map<string, PictureLog>(
  pictureLogs.map((p) => [p.filename, p])
);

export const pictureLogsById = new Map<number, PictureLog>(
  pictureLogs.map((p) => [p.id, p])
);

export async function getPictureLogs(): Promise<PictureLog[]> {
  return pictureLogs;
}

/**
 * Comparator sorting image glob paths descending by `pubDate` (newest first),
 * with reverse numeric filename tie-breaking for photos captured on the same day.
 */
export function comparePhotoPathsByDateDesc(pathA: string, pathB: string): number {
  const filenameA = pathA.split('/').pop() ?? '';
  const filenameB = pathB.split('/').pop() ?? '';
  const photoA = pictureLogsMap.get(filenameA);
  const photoB = pictureLogsMap.get(filenameB);

  const timeA = photoA?.pubDate ? new Date(photoA.pubDate).valueOf() : 0;
  const timeB = photoB?.pubDate ? new Date(photoB.pubDate).valueOf() : 0;

  if (timeB !== timeA) {
    return timeB - timeA;
  }

  const numA = parseInt(filenameA.match(/(\d+)\.\w+$/)?.[1] ?? '0', 10);
  const numB = parseInt(filenameB.match(/(\d+)\.\w+$/)?.[1] ?? '0', 10);
  return numB - numA;
}
