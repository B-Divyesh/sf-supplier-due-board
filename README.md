# Track supplier bills before they are due

Due Board is for sole proprietors and small businesses who need one local list before they pay.

Live product: <https://supplier-due-board.sociobot.in>

Try the isolated sample: <https://supplier-due-board.sociobot.in/demo>

## What it does

- Records supplier, reference, amount, currency, and a local-calendar due date.
- Keeps a PDF or image attachment in browser storage.
- Shows due totals and supports search, filters, and sorting.
- Records a paid date and payment note, and can reopen a bill.
- Prepares a weekly supplier review of overdue, due-soon, and recently paid bills.
- Exports JSON and CSV, imports a backup, and deletes local data.
- Rejects an invalid backup without changing current bills.
- Works offline after the first visit.
- Does not connect to a bank or send a payment; a paid status is a manual record.
- Free to use.

## Sample data

**Try it with sample data** opens five realistic supplier bills at `/demo`. The sample has its own IndexedDB database. **Reset demo** replaces only sample data. **Start for real** deletes the sample and returns to the real board. See [`.factory/demo.md`](.factory/demo.md) for the full sandbox contract.

## Privacy and storage

The board works without an account and makes no tracking requests. Bills and attachments stay in this browser. A browser reset or device loss can remove local data, so export JSON backups if the records matter. See the in-product [privacy policy](https://supplier-due-board.sociobot.in/privacy/) and [terms](https://supplier-due-board.sociobot.in/terms/).

## Run locally

Requires a current Node.js release and npm.

```sh
npm ci
npm run dev
```

Vite prints the local development URL. Service workers are intentionally disabled in development; use the production preview to exercise offline behavior.

## Test and build

```sh
npm test
npm run build
npm run test:e2e
npm run test:claims
```

- `npm test` runs unit and static deployment-policy tests.
- `npm run build` is the deployment build command. It type-checks and writes the static application to `dist/`, with `dist/index.html` at its root.
- `npm run test:e2e` starts the built preview and runs Chromium flows at desktop and 390 px mobile widths, including IndexedDB persistence, attachments, payment status, accessibility scans, and a fully offline reload.
- `npm run test:claims` runs all visitor-claim checks from `/demo`. The inventory and exact individual commands are in [`.factory/claims.json`](.factory/claims.json).
- Deployment-policy tests cover immutable asset caching, browser security headers, MIME mappings, the demo route, and the responsive mobile AVIF.

For a clean-clone verification:

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run test:claims
```

Playwright is pinned to `1.58.2`; the CI or worker image must provide its Chromium browser, or run `npx playwright install chromium` once.

## Deployment

Deploy the contents of `dist/` as a static site. Do not deploy the repository root. The host should:

- serve `privacy/index.html` at `/privacy/`, `terms/index.html` at `/terms/`, and `404.html` for unknown routes;
- honor `staticwebapp.config.json`, including one-year immutable caching for `/assets/*`, correct AVIF/manifest MIME types, and the declared CSP and Permissions Policy;
- use HTTPS so IndexedDB, installation, and service workers are available.

The factory owns DNS and production deployment. No environment variables, API keys, billing integration, or server process are required.

## Design and provenance

The concrete-and-moss visual system and generated-image provenance are documented in [`.factory/design.md`](.factory/design.md). The retained source and prompt sidecars live in `assets/src/`; optimized AVIF and WebP outputs ship from `public/assets/`.

## License

MIT — see [LICENSE](LICENSE).
