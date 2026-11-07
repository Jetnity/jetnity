# Atomic Version Refresh 1 — R6A narrow setup-cleanup addendum

2026-11-07. Same #1152 / Draft #1153 and author **Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1**, session `/root/atomic_version_refresh_writer`. Immediate correction selected by Root, not a new slice.

R6 remains immutable at blob `e7a42aa028a504cff3386e27f95759c8b94a9af1`, seed `f4c6db2813bde3d9c98a42339618b9699aecf9b7`. All TASK/R1–R6 scope, limits and acceptance requirements remain.

## Concrete additional source finding

During the R6-required adjacent ownership audit, the author reported before editing that `observed()` in native.test.ts opens an actual backend at Final8 line 511 and queries its PID at line 514 before registering the record at 515 or returning the connection. A failed PID query or malformed result at that point rejects the connect hook while the coordinator has never received the backend. There is no catch/close around this setup step. Root independently read this exact source and confirmed the exception path.

This is source evidence, not a failure reproduced by the Final8 log. The four existing terminal injections occur later and do not claim to exercise this initial PID failure. It is a local test-harness resource-ownership correction, not a runtime bug claim.

## Exact additional permission

In the same already allowed native.test.ts, baseline blob `01dd48fa71c4a2d14d13502a5b6c3d7c6a2759a1`, permit only a narrow try/catch around that first PID query/result extraction in `observed()`: on any thrown setup error, close the newly opened connection and rethrow the original error. Retain the identical SQL and successful PID/record flow. Do not change role selection, commit control, injection timings, successful results, assertions or any other observed/race/terminal logic.

No new failure-injection mechanism, dependency, runtime change or broadened test matrix is required for this small resource fix. Review the exact failure path statically; complete fresh Native and all other R6 gates still apply. Do not claim that an unexecuted exceptional path was natively exercised.

Include this tiny adjacent hunk and its source-only verification in the same Final9 manifest/patch/HANDOFF as R6, then return/STOP. All other author files stay byte-identical. Root alone publishes, re-gates and decides PASS/Ready/Merge. Hosted/source holds remain unchanged; no refused action retry or alternate route.
