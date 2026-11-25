import { visit } from 'unist-util-visit';

/**
 * Gives an image on its own line a visible caption when it has a title:
 * `![What the image shows](../../images/photo.jpg "The caption")` becomes a <figure> with the
 * caption in a <figcaption> below the image. The alt text still describes the image for screen
 * readers, and the title is used only as the caption, not as a hover tooltip. SVG graphics are
 * captioned earlier by `remark-inline-svg.mjs`.
 */
export function remarkImageCaptions() {
  return (tree) => {
    visit(tree, 'paragraph', (node) => {
      const image = node.children.length === 1 ? node.children[0] : undefined;
      const caption = image?.type === 'image' ? image.title?.trim() : undefined;
      if (!caption) return;

      image.title = null;
      node.data = { ...node.data, hName: 'figure', hProperties: { className: ['image-figure'] } };
      node.children.push({
        type: 'imageCaption',
        data: { hName: 'figcaption' },
        children: [{ type: 'text', value: caption }],
      });
    });
  };
}
