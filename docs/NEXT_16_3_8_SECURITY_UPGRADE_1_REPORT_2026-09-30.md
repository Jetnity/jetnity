# Jetnity Next.js 16.3.8 Security Upgrade 1 — REPORT

Stand: 30 September 2026
Status: **IMPLEMENTED ON DRAFT / LOCAL GATES AND EXACT-HEAD CI-PREVIEW RECORDED IN THE HANDOFF / NOT A TECHNICAL-LEAD PASS**

Issue: #654
Branch: `chore/next-16-3-8-security-upgrade-1`
Baseline: `main@8571db776bb58042a8107e341052a36cbbe9a50c`
Draft PR: #655

Writer: Jetnity Next.js 16.3.8 security upgrade 1, generation 1
Cursor session: https://cursor.com/agents/bc-4391c41c-ebdc-485c-b1a2-a6de70b69c1f
`originalModelName`: `grok-4.7-high-fast`

This report is the implementation record. It is not an independent Technical-Lead review and it is not Ready or merge.

## 1. Package-availability gate

Recorded before any dependency edit.

| Check | Result |
| --- | --- |
| `node` / `npm` | `v22.14.0` / `10.9.7` |
| `npm view next@16.3.8 version dist-tags --json` | version `16.3.8`; dist-tag `latest` is `16.3.8` |
| `npm view eslint-config-next@16.3.8 version --json` | `16.3.8`; dist-tag `latest` is `16.3.8` |
| GitHub release `v16.3.8` | published `2026-09-30T16:13:46Z`, not draft, not prerelease |
| `v16.3.7` | published `2026-09-29T08:54:51Z` as a bugfix backport. It does not list the 30 Sep advisories. Not installed. |
| Canary | `16.4.0-canary.53` exists and was not installed. |

Gate: **PASS**. Both exact packages are on the official npm registry, and `16.3.8` is the stable `latest` release whose notes list every 30 Sep advisory.

GitHub currently renders the patched patch-digit for those new advisories as `16.3.?` in both the public HTML and the REST API. That redaction is recorded literally in `docs/evidence/next-16-3-8-security-upgrade-1/advisory-matrix.json`. The release notes plus `git compare v16.3.7...v16.3.8` are the evidence that 16.3.8, not 16.3.7, contains the fixes:

- `fix(next/image): Pin DNS resolution when fetching external images`
- `Ensure dynamicParams is respected in opengraph-image.ts`
- `Fix draft mode leaks through cross-request 'use cache' deduplication`
- `Fix MCP middleware DNS rebinding`
- `Match Next data paths case-sensitively`
- `Fix metadata propagation for deduplicated nested caches`
- `Scope response cache keys to their source route`

## 2. What changed

Exact pins:

- `next`: `16.3.3` → `16.3.8`
- `eslint-config-next`: `16.3.3` → `16.3.8`

Unchanged direct pins: `react` `19.2.8`, `react-dom` `19.2.8`, TypeScript `5.9.3`, ESLint `9.39.5`.

`package-lock.json` changes 12 package paths, all `16.3.3` → `16.3.8`: `next`, `eslint-config-next`, `@next/env`, `@next/eslint-plugin-next`, and the eight `@next/swc-*` platform packages. No package paths were added or removed. No unrelated direct dependency moved. Classification: `docs/evidence/next-16-3-8-security-upgrade-1/lockfile-classification.json`.

`next.config.js` was not changed.

The existing framework contract test now expects `16.3.8`. That file is the previous pin assertion, not an application runtime change. New proof:

- `scripts/next-16-3-8-security-upgrade-1-audit.mjs`
- `lib/security/next-16-3-8-security-upgrade-1.test.ts`

Global continuity pointers (`ARCHITECTURE.md`, `ROADMAP.md`, `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md`) were left unchanged, as this slice's write ownership forbids them. They still describe `16.3.3` until a later continuity edit after Technical-Lead acceptance.

## 3. Advisory matrix

Full rows: `docs/evidence/next-16-3-8-security-upgrade-1/advisory-matrix.json`.
Live inventory: `docs/evidence/next-16-3-8-security-upgrade-1/inventory.json`.

| Advisory | 16.3.3 version-affected | Jetnity actually exposed | After 16.3.8 |
| --- | --- | --- | --- |
| GHSA-cjq9-62q9-8jv4 Image Optimization SSRF | yes (`>= 16.0.0 < 16.3.?`) | allowlist exists; no product call site passes those hosts to `next/image` | DNS-pinning fix installed; allowlist unchanged |
| GHSA-f87g-xv8r-7p7x metadata `dynamicParams` | yes (`>= 16.0.0`) | no | prerequisite still absent |
| GHSA-4jqv-mc3x-m676 self-hosted Pages SSG/ISR | yes | no; Vercel App Router | prerequisite still absent |
| GHSA-mcj8-r9mp-w47p root catch-all cache poisoning | yes | no catch-all | prerequisite still absent |
| GHSA-3w37-wq28-93x7 Draft Mode `use cache` | literal range is only `16.3.0` | no | prerequisite still absent |
| GHSA-h694-7cp9-m8p3 nested `use cache` root param | literal range is only `16.3.0` | no | prerequisite still absent |
| GHSA-39w2-rjm5-chcv dev MCP | yes | `next dev` only, not production | patched pin |
| GHSA-vcvr-r3jv-pc5j `next/og` ImageResponse, 22 Sep | yes (`>= 16.2.0 < 16.3.6`) | no `next/og`, no `ImageResponse` | 16.3.8 is after patched `16.3.6` |

