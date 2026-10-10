# CH→DE Source-Bound 128 KiB Retrieval 1 — Status

**State:** Code implementation, author-side verification and read-only code
review complete on Draft PR #920; source/legal qualification and independent
Technical Lead review remain outstanding.

## Completed so far

- Confirmed the active Copilot coding-agent run and existing branch.
- Preserved the immutable task file and seed head as the base.
- Implemented the exact candidate tuple, bounded stream handling, media/encoding
  checks and synthetic regression tests.
- Focused retrieval tests passed: 40/40; `npm run typecheck` passed.
- Full serial suite passed: 6,264/6,264, including native PostgreSQL 16 checks.
- Lint, production build, setup/API/schema/dead-code/export/dependency checks
  passed. Full results and the initial parallel timeout correction are in REPORT.
- Implementation commit is
  `34cc75b1ee649dd56ab442876e28e02f6860f0a5`; verified handoff/test addendum is
  `11136c58a7e6c22a6952c54dacdbf254f38d9eec`. Final metadata close-out and
  exact final SHA/tree recording remain.

## Still required

- Commit the final exact SHA/tree close-out; supply that commit identity in the
  final delivery comment.
- Recheck operating mode, exact task blob, branch, PR Draft state, Actions and
  competing writers before delivery.
- Secret-scan the final metadata update. The separate read-only code review found
  no significant issues; bundled CodeQL and Code Review were unavailable/skipped
  as recorded in REPORT.
- Keep PR #920 Draft; do not merge, activate the source, or start follow-up work.

## Invariants and blockers

- Default size: 65,536 bytes for every non-exact candidate.
- Candidate size: 131,072 bytes only for the code-owned exact tuple.
- Real Bern profile is absent from the production identity registry; actual
  Bern source remains `SOURCE_NOT_QUALIFIED`.
- No accepted Official Truth, F8, hosted import/write, public provider, visitor
  output or follow-up task is authorized.
- #913 remains a separate platform-safety block and is not accessed or bypassed.
