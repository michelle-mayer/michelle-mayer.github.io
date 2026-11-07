import type { ImageMetadata } from 'astro';
import fallbackAuthorImage from '../images/author.jpg';
import { themeConfig } from '../theme.config';

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/images/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

function resolveAuthorImage(filenameOrPath?: string): ImageMetadata {
  if (!filenameOrPath) return fallbackAuthorImage;
  const cleanName = filenameOrPath.replace(/^\/?src\/images\//, '').replace(/^\.\//, '');
  const key = `/src/images/${cleanName}`;
  return imageModules[key]?.default ?? fallbackAuthorImage;
}

/** Resolved `ImageMetadata` for the author avatar chip (`AuthorChip.astro`, `BlogPost.astro`, `Head.astro`) */
export const authorAvatarImage: ImageMetadata = resolveAuthorImage(themeConfig.author.avatar);

/** Resolved `ImageMetadata` for the `/about/` portrait (`about.astro`, falls back to `author.avatar`) */
export const authorAboutImage: ImageMetadata = resolveAuthorImage(
  themeConfig.author.aboutImage || themeConfig.author.avatar
);

