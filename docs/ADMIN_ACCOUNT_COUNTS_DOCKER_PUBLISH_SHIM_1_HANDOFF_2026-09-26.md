# Admin Account Counts Docker Publish Shim 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Binding task `docs/ADMIN_ACCOUNT_COUNTS_DOCKER_PUBLISH_SHIM_1_TASK_2026-09-26.md`
3. Base/main `8bb9dd31d5b1a585262c3e773bddab0693d0d3ba`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL review of this exact PR/head = **same** logical agent, Generation 1, session `bc-71eec955-6442-47db-83e9-404c7be6d4d3`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557/#558/#559/#560/#561/#562/#563/#564 sessions
- Do not start another agent or a real-Mac follow-up from this writer

## How to continue

1. Do not change CLI identity/version/hash/parser, Docker endpoint selection, pre-launch network option, runtime/fixtures/browser/product/Auth/SQL/migrations/config, root deps or CI.
2. Do not disable or exclude Mailpit. Do not patch or repack the official CLI archive/binary.
3. Do not weaken #564. PASS remains only resolved `127.0.0.1` from authoritative `NetworkSettings.Ports`.
4. Do not put the shim on the user/parent PATH or change Docker Desktop/daemon settings.
5. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
6. `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Exit 2 is BLOCKED / not a full PASS.
7. A later authorized real-Mac rerun must use the isolated harness against the already-verified Docker Desktop Unix endpoint. The remaining question is whether live Mailpit `8025/tcp -> 54324` now starts as `127.0.0.1` and #564 inspection PASSes.
8. Historical receipts stay dated. Exclusive creation refuses overwrite.

## Code vs actual execution

| Capability | Code after this slice | Executed here |
| --- | --- | --- |
| Isolated env / source pins / cleanup | unchanged plus shim-unknown retain | helper/contract tests + default no-start |
| Verified local Unix Docker endpoint | unchanged | not re-tested as a behavior change |
| Official CLI 2.117.0 archive identity | unchanged pins; archive stays byte-identical | not downloaded or executed |
| Private run-owned `docker` publish shim | new; CLI child PATH only | controlled rewrite/PATH/hash/composed-start tests |
| Harness Docker bypass | still exact real binary | composed start records harness bins |
| Pre-launch owned network `host_binding_ipv4=127.0.0.1` | unchanged | existing helper coverage |
| Post-start binding observation | unchanged #564 NetworkSettings-first + C1 | existing 48 tests still PASS |
| Strict loopback policy | unchanged | existing FAIL cases |
| Mailpit service | still enabled | not started |
| Real Docker Desktop / official binary on the user's Mac | prior path + shim prevention | **NOT RUN** |
| Owned stack / GoTrue / Next / Playwright | prior wiring | **NOT RUN** |
| Code-complete claim | **false** | n/a |

## Secrets

Parent Docker credentials/config are not copied. Durable receipts sanitize user home paths. Per-run secrets stay out of Git. Receipt `aaclr1-20260926T114704Z` names a denied parent `SUPABASE_ACCESS_TOKEN` without copying its value.

## Next actor

Technical Lead: independent exact-head review of Draft PR #565. Do not treat helper PASS as real-Mac acceptance. The authorized later Mac rerun remains required.
