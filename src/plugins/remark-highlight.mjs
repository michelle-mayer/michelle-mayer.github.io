import { visit } from 'unist-util-visit';

// Exactly two equals signs, so `===` and longer runs are left alone.
const MARKER = /(?<!=)==(?!=)/;

/**
 * Turns `==a key phrase==` into `<mark>a key phrase</mark>`, which `BlogPost.astro` styles as a
 * highlighter stroke. As with bold and italics, the opening `==` must be followed by a non-space
 * and the closing `==` preceded by one, so prose like `x == y` is left alone. Code is never
 * touched, and a highlight can wrap other formatting, e.g. `==a **bold** idea==`.
 */
export function remarkHighlight() {
  return (tree) => {
    visit(tree, (node) => {
      if (!node.children?.some((child) => child.type === 'text' && MARKER.test(child.value))) return;
      node.children = highlight(node.children);
    });
  };
}

// The character next to a marker that sits at the edge of a text node.
function neighborChar(sibling, side) {
  if (!sibling) return undefined;
  if (sibling.type === 'break') return '\n';
  if (sibling.type === 'text') return side === 'before' ? sibling.value.at(-1) : sibling.value[0];
  return 'x'; // inline formatting, links, or code: treat as a word character
}

const isWordChar = (char) => char !== undefined && !/\s/.test(char);

function highlight(children) {
  const out = [];
  let opener = -1; // index in `out` of an unmatched opening marker

  children.forEach((child, i) => {
    if (child.type !== 'text') {
      out.push(child);
      return;
    }

    const parts = child.value.split(new RegExp(MARKER.source, 'g'));
    parts.forEach((part, j) => {
      if (j > 0) {
        const before = parts[j - 1] ? parts[j - 1].at(-1) : neighborChar(children[i - 1], 'before');
        const after = part ? part[0] : neighborChar(children[i + 1], 'after');

        if (opener >= 0 && out.length > opener + 1 && isWordChar(before)) {
          const mark = { type: 'mark', data: { hName: 'mark' }, children: out.splice(opener + 1) };
          out.splice(opener, 1, mark);
          opener = -1;
        } else if (opener < 0 && isWordChar(after)) {
          opener = out.length;
          out.push({ type: 'text', value: '==' });
        } else {
          out.push({ type: 'text', value: '==' });
        }
      }
      if (part) out.push({ type: 'text', value: part });
    });
  });

  return out;
}
