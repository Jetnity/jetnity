# Official Truth dormant producer/custody foundation — Self-review

6 October 2026 · #876 / Draft #880 · author review, not independent acceptance.

**AUTONOMOUS_PRODUCER_CUSTODY_DORMANT_RUNTIME_FOUNDATION_NOT_READY**

## Contract review

- #855 C encodes keys directly in UTF-16 order, safe integers only, explicit nulls, ECMAScript escaping and no Unicode normalization. Decoder checks UTF-8, rejects duplicates before object assignment and requires exact canonical round-trip bytes. It does not reinterpret arbitrary bytes as a trusted artifact.
- Global definition hashes exactly `{id,version,scope}`. #861 artifacts hash exactly `{kind,schemaVersion:1,value}`. No #859 storage wrapper, additional receipt field or silent repinning.
- All seven #861 logical artifact kinds are closed; unknown kind/schema/version fails. Pin validity is exact full-triple data comparison, not an artifact issuer registry.
- Scope comparison retains all seven quellenneutral fields and full citizenship/credential/residence/date semantics. The separate Evidence scope has the eighth `sourceId` field. Canonical parser output must equal supplied values; normalization cannot hide an extra legal qualifier.
- Custody compares the complete ContentEvidenceIdentity and version, recomputes existing lookup/version algorithms and requires explicit original observation/validity/accepted-origin pins. Pin presence is never interpreted as verified issuer provenance.
- Selection uses synthetic complete snapshots only, exactly one eligible version per required item, no latest/subset fallback. Duplicate versions, custody refs, semantic id/version conflicts and multiple representations of one item fail. Snapshot value retention does not certify its origin/completeness.
- Proposal is required to be null before candidate construction. Original times and validity survive compact provenance. No historical body/envelope is fabricated. Shared v3 core keeps its old canonicalizer/comparator; C is not substituted for v3.
- Legacy/v1 facts use only the four-argument canonical parser. Schema-2 values or labels never cast into v1. Existing schema-2 store guards are unchanged.
- Full-response qualification is intentionally a finite synthetic language under `.example`; complete body and transport must match. There is no assertion that current GOV.UK identity profiles establish non-personal response qualification.
- Stage issuance is module/closure-private, sequential and tied to exact predecessor references. WeakMap membership does not survive clone, serialization, another invocation or terminal close. No stage factory/override is exported, and the only root is unconditionally blocked.
- No bundle/receipt emission, graph resolution, acceptance, store, HTTP, DB, provider/model, registration or activation was added.

## Adversarial coverage

| #863 obligations | Evidence in this slice |
| --- | --- |
| C01/C02/C13/C14/C29 | Forged DTO/brand, JSON/structured clones, cross-invocation, wrong stage/predecessor, post-close/re-entry, caller Pins/IDs and historical bytes all fail to gain live custody. Complete private stage chain closes on consumption. |
| C03 | Missing origin/contract pins and missing required validity nulls fail; no current-value fallback. Real issuer resolution is deliberately absent. |
| C04/C16 | Full identity/context checks, recomputed version/lookup, all seven scope dimensions, changed citizenship/issuer/residence/date and admission basis mismatch. |
| C05 | Historical support/proof values reject stale/future/reference-reversed times using existing freshness semantics. No new TTL or clock. |
| C07/C26 | Proposal-null from inception; non-null/notes/model extensions rejected; exact old-wrapper/core differential and two baseline golden keys. |
| C08 | Missing/extra/duplicate/ineligible/ambiguous supports, same item in different representations, policy-null mismatch, conflicting semantic pin and 256-entry bound. |
| C12 | Unknown artifact/schema versions, legacy/schema-1/schema-2 confusion and applicability pin/null confusion. |
| C15/C17/C20 | Personal/trip/request/session/model fields and hashed extensions rejected; token URL, cookie/auth transport, extra nested response data, body digest instead of body, CAPTCHA/unknown class. |
| C21/C27 | Separate binding equality; unchanged C/H domains/LF, global-definition exception, exact artifact envelope, required nulls, compact receipt support and exact fact/candidate/proof preimages. |
| C22/C23 | Duplicate members including escaped duplicate names, malformed UTF-8/surrogates, prototypes, accessors without invoking getters, symbols, sparse arrays, cycles, unsafe numbers, exact byte/+1 and nesting/+1 checks including shared deeper structural paths. |
| C06/C09/C10/C11/C18/C19/C24/C25/C28 | Actual retrieval/capture/executable/citation/full-bundle/persistence flow is absent by design. These obligations belong to later steps; no synthetic test is misrepresented as real execution closure. |

Graph-depth/node/edge union accounting is not implemented because this slice intentionally has no graph/bundle resolver. Structural decoder depth is distinct and tested. Complete receipt/result publication is not claimed merely because supporting historical values validate.

## Unresolved findings

**P0:** none identified. **P1:** none identified in the bounded path; independent review required.

**P2 F-01:** the existing exact importer guard in `lib/readiness/official-truth-content-identity.test.ts:485` rejects the new record codec module. This file is outside the immutable TASK allowlist. Changing its list would require explicit scope reconciliation; disguising the import or routing it through an unrelated existing module would hide a real architecture change. Neither was done. Broad tests remain red and classification remains NOT_READY.

**P2 F-02:** local Production build cannot bind required IPC/worker ports, even after the sandbox escalation attempt. PostgreSQL checks could not start their missing Linux `initdb`; no database was contacted. Those checks are not claimed as passed.

**P3:** no real origin/qualification release or full receipt closure exists. This is a permanent fail-closed prerequisite for this delivery, not authority to start a follow-up.

See the [Report](OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_DORMANT_RUNTIME_1_REPORT_2026-10-06.md) for commands, counts, zero-effect counters and complete changed paths.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
