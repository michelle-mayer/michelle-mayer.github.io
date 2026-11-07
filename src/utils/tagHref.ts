/**
 * Tags that deep-link to a dedicated page section instead of a generated
 * `/tags/[tag]/` archive. The `career` tag points at the Work Experience
 * overview on /about/.
 */
const HARD_LINKED_TAGS: Record<string, string> = {
  career: '/about/#experience',
};

/**
 * Resolve the destination for a tag slug, honoring hard-linked tags.
 */
export function tagHref(tagSlug: string): string {
  return HARD_LINKED_TAGS[tagSlug] ?? `/tags/${tagSlug}/`;
}


/**
 * True when a tag has no generated `/tags/[tag]/` archive because it is hard-linked elsewhere.
 */
export function isHardLinkedTag(tagSlug: string): boolean {
  return tagSlug in HARD_LINKED_TAGS;
}
