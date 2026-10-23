# Direct Edit Lodging Coverage Preview 1 — self-review

Writer: **Jetnity Direct Edit Lodging Coverage Preview 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-0d71c6f4-154a-44a7-a147-e5b83c166ec1
This self-review is not Technical-Lead PASS.

## Acceptance

1. Date shift and duration change show canonical before/after coverage. A stage shorten that collapses a stage to arrival equal to departure stays unknown, because that is what `unterkunftAbdeckung` returns. Protected stay dates, price and booking mark are unchanged.
2. Half-open intervals, overlap union, stage ids and a single ohneTag count come from the canonical reader. The preview does not recompute nights.
3. Booked text says the user marked it in the recorded plan. It does not claim a supplier confirmation, availability, or readiness.
4. Incomplete stage dates, null stay dates, `bekannt=false` and unknown stay status stay visibly unclear. A known total beside an unknown stay is not shown as a global fraction. R100 F1: one incomplete stage, and several stages that are all incomplete, now stay unknown on that side even when the unchanged canonical reader returns numeric trip-date fallback coverage. A trip with no stages still shows that fallback. One qualified side does not become a comparison.
5. Sides are admitted and read independently. One unavailable or unclear side adds an explicit non-comparison row. A thrown reader becomes unavailable and does not fail `manuellerEntwurf`.
6. Title and budget edits add no lodging group and do not call the reader. Repeated stage names keep their ids.
7. Snapshots and localStorage are unchanged by the preview. R100 F2: the lodging lines no longer claim that all accommodation data stay unchanged. An unconfirmed unpriced stay moves with the date edit, and the displayed canonical after-state uses the shifted dates. The copy says nothing is cancelled or rebooked automatically with a supplier. Protected commercial dates still stay put through the existing editor.
8. Guest and Account proposals produce the same preview groups.
9. The renderer was not modified. A synthetic static render shows the new summary with the full row count, including a case with more than 20 rows. The closed disclosure does not inline those rows. The 20-row pager remains the existing component behavior.
10. No schema, flag, dependency, or #957 activation.

V2: arithmetic admission runs before the reader. A 366-night stage and a year-1000 to year-2000 stay are unavailable. An injected reader is not called for the rejected side. Two snapshots that are each under 40_000 estimated walks, but over it together, call the reader zero times. A 365-night span is admitted and the real reader runs.

## Findings

- P0: none found.
- P1: none open from this fix. The first dispatch requested Claude Opus 5.5 High. This session ran as `originalModelName=grok-4.7-high-fast` and cannot switch. The Product Owner accepted that model in R101. This review does not claim Claude.
- P2: the 40_000 estimate counts a third pass over required intervals whenever gaps would be closed, so some large but finite graphs are marked unavailable before the reader could have finished. That is the stricter bound required by V2. Normal fixture edits are far below it.
- P2: full `npm test` on merge `da4db5cb` is not green in this environment. 7014 tests, 6999 pass, 10 fail, 5 skipped. The failures are local PostgreSQL proofs (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or missing local binaries with no hosted fallback). The skips are native PostgreSQL or loopback-layout gates. The nine additional tests versus the pre-merge run are the merged visit-date tests, and they passed. GitHub CI on the final head was not yet a result at authoring time.
- P3: `auswirkungen` accepts an optional reader argument so tests can prove a rejected side is not evaluated. Production callers omit it. Two-argument behavior is unchanged.
- P3: styled desktop, mobile and keyboard expand of the manual editor were not executed. `/ui-audit/trip-workspace` does not mount this preview and is 404 unless `JETNITY_UI_AUDIT` is set. This integration does not set that flag, does not add a fixture route, and has no `.env`. The existing static markup assertion is not a styled or keyboard pass. No browser was opened.

## Not claimed

No supplier truth, no live availability, no persistence change, no #957 runtime, no Production or database action.
