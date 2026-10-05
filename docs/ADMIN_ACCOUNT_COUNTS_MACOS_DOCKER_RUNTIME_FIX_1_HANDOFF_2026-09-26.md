# Admin Account Counts macOS Docker Runtime Fix 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Binding task `docs/ADMIN_ACCOUNT_COUNTS_MACOS_DOCKER_RUNTIME_FIX_1_TASK_2026-09-26.md`
3. Base/main `b440a6759c7c479d1b7509ecbefcac7b95c4ea35`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL review of this exact PR/head = **same** logical agent, Generation 1, session `bc-11e9fb78-8111-4af3-8af7-73aa0ed1c9f6`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557/#558/#559 sessions
- Do not start another agent or a real-Mac follow-up from this writer

## How to continue

1. Do not change product, Auth, SQL, config, migration, root package/lock or CI files.
2. Do not import or edit #559 browser implementation.
3. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
4. `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Exit 2 is BLOCKED / not a full PASS.
5. `--cli-archive` / `--cli-checksums` remain the offline official-byte path. Do not download or run an official binary unless a later TL gate authorizes it.
6. A later authorized real-Mac run must use the isolated harness against the local Docker Desktop Unix endpoint. Do not copy `~/.docker` into private HOME.
7. Historical receipts stay dated. Exclusive creation refuses overwrite.

## Code vs actual execution

| Capability | Code after this fix | Executed here |
| --- | --- | --- |
| Isolated env / source pins / cleanup | yes | helper/contract tests + default no-start |
| Verified local Unix endpoint selection | yes | controlled Linux + macOS Desktop-style doubles |
| Remote/tcp/ssh/hostile parent refusal | yes | controlled tests |
| Official CLI 2.117.0 archive identity | unchanged | controlled C2; no official binary download |
| Real Docker Desktop on the user's Mac | yes (selection path) | **NOT RUN** |
| Owned stack / GoTrue / Next / Playwright | prior wiring | **NOT RUN** |
| Code-complete claim | **false** | n/a |

## Secrets

Parent Docker credentials/config are not copied into private HOME. Durable receipts sanitize user home paths to `<redacted-home>` / `/Users/<redacted>`. Per-run secrets stay out of Git.

## Next actor

Technical Lead: independent exact-head review of Draft PR #560. Do not treat helper PASS as real-Mac acceptance.
