# Official Truth Retrieved Material → Candidate Evidence Bridge 1 — Binding Task

Date: 2 October 2026
Issue: #711
Baseline: `main@3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`
Logical agent: **Jetnity Official Truth retrieved material candidate evidence bridge 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Convert already validated #709 retrieved material into the existing canonical **candidate / pending EvidenceVersion**.

This slice performs no model call and no acceptance/write.

## Input

- original #709 retrieval envelope:
  - #702 request;
  - registry;
  - descriptors;
  - selected sourceId;
  - material;
- injected validation clock;
- bounded future extraction metadata object.

The bridge must call/reuse #709 again. Do not trust a caller-built receipt.

## Extraction metadata contract

Allow only:
- `validFrom`: null or existing valid value accepted by canonical Evidence constructor;
- `validUntil`: null or existing valid value accepted by canonical Evidence constructor;
- `extractionNote`: optional bounded string/null accepted by canonical Evidence constructor.

Reject all other keys.

In particular extraction metadata may not supply:
- scope / ruleScopeKey / requestKey;
- sourceId / sourceClass / authorityName / publisherName;
- canonicalUrl / retrievedAt / sourceSnapshot;
- sourceContentHash / contentHash / content;
- result / required / not_required / conditional;
- optionEligibility / optionMandate / visaMode;
- any traveller/personal identifiers.

Do not echo rejected values.

## Trusted scope construction

After #709 validates the retrieval:
- take the canonical request scope from the original #702 request;
- add only the validated #709 sourceId;
- build the exact Evidence scope expected by existing `evidenceKandidatAusModell`.

Do not infer citizenship from issuer/residence.
Do not rank/default passport or citizenship.
Destination/transit/residence/credential/validity remain request truth.

## Canonical candidate constructor

Call existing `evidenceKandidatAusModell` with:
- bridge-built trusted scope;
- validated #709 `EvidenceQuellenmaterial`;
- current registry;
- only the bounded extraction metadata.

Successful output must be:
- `lifecycle: candidate`;
- `validationState: pending`;
- source class `official_authority`;
- lookup/scope/provenance produced by existing canonical Evidence code.

Do not hand-construct `EvidenceVersion`.

## Output / non-output

Return candidate Evidence or a closed bridge error.

Do not:
- call `evidenceKandidatAkzeptieren`;
- call `regelKandidatAkzeptieren`;
- build a Rule Claim;
- persist anything;
- call trusted store/catalog RPC;
- call model/OpenAI/browser/network/provider;
- modify DB/Supabase/Auth/RLS.

Candidate Evidence is not Official Truth.

`requirementsProviderAus()` stays null.

## Tests

Synthetic `.example` only.

Prove:
1. valid #709 envelope + null validity => candidate/pending Evidence;
2. valid bounded extraction note/validity preserved through canonical constructor;
3. sourceId/scope are derived from trusted request+receipt, not model metadata;
4. extraction metadata containing scope/source/provenance/hash/decision fields fails;
5. personal/sensitive fields fail without echo;
6. tampered retrieval envelope fails because #709 is rerun;
7. candidate is not accepted and `akzeptierteEvidenceLesen` returns null;
8. no acceptance/store/RPC/model/network/DB path;
9. input not mutated;
10. existing Evidence constructor remains unmodified.

Run focused/full tests, typecheck, lint, build, hygiene, diff check.

## Ownership

Allowed:
- `lib/readiness/official-truth-retrieved-candidate-evidence.ts`
- `lib/readiness/official-truth-retrieved-candidate-evidence.test.ts`
- `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_CANDIDATE_EVIDENCE_BRIDGE_1_*`

Read-only:
- #702 request;
- #705/#708 routing/planning;
- #709 retrieved material;
- evidence.ts;
- source registry/router.

Forbidden:
- modifying any existing runtime;
- Lane A discovered-url files;
- rule claims/store/catalog;
- Supabase/migrations;
- app/components;
- package/lockfile;
- global continuity.

If existing contracts cannot support this bridge without modification, STOP and report.

Before final push integrate then-current main, remain 0 behind, rerun all gates.
Stay Draft. Do not Ready or merge. Do not start model execution or acceptance.
STOP for independent TL review.
