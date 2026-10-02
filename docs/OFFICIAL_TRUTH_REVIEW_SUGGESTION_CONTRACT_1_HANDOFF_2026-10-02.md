# Official Truth Non-Authoritative Review Suggestion Contract 1 — Handoff

Date: 2 October 2026
Issue: #728
Draft PR: #730
Branch: `feat/official-truth-review-suggestion-contract-1`
Baseline: `main@5e291ed7c4814f034224eda46c3bd62cc9815ea3`

Logical agent: **Jetnity Official Truth non-authoritative review suggestion contract 1**, Generation 1
Session: https://cursor.com/agents/bc-bb1255f3-36c2-41b1-907b-b23ef08cbf04
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure validation contract for one reviewer suggestion bound to one re-proven #723/#726 review packet. Technical-Lead R1 `5390889237` required R1-F1 only: free-form `reviewNote` is removed. The suggestion is machine-readable. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONTRACT_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONTRACT_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONTRACT_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-review-suggestion.ts`

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task allowlist forbids global continuity. This handoff is the continuity pointer for the slice. The status file still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- The task baseline remains `main@5e291ed7c4814f034224eda46c3bd62cc9815ea3`.
- `git fetch origin main` before the R1 docs commit is recorded below. Re-fetch before treating any later SHA as current. The branch must stay 0 behind `5e291ed7`.
- R1 code head: `1a1eca4945f467c7a2a1c1f106d4b5ccc8ba083d`. It removes `reviewNote`. Local gates on that tree: focused tests 10/10, `npm test` 4391 pass / 0 fail across 757 suites, typecheck, lint, build, diff check, operating-mode guard and hygiene pass. Lint is 0 errors and 148 pre-existing warnings, none in the suggestion files. This docs commit does not change runtime behaviour.
- PostgreSQL 16.15 was installed in this VM for the existing throwaway proofs. The package cluster was not started. No remote database was contacted.

## Trust rule for the next reader

Call `officialTruthRegelReviewVorschlag` with:

- `packetInput`: `{ supports, metadata }`, the same original input #723 accepts;
- `suggestion`: `assessment`, `citedSupportVersionIds`, and `reasonCodes` only.

Do not pass a packet, a candidate, accepted Evidence, a receipt, a `reviewPacketKey`, a fingerprint, a support-id list beside `citedSupportVersionIds`, or a trusted rule fact.

The function re-runs `officialTruthRegelReviewPacket` and `officialTruthRegelReviewPacketFingerprint`. A blocked packet stays blocked and gets no suggestion. When both succeed and agree, the result is:

- `status: 'review_suggestion'`;
- `reviewPacketKey` from the re-run fingerprint;
- `ruleScopeKey` from that fingerprint;
- the assessment, unchanged;
- cited support version ids, sorted, each one a member of the re-proven packet;
- reason codes, sorted, each one from the task allowlist.

Any other suggestion field fails closed. That includes `reviewNote`, a null note, and any other free-text name. The text is not returned.

`supports_candidate` is still only a suggestion. It is not an accepted Rule Claim. `contradicts_candidate` does not reject a Rule Claim, because this function does not create one. `insufficient_evidence` and `needs_human_review` are review states only. Citation ids are references. They are not a source ranking. The suggestion cannot add, remove, or rewrite candidate or support content, because that content is not in the output.

`requirementsProviderAus()` stays `null`.

One call is one canonical cell and one registry image. Another credential option is another call and another key. Citizenship is not reduced to the issuing country.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No model call and no Rule Claim acceptance.
- No UI and no public route.
- No edit to the #723 packet, the #726 fingerprint, `digest.ts`, `evidence.ts`, `rule-claims.ts`, #709, #713, #716, #717, or the source registry.
- No follow-up slice. Nothing in the engine calls this function.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, fetch or model research adapter. No Rule acceptance slice and no model-review slice from this writer.

**STOP for Technical-Lead R2 of the exact branch tip.**
