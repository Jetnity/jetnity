# Official Truth Source/Evidence Architecture

Date: 1 October 2026
Status: **source/evidence contract merged in #673 / private evidence schema merged in #675 at `main@140fdfb9fb066ca9d23c295719cb2e770ae63fd7` / Development history `20261001121258` with three empty private tables / Production has no Official-Evidence table / rule-claim contract is Draft PR #677 / no provider activation**
Decision: ADR-0216, ADR-0217, ADR-0218
Product-Owner source: Issue #294 comment `5928669189`
Task: `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_TASK_2026-10-01.md`

## 1. One engine, three layers

The existing Requirements / Official-Truth engine remains canonical. This slice does not build a second evaluator and does not change `lib/readiness/engine.ts` or `lib/readiness/official.ts`.

1. **Source / Evidence layer** (`lib/readiness/source-registry.ts`, `source-router.ts`, `evidence.ts`)
   - knows source class, authority identity, domains, canonical HTTPS URL, retrieval time, content hash and lifecycle
   - contains no user, account, trip or traveller identity
2. **Existing Requirements / Official-Truth engine**
   - remains the only authority for fail-closed traveller-specific evaluation
   - keeps multi-citizenship and multi-document options isolated
   - keeps `unknown != not_required`, `unavailable != not_required` and `stale != current`
3. **Presentation / Copilot**
   - may later explain accepted evidence
   - cannot mint Official Truth

`requirementsProviderAus()` stays `null`. No Timatic or Sherpa adapter exists. No current provider is activated.

## 2. What this is

This is a first-party source/evidence foundation behind the existing provider boundary. It is not a Sherpa clone and not a government-domain catalog. Tests use synthetic hosts such as `gov.example` only.

The router plans which registered sources are eligible to research a reusable regulatory scope. It does not call the web, OpenAI or a provider. It does not rank a best passport. No source coverage yields `no_eligible_source` with official result `unknown`, never `not_required`.

## 3. Historical compute-on-read and the new persistence decision

The historical runtime statement remains true until a later persistence slice: traveller-specific `OfficialEvaluation` is compute-on-read, and there is no Official table.

Product-Owner comment `5928669189` approves a narrower future change only:

- global non-personal source and evidence versions may be persisted and reused
- a shared cache must never persist a user-specific final decision as universal truth
- traveller-specific evaluation stays derived from current route, traveller and credential context

No passport number, MRZ, scan, biometric, date of birth, health record, user id, account id, trip id or `travellerClientRef` belongs in the global evidence contract.

The foundation slice did not implement storage. `OfficialEvidenceStore` remains a port type with no runtime implementation. ADR-0217 adds the repository schema only. It does not add an adapter, and Cursor does not apply the migration.

## 4. Source classes

| Class | Meaning |
| --- | --- |
| `official_authority` | A government or other competent official publisher. `authorityName` is required. |
| `licensed_evidence_provider` | A future commercial evidence provider. `publisherName` is the provider. `authorityName` is null. |

A licensed provider is not labeled as the government authority. No real Timatic or Sherpa source entry is registered.

Domains are normalized hostnames. Schemes, userinfo, ports and paths are rejected. Accepted source URLs must pass the existing `quelleUrlLesen` HTTPS boundary: no `http`, no URL credentials, no localhost. Unregistered and blocked hosts fail closed. A host matches a registered domain only on equality or a dot-bounded subdomain. `notgov.example` does not match `gov.example`.

## 5. Router

Input is reusable regulatory context, not a user identity. Personal identifier keys fail closed. There is one cell per explicit credential option. Each cell carries the full citizenship set. `relatedCitizenshipCountryCode` is set only when that document↔citizenship relation was supplied. The issuing country is not citizenship. An unlinked document stays unlinked. Citizenships are not crossed with documents.

Coverage dimensions for citizenship, residence and documents use an explicit mode:

| Mode | Meaning |
| --- | --- |
| `independent` | The source may be used for any value of that dimension, including `not_applicable`, without listing the world. |
| `exact` | The source matches only the declared non-empty list. An empty list is an invalid descriptor, not a wildcard. |
| `not_applicable` | The source matches only when that atom dimension is `not_applicable`. |

