# Trip Workspace flight coverage proof guard 1 — Task

Date: 6 October 2026
Issue: #873
Repository: Jetnity/jetnity
Baseline: `main@b16a250b95715418c125a92a2d407ba2ec3f89fa`
Branch: `fix/trip-workspace-flight-coverage-proof-guard-1`
Execution lane: Codex Desktop
Parallel-safe with #874/#875/#876 when this allowlist is respected.

## Objective

Fix #871 F-01. A required journey flight section must never become selected/booked merely because a flight's date matches.

The current defect allows an unrelated NRT→LAX flight on the same date to cover Zürich→Florenz and can suppress flight Attention.

## Required truth contract

- Date equality may be necessary context but is never sufficient proof of route association.
- Use only already stored/trusted Trip + route facts. Do not add a new airport lookup, geocoder, provider call or inferred IATA mapping.
- A required section can consume a flight only when the current graph proves both route endpoints under existing deterministic identity/equality contracts.
- Country-only coincidence is not sufficient for city/section identity.
- Missing/ambiguous endpoint proof must fail closed: keep the item unassigned and the required section open/unknown as appropriate.
- A wrong or ambiguous flight must never suppress the coverage Attention signal.
- User booking status remains a statement about that item only; it cannot upgrade an unproven section association.
- Preserve deterministic one-item/one-section consumption and current no-duplicate behavior.

Codex must inspect existing `routeFactsFuerPunkt`, route domain/equality helpers and Trip stage/origin identity before choosing the smallest implementation. Do not invent new truth sources.

## Required regressions

At minimum prove:
1. NRT→LAX on same date does NOT cover Zürich→Florenz.
2. Marking that wrong flight booked does not make the required section booked.
3. Two unrelated flights on outbound/return dates do not yield aggregate `belegt` and do not remove flight Attention.
4. Missing route identity remains unassigned/unknown rather than guessed.
5. Multiple same-date candidates remain fail-closed.
6. A legitimately provable route association still produces selected/booked.
7. Existing multi-stage/return/no-origin/no-required-section behavior remains honest.
8. Guest null-country/IATA-only data does not get upgraded by guessed city identity.
9. Account-like explicit facts cannot be used unless they deterministically match the required section.

## Allowed files

TASK is immutable:
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_TASK_2026-10-06.md`

Modify only as needed:
- `lib/trips/flug-abdeckung.ts`
- `lib/trips/flug-abdeckung.test.ts`
- `lib/trips/arbeitsbereich.test.ts`
- `lib/trips/attention.test.ts`

Create only:
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_REPORT_2026-10-06.md`
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_SELF_REVIEW_2026-10-06.md`

No other path without STOP + TL approval.

## Non-scope

No UI redesign. No manual-flight editor/readback change. No airport/geocoder/provider integration. No schema/DB/Supabase. No Official Truth/F8. No Auth. No Production mutation. No global continuity edit. No follow-up slice.

## Checks

Run focused flight coverage + workspace status + Attention tests.
Run relevant broader trip tests if practical.
Run `git diff --check`, typecheck/lint if proportionate.
Report exact commands and do not inherit green claims.

## Delivery

Re-read remote main before STOP. Commit + push authorized branch.
Report exact head, merge-base/ahead/behind, changed files, TASK blob, tests, findings, Codex session/model evidence.

Classification:
- `TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_READY`
or
- `TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_NOT_READY`

Stay Draft. Do not Ready. Do not merge. Do not start follow-up.

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
