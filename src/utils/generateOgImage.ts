import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { themeConfig } from '../theme.config';
import { formatSiteDate } from './dates';

export type OgTheme =
  | 'amber'
  | 'indigo'
  | 'emerald'
  | 'cyan'
  | 'fuchsia'
  | 'blue'
  | 'violet';

export interface OgThemeColors {
  primary: string;
  light: string;
  dark: string;
  glow1: string;
  glow2: string;
  badgeBg: string;
  badgeBorder: string;
  buttonText: string;
}

export const OG_THEMES: Record<OgTheme, OgThemeColors> = {
  amber: {
    primary: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    glow1: 'rgba(245, 158, 11, 0.28)',
    glow2: 'rgba(234, 88, 12, 0.12)',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    buttonText: '#0f172a',
  },
  indigo: {
    primary: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    glow1: 'rgba(99, 102, 241, 0.28)',
    glow2: 'rgba(129, 140, 248, 0.12)',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    badgeBorder: 'rgba(99, 102, 241, 0.35)',
    buttonText: '#ffffff',
  },
  emerald: {
    primary: '#10b981',
    light: '#34d399',
    dark: '#059669',
    glow1: 'rgba(16, 185, 129, 0.28)',
    glow2: 'rgba(5, 150, 105, 0.12)',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    buttonText: '#06281e',
  },
  cyan: {
    primary: '#06b6d4',
    light: '#22d3ee',
    dark: '#0891b2',
    glow1: 'rgba(6, 182, 212, 0.28)',
    glow2: 'rgba(8, 145, 178, 0.12)',
    badgeBg: 'rgba(6, 182, 212, 0.12)',
    badgeBorder: 'rgba(6, 182, 212, 0.35)',
    buttonText: '#082f49',
  },
  fuchsia: {
    primary: '#d946ef',
    light: '#e879f9',
    dark: '#a21caf',
    glow1: 'rgba(217, 70, 239, 0.28)',
    glow2: 'rgba(162, 28, 175, 0.12)',
    badgeBg: 'rgba(217, 70, 239, 0.12)',
    badgeBorder: 'rgba(217, 70, 239, 0.35)',
    buttonText: '#ffffff',
  },
  blue: {
    primary: '#3b82f6',
    light: '#60a5fa',
    dark: '#1d4ed8',
    glow1: 'rgba(59, 130, 246, 0.28)',
    glow2: 'rgba(29, 78, 216, 0.12)',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeBorder: 'rgba(59, 130, 246, 0.35)',
    buttonText: '#ffffff',
  },
  violet: {
    primary: '#8b5cf6',
    light: '#a78bfa',
    dark: '#6d28d9',
    glow1: 'rgba(139, 92, 246, 0.28)',
    glow2: 'rgba(109, 40, 217, 0.12)',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    badgeBorder: 'rgba(139, 92, 246, 0.35)',
    buttonText: '#ffffff',
  },
};

export function resolveOgTheme(
  theme?: OgTheme,
  badge?: string,
  title?: string
): OgTheme {
  if (theme && OG_THEMES[theme]) return theme;
  const b = (badge || '').toLowerCase();
  const t = (title || '').toLowerCase();
  if (b.includes('photograph') || b.includes('gallery')) return 'fuchsia';
  if (b.includes('engineering article') || b.includes('blog') || t.includes('blog')) return 'cyan';
  if (b.includes('living snapshot') || b.includes('doing now') || t.includes('doing now')) return 'emerald';
  if (b.includes('profile') || b.includes('about')) return 'indigo';
  if (b.includes('contact') || b.includes('direct connect')) return 'blue';
  if (b.includes('topic') || b.includes('taxonomy')) return 'violet';
  if (b.includes('status-update') || b.includes('changelog') || b.includes('stream')) return 'amber';
  return 'amber';
}

export interface OgImageProps {
  title: string;
  description?: string;
  badge?: string;
  pubDate?: Date | string;
  updatedDate?: Date | string;
  readingTime?: string;
  tags?: string[];
  ctaText?: string;
  photoFilename?: string;
  theme?: OgTheme;
}

export interface PolaroidThumbnail {
  base64: string;
  width: number;
  height: number;
}

const polaroidCache = new Map<string, PolaroidThumbnail>();

