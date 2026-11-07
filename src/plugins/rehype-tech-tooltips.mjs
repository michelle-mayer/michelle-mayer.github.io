import crypto from 'node:crypto';
import { TECH_TERMS, getTechTerm } from '../data/techTerms.ts';
import { themeConfig } from '../theme.config.ts';

const SKIP_TAGS = new Set(['code', 'pre', 'script', 'style', 'svg']);
const NO_TOOLTIP_TAGS = new Set([
  'a',
  'button',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'figcaption',
  'kbd',
  'samp',
  'var',
]);

/**
 * Escapes regex metacharacters in a literal dictionary term.
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a single compiled regex matching all canonical terms (and short single-token
 * acronym aliases) from `TECH_TERMS`, sorted longest-first so e.g. `SigV4A` matches before `SigV4`.
 */
function buildAutoTermRegex() {
  const patterns = new Set();

  for (const entry of Object.values(TECH_TERMS)) {
    const term = entry.term.trim();
    if (!term) continue;

    // Allow optional plural 's' for all-uppercase acronyms not ending in S (e.g. AST -> ASTs, HBA -> HBAs)
    if (/^[A-Z]{2,}$/.test(term) && !term.endsWith('S')) {
      patterns.add(`${escapeRegExp(term)}s?`);
    } else {
      patterns.add(escapeRegExp(term));
    }

    if (Array.isArray(entry.aliases)) {
      for (const alias of entry.aliases) {
        const trimmedAlias = alias.trim();
        // Include single-token aliases (e.g. OpenZFS, OpenTofu, PVE, FOUC)
        if (trimmedAlias && !/\s/.test(trimmedAlias) && trimmedAlias !== term) {
          patterns.add(escapeRegExp(trimmedAlias));
        }
      }
    }
  }

  const sorted = Array.from(patterns).sort((a, b) => b.length - a.length);
  // Lookbehind prevents matching inside words, URLs, paths, or hyphenated identifiers;
  // lookahead prevents matching inside words, URLs, or file extensions (while allowing trailing punctuation).
  return new RegExp(
    `(?<![A-Za-z0-9_/:.-])(?:${sorted.join('|')})(?![A-Za-z0-9_+/:-]|\\.[A-Za-z0-9])`,
    'g'
  );
}

const AUTO_TERM_REGEX = buildAutoTermRegex();

/**
 * Deterministic digest of the technical dictionary and tooltip configuration.
 * Passed as a serializable plugin option in `astro.config.mjs` so Astro's
 * Content Layer (`data-store.json`) and incremental build cache automatically
 * invalidate whenever `src/data/techTerms.ts` or `themeConfig.tooltips` changes.
 */
export const TECH_TOOLTIPS_DIGEST = crypto
  .createHash('sha256')
  .update(JSON.stringify({ terms: TECH_TERMS, config: themeConfig?.tooltips }))
  .digest('hex')
  .slice(0, 16);

/**
 * Escapes HTML special characters for safe attribute and inner HTML rendering.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Extracts an optional `title="..."` attribute from an opening `<abbr ...>` tag string.
 * @param {string} openTag
 * @returns {string}
 */
function extractTitleAttr(openTag) {
  const m = openTag.match(/\btitle=(?:"([^"]*)"|'([^']*)')/i);
  return m ? (m[1] ?? m[2] ?? '').trim() : '';
}

/**
 * Builds the single-line `<span role="tooltip" ...>` bubble HTML string.
 * Kept strictly single-line (no `\n`) so Astro's `rehypeHeadingIds` (`/^\\n?<.*>\\n?$/`)
 * ignores the tooltip bubble when extracting heading text and anchor slugs.
 *
 * @param {string} termText
 * @param {string} nativeTitle
 * @param {string} tooltipId
 */
