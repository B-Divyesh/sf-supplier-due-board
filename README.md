# Due Board

Due Board is a private, offline-first list of supplier bills for sole proprietors and household-sized businesses. It answers three questions without becoming accounting software: what is due, what is late, and what was paid?

Live product: <https://supplier-due-board.sociobot.in>

## What it does

- Records supplier, invoice reference, amount, currency, and an unambiguous local-calendar due date.
- Keeps an optional PDF or image attachment inside browser storage.
- Groups overdue, next-seven-day, and paid-this-month totals while allowing search, filters, and sorting.
- Records a manual paid date and proof-of-payment note; paid bills can be reopened.
- Prints a focused weekly review: overdue and next-seven-day bills plus the last seven days of payments.
- Exports a complete JSON backup including attachments, exports CSV for spreadsheets, imports backups, and deletes all local data on request.
- Installs as a PWA and works after the network is disconnected.

It intentionally does not connect to a bank, move money, scan invoices, create journal entries, or verify that a payment reached a supplier.

## Privacy and storage

There is no account, analytics script, or remote application database. Bills and attachments are stored in IndexedDB on the current browser profile. A browser reset or device loss can remove them, so regular JSON exports are important. See the in-product [privacy policy](https://supplier-due-board.sociobot.in/privacy/) and [terms](https://supplier-due-board.sociobot.in/terms/).

## Run locally

Requires a current Node.js release and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL. Service workers are intentionally disabled in development; use the production preview to exercise offline behavior.

## Test and build

```sh
npm test
npm run build
npm run test:e2e
```

- `npm test` runs the plain-date and weekly-review unit tests.
- `npm run build` is the deployment build command. It type-checks and writes the static application to `dist/`, with `dist/index.html` at its root.
- `npm run test:e2e` starts the built preview and runs Chromium flows at desktop and 390 px mobile widths, including IndexedDB persistence, attachments, payment status, accessibility scans, and a fully offline reload.

For a clean-clone verification:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Playwright is pinned to `1.58.2`; the CI or worker image must provide its Chromium browser, or run `npx playwright install chromium` once.

## Deployment

Deploy the contents of `dist/` as a static site. Do not deploy the repository root. The host should:

- serve `privacy/index.html` at `/privacy/` and `terms/index.html` at `/terms/`;
- serve assets with normal cache headers (the versioned service worker manages its own shell caches);
- use HTTPS so IndexedDB, installation, and service workers are available.

The factory owns DNS and production deployment. No environment variables, API keys, billing integration, or server process are required.

## Design and provenance

The concrete-and-moss visual system and generated-image provenance are documented in [`.factory/design.md`](.factory/design.md). The retained source and prompt sidecars live in `assets/src/`; optimized AVIF and WebP outputs ship from `public/assets/`.

## License

MIT — see [LICENSE](LICENSE).
