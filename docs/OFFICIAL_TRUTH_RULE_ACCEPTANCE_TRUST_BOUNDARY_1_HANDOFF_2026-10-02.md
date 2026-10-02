# Official Truth Rule Acceptance Trust Boundary Architecture 1 — Handoff

Date: 2 October 2026
Issue: #729
Draft PR: #731
Branch: `docs/official-truth-rule-acceptance-trust-boundary-1`
Baseline: `main@5e291ed7c4814f034224eda46c3bd62cc9815ea3`

Logical agent: **Jetnity Official Truth Rule acceptance trust boundary architecture 1**, Generation 1
Session: https://cursor.com/agents/bc-3c2a0ed3-71de-4424-a8a5-f0570830c839
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch defines the authority boundary before `regelKandidatAkzeptieren`. Technical-Lead R1 `5390891105` on `864d958ddf16aedff485b810468b6006bccd2dfa` required a wording correction. That head is not the review head. The correction keeps model/plugin output from minting Official Truth, keeps human/operator review as the only current V1 path, and leaves a future deterministic non-model policy unauthorized. It is docs only. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_REPORT_2026-10-02.md`
4. `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_SELF_REVIEW_2026-10-02.md`

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task forbids global continuity edits. This handoff is the continuity pointer for the slice. The status file still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- The task baseline remains `main@5e291ed7c4814f034224eda46c3bd62cc9815ea3`.
- `git fetch origin main` at the start of this session resolved `origin/main` to that same SHA. The branch was 0 behind and 1 ahead, which was the task seed `b0e8f21bd0412ef14a9339b27fe0351e3bb45b3b`. Re-fetch before treating any later SHA as current.
- Local gates on the first delivery were run on `22b1f7a63b858e98bc794d9c18ebe6ba1ee61cc0`. `npm test` was 4381 pass / 0 fail across 756 suites. Typecheck, lint (0 errors, 148 pre-existing warnings), the production build, the operating-mode guard and the hygiene checks passed. Schema reference still lists the three known LOCAL/UNAPPLIED RPCs. Those results belong to the pre-R1 tree. R1 changes the architecture wording. Its gates are recorded after they run on the R1 tree. PostgreSQL 16.15 was installed locally for the existing throwaway proofs. The package cluster was not started. No remote database was contacted.

## Trust rule for the next reader

Permanent invariant: model or plugin output alone may suggest, extract, compare or flag, and it never becomes `trustedRuleFact` or Official Truth.

Current V1 path: until a separate policy is designed, reviewed and authorized, `trustedRuleFact` enters only through the server-verified human/operator boundary. A future deterministic, non-model, fail-closed policy for a narrowly provable case is not designed here and is not authorized here. It would still have to re-prove the #726 key, refuse model proposal text as fact, and use predicates stricter than “model agrees”.

A future decision binds to one exact #726 `reviewPacketKey`. The server recomputes that key from the original `{ supports, metadata }` input by re-running the #723 packet and the #726 fingerprint. A stale or different packet invalidates the decision.

The reviewer comes from `auth.getUser()`, the role row, the server capability check and `currentLevel === 'aal2'`. A request-body reviewer, role or AAL is not authority. Break-glass cannot open fact entry. No shared operator token belongs in browser storage.

Decision states on the V1 path are only `needs_more_evidence`, `reject_candidate` and `proceed_to_trusted_fact_entry`. The trusted fact on that path is a separate explicit human entry. Section 10 of the architecture is that V1 sequence, not the only conceivable permanent authority mechanism. `regelKandidatAkzeptieren` stays the only canonical Rule acceptance function. The dormant store writer is a later separate step. Audit retention is not chosen. #626 stays blocked and is not this audit. #728 and #730-style suggestions stay advisory.

`research_gap`, `stale_primary_evidence` and `unresolved_conflict` cannot become accepted truth. One packet is one regulatory cell. A second credential option is a second decision.

No capability was selected. Adding one, or remapping `CAPABILITY_MINIMUM`, is a later special gate.

## What this slice did not do

- No runtime, API route, Auth, RLS, migration or database apply.
- No acceptance call and no trusted-fact generator.
- No model, provider, secret, Production or indexing change.
- No edit to global continuity files.
- No follow-up implementation slice and no automated acceptance slice.
- No capability selected.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No acceptance endpoint. No model call. No implementation of the sequence in architecture section 10.

**STOP for Technical-Lead R2 of the exact branch tip.**
