# Official Truth Source/Evidence Architecture

Date: 1 October 2026
Status: **contract foundation only / Draft PR #673 / no persistence / no provider activation**
Decision: ADR-0216
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

This slice does not implement storage. `OfficialEvidenceStore` is a port type with no implementation and no in-memory production store.

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

`sourceContentHash` is SHA-256 of source text normalized by Jetnity (`\r\n` and `\r` become `\n`). The input is `sourceSnapshot`, a non-model retrieval boundary. This slice does not fetch that text. Model prose, `extractionNote`, and the fields `content`, `contentHash` and `sourceContentHash` cannot set or replace the fingerprint. Supplying those fields is rejected before hashing.

`evidenceKandidatAusModell` always creates a `candidate` / `pending` version or rejects the input. Model fields `result`, `required`, `not_required`, `conditional`, `optionEligibility`, `optionMandate` and `visaMode` are rejected. They are not copied onto the candidate. `extractionNote` is stored beside the version and is not part of the hash or `versionId`.

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

## 8. Later Supabase target — not implemented

Supabase is the intended long-term evidence store. This slice performs no migration, DDL, RLS, grant, function, trigger, cron, queue or extension change.

Preferred later shape, still undecided in detail:

- server-only or private-schema evidence tables
- no browser access to global evidence writes
- no client or service-role secret exposure
- a later schema slice must decide the read path, grants, RLS or private schema, and the migration strategy on its own reading of current Supabase docs
- a later Development-only migration must run security and performance advisors and an exact readback before any Production proposal
- Production remains a separate Product-Owner gate

A later refresh may use existing `pg_cron`, a queue or another bounded worker only after a separate architecture and operations slice. This task does not choose or install `pgmq`.

## 9. Proposed next step

Not a dispatched slice. The next useful step is a separately reviewed design for a Development-only private evidence store. It should not include Production DDL, provider activation, a real government catalog, or an engine behavior change.
