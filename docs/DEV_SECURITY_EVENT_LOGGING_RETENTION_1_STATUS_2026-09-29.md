# Development Security Event Logging and Retention 1 — Status

Date: 29 September 2026
Status: **R1 CORRECTIONS DELIVERED / DRAFT PR #628 / HOSTED APPLY NOT RUN / NOT A PASS**

Reviewed head `ebc6bbbdd48c65c9f1b642ea273aafe19a91ca2c` is superseded for review. Technical-Lead R1 `5350889502` required F1–F4. This correction:

- `30-readback.sql` uses `date_part`. The local proof executes that file for dormant, healthy, stale, failing, and recovered states.
- Cleanup, account erasure, Auth cascade, and populated rollback were run on two sessions. A forced opposite event-row lock produced `deadlock detected`; the aborted statement was retried and quota matched origins.
- Activation checks enabled state, relation, function, timing, and the update predicate. Disabled, mis-bound, and privilege-drift fixtures fail closed.
- Operator files and the cron command set `statement_timeout` before the call. A 400ms outer timeout cancelled a slow cleanup and rolled it back. Function-local `statement_timeout` is not the budget.
- The same proof passed 58/58 on local PostgreSQL 16.15 and 17.11. Hosted 17.6 was not used.

## Identity

| Field | Value |
| --- | --- |
| Logical agent | Jetnity development security event logging retention 1 |
| Generation | 1 |
| Required model | Grok 4.7 High Fast |
| Reported `originalModelName` | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-b1f79b09-d5cb-4f74-97a5-50bb9a4ee7ab |
| Branch | `feat/dev-security-event-logging-retention-1` |
| PR | Draft #628. May close #627. Does not close #626. |
| Approval | Product Owner comment https://github.com/Jetnity/jetnity/issues/626#issuecomment-5887161416 |
| Baseline | `main@e785cd00b090042ac6622383bceebd7f6ddfed88` |
| Reconstruction | `origin/main` still `e785cd00b090042ac6622383bceebd7f6ddfed88`. This branch was 1 ahead / 0 behind before the implementation commit. Open product drafts at dispatch were historical #52, #50, #40, #39, and #28. No second writer on this branch. |

No UI rename is claimed. The model field above is the cloud-agent run identity, not a display-name change.

## What is done

The SQL/operator package, localhost runner, CI guard, design, runbook, and local synthetic proof are on this branch. Dormant install and activation are separate. Retention is a fixed 7 days. The cap is 1,000 provenance-owned rows. Cleanup health, own-job history, and account-erasure quota coherence are implemented without editing `account-delete-v1`.

## What is not done

- Hosted Development install, activation, and native scheduled run: **NOT RUN**.
- Production `qscbgcdmivbbnzrcyegn`: **NOT RUN**.
- Finding 5.2 and Release Gate G remain only partially addressed. This slice is one Development blocklist producer, not full security-event ingestion.
- #626 stays open until hosted Development acceptance.
- Cursor does not mark Ready, does not merge, and does not start a follow-up.

## Local execution

PostgreSQL 16.15, `postgresql-16-cron` 1.6.2. Hosted pre-dispatch read was pg_cron 1.6.4. The 1.6 SQL file reports no SQL change; the binaries are not the same.

- `node scripts/db/security-events-dev-1-lokal.mjs`: 58/58 on PostgreSQL 16.15, acceptance `not_run` 0.
- `node scripts/db/security-events-dev-1-lokal.mjs --pg-major=17`: 58/58 on PostgreSQL 17.11 / pg_cron 1.6.8.
- `node scripts/db/security-events-producer-contract-lokal.mjs`: 67/67. The #494 harness was not modified.
- `npm test`: 4048 passed, 0 failed.
- `npm run typecheck`, `npm run lint` (0 errors, 145 existing warnings), `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`, `check:setup`, and `npm run build`: passed on this correction. Setup warned that no `.env` / `.env.local` is present. No remote `db:*` command was run.

## Next step

Independent main-chat Technical-Lead review of the exact head. Ready and merge stay with the Technical Lead. Persistent Development actions stay in the runbook and stay unexecuted.