function resolveTooltipMeta(termText, nativeTitle, tooltipId) {
  const termInfo = getTechTerm(termText) || (nativeTitle ? getTechTerm(nativeTitle) : undefined);
  const badgeTerm = termInfo?.term || termText;
  const displayName = termInfo?.name || nativeTitle || termText;
  const definition = termInfo?.definition || nativeTitle || displayName;
  const category = termInfo?.category;

  const fallbackTitle =
    displayName && displayName !== badgeTerm
      ? `${badgeTerm} — ${displayName}: ${definition}`
      : `${badgeTerm}: ${definition}`;

  const bubbleHtml =
    `<span id="${escapeHtml(tooltipId)}" role="tooltip" class="tech-tooltip-bubble pointer-events-none opacity-0 invisible absolute bottom-full left-1/2 mb-2 z-50 w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-3 rounded-lg bg-white/95 dark:bg-gray-900/98 text-gray-900 dark:text-gray-100 shadow-xl shadow-gray-900/10 dark:shadow-2xl ring-1 ring-gray-900/10 dark:ring-amber-500/25 backdrop-blur-md transition-all duration-150 ease-out text-left select-none">` +
    `<span class="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-200/80 dark:border-gray-700/80">` +
    `<span class="inline-flex items-baseline gap-1.5 min-w-0">` +
    `<span class="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide shrink-0">${escapeHtml(badgeTerm)}</span>` +
    (displayName && displayName !== badgeTerm
      ? `<span class="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">${escapeHtml(displayName)}</span>`
      : '') +
    `</span>` +
    (category
      ? `<span class="text-[9px] font-mono uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-gray-800 text-amber-700 dark:text-amber-300/90 ring-1 ring-amber-500/20 dark:ring-white/10 shrink-0">${escapeHtml(category)}</span>`
      : '') +
    `</span>` +
    `<span class="block mt-1.5 text-xs/relaxed text-gray-600 dark:text-gray-300 font-normal">${escapeHtml(definition)}</span>` +
    `<span class="tech-tooltip-arrow absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white/95 dark:border-t-gray-900/98 pointer-events-none" aria-hidden="true"></span>` +
    `</span>`;

  return { termInfo, fallbackTitle, bubbleHtml };
}

/**
 * Creates a HAST element node representing `.tech-tooltip-wrapper`.
 * @param {string} termText
 * @param {string} nativeTitle
 * @param {string} tooltipId
 */
function createTooltipHastNode(termText, nativeTitle, tooltipId) {
  const { fallbackTitle, bubbleHtml } = resolveTooltipMeta(termText, nativeTitle, tooltipId);

  return {
    type: 'element',
    tagName: 'span',
    properties: {
      className: ['tech-tooltip-wrapper', 'relative', 'inline-block'],
    },
    children: [
      {
        type: 'element',
        tagName: 'abbr',
        properties: {
          className: [
            'tech-tooltip-trigger',
            'not-prose',
            'cursor-help',
            'border-b',
            'border-dotted',
            'border-amber-500/60',
            'dark:border-amber-400/60',
            'hover:border-amber-600',
            'dark:hover:border-amber-300',
            'hover:text-amber-700',
            'dark:hover:text-amber-300',
            'transition-colors',
            'font-medium',
            'no-underline',
          ],
          'aria-describedby': tooltipId,
          title: fallbackTitle,
          'data-tooltip-id': tooltipId,
          'data-term': termText,
        },
        children: [{ type: 'text', value: termText }],
      },
      {
        type: 'raw',
        value: bubbleHtml,
      },
    ],
  };
}

/**
 * Builds full raw HTML wrapper string (for raw HTML block nodes).
 * @param {string} termText
 * @param {string} nativeTitle
 * @param {string} tooltipId
 */
