# Jetnity Next.js 16.3.8 Security Upgrade 1 — TASK

Stand: 30 September 2026
Status: **BOUNDED SECURITY DEPENDENCY UPGRADE / ADVISORY APPLICABILITY AUDIT / NO SPECIAL-GATE EXPANSION**

Issue: #654
Branch: `chore/next-16-3-8-security-upgrade-1`
Baseline: `main@8571db776bb58042a8107e341052a36cbbe9a50c`

## 1. Why this slice is now justified

The previously binding framework wait condition is now materially changed.

Official vendor evidence available on 30 September 2026:
- stable release tag: https://github.com/vercel/next.js/releases/tag/v16.3.8
- new Next.js advisories published 30 Sep 2026:
  - https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4
  - https://github.com/vercel/next.js/security/advisories/GHSA-f87g-xv8r-7p7x
  - https://github.com/vercel/next.js/security/advisories/GHSA-4jqv-mc3x-m676
  - https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p
  - https://github.com/vercel/next.js/security/advisories/GHSA-3w37-wq28-93x7
  - https://github.com/vercel/next.js/security/advisories/GHSA-h694-7cp9-m8p3
  - https://github.com/vercel/next.js/security/advisories/GHSA-39w2-rjm5-chcv

Current Jetnity baseline:
- `next: 16.3.3`
- `eslint-config-next: 16.3.3`
- App Router on Vercel
- `images.remotePatterns` is configured
- no TL-precheck runtime match for `dynamicParams`, `next/og` / `ImageResponse`, or productive `'use cache'`; you must independently verify.

GHSA-cjq9-62q9-8jv4 is especially material because the vendor says an allow-listed remote URL can lead to SSRF during Image Optimization and explicitly tells applications with `images.remotePatterns` to audit their allowed hosts.

## 2. Writer identity

Logical agent: **Jetnity Next.js 16.3.8 security upgrade 1**
Generation: **1**
Required model: **Grok 4.7 High Fast**, not Auto.

Record the actual Cursor session URL and `originalModelName` before editing.
If the required model is unavailable, STOP before editing.

## 3. Mandatory package-availability gate BEFORE any dependency edit

The GitHub release tag alone is not enough. Before editing:

1. Query the official npm registry from the workspace:
   - `npm view next@16.3.8 version dist-tags --json`
   - `npm view eslint-config-next@16.3.8 version --json`
2. Prove both exact packages are retrievable.
3. Re-read the official vendor advisories and record the exact affected and patched version ranges relevant to 16.3.x.
4. Confirm that **16.3.8 is on the patched side of every Sep-30 advisory that affects 16.3.3**.

If either exact package is unavailable, or official evidence does not establish 16.3.8 as the appropriate patched stable release:
**STOP. Do not edit package.json or package-lock.json.**
No fallback to 16.3.7.
No canary.
No guessed version.

## 4. Required read / reconstruction

1. `.jetnity/operating-mode.json`
2. `JETNITY_START_HERE.md`
3. Technical-Lead / Cursor operating standard
4. Binding Slice Precheck standard
5. Issue #654
6. `package.json`, `package-lock.json`
7. `next.config.js`
8. all production uses of `next/image`, image URLs and image-source helpers
9. route tree relevant to:
   - metadata image routes
   - dynamic segments / `generateStaticParams` / `dynamicParams`
   - SSG/ISR / revalidate
   - root catch-all routes
   - `'use cache'` / Cache Components
   - Draft Mode
10. any `next/og` / `ImageResponse`
11. deployment assumptions proving Vercel vs self-hosted
12. latest current main, open PRs/issues, CI and Vercel

Live evidence wins.

## 5. Upgrade contract

Only if §3 PASS:

- exact-pin `next` from `16.3.3` to **`16.3.8`**
- exact-pin `eslint-config-next` from `16.3.3` to **`16.3.8`**
- regenerate `package-lock.json` with the repository's npm/Node 22 workflow
- do **not** intentionally bump React, ReactDOM, TypeScript, ESLint, Supabase, UI libraries, Playwright, or any unrelated direct dependency
- inspect every lockfile change; classify expected `@next/*`/SWC/transitive security-release movement vs unexpected drift
- if npm attempts unrelated direct dependency movement, STOP and make the install more constrained; do not accept broad drift

No package-manager change.

## 6. Jetnity-specific advisory matrix — REQUIRED

Create a factual matrix for every 30-Sep advisory listed in §1:

For each:
- GHSA / CVE if available
- severity
- affected version range
- patched version(s)
- prerequisite/runtime condition
- whether current Jetnity 16.3.3 is version-affected
- whether current Jetnity code/config is actually exposed
- exact evidence path/query
- result after 16.3.8
- any residual configuration hardening needed