Exact citizenship matches the option's explicit `relatedCitizenshipCountryCode`. A CH-only source can cover a dual national's CH-linked passport and still leave the RS-linked passport uncovered. An unlinked document does not match an exact citizenship list. If the cell has no credential option, exact citizenship matches only when the citizenship set is a non-empty subset of the declared list.

Exact documents match document type and issuing country. Destination and transit stay separate country lists. An empty destination list is transit-only. An empty transit list is destination-only. A descriptor with neither is invalid. Missing coverage stays `unknown` / `no_eligible_source` and is never `not_required`.

Output is a plan:

- `officialResult` is always `unknown`
- `evaluation` is always `not_performed`
- source order is alphabetical stability, not a preference

Partial coverage stays partial. The covered credential option is not treated as the traveller's only option.

## 6. Evidence versions and the lookup key

An evidence version carries provenance, lifecycle (`candidate`, `accepted`, `conflicted`, `superseded`), validation state, validity window, `sourceContentHash` and an optional `previousVersionId`. It is not a free-form truth blob and has no official result fields.

`sourceContentHash` is SHA-256 of source text normalized by Jetnity (`\r\n` and `\r` become `\n`). The text, the retrieved URL and the retrieval timestamp are fields of `EvidenceQuellenmaterial`, one retrieval argument. This slice does not fetch that text. `evidenceKandidatAusModell(modell, material, registry)` reads `canonicalUrl`, `retrievedAt` and `sourceSnapshot` only from `material`. The model object cannot contain those fields, nor `content`, `contentHash` or `sourceContentHash`. Those keys are rejected before hashing or URL resolution. `extractionNote` stays on the model side and is not part of the hash or `versionId`.

`evidenceKandidatAusModell` always creates a `candidate` / `pending` version or rejects the input. Model fields `result`, `required`, `not_required`, `conditional`, `optionEligibility`, `optionMandate` and `visaMode` are rejected. They are not copied onto the candidate.

`evidenceKandidatAkzeptieren` is the only promotion to `accepted` / `valid`. It re-checks registry identity, HTTPS URL, retrieval timestamp, source fingerprint and the recomputed lookup key. `akzeptierteEvidenceLesen` returns null for a candidate.

A changed source fingerprint creates a different `versionId`. `evidenceVersionenVergleichen` reports `contentChanged` and always `ruleChange: 'not_asserted'`. An unchanged fingerprint can short-circuit later analysis. Same source text with different extraction wording does not. `evidenceKonfliktHalten` keeps the existing accepted version, sets `overwritten: false`, and does not silently replace it.

The lookup key is `evidence-key:v2:` plus SHA-256 of canonical JSON scope version 2. Nothing was persisted under v1. Input order of citizenships and credential options does not change the key set. The key can contain only non-personal regulatory context:

- source id
- destination country and transit country as distinct fields
- the full citizenship set when citizenship applies
- one credential option: document type, issuing country, and either an explicit related citizenship or `unlinked`
- residence country when the rule depends on residence
- requirement type
- travel date when the validity scope needs it

Residence is explicit (`not_applicable` or `required` plus a country code) because an entry rule can depend on residence without that fact being a personal identifier. Missing residence, citizenship, credential relation or validity mode fails closed. A missing `relatedCitizenshipCountryCode` key fails closed. Explicit null stays unlinked and is not copied from the issuing country. A related code outside the declared citizenship set is invalid. The key does not contain user, account, trip or traveller ids, document numbers, MRZ, biometrics, date of birth, health records or free-text personal data.

## 7. Model and provider boundary

A future OpenAI research adapter may receive a Jetnity domain allowlist, discover URLs, extract candidate evidence and help compare changed source text. Model output remains candidate evidence. Model text is never Official Truth by itself.

Timatic and Sherpa remain optional future adapters. They are not activated, contacted or represented as official authorities here.

## 8. Private evidence store — repository schema only

Supabase remains the intended evidence store. Draft PR #675 has one repository migration, `supabase/migrations/20261001121258_official_truth_private_evidence_store_schema_1.sql`. That version is the Development history version from the Technical Lead apply. It was not invented by hand. The SQL bytes are the same as the earlier `20261001111642` file. Cursor does not apply it again. Production is not applied.

