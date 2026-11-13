import type { Frame, Meta } from 'ascii.rest';
import typewriter, { meta as typewriterMeta } from 'ascii.rest/pieces/typewriter';

/**
 * Homepage tagline: ascii.rest's typewriter (human pace, the odd fixed typo, held backspace),
 * played 30% faster and trimmed from its centered 44x3 frame to one left-aligned line.
 */
const maxLength = typewriterMeta.cols - 4;
const SPEED = 1.3;

export const meta = {
  name: 'tagline',
  category: 'type',
  note: 'phrases typed and deleted in turn behind a blinking cursor',
  cols: maxLength + 1,
  rows: 1,
  fps: 26,
  options: { phrases: [] as string[] },
} satisfies Meta<{ phrases: string[] }>;

export default function tagline({ phrases = meta.options.phrases }: Partial<{ phrases: string[] }> = {}): Frame {
  const list = phrases.map((phrase) => phrase.slice(0, maxLength));
  // Same width and offset the typewriter uses to center its line, so the slice starts at the text.
  const width = Math.max(0, ...list.map((phrase) => phrase.length)) + 1;
  const left = Math.max(0, Math.floor((typewriterMeta.cols - width) / 2));
  const frame = typewriter({ prefix: '', phrases: list });
  return (t) => frame(t * SPEED).split('\n')[1].slice(left, left + width);
}
