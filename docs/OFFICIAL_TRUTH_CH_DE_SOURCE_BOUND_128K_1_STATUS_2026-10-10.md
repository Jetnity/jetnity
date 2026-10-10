# CH→DE Source-Bound 128 KiB Retrieval 1 — Status

**State:** R1 corrections and exact importer-guard amendment are implemented on
Draft PR #920. Focused/full tests, typecheck, lint, build and hygiene checks pass.
Exact-head GitHub Actions remains `action_required` with zero jobs. Parallel
Code Review/CodeQL could not complete for the documented tool/database reasons;
independent Technical Lead review remains outstanding.

## Completed so far

- Confirmed the active Copilot coding-agent run and existing branch.
- Preserved the immutable task file and seed head as the base.
- Preserved the 65,536-byte ceiling for all non-authorized/injected paths;
  Bern's privileged path remains dormant because no approved compiled profile
  exists.
- Removed the alternate source hash; canonical Evidence fingerprint rejection
  now produces no trusted retrieval envelope.
- Added a bounded byte-only transport utility for synthetic 128 KiB boundary
  tests, and fail-closed ambiguous-length/unknown-media-parameter checks.
- Focused tests passed 93/93; full serial suite passed 6,268/6,268 across 818
  suites, with PostgreSQL 16.15 R2/R3 and structural outcomes recorded in REPORT.
  `npm run typecheck`, lint, build, and
  setup/API/schema/dead-code/export/dependency/operating-mode checks passed.
- The first corrected full-suite attempt exposed the finite importer inventory
  omission for the new policy module; the exact path and adversarial lookalike
  refusal were added without weakening the guard, then focused and full suites
  passed.
- R1 correction commit is `167bb9e4bb1ee613b1757934e67dbf52d51158f4`; the
  importer-guard/report update is committed to the same branch. The verified
  code/test head/tree and validation limits are in REPORT.

## Still required

- Recheck final metadata commit, Actions authorization status and PR Draft state.
  Do not bypass authorization.
- Recheck operating mode, exact task blob, branch, PR Draft state and competing
  writers before delivery.
- Keep PR #920 Draft; do not merge, activate the source, or start follow-up work.

## Invariants and blockers

- Default size: 65,536 bytes for every non-exact candidate.
- Candidate size: 131,072 bytes only for the code-owned exact tuple.
- Real Bern profile is absent from the production identity registry; actual
  Bern source remains `SOURCE_NOT_QUALIFIED`.
- No accepted Official Truth, F8, hosted import/write, public provider, visitor
  output or follow-up task is authorized.
- #913 remains a separate platform-safety block and is not accessed or bypassed.
