# Official Truth Accepted Evidence Refresh Diff Bridge 1 — Binding Task

Date: 2 October 2026
Issue: #718
Baseline: `main@6b7f92be217bdc5b7463c7699fc2ac585a7a27cf`
Logical agent: **Jetnity Official Truth accepted Evidence refresh diff bridge 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Compare one existing accepted official EvidenceVersion with one newly validated #709 retrieval for the same source + regulatory cell.

This is a pure refresh optimization contract. It does not create or accept any new truth.

## Input

- one existing accepted EvidenceVersion;
- original #709 retrieval envelope;
- injected validation clock.

Do not accept:
- caller-built receipt;
- caller-built comparison result;
- candidate Evidence;
- Rule Candidate/Claim;
- arbitrary source hash.

## Required flow

1. Re-run #709 using the original retrieval envelope + injected clock.
2. Read the registry only from that validated envelope.
3. Require the existing Evidence to pass `akzeptierteEvidenceLesen(existing, registry)`.
4. Require `sourceClass === 'official_authority'`.
5. Require existing sourceId == validated retrieval sourceId.
6. Require `regelScopeAusEvidenceScope(existing.scope).key` == validated retrieval ruleScopeKey.
7. Compare hashes only through existing `evidenceVersionenVergleichen(existing, { sourceContentHash: receipt.sourceContentHash })`.
8. Return a deterministic refresh decision.

## Output semantics

Equivalent to:

- `unchanged_source_content`
  - existingVersionId
  - requestKey
  - ruleScopeKey
  - sourceId
  - contentChanged: false
  - laterAnalysisShortCircuit: true
  - ruleChange: 'not_asserted'

- `changed_source_content`
  - same identifiers
  - contentChanged: true
  - laterAnalysisShortCircuit: false
  - ruleChange: 'not_asserted'

- `blocked` with a closed reason.

Do not return:
- legal conclusion;
- requirement effect;
- `not_required`;
- Candidate Evidence;
- new versionId;
- new lookupKey;
- URL or snapshot content;
- provider ranking.

## Important truth rule

Equal content hash means only:
> same normalized source text

It does NOT mean:
- rule is current forever;
- rule is correct;
- no legal rule change outside the source;
- entry requirement is not required;
- prior accepted Rule Claim is automatically reaffirmed.

`ruleChange` must remain exactly `not_asserted`.

## Security / privacy

Reject/propagate fail-closed outcomes from #709.

Do not echo:
- source snapshot;
- URL credentials/tracking values;
- personal identifiers.

No user/account/trip/traveller/passport/MRZ/scan/biometric/health/DOB/name/email fields in output.

## No execution / no writes

No:
- fetch/browser/search/OpenAI/model/provider;
- Candidate Evidence constructor;
- Evidence acceptance;
- Rule Candidate/Claim;
- trusted store/catalog RPC;
- Supabase/DB/Auth/RLS;
- cron/queue;
- public API/UI.

`requirementsProviderAus()` remains null.

## Tests

Synthetic `.example` only.

Prove:
1. existing accepted Evidence + same new snapshot => unchanged / short-circuit true;
2. changed snapshot => changed / short-circuit false;
3. ruleChange stays `not_asserted` in both;
4. candidate/unaccepted existing Evidence fails;
5. licensed accepted Evidence fails;
6. different sourceId fails;
7. different rule scope fails;
8. tampered retrieval envelope fails via #709;
9. no URL/snapshot/private value in success/error output;
10. no `not_required`, rule acceptance, store, DB, model/network path;
11. input objects remain unchanged.

Run:
- focused tests;
- full npm test;
- typecheck;
- lint;
- build;
- hygiene checks;
- git diff --check.

## Ownership

Allowed:
- `lib/readiness/official-truth-refresh-diff.ts`
- `lib/readiness/official-truth-refresh-diff.test.ts`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_1_*`

Read-only:
- #709 retrieved material;
- evidence.ts;
- rule-claims.ts;
- source registry/router.

Forbidden:
- modifying existing runtime;
- #717 Rule Candidate files;
- #716 acceptance files;
- store/catalog;
- Supabase/migrations;
- app/components;
- package/lockfile;
- global continuity.

Before final push integrate then-current main, remain 0 behind, rerun all gates.

Stay Draft.
Do not Ready.
Do not merge.
Do not start fetch/model execution or persistence.
STOP for independent TL review.