Tables, all in the unexposed schema `private`:

- `official_sources` — `source_id`, source class, publisher, and authority name only for `official_authority`
- `official_source_domains` — normalized hostname, unique per domain
- `official_evidence_versions` — the version and the typed scope from `lib/readiness/evidence.ts`

A PostgreSQL `CHECK` passes when its expression is `NULL`, so the option, required-residence and `travel_date` branches test the required child with `IS NOT NULL` before the value check. `related_citizenship_country_code` null remains the unlinked state. `not_applicable` still requires its child fields to stay null. `private.official_evidence_validity_instant(text)` is a comparison helper. It is not `SECURITY DEFINER`, not granted, and not an RPC. Date-only `valid_from` / `valid_until` stay text. The helper treats a date-only value as UTC midnight only while comparing. `retrieved_at` stays the UTC instant string from the TypeScript contract. `version_id` is stored as `ev1_` plus 32 hex characters and is not recomputed from a reformatted timestamp.

Security boundary of this migration:

- `private` is not added to the Data API schemas (`public`, `graphql_public`)
- `PUBLIC`, `anon`, `authenticated` and `service_role` are revoked on the schema, the tables and the helper
- RLS is enabled and forced, with no policy and no user-ownership predicate
- no trigger, cron, queue, extension, webhook, HTTP call or seed row

`service_role` bypasses RLS on Supabase. The revoke is the control for that role. RLS without a policy is the control for roles that do not bypass RLS.

The migration does not prove DNS ownership, parent/child hostname overlap, geopolitical validity of an ISO-2 code, or that a version chain is acyclic under a later privileged update. A source row can exist before its first domain row. Source class and authority stay on `official_sources` so the version does not carry a second writable copy. A later adapter must freeze those source fields or snapshot them. This schema slice does not add that writer.

No evidence row exists because of this migration. No store adapter exists. `requirementsProviderAus()` stays `null`. Development already has this schema under `20261001121258`. A second apply is not allowed. Production remains a separate Product-Owner gate.

A later refresh may use existing `pg_cron`, a queue or another bounded worker only after a separate architecture and operations slice. This schema does not install or use `pgmq`.

## 9. Schema state after #675

#675 merged at `main@140fdfb9fb066ca9d23c295719cb2e770ae63fd7`. Development has migration `20261001121258_official_truth_private_evidence_store_schema_1` and the three private tables. Those tables have zero rows. Production has no Official-Evidence migration and no Official-Evidence table. This document does not apply SQL. A second Development apply is not allowed.

## 10. Rule claims

Draft PR #677 adds the source-neutral rule-claim contract in `lib/readiness/rule-claims.ts`. ADR-0218. It sits between an accepted `EvidenceVersion` and the existing engine. It does not wire the engine.

The rule scope drops only `sourceId` from a validated evidence scope. The key is `rule-scope:v1:` plus SHA-256. `evidence-key:v2:` is unchanged. Citizenship order does not change the key. Two sources with the same regulatory scope share it. The cell still carries the full citizenship set and one credential option. The issuing country is not citizenship. There is no preferred passport.

Evidence support is a sorted unique list of at most eight `versionId` values. Every supporting version must resolve to that same rule scope. `explicit_primary_statement` and `composed_from_multiple_primary_sources` are primary Official Truth: every supporting version must be `sourceClass === 'official_authority'`. Explicit quality needs at least one such version. Composed quality needs at least two such versions and two distinct official `sourceId` values. A licensed provider, two licensed providers, or a mix of official and licensed support fails closed with `primary_source_required`. This slice does not add a provider-truth quality. `stale_primary_evidence`, `unresolved_conflict` and `research_gap` cannot become an accepted claim. A research gap has a null proposal and never becomes `not_required`.

`regelKandidatAkzeptieren` does not read the candidate proposal. The accepted fact is built only from the separate `trustedRuleFact` plus evidence versions that pass `akzeptierteEvidenceLesen`. There is no second constructor.

