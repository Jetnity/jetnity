# Lodging Interval Evaluation 1 — PLAN

Date: 23 October 2026
Writer: **Jetnity Lodging Interval Evaluation 1 — Cursor Generation 1**
Issue #981 / Draft PR #984 / branch `perf/lodging-interval-evaluation-1`

Immutable TASK V1 blob `400724c3a82aedffb6b893bd96e3a91bc2c62dc7`. This plan does not amend that contract.

## Session / model ACK

- Logical name: Jetnity Lodging Interval Evaluation 1 — Cursor Generation 1
- Session: https://cursor.com/agents/bc-6ae8a8df-dae6-402b-b8b8-b9dd21aff61a
- `bcId`: `bc-6ae8a8df-dae6-402b-b8b8-b9dd21aff61a`
- Requested model: Grok 4.7 High Fast / `grok-4.7-high-fast`
- Actual `originalModelName`: `grok-4.7-high-fast`
- UI title renamed with the supported chat-rename capability to the exact logical name.
- Not Auto. No fallback.

## Live read before this plan

- Mode: `NORMAL` (`.jetnity/operating-mode.json`).
- Seed head `46e7c86b98c7b417f64b29e46d19de6264cbc959`, tree `8ea396a776d461832ca8933a71b8bfced6991043`.
- `origin/main` and merge-base `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`. Ahead/behind `1/0`. Diff is the immutable task only.
- Ownership [6374412389](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6374412389): this writer owns only the interval evaluator. #983 owns lodging UI. #985 owns whole-source readiness. Shared public coverage contract stays frozen.
- Newest #751 material is that ownership comment, after precheck [6374289422](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6374289422).
- Newest #748 material is the Technical-Lead recovery [6373407485](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6373407485). It does not change this slice. P1 #968 / #748 stay independent and unresolved.
- `naechteHalboffen` callers at this read: the canonical test, the #973 preview test, and the evaluator itself. No other production importer.

## Goal

Replace the internal per-night expansion in `unterkunftAbdeckung` with half-open interval arithmetic. Keep the public types, export names, summary strings and every C01–C12 result. `naechteHalboffen` stays a public night list with its current array and invalid-date behaviour. The evaluator stops calling it.

## Semantics mapped to intervals

Dates that already pass `datumGueltig` become integer UTC day indices. Night count of `[start, end)` is `endIndex - startIndex`. Years 0000–0099 stay invalid, because `Date.UTC` already rejects them in the existing checker. That is not a new cap. Valid extremes used here are `0100-01-01` and `9999-12-31`.

- **C04 required time.** `benoetigteZeitraeume` stays as it is: all-valid stages, zero/one-stage trip fallback, mixed multi-stage `bekannt=false` with partial periods, wholly invalid multi-stage trip fallback.
- **C05 union and ownership.** Required measure is the merged half-open union. Ownership segments come from the sorted finite endpoints. Each atomic span belongs to the first original interval that contains it. Input order is not replaced by date order.
- **C06 gaps.** Uncovered ownership pieces stay chronological. Pieces join only when they touch and share `stageId`. `stageName` is the name on the piece where the gap starts, so adjacent same-id pieces with different names stay split until that join. A covered first piece must not donate its name to a later gap.
- **C07–C08 stays.** Each stay intersects the global required union. `stageId` on the item does not filter. Booked union wins; selected is the remainder. `naechte` is the full stay length. `ausserhalb` is true only when the required union is nonempty and the intersection is empty.
- **C09–C12.** Invalid stays keep original strings, `naechte=null`, `status=unknown`, `ausserhalb=false`. They do not change `bekannt` or numeric aggregates. Unknown need keeps null aggregates, `luecken=[]`, partial periods and per-stay results. Nonempty `ohneTag` replaces `reise.ohneTag`; an empty argument falls back. Item order and references stay. Summary precedence stays in `zusammenfassungAus`.

No `Set`, `Map`, `Array.from` or per-day loop on the evaluator path. Endpoint lists and merges scale with intervals and overlap boundaries. Quadratic ownership over the stage list is acceptable. No second evaluator, no duration cap, no schema or validation change.

Output dates are the original source strings recorded at those endpoints. Gap edges are existing boundaries, not a walk to the next night.

## Files

- `lib/trips/naechte-abdeckung.ts` — interval helpers and `unterkunftAbdeckung` only. Public `naechteHalboffen` body stays.
- `lib/trips/lodging-interval-evaluation-1.test.ts` — new.
- Task docs only. No edit to canonical tests, schema, booking, actions, UI, audit or preview budgets, `ACTIVE_WORK_STATUS`, vision, architecture, roadmap or decisions.

## Tests

- Existing `naechte-abdeckung.test.ts`, #973 lodging-preview tests, and the audit / workspace status tests that already call this reader, unchanged.
- New small differential oracle: the old per-night specification, not a rewrite of the interval code. Complete-output parity for overlap, nesting, adjacency, disjoint stages and stays, reversed order, first-interval precedence, same `stageId` with different names, booked-over-selected, unknown and malformed dates, each fallback, leap-day and month/year boundaries, day-item plus `ohneTag` override, and no input mutation.
- Long ranges (`1800-01-01`–`2200-01-01`, and valid four-digit extremes) assert full stay length, exact short-trip coverage and gap counts. Evidence is `Date` construction count during the call, plus a source check that the evaluator does not call `naechteHalboffen`. No millisecond threshold and no old-algorithm stress oracle.

## Traveller context

Not applicable. Coverage is traveller-neutral date arithmetic on the trip graph. This slice does not read or store citizenship, residence or travel documents.

## Risks

- A missed ownership or gap-name case would still satisfy a count-only test. The oracle compares the whole public object on small cases, including gap names.
- `naechteHalboffen` remains able to expand a long public call. Changing that array is outside this contract. Residual only.
- Replacing `Date` in the allocation probe must be restored in `finally`. It is test-only.

## Out of scope

No hosted database, Auth, RLS, secrets, provider, paid call, dependency, workflow or config change. No Ready, no merge, no follow-up slice. Cursor does not synchronize #983 or #985.
