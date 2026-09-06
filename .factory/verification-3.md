# Track supplier bills before they are due — verification 3

## Verdict

**FAIL**

- Implementation reviewed: `bf0a9591328ac48220b2b8c7f8acb14064a9bd79`
- Documentation baseline reviewed: `cbd5e032505e1f77ef5d6b825f26c3e42addc421`
- Supporting repair evidence commit: `7bf4d101f24affab2adc7214c1ed89ace05b0a45`
- Live URL: <https://supplier-due-board.sociobot.in>
- Verified: 6 September 2026 UTC
- Work order: `supplier-due-board-verify-3`
- Finding count: **4** — 1 high, 2 medium, 1 low
- Untested public claim count: **9**

The live app performs its main job and matches the implementation candidate. It does not pass this verification because some declared claim checks do not prove their full claims, several phone links are below the required target size, required landing structure is absent, and some public copy breaks the plain-words rules.

## First screen before scrolling

Fresh 1440×900 desktop and 390×844 phone browsers both showed:

- Job: **Track supplier bills before they are due**.
- Audience: sole proprietors and small businesses who need one local list before they pay.
- First action: **Try it with sample data**. The next line says five sample bills appear right away.
- Facts: free to use, works offline after the first visit, and bills stay in this browser.

Both pages were at scroll position zero, used one `h1` and one `main`, had no horizontal overflow, and loaded without console or page errors. Screenshots are in `/work/.evidence/supplier-due-board-verification-3/`.

## Findings

### F1 — High — nine public claim assertions lack complete declared proof

All 12 commands in `.factory/claims.json` exit successfully, but five tagged tests leave six parts of their own claims unasserted. Three additional public assertions are not covered by a tagged claim check. The claims contract requires observable outcomes, not control presence or a successful click.

| Unproven assertion | Evidence in the declared command |
| --- | --- |
| An attachment survives reload and can be downloaded; the image path works | `@claim:local-attachment` adds only a PDF and reads IndexedDB immediately. It does not perform the reload and download stated in its own sandbox, or try an image. |
| The visible 8 MB attachment limit is enforced | No claim entry or tagged test covers the quantitative limit shown in the bill form. |
| Due summary values are correct | `@claim:board-summary` checks only that the labels “Due in 7 days” and “Overdue” exist. It never asserts the seeded totals or counts. |
| Sorting changes multi-row order | The same test selects **Paid** first. The sample has one paid bill, so its later amount-sort assertion cannot detect broken sorting. |
| The paid date is recorded | `@claim:paid-record` fills a date but asserts only the note and reopen action. |
| The weekly list includes due-soon bills | `@claim:weekly-print` checks the overdue and recently paid suppliers, but not the seeded due-soon supplier. |
| CSV contains the stated records and columns | `@claim:data-controls` checks only the downloaded filename. An empty CSV would pass. |
| Complete JSON backups include attachments | This promise appears in Data controls and Privacy. An ordinary untagged test covers it, but no inventory claim and tagged command do. |
| **Start for real** deletes the demo database | The demo test returns to the real board but never checks that `demo:supplier-due-board` was deleted, as README promises. |

Independent live checks found the current runtime behavior works for the image path, reload persistence, the 8 MB rejection, complete attachment backup, and demo-database deletion. That does not repair the required repeatable claim coverage. A future regression in the listed behavior could leave every declared claim command green.

### F2 — Medium — phone touch targets remain below 44×44 px

Fresh 390 px browser measurements found these visible controls below the required target size:

- Home and demo header **Demo** link: `40.4×44` px.
- Privacy, Terms, and 404 wordmark link: `147.3×27.2` px.
- Privacy email and return links: `171.9×20` and `177×20` px.
- Terms return link: `177×20` px.
- 404 **Open your board** link: `143.5×20` px.
- Legal-page footer **Terms** link: `43×44` px.

The intentionally hidden 13×13 radio inputs were excluded because their visible labels are the targets. This means earlier finding V-03 is only partly closed: its named app targets pass, but the regression test does not inspect all interactive elements or the legal and 404 routes.

