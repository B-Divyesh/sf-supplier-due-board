# Due Board — independent product verification

**Verdict: FAIL**

- Candidate: `e221119d944f77081a359a649b0ed33b48292cfc`
- Live URL: <https://supplier-due-board.sociobot.in>
- Verified: 2026-08-28 UTC
- Work order: `supplier-due-board-verify-1`
- Contract: `.factory/brief.json`, `AGENTS.md`, and the supplied PWA, accessibility, performance, and design requirements

The live deployment is the candidate build, not a stale or missing deployment. Core normal workflows, offline use, privacy, build gates, and quantitative budgets pass. The candidate is rejected because invalid import data can replace good local records before rendering fails, leaving the board unusable after reload. A second input-integrity defect allows a blank required supplier and produces a backup the app itself rejects.

## Release-significant defects

### V-01 — High — an inadequately validated import erases the existing board before failing

Reproduced on the live origin in a fresh browser context:

1. Import a valid board containing record ID `good-existing`; confirm it renders.
2. Import a syntactically valid v1 backup whose bill passes the current required checks but has `invoiceNumber` as an object rather than a string.
3. The app offers **Replace board**, proving the file passed `validatePortableBill`.
4. Confirm replacement. IndexedDB is replaced, then rendering fails with `e.replace is not a function`.
5. Reload. The product shows “Your browser did not open the local ledger.” Direct IndexedDB inspection contains only `bad-shape`; `good-existing` is gone.

Expected: fully validate and materialize every field and attachment before confirmation or mutation; a rejected file must leave existing records untouched. Actual ordering in `src/main.ts:481-504` calls `replaceAll` before the first full render exercises unchecked fields.

Impact: a corrupted or hand-edited backup can cause confirmed, irreversible loss of the current local board and persistent failure to display the imported board. The import warning does not make an invalid file destructive by design.

### V-02 — Medium — whitespace satisfies the required supplier field and poisons backup round-trip

Reproduced on the live origin:

1. Add a bill with supplier set to three spaces, amount `15.00`, and a valid due date.
2. Native validation accepts it. Save trims the supplier to `""`; IndexedDB contains the blank supplier and the UI reports one bill.
3. Export the app's own complete JSON backup, delete local data, and import that untouched export.
4. Import rejects it with “This file is not a valid Due Board v1 backup.”

Expected: reject a supplier whose trimmed value is empty before saving. The save path validates before trimming (`src/main.ts:310-345`), while import correctly requires a non-empty supplier (`src/main.ts:481-485`).

### V-03 — Medium — several 390 px touch targets are below the required 44×44 CSS px

Measured from the rendered live page with a saved bill:

- Wordmark/home link: `118×17`
- Bill **Edit** button: `36×44`
- Footer **Privacy** link: `52×24`
- Footer **Terms** link: `44×24`

The visually larger status-radio labels were compliant; their intentionally hidden 13×13 inputs are not counted as defects. Lighthouse's experimental WCAG 2.5.3 audit also flags the wordmark because visible `DUE BOARD` text is replaced by the accessible name `Due Board home` (`label-content-name-mismatch`, debug impact `serious`). The weighted Lighthouse accessibility score remains 100 and standard axe scans have no serious/critical findings.

### V-04 — Medium — production caching does not meet the hashed-asset policy

Hashed JS, CSS, and generated images are all served as:

```text
cache-control: public, must-revalidate, max-age=30
```

The performance contract requires long-lived immutable caching for hashed assets. Conditional requests do work (`If-None-Match` returned 304), but every asset becomes stale after 30 seconds.

### V-05 — Low — response MIME and browser policy hardening are incomplete

