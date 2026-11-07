import { themeConfig } from '../theme.config';

export const OLDER_BLOGS_COUNT = themeConfig.pagination.olderBlogsCount;
export const LOG_COUNT = themeConfig.pagination.logCount;
export const GALLERY_COUNT = themeConfig.pagination.galleryCount;

export const OLDER_BLOGS_PAGE_SIZE = OLDER_BLOGS_COUNT;
export const LOG_PAGE_SIZE = LOG_COUNT;
export const GALLERY_PAGE_SIZE = GALLERY_COUNT;

export function getPageTokens(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

export function getPaginatedHref(basePath: string, page: number, hash = ''): string {
  const cleanBase = basePath.replace(/\/+$/, '');
  if (page <= 1) {
    return `${cleanBase}/${hash}`;
  }
  return `${cleanBase}/page/${page}/${hash}`;
}

