# Admin Account Counts App Toolchain PATH Fix 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Binding task `docs/ADMIN_ACCOUNT_COUNTS_APP_TOOLCHAIN_PATH_1_TASK_2026-09-26.md`
3. Base/main `58962638d4b3b55824497d9b77ad5b3f75025168`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL review of this exact PR/head = **same** logical agent, Generation 1, session `bc-95f0abec-5902-4d07-8efe-7f939ba33521`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557/#558/#559/#560/#561/#562/#563/#564/#565/#566 sessions
- Do not start another agent or a real-Mac follow-up from this writer

## How to continue

1. Do not change Docker shim/CLI identity/version/hash/parser, Docker endpoint selection, pre-launch network option, fixtures/browser/product/Auth/SQL/migrations/config, root deps or CI.
2. Do not pass raw `process.env` into the app environment. The already-sanitized runtime `childEnv` is the only accepted parent source.
3. Keep the allowlist rebuild authoritative. Forbidden Docker/Node/hosted/provider/SMTP/Vercel values must still fail to survive.
4. Keep private HOME and offline/no-script npm protections. Keep locked `npm ci --no-audit --no-fund`.
5. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — this writer observed **61/61 PASS**.
5a. Exact `e73e4900` GitHub CI run `36249011359` SUCCESS, Auth job `108423446864` SUCCESS, Vercel Preview `3Uiipr7arCNmwRd5JMyNgZMfnbQ4` READY. Re-read those gates on the live head after later persists.
6. Do not run the real full acceptance run or real Docker from this slice.
7. A later authorized real-Mac rerun must prove that locked app preparation now resolves npm through the sanitized PATH and still keeps the isolation contract.
8. Historical receipts stay dated. Exclusive creation refuses overwrite. This writer did not mutate the cited Mac failure receipt.

## Code vs actual execution

| Capability | Code after this slice | Executed here |
| --- | --- | --- |
| Isolated env / source pins / cleanup | unchanged except app parent source | helper/contract tests only |
| Sanitized `childEnv` reused as app parent | `baueRuntimeAppParentQuelle(childEnv)` | controlled PATH / forbid tests |
| App prepare / launch / controller restart | same `appParentEnv` object | source pin + env contract tests |
| Locked `npm ci` via sanitized PATH | existing installer; PATH now present | fake-npm PATH resolve + ENOENT fail-closed |
| Docker publish shim / CLI pins | unchanged | existing helper coverage only |
| Real Docker Desktop / official binary on the user's Mac | prior path + PATH repair | **NOT RUN** |
| Owned stack / GoTrue / Next / Playwright | prior wiring | **NOT RUN** |
| Code-complete claim | **false** | n/a |

## Secrets

Parent Docker/provider/hosted credentials are not copied. Per-run secrets stay out of Git. No new receipt was written because no `run.mjs` start was authorized.

## Next actor

Technical Lead: independent exact-head review of Draft PR #567. Do not treat helper PASS as real-Mac acceptance. The authorized later Mac rerun remains required after integration.
