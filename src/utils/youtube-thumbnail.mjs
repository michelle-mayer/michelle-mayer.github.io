import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Build-time YouTube thumbnail fetcher with a soft-fail contract.
 *
 * Thumbnails are downloaded once, resized to WebP, and cached on disk in
 * `.cache/youtube-thumbs/` (persisted between CI runs like the other caches).
 * Files are content-addressed as `<id>.<settings>.<content>.webp`:
 *   - `<settings>` hashes the resize/quality pipeline, so changing it re-encodes;
 *   - `<content>` hashes the encoded bytes, so URLs are immutable and cache-bustable.
 * A warm cache hit costs zero network requests, and a video YouTube definitively
 * reports as missing (404/400/403 on every variant) is asked about only once: a
 * permanent `<id>.missing` marker stops bogus IDs being re-fetched on every build
 * (delete the marker to retry); transient failures (timeouts, offline, 5xx) are
 * never remembered and retry on the next build. Pages reference
 * `/yt-thumbs/<file>` from our own origin instead of contacting Google.
 *
 * SOFT FAIL: any problem (offline build, 404, timeout, sharp error) never
 * fails the build. We warn and fall back to the remote `i.ytimg.com` URL so the
 * facade still renders.
 */

export const THUMB_CACHE_DIR = path.resolve(process.cwd(), '.cache/youtube-thumbs');
export const THUMB_PUBLIC_PREFIX = '/yt-thumbs';

const FETCH_TIMEOUT_MS = 8000;
const THUMB_WIDTH = 640;
const WEBP_QUALITY = 70;
/** `maxresdefault` is 16:9 but missing for some videos; `hqdefault` always exists. */
const SOURCE_VARIANTS = ['maxresdefault', 'hqdefault'];

const sha256 = (input) => crypto.createHash('sha256').update(input).digest('hex');
/** Changes whenever the encode pipeline changes, invalidating older cached files. */
const SETTINGS_TAG = sha256(
  JSON.stringify({ THUMB_WIDTH, WEBP_QUALITY, SOURCE_VARIANTS, v: 1 })
).slice(0, 6);

/** Matches `<id>.<settings>.<content>.webp` cache/public filenames. */
export const THUMB_FILENAME_RE = /^[A-Za-z0-9_-]{11}\.[0-9a-f]{6}\.[0-9a-f]{10}\.webp$/;

function findCachedFile(videoId) {
  if (!fs.existsSync(THUMB_CACHE_DIR)) return null;
  const prefix = `${videoId}.${SETTINGS_TAG}.`;
  return fs.readdirSync(THUMB_CACHE_DIR).find((f) => f.startsWith(prefix) && THUMB_FILENAME_RE.test(f)) ?? null;
}

/** Drop superseded entries (older settings or re-encoded content) for this video. */
function pruneStale(videoId, keep) {
  for (const f of fs.readdirSync(THUMB_CACHE_DIR)) {
    if (f.startsWith(`${videoId}.`) && f !== keep) fs.rmSync(path.join(THUMB_CACHE_DIR, f), { force: true });
  }
}

const inflight = new Map();

export function remoteThumbnailUrl(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return Buffer.from(await res.arrayBuffer());
}

const isDefinitiveMiss = (error) => [400, 403, 404].includes(error?.status);

function missingMarker(videoId) {
  return path.join(THUMB_CACHE_DIR, `${videoId}.missing`);
}

/** True when a definitive miss is on record: we only ever ask YouTube once (until the cache is cleared). */
function hasRecordedMiss(videoId) {
  return fs.existsSync(missingMarker(videoId));
}

function recordMiss(videoId) {
  fs.mkdirSync(THUMB_CACHE_DIR, { recursive: true });
  fs.writeFileSync(missingMarker(videoId), new Date().toISOString());
}

/**
 * Download the best available thumbnail and encode it to WebP.
 * Throws on failure; callers apply the soft-fail policy.
 * @param {string} videoId
 * @returns {Promise<Buffer>}
 */
export async function buildThumbnailBuffer(videoId) {
  let source = null;
  const errors = [];
  for (const variant of SOURCE_VARIANTS) {
    try {
      source = await download(`https://i.ytimg.com/vi/${videoId}/${variant}.jpg`);
      break;
    } catch (error) {
      errors.push(error);
    }
  }
  if (!source) {
    const failure = errors[errors.length - 1] ?? new Error('no thumbnail variant available');
    // Only a definitive answer from YouTube for every variant counts as "doesn't exist".
    failure.definitiveMiss = errors.length === SOURCE_VARIANTS.length && errors.every(isDefinitiveMiss);
    throw failure;
  }

  const { default: sharp } = await import('sharp');
  return sharp(source)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

async function fetchAndCache(videoId) {
  const webp = await buildThumbnailBuffer(videoId);
  const fileName = `${videoId}.${SETTINGS_TAG}.${sha256(webp).slice(0, 10)}.webp`;
  fs.mkdirSync(THUMB_CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(THUMB_CACHE_DIR, fileName), webp);
  pruneStale(videoId, fileName);
  return fileName;
}

/**
 * Resolve the thumbnail URL for a video, downloading it into the cache if needed.
 * Always resolves; never throws.
 * @param {string} videoId
 * @returns {Promise<string>} local hashed `/yt-thumbs/...` URL, or the remote fallback
 */
export function ensureYouTubeThumbnail(videoId) {
  const cached = findCachedFile(videoId);
  if (cached) return Promise.resolve(`${THUMB_PUBLIC_PREFIX}/${cached}`);
  if (hasRecordedMiss(videoId)) return Promise.resolve(remoteThumbnailUrl(videoId));
  if (inflight.has(videoId)) return inflight.get(videoId);

  const task = fetchAndCache(videoId)
    .then((fileName) => `${THUMB_PUBLIC_PREFIX}/${fileName}`)
    .catch((error) => {
      if (error?.definitiveMiss) {
        recordMiss(videoId);
        console.warn(
          `[remark-youtube] No thumbnail exists for "${videoId}" (${error.message}); ` +
            'using the remote URL and not retrying (delete .cache/youtube-thumbs/' + videoId + '.missing to retry). Check the video ID.'
        );
      } else {
        console.warn(
          `[remark-youtube] Could not download thumbnail for "${videoId}" (${error?.message ?? error}); ` +
            'falling back to the remote i.ytimg.com URL (will retry next build).'
        );
      }
      return remoteThumbnailUrl(videoId);
    });

  inflight.set(videoId, task);
  return task;
}
