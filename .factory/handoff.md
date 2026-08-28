# Due Board — build handoff

Work order: `supplier-due-board-build-1`

Completed: 2026-08-28

Deploy class: static PWA; publish `dist/`

## What was built

- A complete IndexedDB-backed supplier bill board with supplier, reference, amount/currency, local-calendar due date, status, paid date, payment note, and an optional device-local PDF/image attachment.
- Clear overdue, due-in-seven-days, and paid-this-month totals; full-text search; status and date-window filters; due/supplier/amount sorting.
- Add and edit flows, a separate proof-of-payment step, reopen, specific delete confirmation, and an eight-second undo for an individual bill deletion.
- A weekly print layout containing overdue and next-seven-day open bills plus payments recorded in the prior seven days.
- Complete versioned JSON export/import including attachments, spreadsheet-friendly CSV export, and a confirmed delete-all path.
- A hand-written PWA shell: manifest, 192/512 maskable icons, versioned precache, runtime asset cache, offline fallback, installed-app start URL, and an in-app update prompt. A disconnected reload retains the board and IndexedDB records.
- Product-specific concrete-and-moss responsive UI, focused desktop/mobile layouts, empty/loading/error/offline states, visible focus, reduced-motion fallback, and print styling.
- Static `/privacy/` and `/terms/` pages. No analytics, external scripts, external fonts, account system, API, or payment code.
- One original generated material still life. The accepted source, exact prompt, factory deployment, and visual review are recorded in `.factory/design.md` and `assets/src/`. Delivery sizes: AVIF 198,634 bytes; 1536 WebP 259,134 bytes; 768 WebP 77,402 bytes.

## Run and verify

From a clean checkout:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

The exact deployment build command is `npm run build`. It type-checks first and writes `dist/index.html` plus all static assets under `dist/`.

Verification completed on 2026-08-28:

- `npm test`: 3/3 plain-date and weekly-review tests passed.
- `npm run test:e2e`: 6/6 Playwright checks passed across desktop Chromium and a 390×844 touch viewport. The flow creates an attached invoice, persists it through reload, downloads the local attachment, records and reopens payment, and exports a complete backup.
- Offline test: service worker reached active control, the browser was switched fully offline, and the complete board reloaded at both viewport sizes.
- Axe integration: zero serious or critical violations in the empty dashboard and open bill-form states at both viewport sizes.
- Factory `verify-url.sh`: HTTP 200; title present; `lang="en"`; exactly one h1; main landmark present; zero missing image alt attributes; zero unlabeled buttons; zero console/page errors. Measured load was 596 ms on the local preview.
- Mobile Lighthouse 12.8.2, simulated throttling: Performance **97**, Accessibility **100**, Best Practices **100**, SEO **100**. FCP 949 ms; LCP 2,453 ms; CLS 0; total blocking time 75 ms; Speed Index 949 ms. INP is not emitted for a one-load lab audit; the interaction proxy is the 75 ms TBT plus the passing browser workflows.
- Production payload: initial JS 31,156 bytes (10.25 KB gzip), CSS 20,957 bytes (5.46 KB gzip), no font payload, mobile WebP 77,402 bytes, AVIF 198,634 bytes. These are below the product budgets.
- `npm audit`: zero known vulnerabilities.

## Product boundaries and known gaps

- Data is intentionally device/browser local and does not sync. Clearing site data, losing the device, or private-browsing eviction can remove it; the interface and privacy page direct users to make JSON backups.
- Attachments are limited to PDF/images up to 8 MB each to keep browser storage manageable. CSV names attachments but cannot embed them; complete JSON backups do embed them.
- A paid mark is the user’s record only. Due Board neither initiates nor verifies payments and offers no financial advice or payment guarantee.
- The accessibility audit is automated plus keyboard/browser-flow coverage; a human VoiceOver/NVDA session remains useful before a larger public launch.
- No reminder notifications or background scheduling were added because the researched v1 is a weekly review board, not an alerting or banking service.

## Suggested next steps

1. Deploy `dist/` over HTTPS and smoke-test `/`, `/privacy/`, and `/terms/` on the production static host.
2. Pilot with sole proprietors entering at least ten real bills, observing whether the weekly printed list replaces inbox review.
3. Only after pilot evidence, consider optional reminder notifications or saved export templates without adding bank connectivity or accounting scope.
