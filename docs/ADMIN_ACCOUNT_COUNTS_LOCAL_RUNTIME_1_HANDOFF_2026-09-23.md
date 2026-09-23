# Admin Account Counts Local Runtime 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Immutable task `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_TASK_2026-09-23.md` v1 at `0aa33e88a021756a5cee64a130d544122977880a`
3. Binding TL review `5291528414` on `584c03d8587b034affb5c7151850cd64fb72ce3d` (CHANGES REQUIRED) — this head is the same-session R1–R5 package
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL re-review of this exact PR/head = **same** logical agent, Generation 1, session `bc-1054a840-ce3b-4451-9903-7836344b5149`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557 sessions
- Do not duplicate this R1–R5 correction if already present on the current head

## How to continue

1. Do not change product, Auth, SQL, config, migration, root package/lock or CI files.
2. Do not import unmerged sibling browser-flow code. #559 corrects its own assertions.
3. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
4. `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Exit 2 is BLOCKED / not a full PASS.
5. `--runtime-only` may start the owned stack only when a usable local Docker daemon **and** an archive-bound official CLI 2.117.0 already exist. It still cannot report `fullLocalExecution`.
6. `--full` must load `scripts/e2e/admin-account-counts-browser-flows-1/flows.mjs`. Absence is `NOT_IMPLEMENTED`.
7. Historical receipts in `docs/evidence/admin-account-counts-local-runtime-1/` stay dated. Do not rewrite them.
8. Integration order: this runtime lane first, then browser lane after exact TL-authorized main sync.

## Code vs actual execution

| Capability | Code after R1–R5 | Executed here |
| --- | --- | --- |
| Isolated env / source pins / cleanup | yes | helper/contract tests |
| Official CLI 2.117.0 archive-bound identity | yes | logic only; official binary absent |
| Docker capability check | yes | one earlier read-only check; daemon absent; **no retry** |
| Owned stack / migration replay / catalog verify / GoTrue / app / observer | yes (review-fix) | **NOT RUN** |
| Sibling UI G6–G19 | sibling-owned | **NOT RUN** |
| Code-complete claim | **false** | n/a |

Missing Docker still blocks real execution. It is not permission to relabel the lane complete.

## Secrets

Per-run passwords, TOTP, JWT, cookies, service-role and database URLs stay out of Git. Context is in-memory only. `evidenceDir` is a private run directory, not the public receipt folder.
