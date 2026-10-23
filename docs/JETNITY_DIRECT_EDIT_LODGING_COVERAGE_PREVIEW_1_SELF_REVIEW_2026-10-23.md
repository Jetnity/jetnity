# Direct Edit Lodging Coverage Preview 1 — self-review

Writer: **Jetnity Direct Edit Lodging Coverage Preview 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-0d71c6f4-154a-44a7-a147-e5b83c166ec1
This self-review is not Technical-Lead PASS.

## Acceptance

1. Date shift and duration change show canonical before/after coverage. A stage shorten that collapses a stage to arrival equal to departure stays unknown, because that is what `unterkunftAbdeckung` returns. Protected stay dates, price and booking mark are unchanged.
2. Half-open intervals, overlap union, stage ids and a single ohneTag count come from the canonical reader. The preview does not recompute nights.
3. Booked text says the user marked it in the recorded plan. It does not claim a supplier confirmation, availability, or readiness.
4. Incomplete stage dates, null stay dates, `bekannt=false` and unknown stay status stay visibly unclear. A known total beside an unknown stay is not shown as a global fraction.
5. Sides are admitted and read independently. One unavailable or unclear side adds an explicit non-comparison row. A thrown reader becomes unavailable and does not fail `manuellerEntwurf`.
6. Title and budget edits add no lodging group and do not call the reader. Repeated stage names keep their ids.
7. Snapshots and localStorage are unchanged by the preview. The copy says nothing is cancelled or rebooked automatically.
8. Guest and Account proposals produce the same preview groups.
9. The renderer was not modified. A synthetic static render shows the new summary with the full row count, including a case with more than 20 rows. The closed disclosure does not inline those rows. The 20-row pager remains the existing component behavior.
10. No schema, flag, dependency, or #957 activation.

V2: arithmetic admission runs before the reader. A 366-night stage and a year-1000 to year-2000 stay are unavailable. An injected reader is not called for the rejected side. Two snapshots that are each under 40_000 estimated walks, but over it together, call the reader zero times. A 365-night span is admitted and the real reader runs.

## Findings

- P0: none found.
- P1: requested model Claude Opus 5.5 High was not the model that executed this session. Observed `originalModelName=grok-4.7-high-fast`. The implementation proceeded because this acknowledged session was already bound to that model. Technical Lead decides whether that limits review.
- P2: the 40_000 estimate counts a third pass over required intervals whenever gaps would be closed, so some large but finite graphs are marked unavailable before the reader could have finished. That is the stricter bound required by V2. Normal fixture edits are far below it.
- P2: full `npm test` is not green in this environment. The 10 failures and 5 skips are local PostgreSQL or loopback-layout gates, not this diff. GitHub CI on the final head was not yet a result at authoring time.
- P3: `auswirkungen` accepts an optional reader argument so tests can prove a rejected side is not evaluated. Production callers omit it. Two-argument behavior is unchanged.
- P3: styled desktop, mobile and keyboard expand of the manual editor were not executed. The component file did not change.

## Not claimed

No supplier truth, no live availability, no persistence change, no #957 runtime, no Production or database action.
