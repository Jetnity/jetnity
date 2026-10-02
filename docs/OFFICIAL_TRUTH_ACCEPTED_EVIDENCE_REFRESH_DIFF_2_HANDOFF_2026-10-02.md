# Official Truth Accepted Evidence Refresh Diff Bridge 2 — Handoff

Date: 2 October 2026
Issue: #718
Draft PR: #721
Branch: `feat/official-truth-accepted-evidence-refresh-diff-2`
Baseline: `main@708a77defa5092e43d5dec991aa09a77e34822db`

Logical agent: **Jetnity Official Truth accepted Evidence refresh diff bridge 1**, Generation 2
Session: https://cursor.com/agents/bc-c3e95ea4-a1a2-4c0c-b7da-74217ca6c160
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure refresh comparison between one re-proven accepted Evidence version and one newly validated retrieval for the same official source and the same regulatory cell. It is a Draft. It is not Ready and not merged.

Generation 1 / Draft PR #719 is superseded. Do not review or reuse that head.

Read first:

1. `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_2_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_2_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_2_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-refresh-diff.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice. The status file on this branch still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` in this session resolved `origin/main` to `708a77defa5092e43d5dec991aa09a77e34822db`. That SHA is the task baseline.
- The runtime head `2996b7cd91e2ef0f7b4b9380a1962d26f168982a` was 0 behind and 4 ahead of that SHA. Re-fetch before treating any later SHA as current. The docs commit does not change runtime behaviour.
- Local gates in the report were run on `2996b7cd` before the docs commit.

## Trust rule for the next reader

Call `officialTruthAkzeptierteEvidenceAuffrischungVergleichen` with the original baseline envelope, the baseline clock, the bounded extraction, the refreshed envelope, and the refreshed clock. Do not pass an Evidence object, a version id, or a hash.

The baseline must come back as `accepted_evidence` from #716. The refreshed material must come back as `retrieved_material` from #709. The source id and the canonical rule-scope key must match. Only then does `evidenceVersionenVergleichen` decide whether the normalized source text changed.

`unchanged_source_content` means that text is unchanged and later analysis may skip this pair. It does not mean the legal rule is current, that entry is allowed, or that another page of the authority stayed the same. `ruleChange` stays `not_asserted`. `blocked` is a closed reason. It is not `not_required`.

One call is one canonical cell and one selected source. Another credential option is another request. Citizenship is not reduced to the issuing country. `requirementsProviderAus()` stays `null`.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No model call and no Rule Claim.
- No UI and no public route.
- No edit to #709, #713, #716, evidence, rule claims, the source registry or the source router.
- No follow-up slice. The engine still does not call this function. The store writer is not wired to it.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, fetch or model research adapter. No persistence slice. No Rule acceptance.

**STOP for independent Technical-Lead review of the exact branch tip.**
