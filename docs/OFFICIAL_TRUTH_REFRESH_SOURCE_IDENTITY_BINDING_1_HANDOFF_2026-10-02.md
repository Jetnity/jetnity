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

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice. The status file on this branch still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` in this session resolved `origin/main` to `ca40e5b2e133c938070a8d13aafcdcb66fa608fd`. That SHA is Merge #755 and the task baseline.
- The runtime head `aaa297bfa83caeb1ef07057b0d73ccdf358ff219` was 0 behind and 2 ahead of that SHA. Re-fetch before treating any later SHA as current. The docs commit does not change runtime behaviour.
- Local gates in the report were run on `aaa297bf` before the docs commit.
- `lib/readiness/provider.ts`, `lib/readiness/source-registry.ts`, and `lib/readiness/official-truth-server-held-source-registry.ts` have no diff against that `main`.

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
