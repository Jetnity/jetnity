# CH→DE Source-Bound 128 KiB Retrieval 1 — Status

**State:** Code implementation and author-side local verification complete on
Draft PR #920; source/legal qualification and independent review remain blocked.

## Completed so far

- Confirmed the active Copilot coding-agent run and existing branch.
- Preserved the immutable task file and seed head as the base.
- Implemented the exact candidate tuple, bounded stream handling, media/encoding
  checks and synthetic regression tests.
- Focused retrieval tests passed: 40/40; `npm run typecheck` passed.
- Full serial suite passed: 6,264/6,264, including native PostgreSQL 16 checks.
- Lint, production build, setup/API/schema/dead-code/export/dependency checks
  passed. Full results and the initial parallel timeout correction are in REPORT.
- First implementation commit is
  `34cc75b1ee649dd56ab442876e28e02f6860f0a5`; full verification and final
  handoff commit are still pending.

## Still required

- Record final exact SHA/tree and CI state after the handoff commit.
- Recheck operating mode, exact task blob, branch, PR Draft state and competing
  writers before delivery.
- Finish REPORT/HANDOFF with exact final head/tree, commands, totals and blockers;
  the checks and CI state for the first implementation head are recorded.
- Secret-scan all changed files, commit/push the author handoff, then run required
  parallel validation and incorporate valid findings.
- Keep PR #920 Draft; do not merge, activate the source, or start follow-up work.

## Invariants and blockers

- Default size: 65,536 bytes for every non-exact candidate.
- Candidate size: 131,072 bytes only for the code-owned exact tuple.
- Real Bern profile is absent from the production identity registry; actual
  Bern source remains `SOURCE_NOT_QUALIFIED`.
- No accepted Official Truth, F8, hosted import/write, public provider, visitor
  output or follow-up task is authorized.
- #913 remains a separate platform-safety block and is not accessed or bypassed.
