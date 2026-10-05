# Jetnity — Development Security Event Logging and Retention 1 — TASK v1.0

Date: 29 September 2026
Implementation issue: #627
Parent authorization / Development acceptance issue: #626
Branch: `feat/dev-security-event-logging-retention-1`
Dispatch baseline: `main@e785cd00b090042ac6622383bceebd7f6ddfed88`
Status: **IMPLEMENTATION AUTHORIZED / LOCAL EXECUTION ONLY FOR CURSOR / PERSISTENT DEVELOPMENT APPLY RESERVED TO TL AFTER PASS / PRODUCTION FORBIDDEN**

## 1. Authority and purpose

The Product Owner expressly approved the already-presented #626 Development proposal. Canonical approval: https://github.com/Jetnity/jetnity/issues/626#issuecomment-5887161416.

This approval supersedes proposal-only/defer wording for this package. It does not supersede other reserved gates or make the earlier Preflight 2 NONE conclusion false at its historical time. One formerly reserved Development gate has now been opened. The main chat remains Technical Lead; no Work handoff is part of this task.

Build the next persistent-ready implementation of the existing #487/#494 mutation-derived local blocklist event contract. Do not recreate the already accepted disposable proof as the entire deliverable, and do not invent a general logging framework. The new work is fixed approved retention, scheduler/activation controls, and coherent lifecycle including existing account erasure.

This is not a claim that this particular blocklist stage is the whole security solution, nor that finding 5.2 / Release Gate G is closed. Network enforcement and login/MFA/platform-log ingestion remain absent from this scope.

## 2. Approved limits — do not reinterpret

| Control | Approved value |
| --- | --- |
| Persistent target, after TL PASS only | Existing `develop`, project ref `yfvbxvijcorffwxbxahl` |
| Forbidden Production target | `qscbgcdmivbbnzrcyegn` |
| Types | `admin_blocklist_add` for INSERT / real UPDATE; `admin_blocklist_remove` for DELETE |
| Purpose | Attribute a committed local blocklist change to its authorized authenticated operator |
| Actor | Verified mutating session's internal `auth.uid()`; not anonymous, not caller-selected |
| Fields | Server event ID, server time, actor and fixed surface/result/op object |
| Excluded new event content | IP/email/tokens/passwords/session payload/free reason/request body/passport/traveller/trip/health data; `ip` and `metadata` null |
| Fixed JSON size | At most 256 bytes; not the total row/index/WAL footprint |
| Retention threshold | 7 days for this producer's events and associated origin records |
| Scheduler | Hourly, database-local SQL using existing pg_cron; one collision-checked job |
| Proposed job name | `jetnity-security-events-dev-cleanup-v1` |
| Retained-event cap | 1,000, scoped only to provenance-owned rows |
| Own job history | Delete this job's terminal history older than 7 days; preserve other jobs and running entries |
| Cleanup health | Last successful cleanup must be known and no older than 2 hours for new in-scope audited writes |
| Infrastructure | Existing Development DB / installed scheduler only; no new branch/service/tariff/dependency |

The approved periods/cap are Development engineering limits, not a Production or worldwide retention policy and not a legal-compliance assertion. Hourly cleanup means the next successful sweep after expiry, not exact-second deletion. Outages can leave overdue rows: expose that failure; do not claim successful expiry. Backups/WAL/platform logs have separate lifecycles; do not claim instant backup erasure.

## 3. Verified dispatch baseline and reconstruction

TL freshly read main, startup/operating standard, active status, 29 September checkpoint, #626 and open work before dispatch. Main remains the #625 closure. Only historical Drafts #52/#50/#40/#39/#28 were open; no current working PR was found. Do not resume them.

Main CI `36500725605`: both required jobs SUCCESS, including Auth and build. Vercel Production `dpl_BJzzpYbpZsy4geyhFtywnwJkdVqT`: READY on the exact baseline, alias `jetnity.com`. This is deployment evidence, not browser/DB proof.

TL Development metadata-only read at `2026-09-29T09:10:49.938902Z`, after branch-list identity confirmation:
- `security_events` and `blocked_ips` exist and RLS is enabled;
- producer quota and private origin ledger do not exist;
- neither table has non-internal triggers;
- authenticated event INSERT privilege is false;
- pg_cron 1.6.4 is installed; 0 jobs; proposed name unused.
No application rows, credentials, IPs or personal records were read; no DDL/job was executed. This is a dated read, not permission for Cursor to repeat it against a remote database.

