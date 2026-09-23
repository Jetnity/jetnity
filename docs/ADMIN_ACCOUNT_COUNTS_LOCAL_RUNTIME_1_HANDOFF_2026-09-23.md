# Admin Account Counts Local Runtime 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Immutable task `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_TASK_2026-09-23.md` v1 at `0aa33e88a021756a5cee64a130d544122977880a`
3. Binding TL re-review `5292919754` on `0bd9ffc78e8d92a03dc5f1f93b9fd352a5966129` (CHANGES REQUIRED) — this head is the same-session remaining R1–R5 default-wiring package
4. Independent case spec comment `5797455875`
5. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
6. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL re-review of this exact PR/head = **same** logical agent, Generation 1, session `bc-1054a840-ce3b-4451-9903-7836344b5149`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557 sessions
- Do not duplicate this remaining R1–R5 correction if already present on the current head

## How to continue

1. Do not change product, Auth, SQL, config, migration, root package/lock or CI files.
2. Do not import unmerged sibling browser-flow code. #559 corrects its own assertions.
3. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
4. `node scripts/e2e/admin-account-counts-local-runtime-1/run.mjs` — default no-start. Exit 2 is BLOCKED / not a full PASS.
5. `--runtime-only` may start the owned stack only when a usable local Docker daemon **and** an archive-bound official CLI 2.117.0 already exist. It still cannot report `fullLocalExecution`. Official archive acquisition is implemented and is **not** executed in this correction.
6. `--full` must load `scripts/e2e/admin-account-counts-browser-flows-1/flows.mjs`. Absence is `NOT_IMPLEMENTED`.
7. Historical receipts in `docs/evidence/admin-account-counts-local-runtime-1/` stay dated. Do not rewrite them.
8. Integration order: this runtime lane first, then browser lane after exact TL-authorized main sync.

## Code vs actual execution

| Capability | Code after remaining R1–R5 | Executed here |
| --- | --- | --- |
| Isolated env / source pins / cleanup | yes | helper/contract tests |
| Official CLI 2.117.0 archive-byte identity | yes (sidecar rehash; no injected PASS) | logic only; official binary absent; no download |
| Isolated `next dev` + non-500 readiness | yes | stand-in child / fetch doubles |
| Docker PRESENT/ABSENT/UNKNOWN cleanup | yes | always-failing daemon doubles |
| Observer redirect containment + streamed bounds | yes | loopback stand-in |
| Typed catalog / S1–S7 | yes | synthetic catalogs |
| Owned stack / migration replay / GoTrue / real Next / observer on a live API | yes (review-fix) | **NOT RUN** |
| Sibling UI G6–G19 | sibling-owned | **NOT RUN** |
| Code-complete claim | **false** | n/a |

Missing Docker still blocks real execution. It is not permission to relabel the lane complete.

## Secrets

Per-run passwords, TOTP, JWT, cookies, service-role and database URLs stay out of Git. Context is in-memory only. `evidenceDir` is a private run directory, not the public receipt folder.
