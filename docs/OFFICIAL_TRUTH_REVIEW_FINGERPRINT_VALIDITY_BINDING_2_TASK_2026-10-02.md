# Official Truth Review Fingerprint Validity Binding 2 — Binding Task

Date: 2 October 2026
Issue: #758
Source audit: merged #749 / F5
Prerequisites: merged #755/F1 and #757/F3
Baseline: `main@e0b1056a096058b939e5adf8ac5d88d6e239b565`
Branch: `fix/official-truth-review-fingerprint-validity-2`
Logical agent: **Jetnity Official Truth review fingerprint validity binding 2**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Close the next confirmed #741 blocker from #749 F5.

The current `reviewPacketKey` is a deterministic checksum/identity for one re-proven review packet. It already recomputes the packet and does not trust a caller-supplied hash, but:
- `validFrom` / `validUntil` are not bound into the fingerprint;
- the key must never be treated as an authorization capability or server approval witness.

This slice changes the fingerprint contract explicitly and versionedly.

## Binding decisions

1. Add the accepted Evidence validity window to the canonical review identity:
   - `validFrom`
   - `validUntil`
2. Bind the values from **re-proven accepted Evidence**, never raw caller extraction bytes.
3. Do **not** bind `extractionNote`.
   - It is non-authoritative annotation/free text.
   - It must not change `reviewPacketKey`.
   - It must not appear in fingerprint output.
4. Because the canonical bytes change, bump the key prefix from:
   - `review-packet:v1:`
   to:
   - `review-packet:v2:`
5. Do not silently accept the old prefix as equivalent.
6. `reviewPacketKey` is exactly:
   - deterministic identity/checksum of re-proven review material;
   - NOT authentication;
   - NOT authorization;
   - NOT reviewer identity;
   - NOT AAL/capability/grant proof;
   - NOT a server-stored witness;
   - NOT acceptance;
   - NOT Official Truth.
7. A future live/#741 gate must recompute #723/#726 from server-held inputs and may compare a supplied key only as an equality check. The key itself grants nothing.

## Layering

Prefer preserving the existing architecture:

`original support bundle -> #723 review packet -> #726 fingerprint`

Do not make #726 independently re-run lower-level Evidence logic.

The preferred change is:
- extend `OfficialTruthRegelReviewSupport` / its constructor with the already accepted `validFrom` and `validUntil`;
- let #726 consume those re-proven support values;
- leave `extractionNote` out.

Do not add another Evidence parser or another validity truth engine.

## Canonical fingerprint v2

Per support, the fingerprint provenance must bind:
- `versionId`
- `sourceId`
- `canonicalUrl`
- `retrievedAt`
- `sourceContentHash`
- `validFrom`
- `validUntil`

Candidate identity remains:
- scope
- rule-scope key
- fact kind
- evidence quality
- sorted support version ids
- proposal

Support-order independence remains.

## Mandatory adversarial tests

At minimum prove:

1. identical re-proven packet => identical `review-packet:v2:` key;
2. changing only `validFrom` changes the key;
3. changing only `validUntil` changes the key;
4. null vs non-null validity changes the key;
5. equivalent normalized accepted validity values produce the same key;
6. changing only `extractionNote` does **not** change the key;
7. extractionNote content never appears in fingerprint output;
8. raw caller package/hash/key injection is still rejected;
9. support order still does not change the key;
10. source URL/retrieval/hash/source/proposal/factKind/quality/scope changes retain existing identity behavior;
11. #723 support output carries `validFrom` and `validUntil` from re-proven accepted Evidence, not raw input that failed acceptance;
12. review-suggestion and decision-intent paths recompute/use the v2 key, with no second fingerprint engine;
13. a stale v1 key supplied to decision intent does not match the recomputed v2 key;
14. successful v2 key comparison does not call Rule acceptance/store and does not become authority;
15. no reviewer/role/AAL/grant/capability field is added to this fingerprint;
16. `requirementsProviderAus() === null`.

## Allowed runtime files

- `lib/readiness/official-truth-rule-review-packet.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.ts`

Only if required by the support shape / v2 key expectations:
- `lib/readiness/official-truth-rule-review-packet.test.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.test.ts`
- `lib/readiness/official-truth-review-suggestion.test.ts`
- `lib/readiness/official-truth-rule-review-decision-intent.test.ts`

Runtime files for suggestion/decision-intent should remain unchanged unless the current code hardcodes v1. If runtime modification would be required for another reason, STOP and report.

## Allowed architecture/documentation

May update:
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
  only to replace the current v1 fingerprint description with the new v2 identity and the explicit "not a capability" rule.

Create:
- `docs/OFFICIAL_TRUTH_REVIEW_FINGERPRINT_VALIDITY_BINDING_2_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_FINGERPRINT_VALIDITY_BINDING_2_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_FINGERPRINT_VALIDITY_BINDING_2_SELF_REVIEW_2026-10-02.md`

Do not rewrite historical #726 delivery docs merely to make them look current. They remain historical v1 evidence.

Do not edit global startup/Guardian Current-State files in this lane.

## Explicit exclusions

Do not bind:
- `extractionNote`;
- sourceSnapshot bytes (already represented only through sourceContentHash);
- reviewer identity;
- role;
- AAL;
- capability;
- grant;
- suggestion;
- decision;
- clock/server witness;
- accepted/trusted Rule.

Do not solve F2, F4, F6, F7, F8 or F9 in this slice.

## Hard boundaries

No database migration/apply.
No Supabase mutation.
No Auth/RLS/role/capability mutation.
No endpoint/API/Server Action.
No trusted Rule write.
No `regelKandidatAkzeptieren`.
No store call.
No provider/model/network call.
No secrets/cost.
No Production configuration.
Do not implement #741.
Do not touch #626.

## Validation

- fetch latest main;
- finish 0 behind;
- focused packet/fingerprint/suggestion/decision tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- `check:dead`;
- `check:exports`;
- `check:deps`;
- `check:api-schutz`;
- `check:schema-bezug`;
- `git diff --check`;
- operating-mode guard;
- no remote Supabase access.

Stay Draft.
Do not Ready.
Do not merge.
Do not start F9 or #741.
STOP for independent Technical-Lead exact-head review.