Re-fetch main, open PRs/issues and session identity before edits. Check collisions by paths AND shared DB contracts. Record merge-base/ahead/behind and all later main advances. Use one explicit final integration boundary when necessary; same logical slice/session for fixes. Stop for a conflict outside scope.

## 4. Required reading

1. `JETNITY_START_HERE.md`, `.jetnity/operating-mode.json`, the Technical-Lead/Cursor operating standard and current checkpoint/status.
2. Full #626 proposal AND approval comment 5887161416; #625 closure 5881018999.
3. `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`, especially mutation provenance, atomic failure, quota/retention and privileged residuals.
4. #494 task, status, handoff and final TL review/closure; historical delivery text is not the live PR state.
5. `scripts/db/security-events-producer-contract-lokal-{bootstrap,contract}.sql` and `scripts/db/security-events-producer-contract-lokal.mjs`.
6. `supabase/functions/account-delete-v1/index.ts`, especially `ereignisseLoeschen`, and its existing orchestration/tests. No edit/redeploy of this function is authorized.
7. Current block/unblock/list routes, SecurityWidget and #614/#618/#620 evidence; read-only references.
8. CI, package scripts, setup/build hooks, Supabase/Vercel integration configuration visible without secrets. Establish that this package is not auto-applied to any hosted database.

Consult primary PostgreSQL and Supabase docs for the exact installed/local major version. Useful sources checked by TL: Supabase Cron/quickstart (job names may replace existing jobs; job history is not automatically purged), PostgreSQL explicit locking (consistent lock order, rollback and transaction isolation). Never copy a global cron-history deletion or TRUNCATE from a documentation example.

## 5. Execution phases and honest completion

### A — current Cursor assignment

Implement the reviewable SQL/operator package, local isolated proof and runbook. Run only synthetic tests on a disposable LOCAL PostgreSQL database. Cursor must not use injected remote DB URLs/tokens, retrieve credentials, connect to hosted Development/Production, create a project/branch, apply migrations, schedule jobs, or activate any hosted producer.

### B — independent TL review

STOP after push. TL reviews exact code, local execution, concurrency/erasure tests, deployment isolation and rollback. Exact-head CI/Auth/Vercel are required. Self-review is not PASS. A changed head invalidates earlier gates.

### C — TL-only persistent Development acceptance, already PO-authorized but not yet executed

After PASS and fresh target verification, TL may install the reviewed package into `develop@yfvbxvijcorffwxbxahl`, verify its scheduler and activate it only when all prerequisites are met. This phase stays OPEN in the delivery. Do not claim native scheduled evidence from a manual function call, local test, mock clock or successful cron registration alone. Do not shorten the approved hourly cadence just to label a test native.

#627 tracks implementation acceptance. #626 stays open until Development scheduled-run proof, lifecycle tests and terminal evidence pass. The PR may close #627, not #626. No automatic Production promotion or unrelated next feature.

## 6. Implementation contract

### 6.1 Producer and access

Reuse `security_events` and the private origin-ledger approach. Public JSON shape/type is not provenance. Only actual qualifying source row changes can mint tracked origin. Do not grant actor-JWT INSERT or create a caller-facing privileged writer RPC.

Preserve existing role/capability/AAL2 checks on source mutations. Event actor/time/type/payload must not come from submitted fields. INSERT/real UPDATE/DELETE have the specified meaning; no-op UPDATE and zero affected rows emit nothing. Privileged/no-actor maintenance remains a disclosed uncovered case, never advertised as audited. No silent revoke of baseline service_role ALL.

Privileged functions need fixed empty/controlled search_path, minimal access and no PUBLIC/anon/authenticated/service_role callable cleanup or origin-write surface. New relations require explicit ACL/RLS treatment. Existing legacy event types and rows stay compatible. Do not broaden public API schemas or regenerate global DB types for a Development-only package.

### 6.2 Atomicity and concurrency

For each in-scope source row, source mutation + event + private provenance + admission commit together or all roll back. Cap admission must be serialized, not unprotected count-then-insert. Preserve row-level one-reservation-per-event logic, including whole-statement rollback on multi-row overflow. Cap/health/invalid configuration failures must not look like successful audited changes; no eviction of younger rows to make a write succeed.

