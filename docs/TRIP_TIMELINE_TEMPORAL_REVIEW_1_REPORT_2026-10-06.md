# Trip Timeline temporal review 1 — corrected delivery report

7 October 2026 · Issue #895 / Draft PR #897

**TRIP_TIMELINE_TEMPORAL_REVIEW_1_READY** for independent exact-head re-review only; author self-assessment, not Technical-Lead PASS.

## Authority and current baseline

Logical writer: **Trip Timeline temporal review 1 — Generation 1**. Actual session `01a112f5-ca7b-77b1-8126-e9b9d22890f2`; persisted model/effort on this correction turn: `gpt-6-astra` / `xhigh`.

Binding TASK blob remains `45dcf5589470247c4c074cacc4d2d7f5c1c65cf6`. Correction parent is the Technical-Lead sync `98e7a12920aee0afd1afc138d374588499c3d76c`, preserving PR #901 and current main `ecc0ecf3b9c024b295034b6985fa26ca40bc82f1`. Main is the correction's merge-base. Exact delivered head is the remote commit containing these documents, resolved in the final post-push receipt; its CI/Auth/Preview must be freshly read. Old implementation/sync gates are not acceptance for this change.

The controlling [TL review 5435314344](https://github.com/Jetnity/jetnity/pull/897#pullrequestreview-5435314344) supersedes provisional CONTENT PASS 5435257260. Publication was already resolved; this round fixes only its in-scope P2. The original local commits were preserved on a local archive ref before checking out the synchronized authorized branch. No reset, force-push, merge or rebase was performed in this correction.

## Targeted correction

Previously `boundaryRead` converted a closed estimate to its earliest/latest alternatives. A start-only estimate [10:00,11:00] versus occupied [10:20,10:40) therefore missed 10:30 and returned `not_evaluable`.

Boundary alternatives now retain a `ClosedRange`. Exact and civil candidates become separate singleton ranges, keeping their choice assignments and finite holes. An estimated range is one bounded range, not a pair of endpoint candidates. `overlapPossible` checks existence in constant work per compatible alternative pair:

- Two anchors: their closed ranges intersect, including a shared endpoint.
- Anchor versus occupied interval: latest anchor >= earliest interval start AND earliest anchor < latest interval end.
- Two occupied intervals: each earliest start < the other's latest end.

These tests are applied only after evidence/context/correlation validation. Every admitted start/end combination must retain positive duration: earliest end > latest start. A supplied exact duration must equal both extreme possible durations; contradictory ranges are rejected, not narrowed. Finite correlations still exclude only explicitly incompatible choices. No convex hull is taken over discrete candidates. No minutes are enumerated and no end/duration is invented. The 64-assignment, 10,000-pair and existing graph bounds remain in force. Estimate basis still prevents both `proven_conflict` and `no_proven_conflict`, including singleton estimates; exact overlap minutes remain limited to qualified non-estimated proofs.

The rest of the slice is unchanged: full current graph projection, four outcomes, separate coverage, canonical itinerary facts/Date-Line preservation, conservative live qualification and original-ID read-only Plan UI. Same-day placement is not an event date, local time is not UTC, hotel/rental availability is not personal occupation, and zero findings are not an all-clear. The live Trip adapter continues to reject arbitrary estimate/instant caller extras.

## Fresh verification

Eight active `closed estimate range:` regressions were added before changing the runtime. On the unchanged synchronized runtime they produced **4 PASS / 4 FAIL**, exit 1: the start-only, milestone, inner range intersection and huge-range cases missed an interior witness. The identical tests after repair produced **8 PASS / 0 FAIL**, exit 0. Remaining cases check inclusive estimate boundaries versus half-open occupation, separated estimates, finite-candidate holes/civil isolation, and invalid assignments/explicit-duration constraints.

Fresh verification: **107 focused tests** (including all **31 temporal tests**), **1,078 Trip/Route tests**, typecheck, lint, production build and all six mode/hygiene gates PASS. Lint: **0 errors / 145 existing warnings**, no changed-code warning. `git diff --check` PASS. No assertion, exit guard or work limit was relaxed. [Correction manifest](evidence/trip-timeline-temporal-review-1/estimate-range-correction/verification.json) binds fresh logs to the current runtime/test SHA-256 values; [before](evidence/trip-timeline-temporal-review-1/estimate-range-correction/regression-before.txt) and [after](evidence/trip-timeline-temporal-review-1/estimate-range-correction/regression-after.txt) retain the red/green evidence.

Commands and sanitized stdout are recorded in the correction manifest. Build ran the standard `npm run build`, including prebuild; existing local IPC permission requirements were honored without changing the command or guards. Required focus includes Core/timeline/premium/detail/cross-device/workspace-mode tests; broader coverage includes all Trip/Route test files on the synchronized baseline.

## Inherited browser evidence

**Browser evidence is inherited, not freshly executed.** The original 155 synthetic browser cases (32 temporal / 40 Core / 26 premium / 57 navigation), required 360/390/768/1440 px and 200% text belong to the earlier implementation `cef74bc4cfda1999081e0f26913097c78c7118c3`, preserved unchanged by the TL sync. The original [manifest](evidence/trip-timeline-temporal-review-1/verification.json), JSON/screenshots and `gate-output/` are historical source-bound evidence, not a browser rerun of the corrected kernel. UI, live Trip adapter, audits and the original single premium selector adaptation are unchanged by this correction. No current manual/automated Preview browser acceptance is claimed.

## Remaining gaps and review boundary

- P0/P1: no known new finding in the executed correction checks; independent review remains required.
- P2: TL finding 5435314344 is repaired with failing-before/passing-after evidence, pending independent exact-head re-review. Fresh browser execution, physical devices, screen reader and authenticated persistence E2E remain gaps. Mathematical estimates/instants are synthetic, never real provider/traveller qualification.
- P3: 145 existing lint warnings. Full repository `npm test` and `auth:pruefen` were not run locally; read their fresh remote results in the final receipt rather than inheriting an earlier green run.

No UI expansion, new dependency, provider/timezone activation, DB/Supabase/schema/Auth/RLS change, graph/booking/readiness mutation, Official Truth/F8/#900 edit, global continuity edit or new cost. No replacement agent or follow-up slice. PR remains Draft; no Ready or merge.

## Changed files

This correction changes only the temporal kernel/test, the three allowed delivery documents, source-bound text evidence and the complete changed-file manifest. See [correction delta](evidence/trip-timeline-temporal-review-1/estimate-range-correction/changed-files.txt) and [all PR paths](evidence/trip-timeline-temporal-review-1/changed-files.txt). No synced #898/Official Truth path was edited.

STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW.
