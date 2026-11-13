/*
 * Adapted from the `coffee` piece in ascii.rest (https://ascii.rest), under its license:
 *
 * MIT License
 *
 * Copyright (c) 2026 bas3line (https://github.com/bas3line)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import type { Env, Frame, Meta } from 'ascii.rest';

/**
 * Contact page latte: ascii.rest's shaded coffee cup and curling steam, without the saucer and
 * seen from higher up so the foam shows a poured heart, with two wisps rising from the foam in
 * front of the far rim. `env.paper` (dark ink on a light page) flips the shading for the theme.
 */
export const meta = {
  name: 'latte',
  category: 'objects',
  note: 'steam curling up from a latte with a heart poured in its foam',
  cols: 33,
  rows: 17,
  fps: 15,
  loop: 6,
  still: 0,
} satisfies Meta;

type Vec = [number, number, number];
/** Where a wisp leaves the latte (x, and z: negative is the far side), its height in rows, phase and lean. */
type Wisp = [x: number, z: number, length: number, phase: number, lean: number, inFront?: boolean];

const RAMP = ' .:-=+*#%@';
const TILT = 0.6; // how steeply we look down at the cup
const H = 7.6; // the cup's height, in rows
const RT = 6.2; // its radius at the rim
const HC = H - 0.55; // the latte's level
const PERIOD = 6; // seconds before the steam repeats
// Three wisps rise from behind the far rim; the two in front leave the foam and are drawn over the cup.
const WISPS: Wisp[] = [
  [-2.6, -3.2, 10, 0, -0.1],
  [0.2, -3.8, 12, 2.2, 0.04],
  [2.8, -3.1, 9, 4.1, 0.12],
  [0.4, -1.1, 13, 1.1, 0.03, true],
  [-1.8, -0.2, 11, 3.4, -0.06, true],
];

const cupR = (h: number) => RT * (0.62 + 0.38 * Math.sin((Math.PI / 2) * Math.min(1, Math.max(0, h) / H)));
const smooth = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const norm = (x: number, y: number, z: number): Vec => {
  const m = Math.hypot(x, y, z);
  return [x / m, y / m, z / m];
};
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// The heart curve (x² + y² − 1)³ − x²y³ ≤ 0 laid on the foam, its point toward us.
const inHeart = (x: number, z: number) => {
  const u = x / 3.1;
  const v = (-z - 0.9) / 3.1 + 0.15;
  const q = u * u + v * v - 1;
  return q * q * q - u * u * v * v * v <= 0;
};