/**
 * Generate a high-resolution Dutch-angle (-3.5°) Polaroid frame with realistic
 * drop shadow for photography Open Graph social cards.
 */
export async function getPolaroidThumbnail(filename: string): Promise<PolaroidThumbnail | null> {
  if (polaroidCache.has(filename)) {
    return polaroidCache.get(filename)!;
  }

  const photoPath = path.resolve(process.cwd(), 'src/images/photography', filename);
  if (!fs.existsSync(photoPath)) return null;

  try {
    const photoBuf = fs.readFileSync(photoPath);
    const meta = await sharp(photoBuf).metadata();
    const isPortrait = (meta.width || 0) < (meta.height || 0);

    let photoW: number;
    let photoH: number;
    if (isPortrait) {
      photoW = 230;
      photoH = 290;
    } else {
      photoW = 320;
      photoH = 240;
    }

    const resizedPhoto = await sharp(photoBuf)
      .resize(photoW, photoH, { fit: 'cover' })
      .toBuffer();

    const padH = 14;
    const padTop = 14;
    const padBottom = 48;
    const frameW = photoW + padH * 2;
    const frameH = photoH + padTop + padBottom;

    const frameSvg = Buffer.from(`
      <svg width="${frameW}" height="${frameH}">
        <defs>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f3f1ec"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${frameW}" height="${frameH}" rx="4" fill="url(#cardGrad)"/>
        <rect x="${padH - 0.5}" y="${padTop - 0.5}" width="${photoW + 1}" height="${photoH + 1}" fill="none" stroke="#e2e8f0" stroke-width="1"/>
      </svg>
    `);

    const polaroidBase = await sharp(frameSvg)
      .composite([{ input: resizedPhoto, left: padH, top: padTop }])
      .png()
      .toBuffer();

    // Dutch angle: -3.5 degrees
    const rotated = await sharp(polaroidBase)
      .rotate(-3.5, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const rotMeta = await sharp(rotated).metadata();
    const rotW = rotMeta.width || frameW;
    const rotH = rotMeta.height || frameH;

    const shadowMask = await sharp(rotated)
      .ensureAlpha()
      .extractChannel(3)
      .blur(16)
      .toBuffer();

    const shadowLayer = await sharp({
      create: {
        width: rotW,
        height: rotH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.7 },
      },
    })
      .composite([{ input: shadowMask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    const canvasW = rotW + 60;
    const canvasH = rotH + 60;

    const finalComposite = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: shadowLayer, left: 30 + 4, top: 30 + 18 },
        { input: rotated, left: 30, top: 30 },
      ])
      .png()
      .toBuffer();

    const result: PolaroidThumbnail = {
      base64: 'data:image/png;base64,' + finalComposite.toString('base64'),
      width: canvasW,
      height: canvasH,
    };
    polaroidCache.set(filename, result);
    return result;
  } catch (err) {
    console.warn(`[generateOgImage] Failed to generate polaroid for ${filename}:`, err);
    return null;
  }
}

// In-memory font cache to keep build blazing fast across hundreds of static routes
let fontCache: {
  regular: Buffer;
  semiBold: Buffer;
  bold: Buffer;
} | null = null;

function loadFonts() {
  if (fontCache) return fontCache;

  const fontDir = path.resolve('node_modules/@fontsource/inter/files');
  fontCache = {
    regular: fs.readFileSync(path.join(fontDir, 'inter-latin-400-normal.woff')),
    semiBold: fs.readFileSync(path.join(fontDir, 'inter-latin-600-normal.woff')),
    bold: fs.readFileSync(path.join(fontDir, 'inter-latin-700-normal.woff')),
  };

  return fontCache;
}

/**
 * Format a Date object or string into "MMM D, YYYY" (e.g. "Oct 27, 2026")
 */
function formatDate(d: Date | string | undefined): string | null {
  if (!d) return null;
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  return formatSiteDate(dateObj);
}

