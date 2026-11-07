import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { siteConfig } from './site.config';
import { parseSiteDate } from './utils/dates';

/** Date field pinned to `siteConfig.site.timeZone` when the frontmatter value has no UTC offset. */
const siteDate = () => z.preprocess((value) => parseSiteDate(value), z.date());

const sectionDepthSchema = z.union([
	z.string(),
	z.array(z.union([z.number(), z.string()])),
	z.object({
		min: z.union([z.number(), z.string()]).optional(),
		max: z.union([z.number(), z.string()]).optional(),
		minDepth: z.union([z.number(), z.string()]).optional(),
		maxDepth: z.union([z.number(), z.string()]).optional(),
		from: z.union([z.number(), z.string()]).optional(),
		to: z.union([z.number(), z.string()]).optional(),
		levels: z.array(z.union([z.number(), z.string()])).optional(),
	}),
]);

const sectionNavSchema = z.union([
	z.boolean(),
	sectionDepthSchema,
]);

const customSectionItemSchema = z.object({
	id: z.string(),
	label: z.string(),
});

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: siteDate(),
			updatedDate: siteDate().optional(),
			heroImage: image().optional(),
			heroImageAlt: z.string().optional(),
			author: z.string().optional().default(siteConfig.author.name),
			// Tags are required, at least one tag must be provided
			tags: z.array(z.string()).min(1, "At least one tag is required"),
			// Section navigation pills (optional, e.g. sectionNav: true, "h1 to h2", "h2", [1, 2])
			showSections: z.boolean().optional(),
			sectionNav: sectionNavSchema.optional(),
			sectionDepth: sectionDepthSchema.optional(),
			sections: z.array(customSectionItemSchema).optional(),
		}),
});

const log = defineCollection({
	// Load Markdown files in the `src/content/log/` directory.
	loader: glob({ base: './src/content/log', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		date: siteDate(),
		type: z.enum(['note', 'changelog']).optional().default('note'),
		tags: z.array(z.string()).optional().default([]),
	}),
});

const photography = defineCollection({
	// Load Markdown files in the `src/content/photography/` directory.
	loader: glob({ base: './src/content/photography', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		id: z.number(),
		filename: z.string(),
		title: z.string(),
		pubDate: siteDate(),
		dateFormatted: z.string().optional(),
		category: z.string(),
		location: z.string(),
		attribution: z.string().optional(),
		tags: z.array(z.string()).min(1, "At least one tag is required"),
	}),
});

const homeSectionHeaderSchema = z.object({
	heading: z.string(),
	subtitle: z.string(),
	linkLabel: z.string(),
	footerLinkLabel: z.string(),
});

const pages = defineCollection({
	// Load top-level page metadata & personal narrative from `src/content/pages/`.
	loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		pageTitle: z.string(),
		description: z.string(),
		ogTitle: z.string().optional(),
		ogTags: z.array(z.string()).optional(),
		eyebrow: z.string().optional(),
		heading: z.string().optional(),
		subtitle: z.string().optional(),

		// Homepage (`home.md`) structured fields
		intro: z
			.object({
				eyebrow: z.string(),
				heading: z.string(),
				leftColumn: z.string(),
				rightColumn: z.string(),
				ctaLabel: z.string(),
				ctaHref: z.string(),
			})
			.optional(),
		setupGuide: z
			.object({
				enabled: z.boolean().optional().default(true),
				eyebrow: z.string(),
				heading: z.string(),
				subtitle: z.string().optional(),
				steps: z.array(
					z.object({
						step: z.string(),
						badge: z.string().optional(),
						title: z.string(),
						description: z.string(),
						href: z.string(),
						ctaLabel: z.string().optional(),
					}),
				),
			})
			.optional(),
		photosSection: homeSectionHeaderSchema.optional(),
		blogSection: homeSectionHeaderSchema.optional(),
		logSection: homeSectionHeaderSchema.optional(),

		// About page (`about.md`) structured fields
		greeting: z.string().optional(),
		languagesHeading: z.string().optional(),
		languages: z
			.array(
				z.object({
					name: z.string(),
					nativeName: z.string().optional(),
					level: z.string(),
					badgeStyle: z.enum(['fluent', 'native', 'beginner']).default('fluent'),
				}),
			)
			.optional(),
		recommendations: z
			.object({
				eyebrow: z.string(),
				heading: z.string(),
			})
			.optional(),
		faq: z
			.object({
				eyebrow: z.string(),
				heading: z.string(),
				subtitle: z.string(),
				groups: z.array(
					z.object({
						title: z.string(),
						description: z.string(),
						items: z.array(
							z.object({
								question: z.string(),
								answerHtml: z.string(),
							}),
						),
					}),
				),
			})
			.optional(),
		contactSection: z
			.object({
				title: z.string(),
				subtitle: z.string(),
				subject: z.string(),
			})
			.optional(),

		// Now page (`now.md`) & Log page (`log.md`) structured fields
		badge: z.string().optional(),
		lastUpdated: z.string().optional(),
		introHtml: z.string().optional(),
		nowSections: z
			.array(
				z.object({
					icon: z.enum(['location', 'engineering', 'homelab', 'offline', 'reading']),
					title: z.string(),
					paragraphs: z.array(z.string()).optional(),
					subsections: z
						.array(
							z.object({
								title: z.string(),
								paragraphs: z.array(z.string()),
							}),
						)
						.optional(),
				}),
			)
			.optional(),

		// Contact page (`contact.md`) structured fields
		directCardTitle: z.string().optional(),
		locationLabel: z.string().optional(),
		locationSubtext: z.string().optional(),
		responseLabel: z.string().optional(),
		responseValue: z.string().optional(),
		socialsHeading: z.string().optional(),
		formTitle: z.string().optional(),
		formSubtitle: z.string().optional(),
	}),
});

export const collections = { blog, log, photography, pages };