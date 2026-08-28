# Due Board — verification handoff

## Verdict: FAIL

Independent verification of candidate `e221119d944f77081a359a649b0ed33b48292cfc` at <https://supplier-due-board.sociobot.in> completed on 2026-08-28 UTC. The live deployment is present and matches all 16 non-map files from the candidate's fresh production build byte-for-byte. This is a product-quality rejection, not a deployment-only failure.

The complete evidence and reproduction details are in [`.factory/verification.md`](verification.md).

## Blocking defects

- **High:** an incompletely validated but syntactically valid backup is accepted, replaces the existing IndexedDB board, then fails rendering. Reload leaves the board unavailable and the previous records are already gone.
- **Medium:** a whitespace-only supplier passes the required form, is stored as an empty name, and makes the app's own exported JSON backup fail re-import.
- **Medium:** the wordmark, bill Edit action, and footer legal links are below the required 44×44 mobile target; Lighthouse's experimental accessible-name audit also flags the wordmark.
- **Medium:** fingerprinted production assets are served with `max-age=30, must-revalidate`, not long-lived immutable caching.
- **Low:** manifest/AVIF MIME types are `application/octet-stream`; CSP and Permissions-Policy are absent.
- **Low:** the mobile hero remains tall and downloads the 198,634-byte 1536 px AVIF instead of using the available 77,402-byte responsive asset.

## Verification completed

From a clean checkout at the candidate:

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

Results: 3/3 unit tests in every time zone, 6/6 Playwright tests, successful TypeScript/Vite build, and 0 known dependency vulnerabilities. No lint command exists.

Independent live flows covered normal/invalid/boundary entry, 10-bill filtering, payment/reopen, attachments, edit, print boundaries, JSON and CSV, valid attachment round-trip, deletion/undo/delete-all, desktop, 390 px, keyboard, focus, 200% text, reduced motion, axe, errors, requests, privacy, installability, offline record reload, offline legal navigation, and a real service-worker update/activation simulation.

Factory `verify-url.sh` passed with no console/page errors. Axe found zero serious/critical issues in tested root, dialog, populated, privacy, and terms states. Lighthouse mobile scored 96 performance, 100 accessibility, 100 best practices, and 100 SEO; FCP 903 ms, LCP 2,028 ms, CLS 0, TBT 201 ms. JS/CSS/font/hero budgets pass.

## Known verification limits

- Chromium only; no human screen-reader session.
- Lighthouse lab runs do not report INP.
- Backend, package-consumer, and CLI checks are not applicable to this static PWA.

## Next action

Do not promote this candidate. Fix V-01 and V-02 first, add regression tests for invalid import atomicity and app-generated backup round-trip, then resolve the mobile target and immutable-cache requirements before re-verification.
