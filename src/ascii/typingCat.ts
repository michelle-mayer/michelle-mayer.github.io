import type { Frame, Meta } from 'ascii.rest';

/**
 * Typing cat for the homepage intro, played by ascii.rest's `mount()`.
 * Every frame is exactly `cols` x `rows`; edit the drawing in `draw()`.
 */
export const meta = {
  name: 'typing cat',
  category: 'creatures',
  note: 'a cat seen over its shoulder, tapping hello world on a laptop',
  cols: 64,
  rows: 17,
  fps: 12,
  loop: 8,
  still: 0,
} satisfies Meta;

const message = 'hello world';
const typingStarts = 2;
const secondsPerLetter = 0.24;
const typingEnds = typingStarts + message.length * secondsPerLetter;

interface Pose {
  nearUp: boolean;
  farUp: boolean;
  typed: string;
  cursor: string;
}

function draw({ nearUp, farUp, typed, cursor }: Pose): string {
  const grid = Array.from({ length: meta.rows }, () => Array<string>(meta.cols).fill(' '));
  const put = (row: number, col: number, text: string) => {
    [...text].forEach((char, i) => {
      grid[row][col + i] = char;
    });
  };

  // Laptop screen and three staggered rows of keys
  put(0, 38, '.' + '-'.repeat(24) + '.');
  for (let row = 1; row <= 6; row++) put(row, 38, '|' + ' '.repeat(24) + '|');
  put(7, 38, "'" + '-'.repeat(24) + "'");
  put(3, 45, (typed + cursor).padEnd(12));
  put(8, 37, '/' + ' .'.repeat(12) + '/');
  put(9, 36, '/' + ' .'.repeat(12) + '/');
  put(10, 35, '/' + ' .'.repeat(12) + '/');
  put(11, 34, '/' + '_'.repeat(24) + '/');

  // Head from behind; whiskers fan out slightly (macron up, underscore down)
  put(1, 21, '/\\      /\\');
  put(2, 20, "/  `----'  \\");
  put(3, 19, '/            \\');
  put(4, 18, '|              |');
  put(5, 18, '|              |');
  put(4, 34, '=\u00af');
  put(5, 34, '=_');
  put(6, 19, '\\            /');
  put(7, 20, "`.        .'");

  // Back, rump, haunch, and hind paw tucked forward under the thigh
  put(7, 9, '_..--------');
  put(8, 5, "_.-'");
  put(9, 3, ".'");
  put(10, 2, '/');
  put(11, 1, '|');
  put(12, 1, '|');
  put(13, 2, '\\');
  put(10, 8, '_.--._');
  put(11, 6, ".'      `.");
  put(12, 5, '/          \\');
  put(12, 17, '.--.');
  put(13, 5, '(' + '_'.repeat(11) + '(__)');

  // Tummy curving from the hind paw up to the elbow
  put(12, 21, "_.-'");
  put(11, 25, "_.-'");

  // Tail tucked low along the ground, ending in a rounded tip
  put(14, 3, '\\');
  put(14, 6, '`.');
  put(15, 4, '`.');
  put(15, 8, '`-.' + '_'.repeat(7));
  put(16, 6, '`-.' + '_'.repeat(9) + ')');

  // Far foreleg from the chest; its paw sits just ahead of the near paw
  put(8, 31, ')' + '_'.repeat(11));
  put(farUp ? 7 : 8, 43, '.--.');
  put(farUp ? 8 : 9, 43, '(__)');

  // Near foreleg: shoulder curve into the forearm
  put(8, 24, '`.');
  put(9, 26, '`-.' + '_'.repeat(10));
  put(10, 29, '_'.repeat(9) + (nearUp ? '/' : '_'));
  put(nearUp ? 8 : 9, 39, '.--.');
  put(nearUp ? 9 : 10, 39, '(__)');

  return grid.map((row) => row.join('')).join('\n');
}

export default function typingCat(): Frame {
  return (t) => {
    const phase = t % meta.loop;
    const complete = phase < 1.4 || phase >= typingEnds;
    const letters = complete
      ? message.length
      : Math.max(0, Math.floor((phase - typingStarts) / secondsPerLetter));
    const typing = phase >= typingStarts && phase < typingEnds;
    const keystroke = Math.floor((phase - typingStarts) / secondsPerLetter);
    const pressing = typing && (phase - typingStarts) % secondsPerLetter < secondsPerLetter * 0.6;
    const cursor = typing || Math.floor(phase * 2) % 2 === 0 ? '_' : ' ';
    return draw({
      nearUp: pressing && keystroke % 2 === 0,
      farUp: pressing && keystroke % 2 === 1,
      typed: message.slice(0, letters),
      cursor,
    });
  };
}
