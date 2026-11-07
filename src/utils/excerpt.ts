/**
 * Strips Markdown formatting and produces a clean plain-text excerpt truncated to maxLength characters at a word boundary.
 */
export function getExcerpt(text: string | undefined, maxLength = 160): string {
  if (!text) return '';
  const clean = text
    .replace(/^---[\s\S]*?---/, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`#*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length <= maxLength) return clean;

  const truncated = clean.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

