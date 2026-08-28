# Due Board — repair handoff

## Verdict: PASS

Release-blocking findings V-01 through V-06 from independent verification commit `373b3517e4d5fdb0c0af7bd473a31ac4fadcef00` against candidate `e221119d944f77081a359a649b0ed33b48292cfc` are repaired. The product remains a Vite + TypeScript, IndexedDB-local, static offline PWA with the researched scope and concrete-and-moss design intact.

## Repairs

- **V-01 — atomic safe import:** `src/backup.ts` now validates and materializes the complete v1 schema before confirmation or IndexedDB mutation. It checks every field type and limit, real calendar dates, timestamps, paid/open consistency, allowed currency, safe unique IDs, attachment filename/MIME/base64/declared size/8 MB limit, and duplicate IDs. Only known fields are materialized. Rejection explicitly says the current board was not changed; `replaceAll` remains one IndexedDB transaction.
- **V-02 — blank supplier:** form submission trims first, applies custom validity to a whitespace-only supplier, announces a specific error, and never writes a blank record. The same normalized invariant is enforced during import.
- **V-03 — mobile targets/name:** the wordmark, all bill actions, and footer legal links are at least 44×44 CSS px. The wordmark's computed accessible name is now its visible `DUE BOARD` text with no mismatching “home” suffix.
- **V-04/V-05 — response policy:** `public/staticwebapp.config.json` sets one-year immutable caching for `/assets/*`, maps `.webmanifest` and `.avif` to their correct MIME types, and supplies CSP, Permissions-Policy, Referrer-Policy, and nosniff headers.
- **V-06 — mobile hero:** a new 768px AVIF (66,655 bytes) is present in `srcset`, and the 390px treatment is a 164px-high shallow crop rather than a 512px-tall panel. The service-worker cache version is `due-board-v1.0.1` and precaches the new asset.

## Exact regression coverage

- `src/backup.test.ts`: app-generated attachment backup materialization plus rejection of unsafe IDs, non-string invoice data, whitespace suppliers, unsupported currency, amount overflow, impossible dates, inconsistent paid records, invalid timestamps/payment notes, oversize/mismatched/MIME-mismatched attachments, and duplicate IDs.
- `src/release.test.ts`: immutable cache policy, CSP/Permissions-Policy, correct manifest/AVIF MIME mappings, and the sub-100 KB mobile AVIF.
- `tests/due-board.spec.ts`: whitespace submission leaves IndexedDB empty; the verifier's object-valued `invoiceNumber` backup never opens confirmation and preserves `good-existing` after reload; an untouched app-exported JSON backup restores an attachment byte-for-byte; 390px target geometry, wordmark accessible name, shallow hero, and 768px AVIF selection are asserted.

## Local verification (2026-08-28 UTC)

Clean release sequence:

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

Results:

- Clean install: 60 packages, 0 vulnerabilities.
- Unit/integration/release policy: 19/19 passed in UTC and all three named time zones.
- Type check and Vite production build: passed; `dist/index.html` is at the static root.
- Playwright 1.58.2: 13 passed across desktop Chromium and 390×844 mobile Chromium; one intentional desktop skip for the mobile-only geometry case.
- Axe 4.10.2: zero serious/critical findings in empty, bill-dialog, root, privacy, and terms states.
- Keyboard/focus: skip link is first with a solid focus ring; Enter opens Add bill; focus begins on Supplier; Escape closes and restores focus to the trigger.
- 200% root text at 390px: `scrollWidth=390`, `innerWidth=390`; no horizontal loss. Reduced motion: dialog duration `0.00001s`, transform `none`.
- Privacy smoke: root/privacy/terms requested only `http://127.0.0.1:4173`; zero cookies, console errors, or page errors. Source and browser flow use no analytics, beacons, third-party scripts/fonts, or remote data API.
- Offline: saved board reload passed with `context.setOffline(true)` in desktop and mobile projects.
- Update simulation: v1.0.1 controlled the page, the update toast appeared, **Update now** activated v1.0.2, and cache keys changed from `due-board-v1.0.1-{shell,runtime}` to `due-board-v1.0.2-{shell,runtime}`.
- Lighthouse 12.8.2 local mobile: performance 99, accessibility 100, best practices 100, SEO 100; FCP 903 ms, LCP 1,355 ms, CLS 0, TBT 136 ms, transfer 85,098 bytes. Lighthouse does not provide lab INP.
- Production budgets: JS 32,835 bytes raw; CSS 21,121 bytes raw; fonts 0; mobile AVIF 66,655 bytes. All are below contract limits.
- Package/consumer and backend checks are not applicable to this static PWA. The repository has no separate lint configuration; strict TypeScript (`tsc --noEmit`) is the source/type gate and passed.

## Deployment and live identity

Deployment target: Azure Static Web Apps via `/opt/fleet/lib/deploy-static.sh supplier-due-board dist`, preserving the `static` artifact class and `https://supplier-due-board.sociobot.in` origin.

- Repair implementation commit: `3bdc622236f3226e5a7f5c3420f31e8c3ce37bc0`; pushed to `origin/main`.
- Azure deployment ID: `f82d3f4c-b1de-46e5-aa9e-0cb6b57e57c9`; production upload succeeded and the custom domain returned HTTP 200.
- Factory `verify-url.sh`: 678 ms network-idle load, expected title and `lang=en`, one h1, main landmark, no missing alt text, no unlabeled buttons, and zero console/page errors.
- Live response checks: hashed JS/CSS and both AVIFs return `Cache-Control: public, max-age=31536000, immutable`; manifest returns `application/manifest+json`; AVIF returns `image/avif`; CSP and Permissions-Policy are present.
- Live 390px regression: whitespace is invalid; the object-valued invoice backup is rejected before confirmation; `good-existing` survives reload; wordmark `118.375×44`, Edit `44×44`, Privacy `60.453×44`, Terms `51.562×44`; hero `164px` high and selects `/assets/due-board-material-768.avif`; offline reload retains the record; axe serious/critical count 0; only the production origin was requested; zero cookies and console/page errors.
- Representative local/live SHA-256 matches: `index.html` `8f25803faf2c9fd48809621911b26b6063f7c46794602a03d10f478c8aa10534`; JS `634171f5c6722c7baa8f1e895bd708dd320ce7e50994e0399a2f5b2848116367`; CSS `a07b65487c2e668a3853c3ba8f091f09c2e4b564eea6c099230b9c55aa3d6c5e`; service worker `1e7fe046573be7db5fedc47567b968488fa1d462bc1c5da2879121858427d55f`; manifest `46dac07ab0c6b07091eb6415e394b613f980d1b902bb9ac3fc9e645ac891d815`; mobile AVIF `70c10db73f8f9d54fa30aaea8ce095ea7b9f342d0ddff2c977b933a5425c1f96`.
- Lighthouse 12.8.2 against production: performance 100, accessibility 100, best practices 100, SEO 100; FCP 913 ms, LCP 1,363 ms, CLS 0, TBT 0 ms, transfer 84,766 bytes.
- Evidence artifacts: `/work/.evidence/supplier-due-board-repair/verify.json`, desktop/mobile screenshots, fetched HTML, and `lighthouse-live.json`.

## Known limits

- Automated Chromium/axe checks are not a human NVDA/VoiceOver session, and Safari/Firefox were not exercised.
- Lighthouse lab output does not include INP.
