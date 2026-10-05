# Official Truth applicability schema 2 — activity/stay architecture 1 — Self-review

Date: 5 October 2026 · Issue #850 · Draft PR #851 · Generation 1

**APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY**

This is the assigned writer's self-review, not independent ChatGPT/Technical-Lead review or a PASS. Writer: **Jetnity Official Truth applicability schema 2 activity/stay architecture 1**. Session `01a10d74-d842-7912-9e7f-d261352631b3`, model `gpt-6-astra`, effort `xhigh` verified in local turn context.

## Task coverage

| Binding requirement | Architecture location / disposition |
| --- | --- |
| Live main/mode/#751/#748/#850/#851/#853; TASK identity | Report identity table and final pre-push/readback protocol; immutable TASK retained. |
| Source-neutral minimum; explicit schema-2 decision | §§1–3: three new predicate kinds, preserved operators and version domains. No new country-specific kind or free-text condition. |
| Remunerative, income-earning, profit-making, business contacts | §4: independent booleans, explicit NOT, absent unknown, conflicting declarations blocked. |
| Planned duration/date/landing grant distinction | §§5/7: one visit, quantity plus calendar facts, separate grant/extension payloads. |
| Day/month preservation and bounds | §§5/8: no unit conversion, bounded positive thresholds, explicit day counting only. |
| Unknown/open-ended dates | §5: distinct wire variants; no infinity, no automatic false or invented return date. |
| Citizenship/issuer/related citizenship/class/national passport | §6: existing link retained; one explicit national-character assertion; ordinary is a separate conjunct. |
| Permission expiry / reference time | §7: strict event deadline; real governing permission; date-only precision unknown; no Irish never-applicant substitute. |
| Three-valued logic/missing facts/conflicts | §8: complete algebra, branch algorithm, validation-before-evaluation and exact result/gap vocabulary. |
| Fingerprints/v1-v2 compatibility | §9: frozen v1, separate v2 domains, full-fact coverage, no personal-context hash. |
| Extractor/policy/store pins | §9: code-owned exact descriptor, frozen request, empty registries, reject all v2 before store transport. |
| Future test matrix/adversarial cases/exact candidate paths | §§10–11; specification only, no tests/code written. |
| Unsupported scope and migration statement | §§9/12: no migration; unsupported qualifiers stop complete-fact production. |

## Challenges raised and resolved in the document

**Could business contacts quietly mean unpaid?** No. All four activity characteristics are independent. A true contacts assertion cannot fill any economic characteristic with false. The current business/work/visitor purpose labels are not redefined.

**Could a generic “profit-making” checkbox decide disputed legal remuneration?** No. The vocabulary preserves a proposition; source-specific semantic mapping and explicit traveller assertion remain necessary. Remote work, foreign salary, reimbursements and legal equivalence between terms remain unsupported. The evaluator cannot read a job title or free text to decide them.

**Could dates imply a safe 90-day stay through an off-by-one default?** No. Unspecified source counting admits no date arithmetic. Named inclusive/exit-exclusive conventions are distinct; direct quantities must match unit/convention. The pre-evaluation consistency check also compares any declared named day convention with dates even when the rule asks about a different convention. Contradictions cannot be hidden by an unrelated true branch.

**Could a partial citizenship list prove absence in the new composite?** No. The new national-passport atom requires positively recorded inclusion or keeps that limb unknown; issuer never fills citizenship/link. The original v1 citizenship atom's behavior remains frozen and is explicitly not a completeness witness. A known different selected-document link can be false without borrowing another passport.

**Could “national passport” accidentally mean “ordinary valid passport”?** No. Ordinary class and passport validity remain separate. Emergency/diplomatic/official passports do not become ordinary. Known refugee/laissez-passer national-character contradictions block the context. Missing class, linkage and national character each remain visible.

**Could before-expiry be encoded as one minute before arrival+90 days?** No. The proposed event form has an actual permission-expiry reference and strict `<` comparison, no offset. A date-only expiry has insufficient precision; a future permission is not a pre-entry requirement. Window-open does not prove filing/compliance.

**Could new schema fields leak through the old store?** This is a material future implementation hazard: the current store's catch-all accepts non-effect/visa kinds. The proposal explicitly requires rejection of every versioned stay/temporal carrier before RPC, not merely extending effect checks. No store code or DB action occurred here.

**Could READY close UK/Japan source-law gaps or start implementation?** No. Architecture §12 lists the unclosed source mapping, school/reference-time, Japanese class/extension and identity/retrieval boundaries. READY applies only to this selected representation contract. Complete rules with unsupported qualifiers cannot be emitted.

## Verification actually performed and its limits

The current code and tests were read for contract behavior, including provenance, otherwise, duplicate/context conflict, units and exact parser keys. Manual conformance review checked positive, negative, unknown, boundary, mixed-version and loss-of-qualification cases. This is not an executed implementation test suite and does not certify proposed code that does not yet exist.

Delivery checks cover Git path scope, immutable TASK blob, merge-base/ahead/behind, zero overlap with #853, `git diff --check`, `node scripts/operating-mode-guard.mjs`, required artifacts/links and no changed runtime/test bytes. The remote exact head, Changed Files and triggered CI/Vercel must be read after push; those observations are delivered with the final SHA rather than copied from the seed. No local application build/test run is claimed for a documentation-only change.

No live database, Supabase, Production, provider API, actual traveller facts, real source profile/extractor, acceptance chain or complete legal source-family semantics were validated. Official web spot-checks are limited research corroboration; no full-body hash or runtime retrieval proof is claimed. Legal and producer gaps remain explicit.

The only repository changes are the four allowed new documents; the PR also contains the original immutable TASK. Shared governance/status files and all five #853-reserved paths are untouched. No second agent or independent reviewer was impersonated.

## Final position

The contract is sufficiently bounded, source-neutral, testable and backward-safe for independent TL architecture review. Remaining integration/source gates are preserved as explicit rejection boundaries. Any concrete defect found in exact-head review must return to this same writer/session; green automation is not an acceptance decision.

Final classification: **APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY**.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Draft only; no Ready, merge or follow-up.
