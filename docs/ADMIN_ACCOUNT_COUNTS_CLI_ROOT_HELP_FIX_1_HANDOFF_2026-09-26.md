# Admin Account Counts CLI Root Help Fix 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Binding task `docs/ADMIN_ACCOUNT_COUNTS_CLI_ROOT_HELP_FIX_1_TASK_2026-09-26.md`
3. Base/main `4df0a8bff16f050314a3a0bc75827a9764173eb7`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL review of this exact PR/head = **same** logical agent, Generation 1, session `bc-107166c0-7d11-4d69-8bd8-c01cbdb5c26b`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557/#558/#559/#560 sessions
- Do not start another agent or a real-Mac follow-up from this writer

## How to continue

1. Do not change Docker endpoint, CLI version/hash pins, archive provenance, start-help, runtime ownership/cleanup, #559, product, Auth, SQL, migrations, config, root deps or CI.
2. Do not upgrade the Supabase CLI.
3. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
4. `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Exit 2 is BLOCKED / not a full PASS.
5. `--cli-archive` / `--cli-checksums` remain the offline official-byte path. Do not download or run an official binary unless a later TL gate authorizes it.
6. A later authorized real-Mac run must use the isolated harness against the already-verified Docker Desktop Unix endpoint. The remaining identity question is whether live `supabase --help` now satisfies the Cobra root-help parser.
7. Historical receipts stay dated. Exclusive creation refuses overwrite.

## Code vs actual execution

| Capability | Code after this fix | Executed here |
| --- | --- | --- |
| Isolated env / source pins / cleanup | unchanged | helper/contract tests + default no-start |
| Verified local Unix Docker endpoint | unchanged | not re-tested as a behavior change |
| Official CLI 2.117.0 archive identity | unchanged pins | controlled C2; no official binary download |
| Root `--help` Cobra structure | corrected | controlled official fixture + rejections |
| `start --help` predicate | unchanged | existing + new composition tests |
| Real Docker Desktop / official binary on the user's Mac | prior path | **NOT RUN** |
| Owned stack / GoTrue / Next / Playwright | prior wiring | **NOT RUN** |
| Code-complete claim | **false** | n/a |

## Secrets

Parent Docker credentials/config are not copied. Durable receipts sanitize user home paths. Per-run secrets stay out of Git. Receipt `aaclr1-20260926T014638Z` names a denied parent `SUPABASE_ACCESS_TOKEN` without copying its value.

## Next actor

Technical Lead: independent exact-head review of Draft PR #561. Do not treat helper PASS as real-Mac acceptance.
