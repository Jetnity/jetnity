# Official Truth Rule Review Decision Intent Contract 1 — Handoff

Date: 2 October 2026
Issue: #733
Draft PR: #734
Branch: `feat/official-truth-rule-review-decision-intent-contract-1`
Baseline: `main@45a4592de638b0cb73f177e255a82dd55bb512ad`

Logical agent: **Jetnity Official Truth Rule review decision intent contract 1**, Generation 1
Session: https://cursor.com/agents/bc-02e0c991-cb8c-4fbe-96b4-3f603671ce7a
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure decision-intent contract for one re-proven #723/#726 Rule Review Packet. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_RULE_REVIEW_DECISION_INTENT_CONTRACT_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_RULE_REVIEW_DECISION_INTENT_CONTRACT_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_RULE_REVIEW_DECISION_INTENT_CONTRACT_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-rule-review-decision-intent.ts`

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task allowlist forbids global continuity. This handoff is the continuity pointer for the slice. The status file still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- The task baseline remains `main@45a4592de638b0cb73f177e255a82dd55bb512ad`.
- `git fetch origin main` before the docs commit resolved `origin/main` to that same SHA. The branch was 0 behind. Re-fetch before treating a later SHA as current.
- Local gates were run on `a7667ad8660f1f9fd3da5f3a8c8aeb13e880408c`. This docs commit does not change runtime behaviour. The review head is the branch tip after this commit.
- PostgreSQL 16.15 was installed in this VM for the existing throwaway proofs. The package cluster was not started. No remote database was contacted.

## Trust rule for the next reader

Call `officialTruthRegelReviewEntscheidungsabsicht` with `{ packetInput, reviewPacketKey, decision }`.

`packetInput` is the original `{ supports, metadata }` object. Do not pass a built packet, a fingerprint result, a candidate, a suggestion, a trusted fact, or an authority field.

The function re-runs the packet and the fingerprint. The caller key must equal the new key. `factKind` comes from the re-proven candidate. The success status is `rule_review_decision_intent`.

That object is an intent for the current call. It does not store a decision and it does not authorize a later request. `proceed_to_trusted_fact_entry` is not fact entry. `research_gap`, `stale_primary_evidence`, and `unresolved_conflict` cannot take that state.

`requirementsProviderAus()` stays `null`. One call is one cell. Another credential option is another key.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No model call and no Rule Claim acceptance.
- No UI and no public route.
- No edit to #723, #726, #730, `rule-claims.ts`, or the store.
- No follow-up slice. Nothing in the engine calls this function except its test.

## Exact next step

Independent main-chat Technical-Lead review of the exact pushed branch tip. Cursor does not Ready or merge and does not start a follow-up slice. GitHub exact-head CI, the Auth job, and Vercel Preview are that review's gates. If the review returns CHANGES REQUIRED, stay in this same logical agent and change only the requested findings. A new head invalidates older gates.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, fetch, or model call. No authenticated review endpoint and no acceptance slice.

**STOP for independent Technical-Lead exact-head review.**
