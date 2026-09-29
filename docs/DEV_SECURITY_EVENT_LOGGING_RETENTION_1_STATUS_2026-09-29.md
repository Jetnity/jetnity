# Development Security Event Logging and Retention 1 — Status

Date: 29 September 2026
Status: **LOCAL PACKAGE DELIVERED / DRAFT PR #628 / HOSTED APPLY NOT RUN / NOT A PASS**

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

- `node scripts/db/security-events-dev-1-lokal.mjs`: 43/43 on the files hashed in the runbook.
- `node scripts/db/security-events-producer-contract-lokal.mjs`: 67/67, unchanged #494 harness.
- `npm test`: 4048 passed, 0 failed, after the runner ownership fix.
- `npm run typecheck`, `npm run lint` (0 errors, existing warnings), `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`, `check:setup`, and `npm run build`: passed in this session. Setup warned that no `.env` / `.env.local` is present. No remote `db:*` command was run.

## Next step

Independent main-chat Technical-Lead review of the exact head. Ready and merge stay with the Technical Lead. Persistent Development actions stay in the runbook and stay unexecuted.
