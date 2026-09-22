# EFDS visual redesign

Implemented on the local branch `design/imperial-efds-redesign`, September 2026. The work covers the public site, authentication, shared member and administrator interfaces, and source archive presentation. No deployment or remote push is part of this milestone.

## Direction and sources

The identity centres on **connections between disciplines**. An original architectural still life combines a Queen’s Tower-inspired model with a cobalt mathematical surface, market-like columns and a silver ring. Precise SVG curves, columns and networks extend that idea through the site. The illustration is clearly described as conceptual artwork.

Imperial’s expressive blue and contemporary typography informed the direction after reviewing [Pentagram’s Imperial identity case study](https://www.pentagram.com/work/imperial). EFDS has its own three-bar symbol, wordmark, warm white surfaces and editorial typography. No Imperial crest, official logotype or proprietary Imperial typeface is reproduced. The footer identifies the site as an independent student society website.

Manrope handles navigation, body copy and headings; Newsreader adds italic editorial emphasis. Both are self-hosted variable fonts. Their redistribution licences are included under `public/licenses/`. The bitmap is approximately 126 KB, served responsively through Next Image. Other graphics are SVG or CSS. Motion is limited to short entrance and interaction transitions, with reduced-motion overrides.

Society identity, departmental membership information and the public officer list were checked against the [official Imperial College Union EFDS listing](https://www.imperialcollegeunion.org/activities/a-to-z/efds-soc) on 22 September 2026. Membership and contact journeys use that listing. Career and learning routes link to [Imperial Careers](https://www.imperial.ac.uk/careers/) and the [Imperial Library](https://www.imperial.ac.uk/library/). The sibling agent and knowledge-base repositories informed the existing knowledge, role and source boundaries.

Unsupported society totals, placeholder event dates, invented job listings and unverified integration status indicators were removed. Research, events, partnerships and competition pages explain what is available without inventing a programme or confirmed partners. Published resources continue to use the existing data reader.

The exact artwork prompt, original location and production path are recorded in [hero-artwork-prompt.md](hero-artwork-prompt.md).

## Preview

From the project directory, with Node.js 20.9+ and no Supabase credentials configured:

```bash
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open **http://127.0.0.1:4587**. Useful routes include `/`, `/about`, `/events`, `/careers`, `/research`, `/competitions`, `/resources`, `/committee`, `/partners`, `/contact`, `/chat`, `/login`, `/dashboard`, `/dashboard/search`, `/dashboard/chat`, `/admin`, `/admin/documents/files` and `/admin/operations/new`.

The existing local development preview displays a prominent notice. Source archives and search show empty data; some existing knowledge views retain labelled sample content. No user session is created. The page-level preview helper is active only in development without Supabase configuration. Configured readers still execute their original authorization checks. Production denies unconfigured member/admin access. Saving an operational record is visibly unavailable in the local preview.

With live configuration, the existing Microsoft OAuth, approved email flow, profile provisioning, permissions, Supabase readers, mutation actions and agent endpoint contracts remain in place. No SQL migration, RLS policy or service-role access was added.

## Verification

Final local results on 22 September 2026:

- ESLint, TypeScript and the production build passed.
- All 45 unit tests passed. The existing jsdom cleanup issue was corrected so the suite exits cleanly.
- All 192 Chromium checks passed: no failed, skipped or flaky checks. The suite includes 36 Axe WCAG A/AA checks across the three viewport sizes.
- All 48 destinations discovered through internal navigation returned HTTP 200 in development.
- Production smoke checks passed for 12 public/auth routes, 10 protected-route redirects, two actual chat API error responses, the custom 404 and responsive artwork/font loading at three sizes.
- 21 final screenshots were captured with no page errors or horizontal overflow.

Run:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run screenshots
node scripts/check-local-links.mjs
```

For the production smoke check, run `npm run start -- --hostname 127.0.0.1 --port 4588` after the build, then `node scripts/check-production.mjs` in a second terminal. The separate production server intentionally denies unconfigured private routes.

The browser suite uses Chromium at 1440 × 1000, 768 × 1024 and 390 × 844, plus a 320 px narrow-screen check. It verifies route rendering, horizontal overflow, semantic landmarks, focus return, menu navigation, search query/filter persistence, sign-in feedback, chat failure/retry, streamed citations, interrupted streams, missing pages and reduced-motion behavior. Axe checks cover representative public, authentication and workspace screens. Automated checks complement visual screenshot review; they are not a complete accessibility certification.

Microsoft sign-in’s unconfigured state is tested against the local app. Successful approved-email feedback and agent streaming use explicit browser response mocks. Live Microsoft login, email delivery, real database access/RLS, administrator writes and live agent responses still require the deployment credentials and real accounts.

The production dependency audit is clear after updating Next and eslint-config-next to 16.3.5 and compatible transitive image/YAML patches. This includes fixes described in the [Next release](https://github.com/vercel/next.js/releases/tag/v16.3.5) and [image processing advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4). The full audit retains two inherited moderate findings in the Vitest development dependency chain; updating that chain requires a separate test-runner major-version migration.

## Screenshots

| View | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Homepage | [Desktop](../artifacts/redesign/home-desktop.png) | [Tablet](../artifacts/redesign/home-tablet.png) | [Mobile](../artifacts/redesign/home-mobile.png) |
| Society | [About](../artifacts/redesign/about-desktop.png) | | [Resources](../artifacts/redesign/resources-mobile.png) |
| Discovery | [Events](../artifacts/redesign/events-desktop.png), [Careers](../artifacts/redesign/careers-desktop.png), [Research](../artifacts/redesign/research-desktop.png) | | |
| Committee | [Officers](../artifacts/redesign/committee-desktop.png) | | |
| Authentication | [Login](../artifacts/redesign/login-desktop.png) | | [Login](../artifacts/redesign/login-mobile.png) |
| Chat | [Public chat](../artifacts/redesign/chat-desktop.png) | | |
| Member workspace | [Dashboard](../artifacts/redesign/dashboard-desktop.png) | | [Dashboard](../artifacts/redesign/dashboard-mobile.png), [Search](../artifacts/redesign/search-mobile.png) |
| Administration | [Dashboard](../artifacts/redesign/admin-desktop.png), [Documents](../artifacts/redesign/documents-desktop.png) | | [Dashboard](../artifacts/redesign/admin-mobile.png), [Documents](../artifacts/redesign/documents-mobile.png), [Search filters](../artifacts/redesign/search-filters-mobile.png), [Record form](../artifacts/redesign/operations-form-mobile.png) |

A [before screenshot](../artifacts/redesign/before-home-desktop.png) is retained for comparison. Reproducible screenshot metadata, browser results and the internal-link report are under `artifacts/redesign/`.
