# Direct Edit Lodging Coverage Preview 1 — implementation plan

Date: 23 October 2026
Writer: Jetnity Direct Edit Lodging Coverage Preview 1 — Cursor Generation 1
Issue #970 / Draft PR #973 / branch `feat/direct-edit-lodging-coverage-preview-1`

Immutable inputs, unchanged by this plan: TASK blob `258bed9fc85ae8dbcc978ef1715132e9b0978e58`, V2 blob `07d68779031b2fb2d8a88207be89738f9d1ab8e9`.

## Goal

Show honest before/after recorded accommodation-night coverage inside the existing unsaved manual-edit impact preview, using the unchanged canonical `unterkunftAbdeckung` reader. A trip-date or stage-duration edit already says protected booking dates stay put; it does not show the recorded-night consequence. #957 stays dormant.

## Files

- `lib/reiseaenderung/direct/auswirkungen.ts` — arithmetic admission, then one additional group in the existing `{ titel, zeilen }` shape.
- `lib/reiseaenderung/direct-lodging-coverage-preview-1.test.ts` — new behavioral tests.
- Task-owned docs only. No change to `components/trips/ReiseAenderungAuswirkungen.tsx`: the existing disclosure, 20-row pager, focus return and responsive wrap already present the group. Pagination is presentation only and is not the computation bound.

## Admission

Before either reader call, measure every trip, stage and stay interval by date arithmetic. Do not walk nights to discover that the walk is too large. A single interval may exceed `GRENZEN.reisedauerInTagen` because stage and stay spans are not capped by the trip-duration rule. Reject that interval. Estimate canonical repeated passes (required intervals twice, plus a third pass when gaps are closed; each stay once) and keep the sum across both snapshots within 40_000 estimated enumerations. A rejected side is unavailable, is not passed to the reader, does not become zero coverage, and does not block confirmation. One unqualified side blocks a conclusive comparison.

## Product contract

- Same pure preview for Guest and Account. No persistence, confirmation, revision or readback change.
- Meaningful lodging-fact changes only. Title, budget and other non-lodging edits add no group.
- Booked means user-marked recorded plan state, not a supplier confirmation.
- Unknown dates, `bekannt=false`, null totals and unknown stay status stay visibly unknown.
- Stable stage ids distinguish repeated stage names. Unassigned stays are counted once, by the canonical reader.
- No mutation, no rebooking suggestion, no second impact framework.

## Not in this slice

No DB, Auth, RLS, API, provider, LLM, dependency, flag, migration or shared-evaluator change. Global status, roadmap and governance stay untouched.

## Tests

Focused behavioral file plus existing direct-edit and canonical night-coverage regressions. Synthetic render of the existing disclosure if the test runner can import it. Desktop, mobile and keyboard viewport evidence only if this environment can show an isolated synthetic preview without an account or a new hosted fixture.

## Risks

- Over-strict admission can hide coverage for a pathological but schema-shaped graph. Normal trip edits stay far under the ceiling.
- The optional reader argument exists so tests can prove a rejected side never reaches the canonical function. Production callers omit it.
- Requested model Claude Opus 5.5 High is not this run. Actual model is reported in the handoff. This plan does not switch models.

## Review fix R101

The Product Owner accepted the observed model `grok-4.7-high-fast` for this same session. That acceptance closes only the model STOP. The canonical evaluator stays unchanged.

- A side with one or more stages is qualified only when every stage has a valid half-open interval. One incomplete stage, and several stages that are all incomplete, stay visibly unknown even when `unterkunftAbdeckung` returns numeric trip-date fallback coverage. A trip with no stages may still use that fallback.
- The lodging lines no longer say that all accommodation data stay unchanged. An unconfirmed stay without price, provider, booking link or external reference moves with the existing date edit. The preview still says nothing is cancelled or rebooked automatically with a supplier.

## Integration R101 V2

One ordinary merge of reviewed main `8f64d5fdb819065791235879822b1074205899c0` (tree `73ee0a59570d2f92744e95605ec818296948f533`) into this branch. That commit is the #972 visit-date form fix, its helper, test and task docs. No path overlap with the lodging files. No rebase and no second merge. No lodging behaviour change.
