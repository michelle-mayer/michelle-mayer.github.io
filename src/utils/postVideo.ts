import { ensureYouTubeThumbnail } from './youtube-thumbnail.mjs';
import { parseYouTubeId } from '../plugins/remark-youtube.mjs';

const YOUTUBE_BLOCK_RE = /^```youtube[ \t]*\r?\n([\s\S]*?)^```/m;

export interface PostVideoInfo {
  videoId: string;
  title: string;
  thumbUrl: string;
}

/**
 * Returns true when a markdown body contains at least one fenced ```youtube block.
 */
export function hasVideoEmbed(body?: string): boolean {
  if (!body) return false;
  return YOUTUBE_BLOCK_RE.test(body);
}

/**
 * Extracts the first ```youtube block from a markdown body and resolves its
 * build-time cached WebP thumbnail URL (soft-failing to the remote URL).
 */
export async function getFirstVideoEmbed(body?: string): Promise<PostVideoInfo | null> {
  if (!body) return null;
  const match = body.match(YOUTUBE_BLOCK_RE);
  if (!match) return null;

  const [rawSource = '', ...titleLines] = match[1].split(/\r?\n/);
  const videoId = parseYouTubeId(rawSource);
  if (!videoId) return null;

  const title = titleLines.join(' ').trim() || 'Embedded video';
  const thumbUrl = await ensureYouTubeThumbnail(videoId);

  return { videoId, title, thumbUrl };
}
