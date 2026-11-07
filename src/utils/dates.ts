/**
 * Timezone-stable date parsing and formatting (`dates.ts`)
 *
 * Frontmatter dates such as `2026-11-03`, `'2026-11-03T14:00:00'`, or `'Nov 03 2026'`
 * carry no UTC offset. JavaScript would interpret them in the *build machine's* local
 * timezone, so a local build (e.g. JST) and a CI build (UTC) would disagree by hours —
 * and visitors could see a different calendar day than the author intended.
 *
 * These helpers pin every offset-less date to the site timezone configured in
 * `site.config.ts` (`site.timeZone`) and format all user-visible dates in that same zone.
 */
import { siteConfig } from '../site.config';

export const SITE_TIME_ZONE = siteConfig.site.timeZone || 'UTC';

const HAS_EXPLICIT_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

const offsetFormatterCache = new Map<string, Intl.DateTimeFormat>();

/** Milliseconds that `timeZone` is ahead of UTC at the given instant. */
function getTimeZoneOffsetMs(utcMs: number, timeZone: string): number {
  let fmt = offsetFormatterCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    offsetFormatterCache.set(timeZone, fmt);
  }
  const parts: Record<string, number> = {};
  for (const p of fmt.formatToParts(new Date(utcMs))) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return wallAsUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Converts wall-clock components (expressed as a UTC timestamp) into the real instant in `timeZone`. */
function wallClockToInstant(wallAsUtcMs: number, timeZone: string): Date {
  // Two passes settle DST transitions correctly.
  let instant = wallAsUtcMs - getTimeZoneOffsetMs(wallAsUtcMs, timeZone);
  instant = wallAsUtcMs - getTimeZoneOffsetMs(instant, timeZone);
  return new Date(instant);
}

/**
 * Parses a frontmatter date value, interpreting offset-less values in the site timezone.
 * Returns the input unchanged when it cannot be parsed so Zod reports a proper error.
 */
export function parseSiteDate(value: unknown, timeZone: string = SITE_TIME_ZONE): unknown {
  if (value instanceof Date) {
    if (Number.isNaN(value.valueOf())) return value;
    // YAML parses unquoted `2026-11-03` as UTC midnight — treat it as a calendar date in the site zone.
    const isUtcMidnight =
      value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0 && value.getUTCMilliseconds() === 0;
    return isUtcMidnight ? wallClockToInstant(value.valueOf(), timeZone) : value;
  }

  if (typeof value !== 'string') return value;
  const str = value.trim();
  if (!str) return value;

  if (HAS_EXPLICIT_OFFSET.test(str)) return new Date(str);

  let wallAsUtc: number;
  if (ISO_DATE_ONLY.test(str)) {
    wallAsUtc = Date.parse(`${str}T00:00:00Z`);
  } else if (ISO_LOCAL_DATETIME.test(str)) {
    wallAsUtc = Date.parse(`${str.replace(' ', 'T')}Z`);
  } else {
    // Free-form strings such as `Nov 03 2026` — read their wall-clock fields via a UTC parse.
    wallAsUtc = Date.parse(`${str} UTC`);
  }

  return Number.isNaN(wallAsUtc) ? value : wallClockToInstant(wallAsUtc, timeZone);
}

const displayFormatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Formats a date for display in the site timezone (default: `Nov 3, 2026`).
 */
export function formatSiteDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
  locale = 'en-US',
): string {
  const d = date instanceof Date ? date : new Date(date);
  const key = `${locale}|${JSON.stringify(options)}`;
  let fmt = displayFormatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { timeZone: SITE_TIME_ZONE, ...options });
    displayFormatterCache.set(key, fmt);
  }
  return fmt.format(d);
}

