# Lodging Interval Evaluation 1 — HANDOFF

Date: 23 October 2026
Writer: **Jetnity Lodging Interval Evaluation 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-6ae8a8df-dae6-402b-b8b8-b9dd21aff61a
Actual model: `grok-4.7-high-fast`. Not Auto.

## Where this stopped

Draft PR #984 / issue #981 / branch `perf/lodging-interval-evaluation-1`.
Immutable TASK blob `400724c3a82aedffb6b893bd96e3a91bc2c62dc7`.
Fresh main at handoff read: `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`. Merge-base is that SHA. No drift against the dispatched baseline. The PR comment has the exact head, tree, ahead/behind and CI/Preview links after this handoff commit. Do not treat `56348b52ac4b71c92a2bae7e44f8b67502459608` as the final head; that commit is the implementation parent.

## Next actor

Independent Technical Lead review of the exact final head. Integration order remains #983 → #984 → #985 when each head is actually ready. This writer does not synchronize those branches.

Immediate review fixes stay in this same session and on this same branch. Any new head needs a new exact-head gate.

## Do not do from this handoff

- Do not Ready. Do not merge. Do not start a follow-up slice.
- Do not reopen #955 or #973. Their budgets stay.
- Do not change `naechteHalboffen` into a capped or empty result.
- Do not install a duration limit to make long stays "safe".
- No hosted SQL, source admission, provider call, secret, personal browser, or Production action.

## Worth knowing before review

`unterkunftAbdeckung` is interval arithmetic. Public behaviour is pinned by the existing canonical test plus the new oracle. The high-value cases are first-interval ownership when the earlier date range is not first in the array, and gap names when one `stageId` has two names.

P0: none new. P1: #968 and #748 still open and outside this slice. P2: this defect awaits independent PASS; other source/hosting/privacy residuals are unchanged. P3: direct `naechteHalboffen` calls can still expand; the #955 comment that the reader enumerates is stale; #973 can still reject a long span before the reader runs.

Traveller context does not apply. The calculation does not read citizenship, residence or documents.

Suggested later slice, not started: once this head is accepted and integrated, revisit only the #973 admission estimate and the stale #955 comment, under a new task. The shared coverage contract stays frozen until then.
