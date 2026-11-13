import type { Frame, Meta } from 'ascii.rest';
import notFound, { meta as notFoundMeta } from 'ascii.rest/pieces/not-found';

/**
 * 404 page art: ascii.rest's block-letter 404 with a small ghost drifting beneath it.
 * The page has its own heading, so the piece's caption is left blank and the 60x21
 * frame is cropped to the drawing: the digits, their shadow, and the ghost's path.
 */
const top = 1;
const left = 7;

export const meta = {
  name: 'not found ghost',
  category: 'ui',
  note: notFoundMeta.note,
  cols: 45,
  rows: 16,
  fps: notFoundMeta.fps,
  loop: 9,
  still: 0,
} satisfies Meta;

export default function notFoundGhost(): Frame {
  const frame = notFound({ code: '404', title: '', message: '' });
  return (t) =>
    frame(t)
      .split('\n')
      .slice(top, top + meta.rows)
      .map((line) => line.slice(left, left + meta.cols))
      .join('\n');
}
