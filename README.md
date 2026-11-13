# Michelle Mayer

An independent personal-site starter for
[michelle-mayer.github.io](https://michelle-mayer.github.io), built with Astro
and Tailwind CSS.

Home, About, Blog, Now, Contact, and Tags are enabled.
Photography and Activity Log are disabled across navigation, homepage sections,
routes, tags, and feeds. Their source content is retained; set
`features.photography` or `features.log` to `true` in
[src/theme.config.ts](./src/theme.config.ts) to restore them.
The initial content and images are placeholders, not a finished personal profile.
Contact forms and analytics are disabled.

## Run locally

Use Node.js 24 or newer. These commands work in Windows PowerShell without
changing its script execution policy:

```powershell
Set-Location 'C:\source\website\michelle-mayer.github.io'
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run dev
```

Open <http://localhost:4321>. Stop the server with Ctrl+C.
On other shells, use `npm` and `npx` instead of `npm.cmd` and `npx.cmd`.
Chromium is used to render Mermaid diagrams at build time, not by site visitors.

## Make it yours

| What to edit | Where |
| --- | --- |
| Site title, description, bio, public email, social links, timezone | [src/site.config.ts](./src/site.config.ts) |
| Logo wordmark, feature switches, integrations, navigation, footer credit | [src/theme.config.ts](./src/theme.config.ts) |
| Page introductions and About/Now text | [src/content/pages/](./src/content/pages/) |
| Homepage name, typewriter phrases, and introduction | [src/content/pages/home.md](./src/content/pages/home.md) |
| Accent color scale | [src/styles/global.css](./src/styles/global.css) |
| Blog posts | [src/content/blog/](./src/content/blog/) |
| Short updates | [src/content/log/](./src/content/log/) |
| Photo metadata and stories | [src/content/photography/](./src/content/photography/) |
| Photo files | [src/images/photography/](./src/images/photography/) |
| Profile picture | [src/images/author.jpg](./src/images/author.jpg) |
| Career history and approved recommendations | [src/data/](./src/data/) |
| Tooltip terms (initially just Astro and Markdown) | [src/data/techTerms.ts](./src/data/techTerms.ts) |
| Homepage ASCII animations (typing cat and typewriter) | [src/ascii/](./src/ascii/) |
| Site release notes, also displayed in the activity log | [CHANGELOG.md](./CHANGELOG.md) |

The welcome post, first log note, and photo placeholder demonstrate the required
frontmatter. Duplicate those files to add content, or replace them with your own.
Each photograph needs a unique numeric `id` and a `filename` matching its image.
Empty career history and recommendations are hidden on About.

The header and footer wordmark is `logo.text` in
[src/theme.config.ts](./src/theme.config.ts). The footer links to Contact, each
profile set in `socials`, and RSS. Set `footer.showThemeAttribution` to `false`
to hide the theme credit.

### Colors

The accent color is a lavender scale, `--color-accent-50` through
`--color-accent-950`, in the `@theme` block of
[global.css](./src/styles/global.css). Components use Tailwind `accent-*`
utilities, so changing those 11 values retints links, buttons, chips, and
highlights. Recheck text contrast in both themes after changing them.

A few colors are hex values because they are used outside Tailwind utilities.
Update them to match a new accent:

- Background glows: `TINTS` in [AmbientGlow.astro](./src/components/AmbientGlow.astro)
- Category covers: [blogCategories.ts](./src/utils/blogCategories.ts)
- Social preview images: the `lavender` theme in [generateOgImage.ts](./src/utils/generateOgImage.ts)
- Sitemap styles: [sitemap-style.xsl.ts](./src/pages/sitemap-style.xsl.ts)
- Card hover border: `.border-beam-card::before` in [global.css](./src/styles/global.css)

### About interests and career timeline

The About image is selected by `author.aboutImage` in
[src/site.config.ts](./src/site.config.ts), with `aboutImageAlt` for its description.
The cat illustration uses a transparent PNG with smooth edges in both themes, without a glow.

Edit the interest chips in the frontmatter of [about.md](./src/content/pages/about.md):

```yaml
interestsHeading: "Currently curious about"
interests:
  - "AI red teaming"
  - "Deepfake prevention"
  - "Ethical AI"
  - "C2PA"
  - "Mental health in tech"
```

These are interests, not claims about professional experience or links to tag
archives. Omit `interests` or use `interests: []` to hide the card.
Keep the Markdown body to a short introduction, hobbies, and a contact link;
the photo, chips, and timeline provide the rest of the profile. The optional
FAQ section appears only when `faq.groups` contains questions.

The About layout already renders the career timeline below the Markdown.
There is no need to import a TypeScript or Astro component into `about.md`.
Edit the `experiences` array in [experiences.ts](./src/data/experiences.ts), keeping
the newest milestone first. Use a separate entry for each role or promotion.
Roles, promotions, education, internships, and research all appear on the same
timeline.
`year` is the compact timeline label, and `period` holds the fuller dates.
`location`, `duration`, and `progression` are optional; leave `highlights` and
`skills` as empty arrays for a minimal snapshot. Set `isCurrent: true` only for
the current role. An empty `experiences` array hides the timeline.

### Homepage introduction and animations

The homepage card reads its text from `intro` in
[home.md](./src/content/pages/home.md):

```yaml
intro:
  heading: "Michelle Mayer"
  taglines:
    - "Software engineer"
    - "Creative soul"
    - "Cat lady"
  lead: "Explore my writing on tech, AI safety, and life beyond the keyboard."
  ctaLabel: "About me"
  ctaHref: "/about/"
```

The typewriter types each phrase in `taglines`, erases it, and moves to the next.
Keep each phrase to 40 characters or fewer. Screen readers get the full list
instead of the animation.

The cat typing "hello world" beside the introduction is a custom
[ascii.rest](https://ascii.rest/) piece. Its drawing and timing live in
[src/ascii/typingCat.ts](./src/ascii/typingCat.ts); every frame must stay exactly
`meta.cols` by `meta.rows` characters. [src/ascii/tagline.ts](./src/ascii/tagline.ts)
wraps the library's typewriter so the phrases line up with the name; change its
`SPEED` to make the typing faster or slower.

[TypingCat.astro](./src/components/TypingCat.astro) and
[AsciiTagline.astro](./src/components/AsciiTagline.astro) render a still frame
into the HTML. [AsciiToggle.astro](./src/components/AsciiToggle.astro) plays both
with `mount()` and adds one button that pauses or plays them together.

The animations loop only while they are on screen and the tab is visible.
Visitors who prefer reduced motion see the still frames until they press play.
Without JavaScript, the still frames stay and the button is hidden.

### Blog categories and cover images

Every blog post needs one `category`: `tech`, `research`, or `personal`. Keep
`tags` for more specific topics; a Tech post might have `aiSafety` and `teamCulture`
tags. Category filters live on `/blog/`, with shareable category pages such as
`/blog/category/tech/`. The homepage continues to mix all categories by date.

Cover images are optional. Save your image under `src/images/` and add its path
relative to the post, plus descriptive alt text, to the Markdown frontmatter:

```yaml
category: "tech"
heroImage: "../../images/my-cover.jpg"
heroImageAlt: "Describe what the cover image shows."
```

Replace `my-cover.jpg` with a real image before adding these fields. Cards crop
covers to a widescreen frame, so keep the important subject near the center.
Homepage and blog archive cards use the cover image first, an embedded video's
thumbnail next, or a category-colored cover when neither exists. Tag-result cards
use an image or category color; videos keep their existing Watch link instead of
a player.
No cover image is required to publish a post.

Before publishing v1:

- Replace `Your location`, `hello@example.com`, and the author tagline
  `A personal site in progress` in [src/site.config.ts](./src/site.config.ts)
  with intentional public information.
- Replace the placeholder portrait and sample writing; replace the gallery image
  if you re-enable Photography.
- Choose your timezone; the starter uses UTC without guessing your location.
- Review navigation, mobile layout, light/dark themes, contact links, and metadata.
- Keep the theme credit in the site description.

## Validate a production build

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

Open <http://localhost:4321> to review the generated site. Static output is written
to `dist/`; do not commit `dist/`, dependencies, or caches.

## Publish v1 to GitHub Pages

This folder has fresh Git history and only one remote, `origin`, pointing to
[your GitHub repository](https://github.com/michelle-mayer/michelle-mayer.github.io).
There is no template upstream, no inherited Git history, and no need to synchronize
with the original project.

1. Finish replacing placeholders and validate locally.
2. On GitHub, open the repository's **Settings > Pages** and select
   **GitHub Actions** as the publishing source.
3. Review and commit this starter, then push when ready:

   ```powershell
   git status
   git remote -v
   git add .
   git commit -m "Launch personal site v1" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
   git push -u origin main
   ```

4. Watch **Actions > Deploy to GitHub Pages**. After it succeeds, check
   <https://michelle-mayer.github.io>.

The [deployment workflow](./.github/workflows/deploy.yml) checks and builds the
site, then publishes it on pushes to `main`. It can also be started manually.
This setup needs no AWS credentials, Terraform, or separate hosting account.
Since the repository is named `michelle-mayer.github.io`, the site is hosted at
the domain root and does not need Astro's repository-subpath `base` setting.

## Template credit

Based on **The Navigator**, an Astro and Tailwind CSS theme by **Ed Stuurman**:
[original project](https://github.com/edstuurman/the-navigator).

This project started from a one-time source snapshot and is developed independently.
The theme's layouts, components, and utilities are retained; demo content and
AWS/GitLab deployment configuration are replaced for this personal site.
Credit is also included in the site's global description and footer.

The homepage animation is played by [ascii.rest](https://github.com/bas3line/ascii)
(MIT license); the typing-cat drawing itself is original to this site.
