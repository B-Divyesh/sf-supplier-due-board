# Due Board — independent verification 2

## Verdict: PASS

- **Candidate tested:** `5f671b4dfb43898073670bae5ba2d6b62a96bcef`
- **Live URL:** <https://supplier-due-board.sociobot.in>
- **Verified:** 2026-08-28 UTC
- **Work order:** `supplier-due-board-verify-2`
- **Contract:** researched brief, `AGENTS.md`, and supplied PWA/accessibility/performance requirements

This is an independent clean-checkout verification following the repair verification. No product source was modified. The live deployment is conclusively the candidate build, rather than the earlier failed deployment or a stale artifact.

## Release decision

**PASS.** No critical, high, medium, or low release-blocking defects were found.

The app meets the brief's smallest useful product: a local, offline due-date board with supplier, amount, local-calendar due date, local attachment, manual paid record, data export/deletion, and printable weekly list. It intentionally contains no sign-in, remote product API, bank/payment connection, OCR, or accounting features.

## Clean-checkout gates

| Check | Result |
| --- | --- |
| Starting tree / candidate | Clean tree at exactly `5f671b4dfb43898073670bae5ba2d6b62a96bcef` |
| `npm ci` | PASS — 60 packages installed; `npm audit` reported 0 vulnerabilities |
| `npm test` | PASS — 19/19 Vitest tests |
| Type check | PASS — included in `npm run build` as `tsc --noEmit` |
| Lint | No lint script/configuration exists in the repository |
| `npm run build` | PASS — Vite produced `dist/` |
| Playwright release suite | PASS — 13 passed, 1 intentional desktop skip for the mobile-only geometry case |

The Playwright suite was run by its seven named scenarios: add/persist/pay/reopen, empty/form axe scan, whitespace validation, malformed-backup preservation, attachment backup round trip, 390px geometry/AVIF, and fully-offline reload. It uses the exact production preview build.

## Live identity and deployment policy

Fresh SHA-256 comparisons show that local `dist/` and production are byte-identical for the entry HTML, service worker, JavaScript, CSS, manifest, and all four generated-image variants. Representative matches:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `8f25803faf2c9fd48809621911b26b6063f7c46794602a03d10f478c8aa10534` |
| `assets/index-C1-KFwwt.js` | `634171f5c6722c7baa8f1e895bd708dd320ce7e50994e0399a2f5b2848116367` |
| `assets/index-BJ0gR16V.css` | `a07b65487c2e668a3853c3ba8f091f09c2e4b564eea6c099230b9c55aa3d6c5e` |
| `sw.js` | `1e7fe046573be7db5fedc47567b968488fa1d462bc1c5da2879121858427d55f` |
| `manifest.webmanifest` | `46dac07ab0c6b07091eb6415e394b613f980d1b902bb9ac3fc9e645ac891d815` |
| `assets/due-board-material-768.avif` | `70c10db73f8f9d54fa30aaea8ce095ea7b9f342d0ddff2c977b933a5425c1f96` |

Live headers were checked for `/`, `/sw.js`, fingerprinted JS, and `/privacy/`:

- HTML and worker: `Cache-Control: public, must-revalidate, max-age=30`.
- Fingerprinted JS/CSS/assets: `Cache-Control: public, max-age=31536000, immutable`.
- HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, CSP, and Permissions-Policy are present.
- CSP confines scripts, connections, fonts, workers, images, and manifests to the site origin (with only required `data:`/`blob:` image allowances).
- Manifest and AVIF files match the candidate and their deployed configuration declares correct MIME mappings.

There are no application server endpoints: source and browser traffic contain no API calls; `/api/health` and `/api/v1/health` return the SPA HTML fallback rather than an API response. Therefore backend health, concurrency/persistence boundaries, authentication, and burst rate-limiting/429 checks are not applicable. No sign-in is implemented.

## Independent browser exercise

Against the live URL in fresh Chromium contexts:

- Desktop normal flow: empty state; add a supplier bill with a local PDF; mark paid with date/note; reopen; reload and retain data in IndexedDB.
- Invalid/recovery: whitespace supplier and zero amount were rejected; correction to supplier `Boundary Supplier` and `$0.01` saved successfully. A `text/plain` attachment was rejected while retaining the form; replacing it with a PDF recovered successfully.
- Boundary: `$999,999,999.99` was accepted and displayed accurately.
- Weekly list: the print action populated the weekly printable sheet with the expected current-week record.
- Data safety: repository e2e proves invalid shaped JSON is rejected before replacement and a complete application export—including attachment bytes—round-trips after delete/import.
- Desktop and 390×844 mobile passed. Visual review found the concrete-and-moss visual system intact; mobile stacks board controls and bill presentation intentionally. The selected mobile AVIF was `due-board-material-768.avif`, rendered at 164px high.
- Keyboard: the skip link is first focusable element, visible focus is present, and button/dialog flows work through native keyboard semantics. The rendered 390px required links/actions are covered by geometry tests.
- Reduced motion: computed dialog animation duration was `1e-05s` (the CSS 0.01ms reduced-motion policy).
- Console errors: none. Page errors: none.

## Accessibility, privacy, and PWA

- Live semantic smoke: `lang="en"`, title, exactly one `h1`, and one `main` landmark.
- Independent live axe scan after a populated workflow: **0 serious/critical findings**. The repository suite separately scans empty and open-form states.
- Only `https://supplier-due-board.sociobot.in` was requested during the complete live browser workflow. No third-party script/font/tracker/API origin, cookie, beacon, WebSocket, or remote bill/attachment request was observed.
- Bills and attachments persisted in IndexedDB; the sole localStorage item is the non-sensitive currency preference. Privacy and terms pages are present and accurately describe this.
- A live active service worker controlled the page. After first visit, fully offline reload showed the offline ribbon and the shell/board remained usable.
- Update handling was exercised in an isolated browser session by serving a synthetic new worker version only to that session: the app displayed “A fresh version of Due Board is ready,” **Update now** activated it, and `controllerchange` reloaded the page. The deployed files were not changed.
- Manifest has standalone display, a versioned start URL, and declared 192px/512px icons.

## Performance and budgets

Lighthouse 12.8.2 against the live mobile page (Chromium headless with `--no-sandbox --disable-dev-shm-usage --disable-gpu`) reported:

| Metric | Result |
| --- | --- |
| Performance / Accessibility / Best Practices / SEO | **91 / 100 / 100 / 100** |
| LCP | **1,307 ms** |
| CLS | **0** |
| Total transfer | **88,081 bytes** |

Lighthouse does not provide a lab INP for this run. Artifact budgets pass: initial JavaScript is 32,835 bytes raw (10.84 KB gzip), CSS is 21,121 bytes raw (5.49 KB gzip), no font payload is shipped, and the mobile AVIF is 66,655 bytes. These are below the 200 KB JS, 50 KB CSS, 120 KB font, and 300 KB mobile-image limits.

## Remaining non-blocking verification limits

- Chromium/axe automation is not a human NVDA, VoiceOver, Safari, or Firefox review.
- The app is a static PWA, not a library/CLI or backend; consumer installation, backend concurrency, health identity, and API rate-limit testing do not apply.
- The Lighthouse first invocation could not locate Chrome and the next crashed with default flags; the successful recorded run used the preinstalled Playwright Chromium explicitly with the flags above.

