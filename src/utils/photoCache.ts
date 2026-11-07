import crypto from 'node:crypto';
import fs from 'node:fs';
import type { PictureLog } from './pictureLogs';

const PHOTO_TEMPLATE_DIGEST = (() => {
  const h = crypto.createHash('sha256');
  for (const p of [
    'src/pages/photography/[id].astro',
    'src/layouts/BaseLayout.astro',
    'src/components/Footer.astro',
    'src/components/SectionNav.astro',
    'src/scripts/section-nav.ts',
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

export type AdjacentPhoto = {
  id: number;
  title: string;
  dateFormatted: string;
} | null;

/**
 * Computes a deterministic cache key for a static photograph permalink route (/photography/[id]/).
 * Changes when the photograph metadata, narrative story, adjacent links, or layout templates change.
 */
export function computePhotoCacheKey(
  photo: PictureLog,
  prevPhoto: AdjacentPhoto,
  nextPhoto: AdjacentPhoto
): string {
  const hash = crypto.createHash('sha256');
  hash.update(PHOTO_TEMPLATE_DIGEST);
  hash.update(String(photo.id));
  hash.update(photo.filename);
  hash.update(photo.title);
  hash.update(String(photo.pubDate.valueOf()));
  hash.update(photo.category);
  hash.update(photo.location);
  hash.update(photo.story || '');
  hash.update((photo.tags || []).join(','));
  hash.update(prevPhoto ? `${prevPhoto.id}:${prevPhoto.title}` : 'none');
  hash.update(nextPhoto ? `${nextPhoto.id}:${nextPhoto.title}` : 'none');
  return hash.digest('hex');
}

