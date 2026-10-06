# Trip Workspace flight coverage proof guard 1 — Handoff

6 October 2026 · #873 / Draft #877

**TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_NOT_READY**

The guard is implemented and its 106 focused coverage/workspace/Attention tests pass. Delivery remains blocked by five broader tests in three paths outside the immutable allowlist. See the [report](TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_REPORT_2026-10-06.md) for exact commands, results and failure identities.

## Resume identity

- Authorized branch: `fix/trip-workspace-flight-coverage-proof-guard-1`.
- Last freshly fetched remote main / merge-base: `b16a250b95715418c125a92a2d407ba2ec3f89fa`.
- Original task seed: `00cfcedd764599e5987bcb647f780a3b52e5b9a2`.
- TASK: `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_TASK_2026-10-06.md`.
- Immutable TASK blob: `92bbf311a3319947c891c10a53b88087d22a367a`.
- Delivered head: the commit containing this handoff; exact remote SHA and ahead/behind are in the final STOP receipt. Resolve with `git rev-parse HEAD`; verify against PR #877 before review.
- Session `01a111cd-17b6-7bb1-bd6e-2f52e52bec20`, `gpt-6-astra` / `xhigh` (persisted session metadata).

## Review the actual boundary

`routeFactsFuerPunkt` supplies canonical endpoint and chronology facts. Date is only a filter. Require both endpoint identities, a single leg, exactly one candidate and one proven required section. Unknown/mismatching country, absent city, conflicting airport ID and ambiguous candidates remain unassigned. Item booking status cannot create route proof.

A non-airport Trip origin currently has no country fact and cannot support a deterministic city association. An explicit `airport:XXX` origin plus canonical stage city/country supports real positive outbound/return matches. Single-leg transit and city-to-city multi-stage connections remain supported. Multi-leg items are not split. Names are normalized only by the existing trim/case contract; there are no aliases, IATA inference or lookups.

The public coverage shape, booking data, section construction and consumers are unchanged. Wrong coverage now reaches Workspace as `unbestimmt`, preserving `coverage.fluege` in Attention.

## First unfinished action

Independent Technical Lead: review the exact published head and decide the allowlist correction for **this same slice**. The five older presentation tests need truthful positive fixtures or honest unknown expectations in:

- `lib/trips/detail.test.ts`
- `lib/trips/uebersicht.test.ts`
- `lib/trips/workspace-status-language-1.test.ts`

Those files are unchanged. Do not accept the broader suite as green (1056/1061 pass, five failures). Do not restore date-only matching to satisfy them. No alternate writer, new slice, Ready or merge was started.

## Changed files against main

- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_TASK_2026-10-06.md` — pre-existing seed only; immutable.
- `lib/trips/flug-abdeckung.ts`
- `lib/trips/flug-abdeckung.test.ts`
- `lib/trips/arbeitsbereich.test.ts`
- `lib/trips/attention.test.ts`
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_REPORT_2026-10-06.md`
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_SELF_REVIEW_2026-10-06.md`

Typecheck, lint, zero-warning focused lint, local production build and all six static hygiene/mode checks pass. No full-suite, DB, live provider, browser, authenticated Account E2E or Production acceptance claim. P0 0; open runtime P1 0; P2 1 acceptance blocker; P3 0 new.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW. PR remains Draft.**
