# Trip Workspace direct-flight schedule readback 1 — Self-review

Date: 6 October 2026. Issue #874 / Draft PR #878.

Classification: **TRIP_WORKSPACE_DIRECT_FLIGHT_SCHEDULE_READBACK_READY**.
This is the writer's self-review, not the required independent exact-head review.

## Adversarial checks

| Risk | Evidence / outcome |
| --- | --- |
| Stored Date-Line arrival is lost through legacy summary | Test builds the real manual-flight itinerary; legacy arrival date/time are null, but both exact itinerary values render, including the earlier arrival date |
| Local times converted or used to infer flight duration | Runtime only calls unchanged string-based `segmentZeit`; no new import or time calculation. Earlier same-day arrival is preserved; Honolulu/Tokyo test runs pass |
| Optional values replaced with invented clocks | Null departure, arrival and both clocks, date-only, clock-only, one-sided and all-null cases tested; existing unknown text retained |
| Direct flight requires an extra interaction | Schedule is a normal paragraph; tests exclude details/summary/list controls |
| Duplicate timing or routes with no facts | Exact occurrence checks; display-only/empty-segment routes remain unchanged; guard requires exactly one segment |
| Multi-segment regression | Existing disclosure source untouched; new test checks both segments and proven connection duration inside the closed details. Entire rendered connection HTML byte-identical to seed |
| Facts mutated during display | Deep equality before/after render |
| Mobile clipping or overflow | Existing tokens, shrinkable wrapper, normal wrapping and break-words. Ten Chrome viewports pass including 280px and two landscape sizes; 390/1280 screenshots visually inspected |
| Parallel-writer collision | Only owned component, new dedicated test and three named slice docs changed; immutable TASK verified; no shared-test/global-file edits |

No unresolved P0/P1/P2/P3 finding identified inside this bounded change. Other #871 findings remain outside this slice and are not declared resolved.

## Evidence integrity

- Regression was first reproduced on the unchanged seed (13 failed / 3 passed), then all 16 new tests passed with the five-line fix.
- 233 focused tests, typecheck, full lint, changed-file strict lint, five hygiene checks, production build and diff check pass; full lint warnings are disclosed.
- Initial sandbox IPC build failure and successful reviewed rerun are disclosed in the report.
- No full-suite, Safari/physical-device, Account E2E, hosted Preview UI or Production claim. Browser tests use actual component/CSS in a synthetic wrapper; they do not prove full workspace behavior.
- Publication/exact head and current remote gates must be read back after push. Existing seed CI/Preview is not delivery evidence.
- TASK blob remains `d5e019c9002a9fbe8404b1f5c74c8c9eb53a02b9`; base at pre-publication remains `b16a250b95715418c125a92a2d407ba2ec3f89fa`.

Codex Desktop; **Trip Workspace direct-flight schedule readback 1**; original session `01a111cd-6d00-73b2-84ab-f64a3d9ed809`; `gpt-6-astra` / `xhigh` from persisted `turn_context`.

PR stays Draft. No Ready, merge, follow-up, DB, provider or Production action.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
