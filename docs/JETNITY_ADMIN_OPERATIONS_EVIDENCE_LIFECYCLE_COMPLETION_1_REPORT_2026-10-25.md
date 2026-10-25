# R106 O — Admin Operations Evidence Lifecycle Completion 1 — REPORT

Date: 2026-10-25. Same session `bc-5996ba4c-88a4-4a2d-b1ce-d7f1a0e4d79d`, model `grok-4.7-high-fast`.

## Implemented

The first delivery remains: both boards validate every report, age parent and child from their own floors, and keep a current 401/403 latched until one explicit permitted GET. R1 changes that delivery at `1c1bd44f5c15716c70b413a574ee9f6ba9ae7587`.

- `endpunktSetzen` increments `quelle` on every real endpoint change and clears the GET lock. `laufGueltig` requires the same `quelle`. The hook writes that stand before `abort()`.
- `propsBeginnen` returns no run while `getGesperrt`. The props effect returns before validation when a GET, a denial, or an accepted report is already current.
- `buchAusBericht` stores each card `checkedAt` as `geprueftMs`. `alterFortschreiben` latches unknown when either accept anchor is missing, and separately when that card time is non-finite or in the future. The raw report is not mutated.
- Both boards expose `data-operations-endpoint` so the harness can see an endpoint commit.
- O-1 stays the existing presentation-test adaptation. Validation, collectors, TTL maps, `ladezustand`, routes, and APIs were not edited for R1. Validator digest is unchanged.

## Authoritative mounted proof

```text
OPERATIONS_EVIDENCE_CHROMIUM=/usr/local/bin/google-chrome node scripts/admin-operations-evidence-lifecycle-completion-1/run.mjs
```

Exit 0. 68/68. Directory `docs/evidence/admin-operations-evidence-lifecycle-completion-1/run-1792923659785/`. Head `1c1bd44f5c15716c70b413a574ee9f6ba9ae7587`. Browser `148.0.7778.96` at `/usr/local/bin/google-chrome`. Viewports 320, 360, 390, 768, 1280. Root font 16px and 32px at 320. `reducedMotion: reduce`. Clock anchor `2026-10-25T02:00:00.000Z`. Opened long evidence stayed within 1px (`scrollWidth == clientWidth` on each recorded case).

Digests, matched with `sha256sum` on that commit and again on this unchanged source:

- `SystemHealthBoard.tsx` `9903422c9275fd22e9a6fa7c76fbb60314c1e4d36f611f4f9521a029658d7a8f`
- `ProviderOpsBoard.tsx` `870cb06f5d80113926d04a9ee63c2f779e3aa870bc21124081a34a4e76aaf6c3`
- `useOperationsReport.ts` `d0e4595f7044a737bd5ae021bc43b8263ec420321df9ffe62935c04bb43e78dd`
- `operations-read-lifecycle.ts` `e4f7fc2eabd267f19ae04daa60519eaf41a4912178f5a60086cd462bb6b67751`
- `operations-report-validation.ts` `a6f71fd2eeda4eaea0ab374feaa68c3085e185a567f2fb44f81f65d32bc8ff0e`

Fixture boundary, copied from the result: `fetch` is a deferred window stub. The stub counts aborts and still lets a late resolve run, so ownership rather than abort drops it. Synthetic prop validation waits only when the harness sets `window.__JETNITY_OPS_PROPS_SPERRE__`. Production does not set that and does not fetch on mount.

Both boards covered the previous matrix plus: A→B→A for success, 403, and network, then one legitimate new GET; future card time with a fresh child; invalid monotonic acceptance with valid wall, and invalid wall with valid monotonic; changed props during the first GET for success, 503, and 403, each followed by another explicit GET; keyboard activation while initial validation is delayed; null, array, empty object, duplicate id, missing item, wrong id, bad status, write action, bad metadata, bad time, negative age, and TTL above the ceiling; historical aging after 503, network, and invalid 200; TTL before, at, and after 60s and 120s on both boards, and 300s on the health github parent and its child. Provider operations has no 300s card in the frozen map.

Preserved, not overwritten: root `result.json` and `run-1792897515407` at 44/46. `run-1792898087571` is the previous authoritative 46/46 on `bce903ef`. `run-1792897569459` passed on a pre-commit tree. `run-1792923483842` and `run-1792923548638` are 66/68 because the harness returned to A before React committed B. `run-1792923593286` is 68/68 recorded with head `c7dd0ecd` while the R1 source was still uncommitted.

## Other commands

Executed on the R1 source. The docs commit does not change those files.

| Command | Exit | Result |
| --- | --- | --- |
| `npm test` | 1 | 7130 tests, 851 suites, 7114 pass, 11 fail, 5 skipped, 102591 ms. Owned suites Operationsalter 9/9, Operationsbesitz 7/7, Operationsbericht-Validierung 5/5, and both board-shell tests passed. |
| `npx tsc -p tsconfig.json --noEmit --pretty false` | 0 | Re-run on this source after the proof commit. |
| `npm run lint` | 0 | 181 problems, 0 errors, 181 warnings. Owned files added no warning. |
| `npm run check:dead` | 0 | 850 starts, 1597 modules, 0 orphan. |
| `npm run check:exports` | 0 | 1207 files, 0 unused exports. |
| `npm run check:deps` | 0 | 11 dependencies and 2 devDependencies in use. |
| `npm run check:api-schutz` | 0 | 12 admin routes use `requireAdminApi()`. |
| `npm run check:schema-bezug` | 0 | Existing LOCAL/UNAPPLIED RPC notes only. No schema edit. |
| `npm run build` | 0 | Next.js 16.4.1 compiled successfully in 3.6s. |

The 11 failures are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in: catalog hardening; native PG16 accepted-store projection; S1 disposable PostgreSQL 16; current-version lookup; R3 native canonical URL publication; structural bytes and ACL/RLS; primary and composed v2 bundles; R5 native legacy and typed SQL consumers; M1–M4 synthetic atomic custody; source catalog gateway; trusted store gateway. This VM has no PostgreSQL 16 server binaries. They are not a product regression of this lane. The five skips are pre-existing. A skip is not a pass. CI for this new head was not run here.

No new dependency, workflow, provider, model call, secret, polling, or monthly cost.
