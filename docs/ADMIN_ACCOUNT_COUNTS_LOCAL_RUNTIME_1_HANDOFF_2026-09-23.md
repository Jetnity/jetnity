# Admin Account Counts Local Runtime 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Immutable task `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_TASK_2026-09-23.md` v1 at `0aa33e88a021756a5cee64a130d544122977880a`
3. Binding TL re-review `5294965628` on `bc8ec091c0c912e4646a2614c07e4a6a7da66c42` (CHANGES REQUIRED) — this head is the same-session E1/E2 package
4. Independent diagnostic spec comment `5800345897`
5. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
6. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL re-review of this exact PR/head = **same** logical agent, Generation 1, session `bc-1054a840-ce3b-4451-9903-7836344b5149`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557 sessions
- Do not duplicate this 5294965628 correction if already present on the current head
- #559 remains stopped at `3e5e5039`; do not import or reopen it

## How to continue

1. Do not change product, Auth, SQL, config, migration, root package/lock or CI files. Do not edit the accepted #556 lifecycle module.
2. Do not import unmerged sibling browser-flow code.
3. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
4. `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Exit 2 is BLOCKED / not a full PASS.
5. `--cli-archive` / `--cli-checksums` remain the offline official-byte path. `--runtime-only` / `--full` acknowledge local execution and may invoke version/help after those bytes bind. Do not download or run an official binary unless a later TL gate authorizes it.
6. `--full` must load `scripts/e2e/admin-account-counts-browser-flows-1/flows.mjs`. Absence is `NOT_IMPLEMENTED`.
7. Historical receipts stay dated. Exclusive creation refuses overwrite of any existing receipt.
8. Integration order: this runtime lane first, then browser lane after exact TL-authorized main sync.

## Code vs actual execution

| Capability | Code after 5294965628 | Executed here |
| --- | --- | --- |
| Isolated env / source pins / cleanup | yes | helper/contract tests |
| File-backed tar-member hashing | yes | 64KiB + 2MiB real local tars |
| Snapshot dotenv-template exclusion | yes | synthetic git fixture + actual baseline archive |
| One browser ownership map + contained request events | yes | Context doubles; no Playwright |
| Exact consumer names + content/schema/PNG validation | yes | real temp files; valid 2x2 PNG fixtures; synthetic tokens |
| Exclusive non-overwriting receipt writes | yes | leaf + persistFailureReceipt + actual runner collision |
| Explicit mode archive→member→version/help wiring | yes | controlled execFile + test pins; no official binary |
| Official CLI / Docker / GoTrue / Next / live observer | yes (prior + C2 wiring) | **NOT RUN** |
| Sibling UI G6–G19 | sibling-owned | **NOT RUN** |
| Code-complete claim | **false** | n/a |

## Secrets

Per-run passwords, TOTP, JWT, cookies, service-role and database URLs stay out of Git. Context is in-memory only. Durable receipts are the public evidence folder; private HOME is not recreated after G20. Consumer export refuses credential-shaped fields and embedded JWT/otpauth/fill material rather than copying them.