Do not mark “not affected” merely because search returned zero once. Inspect the route tree and config.

Also retain awareness of the Sep-22 `next/og ImageResponse` advisory GHSA-vcvr-r3jv-pc5j: current 16.3.3 is in its affected version range, while TL precheck found no `next/og` runtime path. Re-verify this and record that 16.3.8 is beyond its patched version.

## 7. Image Optimization / remotePatterns audit — HIGH priority

Current `next.config.js` allows:
1. `https://oaidalleapiprodscus.blob.core.windows.net/**`
2. `https://<NEXT_PUBLIC_SUPABASE_URL host>/storage/v1/object/public/**`
3. `https://jetnity.ai/static/avatars/**`

For each pattern:
- identify actual call sites and whether URL/host/path can be influenced by untrusted user/provider data;
- document DNS/ownership trust assumptions without exposing secrets;
- verify path restriction is no broader than required;
- distinguish “fixed trusted host” from “attacker-controlled host”;
- determine whether any pattern can be removed or narrowed without breaking accepted product behavior.

**Do not change `next.config.js` merely to make the audit look stricter.**
Only harden a pattern if actual repository evidence proves a narrower pattern is safe and needed.
If a config hardening is made, add focused tests/evidence and verify all affected images.

Never add wildcard hostnames or loosen the allowlist.

## 8. Allowed write ownership

Primary:
- `package.json`
- `package-lock.json`

Conditional only if independently justified by §7:
- `next.config.js`

Focused proof:
- new `lib/security/next-16-3-8-security-upgrade-1.test.ts` or equivalent pure test
- new `scripts/next-16-3-8-security-upgrade-1-audit.mjs`
- `docs/NEXT_16_3_8_SECURITY_UPGRADE_1_{TASK,REPORT,HANDOFF,SELF_REVIEW}_2026-09-30.md`
- `docs/evidence/next-16-3-8-security-upgrade-1/**`

Do not edit application runtime/components merely to accommodate the dependency unless the new stable version causes a genuine regression. If runtime changes are required, STOP and report the minimal scope amendment before editing them.

Do not edit global continuity pointers in this implementation slice.

## 9. Required local gates

Before upgrade:
- record `node --version`, `npm --version`
- `npm ls next eslint-config-next react react-dom --depth=0`
- relevant source/config inventory
- package/lock hashes if useful

After upgrade:
- `npm ls next eslint-config-next react react-dom --depth=0` proving exact versions
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run check:setup:ci`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run check:operating-mode`
- `npm audit --omit=dev` and full `npm audit` as supportive evidence; do not blindly run `npm audit fix`

Record any remaining audit findings accurately.

## 10. Browser / runtime regression evidence

Use production-like local runtime after successful build.

At minimum:
- public homepage 360×800, 390×844, 1440×900
- official navbar logo and Hero
- external inspiration/remote images that exercise the image optimizer where possible
- public image optimizer request behavior for a valid allowed image
- malformed/disallowed image URL remains rejected/fail-closed
- Trip Workspace representative page/entry
- Login/account public entry
- Admin login or safe admin shell entry without fabricating authenticated proof
- manifest/icon routes
- `robots.txt` and homepage `noindex` remain unchanged
- no console/page errors
- no unexpected external origins
- no horizontal overflow on primary homepage widths

Do not use a security exploit payload against any third-party host.
No active SSRF exploitation.
This is upgrade/regression evidence, not offensive testing.

## 11. Search / AI / brand non-regression

The dependency update must not change:
- final premium homepage H1/definition
- canonical
- JSON-LD
- noindex/robots launch gate
- official Jetnity logo asset and rendering
- mobile-first layout
- capability truth

## 12. CI / Vercel exact-head gates

Before STOP:
- exact branch head
- current main
- merge-base / ahead / behind
- changed-path manifest
- GitHub Actions exact head SUCCESS
- Auth configuration job SUCCESS
- Typecheck/Lint/Build SUCCESS
- exact-head Vercel Preview READY
- Preview runtime smoke
- open GitHub review threads
- unresolved Vercel toolbar threads
- no Production deployment or merge by Cursor

## 13. Hard boundaries

No Supabase/Auth/RLS/schema mutation.
No provider contact/activation/call/secret.
No payment.
No #626 continuation/workaround.
No PrivacyBee/legal edit.
No tracking/ads.
No public indexing/robots launch activation.
No Production configuration mutation.
No cost commitment.
No new feature.
No version beyond 16.3.8 in this slice.
No fallback to canary or 16.3.7.

## 14. Stop

Remain Draft.
Cursor never Ready.
Cursor never merges.
No follow-up slice.
STOP for independent main-chat Technical-Lead security + dependency + regression review.