export default function latte(): Frame {
  const { cols, rows } = meta;
  const SX = 2, SY = 4; // looks per cell, across and down
  const W = cols * SX, HH = rows * SY, N = cols * rows;
  const depth = new Float32Array(W * HH).fill(-1e9);
  const lum = new Float32Array(W * HH).fill(-1);
  const part = new Uint8Array(W * HH); // 2 cup, 3 lip, 4 latte
  const cs = Math.sqrt(1 - TILT * TILT), sn = TILT;
  const CX = cols / 2 - 3, BASE = rows - 1.2; // the cup's centre, a little left so the handle fits
  const L = norm(-0.62, 0.62, 0.48);
  const toCell = (x: number, y: number, z: number): [number, number] => [CX + 2 * x, BASE - (y * cs - z * sn)];
  let id = 2;
  const plot = (x: number, y: number, z: number, n: Vec, albedo: number, extra = 0) => {
    const [c, r] = toCell(x, y, z);
    const px = Math.floor(c * SX), py = Math.floor(r * SY);
    if (px < 0 || px >= W || py < 0 || py >= HH) return;
    const k = py * W + px, d = z * cs + y * sn;
    if (d <= depth[k]) return;
    depth[k] = d;
    part[k] = id;
    lum[k] = albedo * (0.1 + 0.9 * Math.max(0, dot(n, L))) + extra;
  };
  // A glaze's glint, where the light bounces toward us.
  const HV = norm(L[0], L[1] + sn, L[2] + cs);
  const glint = (n: Vec, p: number) => Math.max(0, dot(n, HV)) ** p;

  // The cup, outside and in.
  for (let h = 0; h <= H; h += 0.05) {
    const r = cupR(h), dr = (cupR(h + 0.05) - cupR(h - 0.05)) / 0.1;
    for (let a = 0; a < 2 * Math.PI; a += 0.1 / r) {
      const ca = Math.cos(a), sa = Math.sin(a);
      if (sa > -0.3) {
        const n = norm(ca, -dr, sa);
        plot(r * ca, h, r * sa, n, 0.95, 0.35 * glint(n, 10));
      }
      if (h > HC && sa < 0.3) plot((r - 0.4) * ca, h, (r - 0.4) * sa, norm(-ca, dr, -sa), 0.75);
    }
  }
  // The lip, lit as one rounded edge facing out and up: bright on the left, falling off to the right.
  id = 3;
  const R = cupR(H);
  for (let v = 0; v <= Math.PI; v += 0.12)
    for (let a = 0; a < 2 * Math.PI; a += 0.06 / R) {
      const p = R - 0.2 - 0.2 * Math.cos(v), y = H + 0.12 * Math.sin(v), ca = Math.cos(a), sa = Math.sin(a);
      plot(p * ca, y, p * sa, norm(0.6 * ca, 0.8, 0.6 * sa), 0.95, 0.12);
    }
  // The latte: caramel crema, darker at the wall, with a heart of milk foam and a thin pour line.
  id = 4;
  const RC = cupR(HC) - 0.4;
  for (let p = 0; p < RC; p += 0.08)
    for (let a = 0; a < 2 * Math.PI; a += 0.08 / Math.max(p, 0.5)) {
      const x = p * Math.cos(a), z = p * Math.sin(a);
      const milk = inHeart(x, z) || (Math.abs(x) < 0.22 && z > 1.9);
      plot(x, HC, z, [0, 1, 0], milk ? 0.98 : 0.34 - 0.18 * smooth(0.75 * RC, RC, p));
    }

  // Down to cells: the lip wins any cell it is in, so it reads as one line; elsewhere
  // the mean light where most looks land, and a soft edge where a few do.
  const still: Array<number | string | null> = [];
  const covered: boolean[] = [];
  for (let k = 0; k < N; k++) {
    const c = k % cols, r = Math.floor(k / cols);
    let n = 0, sum = 0, low = 0, lip = 0, lipSum = 0;
    for (let j = 0; j < SY; j++)
      for (let i = 0; i < SX; i++) {
        const q = (r * SY + j) * W + c * SX + i, v = lum[q];
        if (v < 0) continue;
        n++;
        sum += v;
        if (j >= SY / 2) low++;
        if (part[q] === 3) {
          lip++;
          lipSum += v;
        }
      }
    covered.push(n > 0);
    still.push(lip >= 2 ? Math.min(1, lipSum / lip) : n === 0 ? null : n < 3 ? (low * 2 > n ? '_' : "'") : Math.min(1, sum / n));
  }

  // The handle, a cell thick: each cell near its line lit by the tube's own normal there, its loop left open.
  const HY = 4.1, AX = 4.5, AY = 3.0, TUBE = 0.48, X0 = cupR(HY) - 1.3;
  const ring: Array<[number, number]> = [];
  for (let u = -2.1; u <= 2.1; u += 0.02) ring.push([X0 + AX * Math.cos(u), HY + AY * Math.sin(u)]);
  for (let k = 0; k < N; k++) {
    const c = k % cols, r = Math.floor(k / cols);
    const x = (c + 0.5 - CX) / 2, y = (BASE - (r + 0.5)) / cs;
    if (x < cupR(y) - 0.1 || x > X0 + AX + 1) continue;
    let best = 9, ox = 0, oy = 0;
    for (const [lx, ly] of ring) {
      const d = Math.hypot(x - lx, y - ly);
      if (d < best) {
        best = d;
        ox = (x - lx) / TUBE;
        oy = (y - ly) / TUBE;
      }
    }
    if (best < TUBE + 0.12) {
      const n = norm(ox, oy, Math.sqrt(Math.max(0.05, 1 - ox * ox - oy * oy)));
      still[k] = Math.min(1, 0.1 + 0.85 * Math.max(0, dot(n, L)) + 0.3 * glint(n, 10));
      continue;
    }
    const inside = (x - X0) ** 2 / AX ** 2 + (y - HY) ** 2 / AY ** 2 < 1;
    if (inside && !covered[k]) still[k] = null;
  }

  const top = Math.floor(toCell(0, HC, 0)[1]);
  // Where a wisp is at height s rows: a bend that rides up it and grows as it climbs.
  // The wisps in front sway from the start, so they read as steam rather than a line in the foam.
  const W0 = WISPS.map(([x, z]) => toCell(x, HC, z));
  const colAt = (i: number, s: number, t: number) => {
    const [, , len, ph, lean, inFront] = WISPS[i];
    const f = s / len, w = (2 * Math.PI * t) / PERIOD;
    const sway = (inFront ? 0.55 : 0.2) + 1.7 * f ** 1.5;
    return W0[i][0] + 2 * (lean * s + sway * Math.sin(0.75 * s - 2 * w + ph) + 0.3 * f * Math.sin(w + ph));
  };
  const free = (k: number, r: number) => {
    const v = still[k];
    return v === null || (r >= top && typeof v === 'number' && v < 0.3);
  };

  return (t: number, env: Env = {}) => {
    const paper = env.paper ?? false;
    const out = still.map((v) =>
      v === null ? ' ' : typeof v === 'string' ? v : RAMP[Math.max(1, Math.round((paper ? 1 - v : v) * (RAMP.length - 1)))],
    );
    WISPS.forEach(([, , len, ph, , inFront], i) => {
      for (let r = Math.floor(W0[i][1] - 0.5); r >= 0; r--) {
        const s = W0[i][1] - (r + 0.5);
        if (s > len) break;
        const c = colAt(i, s, t), cc = Math.floor(c), k = r * cols + cc;
        if (cc < 0 || cc >= cols || (!inFront && !free(k, r))) continue;
        // Faint off the surface and at the top, with breaks that rise with it.
        const thin = 0.5 + 0.5 * Math.sin(0.55 * s - (2 * Math.PI * t) / PERIOD + ph * 2);
        const a = smooth(0.3, 1.8, s) * (1 - smooth(0.6 * len, len, s)) * (0.3 + 0.7 * thin);
        if (a < 0.2) continue;
        const up = colAt(i, s + 1, t), dn = colAt(i, s - 1, t);
        const lean = (up - dn) / 2, bow = c - (up + dn) / 2;
        out[k] = a < 0.32 ? '.' : Math.abs(lean) > 0.7 ? (lean > 0 ? '/' : '\\') : bow > 0.15 ? ')' : bow < -0.15 ? '(' : '|';
        // Where it swings across faster than it climbs, it curls over: a run along the row.
        const run = Math.round(up - c), n = Math.abs(run), dir = Math.sign(run);
        if (a < 0.32 || n < 2) continue;
        out[k] = '_';
        for (let j = 1; j < n; j++)
          if (cc + dir * j >= 0 && cc + dir * j < cols && free(k + dir * j, r))
            out[k + dir * j] = j < n - 1 ? '_' : dir > 0 ? '/' : '\\';
      }
    });
    const lines: string[] = [];
    for (let r = 0; r < rows; r++) lines.push(out.slice(r * cols, (r + 1) * cols).join(''));
    return lines.join('\n');
  };
}