function createTooltipHtmlString(termText, nativeTitle, tooltipId) {
  const { fallbackTitle, bubbleHtml } = resolveTooltipMeta(termText, nativeTitle, tooltipId);
  return (
    `<span class="tech-tooltip-wrapper relative inline-block">` +
    `<abbr class="tech-tooltip-trigger not-prose cursor-help border-b border-dotted border-amber-500/60 dark:border-amber-400/60 hover:border-amber-600 dark:hover:border-amber-300 hover:text-amber-700 dark:hover:text-amber-300 transition-colors font-medium no-underline" aria-describedby="${escapeHtml(tooltipId)}" title="${escapeHtml(fallbackTitle)}" data-tooltip-id="${escapeHtml(tooltipId)}" data-term="${escapeHtml(termText)}">${escapeHtml(termText)}</abbr>` +
    bubbleHtml +
    `</span>`
  );
}

let fallbackBatchSeq = 0;

/**
 * Rehype plugin that compiles semantic `<abbr>` elements AND (when enabled in `theme.config.ts`)
 * plain-text dictionary acronyms from `src/data/techTerms.ts` into static `.tech-tooltip-wrapper`
 * markup at build time, keeping `techTerms.ts` 100% server-side (0 client dictionary bytes).
 *
 * When `autoLink === 'first'` (default), strictly only the first occurrence of each acronym
 * in the document receives a tooltip; any subsequent occurrences (even if wrapped in `<abbr>`)
 * are rendered as plain text.
 */
