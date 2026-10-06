# Trip Workspace flight coverage proof guard 1 — Handoff

6 October 2026 · #873 / Draft #877

**TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_READY**

The existing runtime repair remains byte-identical to reviewed head `03fd4495d89841c836d92ced7e1ea44622b3e6cd`. The five old date-only expectations now use proven positive route fixtures under the [TL-approved three-file extension](https://github.com/Jetnity/jetnity/pull/877#issuecomment-6020368847). Focused 175/175 and broad trip/route/mobility 1061/1061 tests pass, with zero failures and zero skips. The [report](TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_REPORT_2026-10-06.md) contains the exact commands, all 11 PR paths and each corrected test case.

## Review identity

- Authorized branch: `fix/trip-workspace-flight-coverage-proof-guard-1`.
- Correction-time remote main: `fbf8664c4c12afc1eb04336a1f0cadbc64b34327` (disjoint #878 integrated).
- Merge-base: `b16a250b95715418c125a92a2d407ba2ec3f89fa`.
- Original task seed: `00cfcedd764599e5987bcb647f780a3b52e5b9a2`.
- TASK: `docs/TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1_TASK_2026-10-06.md`.
- Immutable TASK blob: `92bbf311a3319947c891c10a53b88087d22a367a`.
- Runtime blob unchanged: `1b8f7d005c8dbe74eec69c37cea2901c2147d049`.
- Delivery head: the commit containing this corrected handoff; final exact SHA and live ahead/behind are in the STOP receipt. Verify against Draft PR #877.
- Session `01a111cd-17b6-7bb1-bd6e-2f52e52bec20`, `gpt-6-astra` / `xhigh` (persisted session metadata).

## Boundary for independent review

`routeFactsFuerPunkt` supplies canonical endpoint and chronology facts. Date is only a filter. Both endpoint identities, a single leg, exactly one candidate and one proven required section are required. Missing/mismatching facts or ambiguous candidates remain unassigned. Item booking status cannot create route proof.

Positive fixtures now use the existing direct-itinerary helper with explicit ZRH/CH/Zürich and BKK/TH/Bangkok facts, dated for their test. The required origin has an explicit airport identity; the stage has matching city/country. A reversed itinerary proves the return. Positive status/count assertions remain intact. The sole summary update adds the existing canonical route prefix. Generic route-less/unknown/no-required-section fixtures are unchanged.

No runtime or original guard-regression edit was needed in this correction. Public coverage shape, booking data, section construction and consumers stay unchanged. Wrong coverage remains `unbestimmt` in Workspace and preserves `coverage.fluege` Attention. Conservative limits for city-only origins, missing countries, same-date ambiguity and multi-leg items remain intentional.

## Completed validation and next action

Typecheck, repository lint (0 errors; 145 existing warnings), strict lint for all changed code/tests (0 warnings), local production build, all six static hygiene/mode checks and diff hygiene pass. P0 0; open runtime P1 0; P2 0 open; P3 0 new. Former G-01 is resolved by the authorized fixture correction.

Only independent ChatGPT / Technical-Lead review of the new exact published head remains. No full-suite, DB, live provider, browser, authenticated Account E2E or Production acceptance claim. No Ready, merge, new writer or follow-up slice.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW. PR remains Draft.**
