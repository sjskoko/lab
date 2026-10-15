# Aggregate GitHub Pages traffic

**Status: implemented and tested; not collecting yet.** The hosted collector could not be registered because the hosting service returned an internal error. The frontend endpoint remains empty until a working collector has been deployed and verified. No visitor counts or past traffic are invented.

## What is implemented

- One page-view event for each visible document load on the Orbit studio, Orbit Story, or Interactive Lab hub.
- A durable SQL counter, aggregated by minute and page; calendar days use Asia/Seoul.
- A public dashboard that refreshes every 15 seconds, a JSON statistics endpoint, and a dynamic 30-day SVG graph for GitHub READMEs.
- No cookies, visitor IDs, stored IP addresses, URL queries, referrers, file names, uploaded images, or drawing data. DNT, GPC, and a local opt-out are respected. Requests omit credentials and referrers.
- The offline Orbit HTML never sends analytics, even if subsequently hosted elsewhere.

These are **page views, not unique visitors**. Reloading counts again. Browser blockers, failed requests, bots and deliberate spoofing can affect totals. An origin allowlist rejects other browser sites but is not proof of a human visitor. Each page is capped at 600 accepted views per minute. Hosting providers still receive ordinary network metadata.

## Deploy the collector

`worker.mjs` exports a standard Cloudflare Worker handler. It needs a D1 binding called `DB`. No third-party analytics account or browser API secret is used.

With an authenticated Cloudflare account:

1. Create a D1 database: `npx wrangler d1 create interactive-lab-traffic`.
2. Copy the returned database ID into `wrangler.jsonc`.
3. Apply the included schema: `npx wrangler d1 migrations apply DB --remote`.
4. Deploy: `npx wrangler deploy`.
5. Open the returned URL, check `/health`, and confirm `/api/stats` returns an empty, valid result. Do not count verification requests as visitor traffic.

The same handler can be mounted in a Sites server using its hosted D1 binding. Sites registration must succeed before publishing. Existing private Sites must retain their access settings.

## Activate a project

From this directory, run:

```sh
node configure.cjs --project orbit --origin https://YOUR-DEPLOYED-COLLECTOR --root /path/to/orbit-fourier-studio
node configure.cjs --project lab --origin https://YOUR-DEPLOYED-COLLECTOR --root /path/to/lab
```

This writes a **public** collection URL to `dist/analytics-config.js` and replaces the README status image with the live graph. It never writes an API token. Rebuild the project and commit the changes to its GitHub repository. For Orbit, run `npm run build:offline`; the offline build removes the tracker scripts.

Open each deployed GitHub Pages page once and verify the matching `orbit`, `story`, or `lab` counter advances. Dashboard and graph requests themselves do not count. Initial verification visits are real page loads and should be disclosed when reporting initial totals.

## Routes

| Route | Purpose |
| --- | --- |
| `POST /api/collect` | Accept only `{ "page": "orbit" }`, `story`, or `lab`, from the configured GitHub Pages origin |
| `GET /api/stats?site=orbit` | Orbit + Story aggregates; `lab` and `all` are also available |
| `GET /chart.svg?site=orbit` | Dynamic 30-day SVG graph, generated from stored counts |
| `GET /?site=orbit` | Live dashboard, automatically refreshed while visible |
| `GET /health` | Health response without incrementing traffic |

The SVG response requests no caching, but **GitHub Camo may still delay README updates**. A README cannot run JavaScript or refresh itself continuously. Clicking its graph opens the current dashboard. Counts begin only after activation; historical visits cannot be recovered.

## Add another demo

Add its ID and label to `PAGES` in `worker.mjs`, its pathname in `client.js`, and its group mapping if needed. The SQL schema does not store personal data. Deploy the collector before activating the new client.

## Verification

```sh
node tests/check.mjs
```

Checks cover KST midnight, allowed origins/pages, strict payload size and fields, DNT/GPC/opt-out, disabled/offline behavior, privacy request headers, empty SVG rendering, and actual SQLite upserts and burst caps. A live hosted collection round-trip remains pending deployment.
