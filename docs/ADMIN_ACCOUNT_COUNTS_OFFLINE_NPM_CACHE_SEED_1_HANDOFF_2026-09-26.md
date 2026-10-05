# Admin Account Counts Offline npm Cache Seed 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Binding task `docs/ADMIN_ACCOUNT_COUNTS_OFFLINE_NPM_CACHE_SEED_1_TASK_2026-09-26.md`
3. Base/main `418f008f134d925edb45701a806b1a9bc17201c8`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL review of this exact PR/head = **same** logical agent, Generation 1, session `bc-4d56d48b-bb5f-42e9-a4e7-b5e2321b64d0`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557/#558/#559/#560/#561/#562/#563/#564/#565/#566/#567 sessions
- Do not start another agent or a real-Mac follow-up from this writer

## How to continue

1. Do not change Docker shim/CLI identity/version/hash/parser, Docker endpoint selection, pre-launch network option, fixtures/browser/product/Auth/SQL/migrations/config, root deps or CI.
2. Keep npm strictly offline. Do not solve a later cache miss by enabling network, `--prefer-online`, curl/wget or registry prefetch.
3. Seed only `<original HOME>/.npm/_cacache` into the run-owned `NPM_CONFIG_CACHE/_cacache`. Never copy/read `.npmrc`, auth, logs or arbitrary npm config.
4. Keep lockfile validation fail-closed for missing integrity and git/file/http/custom sources. Do not rewrite `package-lock.json`.
5. Keep `npm ci --no-audit --no-fund` with `npm_config_offline=true` and `npm_config_ignore_scripts=true`.
6. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — this writer observed **67/67 PASS**.
6a. Exact `318dbefe` GitHub CI run `36250359496` SUCCESS, Auth job `108427163277` SUCCESS, Vercel Preview `FYizaAyjM9WPRM14svo61jgajQvx` READY. Re-read those gates on the live head after later persists.
7. Do not run the real full acceptance run or real Docker from this slice.
8. A later authorized real-Mac rerun must prove live locked `npm ci` now resolves from the seeded private cache and still keeps the isolation contract.
9. Historical receipts stay dated. Exclusive creation refuses overwrite. This writer did not mutate the cited Mac failure receipt.

## Code vs actual execution

| Capability | Code after this slice | Executed here |
| --- | --- | --- |
| Isolated env / PATH reuse / cleanup | unchanged except cache-seed hook | helper/contract tests only |
| Local `_cacache` seed into private HOME | `seedOfflineNpmCache` before install | controlled copy / refuse / cap tests |
| Lockfile registry integrity | read-only validation | fixture + real lockfile tests |
| Locked `npm ci` stays offline / no-scripts | existing installer + env asserts | fake-npm receipt + ENOTCACHED |
| Docker publish shim / CLI pins | unchanged | existing helper coverage only |
| Real Docker Desktop / official binary on the user's Mac | prior path + cache seed | **NOT RUN** |
| Owned stack / GoTrue / Next / Playwright | prior wiring | **NOT RUN** |
| Code-complete claim | **false** | n/a |

## Secrets

Parent Docker/provider/hosted credentials are not copied. `.npmrc` / auth / logs are not read or copied. Per-run secrets stay out of Git. No new receipt was written because no `run.mjs` start was authorized.

## Next actor

Technical Lead: independent exact-head review of Draft PR #568. Do not treat helper PASS as real-Mac acceptance. The authorized later Mac rerun remains required after integration.
