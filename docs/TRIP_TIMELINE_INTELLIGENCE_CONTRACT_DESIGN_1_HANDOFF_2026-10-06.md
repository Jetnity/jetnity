# Trip Timeline Intelligence contract design 1 — Handoff

6 October 2026 · Issue #885 · Draft PR #889

**TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_READY** — design ready for independent exact-head review only. Keep Draft; do not mark Ready, merge or start runtime.

## Identity and evidence boundary

| Field | Binding value |
| --- | --- |
| Branch | `docs/trip-timeline-intelligence-contract-design-1` |
| Reconstruction main / source baseline | `fc2734ca60ae3c578fbcd414055fe983773d74d2` |
| TASK-seed head | `0c4b3f984cbd32f1f0fe3c96035c46f6f6281827` |
| TASK path | `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_TASK_2026-10-06.md` |
| Immutable TASK blob | `f10ba41bcb0847737e8100c9655e87f81297da0e` |
| Initial merge-base / ahead / behind | Baseline above / 1 / 0 |
| Final exact head | The pushed commit containing these four documents; use current PR #889 `head.sha` and compare to the post-push STOP receipt. No self-referential hash is fabricated inside this commit. |
| Expected one-commit delivery if main unchanged | 2 ahead / 0 behind; must be verified live, not assumed |
| Logical writer / generation | Trip Timeline Intelligence contract design 1 / 1 |
| Session / model evidence | `01a1124c-460a-7fd0-b5b4-bb2dbd7caa95`; persisted `turn_context`: `gpt-6-astra`, `xhigh` |
| Mode at reconstruction | `NORMAL`; live #751 authorizes Codex lane, commit/push/STOP |

## Read these four deliverables

1. [Design](TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_2026-10-06.md): normative future decisions, source limits, adversarial matrix, Core gate and three later slices.
2. [Report](TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_REPORT_2026-10-06.md): live reconstruction, source blobs, current versus historical audit findings, changed files and risks.
3. This handoff: review and post-Core dispatch checklist.
4. [Self-review](TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_SELF_REVIEW_2026-10-06.md): TASK coverage, adversarial reasoning and actual validation limits.

Four files were created by this writer. The full PR adds five paths including the immutable TASK that existed before execution. No runtime, tests, configuration, package, migration, existing evidence, global continuity, PR Ready-state or provider activation change belongs to this delivery.

## Review decisions that must not get softened

- Source classes survive derivation: stored user, canonical Trip/Route, verified external, code policy, estimate, unknown and suggestion. A canonical reader does not promote a user-supplied time into external fact.
- Civil clocks and chronological presentation are not instants. Proven overlap requires qualified elapsed-time comparison; civil-only potential overlaps stay possible. Date-Line local reversal is preserved without inventing an offset or duration.
- A missing end, timezone or venue cannot be replaced by midnight, the next item, stage centroid, destination name, device clock or UI position.
- Hotel/rental spans are availability; they do not occupy the traveller continuously. Current schema supports plan-level overlap, not an invented participant conflict.
- `no_proven_conflict` is scoped to assessed intervals. Coverage remains partial if other items could not be assessed. Estimates cannot generate safe/free/confirmed states.
- “Transfer fehlt im Plan” needs a proven directed need, complete inventory and no unresolved covering candidate. Surface evidence proves need, not a booked/planned transfer. City coverage never proves airport access.
- Numeric buffers need immutable policy/source/version and exact applicability. No default airport/station margin or travel time is approved. Unknown is not 0.
- Schedule gaps use occupied union. Travel and buffers are subtracted once with inclusion/placement proof. A residual budget is not necessarily a continuous free window.
- “Als Nächstes” needs explicit trustworthy current time and a future-order proof across the declared scope. Ties and uncertain order remain groups; device timezone never becomes destination timezone.
- Results/actions expire on graph, itinerary, evidence, policy, zone or clock changes. Late results cannot publish against a newer snapshot. No automatic write, reorder or search follows a finding.
- Smartphone grouping reduces repetition while preserving every result/member, missing-fact explanation, existing Attention priority and contextual navigation.

## Exact-head review procedure

