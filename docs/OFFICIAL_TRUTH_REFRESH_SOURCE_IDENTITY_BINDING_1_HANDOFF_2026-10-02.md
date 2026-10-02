# Official Truth Refresh Source Identity Binding 1 — Handoff

Date: 2 October 2026
Issue: #756
Draft PR: #757
Branch: `fix/official-truth-refresh-source-identity-1`
Baseline: `main@ca40e5b2e133c938070a8d13aafcdcb66fa608fd`

Logical agent: **Jetnity Official Truth refresh source identity binding 1**, Generation 1
Session: https://cursor.com/agents/bc-4e3ac1cb-29d5-4121-b785-3492f94adfe2
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch tightens the pure refresh comparison so the same source id, rule scope, and content hash cannot pass when the canonical official page or the semantic registry identity differs. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-refresh-diff.ts`

`docs/ACTIVE_WORK_STATUS.md` is outside the task allowlist. The merge took the #754 text from `main` unchanged. This slice did not edit it. Do not treat that status file as this writer. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- Task baseline remains `main@ca40e5b2e133c938070a8d13aafcdcb66fa608fd` (Merge #755). The accepted refresh runtime is `aaa297bfa83caeb1ef07057b0d73ccdf358ff219`.
- Final integration: `git fetch origin main` resolved `origin/main` to `7df2c9dc7c6679db74bb1476bc07366737f2c2b3` (Merge #754). Integration commit `0cb661586700e332313e7de6be4167276c9a985e` was 0 behind and 4 ahead. Re-fetch before treating a later SHA as current.
- The two refresh files have an empty diff against `aaa297bf`. The #754 Guardian current-state files have an empty diff against `origin/main`.
- The final gates in the report were rerun on `0cb66158` before this integration note. The docs commit does not change runtime behaviour.
- `lib/readiness/provider.ts`, `lib/readiness/source-registry.ts`, and `lib/readiness/official-truth-server-held-source-registry.ts` have no diff against `origin/main`.

## Trust rule for the next reader

Call `officialTruthAkzeptierteEvidenceAuffrischungVergleichen` with the original baseline envelope, the baseline clock, the bounded extraction, the refreshed envelope, and the refreshed clock. Do not pass an Evidence object, a version id, or a hash.

The baseline must come back as `accepted_evidence` from #716. The refreshed material must come back as `retrieved_material` from #709. The source id, the canonical rule-scope key, the already normalized canonical URL, and the semantic registry identity must match. Only then does `evidenceVersionenVergleichen` decide whether the normalized source text changed.

`different_official_page` means the normalized pages differ. `different_source_registry` means the stored registry identity differs, including an extra field or a reordered domain, source, or blocked-domain list that did not come from a fresh builder call. A registry mutation that makes the refreshed envelope invalid keeps the earlier #709 or router reason.

`unchanged_source_content` means that text is unchanged on that same page and that same registry identity, and later analysis may skip this pair. It does not mean the legal rule is current, that entry is allowed, or that another page of the authority stayed the same. `ruleChange` stays `not_asserted`. `blocked` is a closed reason. It is not `not_required`.

One call is one canonical cell and one selected source. Another credential option is another request. Citizenship is not reduced to the issuing country. `requirementsProviderAus()` stays `null`.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No model call and no Rule Claim.
- No UI and no public route.
- No edit to the #755 server boundary, the source registry, or the source router.
- No F2, F4, F5, F6, F7, F8, or F9 fix. No #741 implementation.
- No follow-up slice. A later live or autonomous refresh must combine the #755 server-held registry boundary with this tightened contract. This handoff does not start that slice.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, fetch or model research adapter. No persistence slice. No Rule acceptance.

**STOP for independent Technical-Lead review of the exact branch tip.**
