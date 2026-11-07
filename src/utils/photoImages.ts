/**
 * Shared photography image registry (`photoImages.ts`)
 *
 * Single `import.meta.glob` over `src/images/photography/` used by the gallery,
 * photo permalinks, homepage carousel, Picture Log stream, and tag archives.
 * Keys are absolute Vite paths (`/src/images/photography/<filename>`), matching
 * `PictureLog.imageKey`.
 */
import type { ImageMetadata } from 'astro';

export const PHOTO_DIR_KEY = '/src/images/photography/';

export const photoImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/images/photography/*.{jpg,jpeg,png,webp}',
);

/** All photo image keys (`/src/images/photography/<filename>`), unsorted. */
export const photoImageKeys: string[] = Object.keys(photoImageModules);

/** Total number of photographs on disk. */
export const photoCount = photoImageKeys.length;

/** Builds the glob key for a photo filename (accepts an existing key unchanged). */
export function toPhotoKey(filenameOrKey: string): string {
  return filenameOrKey.startsWith(PHOTO_DIR_KEY) ? filenameOrKey : `${PHOTO_DIR_KEY}${filenameOrKey}`;
}

/** Lazily resolves a photo's `ImageMetadata` by filename or glob key, or `null` if missing. */
export async function loadPhotoImage(filenameOrKey: string): Promise<ImageMetadata | null> {
  const importer = photoImageModules[toPhotoKey(filenameOrKey)];
  return importer ? (await importer()).default : null;
}