function renderMetaIcon(icon: 'calendar' | 'clock' | 'pin' | 'refresh', color = '#f59e0b') {
  if (icon === 'calendar') {
    return {
      type: 'svg',
      props: {
        width: '16',
        height: '16',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'flex' },
        children: [
          { type: 'rect', props: { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' } },
          { type: 'line', props: { x1: '16', y1: '2', x2: '16', y2: '6' } },
          { type: 'line', props: { x1: '8', y1: '2', x2: '8', y2: '6' } },
          { type: 'line', props: { x1: '3', y1: '10', x2: '21', y2: '10' } },
        ],
      },
    };
  }
  if (icon === 'clock') {
    return {
      type: 'svg',
      props: {
        width: '16',
        height: '16',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'flex' },
        children: [
          { type: 'circle', props: { cx: '12', cy: '12', r: '10' } },
          { type: 'polyline', props: { points: '12,6 12,12 16,14' } },
        ],
      },
    };
  }
  if (icon === 'pin') {
    return {
      type: 'svg',
      props: {
        width: '16',
        height: '16',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'flex' },
        children: [
          { type: 'path', props: { d: 'M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z' } },
          { type: 'circle', props: { cx: '12', cy: '10', r: '3' } },
        ],
      },
    };
  }
  if (icon === 'refresh') {
    return {
      type: 'svg',
      props: {
        width: '16',
        height: '16',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'flex' },
        children: [
          { type: 'path', props: { d: 'M23 4v6h-6' } },
          { type: 'path', props: { d: 'M1 20v-6h6' } },
          { type: 'path', props: { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' } },
        ],
      },
    };
  }
  return null;
}

function renderArrowRightIcon() {
  return {
    type: 'svg',
    props: {
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2.5',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      style: { display: 'flex' },
      children: [
        { type: 'line', props: { x1: '5', y1: '12', x2: '19', y2: '12' } },
        { type: 'polyline', props: { points: '12 5 19 12 12 19' } },
      ],
    },
  };
}

function resolveCtaLabel(badge?: string, customCta?: string): string {
  if (customCta) return customCta;
  if (!badge) return 'Explore Site';
  const b = badge.toLowerCase();
  if (b.includes('photograph')) return 'View Photo';
  if (b.includes('engineering article')) return 'Read Article';
  if (b.includes('status-update') || b.includes('changelog') || b.includes('stream')) return 'See Note';
  if (b.includes('gallery') || b.includes('photography')) return 'View Gallery';
  if (b.includes('topic')) return 'Explore Topic';
  if (b.includes('profile')) return 'View Profile';
  if (b.includes('contact') || b.includes('direct connect')) return 'Get in Touch';
  return 'Explore Site';
}

/**
 * Build the virtual DOM structure for Satori
 */
