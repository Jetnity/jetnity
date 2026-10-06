# Trip Timeline temporal review 1 — corrected self-review

7 October 2026 · #895 / Draft #897

**TRIP_TIMELINE_TEMPORAL_REVIEW_1_READY** for independent re-review only. This is author self-review, not TL PASS.

Logical writer: **Trip Timeline temporal review 1 — Generation 1**. Actual session `01a112f5-ca7b-77b1-8126-e9b9d22890f2`; persisted model/effort on this correction turn: `gpt-6-astra` / `xhigh`.

Binding TASK blob remains `45dcf5589470247c4c074cacc4d2d7f5c1c65cf6`. Correction parent is the Technical-Lead sync `98e7a12920aee0afd1afc138d374588499c3d76c`, preserving PR #901 and current main `ecc0ecf3b9c024b295034b6985fa26ca40bc82f1`. Main is the correction's merge-base. Exact delivered head is the remote commit containing these documents, resolved in the final post-push receipt; its CI/Auth/Preview must be freshly read. Old implementation/sync gates are not acceptance for this change.

## Controlling finding

[TL review 5435314344](https://github.com/Jetnity/jetnity/pull/897#pullrequestreview-5435314344) correctly identified that endpoint-only estimates lost valid interior anchors. Provisional CONTENT PASS 5435257260 is superseded. The new regressions were run before the repair; a green earlier build did not cover this contract defect.

## Adversarial check of the final correction

| Question | Evidence / conclusion |
| --- | --- |
| Is [10:00,11:00] versus occupied [10:20,10:40) possible? | Yes for start-only and milestone: the range intersection admits 10:30. Both formerly failed and now pass. |
| Can two ranges intersect without equal endpoints? | Yes; nested/crossing ranges and an exact interior anchor pass. |
| Is the closed estimate's latest endpoint included? | Yes at the occupied start; the occupied end stays excluded. Singleton estimates remain estimates. |
| Are separated estimates proven disjoint? | No; they remain not_evaluable with null overlap minutes. |
| Can a range force minute enumeration? | No; the wide ±1,000,000,000,000 range passes through constant-work inequalities. |
| Are discrete candidate holes replaced by a hull? | No; each candidate remains a separate singleton with its choices. The 10:00/11:00 alternatives do not intersect [10:20,10:40]. |
| Can civil data be mixed with estimated instants? | No; context admission is unchanged and covered by regression. |
| Can a bad range be silently narrowed? | No; earliest end must exceed latest start for every admitted combination. Contradictory exact durations reject the span. |
| Are exact/correlated proofs and work limits preserved? | Existing tests still pass; same choice-domain/combination validation, 64-assignment and 10,000-pair bounds. Exact minutes only for qualified instant proofs. |
| Is a missing end fabricated? | No; anchors keep end=null, start-only missing-end evidence remains, milestones need no end. |
| Is the TL sync preserved? | Work started at 98e7a129; final commit descends from that sync. No #898/#900/Official Truth edits. |

Eight active `closed estimate range:` regressions were added before changing the runtime. On the unchanged synchronized runtime they produced **4 PASS / 4 FAIL**, exit 1: the start-only, milestone, inner range intersection and huge-range cases missed an interior witness. The identical tests after repair produced **8 PASS / 0 FAIL**, exit 0. Remaining cases check inclusive estimate boundaries versus half-open occupation, separated estimates, finite-candidate holes/civil isolation, and invalid assignments/explicit-duration constraints.

Fresh verification: **107 focused tests** (including all **31 temporal tests**), **1,078 Trip/Route tests**, typecheck, lint, production build and all six mode/hygiene gates PASS. Lint: **0 errors / 145 existing warnings**, no changed-code warning. `git diff --check` PASS. No assertion, exit guard or work limit was relaxed. [Correction manifest](evidence/trip-timeline-temporal-review-1/estimate-range-correction/verification.json) binds fresh logs to the current runtime/test SHA-256 values; [before](evidence/trip-timeline-temporal-review-1/estimate-range-correction/regression-before.txt) and [after](evidence/trip-timeline-temporal-review-1/estimate-range-correction/regression-after.txt) retain the red/green evidence.

**Browser evidence is inherited, not freshly executed.** The original 155 synthetic browser cases (32 temporal / 40 Core / 26 premium / 57 navigation), required 360/390/768/1440 px and 200% text belong to the earlier implementation `cef74bc4cfda1999081e0f26913097c78c7118c3`, preserved unchanged by the TL sync. The original [manifest](evidence/trip-timeline-temporal-review-1/verification.json), JSON/screenshots and `gate-output/` are historical source-bound evidence, not a browser rerun of the corrected kernel. UI, live Trip adapter, audits and the original single premium selector adaptation are unchanged by this correction. No current manual/automated Preview browser acceptance is claimed.

- P0/P1: no known new finding in the executed correction checks; independent review remains required.
- P2: TL finding 5435314344 is repaired with failing-before/passing-after evidence, pending independent exact-head re-review. Fresh browser execution, physical devices, screen reader and authenticated persistence E2E remain gaps. Mathematical estimates/instants are synthetic, never real provider/traveller qualification.
- P3: 145 existing lint warnings. Full repository `npm test` and `auth:pruefen` were not run locally; read their fresh remote results in the final receipt rather than inheriting an earlier green run.

No UI expansion, new dependency, provider/timezone activation, DB/Supabase/schema/Auth/RLS change, graph/booking/readiness mutation, Official Truth/F8/#900 edit, global continuity edit or new cost. No replacement agent or follow-up slice. PR remains Draft; no Ready or merge.

The exported input/output contract, full-graph adapter, recomputation, original IDs and UI remain unchanged. Only the kernel's internal boundary/assignment representation and overlap existence check changed. This is the requested acceptance correction, not a new architecture or slice. [Full paths](evidence/trip-timeline-temporal-review-1/changed-files.txt); [correction paths](evidence/trip-timeline-temporal-review-1/estimate-range-correction/changed-files.txt).

STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW.
