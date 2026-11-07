import { visit } from 'unist-util-visit';
import { ensureYouTubeThumbnail } from '../utils/youtube-thumbnail.mjs';

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_URL_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/;

/**
 * Resolve a bare 11-character video ID or any common YouTube URL to a video ID.
 * @param {string} input
 * @returns {string | null}
 */
export function parseYouTubeId(input) {
  const value = input.trim();
  if (YOUTUBE_ID_RE.test(value)) return value;
  const match = value.match(YOUTUBE_URL_RE);
  return match ? match[1] : null;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PLAY_ICON =
  '<svg viewBox="0 0 68 48" class="youtube-embed-icon" aria-hidden="true" focusable="false">' +
  '<path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24S67.94 13.05 66.52 7.74z" class="youtube-embed-icon-bg"/>' +
  '<path d="M45 24 27 14v20" fill="#fff"/></svg>';

/**
 * Remark plugin that turns a fenced `youtube` code block into a lightweight,
 * click-to-load YouTube facade (thumbnail + play button, no iframe or Google
 * scripts until the visitor presses play).
 *
 * Markdown usage:
 *
 *     ```youtube
 *     dQw4w9WgXcQ
 *     Optional video title shown to screen readers and as the caption
 *     ```
 *
 * The first line may be an 11-character video ID or any YouTube URL.
 *
 * The thumbnail is downloaded at build time into `.cache/youtube-thumbs/` and
 * served from `/yt-thumbs/`; if the download fails the build continues with a
 * remote thumbnail URL (soft fail).
 */
export function remarkYouTube() {
  return async (tree) => {
    /** @type {Array<{ node: any, index: number, parent: any }>} */
    const matches = [];
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'youtube' && parent && index !== undefined) {
        matches.push({ node, index, parent });
      }
    });

    let videoIndex = 0;
    for (const { node, index, parent } of matches) {
      videoIndex += 1;
      const figureId = videoIndex === 1 ? 'video' : `video-${videoIndex}`;

      const [rawSource = '', ...titleLines] = node.value.split(/\r?\n/);
      const videoId = parseYouTubeId(rawSource);
      if (!videoId) {
        throw new Error(
          `remark-youtube: invalid YouTube video ID or URL "${rawSource.trim()}". ` +
            'Put an 11-character ID or a YouTube URL on the first line of the ```youtube block.'
        );
      }

      const title = titleLines.join(' ').trim() || 'YouTube video';
      const safeTitle = escapeHtml(title);
      // Downloads at build time; soft-fails to the remote URL (never throws).
      const thumb = await ensureYouTubeThumbnail(videoId);

      parent.children[index] = {
        type: 'html',
        value:
          `<figure id="${figureId}" class="youtube-embed not-prose scroll-mt-28" data-video-id="${videoId}" data-title="${safeTitle}">` +
          `<button type="button" class="youtube-embed-btn" aria-label="Play video: ${safeTitle}">` +
          `<img src="${thumb}" alt="" loading="lazy" decoding="async" width="480" height="360" />` +
          PLAY_ICON +
          '</button>' +
          (titleLines.join('').trim() ? `<figcaption>${safeTitle}</figcaption>` : '') +
          '</figure>',
      };
    }
  };
}