### F3 — Medium — required landing and footer structure is incomplete

The site-structure contract requires a **How it works** section with three steps after the product preview. No such section exists on the landing page. It also requires every footer to show “Built by Param Factory” and a version or build ID. The app footer on `/` and `/demo` shows neither; only the static legal and 404 footers do.

This does not block bill tracking, but it is missing required public structure. The earlier R4 repair correctly added the real 404 and sitemap but did not close the rest of the attached site-structure contract.

### F4 — Low — some public copy does not meet the plain-words rules

- The offline-page heading, “The board is out of reach,” is a metaphor instead of naming the state directly.
- The Privacy sentence beginning “Use Data controls…” has 24 words.
- The Terms sentence beginning “To the extent permitted by law…” has 26 words.

The hard limit is 22 words per sentence, and headings may not use metaphor or mood copy. `.factory/copy-audit.md` covers the landing and demo text but omits these public pages. The required first-screen copy itself passes.

## Claim command results

Each command in `.factory/claims.json` was run separately from the clean checkout. Every command ran its tagged test in desktop and phone Chromium.

| Claim ID | Command result | Coverage result |
| --- | --- | --- |
| `demo-sandbox` | 2 passed | Tagged claim passes; README deletion assertion is unproven |
| `record-bills` | 2 passed | Pass |
| `local-attachment` | 2 passed | Incomplete — F1 |
| `board-summary` | 2 passed | Incomplete — F1 |
| `paid-record` | 2 passed | Incomplete — F1 |
| `weekly-print` | 2 passed | Incomplete — F1 |
| `data-controls` | 2 passed | Incomplete — F1 |
| `safe-import` | 2 passed | Pass |
| `offline-reload` | 2 passed | Pass |
| `private-local` | 2 passed | Pass |
| `manual-only` | 2 passed | Pass |
| `free-use` | 2 passed | Pass |

Command success is recorded accurately, but the incomplete assertions keep the claim verdict from passing.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| V-01 unsafe import could erase the board | Closed. Live and local bad-shape imports were rejected before confirmation or mutation; the existing bill survived reload. |
| V-02 whitespace-only supplier | Closed. Live and local checks rejected it and kept the form open. |
| V-03 undersized targets and wordmark name | **Partly open as F2.** The originally named app targets pass, but other app, legal, and 404 links remain below 44 px. |
| V-04 non-immutable asset caching | Closed. Fingerprinted JS, CSS, and images return one-year immutable caching. |
| V-05 MIME and browser policy gaps | Closed. Manifest and AVIF MIME types, CSP, Permissions Policy, referrer policy, nosniff, and HSTS are present. |
| V-06 tall mobile hero | Closed. The phone loads the 66,655-byte 768 px AVIF and the geometry regression passes. |
| R1 missing demo sandbox | Closed. Five sample bills, persistent label, reset, isolated database, deletion on exit, and unchanged real data were observed live. |
| R2 missing claims inventory | **Partly open as F1.** The inventory and commands exist, but nine assertions lack complete tagged proof. |
| R3 first-screen wording | Closed for the first screen. F4 records separate offline and legal copy gaps. |
| R4 missing 404 and sitemap | Closed for those items. Unknown URLs return the designed page with deliberate HTTP 404; sitemap and robots are valid. F3 records other required structure. |
| R5 incomplete route metadata | Closed. Home, demo, Privacy, Terms, and 404 have route titles, descriptions, canonicals, social metadata, and the 1200×630 image. |

## Checks that passed

### Clean checkout

- `npm ci`: 60 packages installed; zero vulnerabilities.
- `npm test`: 21/21 passed.
- `TZ=America/New_York npm test`: 21/21 passed.
- `TZ=Pacific/Kiritimati npm test`: 21/21 passed.
- `TZ=Asia/Kolkata npm test`: 21/21 passed.
- `npm run build`: passed type checking and produced `dist/index.html`.
- `npm run test:e2e`: 39 passed; one intentional desktop skip for the phone-only geometry case.
- `npm run test:claims`: 24/24 passed.
- `npm audit --audit-level=low`: zero vulnerabilities.

