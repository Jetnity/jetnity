# Jetnity Widgets Origin Isolation Foundation 1 — REPORT

**Stand:** 29 October 2026. **Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
**`originalModelName`:** `grok-4.7-high-fast`
**Issue:** https://github.com/Jetnity/jetnity/issues/1090
**Draft PR:** https://github.com/Jetnity/jetnity/pull/1091
**Pre-code comment:** https://github.com/Jetnity/jetnity/pull/1091#issuecomment-6509334810

The pushed branch tip is the exact HEAD. This file is committed with the evidence, so it cannot contain its own commit SHA. The PR comment after push records `git rev-parse HEAD`, merge-base, and ahead/behind.

Protected `origin/main` at implementation: `e462cf7c5910ce75fa6350928326c04e33d94eee`.
Seed before this work: `ee43857e390ead6863726ad7e06262c142f5a45b`.
Machine mode: `NORMAL`.

## What was built

A self-contained app at `apps/widgets-host` with pinned `next@16.4.1`, `react@19.2.8`, and `react-dom@19.2.8`. `turbopack.root` and `outputFileTracingRoot` are the host directory, so the build does not take the repository root lockfile as its workspace. The first build warned that it had selected `/workspace/package-lock.json`; after the root pin, the rebuild did not print that warning.

`lib/fail-closed.ts` returns one 404 response from `inert-contract.json`. The function accepts a forged-context argument and does not read it. Production callers pass nothing. `proxy.ts` discards the request object and returns that response. It exports no path filter, so Next invokes it for framework asset URLs too. Route handlers for `/`, `/embed/discovercars`, `/embed/twelvego`, and the catch-all re-export the same methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS. `skipTrailingSlashRedirect` is on, so a trailing slash is not a redirect.

The body is a single sentence: "This Jetnity widget host is not active. No provider is loaded." There is no Load control, form, iframe, script, or stylesheet. Plain HTML is intentional. A brand stylesheet, font, or image would be another response, and this host is not the public Jetnity product surface.

React and React DOM are installed because Next 16 requires them. Application source does not import them.

## Response contract

Every checked response used these headers once:

- `Cache-Control: no-store`
- `X-Robots-Tag: noindex, nofollow`
- `Referrer-Policy: no-referrer`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Permissions-Policy` with empty allowlists only (no `*`)
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; script-src 'none'; style-src 'none'; img-src 'none'; font-src 'none'; connect-src 'none'; media-src 'none'; worker-src 'none'; manifest-src 'none'; frame-src 'none'`
- `Content-Type: text/html; charset=utf-8`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `X-DNS-Prefetch-Control: off`

Node also sent `Vary: Accept-Encoding`, `Date`, `Connection`, `Keep-Alive`, and `Transfer-Encoding`. There was no `Set-Cookie`, `Location`, `X-Powered-By`, `Access-Control-Allow-Origin`, or `Access-Control-Allow-Credentials`. HSTS is absent on purpose: this server was HTTP on localhost, and this PR does not activate HTTPS.

`frame-ancestors 'none'` means `https://jetnity.com` cannot frame this host today. A later embed requires a separate review that names that exact parent. This PR does not make the host embeddable.

## Separate origin is not a separate site

`lib/origin-contract.ts` records the activation facts:

- `widgets.jetnity.com` and `jetnity.com` would be different origins and the same registrable site.
- `parentCookieDomain` is `.jetnity.com`.
- `subdomainIsolatesCredentials` is `false`.
- `sameOriginSandboxScripts` is `prohibited`.
- `providerScripts` is `separately-gated`.
- `originContractAllowsProviderScripts()` returns `false`.
- DNS activation is `no-go-until-cookie-and-consent-contracts-pass`.

A cookie with `Domain=.jetnity.com` is sent to both hostnames. Subdomain separation does not isolate Jetnity credentials. Before any Infomaniak CNAME or Vercel Git connection, an independent review must read production `Set-Cookie` attribute names and Domain values only, never cookie values. If a credential cookie is parent-domain scoped, the safe host may need a different registrable domain. This session did not read production cookies.

`allow-scripts` together with `allow-same-origin` is prohibited on any same-origin frame, including `srcdoc` and any Jetnity route. Those two flags let a same-origin document reach the parent and drop the sandbox. DiscoverCars' nested frame rejects an opaque ancestor; that is why a distinct origin was prepared. This repository slice does not install a frame, does not copy the #1084 script, and does not copy the #1086 widget. #1089 remains the consent writer. #1087 remains the Product-Owner privacy gate. No provider, Google Tag Manager, font, or Supabase request exists in the host source.

Traveller context is not collected. Citizenship, documents, and trip facts are out of scope for an inert host.

## Build artifact that is not the HTTP response