export function rehypeTechTooltips() {
  return (tree, file) => {
    const tooltipConfig = themeConfig?.tooltips ?? { enabled: true, autoLink: 'first' };
    if (tooltipConfig.enabled === false) return;

    const fileIdentity = file?.path || file?.history?.[0] || `doc-${++fallbackBatchSeq}`;
    const isPagesContent = String(fileIdentity).replace(/\\/g, '/').includes('/src/content/pages/');
    const autoLinkMode = isPagesContent ? 'off' : (tooltipConfig.autoLink ?? 'first');
    const fileHash = crypto.createHash('sha1').update(String(fileIdentity)).digest('hex').slice(0, 6);
    let counter = 0;
    const nextId = () => `tech-tip-${fileHash}-${++counter}`;

    // Tracks canonical terms already wrapped in the current Markdown document
    const seenTerms = new Set();

    const getCanonicalKey = (termText, nativeTitle = '') => {
      const info = getTechTerm(termText) || (nativeTitle ? getTechTerm(nativeTitle) : undefined);
      return info ? info.term.toLowerCase() : termText.trim().toLowerCase();
    };

    const shouldWrapTerm = (termText, nativeTitle = '') => {
      const key = getCanonicalKey(termText, nativeTitle);
      if (!key) return false;
      if (autoLinkMode === 'first') {
        if (seenTerms.has(key)) return false;
        seenTerms.add(key);
      }
      return true;
    };

    /**
     * Single top-to-bottom document traversal so the first occurrence in reading order
     * always wins when `autoLink === 'first'`.
     * @param {any} node
     * @param {boolean} insideNoTooltipZone
     */
    function transformNode(node, insideNoTooltipZone = false) {
      if (!node || !Array.isArray(node.children)) return;
      if (node.type === 'element' && SKIP_TAGS.has(node.tagName)) return;
      if (
        node.type === 'element' &&
        Array.isArray(node.properties?.className) &&
        node.properties.className.includes('tech-tooltip-wrapper')
      ) {
        return;
      }

      const noTooltipHere =
        insideNoTooltipZone || (node.type === 'element' && NO_TOOLTIP_TAGS.has(node.tagName));

      const nextChildren = [];
      const children = node.children;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        // Case 1: CommonMark inline HTML sibling sequence:
        // raw("<abbr...>") + text("...") [+ text...] + raw("</abbr>")
        if (
          child.type === 'raw' &&
          typeof child.value === 'string' &&
          /^<abbr(?:\s[^>]*)?>$/i.test(child.value.trim()) &&
          !child.value.includes('tech-tooltip-trigger')
        ) {
          let closeIdx = -1;
          let combinedText = '';
          let validTextOnly = true;

          for (let j = i + 1; j < children.length; j++) {
            const sib = children[j];
            if (sib.type === 'raw' && typeof sib.value === 'string' && /^<\/abbr>$/i.test(sib.value.trim())) {
              closeIdx = j;
              break;
            }
            if (sib.type === 'text') {
              combinedText += sib.value;
            } else {
              validTextOnly = false;
              break;
            }
          }

          const termText = combinedText.trim();
          if (closeIdx !== -1 && validTextOnly && termText) {
            const nativeTitle = extractTitleAttr(child.value);
            if (!noTooltipHere && shouldWrapTerm(termText, nativeTitle)) {
              nextChildren.push(createTooltipHastNode(termText, nativeTitle, nextId()));
            } else {
              nextChildren.push({ type: 'text', value: termText });
            }
            i = closeIdx;
            continue;
          }
        }

        // Case 2: HAST `element` with tagName === 'abbr'
        if (child.type === 'element' && child.tagName === 'abbr') {
          const classes = Array.isArray(child.properties?.className)
            ? child.properties.className
            : String(child.properties?.className || '').split(/\s+/);
          if (!classes.includes('tech-tooltip-trigger')) {
            const textContent = (child.children || [])
              .filter((c) => c.type === 'text')
              .map((c) => c.value)
              .join('')
              .trim();
            if (textContent) {
              const nativeTitle = String(child.properties?.title || '').trim();
              if (!noTooltipHere && shouldWrapTerm(textContent, nativeTitle)) {
                nextChildren.push(createTooltipHastNode(textContent, nativeTitle, nextId()));
              } else {
                nextChildren.push({ type: 'text', value: textContent });
              }
              continue;
            }
          }
        }

        // Case 3: Single raw HTML block containing `<abbr>...</abbr>`
        if (
          child.type === 'raw' &&
          typeof child.value === 'string' &&
          child.value.includes('<abbr') &&
          child.value.includes('</abbr>')
        ) {
          child.value = child.value.replace(
            /(<abbr(?![^>]*tech-tooltip-trigger)(?:\s[^>]*)?>)([^<]+)<\/abbr>/gi,
            (_full, openTag, innerText) => {
              const termText = String(innerText).trim();
              if (!termText) return _full;
              const nativeTitle = extractTitleAttr(openTag);
              if (!noTooltipHere && shouldWrapTerm(termText, nativeTitle)) {
                return createTooltipHtmlString(termText, nativeTitle, nextId());
              }
              return escapeHtml(termText);
            }
          );
        }

        // Case 4: Plain-text node auto-detection (when autoLink is 'first' or 'all')
        if (
          !noTooltipHere &&
          (autoLinkMode === 'first' || autoLinkMode === 'all') &&
          child.type === 'text' &&
          typeof child.value === 'string' &&
          child.value.length >= 2
        ) {
          const text = child.value;
          AUTO_TERM_REGEX.lastIndex = 0;
          let match;
          let lastIndex = 0;
          let replacedAny = false;

          while ((match = AUTO_TERM_REGEX.exec(text)) !== null) {
            const matchedText = match[0];
            const termInfo = getTechTerm(matchedText);
            if (!termInfo) continue;

            if (!shouldWrapTerm(matchedText)) {
              continue;
            }

            if (match.index > lastIndex) {
              nextChildren.push({
                type: 'text',
                value: text.slice(lastIndex, match.index),
              });
            }

            nextChildren.push(createTooltipHastNode(matchedText, '', nextId()));
            lastIndex = match.index + matchedText.length;
            replacedAny = true;
          }

          if (replacedAny) {
            if (lastIndex < text.length) {
              nextChildren.push({
                type: 'text',
                value: text.slice(lastIndex),
              });
            }
            continue;
          }
        }

        transformNode(child, noTooltipHere);
        nextChildren.push(child);
      }

      node.children = nextChildren;
    }

    transformNode(tree, false);
  };
}
