import { visit } from 'unist-util-visit';

/** Builds a hast element node. */
const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });

/** Expand icon (matches `EXPAND_ICON` in `src/scripts/mermaid-zoom.ts`). */
const expandIcon = () =>
  el(
    'svg',
    {
      width: '15',
      height: '15',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ariaHidden: 'true',
    },
    [
      el('polyline', { points: '15 3 21 3 21 9' }),
      el('polyline', { points: '9 21 3 21 3 15' }),
      el('line', { x1: '21', y1: '3', x2: '14', y2: '10' }),
      el('line', { x1: '3', y1: '21', x2: '10', y2: '14' }),
    ],
  );

/**
 * Wraps a Mermaid SVG in the interactive card markup at build time so the
 * client script (`mermaid-zoom.ts`) only attaches listeners and never restructures
 * the DOM after first paint (avoids layout shift).
 */
const wrapDiagram = (svg) =>
  el('div', { className: ['mermaid-diagram-wrapper'] }, [
    svg,
    el('div', { className: ['mermaid-diagram-toolbar'] }, [
      el(
        'button',
        {
          type: 'button',
          className: ['mermaid-expand-btn'],
          ariaLabel: 'Expand diagram in interactive zoom viewer',
          title: 'Click to expand and zoom diagram',
        },
        [expandIcon(), el('span', {}, [{ type: 'text', value: 'Expand' }])],
      ),
    ]),
  ]);

const isMermaidSvg = (node) =>
  node.tagName === 'svg' &&
  typeof node.properties?.id === 'string' &&
  node.properties.id.startsWith('mermaid-');

/**
 * Rehype plugin to fix accessibility issues and enhance styling on Mermaid-generated SVGs:
 * 1. Replaces non-standard/abstract ARIA role 'graphics-document document' with 'img'
 *    and ensures valid aria-roledescription and accessible label.
 * 2. Adds rounded corner attributes (rx / ry) to flowchart node and cluster rectangles,
 *    and ensures cluster containers have comfortable horizontal/vertical breathing room
 *    around wide cluster titles.
 * 3. Wraps each diagram in the `.mermaid-diagram-wrapper` card with its Expand toolbar.
 *
 * @param {{ version?: string }} [_options] `version` is only used to invalidate Astro's
 *   cached Markdown render output when this plugin's output changes.
 */
export function rehypeMermaidA11y(_options = {}) {
  return (tree) => {
    /** @type {Array<{ node: any, index: number, parent: any }>} */
    const diagramsToWrap = [];

    visit(tree, 'element', (node, index, parent) => {
      if (isMermaidSvg(node) && parent && typeof index === 'number') {
        const parentClass = Array.isArray(parent.properties?.className) ? parent.properties.className : [];
        if (!parentClass.includes('mermaid-diagram-wrapper')) {
          diagramsToWrap.push({ node, index, parent });
        }
      }

      if (node.tagName === 'svg' && node.properties) {
        const role = node.properties.role;
        const roleStr = Array.isArray(role) ? role.join(' ') : String(role || '');
        if (roleStr.includes('graphics-document') || roleStr.includes('document')) {
          node.properties.role = 'img';
          if (!node.properties.ariaLabel) {
            node.properties.ariaLabel = 'Mermaid diagram';
          }
          if (node.properties.ariaRoleDescription) {
            const desc = Array.isArray(node.properties.ariaRoleDescription)
              ? node.properties.ariaRoleDescription.join(' ')
              : String(node.properties.ariaRoleDescription);
            if (desc.includes('flowchart')) {
              node.properties.ariaRoleDescription = 'flowchart';
            } else {
              node.properties.ariaRoleDescription = 'diagram';
            }
          }
        }

        // Pad SVG viewBox slightly so widened cluster borders are never clipped at the edges
        if (typeof node.properties.viewBox === 'string') {
          const parts = node.properties.viewBox.trim().split(/\s+/).map(Number);
          if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
            const [minX, minY, vbW, vbH] = parts;
            node.properties.viewBox = `${minX - 16} ${minY - 8} ${vbW + 32} ${vbH + 16}`;
          }
        }
      }

      // Prevent SVG <foreignObject> from clipping descenders (g, p, q, parentheses) or edgeLabel pill borders
      if (node.tagName === 'foreignObject') {
        node.properties = node.properties || {};
        node.properties.overflow = 'visible';
      }

      // Replace <br> inside SVG foreignObject with a block-level span so hast-util-to-html
      // in SVG namespace does not emit <br></br> (which HTML5 parses as two <br> line breaks)
      if (node.tagName === 'br') {
        node.tagName = 'span';
        node.properties = { className: ['mermaid-br'] };
        node.children = [];
      }

      if (node.tagName === 'rect' && parent && parent.tagName === 'g' && parent.properties) {
        const parentClass = Array.isArray(parent.properties.className)
          ? parent.properties.className.join(' ')
          : String(parent.properties.className || '');
        if (parentClass.includes('cluster')) {
          node.properties = node.properties || {};
          node.properties.rx = '12';
          node.properties.ry = '12';

          // Ensure cluster rect has at least 18px horizontal padding on each side of its cluster-label
          const labelGroup = (parent.children || []).find(
            (child) =>
              child.type === 'element' &&
              child.tagName === 'g' &&
              (Array.isArray(child.properties?.className)
                ? child.properties.className.join(' ')
                : String(child.properties?.className || '')
              ).includes('cluster-label')
          );
          const foreignObj = labelGroup?.children?.find(
            (c) => c.type === 'element' && c.tagName === 'foreignObject'
          );
          const labelW = Number(foreignObj?.properties?.width);
          const rectX = Number(node.properties.x);
          const rectW = Number(node.properties.width);
          if (!Number.isNaN(labelW) && !Number.isNaN(rectX) && !Number.isNaN(rectW)) {
            const minClusterWidth = labelW + 36;
            if (rectW < minClusterWidth) {
              const delta = minClusterWidth - rectW;
              node.properties.x = String(rectX - delta / 2);
              node.properties.width = String(rectW + delta);
            }
          }
        } else if (parentClass.includes('node')) {
          node.properties = node.properties || {};
          node.properties.rx = '8';
          node.properties.ry = '8';
        }
      }
    });

    // Wrap after traversal so sibling indices stay valid (process in reverse order per parent)
    for (const { node, index, parent } of diagramsToWrap.reverse()) {
      if (parent.children[index] === node) {
        parent.children[index] = wrapDiagram(node);
      }
    }
  };
}

