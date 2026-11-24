import type { ImageMetadata } from 'astro';
import { getImage, inferRemoteSize } from 'astro:assets';
import type { Book, Podcast } from '../data/bookshelf';

/**
 * Build-time cover art for `/bookshelf/`. Every lookup soft-fails: a slow or missing cover logs
 * a warning and the page draws a plain stand-in, so a flaky API never breaks the build.
 */

export interface ShelfImage {
  src: string;
  width: number;
  height: number;
}

const FETCH_TIMEOUT_MS = 8000;
const memo = new Map<string, Promise<unknown>>();

// The dev server re-renders on every request; reuse lookups instead of refetching them, but
// forget a failed lookup so it's retried on the next render.
function once<T>(key: string, run: () => Promise<T | undefined>): Promise<T | undefined> {
  const cached = memo.get(key);
  if (cached) return cached as Promise<T | undefined>;
  const pending = run().then((value) => {
    if (value === undefined) memo.delete(key);
    return value;
  });
  memo.set(key, pending);
  return pending;
}

async function softly<T>(label: string, run: () => Promise<T | undefined>): Promise<T | undefined> {
  try {
    return await run();
  } catch (error) {
    console.warn(`[bookshelf] Couldn't load ${label}: ${error instanceof Error ? error.message : error}`);
    return undefined;
  }
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  return res.json();
}

const isbnDigits = (isbn: string) => isbn.replace(/[^0-9X]/gi, '').toUpperCase();

/** Converts a 978-prefixed ISBN-13 to the ISBN-10 that Amazon uses in `/dp/` links. */
function isbn10(isbn: string): string | undefined {
  const digits = isbnDigits(isbn);
  if (digits.length === 10) return digits;
  if (digits.length !== 13 || !digits.startsWith('978')) return undefined;
  const core = digits.slice(3, 12);
  const sum = [...core].reduce((total, digit, i) => total + Number(digit) * (10 - i), 0);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : String(check));
}

export function bookLink(book: Book): string | undefined {
  if (book.url) return book.url;
  if (!book.isbn) return undefined;
  const asin = isbn10(book.isbn);
  return asin ? `https://www.amazon.com/dp/${asin}` : `https://www.amazon.com/s?k=${isbnDigits(book.isbn)}`;
}

/** Names a store link for its button, e.g. "Amazon" or "Bookshop". */
export function linkLabel(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (host.includes('amazon.')) return 'Amazon';
  if (host.includes('bookshop.org')) return 'Bookshop';
  if (host.includes('goodreads.com')) return 'Goodreads';
  return 'Details';
}

async function spotifyArtwork(url: string): Promise<string | undefined> {
  const data = await fetchJson(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
  return data.thumbnail_url ?? undefined;
}

async function appleArtwork(url: string): Promise<string | undefined> {
  const showId = url.match(/\/id(\d+)/)?.[1];
  if (!showId) return undefined;
  const episodeId = new URL(url).searchParams.get('i');
  const data = await fetchJson(`https://itunes.apple.com/lookup?id=${showId}&entity=podcastEpisode&limit=200`);
  const results: any[] = data.results ?? [];
  const episode = episodeId ? results.find((result) => String(result.trackId) === episodeId) : undefined;
  return (episode ?? results[0])?.artworkUrl600 ?? undefined;
}

// Sizes from the image's real aspect ratio. Passing only `width` with `inferSize` would keep the
// original height and crop the cover to fit.
async function optimize(src: string | ImageMetadata, maxWidth: number): Promise<ShelfImage> {
  const size = typeof src === 'string' ? await inferRemoteSize(src) : src;
  const width = Math.min(maxWidth, size.width);
  const height = Math.round((size.height / size.width) * width);
  const image = await getImage({ src, width, height, format: 'webp' });
  return { src: image.src, width, height };
}

export function bookCover(book: Book): Promise<ShelfImage | undefined> {
  const src =
    book.cover ?? (book.isbn ? `https://covers.openlibrary.org/b/isbn/${isbnDigits(book.isbn)}-L.jpg?default=false` : undefined);
  if (!src) return Promise.resolve(undefined);
  const key = typeof src === 'string' ? src : src.src;
  return once(`cover:${key}`, () => softly(`the cover for "${book.title}"`, () => optimize(src, 240)));
}

export function podcastArtwork(podcast: Podcast): Promise<ShelfImage | undefined> {
  const key = typeof podcast.artwork === 'object' ? podcast.artwork.src : podcast.artwork ?? podcast.spotifyUrl ?? podcast.appleUrl;
  if (!key) return Promise.resolve(undefined);
  return once(`artwork:${key}`, async () => {
    const src =
      podcast.artwork ??
      (podcast.spotifyUrl ? await softly(`Spotify artwork for "${podcast.title}"`, () => spotifyArtwork(podcast.spotifyUrl!)) : undefined) ??
      (podcast.appleUrl ? await softly(`Apple artwork for "${podcast.title}"`, () => appleArtwork(podcast.appleUrl!)) : undefined);
    return src ? softly(`the artwork for "${podcast.title}"`, () => optimize(src, 320)) : undefined;
  });
}
