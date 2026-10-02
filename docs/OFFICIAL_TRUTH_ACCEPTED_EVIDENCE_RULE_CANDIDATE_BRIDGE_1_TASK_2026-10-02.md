# Official Truth Accepted Evidence → Rule Candidate Bridge 1 — Binding Task

Date: 2 October 2026
Issue: #715
Baseline: `main@16f3a8d631bb823c9daafc724df67c000dcb5985`
Logical agent: **Jetnity Official Truth accepted Evidence rule candidate bridge 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Build a canonical `RegelKandidat` from already accepted official Evidence and bounded extraction proposal metadata.

This slice must not accept the Rule Claim.

## Input

- array of already accepted EvidenceVersion objects;
- current Source Registry;
- bounded proposal metadata:
  - `factKind`;
  - `evidenceQuality`;
  - `proposal`.

Do not accept caller-supplied:
- scope;
- key;
- supportVersionIds;
- lifecycle;
- validationState;
- trustedRuleFact.

## Evidence trust

Every support must:
- pass existing `akzeptierteEvidenceLesen`;
- be `official_authority`;
- map through `regelScopeAusEvidenceScope` to the same rule key.

Support IDs are derived only from the accepted versions and sorted canonically.

Reject duplicates.

For `composed_from_multiple_primary_sources`, require the existing canonical constructor to enforce minimum support; additionally ensure distinct official sourceIds are preserved for later acceptance review.

## Proposal

Call existing `regelKandidatErstellen`.

Do not hand-build `RegelKandidat`.

The proposal remains research output only.
- `research_gap` must have null proposal;
- stale/conflict/gap candidates remain non-acceptable quality;
- no automatic upgrade to explicit/composed;
- no `not_required` from missing/gap.

## Success

Only:
- lifecycle `candidate`;
- validationState `pending`;
- scope/key from accepted Evidence;
- supportVersionIds from accepted Evidence;
- proposal parsed by canonical constructor.

No accepted Rule Claim.

## Non-scope

No:
- `regelKandidatAkzeptieren`;
- trustedRuleFact;
- Evidence acceptance;
- store/catalog RPC;
- DB/Supabase/Auth/RLS;
- browser/OpenAI/model/network/provider;
- UI/API;
- Production mutation.

`requirementsProviderAus()` remains null.

## Privacy

Reject representative personal/sensitive fields in metadata without echo.

## Tests

Synthetic `.example` only.

Prove:
1. one accepted official Evidence + explicit proposal -> candidate/pending Rule Candidate;
2. two accepted official sources + composed proposal -> candidate with sorted support IDs;
3. candidate/unaccepted Evidence fails;
4. licensed Evidence fails;
5. scope mismatch fails;
6. duplicate support fails;
7. caller scope/key/support/lifecycle/trustedRuleFact fields fail;
8. research_gap + non-null proposal fails;
9. stale/conflict/gap remain candidate but never accepted here;
10. no `regelKandidatAkzeptieren`, store, DB, network/model path;
11. input not mutated.

Run focused/full tests, typecheck, lint, build, hygiene, diff check.

## Ownership

Allowed:
- `lib/readiness/official-truth-rule-candidate.ts`
- `lib/readiness/official-truth-rule-candidate.test.ts`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_RULE_CANDIDATE_BRIDGE_1_*`

Read-only:
- evidence.ts;
- rule-claims.ts;
- source registry.

Forbidden:
- modifying existing runtime;
- Lane A Evidence acceptance files;
- store/catalog;
- Supabase/migrations;
- app/components;
- package/lock;
- global continuity.

If the existing canonical constructor cannot support this without edits, STOP and report.

Before final push integrate then-current main, remain 0 behind, rerun all gates.
Stay Draft. Do not Ready or merge. Do not start Rule acceptance or persistence.
STOP for independent TL review.