- `/manifest.webmanifest` and the AVIF asset are served as `application/octet-stream`, not `application/manifest+json` and `image/avif`.
- No `Content-Security-Policy` or `Permissions-Policy` is present.
- Positive controls: HTTP redirects to HTTPS; TLS certificate is valid 2026-08-28 through 2027-02-28; HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff` are present.
- Chromium still reported zero manifest and installability errors, so the MIME issue did not prevent installation in the tested browser.

### V-06 — Low — the mobile hero does not implement the documented shallow treatment

At 390 px the material image renders about 388×516 px and consumes most of a screen instead of the shallow band specified in `.factory/design.md`. The AVIF `<source>` has only a 1536 px candidate, so mobile downloads 198,634 bytes instead of the available 77,402-byte 768 px WebP. Lighthouse estimated 120 KiB avoidable transfer. This does not exceed the 300 KB hero budget and measured LCP still passes.

## What passed

### Clean checkout and repository gates

The initial tree was clean on `main`, and `HEAD`, `origin/main`, and the requested candidate all resolved to `e221119d944f77081a359a649b0ed33b48292cfc`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 60 packages installed, 0 vulnerabilities |
| `npm test` | PASS; 3/3 Vitest tests |
| `TZ=America/New_York npm test` | PASS; 3/3 |
| `TZ=Pacific/Kiritimati npm test` | PASS; 3/3 |
| `TZ=Asia/Kolkata npm test` | PASS; 3/3 |
| `npm run build` | PASS; includes `tsc --noEmit`, then exact Vite production build |
| `npm run test:e2e` | PASS; 6/6 Playwright tests across desktop and 390×844 mobile |
| `npm audit --audit-level=low` | PASS; 0 vulnerabilities |

There is no lint script or separate lint configuration in the repository. `dist/` was produced successfully.

### Candidate/deployment identity

Every one of the 16 non-source-map files in the fresh `dist/` build was downloaded from its corresponding live path and matched byte-for-byte. Representative SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `dec9793908494117d89052cb11a188b8c9f5351ed969bacee67d50345cf5d7e9` |
| `assets/index-SbixLiXt.js` | `7001e212e99264c3082cc84537b5a7670649495a368332bc058efb8b3192ad4a` |
| `assets/index-CFBp4-tI.css` | `ada33c18f7f589111bc37f930de315dd9e2cf97e9120e54a3749928728c4f9c4` |
| `sw.js` | `14aae0a1ab06452ab63b3764fe229ef227ca862138ba2a62adfbccd2326e2a69` |
| `manifest.webmanifest` | `c84a9a60059540346933dff2ae24864c026b60a4f385948852a6c5f1a834d6eb` |

The built entry names are exactly `index-SbixLiXt.js` and `index-CFBp4-tI.css`; the live HTML references those names.

### End-to-end product behavior

PASS evidence from independent live-browser flows:

- Empty state and both add entry points.
- Required supplier/amount/date native validation; zero amount and step constraints; recovery after correction.
- Minimum amount `0.01` and maximum amount `999999999.99`.
- PDF attachment persistence/download; rejection and recovery for text files and an 8 MB + 1 byte PDF.
- Edit, mark paid with paid date/payment note, edit payment, reopen, delete confirmation, undo, delete-all confirmation.
- A ten-bill board spanning overdue, today, tomorrow, 7/8-day, 30/31-day, and paid 6/7/8-day boundaries.
- Search by invoice reference, all/open/paid filters, 7/30-day filters, amount sorting, filtered empty state, and reset.
- Weekly print generated exactly four attention rows and two recently paid rows; 8-day boundaries were excluded.
- Complete JSON export included attachment bytes; delete/import round-trip restored the bill and byte-identical PDF. CSV exported expected rows.
- Malformed JSON was rejected without changing the current board. V-01 documents the deeper shape-validation failure.
- State survived normal reload and browser storage remained IndexedDB-local.

### PWA/offline/update

- Manifest: zero Chromium manifest or installability errors; 192/512 icons have the declared dimensions; standalone start URL is versioned.
- Live page obtained an active controlling worker, saved `Offline Persistence`, switched fully offline, reloaded, and retained the record plus the offline ribbon.
- `/privacy/` navigated successfully while still offline.
- Cache storage contained `due-board-v1.0.0-shell` and `due-board-v1.0.0-runtime`.
- The update lifecycle was exercised against an in-memory server serving the exact `dist/`: a byte-changed worker raised “A fresh version of Due Board is ready,” **Update now** activated it, `controllerchange` reloaded the page, and the new worker answered with version 2.

### Accessibility and responsive behavior

- Factory `verify-url.sh`: HTTP 200, 653 ms network-idle load, correct title and `lang="en"`, one h1, main landmark, no missing image alt, no unlabeled buttons, and no console/page errors.
- Axe 4.10.2: zero serious/critical violations for desktop populated state, mobile populated state, `/privacy/`, and `/terms/`. Repository tests also scan the empty and open-form states in both viewports.
- Keyboard: skip link was first, visible, and had a solid focus outline; Enter activated the add action; dialog focus began on Supplier; Escape closed the dialog and restored focus to the trigger. Native radio/dialog behavior remained available.
- 390×844: no horizontal overflow at normal sizing or after a simulated 200% root text size. Reduced-motion dialog duration computed as `0.00001s` and final transform as `none`.
- V-03 records target-size failures and the separate experimental accessible-name finding.

### Privacy and outbound traffic

- Full add/attachment/pay/export/import/delete exercise produced only same-origin GET requests. There were no third-party origins, POSTs, analytics, remote fonts, WebSockets, beacons, or cookies.
- The only localStorage key was the non-sensitive currency preference; bills and attachment bytes were in IndexedDB.
- Source scan found network calls only in the same-origin service worker. Privacy and terms pages accurately describe local storage and product limits.
- No console errors or uncaught page errors occurred during valid desktop/mobile workflows.

### Performance and budgets

Lighthouse 12.8.2 against the live mobile URL, simulated throttling:

| Metric | Result |
| --- | --- |
| Performance / Accessibility / Best Practices / SEO | `96 / 100 / 100 / 100` |
| FCP | `903 ms` |
| LCP | `2,028 ms` |
| CLS | `0` |
| TBT | `201 ms` |
| Total transfer | `215,724 bytes` |

Lighthouse does not emit lab INP. The candidate meets the specified LCP and CLS budgets; TBT is reported as context, not substituted for INP.

Production artifact sizes:

- JS: 31,195 bytes raw / 10,339 bytes Brotli over live HTTP (budget 200 KB)
- CSS: 20,957 bytes raw / 5,655 bytes Brotli (budget 50 KB)
- Fonts: 0 bytes (budget 120 KB)
- Mobile-loaded AVIF: 198,634 bytes (budget 300 KB)

## Acceptance summary

| Contract area | Result |
| --- | --- |
| Real job-to-be-done, normal path | PASS |
| Invalid input and safe recovery | **FAIL — V-01, V-02** |
| Desktop/mobile/keyboard/accessibility | **FAIL — V-03** |
| Offline persistence and worker update | PASS |
| Privacy/local-first/outbound traffic | PASS |
| Tests, type-check, production build | PASS |
| Performance size and Lighthouse budgets | PASS |
| Immutable production caching | **FAIL — V-04** |
| Product-specific design/docs/legal/provenance | PASS, with V-06 polish gap |
| Live deployment matches candidate | PASS |

## Verification limits

- Chromium 145 was used, matching the pinned Playwright 1.58.2 browser. No Safari/Firefox session was run.
- Automated axe, Lighthouse, keyboard, and focus checks are not a substitute for a human NVDA/VoiceOver session.
- This is a static PWA, so backend concurrency, server persistence, health/build identity endpoints, and package/CLI consumer installation are not applicable.

## Required next steps

1. Validate the complete imported schema—including string fields, real calendar dates, paid-field consistency, attachment metadata/data, unique IDs, and size limits—before confirmation or IndexedDB mutation. Keep the old board if validation, conversion, or rendering fails.
2. Reject trimmed-empty suppliers before saving and add regression coverage proving every app-generated backup imports successfully.
3. Make all mobile interactive targets at least 44×44 CSS px and align the wordmark accessible name with its visible label.
4. Configure immutable long-lived caching for fingerprinted assets and correct manifest/AVIF MIME types; add CSP and Permissions-Policy.
5. Supply an appropriately sized AVIF/WebP candidate and make the documented mobile hero treatment shallow.
