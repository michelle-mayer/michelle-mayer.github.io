import type { APIRoute } from 'astro';
import { themeConfig } from '../theme.config';

export const GET: APIRoute = () => {
  const domain = themeConfig.site.domain;

  const xsl = `<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>
          <xsl:choose>
            <xsl:when test="s:sitemapindex">Sitemap Index &#8212; ${domain}</xsl:when>
            <xsl:otherwise>XML Sitemap &#8212; ${domain}</xsl:otherwise>
          </xsl:choose>
        </title>
        <style>
          :root {
            --bg-color: #f9fafb;
            --card-bg: #ffffff;
            --text-main: #111827;
            --text-muted: #4b5563;
            --text-faint: #9ca3af;
            --border-color: #e5e7eb;
            --border-subtle: #f3f4f6;
            --row-hover: #f9fafb;
            --accent: #d97706;
            --accent-hover: #b45309;
            --accent-subtle: #fef3c7;
            --accent-subtle-text: #92400e;
            --ring: rgba(17, 24, 39, 0.05);
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --bg-color: #0b0f17;
              --card-bg: #111827;
              --text-main: #f9fafb;
              --text-muted: #9ca3af;
              --text-faint: #6b7280;
              --border-color: #1f2937;
              --border-subtle: #1e293b;
              --row-hover: rgba(255, 255, 255, 0.03);
              --accent: #f59e0b;
              --accent-hover: #fbbf24;
              --accent-subtle: rgba(245, 158, 11, 0.12);
              --accent-subtle-text: #fcd34d;
              --ring: rgba(255, 255, 255, 0.06);
            }
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            line-height: 1.6;
            padding: 2.5rem 1.25rem;
            -webkit-font-smoothing: antialiased;
          }

          .container {
            max-width: 56rem;
            margin: 0 auto;
          }

          header {
            margin-bottom: 2rem;
          }

          .top-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
          }

          .site-link {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--accent);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
          }

          .site-link:hover {
            color: var(--accent-hover);
          }

          .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.625rem;
            border-radius: 9999px;
            background: var(--accent-subtle);
            color: var(--accent-subtle-text);
            letter-spacing: 0.025em;
            text-transform: uppercase;
          }

          .notice-box {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 0.875rem;
            padding: 1.25rem 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px -1px var(--ring), 0 2px 4px -2px var(--ring);
          }

          .notice-title {
            font-size: 0.9375rem;
            font-weight: 600;
            margin-bottom: 0.375rem;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .notice-title svg {
            color: var(--accent);
          }

          .notice-desc {
            font-size: 0.875rem;
            color: var(--text-muted);
          }

          .stats-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            color: var(--text-muted);
          }

          .stats-count {
            font-weight: 600;
            color: var(--text-main);
          }

          .table-wrapper {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 0.875rem;
            overflow-x: auto;
            box-shadow: 0 4px 6px -1px var(--ring), 0 2px 4px -2px var(--ring);
          }

          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.875rem;
          }

          th {
            background: var(--card-bg);
            padding: 0.875rem 1.25rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border-color);
          }

          td {
            padding: 0.875rem 1.25rem;
            border-bottom: 1px solid var(--border-color);
            vertical-align: middle;
          }

          tr:last-child td {
            border-bottom: none;
          }

          tbody tr:hover {
            background-color: var(--row-hover);
          }

          .url-link {
            color: var(--text-main);
            text-decoration: none;
            word-break: break-all;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.8125rem;
          }

          .url-link:hover {
            color: var(--accent);
          }

          .date-cell {
            color: var(--text-faint);
            font-size: 0.8125rem;
            white-space: nowrap;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }

          .image-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.2rem 0.55rem;
            border-radius: 9999px;
            background: var(--accent-subtle);
            color: var(--accent-subtle-text);
            text-decoration: none;
          }

          details.image-details {
            margin-top: 0.375rem;
            font-size: 0.75rem;
          }

          details.image-details summary {
            cursor: pointer;
            color: var(--accent);
            font-weight: 500;
            user-select: none;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
          }

          details.image-details summary:hover {
            color: var(--accent-hover);
          }

          .image-list {
            margin-top: 0.5rem;
            padding-left: 0;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.375rem;
          }

          .image-item-link {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.75rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            word-break: break-all;
          }

          .image-item-link:hover {
            color: var(--accent);
          }

          footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
            text-align: center;
            font-size: 0.8125rem;
            color: var(--text-faint);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div class="top-bar">
              <a href="/" class="site-link">
                &#8592; Back to ${domain}
              </a>
              <span class="badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <xsl:choose>
                  <xsl:when test="s:sitemapindex">Sitemap Index</xsl:when>
                  <xsl:otherwise>XML Sitemap</xsl:otherwise>
                </xsl:choose>
              </span>
            </div>

            <div class="notice-box">
              <div class="notice-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                About this document
              </div>
              <p class="notice-desc">
                This XML sitemap is automatically generated by Astro for search engines (like Google and Bing) to index all accessible content on ${domain}. An XSLT stylesheet is applied to make it easily readable for human visitors.
              </p>
            </div>
          </header>

          <main>
            <xsl:choose>
              <xsl:when test="s:sitemapindex">
                <div class="stats-bar">
                  <span>Index Sitemaps</span>
                  <span>Total: <strong class="stats-count"><xsl:value-of select="count(s:sitemapindex/s:sitemap)"/></strong></span>
                </div>
                <div class="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Sitemap File</th>
                        <th style="width: 220px;">Last Modified</th>
                      </tr>
                    </thead>
                    <tbody>
                      <xsl:for-each select="s:sitemapindex/s:sitemap">
                        <tr>
                          <td>
                            <a class="url-link" href="{s:loc}">
                              <xsl:value-of select="s:loc"/>
                            </a>
                          </td>
                          <td class="date-cell">
                            <xsl:value-of select="s:lastmod"/>
                          </td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </div>
              </xsl:when>

              <xsl:when test="s:urlset">
                <div class="stats-bar">
                  <span>Indexed URLs</span>
                  <span>
                    URLs: <strong class="stats-count"><xsl:value-of select="count(s:urlset/s:url)"/></strong>
                    <xsl:if test="count(s:urlset/s:url/image:image) > 0">
                      &#183; Images: <strong class="stats-count"><xsl:value-of select="count(s:urlset/s:url/image:image)"/></strong>
                    </xsl:if>
                  </span>
                </div>
                <div class="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th style="width: 110px; text-align: center;">Images</th>
                        <th style="width: 220px;">Last Modified</th>
                      </tr>
                    </thead>
                    <tbody>
                      <xsl:for-each select="s:urlset/s:url">
                        <tr>
                          <td>
                            <a class="url-link" href="{s:loc}">
                              <xsl:value-of select="s:loc"/>
                            </a>
                            <xsl:if test="count(image:image) > 0">
                              <details class="image-details">
                                <summary>
                                  <span>View <xsl:value-of select="count(image:image)"/> image<xsl:if test="count(image:image) > 1">s</xsl:if></span>
                                </summary>
                                <ul class="image-list">
                                  <xsl:for-each select="image:image">
                                    <li>
                                      <a class="image-item-link" href="{image:loc}" target="_blank" rel="noopener">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                          <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                        <xsl:choose>
                                          <xsl:when test="image:title">
                                            <xsl:value-of select="image:title"/>
                                          </xsl:when>
                                          <xsl:otherwise>
                                            <xsl:value-of select="image:loc"/>
                                          </xsl:otherwise>
                                        </xsl:choose>
                                      </a>
                                    </li>
                                  </xsl:for-each>
                                </ul>
                              </details>
                            </xsl:if>
                          </td>
                          <td style="text-align: center;">
                            <xsl:choose>
                              <xsl:when test="count(image:image) > 0">
                                <span class="image-badge" title="{count(image:image)} bundled image(s)">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                  </svg>
                                  <xsl:value-of select="count(image:image)"/>
                                </span>
                              </xsl:when>
                              <xsl:otherwise>
                                <span style="color: var(--text-faint); font-size: 0.75rem;">&#8212;</span>
                              </xsl:otherwise>
                            </xsl:choose>
                          </td>
                          <td class="date-cell">
                            <xsl:value-of select="s:lastmod"/>
                          </td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </div>
              </xsl:when>
            </xsl:choose>
          </main>

          <footer>
            <p>Generated by ${domain} &#183; Sitemaps XML 0.9</p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`;

  return new Response(xsl, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

