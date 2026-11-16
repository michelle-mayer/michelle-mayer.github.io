# TODO

Repo-wide task tracker. Check items off with `[x]`. Move done items to **Done** with the date.

## Analytics (plan: [docs/plans/analytics-plan.md](docs/plans/analytics-plan.md))

- [ ] Create a free Cloudflare account and add the `michelle-mayer.github.io` Web Analytics site. Copy the token.
- [ ] Implement the beacon in `Head.astro`, gated to the production hostname, plus the `theme.config.ts` toggle.
- [ ] Add the `/privacy/` page and footer link.
- [ ] Verify that the beacon fires on production and not on localhost or preview.
- [ ] Block `static.cloudflareinsights.com` on all of my devices so my visits don't skew stats:
  - [ ] Desktop browsers (uBlock Origin: `||static.cloudflareinsights.com^`)
  - [ ] Phone (AdGuard or 1Blocker on iOS, or uBlock Origin in Firefox on Android)
  - [ ] Confirm the block in DevTools → Network
- [ ] Monthly (recurring): record page views, visits, top 5 paths, and top referrers before detailed data ages out.

## Blog drafts

- [ ] Finish "[Draft] Cat products I swear by" (`catProductRecommendations.md`).
- [ ] Finish "[Draft] We Can't Automate Our Way Out of Burnout" (`humanCapitalInTech.md`).
- [ ] Finish "[Draft] Lessons I learned at Microsoft" (`lessonsFromMicrosoft.md`).
- [ ] Finish "[Draft] Words of Wisdom from a Zillennial in Tech" (`wisdomForNewGrads.md`).
- [ ] Finish "[Draft] A Software Engineer's Perspective: AI Gripes and Praises" (`aiGripesAndPraises.md`).

## Later / ideas

- [ ] If monetizing: add FTC affiliate disclosures, and add a consent banner plus GA4 only if display ads are added.

## Done

- [x] Approved the analytics plan.