`next build` still prerenders Next's default `/_not-found` shell. On disk, `.next/server/app/_not-found.html` contains framework `<script>` tags and the meta file records `x-nextjs-stale-time: 300`. That file is gitignored. The live server did not send it. `GET /_not-found` and `GET /_next/static/chunks/3cfn99dbrcvvp.js` both returned the inert 404 HTML, `Cache-Control: no-store`, and no script element. The Next server bundle also contains the framework's cookie parse helpers (`parseSetCookie`). The handlers return `new Response(...)` and the live responses had no `Set-Cookie`.

## Verification actually run

Node `v22.23.4`, npm `10.9.7`, from `apps/widgets-host` after deleting `node_modules`:

- `npm ci` — added 38 packages, audited 39, 0 vulnerabilities
- `npm test` — 4 tests, 4 pass, 0 fail (`tests/inert.test.ts`: forged context, all route methods plus proxy, origin contract, source scan)
- `npm run build` — Next.js 16.4.1 Turbopack, compiled successfully. Routes: dynamic `/`, `/[...slug]`, `/embed/discovercars`, `/embed/twelvego`; static `/_not-found`; proxy present
- `node scripts/widgets-origin-foundation-1/synthetic-http.mjs` — 21/21 pass on `127.0.0.1:41731`
- `node scripts/widgets-origin-foundation-1/source-scan.mjs` — PASS, 13 production files

The synthetic process environment was only `PATH`, `HOME`, `TMPDIR`, and `NODE_ENV=production`. The case list covered root, both embed paths, `consent=1`, unknown paths, trailing slash, `/_not-found`, favicon, robots, `/_next/static`, `/_next/image`, encoded `<script>`, POST with Cookie, Authorization, Origin, Referer, and `Host: widgets.jetnity.com`, a second request with `Host: evil.example`, PUT, PATCH, DELETE, OPTIONS with an Origin, and HEAD. The probe value `JETNITY_INERT_PROBE_7f3a` was not reflected.

A later header dump on port 41732 confirmed a single copy of each contract header and `HAS_SCRIPT false` for `/`, `/embed/discovercars`, `/_not-found`, and the framework chunk URL.

Root checks from the repository root, exit 0:

- `npx eslint --ignore-pattern '**/.next/**' --ignore-pattern '**/node_modules/**' apps/widgets-host scripts/widgets-origin-foundation-1`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run check:api-schutz`
- `npm run check:operating-mode`
- `npm run check:schema-bezug`

`check:schema-bezug` was run again after `git add` of `apps/widgets-host` and `scripts/widgets-origin-foundation-1`, while those paths were in the index. Exit 0. The new files do not call `.from('...')` or `.rpc('...')`.

Not run locally: root `npm run typecheck`, root `npm run lint` without an ignore, root `npm run build`, `npm run auth:pruefen`. Root `next typegen` has already rewritten `next-env.d.ts` in this environment once; that file was restored and must stay unchanged. GitHub CI on this PR is the root App/Auth gate. A root `jetnity-app` Preview is not a deployment of project `jetnity-widgets`.

`eslint .` after a local widgets build fails on `apps/widgets-host/.next/**`. The root ignore is `.next/**`, which does not cover the nested build directory. Current CI lints before the root build and never builds this app, and `.next` is gitignored. Fixing the ignore would edit the root eslint config, which is outside this slice.

No viewport run. The page has no CSS. Widths 320, 390, 768, and 1440 were not opened. #748 personal-browser suspension was respected. This is not hosted, physical-device, TLS, or consent evidence.

## Files

New, and only these trees plus this document set:

- `apps/widgets-host/**` (source, tests, `package.json`, `package-lock.json`, `next-env.d.ts`, `tsconfig.json`, `README.md`)
- `scripts/widgets-origin-foundation-1/source-scan.mjs`
- `scripts/widgets-origin-foundation-1/synthetic-http.mjs`
- `docs/JETNITY_WIDGETS_ORIGIN_FOUNDATION_1_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-29.md`

`docs/JETNITY_WIDGETS_ORIGIN_FOUNDATION_1_TASK_V1_2026-10-29.md` is unchanged. Root app, providers, consent, PrivacyBee, package, CI, Auth, SQL, and Vercel settings were not edited. `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited because they are outside the exclusive write scope. Continuity for this slice is these five documents.

## Database, security, cost

No migration, RLS change, Auth change, or service-role use. No new secret and no project ENV. No paid add-on, provider contract, or new recurring cost. The nested lockfile audit reported 0 vulnerabilities; that is not a production penetration test.

## Recommendation

Keep DNS and the widget Vercel Git connection blocked. The next useful gate, only if the Technical Lead assigns it, is a read-only production cookie-attribute inventory (names and Domain only) plus the existing consent gate. Do not treat this source tree as an embeddable origin while `frame-ancestors` is `'none'`.
