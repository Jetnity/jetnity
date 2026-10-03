# Official Truth GOV.UK ETA Deterministic Source-Family Audit — Task

Date: 3 October 2026
Issue: #790
Branch: `docs/official-truth-govuk-eta-source-family-audit`
Baseline: `main@32a0d6d85bc9f5591eeebb50a27ae71fac44b73f`
Logical agent: **Jetnity Official Truth GOV.UK ETA source-family audit**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## Purpose

Docs-only audit. Decide whether GOV.UK's current ETA National List can now become Jetnity's first real deterministic source family after decoded regulatory scope (#787) made travelDate available.

Do not implement or register an extractor.

## Binding architecture reads

Read live main first, then:
- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_REPORT_2026-10-03.md`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/rule-claims.ts`
- `types/trips.ts`

## Official primary sources only

At minimum inspect current:
1. `https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list`
2. `https://www.gov.uk/api/content/guidance/immigration-rules/immigration-rules-appendix-eta-national-list`
3. `https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation`

Do not use blogs, providers or model summaries as evidence.

## Candidate fact under test

`requirementType: 'electronic_travel_authorization'`

Potential fact:
```
{
  kind: 'requirement_effect',
  effect: 'required',
  visaMode: null
}
```

Do not assume this fact is valid.

## Hard questions

Prove or reject all of these:

1. Switzerland is positively and explicitly included in the current ETA National List.
2. The applicable travel-date threshold for Switzerland is explicit and can be evaluated only from canonical decoded `scope.validity.travelDate`.
3. The current response used for extraction is <= 65,536 bytes and valid UTF-8.
4. The exact nationality/date structure is deterministic enough for a versioned source-specific parser to fail closed on drift.
5. Citizenship must be matched from decoded `scope.citizenship`, never issuingCountryCode.
6. If the cell has multiple citizenships, no nationality may be silently chosen; define exact safe behavior.
7. If a credential is linked to a citizenship via `relatedCitizenshipCountryCode`, use that only when explicitly present; do not infer the relationship.
8. Determine whether `credentialOption.documentType='passport'` is sufficient for the GOV.UK ETA rule or whether passport-class qualifiers create a gap.
9. Critically inspect all current ETA exemptions/conditions in Appendix Electronic Travel Authorisation, including at minimum:
   - valid entry clearance or permission to enter/stay;
   - lawful residence in Ireland / Common Travel Area travel condition;
   - any other current exemption relevant to a Swiss national.
10. For every exemption, identify whether the current decoded `RegelScope` can represent and prove its non-applicability.
11. If even one legally relevant exemption cannot be represented/proven, the unconditional `required` fact is not complete.
12. Do not use `conditional` merely as a bucket unless the complete condition semantics are representable by the current `RegelFakt` model.
13. Do not compose the National List and ETA Appendix into one trusted fact unless the current runtime's single-source `explicit_primary_statement` path can legitimately treat them as one source family/representation without invoking the still-blocked multi-source composition policy.
14. Distinguish “same publisher” from “same source representation.” Two GOV.UK pages are still two supports unless one official API response contains all necessary semantics.
15. JSON that merely wraps HTML is not automatically structured enough. Pin exact fields/HTML structure and explain drift guards.

## Selection result

Output exactly one:
- `SELECTED_FOR_FIRST_EXTRACTOR`
- `NO_SOURCE_FAMILY_PROVEN_YET`

If selected, specify:
- source family id proposal;
- sourceId proposal;
- extractor id/version;
- schema family;
- exact canonical URL allowlist;
- MIME type;
- response byte count;
- exact fact;
- exact decoded-scope predicates;
- exact source structure and drift guards;
- exact exemption handling proving the fact is complete.

If not selected, identify the smallest concrete missing runtime/schema capability. Do not fix it in this slice.

## CH continuity

CH-01..CH-10 remain `RESEARCH_ONLY` / `NOT_APPROVED_FOR_DATABASE_IMPORT`.
No import, promotion or CH-11.

## Forbidden

No runtime, no extractor registration, no BODY_MAX change, no DB/migration/apply, no route/UI, no provider/model integration, no acceptance/store/provenance persistence, no F8.

## Files

Create exactly:
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_SELF_REVIEW_2026-10-03.md`

Do not edit the task seed or global continuity docs.

## Validation / STOP

- all final URLs current, official, tracking-clean;
- record UTC check window, effective URL, MIME and raw bytes;
- distinguish direct research fetch from production retrieval;
- `git diff --check`;
- operating-mode guard;
- fetch main, finish 0 behind;
- keep Draft;
- report exact head/files/session/`originalModelName`;
- STOP.

No Ready. No merge. No follow-up implementation.