function buildOgCardVdom(props: OgImageProps, polaroid?: PolaroidThumbnail | null) {
  const {
    title,
    description,
    badge = 'Article',
    pubDate,
    updatedDate,
    readingTime,
    tags = [],
    ctaText,
    theme,
  } = props;

  const activeTheme = resolveOgTheme(theme, badge, title);
  const t = OG_THEMES[activeTheme];

  // Responsive font size based on title length
  const titleLen = title.length;
  let titleFontSize = '48px';
  if (polaroid) {
    if (titleLen < 26) titleFontSize = '46px';
    else if (titleLen > 48) titleFontSize = '36px';
    else titleFontSize = '40px';
  } else {
    if (titleLen < 32) titleFontSize = '56px';
    else if (titleLen > 72) titleFontSize = '40px';
  }

  const formattedPub = formatDate(pubDate);
  const formattedUpd = formatDate(updatedDate);
  const showUpdated = formattedUpd && formattedUpd !== formattedPub;

  // Build metadata items
  interface MetaItem {
    icon: 'calendar' | 'clock' | 'pin' | 'refresh';
    label: string;
  }

  const metaItems: MetaItem[] = [];
  if (formattedPub) metaItems.push({ icon: 'calendar', label: formattedPub });
  if (showUpdated) metaItems.push({ icon: 'refresh', label: `Updated ${formattedUpd}` });
  if (readingTime) metaItems.push({ icon: 'clock', label: readingTime });
  if (themeConfig.openGraph.locationPinLabel) {
    metaItems.push({ icon: 'pin', label: themeConfig.openGraph.locationPinLabel });
  }

  const ctaLabel = resolveCtaLabel(badge, ctaText);

  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
        backgroundColor: '#090d16',
        backgroundImage: `
          radial-gradient(circle at 88% 12%, ${t.glow1} 0%, ${t.glow2} 35%, transparent 70%),
          radial-gradient(circle at 10% 95%, ${t.glow1} 0%, transparent 60%)
        `,
        fontFamily: 'Inter',
        color: '#f8fafc',
        boxSizing: 'border-box',
        position: 'relative',
      },
      children: [
        // Top glowing accent border flare line (signature themed aesthetic)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: '60px',
              right: '60px',
              height: '3px',
              backgroundImage: `linear-gradient(90deg, transparent 0%, ${t.light} 30%, ${t.dark} 60%, transparent 100%)`,
              borderRadius: '2px',
            },
          },
        },
        // Top row: Category badge & Brand header
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            },
            children: [
              // Badge Pill
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    backgroundColor: t.badgeBg,
                    border: `1px solid ${t.badgeBorder}`,
                    color: t.light,
                    fontSize: '15px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '8px',
                          height: '8px',
                          borderRadius: '9999px',
                          backgroundColor: t.primary,
                        },
                      },
                    },
                    badge,
                  ],
                },
              },
              // Site Brand with compass mark
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#e2e8f0',
                    fontSize: '15px',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                  },
                  children: [
                    // Compass needle icon SVG
                    {
                      type: 'svg',
                      props: {
                        width: '20',
                        height: '20',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        style: { display: 'flex' },
                        children: [
                          {
                            type: 'polygon',
                            props: {
                              points: '12,2 15,12 9,12',
                              fill: t.primary,
                            },
                          },
                          {
                            type: 'polygon',
                            props: {
                              points: '12,22 9,12 15,12',
                              fill: 'none',
                              stroke: '#cbd5e1',
                              strokeWidth: '1.5',
                            },
                          },
                        ],
                      },
                    },
                    themeConfig.openGraph.brandLabel,
                    {
                      type: 'span',
                      props: {
                        style: { color: '#64748b', fontWeight: 400, letterSpacing: 'normal' },
                        children: `•  ${themeConfig.site.domain}`,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Middle block: Title & Description (with Dutch-angle Polaroid on right if present)
        polaroid
          ? {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  gap: '36px',
                  margin: 'auto 0',
                },
                children: [
                  // Left column: Title & Description
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        flex: 1,
                        maxWidth: '620px',
                      },
                      children: [
                        {
                          type: 'h1',
                          props: {
                            style: {
                              fontSize: titleFontSize,
                              fontWeight: 700,
                              lineHeight: 1.15,
                              color: '#ffffff',
                              margin: 0,
                              letterSpacing: '-0.025em',
                            },
                            children: title,
                          },
                        },
                        description
                          ? {
                              type: 'p',
                              props: {
                                style: {
                                  fontSize: '19px',
                                  fontWeight: 400,
                                  lineHeight: 1.45,
                                  color: '#94a3b8',
                                  margin: 0,
                                },
                                children: description,
                              },
                            }
                          : null,
                      ].filter(Boolean),
                    },
                  },
                  // Right column: Tilted Polaroid Frame
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      },
                      children: [
                        {
                          type: 'img',
                          props: {
                            src: polaroid.base64,
                            width: polaroid.width,
                            height: polaroid.height,
                            style: { display: 'flex' },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            }
          : {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  maxWidth: '1070px',
                  margin: 'auto 0',
                },
                children: [
                  {
                    type: 'h1',
                    props: {
                      style: {
                        fontSize: titleFontSize,
                        fontWeight: 700,
                        lineHeight: 1.18,
                        color: '#ffffff',
                        margin: 0,
                        letterSpacing: '-0.025em',
                      },
                      children: title,
                    },
                  },
                  description
                    ? {
                        type: 'p',
                        props: {
                          style: {
                            fontSize: '22px',
                            fontWeight: 400,
                            lineHeight: 1.48,
                            color: '#94a3b8',
                            margin: 0,
                          },
                          children: description,
                        },
                      }
                    : null,
                ].filter(Boolean),
              },
            },
        // Bottom row: Metadata & CTA Button
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '22px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              width: '100%',
            },
            children: [
              // Left: metadata items and tag chips
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    color: '#cbd5e1',
                    fontSize: '15px',
                    fontWeight: 500,
                  },
                  children: [
                    ...metaItems.flatMap((item, i) => [
                      i > 0
                        ? {
                            type: 'span',
                            props: {
                              style: { color: '#475569', margin: '0 2px' },
                              children: '•',
                            },
                          }
                        : null,
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          },
                          children: [
                            renderMetaIcon(item.icon, t.primary),
                            item.label,
                          ].filter(Boolean),
                        },
                      },
                    ]).filter(Boolean),
                    // If tags exist, add subtle tag chips
                    ...(tags && tags.length > 0
                      ? [
                          {
                            type: 'span',
                            props: {
                              style: { color: '#475569', margin: '0 2px' },
                              children: '•',
                            },
                          },
                          ...tags.slice(0, 2).map((tag) => ({
                            type: 'div',
                            props: {
                              style: {
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                border: `1px solid ${t.badgeBorder}`,
                                color: t.light,
                                fontSize: '13px',
                                fontWeight: 600,
                              },
                              children: `#${tag}`,
                            },
                          })),
                        ]
                      : []),
                  ],
                },
              },
              // Right: Themed Call-to-Action button
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    backgroundImage: `linear-gradient(135deg, ${t.light} 0%, ${t.primary} 60%, ${t.dark} 100%)`,
                    color: t.buttonText,
                    fontSize: '16px',
                    fontWeight: 700,
                    boxShadow: `0 4px 20px ${t.glow1}`,
                    letterSpacing: '0.02em',
                    flexShrink: 0,
                  },
                  children: [
                    ctaLabel,
                    renderArrowRightIcon(),
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

const OG_CACHE_DIR = path.resolve(process.cwd(), '.cache/og-images');
let cacheDirReady = false;
let templateDigestCache: string | null = null;

function getTemplateDigest(): string {
  if (templateDigestCache) return templateDigestCache;
  try {
    const srcPath = path.resolve(process.cwd(), 'src/utils/generateOgImage.ts');
    const content = fs.readFileSync(srcPath);
    templateDigestCache = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  } catch {
    templateDigestCache = 'v1';
  }
  return templateDigestCache;
}

function ensureCacheDir(): void {
  if (cacheDirReady) return;
  fs.mkdirSync(OG_CACHE_DIR, { recursive: true });
  cacheDirReady = true;
}

/**
 * Computes a deterministic SHA-256 cache key for an Open Graph card.
 * Incorporates the template layout version, theme, title, description, badge, dates, tags, and CTA.
 */
export function computeOgCacheKey(props: OgImageProps): string {
  const cacheKeyPayload = JSON.stringify({
    v: getTemplateDigest(),
    format: 'jpeg-q82',
    title: props.title,
    theme: resolveOgTheme(props.theme, props.badge, props.title),
    description: props.description ?? null,
    badge: props.badge ?? 'Article',
    pubDate: formatDate(props.pubDate),
    updatedDate: formatDate(props.updatedDate),
    readingTime: props.readingTime ?? null,
    tags: (props.tags ?? []).slice(0, 3),
    ctaText: props.ctaText ?? null,
    photoFilename: props.photoFilename ?? null,
  });
  return crypto.createHash('sha256').update(cacheKeyPayload).digest('hex');
}

/**
 * Generate a 1200x630 JPEG buffer for Open Graph and Twitter Card sharing,
 * backed by a persistent content-addressed disk cache in `.cache/og-images/`.
 */
export async function generateOgImage(props: OgImageProps): Promise<Buffer> {
  const cacheHash = computeOgCacheKey(props);
  const cacheFile = path.join(OG_CACHE_DIR, `${cacheHash}.jpg`);

  try {
    if (fs.existsSync(cacheFile)) {
      return fs.readFileSync(cacheFile);
    }
  } catch {
    // Fall through to full render on any cache read failure
  }

  const polaroid = props.photoFilename ? await getPolaroidThumbnail(props.photoFilename) : null;
  const fonts = loadFonts();
  const vdom = buildOgCardVdom(props, polaroid);

  const svg = await satori(vdom as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fonts.regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fonts.semiBold, weight: 600, style: 'normal' },
      { name: 'Inter', data: fonts.bold, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngBuffer = resvg.render().asPng();
  const jpegBuffer = await sharp(pngBuffer)
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  try {
    ensureCacheDir();
    const tmpFile = `${cacheFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, jpegBuffer);
    fs.renameSync(tmpFile, cacheFile);
  } catch {
    // Ignore non-fatal cache write errors
  }

  return jpegBuffer;
}

