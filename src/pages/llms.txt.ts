import type { APIContext } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { getTagTaxonomy } from '../utils/tagTaxonomy';
import { tagHref } from '../utils/tagHref';
import { siteConfig } from '../site.config';
import { isFeatureEnabled, isUrlEnabled } from '../utils/features';

/**
 * Build-time generated `/llms.txt` following the llmstxt.org specification.
 * Pulls directly from the blog collection and tag taxonomy so new articles
 * and topics appear automatically on every build.
 */
export async function GET(context: APIContext) {
  const siteUrl = (context.site ? context.site.href : siteConfig.site.url).replace(/\/+$/, '');
  const abs = (path: string) => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const showHome = isFeatureEnabled('home');
  const showAbout = isFeatureEnabled('about');
  const showNow = isFeatureEnabled('now');
  const showLog = isFeatureEnabled('log');
  const showBlog = isFeatureEnabled('blog');
  const showPhotography = isFeatureEnabled('photography');
  const showTags = isFeatureEnabled('tags');
  const showContact = isFeatureEnabled('contact');

  const [posts, taxonomy, homeEntry, aboutEntry] = await Promise.all([
    showBlog ? getCollection('blog') : Promise.resolve([]),
    showTags ? getTagTaxonomy() : Promise.resolve({ sortedTags: [], photoTags: [], archiveMap: new Map(), contentTagSlugs: new Set() }),
    getEntry('pages', 'home'),
    getEntry('pages', 'about'),
  ]);

  const sortedPosts = posts
    .slice()
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const articleLines = sortedPosts.map(
    (post) => `- [${post.data.title}](${abs(`/blog/${post.id}/`)}): ${post.data.description}`
  );

  const topicLines = taxonomy.sortedTags.slice(0, 12).map((tag) => {
    const desc = `${tag.count} item${tag.count === 1 ? '' : 's'} across writing, updates, photographs, and experience.`;
    const candidateHref = tagHref(tag.slug);
    const resolvedHref = isUrlEnabled(candidateHref) ? candidateHref : `/tags/${tag.slug}/`;
    return `- [${tag.name}](${abs(resolvedHref)}): ${desc}`;
  });

  const introSummary = homeEntry?.data.intro
    ? `${homeEntry.data.intro.leftColumn} ${homeEntry.data.intro.rightColumn}`
    : siteConfig.site.description;
  const aboutSummary = aboutEntry?.body?.trim() ?? siteConfig.site.description;

  const socialProfileLines = [
    siteConfig.socials.github ? `- **GitHub:** ${siteConfig.socials.github}` : '',
    siteConfig.socials.gitlab ? `- **GitLab:** ${siteConfig.socials.gitlab}` : '',
    siteConfig.socials.linkedin ? `- **LinkedIn:** ${siteConfig.socials.linkedin}` : '',
    siteConfig.socials.instagram ? `- **Instagram:** ${siteConfig.socials.instagram}` : '',
  ].filter(Boolean);

  const corePageLines = [
    showHome ? `- [Home](${abs('/')}): ${homeEntry?.data.description ?? siteConfig.site.description}` : '',
    showAbout ? `- [About](${abs('/about/')}): ${aboutEntry?.data.description ?? 'Background, career history, and recommendations.'}` : '',
    showNow ? `- [Now](${abs('/now/')}): Living snapshot of current projects and focus.` : '',
    showLog
      ? `- [Log](${abs('/log/')}): ${showPhotography ? 'Short updates, site milestones, and photo additions.' : 'Short updates and site milestones.'}`
      : '',
    showBlog ? `- [Blog](${abs('/blog/')}): Writing, ideas, and articles.` : '',
    showPhotography ? `- [Photography](${abs('/photography/')}): Photographs and their stories.` : '',
    showTags ? `- [Tags & Topics](${abs('/tags/')}): Explore content by topic.` : '',
    showContact ? `- [Contact](${abs('/contact/')}): Public contact links and social channels.` : '',
  ].filter(Boolean);

  const content = [
    `# ${siteConfig.site.title}`,
    '',
    `> ${introSummary}`,
    '',
    aboutSummary,
    '',
    `- **Name:** ${siteConfig.author.name}`,
    `- **Role:** ${siteConfig.author.jobTitle}`,
    `- **Location:** ${siteConfig.author.location}`,
    `- **Website:** ${siteUrl}`,
    ...socialProfileLines,
    ...(corePageLines.length > 0 ? ['', '## Core Pages', '', ...corePageLines] : []),
    ...(showBlog && articleLines.length > 0 ? ['', '## Engineering Articles', '', ...articleLines] : []),
    ...(showTags && topicLines.length > 0 ? ['', '## Topics & Taxonomy', '', ...topicLines] : []),
    '',
    '## Full Context & Machine-Readable Indexes',
    '',
    `- [Full Site Archive (llms-full.txt)](${abs('/llms-full.txt')}): Complete, concatenated Markdown archive of all enabled site collections for direct ingestion into LLMs or RAG systems.`,
    `- [Structured Index (llms.json)](${abs('/llms.json')}): Machine-readable JSON index of pages, articles, topics, feeds, and LLM files, generated at build time.`,
    '',
  ].join('\n');

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
