# Official Truth Research Execution Allowlist Plan 1 — Handoff

Date: 1 October 2026
Issue: #706
Draft PR: #708
Branch: `feat/official-truth-research-execution-allowlist-plan-1`
Baseline at dispatch: `main@e32c60e9f9d2bdc9db42c80eba6721e59e5120df`
Integrated main for R1: `main@0842f9854a1362e9fc71dfe22f0c49617c122e65`

Logical agent: **Jetnity Official Truth research execution allowlist plan 1**, Generation 1
Session: https://cursor.com/agents/bc-157efd04-cbc8-4fe1-8475-13d1efdb5edb
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure pre-fetch allowlist plan for an existing Official Truth research request. Technical-Lead R1 `5386675895` on `a390cd9f` required R1-F1. This tip fails the plan when a blocked hostname sits above or below a registered hostname, and it does not trim the row. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_RESEARCH_EXECUTION_ALLOWLIST_PLAN_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_RESEARCH_EXECUTION_ALLOWLIST_PLAN_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_RESEARCH_EXECUTION_ALLOWLIST_PLAN_1_SELF_REVIEW_2026-10-01.md`
4. `lib/readiness/official-truth-research-execution-plan.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` for R1 resolved `origin/main` to `0842f9854a1362e9fc71dfe22f0c49617c122e65` (#709). That merge is preserved unchanged.
- The R1 gate head `d2680c57a7e989122fbf3f5cdad31a43be304a6a` was 0 behind that pin. Re-fetch before treating any later SHA as current.
- The review head is the branch tip after the R1 docs commit. Local gates in the report were run on `d2680c57` before that docs commit. The docs commit does not change runtime behaviour.
- The earlier delivery head `a390cd9f` is the R1 review head, not the correction gate.

## Trust rule for the next reader

This function only names eligible official source IDs and the hostnames already stored on those registry rows. It does not fetch them, rank them, or turn a missing source into an entry effect. `no_eligible_official_source` means no registered `official_authority` covered that one cell. It does not mean the traveller is exempt.

`blocked_invalid` is not the same outcome. A tampered request, a tampered registry row, or a blocked hostname fails the plan. Do not rewrite that into "no source" and do not trim the allowlist down to the hostnames that still look safe.

A later research executor, if a versioned task creates one, must call this function for a #702 request. Calling `quellenRouten` directly would keep licensed providers that match the same coverage. Calling #705 alone would return source IDs without the hostname allowlist and without this registry re-check. This output has no URL. A registered hostname is that exact hostname. If a blocked hostname is nested under it, the plan is already `blocked_invalid`. Do not trim the row, and do not invent a wildcard, a path, or a query.

One call is one canonical cell. Another credential option is another request. Fact kind and research reason stay on the plan and do not select a source. `requirementsProviderAus()` stays `null`.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No research execution and no Candidate Evidence.
- No UI and no public route.
- No edit to #702, #705, the source router, the source registry, or evidence.
- No follow-up slice.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser or model research adapter. No follow-up slice.

**STOP for independent Technical-Lead R2 review of the exact branch tip.**