`OFFICIAL_REQUIREMENT_TYPES` is unchanged. Research labels are not requirement types. Structured fact kinds are `requirement_effect`, `visa_options`, `stay_limit`, `passport_validity`, `blank_passport_pages`, `transit_conditions`, `official_actions` and `temporal_rule`. Duration units are not converted. A valid-on-entry passport rule does not store zero months. Unknown transit fields stay null. Official actions resolve through the Source Registry to `official_authority` only. Temporal rules use `temporalRuleLesen`.

The #677 contract slice has no database migration of its own, no Candidate-Evidence import and no CH research batch. It does not wire a runtime provider or the engine. #677 later merged at `main@f4ed316714687ca597c59ce47bfb69f5a290440b`. The persistence selected after that merge is section 12. Production remains a Product-Owner gate.

## 11. Historical next step for the contract slice

At contract delivery, Draft PR #677 was the writer and the next action was independent Technical-Lead review. That review completed and #677 merged. The sentence is historical. The persistence schema is section 12. The current writer is section 13.

## 12. Accepted Rule Claim persistence — repository schema only

The canonical repository migration is `supabase/migrations/20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql`. ADR-0219. That version is the Development history version from the one Technical-Lead apply. It was not invented by hand. The original local CLI file was `20261001140356_official_truth_accepted_rule_claim_persistence_schema_1.sql`. `git mv` changed only the filename. The SQL bytes are unchanged, SHA-256 `d5a5d759c98c6b2875baedbd6c90e4752b9bca1e5d852d1d1dd734d413b807bf`. Cursor does not apply the file again. Production is not applied.

The migration stores only an already accepted Rule Claim. It does not store a candidate, a model proposal, `research_gap`, `unresolved_conflict`, or stale candidate facts as accepted truth. `regelKandidatAkzeptieren()` remains the acceptance function. There is still no runtime writer and no store adapter. `requirementsProviderAus()` stays `null`.

`private.official_evidence_versions` gains `rule_scope_key`. SQL does not compute it and does not prove that it matches the typed scope columns. The source-specific `evidence-key:v2:` lookup key is unchanged. `private.official_rule_claims.claim_id` is a generated bigint identity. It is persistence identity, not Product Truth. One current accepted fact is allowed per rule scope key and fact kind. Eight typed fact tables hold the accepted fact. There is no unrestricted JSONB fact blob.

`private.official_rule_claim_support` uses composite foreign keys to prove the same rule scope key, the exact evidence version, evidence lifecycle `accepted`, evidence validation `valid`, the same source id, and source class `official_authority`. Official actions use the same source-class key. A licensed provider cannot be a support source or an official action source. Support count and distinct-source count stay with the later trusted writer. This migration has no trigger for those acceptance rules.

A deferred constraint trigger requires every accepted claim to have at least one row in the typed fact table for its own fact kind when the transaction commits. Scalar fact kinds keep their one-row primary key. `visa_options`, `transit_conditions` and `official_actions` require at least one row. The fact-table foreign keys to the claim are deferred, so the claim and its fact can be inserted in either order inside one transaction. The trigger does not count supports and does not accept a rule.

A present `transit_airport_codes` list has no finite maximum. `private.official_rule_claim_transit_airports_ok` is an immutable security-invoker helper. It requires a non-empty, IATA-shaped, strictly sorted and unique list. `flughaefenLesen` is unchanged: it canonicalizes a valid list and rejects a malformed code. Persistence stores that canonical list and rejects an unsorted, duplicate or malformed array. The three integrity functions are private, security invoker, use `search_path = pg_catalog`, and are not executable by `PUBLIC`, `anon`, `authenticated` or `service_role`.

No Candidate Evidence is imported. No CH research batch is imported. No seed row is inserted. The schema slice itself did not apply SQL. The Technical Lead later applied that same SQL once to Development. The repository filename now matches that history version. A second Development apply is not allowed. Production is not authorized.

## 13. Next step

At persistence delivery, Draft PR #679 was the writer. That review completed and #679 merged at `main@0fa5f7f0255ade1d7a9e9307cd275019ac9e8506`. The sentence that named #679 as the current writer is historical.

The current writer is Draft PR #681, Issue #680: repository migration-identity reconciliation only. The next action is independent Technical-Lead review of its exact head. Cursor does not Ready, merge, apply SQL again, import evidence, or start a follow-up.
