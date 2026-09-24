# EFDS editorial redesign

Second visual revision, 22 September 2026, on local branch `design/efds-editorial-motion`. This replaces the first revision’s architectural render, repeated card sections and abstract headlines with a more specific society identity. The previous revision is recorded in [redesign.md](redesign.md).

## Research translated into design

| Reference | Applied to EFDS |
| --- | --- |
| [Nielsen Norman Group: Handmade Designs in the Age of AI](https://www.nngroup.com/articles/handmade-designs/) | Prioritise specific content, a recognisable voice and attributable material. Use an actual campus photograph and direct society information. Do not manufacture a claim of human authorship or add artificial imperfections. |
| [Pentagram: Imperial](https://www.pentagram.com/work/imperial) | Use blue confidently and give typography room. Keep the EFDS wordmark distinct from Imperial’s official identity, with the independent society relationship stated in the footer. |
| [Pentagram: MIT Media Lab](https://www.pentagram.com/work/mit-media-lab) | Build consistency through a disciplined grid and repeatable rules, while allowing a photograph, directory, research figure and noticeboard to take different forms. The EFDS mark and graphics are original implementations. |
| [Financial Times: Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md) | Choose a chart because of the relationship it explains. The principal graphic explores correlation, a concept shared across the society’s subjects. |
| [Stripe: Behind the scenes of our new globe](https://stripe.com/blog/globe) | Give moving graphics a purpose and a performance budget. Make the figure interactive, limit work per frame, and stop rendering when it is off screen or the tab is hidden. |
| [W3C: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Provide a visible pause/play control. Honour reduced-motion preferences on initial load; the slider still works when animation is paused. |

The homepage leads with **Economics. Finance. Data science.** IBM Plex Sans supplies the main voice; upright Newsreader supplies editorial section titles. Both fonts are self-hosted. The palette uses warm paper, charcoal, blue and a limited pale-yellow accent. Fine rules, numbered entries and an understated masthead replace the previous repeated card treatment.

Public pages have plain titles and distinct jobs: a society introduction, an event calendar, a careers directory, an interactive research note, competition availability, useful resources, the committee directory, partnership information, contact routes and public chat. The same typography, colours, fields and buttons carry through sign-in, member and administration screens.

## The moving figure

`components/public/correlation-study.tsx` renders an accessible SVG backed by `lib/visuals/correlation.ts`. It uses 96 deterministic synthetic observations. At every animation phase, both axes are standardised and their sample Pearson correlation equals the selected value. The dashed line is the regression; the ellipses illustrate the model’s shape and are not confidence intervals.

This is an educational simulation, not market data or society activity. The figure labels that distinction. Research explains the interpretation and the limit of inferring causation. Users can explore values from −0.95 to +0.95 with a native range input, using touch, a pointer or a keyboard.

Rendering is capped at 30 updates per second, using the `requestAnimationFrame` timestamp. SVG positions update directly without a React render for every frame. An intersection observer and document visibility changes pause the loop. Reduced-motion visitors start with a static figure and can explicitly choose to play it. No animation library, WebGL dependency or live feed is required. [MDN’s animation frame reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) informed the implementation.

## Content and photograph

Society identity, automatic departmental membership and officer details were checked against the [Imperial College Union EFDS listing](https://www.imperialcollegeunion.org/activities/a-to-z/efds-soc). The site does not reproduce a changing membership count, unverified event dates, invented vacancies or partner logos. Existing public data readers remain in place. Empty states tell visitors what is currently available and where to go next.

The campus photograph is **Queen’s Lawn from the south-east corner**, taken by **Shadowssettle on 17 April 2020**, from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Queen%27s_Lawn_from_the_south-east_corner.jpg), under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Its date and attribution are visible beneath the photograph. The image was resized to 1600 × 1200 and encoded as WebP; responsive layouts crop it with CSS. It has not been generatively altered. See [the image licence record](../public/licenses/queens-lawn.md).

The production source is approximately 453 KiB. Next Image provides responsive, compressed derivatives and lazy loading; a static import gives the asset a content hash. Fonts and imagery are served locally. The previous generated image is no longer used by the site or its social preview.

## Local preview

```bash
cd /home/siheon/projects/efds-site
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open **http://127.0.0.1:4587**. The public homepage animates unless the operating system requests reduced motion. Try the slider on `/` or `/research`, the mobile menu, `/chat`, `/login`, `/dashboard`, `/dashboard/search`, `/admin` and `/admin/documents/files`.

Without Supabase credentials, the existing development preview supplies labelled workspace samples and empty archives. It does not create a session. Production denies unconfigured private access. Live Microsoft sign-in, email delivery, database reads and writes, permissions against real accounts, and live agent replies require the existing credentials. Authentication handlers, authorization rules, data readers, mutation contracts and agent protocols were preserved.

## Reproducible checks

Local verification on 22 September 2026:

- ESLint, TypeScript and the production build pass.
- All 51 unit tests pass, including the animated model’s numerical accuracy.
- All 201 Chromium checks pass across the three viewport sizes, including 36 Axe WCAG A/AA checks. No failures, skipped tests or flaky retries.
- All 48 local navigation destinations return HTTP 200 in development.
- Production smoke checks pass for 12 public/authentication routes, 10 protected-route redirects, two chat API error responses, the custom 404, and image/font delivery at three sizes.
- 26 page screenshots and an interaction recording were captured. Screenshot checks report no page errors or horizontal overflow.

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run screenshots
node scripts/capture-motion.mjs
node scripts/check-local-links.mjs
```

For the production smoke check, start `npm run start -- --hostname 127.0.0.1 --port 4588` after building, then run `node scripts/check-production.mjs` in another terminal. Browser reports, screenshot metadata and production checks are saved under `artifacts/editorial/`.

The browser suite covers desktop (1440 px), tablet (768 px), mobile (390 px), and a narrow 320 px homepage. It checks public and private preview routes, menus and focus return, query persistence, sign-in feedback, chat retries and citations, image loading, errors, motion controls, keyboard adjustment, reduced motion and offscreen suspension. Axe checks complement visual review; they are not a full accessibility certification. Successful email and streamed agent responses are tested using explicit response mocks.

## Review material

| View | Captures |
| --- | --- |
| Homepage | [Desktop](../artifacts/editorial/home-desktop.png) · [Tablet](../artifacts/editorial/home-tablet.png) · [Mobile](../artifacts/editorial/home-mobile.png) · [320 px](../artifacts/editorial/home-narrow.png) · [Sponsors on desktop](../artifacts/editorial/home-sponsors-desktop.png) · [Sponsors on mobile](../artifacts/editorial/home-sponsors-mobile.png) |
| Motion | [Animation and slider recording](../artifacts/editorial/correlation-motion.webm) · [Negative correlation](../artifacts/editorial/home-negative-correlation.png) |
| Society | [About](../artifacts/editorial/about-desktop.png) · [Committee](../artifacts/editorial/committee-desktop.png) · [Contact](../artifacts/editorial/contact-desktop.png) |
| Discovery | [Events](../artifacts/editorial/events-desktop.png) · [Careers](../artifacts/editorial/careers-desktop.png) · [Research](../artifacts/editorial/research-desktop.png) · [Research on mobile](../artifacts/editorial/research-mobile.png) |
| Practical information | [Resources](../artifacts/editorial/resources-mobile.png) · [Competitions](../artifacts/editorial/competitions-mobile.png) · [Sponsors](../artifacts/editorial/sponsors-desktop.png) · [Sponsors on mobile](../artifacts/editorial/sponsors-mobile.png) |
| Access and chat | [Sign-in](../artifacts/editorial/login-desktop.png) · [Sign-in on mobile](../artifacts/editorial/login-mobile.png) · [Public chat](../artifacts/editorial/chat-desktop.png) |
| Member workspace | [Desktop](../artifacts/editorial/dashboard-desktop.png) · [Mobile](../artifacts/editorial/dashboard-mobile.png) · [Search](../artifacts/editorial/search-mobile.png) |
| Administration | [Dashboard](../artifacts/editorial/admin-desktop.png) · [Documents](../artifacts/editorial/documents-desktop.png) · [Mobile documents](../artifacts/editorial/documents-mobile.png) · [Search filters](../artifacts/editorial/search-filters-mobile.png) · [Record form](../artifacts/editorial/operations-form-mobile.png) |

The [previous homepage](../artifacts/redesign/home-desktop.png) is retained for comparison. Production is published from GitHub's `main` branch through the existing Vercel integration at [www.imperial-efds.com](https://www.imperial-efds.com), with [efds-site.vercel.app](https://efds-site.vercel.app) as the Vercel address. Confirm the deployment status and check the live site after each release; the local verification above does not certify live authentication or agent credentials.