Re-read live remote main, mode, #751, issue #885, PR #889 including current head/Draft state and any new comments/reviews. Re-fetch the branch. Compare exact head to the STOP receipt, then:

```sh
git rev-parse HEAD origin/main origin/docs/trip-timeline-intelligence-contract-design-1
git merge-base origin/main HEAD
git rev-list --left-right --count origin/main...HEAD
git diff --name-status origin/main...HEAD
git diff --name-status 0c4b3f984cbd32f1f0fe3c96035c46f6f6281827 HEAD
git rev-parse HEAD:docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_TASK_2026-10-06.md
git diff --check 0c4b3f984cbd32f1f0fe3c96035c46f6f6281827 HEAD
```

The left/right count command prints **behind then ahead**. Expected seed→delivery delta is the four documents above, all additions. Full PR includes the TASK seed only in addition. Any other path or different TASK blob is CHANGES REQUIRED. A moving main does not silently invalidate the design's declared source baseline, but the Technical Lead must review drift and decide synchronization/re-gating; any new head invalidates older exact-head evidence.

No application tests/build/UI/device acceptance was run for this design. Review remote CI/Preview for the **delivered head** if required by integration governance, never inherit seed or unrelated runtime evidence. Vercel Ready is deployment status, not permission to mark this Draft ready. Supabase/DB/Production remain unqueried and untouched.

## Mandatory reconciliation after actual #888 merge

This is a blocking checklist for runtime dispatch, not a task to execute automatically after this handoff:

1. Record #888's accepted head, merge commit and resulting live main; verify it is merged. Re-read the accepted Core task/report and actual code/tests. Unpublished branch results are insufficient.
2. Map every conceptual input and output in design §3 to the actual Core symbol/type or explicitly unsupported field. Include full-graph coverage, ID continuity, selected-day behavior and no-day items.
3. Verify local-time/flexible/daypart definitions, tie sort, optional dates/ends, malformed values and protected date mismatch. Core display order must not become physical time evidence.
4. Rebind flight summary versus canonical segment boundaries and segment-reference invalidation; prove Date-Line/cross-midnight cases and no double-counted flight occupancy.
5. Identify actual update hooks for manual changes, itinerary changes, stage/order changes, Guest/Account refresh and writes without revision increments. Pin fingerprint dependencies and stale-result rejection tests.
6. Bind navigation to existing authorized item/day/route/connection paths; record unavailable editors/capabilities, contextual Back and focus restoration. Do not invent a timezone editor or linked-transfer persistence.
7. Reconcile Attention/Readiness adapter semantics and the independently accepted #890 design. Document duplicate-signal ownership, global priority and coverage truth. #891 remains disjoint and confers no Official Truth authority.
8. Record the mapping, incompatibilities, gated facts/policy sources, acceptance fixtures and bounded runtime allowlist in the new task. Any semantic mismatch that could create false certainty must be resolved or explicitly left unsupported before dispatch.

## Open risks / later work

| Risk or dependency | Safe present decision / owner |
| --- | --- |
| Core not merged at reconstruction | No binding to guessed exports; TL reconciles against merged SHA. |
| Missing timezones, clock qualification, precise locations and operational sources | Positive claims remain closed; any source/persistence expansion requires a separate authorization. |
| Legacy Mobility/activity meanings could leak into new outcomes | Future adapter rejects weak proof; explicit cross-domain regression before enabling consumer. |
| No numeric buffer or clock-age policy approved | Empty policy input / fallback; later reviewed task owns exact values and versions. |
| Real cross-device focus, grouping and navigation not tested here | Runtime acceptance must include actual flows, narrow screens, text scaling and disclosed physical/Account limits. |

Smallest suggested sequence after reconciliation (not dispatched):

1. Evidence/interval/four-state overlap projection and deterministic invalidation.
2. Directed transfer proof, qualified policy comparisons and schedule-gap/usable-window semantics.
3. Clock-qualified next item, safe actions and cross-device Attention integration.

Exact first outstanding action: independent ChatGPT / Technical Lead reviews the pushed **current head of PR #889** against the immutable TASK and these contracts. The author stops here. **STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
