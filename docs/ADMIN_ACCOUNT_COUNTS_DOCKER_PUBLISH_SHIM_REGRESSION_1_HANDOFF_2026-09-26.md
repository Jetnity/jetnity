# Admin Account Counts Docker Publish Shim Regression 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Binding task `docs/ADMIN_ACCOUNT_COUNTS_DOCKER_PUBLISH_SHIM_REGRESSION_1_TASK_2026-09-26.md`
3. Base/main `0e08e22cb859818d902bfff1ecdea654f33abc39`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL review of this exact PR/head = **same** logical agent, Generation 1, session `bc-059589a4-a529-4c73-97b9-3a9e3f093fc4`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557/#558/#559/#560/#561/#562/#563/#564/#565 sessions
- Do not start another agent or a real-Mac follow-up from this writer

## How to continue

1. Do not change CLI identity/version/hash/parser, Docker endpoint selection, pre-launch network option, runtime/fixtures/browser/product/Auth/SQL/migrations/config, root deps or CI.
2. Do not disable or exclude Mailpit. Do not patch or repack the official CLI archive/binary.
3. Do not weaken #564. PASS remains only resolved `127.0.0.1` from authoritative `NetworkSettings.Ports`.
4. Do not put the shim on the user/parent PATH or change Docker Desktop/daemon settings.
5. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — this writer observed **57/57 PASS**.
6. Do not run the real full acceptance run or real Docker from this slice.
7. A later authorized real-Mac rerun must use the isolated harness against the already-verified Docker Desktop Unix endpoint. The remaining question is whether live Mailpit `8025/tcp -> 54324` now starts as `127.0.0.1` and #564 inspection PASSes.
8. Historical receipts stay dated. Exclusive creation refuses overwrite.

## Code vs actual execution

| Capability | Code after this slice | Executed here |
| --- | --- | --- |
| Isolated env / source pins / cleanup | unchanged | helper/contract tests only |
| Verified local Unix Docker endpoint | unchanged | not re-tested as a behavior change |
| Official CLI 2.117.0 archive identity | unchanged pins; archive stays byte-identical | not downloaded or executed |
| Module-scope publish parser/formatter | restored; shared by rewrite and C1 hashed shim | controlled rewrite + generated-shim tests |
| C1 self-contained run-owned hashed shim | preserved `.toString()` freeze; no repo import | self-contained + provenance tests |
| C2 image/CMD boundary | unchanged | image-boundary tests |
| Harness Docker bypass | still exact real binary | composed-start test |
| Post-start binding observation | unchanged #564 NetworkSettings-first | existing helper coverage |
| Real Docker Desktop / official binary on the user's Mac | prior path + repaired prevention | **NOT RUN** |
| Owned stack / GoTrue / Next / Playwright | prior wiring | **NOT RUN** |
| Code-complete claim | **false** | n/a |

## Secrets

Parent Docker credentials/config are not copied. Per-run secrets stay out of Git. No new receipt was written because no `run.mjs` start was authorized.

## Next actor

Technical Lead: independent exact-head review of Draft PR #566. Do not treat helper PASS as real-Mac acceptance. The authorized later Mac rerun remains required after integration.
