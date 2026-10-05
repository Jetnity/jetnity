# Trip Workspace Manual Flight Route Completion 1 — Correction Handoff

Date: 5 October 2026 · Issue #836 · Draft PR #837
Status: **DRAFT / P2 CORRECTION / STOP FOR INDEPENDENT TL RE-REVIEW**

## Review identity

- Same Generation-1 writer; no new writer, Cursor or subagent.
- Codex Desktop session `01a10975-730b-79d2-8bc0-fb664cf20085`; correction turn_context `2026-10-05T07:43:10.108Z`: `gpt-6-astra` / `xhigh`.
- Branch: `fix/trip-workspace-manual-flight-route-1`.
- Baseline / merge-base: `58d2781d4b48cfdc8f9131f374f90d9b96a10787`.
- Rejected head: `b1102d29ba447b6a17cc4a74cb0ed5f1d81e1c46`; TL CHANGES REQUIRED comment `5989842622`.
- Correction code/tests: `55abce49e72f2758709c357f5d1af8ec4aa3f356`, followed only by these three updated delivery docs.
- Exact final review head and fresh completed CI/Preview readback: PR-body delivery receipt. Expected graph: branch 5 ahead / 0 behind main. No previous exact-head PASS carries over.
- Immutable task seed: `e5ae8e54040c69d38c37e57d740e973982355446`; unchanged task blob `5cd20b05aff41754d62d43c70a269eb4b7cd8c4f`.

## Changed-file manifest

Correction against the rejected head: exactly six files:

1. `lib/trips/schema.ts` — comparisons only at identical-airport connections.
2. `lib/trips/flug-manuell.ts` — shared pure legacy-summary projection.
3. `lib/trips/flug-manuell.test.ts` — P2 schema/projection/Account/Guest/RouteFacts/FlugRoute/editor proofs.
4. `docs/TRIP_WORKSPACE_MANUAL_FLIGHT_ROUTE_COMPLETION_1_REPORT_2026-10-05.md`
5. `docs/TRIP_WORKSPACE_MANUAL_FLIGHT_ROUTE_COMPLETION_1_HANDOFF_2026-10-05.md`
6. `docs/TRIP_WORKSPACE_MANUAL_FLIGHT_ROUTE_COMPLETION_1_SELF_REVIEW_2026-10-05.md`

Cumulative PR against baseline: the six above plus:

7. `components/trips/FlugBestand.tsx`
8. `components/trips/GastArbeitsbereich.tsx`
9. `components/trips/KontoArbeitsbereich.tsx`
10. `components/trips/TripWorkspace.tsx`
11. `lib/trips/aktionen.ts`
12. `lib/trips/gastspeicher.ts`
13. `docs/TRIP_WORKSPACE_MANUAL_FLIGHT_ROUTE_COMPLETION_1_TASK_2026-10-05.md` — immutable seed addition only.

No route-domain/airport-reader, migration, API, generated DB type, dependency, central governance or #839 files changed. Items 7–13 are byte-identical to the rejected head.

## Re-review focus

Prove there is no cross-airport departure/arrival or route-envelope chronology rejection. Continuity and same-airport connection chronology remain strict; optional absent clocks are not guessed. Review the pure projection against all three date cases and missing clocks. Itinerary values must remain exact while unrepresentable legacy summary ends become null.

Account and Guest already share `manuelleFlugRouteBauen`, which now calls `manuelleFlugSummaryProjizieren`; no duplicated mapping was added. Recheck the unchanged Account authority, five-column UPDATE, identity/CAS/returned-row guards and sanitized failures. Tests assert actual Account payloads satisfy the existing SQL constraint predicates, without claiming a hosted save. Both Guest collections retain all sibling and non-route fields and null country/city facts. RouteFacts, FlugRoute and editor prefill consume exact itinerary values.

## Validation and limits

REPORT contains the detailed matrix. Fresh correction results: 51 manual-flight tests; 952 focused route/trip/guest/workspace tests; typecheck; lint (0 errors, 149 existing warnings); operating-mode and all five hygiene checks; production build PASS. New real local browser assertions verify Date-Line and earlier-clock persistence/reopen/display, missing-clock handling, invalid connection refusal and mobile overflow.

Local full suite: **5,261 PASS / 4 FAIL / 0 skipped**. The four unchanged Official Truth PostgreSQL tests cannot find `/usr/lib/postgresql/16/bin/initdb` on macOS. Assess the final-head Linux CI receipt separately; never reuse old CI `37249798922` or old Preview. The committed docs precede final-head CI, whose completed result is recorded in the PR body after publication.

No hosted Account/DB write, RLS alteration, migration, provider call or Production action occurred. TL's independent RLS read-only evidence remains attributed to TL. No physical-device acceptance is claimed. No new running costs.

Before acceptance reread live main/mode/#751/new #748 evidence, PR #837, file-disjoint #839, task blob and exact final changed files/graph/review threads. Last observed #748 material is `5988971332`, triage `5989855107`; #839 remains held at `3ebf3e4bde5d595722c361c07f62e41dee29ed40` until this writer stops.

**The writer stops after publishing and checking fresh CI/Preview. Keep Draft. Independent ChatGPT / Technical-Lead re-review is required; no Ready, merge, U02/U03/B01 or next slice.**
