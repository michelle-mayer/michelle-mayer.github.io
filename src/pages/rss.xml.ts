import rss, { type RSSFeedItem } from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../utils/consts';
import { getUnifiedFeedItems } from '../utils/feedItems';
import { siteConfig } from '../site.config';

export async function GET(context: APIContext) {
  const siteUrl = (context.site ? context.site.href : siteConfig.site.url).replace(/\/+$/, '');

  const unifiedItems = await getUnifiedFeedItems(siteUrl);

  const items: RSSFeedItem[] = unifiedItems.map((item) => ({
    title: item.title,
    pubDate: item.published,
    description: item.summary,
    link: item.link,
    categories: item.categories,
    content: item.content ? item.content.replace(/]]>/g, ']]&gt;') : undefined,
    author: item.author,
  }));

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: siteUrl,
    items,
  });
}
