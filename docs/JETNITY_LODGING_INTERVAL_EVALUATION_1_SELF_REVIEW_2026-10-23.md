# Lodging Interval Evaluation 1 — SELF_REVIEW

Date: 23 October 2026
Writer: **Jetnity Lodging Interval Evaluation 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-6ae8a8df-dae6-402b-b8b8-b9dd21aff61a
Actual model: `grok-4.7-high-fast`

This is the author's review. It is **not** Technical-Lead PASS, not Ready, and not a merge.

## Contract

- Allowlist held: `lib/trips/naechte-abdeckung.ts`, new `lib/trips/lodging-interval-evaluation-1.test.ts`, and task docs. The TASK file was not rewritten.
- No schema, booking, action, UI, audit-budget or preview-budget edit. No dependency, workflow or config edit.
- No second coverage function. Export names and result shape are unchanged.
- `naechteHalboffen` still lists nights for short public calls. The evaluator does not call it. A source assertion checks the evaluator body from `datumGueltig` onward.
- No duration cap and no change to `datumGueltig`. Years 0000–0099 stay invalid because `Date.UTC` already rejects them. Valid extremes exercised: `0100-01-01` and `9999-12-31`.

## Semantics I checked against the old per-night oracle

The oracle lives only in the new test and walks nights with `naechteHalboffen`. It is not the interval code.

Checked on small windows: overlap, nesting, adjacency, disjoint stages, reversed input order, first-interval ownership, same `stageId` with different names, gap name taken at the gap start after the earlier piece is covered, booked-over-selected in both orders, duplicate stays counted once but both kept, item `stageId` not filtering coverage, unknown and malformed dates, leap day, month and year boundaries, zero stages, one invalid stage, several invalid stages, mixed validity with `bekannt=false`, trip dates wider than stages, calendar holes that are not gaps, nonempty `ohneTag` replacement, empty argument fallback, day items kept, and frozen inputs.

Long ranges assert arithmetic length and short-trip coverage without calling the old walk. A `1800-01-01`–`2200-01-01` stay (146097 nights) and a `0100-01-01`–`9999-12-31` stay (more than 3 million nights) each construct fewer than 40 `Date` objects. That bound is the operation evidence. There is no millisecond threshold.

## Residual the reviewer should press

- Gap names are easy to get wrong if adjacent same-id pieces are merged before coverage is subtracted. The test `gleiche Etappenkennung mit verschiedenen Namen` locks the name on the uncovered start.
- `isoMerker.text` throws if a boundary was not one of the source dates. Tests did not hit that throw. A throw would be an evaluator bug, not a new unknown-coverage fallback.
- Ownership search is quadratic in the number of required intervals. Stage counts in normal trips are small. The task allows that.
- #973 and #955 budgets are intentionally unchanged, so they can still refuse work the reader can now finish. That is a follow-up for the Technical Lead, not an edit in this PR.

## Not claimed

No hosted database, Auth, RLS, provider, secret, personal browser or Production action. Full `npm test` did not pass the disposable PostgreSQL proofs on this machine because PostgreSQL 16 binaries are absent. Those failures are recorded in the status. Remote CI on the final head is the remaining exact-head gate and was not green at authoring time.