`used` represents CURRENT retained tracked events, never lifetime admissions. There must be exactly one accountable decrement for each deletion, not duplicate adjustments in both cleanup and a trigger. Identify a consistent lock order for mutation, expiry, provenance cascade and account erasure. Test genuinely concurrent connections; sequential simulation is insufficient. Record bounded lock/statement timeouts and behavior for aborted transactions. A caught deadlock is not permission to silently lose audit/account-deletion work.

### 6.3 All deletion paths and account erasure

Current account-delete explicitly issues DELETE on `security_events` by verified user_id; it is not safe to copy #494's cleanup-only quota adjustment unchanged.

Prove expiry, existing account-erasure deletion, rollback and concurrent mutation/deletion leave events/origin/quota coherent. Include tracked and untracked rows, multi-row account deletion, actor deletion racing with a source mutation, and the interval between event deletion and Auth user deletion in the existing flow. No orphaned new actor-linked events or permanently stranded quota after successful erasure.

Resolve through narrowly owned producer/origin lifecycle objects where possible. Do not edit/redeploy account-delete or redesign Auth. If a materially wider identity/erasure/RLS contract is unavoidable, STOP with the smallest precise dependency. Do not quietly weaken acceptance. Event deletion/cleanup needed for recovery must not be prevented merely because new-write admission is full or cleanup health is stale.

### 6.4 Retention and scheduler

Persistent retention is fixed to the approved 7 days. Do not expose the local proof's arbitrary `_older_than` interval as a client-callable or unchecked persistent control. Expire only proven producer-owned rows and their origin records, atomically with quota accounting; never remove privileged look-alike/legacy rows to repair quota.

Use existing pg_cron, one unique job name and an explicitly documented hourly minute/timezone. Preflight must detect job-name collisions; reruns must not overwrite unrelated jobs. Bound terminal history for this job only. Cleanup success/health timestamps are updated only after a committed successful cleanup; fake initialization must not count as scheduled success. Initial unknown/never-run, stale (>2 hours), failure and healthy states are distinct.

A dormant installation must not break existing blocklist operations before activation. Design installation/activation separately: do not attach a half-configured failing producer to a live source and then wait an hour to fix it. Activation must verify limits, catalog/ACLs, scheduler health, actual native run evidence and quota coherence, then enable/attach the complete contract at a controlled transaction boundary. Once active, configuration drift fails closed for in-scope audited writes. Manual success does not replace the initial native-run evidence requirement.

### 6.5 Deployment isolation

Store reviewed hosted apply/readback/activation/rollback SQL OUTSIDE `supabase/migrations/`, e.g. the task-owned directory below. No build/install/postinstall/prebuild hook or workflow may run it. No Supabase branch merge/rebase/reset. A Git PR merge is not a database apply.

Do not build a credentialed remote apply CLI for Cursor. TL will use the authenticated connector, exact target ref and reviewed SQL; DDL uses target-scoped migration execution with a documented Development-only history entry. Provide checksums and exact ordered commands/SQL for that operator handoff.

Target identity is established by the authenticated control-plane branch/ref association immediately before any hosted action. A caller-supplied label or current_database() alone is not proof of project identity. Missing/mismatched identity is STOP, never a default to Production or Development. Local harness rejects remote host/connection overrides, including JETNITY_ALLOW_REMOTE_DB=1; local execution must not consume injected Supabase keys.

### 6.6 Rollback and operational limits

Prove rollback before activation: quiesce only this producer, detach only its added triggers under a consistent lock boundary, clean only its provenance-owned rows as approved and adjust counters, retire only its own cron/history, drop only safely isolated added objects. No broad DROP CASCADE, reset/restore, extension removal, unrelated job deletion or rewrite of source blocklist rows/profiles/trips.

A later restore must re-establish expiry and quota health before producer reactivation; do not implement or execute a restore here. No new logging vendor, tariff, resources, external calls, sensitive export or overage authorization. Runtime failures must not log raw SQL payloads/identities/credentials. Technical receipts contain aggregate synthetic outcomes, not real account/IP data.

## 7. Minimum acceptance matrix

Provide BEFORE (current absence/cleanup-only gap) and AFTER evidence using the real SQL under local PostgreSQL, not just source regexes.

