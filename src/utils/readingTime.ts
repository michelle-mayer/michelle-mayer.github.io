/**
 * Estimates reading time for markdown and text content.
 * Standard technical reading speed: 200 words per minute.
 */
export function getReadingTimeMinutes(content: string | undefined): number {
  if (!content) return 1;

  // 1. Remove frontmatter if present
  let text = content.replace(/^---[\s\S]*?---/, '');

  // 2. Normalize code blocks: code requires careful reading,
  // so we approximate 1 code line to ~2 words of reading effort
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    const lines = match.split('\n').length;
    return ' code '.repeat(Math.max(1, Math.round(lines * 2)));
  });

  // 3. Strip HTML tags
  text = text.replace(/<[^>]*>/g, ' ');

  // 4. Strip markdown image tags ![alt](url) and convert links [text](url) -> text
  text = text.replace(/!\[.*?\]\(.*?\)/g, ' ');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');

  // 5. Strip markdown formatting characters (#, *, _, ~, `, >, -)
  text = text.replace(/[#*_~`>\-]+/g, ' ');

  // 6. Count remaining words
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getReadingTime(content: string | undefined): string {
  const minutes = getReadingTimeMinutes(content);
  return `${minutes} min read`;
}

