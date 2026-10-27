# V2-S0 Travel Days and Transfers Contract 1 — HANDOFF

27 October 2026. One writer. Stop after this scope.

## Identity

- Logical name: Jetnity V2 Travel Days and Transfers Contract 1 — Cursor Generation 1
- Display name: set with `rename-chat` to that logical name
- Session: `bc-9c414c5c-d492-49fc-b379-03654cc13242`
- URL: https://cursor.com/agents/bc-9c414c5c-d492-49fc-b379-03654cc13242
- `run-info.originalModelName`: `grok-4.7-high-fast`
- Plan comment before the trace: https://github.com/Jetnity/jetnity/pull/1051#issuecomment-6447196669

The review head is the commit that adds these documents on `docs/v2-s0-travel-days-contract-1`. This file cannot contain its own commit SHA. The PR review packet in the same turn records `git rev-parse HEAD` and `git rev-parse HEAD^{tree}`.

## Git

- Branch: `docs/v2-s0-travel-days-contract-1`
- PR: https://github.com/Jetnity/jetnity/pull/1051 (Draft)
- Parent seed: `e6ddb58e5e90615ed7e408f739c107df688d3e1a`
- `origin/main` at fetch: `d31a16afdac5e97d4b02f4cb5824f5adc290577c`
- Main tree named by the task and by #751: `df19ecca084c0ee9d4fc0b22314f2254f86e743a`
- Ahead/behind against that main before this delivery: 1 / 0
- Mode: `NORMAL` in `.jetnity/operating-mode.json`
- #751 read at `2026-10-27T15:37:53Z`, state open, same main. No HOLD.

## Changed files

Task-owned only:

- `docs/JETNITY_WORK_V2_S0_DAY_TRAVEL_CONTRACT_1_PLAN_2026-10-27.md`
- `docs/JETNITY_WORK_V2_S0_DAY_TRAVEL_CONTRACT_1_DECISION_2026-10-27.md`
- `docs/JETNITY_WORK_V2_S0_DAY_TRAVEL_CONTRACT_1_STATUS_2026-10-27.md`
- `docs/JETNITY_WORK_V2_S0_DAY_TRAVEL_CONTRACT_1_HANDOFF_2026-10-27.md`
- `docs/JETNITY_WORK_V2_S0_DAY_TRAVEL_CONTRACT_1_SELF_REVIEW_2026-10-27.md`

Not changed: product TS/TSX, SQL, Auth, CI, indexing, S1/S2/S3 sources, #1043, `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, `ARCHITECTURE.md`. A dirty `next-env.d.ts` from the environment was restored and is not in the commit.

## What the next reader must treat as decided

Read the decision document. Short form:

- Duration edit of unassigned 7 days to stage lengths 3 and 4 yields 14 days, keeps the original ids, and invents stage dates on the new rows via `reindex`.
- Create-time allocation already keeps 7 days. Post-create allocation of existing ids is unimplemented.
- **ACCOUNT BLOCKED** for that allocation until an owner-gated SECURITY INVOKER change derives `day_stage_assignment_mode` in the same transaction as `stage_id`, without day inserts and without stage-date invention. No SQL was written.
- Chronology is `dayIndex`. Mixed travel and stay is allowed. N dated days mean N−1 nights when bounds are known. #1048 owns the lodging reader.

## Tests and systems

Checked:

- Synthetic Guest/Account `manuellerEntwurf` cases and `unterkunftAbdeckung` / `createDayPositions` / `reiseLesen`, log `s0-synthetic-proof.log` on the writer artifact store. Exit 0.
- Existing `lib/trips/day-stage-truth-contract.test.ts`, `lib/trips/multi-stop-create-day-allocation-1/pfad.test.ts`, `lib/reiseaenderung/anwenden.test.ts`. 44 pass, 0 fail, 0 skip.

Not checked:

- Mounted browser, private account, CUA (#748 suspended).
- Hosted Supabase (#917).
- Full `npm test`, typecheck, lint, production build. No product source changed. Local full `npm test` is historically red on PostgreSQL proofs that this slice did not provision.
- CI and Preview for this head. Report the live checks. Do not inherit the seed deployment as this head’s PASS.

## Findings for the reviewer

- P1 for a future Account slice: mode and `stage_id` diverge if assignment or the current unassigned duration edit is saved only through today’s `reise_aendern` payload. Gate, not a silent client write.
- P2 product truth: the stage-length form adds requested days on top of unassigned days and then `reindex` dates the new rows. Preview already shows the longer trip. The control still reads as a stage length.
- P2 nights: stage-interval union reports 18 nights on the synthetic 22-day bounded example; the contract requires 21 when all day rows exist. Owned by #1048.
- No P0 introduced. This PR does not change runtime.

## Boundaries kept

#917 hosted-readback not used. #985/#982 not bypassed. #1043 not edited. No provider, payment, secret, indexing, or budget change. USD 100/month unchanged. No new cost.

## Next step

Technical Lead reviews this exact head. Possible later work, each only after a new assignment:

1. Owner decision on the Account RPC gate. Until yes, no Account assignment writer.
2. A separate UI slice for “Dauer ändern” versus “Vorhandene Tage zuordnen”, Guest first if the gate is still closed.
3. #1048 implements the N−1 night classification in its own files.

This writer stops. No Ready. No merge. No follow-up session from this agent.
