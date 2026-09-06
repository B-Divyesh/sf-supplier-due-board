# Track supplier bills before they are due — verification 3 handoff

## Result

**FAIL — 4 findings and 9 untested public claim assertions.**

- Implementation reviewed: `bf0a9591328ac48220b2b8c7f8acb14064a9bd79`
- Documentation baseline reviewed: `cbd5e032505e1f77ef5d6b825f26c3e42addc421`
- Supporting repair evidence: `7bf4d101f24affab2adc7214c1ed89ace05b0a45`
- Live URL: <https://supplier-due-board.sociobot.in>
- Full report: [`.factory/verification-3.md`](verification-3.md)

No product code was changed. The live runtime matches the implementation candidate byte-for-byte and the main bill workflow works. Acceptance is blocked by incomplete claim proof, undersized phone targets, missing required site structure, and plain-copy gaps.

## First screen

- Job: track supplier bills before they are due.
- Audience: sole proprietors and small businesses who need one local list before they pay.
- First action: **Try it with sample data**; five sample bills appear immediately.

Fresh desktop and phone screenshots are in `/work/.evidence/supplier-due-board-verification-3/`.

## Findings to repair

1. **High:** nine public assertions do not have complete tagged claim proof. Five existing claim tests leave six assertions unproven, and three public assertions are missing tagged coverage.
2. **Medium:** visible phone links on the app, legal pages, and 404 are smaller than 44×44 px.
3. **Medium:** the landing page lacks the required three-step **How it works** section; the app footer lacks Param Factory attribution and a version/build ID.
4. **Low:** the offline heading is metaphorical, and Privacy and Terms each contain a sentence above 22 words.

See the report for exact assertions, dimensions, copy, and earlier-finding dispositions.

## Verification completed

```sh
npm ci
npm test
TZ=America/New_York npm test
TZ=Pacific/Kiritimati npm test
TZ=Asia/Kolkata npm test
npm run build
npm run test:e2e
npm run test:claims
npm audit --audit-level=low
PLAYWRIGHT_BASE_URL=https://supplier-due-board.sociobot.in npm run test:e2e
```

- Unit and policy tests: 21/21 passed in each time zone.
- Local release suite: 39 passed, one intentional desktop skip.
- Aggregate claims suite: 24/24 command runs passed, but coverage review failed.
- All 12 inventory commands were also run separately; each passed in desktop and phone Chromium.
- Production release suite: 39 passed, one intentional desktop skip.
- Axe: zero violations on home, demo, Privacy, Terms, and 404 at desktop and phone sizes.
- Lighthouse mobile: 99/100/100/100; LCP 1.41 s; CLS 0; 87,984 bytes transferred.
- Production identity: all 22 deployable runtime files matched the fresh build.
- Offline reload and the service-worker update prompt, activation, reload, and cache replacement passed.

## Current product state

The app is a static Vite and TypeScript PWA. Real bills use IndexedDB `supplier-due-board`; the sample uses `demo:supplier-due-board`. It has no backend, account, server database, tenant model, health endpoint, or rate-limit API. Bills, attachments, payment notes, export, import, reset, deletion, and offline reload work in the current runtime.

## Next steps

Repair the four findings without weakening or deleting useful public promises. Rerun each claim command, the full local and live suites, the all-route target scan, axe, offline/update checks, build identity comparison, and Lighthouse before requesting verification 4.
