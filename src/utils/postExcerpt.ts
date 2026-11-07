/**
 * Utility to extract clean prose excerpts from a blog post body.
 */

/**
 * Extracts the first prose paragraph(s) from a markdown post body,
 * skipping headings, alerts/blockquotes, code blocks, images, and HTML comments.
 * Strips markdown inline formatting for clean display in card previews.
 */
export function getFirstParagraph(body?: string, minChars = 200): string {
  if (!body) return '';

  // Remove frontmatter if present
  const content = body.replace(/^---[\s\S]*?---\s*/, '');
  const blocks = content.split(/\n\s*\n/);
  const collected: string[] = [];
  let charCount = 0;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Skip non-prose blocks
    if (
      trimmed.startsWith('#') ||
      trimmed.startsWith('>') ||
      trimmed.startsWith('```') ||
      trimmed.startsWith('![') ||
      trimmed.startsWith('<!--') ||
      trimmed.startsWith('---') ||
      trimmed.startsWith('***')
    ) {
      continue;
    }

    // Strip inline markdown and HTML tags (e.g. <abbr>)
    const clean = trimmed
      .replace(/<abbr[^>]*>(.*?)<\/abbr>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean) {
      collected.push(clean);
      charCount += clean.length;
      if (charCount >= minChars) {
        break;
      }
    }
  }

  return collected.join(' ');
}
