# Admin Account Counts Runtime Binding Observation Fix 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Binding task `docs/ADMIN_ACCOUNT_COUNTS_RUNTIME_BINDING_OBSERVATION_FIX_1_TASK_2026-09-26.md`
3. Base/main `40fffe38102012ae3ffa5f5b7e2bc24c1a100b42`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL review of this exact PR/head = **same** logical agent, Generation 1, session `bc-abaf4d85-1737-4b3d-b5d4-802ea7bc697a`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557/#558/#559/#560/#561/#562/#563 sessions
- Do not start another agent or a real-Mac follow-up from this writer

## How to continue

1. Do not change CLI identity/version/hash/parser, Docker endpoint selection, pre-launch network option, runtime/fixtures/browser/product/Auth/SQL/migrations/config, root deps or CI.
2. Do not disable or exclude Mailpit.
3. Do not weaken the numeric-loopback policy. PASS remains only resolved `127.0.0.1`.
4. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
5. `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Exit 2 is BLOCKED / not a full PASS.
6. A later authorized real-Mac rerun must use the isolated harness against the already-verified Docker Desktop Unix endpoint. The remaining observation question is whether live Mailpit `8025/tcp -> 54324` now reads as `NetworkSettings.Ports` `127.0.0.1` and loopback assertion PASS.
7. Historical receipts stay dated. Exclusive creation refuses overwrite.

## Code vs actual execution

| Capability | Code after this fix | Executed here |
| --- | --- | --- |
| Isolated env / source pins / cleanup | unchanged | helper/contract tests + default no-start |
| Verified local Unix Docker endpoint | unchanged | not re-tested as a behavior change |
| Official CLI 2.117.0 archive identity | unchanged pins | not re-tested as a behavior change |
| Pre-launch owned network `host_binding_ipv4=127.0.0.1` | unchanged | existing helper coverage |
| Post-start binding observation | corrected (prefer `NetworkSettings.Ports`) | controlled Mailpit-shaped + public/empty/fallback/multi-port fixtures |
| Strict loopback policy | unchanged | existing + new FAIL cases |
| Mailpit service | still enabled | not started |
| Real Docker Desktop / official binary on the user's Mac | prior path | **NOT RUN** |
| Owned stack / GoTrue / Next / Playwright | prior wiring | **NOT RUN** |
| Code-complete claim | **false** | n/a |

## Secrets

Parent Docker credentials/config are not copied. Durable receipts sanitize user home paths. Per-run secrets stay out of Git. Receipt `aaclr1-20260926T110432Z` names a denied parent `SUPABASE_ACCESS_TOKEN` without copying its value.

## Next actor

Technical Lead: independent exact-head review of Draft PR #564. Do not treat helper PASS as real-Mac acceptance. The authorized later Mac rerun remains required.
