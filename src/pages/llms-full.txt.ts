import type { APIContext } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { experiences } from '../data/experiences';
import { pictureLogs } from '../utils/pictureLogs';
import {
  featuredRecommendation,
  leftStackRecommendations,
  midLeftRecommendation,
  midRightRecommendation,
  rightStackRecommendations,
  type RecommendationItem,
} from '../data/recommendations';
import { getChangelogEntries } from '../utils/changelog';
import { getLogAnchorPageMap, getGalleryPhotoHref } from '../utils/logTimeline';
import { getPaginatedHref } from '../utils/pagination';
import { siteConfig } from '../site.config';
import { formatSiteDate } from '../utils/dates';
import { isFeatureEnabled } from '../utils/features';

/**
 * Build-time generated `/llms-full.txt`: complete concatenated Markdown archive
 * of profile, career history, peer recommendations, all blog articles, operational
 * status-updates, changelogs, and photography metadata for LLM / RAG ingestion.
 */
export async function GET(context: APIContext) {
  const siteUrl = (context.site ? context.site.href : siteConfig.site.url).replace(/\/+$/, '');
  const abs = (path: string) => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const showAbout = isFeatureEnabled('about');
  const showBlog = isFeatureEnabled('blog');
  const showLog = isFeatureEnabled('log');
  const showPhotography = isFeatureEnabled('photography');

  const [posts, logNotes, changelogs, logAnchorPages, aboutEntry] = await Promise.all([
    showBlog ? getCollection('blog') : Promise.resolve([]),
    showLog ? getCollection('log') : Promise.resolve([]),
    showLog ? getChangelogEntries() : Promise.resolve([]),
    showLog ? getLogAnchorPageMap() : Promise.resolve({} as Record<string, number>),
    getEntry('pages', 'about'),
  ]);

  const sortedPosts = posts
    .slice()
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const sortedLogs = logNotes
    .slice()
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const formatDate = (d: Date) =>
    formatSiteDate(d, { year: 'numeric', month: 'short', day: '2-digit' });

  const careerBlocks = experiences.map((exp) => {
    const lines = [
      `### ${exp.role} — ${exp.company}`,
      `- Period: ${exp.period}${exp.duration ? ` (${exp.duration})` : ''}`,
      `- Location: ${exp.location}`,
    ];
    if (exp.progression) lines.push(`- ${exp.progression}`);
    if (exp.skills.length > 0) lines.push(`- Skills: ${exp.skills.join(', ')}`);
    lines.push('', ...exp.highlights.map((h) => `- ${h}`));
    return lines.join('\n');
  });

  const allRecs = [
    featuredRecommendation,
    ...leftStackRecommendations,
    midLeftRecommendation,
    midRightRecommendation,
    ...rightStackRecommendations,
  ].filter((rec): rec is RecommendationItem => rec !== null);
  const recBlocks = allRecs.map(
    (rec) => `### Peer Recommendation (${rec.initials})\n\n${rec.paragraphs.join('\n\n')}`
  );

  const articleBlocks = sortedPosts.map((post) => {
    const body = (post.body || '').trim();
    return [
      `# ${post.data.title}`,
      `- URL: ${abs(`/blog/${post.id}/`)}`,
      `- Published Date: ${formatDate(post.data.pubDate)}`,
      ...(post.data.updatedDate ? [`- Updated Date: ${formatDate(post.data.updatedDate)}`] : []),
      `- Tags: ${post.data.tags.join(', ')}`,
      `- Description: ${post.data.description}`,
      '',
      body,
    ].join('\n');
  });

  const logBlocks = sortedLogs.map((note) => {
    const slug = note.id.replace(/\.[^/.]+$/, '');
    return [
      `## Status-Update: ${note.data.title}`,
      `- URL: ${abs(getPaginatedHref('/log', logAnchorPages[slug] ?? 1, `#${slug}`))}`,
      `- Date: ${formatDate(note.data.date)}`,
      ...(note.data.tags.length > 0 ? [`- Tags: ${note.data.tags.join(', ')}`] : []),
      '',
      (note.body || '').trim(),
    ].join('\n');
  });

  const changelogBlocks = changelogs.map((cl) =>
    [
      `## Changelog: ${cl.title}`,
      `- URL: ${abs(getPaginatedHref('/log', logAnchorPages[cl.id] ?? 1, `#${cl.id}`))}`,
      `- Date: ${formatDate(cl.date)}`,
      '',
      cl.rawMarkdown.trim(),
    ].join('\n')
  );

  const photoBlocks = pictureLogs.map(
    (p) =>
      `- **${p.title}** (${p.dateFormatted}, ${p.location}) [${p.category}] — ${p.story} (${abs(getGalleryPhotoHref(p.id))})`
  );

  const sections = [
    `# ${siteConfig.site.title} - Full Site Documentation Archive`,
    `> Complete concatenated archive of ${siteConfig.site.domain} for LLM ingestion, agent analysis, and retrieval.`,
    `> Canonical URL: ${siteUrl}`,
    ...(showAbout
      ? [
          '',
          '---',
          '',
          `# About ${siteConfig.author.name}`,
          `- Role: ${siteConfig.author.jobTitle}`,
          `- Location: ${siteConfig.author.location}`,
          `- URL: ${abs('/about/')}`,
          '',
          '## Summary',
          aboutEntry?.body?.trim() ?? siteConfig.site.description,
          '',
          '## Career History',
          '',
          careerBlocks.join('\n\n'),
          '',
          '## Peer Recommendations',
          '',
          recBlocks.join('\n\n'),
        ]
      : []),
    ...(showBlog && articleBlocks.length > 0
      ? [
          '',
          '---',
          '',
          '# Articles Archive',
          '',
          '---',
          '',
          articleBlocks.join('\n\n---\n\n'),
        ]
      : []),
    ...(showLog && logBlocks.length > 0
      ? [
          '',
          '---',
          '',
          '# Operational Logs & Status-Updates',
          '',
          logBlocks.join('\n\n---\n\n'),
        ]
      : []),
    ...(showLog && changelogBlocks.length > 0
      ? [
          '',
          '---',
          '',
          '# Site Changelogs',
          '',
          changelogBlocks.join('\n\n---\n\n'),
        ]
      : []),
    ...(showPhotography && photoBlocks.length > 0
      ? [
          '',
          '---',
          '',
          '# Photography Portfolio & Photo Rolls',
          `- URL: ${abs('/photography/')}`,
          `- Total Photographs: ${pictureLogs.length}`,
          '',
          photoBlocks.join('\n'),
        ]
      : []),
    '',
  ];

  return new Response(sections.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
