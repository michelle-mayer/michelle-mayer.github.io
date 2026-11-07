export interface HeadingItem {
  depth: number;
  slug: string;
  text: string;
}

export interface SectionItem {
  id: string;
  label: string;
}

export type SectionDepthSpec =
  | string // e.g. "h1 to h2", "h1-h2", "h2-h3", "h2", "all"
  | (number | string)[] // e.g. [1, 2], ["h1", "h2"]
  | {
      min?: number | string;
      max?: number | string;
      minDepth?: number | string;
      maxDepth?: number | string;
      from?: number | string;
      to?: number | string;
      levels?: (number | string)[];
    };

export type SectionNavConfig = boolean | SectionDepthSpec;

export interface SectionNavOptions {
  showSections?: boolean;
  sectionNav?: SectionNavConfig;
  sectionDepth?: SectionDepthSpec;
  sections?: SectionItem[];
}

export interface HeadingLevelRange {
  min: number;
  max: number;
  allowed?: Set<number>;
  isDefault?: boolean;
}

/**
 * Normalizes a heading depth representation (e.g. 1, '1', 'h1', 'H1') to a 1-6 integer.
 */
export function normalizeDepth(val: unknown): number | null {
  if (typeof val === 'number' && Number.isInteger(val) && val >= 1 && val <= 6) {
    return val;
  }
  if (typeof val === 'string') {
    const clean = val.trim().toLowerCase().replace(/^h/, '');
    const num = parseInt(clean, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= 6) {
      return num;
    }
  }
  return null;
}

/**
 * Parses user-configured heading levels from frontmatter options.
 * Supports strings ("h1 to h2", "h1-h2", "h2-h3", "h2", "all"),
 * arrays ([1, 2], ['h1', 'h2']), objects ({ from: 'h1', to: 'h2' }),
 * or boolean flags.
 */
export function parseHeadingLevels(val: unknown): HeadingLevelRange | null {
  if (!val || val === false) return null;

  // Boolean true defaults to levels 1-2
  if (val === true) {
    return { min: 1, max: 2, isDefault: true };
  }

  // String specifications
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'all') {
      return { min: 1, max: 6 };
    }

    // Range: "h1 to h2", "h1-h2", "h1..h2", "1 to 2", "1-2"
    const rangeMatch = s.match(/^(?:h?([1-6]))\s*(?:to|-|\.\.)\s*(?:h?([1-6]))$/i);
    if (rangeMatch) {
      const a = Number(rangeMatch[1]);
      const b = Number(rangeMatch[2]);
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }

    // Single level: "h1", "h2", "2"
    const singleMatch = s.match(/^h?([1-6])$/i);
    if (singleMatch) {
      const d = Number(singleMatch[1]);
      return { min: d, max: d };
    }
  }

  // Array specifications: [1, 2] or ["h1", "h2"]
  if (Array.isArray(val)) {
    const allowed = new Set(
      val.map((item) => normalizeDepth(item)).filter((d): d is number => d !== null)
    );
    if (allowed.size > 0) {
      const nums = Array.from(allowed);
      return { min: Math.min(...nums), max: Math.max(...nums), allowed };
    }
  }

  // Object specifications: { from: 'h1', to: 'h2' } or { minDepth: 1, maxDepth: 2 }
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if (Array.isArray(obj.levels)) {
      const allowed = new Set(
        obj.levels.map((item) => normalizeDepth(item)).filter((d): d is number => d !== null)
      );
      if (allowed.size > 0) {
        const nums = Array.from(allowed);
        return { min: Math.min(...nums), max: Math.max(...nums), allowed };
      }
    }

    const minVal = normalizeDepth(obj.minDepth ?? obj.min ?? obj.from);
    const maxVal = normalizeDepth(obj.maxDepth ?? obj.max ?? obj.to);
    if (minVal !== null || maxVal !== null) {
      const min = minVal ?? 1;
      const max = maxVal ?? Math.max(min, 6);
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }
  }

  return null;
}

/**
 * Cleans heading text for concise display inside navigation pills.
 * Removes trailing colons, markdown punctuation, and extra whitespace.
 */
export function formatSectionLabel(text: string): string {
  return text
    .replace(/^#+\s*/, '')
    .replace(/:\s*$/, '')
    .trim();
}

/**
 * Resolves the section navigation items for a blog post based on frontmatter
 * settings and markdown headings.
 */
export function resolveBlogSections(
  options: SectionNavOptions = {},
  headings: HeadingItem[] = []
): SectionItem[] {
  // 1. Manual section override takes highest precedence
  if (Array.isArray(options.sections) && options.sections.length > 0) {
    return options.sections
      .filter((sec) => sec && typeof sec.id === 'string' && typeof sec.label === 'string')
      .map((sec) => ({
        id: sec.id.replace(/^#/, ''),
        label: formatSectionLabel(sec.label),
      }));
  }

  // 2. Explicit disable check
  if (options.showSections === false || options.sectionNav === false) {
    return [];
  }

  // 3. Determine if section navigation is enabled
  const depthInput =
    options.sectionDepth ??
    (options.sectionNav !== undefined && typeof options.sectionNav !== 'boolean'
      ? options.sectionNav
      : undefined) ??
    (options.showSections || options.sectionNav ? true : undefined);

  if (!depthInput) {
    return [];
  }

  const range = parseHeadingLevels(depthInput);
  if (!range) {
    return [];
  }

  // Filter out any anomalous headings (e.g. frontmatter leaked headings or empty texts)
  const validHeadings = headings.filter(
    (h) =>
      h &&
      typeof h.depth === 'number' &&
      typeof h.slug === 'string' &&
      h.slug.length > 0 &&
      typeof h.text === 'string' &&
      h.text.trim().length > 0 &&
      !h.slug.startsWith('title-') &&
      !h.text.startsWith('title:')
  );

  if (validHeadings.length === 0) {
    return [];
  }

  // If using default (e.g. sectionNav: true) and no H1 or H2 exists in post,
  // adaptively include the shallowest heading level present (e.g. H3)
  let effectiveRange = range;
  if (range.isDefault) {
    const hasH1orH2 = validHeadings.some((h) => h.depth === 1 || h.depth === 2);
    if (!hasH1orH2) {
      const minAvailableDepth = Math.min(...validHeadings.map((h) => h.depth));
      effectiveRange = { min: minAvailableDepth, max: minAvailableDepth };
    }
  }

  // Filter headings according to depth range / allowed set
  const filtered = validHeadings.filter((h) => {
    if (effectiveRange.allowed) {
      return effectiveRange.allowed.has(h.depth);
    }
    return h.depth >= effectiveRange.min && h.depth <= effectiveRange.max;
  });

  return filtered.map((h) => ({
    id: h.slug,
    label: formatSectionLabel(h.text),
  }));
}

