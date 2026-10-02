# Official Truth Discovered URL Candidate Validator 1 — Handoff

Date: 2 October 2026
Issue: #710
Draft PR: #712
Branch: `feat/official-truth-discovered-url-candidate-validator-1`
Baseline: `main@3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`

Logical agent: **Jetnity Official Truth discovered URL candidate validator 1**, Generation 1
Session: https://cursor.com/agents/bc-692c8c38-0c4e-492a-9036-20995a39e70e
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch validates proposed official URL pairs for one existing research request. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_DISCOVERED_URL_CANDIDATE_VALIDATOR_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_DISCOVERED_URL_CANDIDATE_VALIDATOR_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_DISCOVERED_URL_CANDIDATE_VALIDATOR_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-discovered-url-candidates.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` resolved `origin/main` to `3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`. That is the task baseline and the merge of #708. It is preserved unchanged.
- The implementation head `f9fac315719817a502f1e576ed5c098ab42fe1ea` was 0 behind that pin when the gates in the report ran. Re-fetch before treating any later SHA as current.
- The review head is the branch tip after the documentation commit. The runtime diff is the implementation head. The documentation commit does not change runtime behaviour.

## Trust rule for the next reader

Call `officialTruthEntdeckteUrlKandidatenPruefen` with the #702 request, the current registry, the current descriptors, and the proposed pairs. Do not pass a pre-built #708 plan. The function runs `officialTruthRechercheAusfuehrungsplan` itself.

`validated_url_candidates` means those pairs survived that plan, the registry URL check, the hostname allowlist, and the tracking check. It does not mean the page was fetched, read, or accepted as evidence. A canonical URL is not Official Truth and not Candidate Evidence.

`no_eligible_official_source` means #708 found no official authority for that one cell. It does not mean the traveller is exempt. `blocked` with `invalid_request`, `scope_mismatch`, or `invalid_source_plan` means the plan itself failed. Do not rewrite that into an empty success.

A tracking URL is rejected whole. Do not remove `utm_*` or the named click ids and then accept the remainder. `lang` and `ref` are the functional names this slice keeps.

One call is one canonical cell. Another credential option is another request. A validated Swiss-authority URL does not transfer to a Serbian passport cell. `requirementsProviderAus()` stays `null`.

A hostname on the #708 list covers that exact host and a subdomain of it, which is the existing registry rule. It does not cover a sibling registrable name, a path allowlist, or a second source. `domain_not_allowlisted` is the closed failure when the resolved host falls outside that source's plan list.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No discovery, no fetch, and no Candidate Evidence.
- No UI and no public route.
- No edit to #702, #705, #708, the source router, the source registry, or the retrieved-material receipt.
- No follow-up slice.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, search, or model adapter. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