1. Fixed approved limits and schema/ACL/provenance contract.
2. Direct forged event/origin writes denied; moderator/AAL1/anonymous source access denied as expected; role+AAL2 source mutation emits exactly the intended event.
3. Caller fields cannot supply event actor/time/type/JSON; no PII leakage.
4. Zero affected rows and no-op updates; actual INSERT/UPDATE/DELETE.
5. Injected event/provenance/admission failure and outer rollback leave no partial state.
6. Concurrent C-1 admissions cannot commit above C; multi-row overflow is atomic; failed operations leak no reservations.
7. Expiry boundary at exactly 7 days, older, younger; clock basis/timezone documented.
8. Cleanup rollback restores event/origin/quota; legacy and privileged exact-shape look-alikes untouched.
9. All account-erasure/delete paths, tracked/untracked mixed rows and successful actor deletion; no double decrement/orphan or permanent quota drift.
10. Real concurrency among expiry, account erasure and source mutation; prove lock ordering with at least two sessions and controlled waiting.
11. Missing/corrupt/disabled quota and stale/unknown/failing cleanup health; recovery preserves erasure and cleanup ability.
12. Dormant install, failed preflight, activation prerequisites, safe re-run/job-name collision, scoped rollback, baseline behavior restored.
13. Own cron history only; scheduled versus manual evidence differentiated. Hosted native-run cells explicitly NOT RUN by Cursor.
14. Environment/path guards: no remote harness, no Production/ref fallback, no automatic migration/deploy wiring.
15. Existing SecurityWidget recorded-only coverage, non-enforcement, #614/#618 200-row truth and #620 request ordering unchanged.

Run existing #494 proof as baseline/regression where feasible, relevant erasure and Security tests, new proof, `npm test`, typecheck, lint, API protection, schema/dead/export/dependency checks, operating-mode/setup checks and production build. Do not call broad db:* commands that can reach remote DB. Full CI without PostgreSQL proof is not a DB correctness PASS. Missing capabilities are reported, never relabelled passed.

## 8. Exclusive write paths

Allowed:
- new `scripts/db/security-events-dev-1/**` for SQL/apply/activate/readback/rollback/local fixtures and verification;
- new `scripts/db/security-events-dev-1-lokal.mjs` for a localhost-only disposable runner;
- optional new `lib/admin/security/dev-event-logging.test.ts` for safe CI guard/contract tests, no runtime integration;
- `docs/DEV_SECURITY_EVENT_LOGGING_RETENTION_1_{TASK,STATUS,HANDOFF,SELF_REVIEW,DESIGN,RUNBOOK}_2026-09-29.md`;
- `docs/evidence/dev-security-event-logging-retention-1/**`, synthetic/redacted only;
- narrow current-state headers/pointers in `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md` and the 29 September checkpoint, recording #626 approval and this new assignment without rewriting historical Preflight 2 or claiming deployment.

Read-only: existing #494 harness/architecture, application routes/components, account-delete function/orchestration, Auth/RLS contracts, global types, CI/package/lockfiles and Supabase/Vercel config. Reuse/import existing proof facilities without changing their accepted semantics; request a precise scope amendment if an actual shared-file change is necessary.

Forbidden: anything under `supabase/migrations/`, hosted Edge-Function source edits/deploy, application code changes, dependencies/workflows/hooks, operating mode/rulesets, public/legal content, provider/payments, new runtime UI or logging taxonomy.

## 9. Deliverables and review boundary

Deliver full implementation files, concise design explaining lock/lifecycle choices, executable local proof, test results with exact environment/head, checksummed TL-only SQL runbook and rollback, updated slice status/handoff/self-review and current-state pointers. Record exact logical name, generation, actual reported model and session link. Do not claim UI rename or model selection without evidence.

Classify evidence separately: SOURCE, LOCAL SYNTHETIC EXECUTION, HOSTED DEVELOPMENT, NATIVE SCHEDULED, PRODUCTION. The last three are NOT performed by this writer. At freeze re-fetch main, show full diff/file ownership, ahead/behind and remaining risks.

Security/data-integrity/privacy failures inside the proof are P1 review blockers; lower-severity docs/test limitations remain explicit. No current Production incident is inferred from an unactivated design. Never mark finding 5.2 / Gate G complete from this slice alone.

## 10. Agent identity

Logical agent: **Jetnity development security event logging retention 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — no Auto / no substitution. Verify actual identity/model; report mismatch before material work.

Cursor is the sole implementation writer. Same logical session for immediate review fixes. Cursor does not mark Ready, does not merge, does not execute persistent Development actions, does not touch Production and does not start a follow-up.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + DATABASE-CONTRACT REVIEW.**
