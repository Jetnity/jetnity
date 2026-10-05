# Official Truth Research Request Source-Routing Bridge 1 — Handoff

Date: 1 October 2026
Issue: #704
Draft PR: #705
Branch: `feat/official-truth-research-source-routing-bridge-1`
Baseline: `main@0e62a532831e0711aad3bde645b239edea674705`

Logical agent: **Jetnity Official Truth research source-routing bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-7874834e-9d85-4110-8e95-f4c444a7845f
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure source-routing bridge for an existing Official Truth research request. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_RESEARCH_SOURCE_ROUTING_BRIDGE_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_RESEARCH_SOURCE_ROUTING_BRIDGE_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_RESEARCH_SOURCE_ROUTING_BRIDGE_1_SELF_REVIEW_2026-10-01.md`
4. `lib/readiness/official-truth-research-source-routing.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` in this session moved the local `origin/main` pin from the stale snapshot `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8` to `0e62a532831e0711aad3bde645b239edea674705`.
- A later fetch, after the local gates, still showed that SHA. Merge-base is that SHA. The implementation head `c53bfcfc` was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.
- The review head is the branch tip after the lane-docs commit. Local gates in the report were run on `c53bfcfc` before that docs commit. The docs commit does not change runtime behaviour.

## Trust rule for the next reader

This function only names eligible official source IDs. It does not fetch them, rank them, or turn a missing source into an entry effect. `no_eligible_official_source` means no registered `official_authority` covered that one cell. It does not mean the traveller is exempt.

A later research executor, if a versioned task creates one, must call this function for a #702 request. Calling `quellenRouten` directly would keep licensed providers that match the same coverage. This output has no URL. Do not invent a fetch list from a source ID.

One call is one canonical cell. Another credential option is another request. Fact kind and research reason stay on the decision and do not select a source. `requirementsProviderAus()` stays `null`.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No research execution and no Candidate Evidence.
- No UI and no public route.
- No edit to #702, the source router, the source registry or evidence.
- No follow-up slice.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser or model research adapter. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
