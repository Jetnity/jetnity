# Development Security Event Logging and Retention 1 — Status

Date: 29 September 2026
Status: **R2 CORRECTION DELIVERED / DRAFT PR #628 / HOSTED APPLY NOT RUN / NOT A PASS**

Reviewed head `51ad3a384f626505e5973ca69f1894b187a41bc6` is superseded for review. Technical-Lead R2 `5351648702` left R1-F3 incomplete: the previous check matched an unqualified function name and a keyword fragment. This correction:

- Activation compares `tgfoid` with the single zero-argument function in `jetnity_internal`. A same-named function in another schema fails closed.
- The update trigger must deparse exactly to whole-row `WHEN (old.* IS DISTINCT FROM new.*)` on an unrestricted `AFTER UPDATE`. `WHEN (OLD.ip IS DISTINCT FROM NEW.ip)` and `UPDATE OF ip` fail closed. A duplicate trigger name fails closed instead of selecting one catalog row.
- After the healthy contract is restored, a reason-only update emits one `admin_blocklist_add` with `op = UPDATE`, and repeating that same write emits nothing.
- The earlier disabled, mis-bound, privilege-drift, dormant, idempotent, no-op, lifecycle, rollback, and outer-timeout proofs still pass. The previous name-and-keyword check is not described as exact.
- The same proof passed 63/63 on local PostgreSQL 16.15 and 17.11. Hosted 17.6 was not used.

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

- `node scripts/db/security-events-dev-1-lokal.mjs`: 63/63 on PostgreSQL 16.15, acceptance `not_run` 0.
- `node scripts/db/security-events-dev-1-lokal.mjs --pg-major=17`: 63/63 on PostgreSQL 17.11 / pg_cron 1.6.8. The three wrong-wiring cases and the restored reason-only update are in this run.
- `node scripts/db/security-events-producer-contract-lokal.mjs`: 67/67. The #494 harness was not modified.
- `npm test`: 4048 passed, 0 failed.
- `npm run typecheck`, `npm run lint` (0 errors, 145 existing warnings), `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`, `check:setup`, and `npm run build`: passed on this correction. Setup warned that no `.env` / `.env.local` is present. No remote `db:*` command was run.

## Next step

Independent main-chat Technical-Lead review of the exact head. Ready and merge stay with the Technical Lead. Persistent Development actions stay in the runbook and stay unexecuted.
