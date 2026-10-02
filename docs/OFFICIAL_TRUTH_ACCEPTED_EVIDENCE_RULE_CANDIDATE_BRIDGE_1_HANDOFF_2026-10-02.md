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

The branch adds a pure bridge from already accepted official Evidence to one rule candidate. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-rule-candidate.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice. The status file on this branch still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` in this session resolved `origin/main` to `16f3a8d631bb823c9daafc724df67c000dcb5985`. That SHA is the task baseline.
- The runtime head `8d09efd1d054cbd549f2e7339896a4a2ec37b5e4` was 0 behind and 2 ahead of that SHA. Re-fetch before treating any later SHA as current. The docs commit does not change runtime behaviour.
- Local gates in the report were run on `8d09efd1` before the docs commit.

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
