# Jetnity Dependency Patch Remediation 1 — REPORT

**Date:** 2026-10-26  
**Writer:** Jetnity Dependency Patch Remediation 1 — Cursor Generation 1  
**Session:** https://cursor.com/agents/bc-6579ee4a-5874-4701-b1b0-fd8382cde28d  
**Model:** `run-info.originalModelName=grok-4.7-high-fast`  
**TASK:** immutable V1, blob `faae362420c57d2b7a0fac2da2c90096d75eca5c`

## Advisory dispositions

Re-fetched from `GET /advisories/{id}` and cross-checked with OSV. Tarball SHA-512 matched the registry integrity. Evidence: `docs/evidence/dependency-patch-remediation-1/advisory-registry.json`.

1. **GHSA-96hv-2xvq-fx4p** (high, CVE-2026-48779), ws memory exhaustion. Range `>= 8.0.0, < 8.21.0`, first patched `8.21.0`. Lock entry `8.18.3` was inside the range. Resolved to `8.21.0`. OSV returns no advisory for `ws@8.21.0`.
2. **GHSA-58qx-3vcg-4xpx** (medium, CVE-2026-45736), ws uninitialized memory disclosure. Range `>= 8.0.0, < 8.20.1`, first patched `8.20.1`. The same `8.21.0` resolution is above that threshold. This is a separate disposition from item 1, not a second package change.
3. **GHSA-68fv-2mgg-jv7q** (high, CVE-2026-93749), source-map-js indexed source-map offset. Range `>= 1.0.0, < 1.2.2`, first patched `1.2.2`. Lock entry `1.2.1` was inside the range. Resolved to `1.2.2`. OSV returns no advisory for `source-map-js@1.2.2`.

Zod `3.25.76` was not changed. GHSA-mrhx-c7xc-m3w5 stays open. This report does not clear the R107 set of 42 advisory/path pairs.

## What changed

`package-lock.json` only. Parent ranges already allowed the targets: `@supabase/realtime-js@2.15.5` depends on `ws@^8.18.2`, and `postcss@8.5.23` depends on `source-map-js@^1.2.1`. Neither published package gained dependencies, and engines, license, and peer metadata are unchanged, so no override and no direct dependency were added.

`npm update ws` was not used. Registry `latest` is `ws@8.22.0`, which would leave the assigned version. `source-map-js@1.2.2` is the registry latest.

Compared with seed `9dfbb9bcebbbc162564d96ef1f8c661471ade547`: 0 packages added, 0 removed, 2 identity changes, 0 other field changes. Preserved: Next `16.4.1`, React and React-DOM `19.2.8`, Zod `3.25.76`, `@supabase/supabase-js@2.57.2`, `realtime-js@2.15.5`, `postcss@8.5.23`, and the `simple-swizzle@0.2.2` override.

## Installed tree

`npm ci` on Node v22.23.4 / npm 10.9.7 added 532 packages and did not rewrite the lockfile. `npm ls` shows one path each:

- `@supabase/supabase-js@2.57.2` → `@supabase/realtime-js@2.15.5` → `ws@8.21.0`
- `postcss@8.5.23` → `source-map-js@1.2.2`

Installed `package.json` versions match. Those two npm resolutions are the patched lockfile instances. `@types/ws@8.18.1` remains the TypeScript types package. Its package name is `@types/ws`, not `ws`.

## Bundled residual, separate from the lockfile patch

A recursive read of installed manifests whose `name` is `ws` or `source-map-js` also finds `node_modules/next/dist/compiled/ws/package.json`. That manifest names `ws` and has no `version` field. `index.js` is 45,840 bytes, SHA-256 `af354cb13a11abe910cdbcb70943cb450b01b24f322026ae3f88d428d148395d`. It does not appear in the lock map or in `npm ls`. Its published version is **UNKNOWN**. Its advisory disposition is **UNKNOWN**. The npm result for `ws@8.21.0` does not clear this bundle.

Source read in Next `16.4.1`, without a framework upgrade:

- `next/dist/server/node-environment-baseline.js` defines `globalThis.WebSocket` only when it is not already a function. The getter returns `require('next/dist/compiled/ws').WebSocket`. The production file `next/dist/compiled/next-server/server.runtime.prod.js` contains that same guard and was not executed.
- The dev hot-reloader modules `next/dist/server/dev/hot-reloader-webpack.js` and `hot-reloader-turbopack.js` require `next/dist/compiled/ws` at load. Those modules were not loaded in this check.

Local runtime on Node v22.23.4, in child processes, with no frames sent: while native `WebSocket` was already a function, requiring the baseline left that same function in place and did not put `compiled/ws` in `require.cache`. In a second process, after `globalThis.WebSocket` was deleted, reading the getter loaded `/workspace/node_modules/next/dist/compiled/ws/index.js`. That is local guard evidence. Deployed reachability stays **UNKNOWN**. It is not a Production execution.

`next/dist/compiled/source-map` is package name `source-map`, not `source-map-js`. The only installed manifest named `source-map-js` is `1.2.2`.

Detail: `docs/evidence/dependency-patch-remediation-1/bundled-ws-residual.json`.

## Commands

Recorded in `docs/evidence/dependency-patch-remediation-1/verification.json` against head `c04dce53930092588f237644d7f20223bec71e2e`.

| Command | Exit |
| --- | --- |
| `npm ci` | 0 |
| `npm run check:setup:ci` | 0, warning: no `.env` |
| `npm run check:operating-mode` | 0, PASS |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm test` | 1 — 7238 pass, 11 fail, 5 skipped |
| `npm run check:api-schutz` | 0 |
| `npm run check:schema-bezug` | 0 |
| `npm run check:dead` | 0 |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run build` | 0, compiled in 11.7s |

The 11 failures are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED: local PostgreSQL binaries are required`. No hosted database was contacted and PostgreSQL was not installed. The production build and the non-database suite passed. These failures are an environment limit of this session, not a lockfile regression observed in the failure text.

`npm audit` reports 2 moderate and 7 high, total 9, and exits 1. Names: `brace-expansion`, `browserslist`, `glob`, `minimatch`, `picomatch`, `playwright`, `postcss-selector-parser`, `yaml`, `zod`. `ws` and `source-map-js` are absent. This is observed audit output, not proof of exploitability and not grounds to widen the patch.

## Boundaries held

No application, test, script, workflow, Auth, DB, provider, secret, or environment edit. No new cost. Traveller-context collection is not relevant to this lockfile pin. No browser session. Integration S→T→A→U→K was not performed.

## Limits

A later unlocked `npm update` could select `ws@8.22.0` because the parent range allows it. This lockfile pins `8.21.0` for `npm ci`. Newer `8.21.x` and `8.22.0` releases exist; OSV listed nothing for `8.21.0`, and they were not reviewed as extra fixes. The Next-vendored `ws` bundle remains, with version and advisory disposition UNKNOWN. Zod remains. No global advisory closure is claimed.