Independent re-check, not inherited from the precheck:

- metadata image routes: none
- `dynamicParams` / `generateStaticParams`: none
- dynamic segment: `app/(public)/reisen/[tripId]` with `export const dynamic = 'force-dynamic'`
- SSG/ISR: `app/sitemap.ts` sets `revalidate = 3600`; several public/admin pages set `revalidate = 0` together with `force-dynamic`. No Pages Router.
- root catch-all: none
- `'use cache'` / `cacheComponents` / `experimental.useCache`: none
- `draftMode()`: none
- `next/og` / `ImageResponse`: none
- deployment: `vercel.json` is `{ "version": 2 }`. No `output: 'standalone'`.

## 4. remotePatterns audit

No pattern was tightened or loosened.

| Pattern | Control | In-repo `next/image` use | Decision |
| --- | --- | --- | --- |
| `https://oaidalleapiprodscus.blob.core.windows.net/**` | fixed Azure host, broad path | none | keep. Closure invariant still requires the host. Path is broader than any call site. DNS is Microsoft-operated, not attacker-chosen. |
| `https://<NEXT_PUBLIC_SUPABASE_URL host>/storage/v1/object/public/**` | build-time public env host; fallback `example.supabase.co` only if that env is missing | none | keep. Path is already limited to public objects. Hostname is not request-controlled. |
| `https://jetnity.ai/static/avatars/**` | fixed first-party host and avatar path | none | keep. Closure invariant still requires `jetnity.ai`. |

`next/image` call sites are local only:

- `components/home/HomeHero.tsx` → `/images/hero-bali.png`
- `components/home/HomeInspiration.tsx` → `/images/*.jpg` from `lib/places/inspiration.ts`
- `components/layout/PublicNavbar.tsx` and `components/layout/Footer.tsx` → `/brand/jetnity-logo.png` with `unoptimized`

`avatar_url` exists on the profile type and in account export. No UI renders it through `next/image`.

The image optimizer can still be asked to fetch an allowlisted URL even when product code never builds one. That is why GHSA-cjq9 is config-exposed. The 16.3.8 fix pins DNS for that fetch. This slice did not probe the Azure, Supabase, or `jetnity.ai` hosts.

## 5. Local gates

`docs/evidence/next-16-3-8-security-upgrade-1/local-gates.json`

| Command | Result |
| --- | --- |
| `npm test` | pass, 4092 tests, 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run build` | pass, Next.js 16.3.8 Turbopack. `check:setup` warning: no `.env` / `.env.local` in this workspace |
| `check:setup:ci`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` | pass |
| `npm audit --omit=dev` | exit 1. One high finding: `ws@8.18.3` through `@supabase/realtime-js`. Not a Next advisory. |
| `npm audit` | exit 1. Nine findings in existing dev/transitive tooling. No `next` advisory remains. |

`npm audit fix` was not run.

## 6. Production-like browser regression

Server: `next start` on `127.0.0.1:3010`, banner `Next.js 16.3.8`. Port 3000 was already held by an older `next-server (v16.3.3)` and was not used.

Evidence: `docs/evidence/next-16-3-8-security-upgrade-1/browser-regression.json`

- Homepage H1, definition, canonical `https://jetnity.com`, JSON-LD Organization / WebSite / SoftwareApplication, and `noindex, nofollow` are present.
- `robots.txt` is `User-Agent: *` / `Disallow: /`.
- Manifest, icon, and `/brand/jetnity-logo.png` return 200.
- Local optimizer requests for `/images/hero-bali.png` and `/images/bali.jpg` return 200. A disallowed host returns 400 `"url" parameter is not allowed`. A malformed url returns 400 `"url" parameter is invalid`. No third-party host was probed.
- Chrome at 360×800, 390×844, and 1440×900: `/`, `/login`, `/reisen`, `/admin/login` have no horizontal overflow, no console errors, and no page errors. Inspiration photographs load after scroll. Unauthenticated `/account` renders the login heading.
- Desktop walkthrough confirmed the same pages. RSC prefetch aborts (`net::ERR_ABORTED` on `_rsc`) are navigation prefetches, not document or image failures.

## 7. Boundaries held

No Supabase, Auth, RLS, provider, payment, PrivacyBee, tracking, indexing, Production config, or feature edit. No #626 work. No app or component runtime edit. No follow-up slice. Draft remains Draft. Exact-head GitHub CI and Vercel Preview are recorded in the handoff after the pushed head is known.
