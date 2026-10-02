# Official Truth Accepted Evidence → Rule Candidate Bridge 1 — Handoff

Date: 2 October 2026
Issue: #715
Draft PR: #717
Branch: `feat/official-truth-accepted-evidence-rule-candidate-bridge-1`
Baseline: `main@16f3a8d631bb823c9daafc724df67c000dcb5985`

Logical agent: **Jetnity Official Truth accepted Evidence rule candidate bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-2dc2eeae-983e-4e63-a2cc-0125b9b32fe4
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure bridge from already accepted official Evidence to one rule candidate. Technical-Lead R1 accepted `807fe1e6668618e9094046f58d341dc089cb5853` with no behavior change. Main is now integrated at `1e0706f530d34d65d2141b281976cda579f8b5f5` (#720, docs only) through merge `8595291d1c12b23eca3a5010ba2f2de71fa1062c`. That merge also contains #716 at `6b7f92be217bdc5b7463c7699fc2ac585a7a27cf`. The #716 files and the two #720 files match `origin/main`. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-rule-candidate.ts`

`docs/ACTIVE_WORK_STATUS.md` and `JETNITY_START_HERE.md` now match `origin/main` because the #720 merge brought them in. This writer did not edit those files. This handoff is the continuity pointer for the slice. The status file still describes an older writer plus the #720 tooling note. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- The task baseline remains `main@16f3a8d631bb823c9daafc724df67c000dcb5985`.
- The #716 re-gate fetched `origin/main` at `6b7f92be217bdc5b7463c7699fc2ac585a7a27cf`. Merge `28487fdbe5de49041d6260a624173c353f5aa726` was 0 behind that SHA.
- The docs-only re-gate fetched `origin/main` at `1e0706f530d34d65d2141b281976cda579f8b5f5`. Merge `8595291d1c12b23eca3a5010ba2f2de71fa1062c` was 0 behind that SHA. Re-fetch before treating any later SHA as current.
- Local gates for this re-gate were run on `8595291d`. The following docs commit does not change runtime behaviour, #716, or #720.
- The earlier gates on `8d09efd1` and `28487fdb` stay in the report. They are not the current head.

## Trust rule for the next reader

Call `officialTruthRegelKandidatAusEvidence` with the accepted Evidence array, the current Source Registry, and metadata that contains only `factKind`, `evidenceQuality` and `proposal`. Do not pass scope, key, support ids, lifecycle, validation state or `trustedRuleFact`. The function reads each version with `akzeptierteEvidenceLesen`, derives one rule cell with `regelScopeAusEvidenceScope`, and builds the candidate with `regelKandidatErstellen`.

A successful result is that constructor object. Its lifecycle is `candidate` and its validation state is `pending`. It is not an accepted Rule Claim. `research_gap` carries a null proposal. Stale, conflict and gap stay non-acceptable qualities. A composed candidate keeps the sorted support ids of distinct official sources. `requirementsProviderAus()` stays `null`.

One call is one canonical cell. Another credential option is another call. Citizenship is not reduced to the issuing country.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No model call and no Rule Claim acceptance.
- No UI and no public route.
- No edit to `evidence.ts`, `rule-claims.ts` or the source registry.
- No follow-up slice. The engine still does not call this function.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, fetch or model research adapter. No Rule acceptance slice and no persistence slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
