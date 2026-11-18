import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SKIP, visit } from 'unist-util-visit';

const GRAPHICS_DIR = path.resolve('src/images/graphics');

const listGraphics = () =>
  fs.existsSync(GRAPHICS_DIR) ? fs.readdirSync(GRAPHICS_DIR).filter((name) => /\.svg$/i.test(name)).sort() : [];

/**
 * Deterministic digest of every graphic. Passed as a serializable plugin option in
 * `astro.config.mjs` so Astro's Content Layer (`data-store.json`) and incremental build cache
 * invalidate whenever a graphic changes, even though the post's Markdown did not.
 */
export const INLINE_SVG_DIGEST = (() => {
  const hash = crypto.createHash('sha256');
  for (const name of listGraphics()) {
    hash.update(name);
    hash.update(fs.readFileSync(path.join(GRAPHICS_DIR, name)));
  }
  return hash.digest('hex').slice(0, 16);
})();

const escapeHtml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * Inlines a graphic from `src/images/graphics/` that stands alone in a paragraph, e.g.
 * `![What the graphic shows](../../images/graphics/chart.svg "Optional caption")`.
 * Inline SVG (unlike an <img>) can follow the site's class-based dark mode through its own
 * <style>. The alt text becomes the graphic's accessible name; the title becomes a caption.
 */
export function remarkInlineSvg() {
  return (tree, file) => {
    if (!file.path) return;

    visit(tree, 'paragraph', (node, index, parent) => {
      const image = node.children.length === 1 ? node.children[0] : undefined;
      if (image?.type !== 'image' || !parent || index === undefined) return;

      const svgPath = path.resolve(path.dirname(file.path), decodeURI(image.url));
      const relative = path.relative(GRAPHICS_DIR, svgPath);
      if (!/\.svg$/i.test(svgPath) || relative.startsWith('..') || path.isAbsolute(relative) || relative.includes(path.sep)) {
        return;
      }
      if (!fs.existsSync(svgPath)) {
        throw new Error(`remark-inline-svg: "${image.url}" in ${file.path} does not exist.`);
      }

      const label = image.alt ? `role="img" aria-label="${escapeHtml(image.alt)}"` : 'aria-hidden="true"';
      const svg = fs
        .readFileSync(svgPath, 'utf8')
        .replace(/^[\s\S]*?(?=<svg\b)/, '')
        .replace(/<svg\b/, `<svg ${label}`)
        .trim();
      const caption = image.title ? `<figcaption>${escapeHtml(image.title)}</figcaption>` : '';

      parent.children[index] = {
        type: 'html',
        value: `<figure class="svg-figure"><div class="svg-figure-scroll">${svg}</div>${caption}</figure>`,
      };
      return SKIP;
    });
  };
}
