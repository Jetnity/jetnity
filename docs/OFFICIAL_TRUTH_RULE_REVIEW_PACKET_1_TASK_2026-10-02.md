# Official Truth Rule Review Packet Contract 1 — Binding Task

Date: 2 October 2026
Issue: #722
Baseline: `main@708a77defa5092e43d5dec991aa09a77e34822db`
Logical agent: **Jetnity Official Truth rule review packet 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Build the pure internal review packet that sits **after** accepted Evidence + Rule Candidate construction and **before** any trusted Rule Fact / Rule acceptance.

This packet may later be consumed by a human reviewer or by a separately gated model-review step.

It must not mint truth.

## Input

Bounded list of support bundles, max `REGEL_SUPPORT_MAX`.

Each support bundle contains:
- original #709 retrieval envelope;
- injected validation clock;
- #713 extraction metadata.

Plus bounded Rule Candidate metadata accepted by #717:
- factKind;
- evidenceQuality;
- proposal.

Do not accept:
- caller-built accepted Evidence;
- caller-built Rule Candidate;
- caller-built Rule Claim;
- caller-built receipt;
- caller-supplied supportVersionIds;
- trustedRuleFact.

## Required flow

For every support bundle:

1. Re-run #716 `officialTruthAkzeptierteEvidenceAusAbruf`.
2. Require `accepted_evidence`.
3. Independently re-run #709 `officialTruthAbgerufenMaterialPruefen`.
4. Require same sourceId / ruleScopeKey / provenance as the accepted Evidence.
5. Require sourceClass `official_authority`.

After all supports:

6. Call #717 `officialTruthRegelKandidatAusEvidence` with only the re-proven accepted EvidenceVersions and bounded candidate metadata.
7. Require canonical candidate/pending Rule Candidate.
8. Require support ids in candidate equal the re-proven support versions exactly.
9. Require all support entries correspond to the same candidate rule scope.

## Output

A deterministic internal review packet:

- `status: 'rule_review_packet'`
- canonical `kandidat` from #717;
- sorted support entries by versionId, each with:
  - versionId;
  - sourceId;
  - canonicalUrl;
  - retrievedAt;
  - sourceContentHash;
  - sourceSnapshot.

No reviewer decision.
No trustedRuleFact.
No accepted Rule Claim.

The packet is internal review material, not public UI output.

## Truth boundaries

The packet must never claim:
- required/not_required/conditional beyond what is merely present inside the candidate proposal;
- that candidate proposal is true;
- that the support proves the proposal;
- that a Rule Claim is accepted.

The support snapshot is evidence material for review only.

## Privacy

Reject/propagate any personal/sensitive input failures.

The packet must contain no:
- user/account/trip/traveller ids;
- passport/document number;
- MRZ;
- scan/biometric/health/DOB;
- name/email/traveller notes.

Public authority page text in `sourceSnapshot` is allowed as review material.

## No acceptance / no execution

No:
- `regelKandidatAkzeptieren`;
- trustedRuleFact creation;
- trusted store/catalog RPC;
- DB/Supabase/Auth/RLS;
- fetch/browser/search/OpenAI/model/provider;
- source registration;
- UI/public API;
- Production mutation.

`requirementsProviderAus()` remains null.

## Tests

Synthetic `.example` only.

Prove at minimum:
1. one re-proven official support + explicit candidate => packet;
2. two re-proven distinct official supports + composed candidate => deterministic packet;
3. candidate/pending lifecycle retained;
4. support version ids exactly match candidate support ids;
5. support entry provenance matches #709/#716;
6. caller-built Evidence/Rule Candidate/receipt/trustedRuleFact not accepted;
7. candidate/unaccepted/licensed/tampered support fails through canonical bridges;
8. scope mismatch fails;
9. duplicate support fails;
10. research_gap candidate with null proposal may form packet but remains non-acceptable quality;
11. no Rule acceptance, store, DB, network/model path;
12. input not mutated.

Run focused/full tests, typecheck, lint, build, hygiene, git diff --check.

## Ownership

Allowed:
- `lib/readiness/official-truth-rule-review-packet.ts`
- `lib/readiness/official-truth-rule-review-packet.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_PACKET_1_*`

Read-only:
- #709 retrieved material;
- #713 candidate Evidence;
- #716 accepted Evidence;
- #717 Rule Candidate;
- evidence.ts;
- rule-claims.ts;
- source registry/router.

Forbidden:
- modifying existing runtime;
- #721 refresh-diff files;
- store/catalog;
- Supabase/migrations;
- app/components;
- package/lockfile;
- global continuity.

Before final push:
- fetch then-current main;
- integrate it;
- remain 0 behind;
- rerun all gates.

Stay Draft.
Do not Ready.
Do not merge.
Do not start Rule acceptance or model review.
STOP for independent TL review.
