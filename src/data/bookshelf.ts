import type { ImageMetadata } from 'astro';

export interface Book {
  title: string;
  author: string;
  /** ISBN-10 or ISBN-13. Finds the cover on Open Library and builds the Amazon link. */
  isbn?: string;
  /** Optional cover: an image URL, or an image imported from `src/images/`. */
  cover?: string | ImageMetadata;
  /** Optional link, e.g. a specific edition. Defaults to Amazon, found by ISBN. */
  url?: string;
  /** A line or two on why you recommend it. Shown when someone hovers or taps the book. */
  review: string;
}

export interface Podcast {
  /** The episode title, or the show name to recommend a whole show. */
  title: string;
  show: string;
  /** Link to the episode (or show) on Spotify. Its artwork is found automatically. */
  spotifyUrl?: string;
  /** Link to the episode (or show) on Apple Podcasts. Its artwork is used if there's no Spotify link. */
  appleUrl?: string;
  /** Optional artwork: an image URL, or an image imported from `src/images/`. */
  artwork?: string | ImageMetadata;
  /** A line or two on why you recommend it. Shown when someone hovers or taps the record. */
  review: string;
}

/** Books on the `/bookshelf/` page, in shelf order. */
export const books: Book[] = [
  {
    title: 'The Culture Map',
    author: 'Erin Meyer',
    isbn: '9781610392501',
    review: '[One line on why you recommend it.]',
  },
  {
    title: 'Daring Greatly',
    author: 'Brené Brown',
    isbn: '9781592408412',
    review: '[One line on why you recommend it.]',
  },
];

/** Podcast episodes and shows on the `/bookshelf/` page, in shelf order. */
export const podcasts: Podcast[] = [
  {
    title: 'The Birth of Emoji',
    show: 'Tiny Revolutions',
    appleUrl:
      'https://podcasts.apple.com/us/podcast/the-birth-of-emoji-faces-that-speak-without-words/id1851226473?i=1000736833483',
    review: '[One line on why you recommend it.]',
  },
];
