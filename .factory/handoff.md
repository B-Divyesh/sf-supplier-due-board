# Due Board — repair 2 handoff

## Result

**PASS — repair candidate deployed and checked on production.**

- **Implementation SHA:** `bf0a9591328ac48220b2b8c7f8acb14064a9bd79` (`fix: add isolated due board demo and release routes`)
- **Prior review/documentation SHA:** `e4d59d6fbd38d36ee2e0062c8a98a1598a01aa29` (the report that requested this repair)
- **Deployment ID:** `677dba2a-7917-45f7-a5d6-a06b027f762e`
- **Production URL:** <https://supplier-due-board.sociobot.in>
- **Artifact:** static Vite + TypeScript PWA; bills and attachments stay in browser IndexedDB. There is no backend, account system, database service, tenant model, health endpoint, or rate-limit API to verify.

## First screen checked on fresh production browsers

- **Job:** track supplier bills before they are due.
- **Audience:** sole proprietors and small businesses who need one local list before they pay.
- **First action:** **Try it with sample data**; it opens five realistic bills in the isolated `/demo` board.

Fresh Chromium desktop and 390px phone contexts both showed this copy. Screenshots are in `/work/.evidence/supplier-due-board-repair-2/`, including the populated phone sample.

## Repairs completed

### Review 1 findings

| Finding | Disposition |
| --- | --- |
| R1 — no isolated sample demo | Closed. `/demo` and `?demo=1` use IndexedDB `demo:supplier-due-board`, never open `supplier-due-board`, seed five realistic bills, show the persistent required label, and provide **Reset demo** and **Start for real**. Leaving deletes sample storage only. `.factory/demo.md` documents it. |
| R2 — no claims inventory/tests | Closed. `.factory/claims.json` lists 12 visitor claims. Each has exactly one `@claim:<id>` Playwright test and an individually runnable command from `/demo`. All 12 exact commands passed on desktop and mobile. |
| R3 — plain-words first screen | Closed. The h1 names the job, the audience is explicit, the sample action explains its result, and the first screen shows free/offline/local facts. Mood copy and competing terminology were removed. `.factory/copy-audit.md` records the audit and terminology table. |
| R4 — missing 404/sitemap | Closed. Static Web Apps maps `/demo` explicitly and serves the designed `/404.html` through `responseOverrides`; production unknown URLs return HTTP 404. `sitemap.xml` lists all public routes and `robots.txt` points to it. |
| R5 — incomplete metadata | Closed. Home, demo runtime, Privacy, Terms, and 404 have route titles and descriptions/canonicals; public pages have Open Graph/Twitter tags, the Apple touch icon, and a 1200×630 original-art-derived social card. |

### Earlier V-01 through V-06

All remain closed and were preserved: atomic full-schema backup materialization (V-01), whitespace supplier rejection (V-02), 44px mobile controls and matching wordmark name (V-03), immutable asset caching (V-04), MIME/CSP/permissions policy (V-05), and the shallow responsive mobile hero (V-06). Existing regression tests continue to cover those paths.

## Verification

Clean setup and local gates:

```sh
npm ci
npm test
TZ=America/New_York npm test
TZ=Pacific/Kiritimati npm test
TZ=Asia/Kolkata npm test
npm run build
npm run test:e2e
npm audit --audit-level=low
```

- `npm ci`: 60 packages; audit reported 0 vulnerabilities.
- `npm test`: 21/21 passed, including static routing/metadata policy tests; all three named time-zone runs passed.
- `npm run build`: passed; `dist/index.html` is at the static root.
- `npm run test:e2e`: 39 passed, 1 intentional desktop skip for the mobile-only geometry test.
- Every command declared in `.factory/claims.json` was also run separately; all 12 passed in both desktop and mobile Chromium.
- `npm audit --audit-level=low`: 0 vulnerabilities.

Production checks:

- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, title, `lang=en`, exactly one h1, main landmark, complete image alt coverage, labeled buttons, and no console/page errors (856 ms network-idle load).
- Fresh live Playwright desktop/phone checks passed for demo separation/reset/start-for-real, populated demo offline reload, route titles, and axe serious/critical checks for demo, Privacy, and Terms (6/6).
- Production routes: `/`, `/demo`, `/privacy/`, `/terms/`, `/sitemap.xml`, and `/robots.txt` return 200. `/this-page-does-not-exist` returns the designed page with deliberate HTTP 404.
- Live Lighthouse mobile: **100 performance / 100 accessibility / 100 best practices / 100 SEO**; FCP 913 ms, LCP 1,363 ms, CLS 0, transfer 89,480 bytes. Lab INP was not emitted by Lighthouse.
- Current production build: 36,580-byte raw initial JS (11.79 KB gzip), 22,300-byte raw CSS (5.74 KB gzip), no font payload, and a 66,655-byte mobile AVIF.

## Privacy, scope, and billing

The app has no analytics, third-party scripts/fonts, cookies, remote bill API, bank connection, payment execution, OCR, or accounting journal. Request-capture claims assert same-origin traffic only during the demo flows. The researched offer is free; no paid deliverable or billing registration is advertised, so no billing-offer metadata is required.

`.factory/catalog-description.txt` is 80 characters, verb-first, and was copied to `/work/.evidence/catalog-description.txt`.

## Deploy

```sh
npm run build
/opt/fleet/lib/deploy-static.sh supplier-due-board dist
```

The durable static deployment configuration is in `public/staticwebapp.config.json`; no volumes, replicas, or backend environment apply to this static PWA.

## Known limits

- Browser/a11y automation is Chromium plus axe; Safari, Firefox, and a human NVDA/VoiceOver session were not run.
- Lighthouse did not provide a lab INP value.
