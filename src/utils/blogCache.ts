import crypto from 'node:crypto';
import fs from 'node:fs';
import type { CollectionEntry } from 'astro:content';

const BLOG_TEMPLATE_DIGEST = (() => {
  const h = crypto.createHash('sha256');
  for (const p of [
    'src/layouts/BlogPost.astro',
    'src/layouts/BaseLayout.astro',
    'src/components/Footer.astro',
    'src/theme.config.ts',
    'src/data/techTerms.ts',
    'src/plugins/rehype-tech-tooltips.mjs',
    'src/components/SectionNav.astro',
    'src/scripts/section-nav.ts',
    'src/scripts/tech-tooltips.ts',
    'src/scripts/mermaid-zoom.ts',
    'src/styles/global.css',
    'src/plugins/remark-alerts.mjs',
    'src/plugins/rehype-mermaid-a11y.mjs',
    'src/components/scripts/TechTooltipsScript.astro',
    'src/components/scripts/MermaidZoomScript.astro',
    'src/components/scripts/YouTubeEmbedScript.astro',
  ]) {
    try {
      h.update(fs.readFileSync(p));
    } catch {
      // ignore if path unavailable
    }
  }
  return h.digest('hex');
})();

export type AdjacentPost = {
  id: string;
  title: string;
  description: string;
} | null;

/**
 * Computes a deterministic cache key for an individual blog post route.
 * Changes when the post body, metadata, adjacent navigation cards, or layout templates change.
 */
export function computeBlogCacheKey(
  post: CollectionEntry<'blog'>,
  nextPost: AdjacentPost,
  prevPost: AdjacentPost
): string {
  const hash = crypto.createHash('sha256');
  hash.update(BLOG_TEMPLATE_DIGEST);
  hash.update(post.id);
  hash.update(post.body || '');
  hash.update(post.data.title || '');
  hash.update(post.data.description || '');
  hash.update(String(post.data.pubDate?.valueOf() || ''));
  hash.update(String(post.data.updatedDate?.valueOf() || ''));
  hash.update((post.data.tags || []).join(','));
  hash.update(post.data.heroImage ? JSON.stringify(post.data.heroImage) : '');
  hash.update(
    JSON.stringify([
      post.data.showSections ?? null,
      post.data.sectionNav ?? null,
      post.data.sectionDepth ?? null,
      post.data.sections ?? null,
    ])
  );
  hash.update(nextPost ? `${nextPost.id}:${nextPost.title}` : 'none');
  hash.update(prevPost ? `${prevPost.id}:${prevPost.title}` : 'none');
  return hash.digest('hex');
}

