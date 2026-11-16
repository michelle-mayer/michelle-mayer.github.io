# Plan: Privacy-friendly page analytics (Cloudflare Web Analytics)

**Status:** Approved
**Cost:** $0. Free Cloudflare account; no paid plan, card, or subscription needed for Web Analytics.

## Goals

1. Find out whether anyone is visiting the site.
2. Find out which content performs best, including the top posts, where readers come from, and their countries and devices.
3. Avoid a cookie banner.
4. Keep Michelle's own visits out of the numbers.

**Out of scope:** unique visitors per page, user-level tracking, ads, and affiliate tracking.

## Why Cloudflare Web Analytics

| Need | How it's met |
| --- | --- |
| No cookie banner | No cookies, no localStorage, and no fingerprinting |
| Per-article stats | Every post has a unique URL (`/blog/<id>/`), and the dashboard groups by **Path** |
| Traffic sources | **Referer** dimension |
| Reputable and free | Cloudflare, free tier, no DNS change required for a GitHub Pages site |
| Works with the stack | One `<script>` tag that fits the existing `integrations` pattern in `theme.config.ts` |

### Metrics

- **Page views:** each article load.
- **Visits:** page views that arrive from outside the site. This is the closest available measure of "how many sessions."
- **Not available:** unique visitors and per-page uniques.

## Implementation steps

### 1. Cloudflare setup (Michelle, about 5 minutes)

1. Create or sign in to a free Cloudflare account.
2. Go to **Analytics & Logs → Web Analytics → Add a site**.
3. Enter the hostname `michelle-mayer.github.io`.
4. Copy the **token** from the generated snippet (`data-cf-beacon='{"token": "..."}'`).
   - The token is public by design because it appears in every page's HTML. It is **not a secret**, so it is safe to commit.

### 2. Code change (small)

- **`src/theme.config.ts`**
  - Add `integrations.cloudflareAnalytics: { enabled: boolean; token: string }`, alongside the existing `umami` entry.
  - Leave Umami disabled.
- **`src/components/Head.astro`**
  - Add the beacon script next to the Umami block, with `defer`.
  - Render it only when `enabled && token`.
  - Inject it client-side **only when `location.hostname === 'michelle-mayer.github.io'`** so `localhost`, `127.0.0.1`, and preview builds never send data.
- Confirm that `postBuildHtml` in `astro.config.mjs` does not inline or alter the external beacon. It only inlines `/_astro/*.js`.

### 3. Privacy note (transparency)

- Add a short **`/privacy/`** page and a small footer link. Plain language only:
  - The site uses Cloudflare Web Analytics to count page views.
  - No cookies are used, no data is stored on your device, and visitors are not tracked across sites.
  - Data collected: page URL, referrer, country, browser, OS, and device type, in aggregate.
  - Why: to understand which content is useful.
  - How to opt out: any content blocker will block `static.cloudflareinsights.com`.
  - Links to Cloudflare's privacy policy.
  - Contact info.
- Also note that the contact form, if enabled, is handled by Formspree, and YouTube embeds use `youtube-nocookie.com`.

### 4. Exclude Michelle's own traffic

The site is static, and Cloudflare has no IP filter for non-proxied sites.

1. **Dev and preview are automatically excluded** by the hostname gate.
2. **Production visits from Michelle's devices:** block `static.cloudflareinsights.com` in each browser and on her phone:
   - **Desktop browsers:** uBlock Origin → *My filters* → `||static.cloudflareinsights.com^`
   - **iPhone:** a content blocker app, such as AdGuard or 1Blocker, with the same domain.
   - **Android:** Firefox with uBlock Origin, or a Private DNS blocker.
3. **Verify:** open DevTools → Network on the live site and confirm the beacon request is blocked.

Tracked in [`TODO.md`](../../TODO.md).

## Privacy and security review

| Area | Assessment |
| --- | --- |
| Cookies and consent (GDPR, ePrivacy, UK PECR, CCPA) | No cookies or device storage, so a consent banner is likely unnecessary. A privacy note provides transparency. *General information, not legal advice.* |
| PII | None is sent by us. URLs are content slugs only. Never put emails or names in query strings. |
| Third-party script risk | The beacon is served by Cloudflare. SRI is not practical because the file is unversioned. Risk is accepted given the vendor and the static site, which has no auth or user data. |
| Data sale and ads | Cloudflare states that Web Analytics data is not used for ad targeting. |
| CSP | The site currently has no CSP. GitHub Pages cannot set headers. If a `<meta>` CSP is added later, allow `script-src https://static.cloudflareinsights.com` and `connect-src https://cloudflareinsights.com`. |
| Secrets | The token is public. No API keys go in the repo. |
| Do Not Track / GPC | **Decided: respected.** Skip loading the beacon when `navigator.globalPrivacyControl` or `navigator.doNotTrack === '1'`. Mention this on the privacy page. |

## Verification

1. Run `npm.cmd run check` and `npm.cmd run build`, and confirm both pass.
2. Open the local preview and confirm **no** request goes to `cloudflareinsights.com` because of the hostname gate.
3. After deployment, use a browser *without* the blocker:
   - Confirm the beacon loads.
   - Confirm `POST https://cloudflareinsights.com/cdn-cgi/rum` returns 204.
4. Check the Cloudflare dashboard. Data appears within a few minutes.
5. Use a browser *with* the blocker and confirm the beacon is blocked.

## Known limitations

- There are no unique visitors. Page views and visits are the metrics.
- Ad blockers hide part of the audience, especially tech readers, so counts are a floor rather than a total.
- Detailed data is kept for about 7 days and then sampled. Older data is approximate.
  - **Mitigation:** a monthly export or screenshot (see `TODO.md`).

## Future: monetization

If affiliate links or ads are added later:

- **Affiliate links:** these do not need analytics changes, but they require an FTC disclosure on each post.
- **Display ads such as AdSense:** these set cookies, so they require a consent banner in the EU and UK at that point. If ads are added, GA4 and Consent Mode can be added at the same time.
- Keep the monthly stats log because it becomes the traffic history for pitches.

## Rollback

Set `integrations.cloudflareAnalytics.enabled = false`, or delete the token, and redeploy. Optionally delete the site in the Cloudflare dashboard.
