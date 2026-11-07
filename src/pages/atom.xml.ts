import type { APIContext } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_AUTHOR } from '../utils/consts';
import { getUnifiedFeedItems } from '../utils/feedItems';
import { siteConfig } from '../site.config';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function wrapCdata(content: string): string {
  return `<![CDATA[${content.replace(/]]>/g, ']]&gt;')}]]>`;
}

export async function GET(context: APIContext) {
  const siteUrl = (context.site ? context.site.href : siteConfig.site.url).replace(/\/+$/, '');
  const authorEmail = escapeXml(siteConfig.author.email);

  const allItems = await getUnifiedFeedItems(siteUrl);

  const latestDate = allItems[0]?.published || new Date();
  const feedUpdated = latestDate.toISOString();
  const feedId = `${siteUrl}/`;
  const selfUrl = `${siteUrl}/atom.xml`;
  const iconUrl = `${siteUrl}/favicon.svg`;
  const logoUrl = `${siteUrl}/logo.svg`;

  const entriesXml = allItems.map((item) => {
    const categoriesXml = item.categories
      .map((cat) => `    <category term="${escapeXml(cat)}" label="${escapeXml(cat)}" />`)
      .join('\n');

    const contentXml = item.content
      ? `\n    <content type="html">${wrapCdata(item.content)}</content>`
      : '';

    return `  <entry>
    <title>${escapeXml(item.title)}</title>
    <link href="${escapeXml(item.link)}" rel="alternate" type="text/html" />
    <id>${escapeXml(item.id)}</id>
    <published>${item.published.toISOString()}</published>
    <updated>${item.updated.toISOString()}</updated>
    <summary type="html">${wrapCdata(item.summary)}</summary>${contentXml}
${categoriesXml}
    <author>
      <name>${escapeXml(item.author)}</name>
      <email>${authorEmail}</email>
      <uri>${siteUrl}/</uri>
    </author>
  </entry>`;
  }).join('\n');

  const atomXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(SITE_TITLE)}</title>
  <subtitle>${escapeXml(SITE_DESCRIPTION)}</subtitle>
  <link href="${selfUrl}" rel="self" type="application/atom+xml" />
  <link href="${siteUrl}/" rel="alternate" type="text/html" />
  <id>${feedId}</id>
  <updated>${feedUpdated}</updated>
  <icon>${iconUrl}</icon>
  <logo>${logoUrl}</logo>
  <rights>© ${new Date().getFullYear()} ${escapeXml(SITE_AUTHOR)}</rights>
  <author>
    <name>${escapeXml(SITE_AUTHOR)}</name>
    <email>${authorEmail}</email>
    <uri>${siteUrl}/</uri>
  </author>
${entriesXml}
</feed>
`;

  return new Response(atomXml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  });
}