### Live product behavior

- The full suite against production passed 39 applicable tests with the same intentional desktop skip.
- Five realistic sample bills appeared immediately. The demo label remained visible.
- Reset restored exactly five sample bills. **Start for real** removed the demo database and returned to the untouched real bill.
- Normal add, attachment, payment, reopen, search, filter, weekly print, export, import, delete, reload, and offline paths passed.
- Invalid whitespace, malformed backup, wrong attachment type, and an attachment over 8 MB were rejected with recovery paths.
- Amount boundaries `0.01` and `999999999.99` saved correctly. A PNG persisted across live reload.
- Keyboard use passed: the skip link is first with a 3 px visible focus ring; its next Tab starts in main content; the bill dialog starts on Supplier; Escape closes it and restores focus.
- At 200% text size on 390 px, the page retained its h1 and had no horizontal overflow.
- Reduced motion used a `0.00001s` dialog duration. No flashing or looping motion was present.

### Accessibility, privacy, routes, and offline update

- Factory URL verification passed: HTTP 200, correct title and `lang`, one h1, one main, complete alt text, labeled buttons, and no console errors.
- Axe 4.10.2 found zero violations of any impact on home, demo, Privacy, Terms, and the designed 404 in both desktop and phone viewports.
- The live demo flow made requests only to the product origin and set no cookies. Bills and attachments remained in the separate local IndexedDB database.
- All internal links returned 200 except the intentional unknown-route link, which returned the expected 404. The privacy email is an explicit `mailto:` link.
- Live offline reload retained the populated board and showed the offline notice.
- An isolated update exercise changed the worker version, showed **Update now**, activated the new worker, reloaded, and replaced the caches with `due-board-v2.0.0-shell` and `due-board-v2.0.0-runtime`.

### Candidate identity and performance

All 22 deployable runtime files from the fresh build matched production byte-for-byte, including HTML, JS, CSS, worker, manifest, legal pages, sitemap, icons, images, and source map. `staticwebapp.config.json` is host configuration and is correctly not served as a public artifact.

Representative SHA-256 matches:

| File | SHA-256 |
| --- | --- |
| `index.html` | `f6bebd96db7ce4f07343f344aa32d302800e31f17c9730977e7d525447d802a6` |
| `assets/index-B3F8gWTx.js` | `b982c63a40f02e2f72782aa985aa3e0f3f5f333e928f5695d3c82d1dc3c8c05e` |
| `assets/index-B9uvBQ3G.css` | `327ac8a2a2c1f89ecc4b9db806c8111fb8c597c62a9fc27ac90a981e22bd0398` |
| `sw.js` | `177c55068e61c3885399e74730acb48672818d618763ad3977f9c8eb6957135b` |

Fresh Lighthouse 12.8.2 mobile results were **99 performance / 100 accessibility / 100 best practices / 100 SEO**. FCP was 1,034 ms, LCP 1,409 ms, CLS 0, total blocking time 107 ms, and transfer 87,984 bytes. Lighthouse did not emit lab INP. Initial JS is 36,576 bytes raw, CSS 22,303 bytes raw, there are no fonts, and the mobile AVIF is 66,655 bytes.

## Scope and limits

This is a static PWA. It has no backend, tenant service, server database, account system, health endpoint, or application rate limit. Backend tenant isolation, restart persistence, health, and 429 checks do not apply. No AI feature is needed for this focused manual task.

Chromium and automated axe checks do not replace a human VoiceOver or NVDA session, or Safari and Firefox testing. These are verification limits, not additional findings.

## Required next work

1. Make every claim command prove the full public promise and add tagged entries for the unlisted attachment, backup, size, and demo-deletion assertions.
2. Give every phone link and button a target of at least 44×44 px, then test all routes and interactive elements.
3. Add the required three-step **How it works** section and complete the app footer attribution and build ID.
4. Replace the offline metaphor, split the two long legal sentences, and extend the copy audit to those public pages.
