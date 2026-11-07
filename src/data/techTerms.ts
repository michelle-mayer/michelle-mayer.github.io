export interface TechTerm {
  term: string;
  name: string;
  definition: string;
  category: 'Hardware' | 'Storage' | 'Cloud' | 'Networking' | 'Security' | 'Virtualization' | 'Reliability' | 'DevOps' | 'AI' | 'Architecture';
  aliases?: string[];
}

export const TECH_TERMS: Record<string, TechTerm> = {
  Astro: {
    term: 'Astro',
    name: 'Astro',
    definition: 'A web framework that builds content-focused websites, including this static site.',
    category: 'Architecture',
  },
  Markdown: {
    term: 'Markdown',
    name: 'Markdown',
    definition: 'A plain-text format for writing headings, paragraphs, links, lists, and other content.',
    category: 'Architecture',
  },
};

const TECH_TERMS_LOOKUP = new Map<string, TechTerm>();

for (const [key, entry] of Object.entries(TECH_TERMS)) {
  TECH_TERMS_LOOKUP.set(key.toLowerCase(), entry);
  TECH_TERMS_LOOKUP.set(entry.term.toLowerCase(), entry);
  TECH_TERMS_LOOKUP.set(entry.name.toLowerCase(), entry);
  if (entry.aliases) {
    for (const alias of entry.aliases) {
      const aliasLower = alias.toLowerCase();
      if (!TECH_TERMS_LOOKUP.has(aliasLower)) {
        TECH_TERMS_LOOKUP.set(aliasLower, entry);
      }
    }
  }
}

export function getTechTerm(query: string): TechTerm | undefined {
  if (!query) return undefined;
  const trimmed = query.trim();
  const direct = TECH_TERMS_LOOKUP.get(trimmed.toLowerCase());
  if (direct) return direct;
  if (trimmed.length > 2 && trimmed.endsWith('s')) {
    return TECH_TERMS_LOOKUP.get(trimmed.slice(0, -1).toLowerCase());
  }
  return undefined;
}
