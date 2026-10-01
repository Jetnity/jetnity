# Official Truth First-Party Source/Evidence Foundation 1 — Binding Task v1.0

Date: 1 October 2026
Issue: #672
Branch: `feat/official-truth-source-foundation-1`
Baseline: `main@4379eeede564fcf387dee9d8178bcafcf6692586`

Cursor-Agent: **Jetnity Official Truth source foundation 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## 1. Product-Owner decision / authority

Product-Owner source-strategy approval is persisted in Issue #294 comment `5928669189`.

Binding decision:
- Jetnity must not wait for Sherpa or IATA Timatic to build Entry Requirements / Official Truth.
- The existing provider-neutral Requirements / Official-Truth engine remains canonical.
- We do **not** create a second competing truth engine.
- We add a first-party Source Registry + Source Router + versionable Evidence contract behind the existing provider boundary.
- OpenAI may later research/extract only from allowlisted sources, but model output is never Official Truth by itself.
- Timatic/Sherpa remain optional later adapters/evidence providers.
- Supabase is the intended long-term Evidence Store, but this first slice performs **no database mutation**.

This task is the first code foundation for that approved target.

## 2. Live baseline to re-fetch before editing

At task creation:
- machine mode: `NORMAL`
- exact `main`: `4379eeede564fcf387dee9d8178bcafcf6692586`
- #671 is merged and post-merge verified
- post-merge CI `36805357009`: SUCCESS
- Production `dpl_AdZRa6vD1ci1DFWKGAN2UNEJzjJW`: READY on exact main, `jetnity.com`, `aliasError=null`
- no active current product/runtime writer
- open historical Drafts #52/#50/#40/#39/#28 are not current writers
- #626 remains OPEN/BLOCKED; no workaround
- KAYAK #395 waits for response
- IATA #294 waits for response
- Sherpa response received; Product-Owner consideration; outgoing follow-up paused
- #585 remains deferred
- public indexing/launch remains closed

Supabase read-only reconstruction:
- Production project: `qscbgcdmivbbnzrcyegn`
- Development branch: `develop` / `yfvbxvijcorffwxbxahl`, ACTIVE_HEALTHY
- no Official-Evidence tables exist in `public` or `private`
- `private` currently has no tables
- `pg_cron` is installed on Development
- `pgmq` is available but not installed
- this slice does not enable/install/use either.

Relevant current architecture:
- `lib/readiness/provider.ts`: canonical `RequirementsProvider` port; factory is `null`
- `lib/readiness/engine.ts`: canonical fail-closed traveller/credential evaluation engine
- `lib/readiness/official.ts`: trust/freshness/OfficialEvaluation contracts
- `docs/PROVIDER_READINESS_AUDIT.md`: historical current-runtime statement says Official stays compute-on-read
- `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`: same historical statement
- `JETNITY_PRODUCT_MANDATE.md`: no invented Official Truth, provider-neutral architecture, one truth
- latest architecture decision number on main is ADR-0215; this slice may use **ADR-0216** if still free after re-fetch.

OpenAI current official API capability, for architecture context only:
- Responses API `web_search` supports domain filtering with up to 100 `allowed_domains` and can return consulted sources.
- This slice does **not** call OpenAI or the web.

Supabase current guidance, for architecture context only:
- tables in exposed schemas require deliberate grants + RLS;
- server-only data should not be exposed accidentally through the Data API;
- a later schema slice must independently re-check current Supabase docs/changelog before DDL.

## 3. Core architecture decision this slice must encode

### 3.1 One engine, three layers

Do not build a new Official-Truth evaluator.

Keep three explicit layers:

1. **Source / Evidence layer**
   - knows where evidence came from
   - knows source class, authority identity, domains, URL, retrieval time, version/hash, validity metadata
   - knows candidate/accepted/conflicted/superseded lifecycle
   - contains no user/traveller identity

2. **Existing Requirements / Official-Truth engine**
   - remains the authority for fail-closed traveller-specific evaluation
   - evaluates route/traveller/credential context
   - preserves multi-citizenship and multi-document option isolation
   - preserves `unknown != not_required`, `unavailable != not_required`, `stale != current`

3. **Presentation / Copilot**
   - later explains accepted evidence/evaluations
   - cannot mint Official Truth.

### 3.2 Persistence semantics

The prior runtime truth “OfficialEvaluation is compute-on-read / no Official table” remains historically true.

The new Product-Owner decision supersedes it only as follows:
- **global non-personal source/evidence versions may be persisted and reused**;
- a shared cache must never persist a user-specific final decision as universal truth;
- traveller-specific `OfficialEvaluation` remains derived from current route/traveller/credential context.

No passport number, MRZ, scan, biometric, DOB, health record, user id, account id, trip id, travellerClientRef or other personal identifier belongs in the global Evidence Store contract.

### 3.3 Source classes

The contract must distinguish at minimum:
- `official_authority` — government / competent official source
- `licensed_evidence_provider` — e.g. a future Timatic/Sherpa-like provider

Do not label a licensed commercial provider as the government authority.

No real Timatic/Sherpa source entry or adapter is created in this slice.

### 3.4 Model boundary

A future OpenAI research adapter may:
- receive a source-domain allowlist from Jetnity;
- discover/retrieve source URLs;
- extract structured candidate evidence;
- help compare changed source text.

But:
- model output enters as **candidate evidence**, not accepted truth;
- model text cannot directly set `required`, `not_required`, `conditional`, `optionEligibility`, `optionMandate` or a trusted `visaMode`;
- accepted evidence must stay tied to registered source identity, valid HTTPS URL, retrieval timestamp and deterministic validation state;
- source URLs may not contain credentials;
- unregistered/blocked domains fail closed.

### 3.5 Reuse / cache key

Create a deterministic **non-personal** lookup/refresh key contract suitable for later deduplication/single-flight.

It may include only context required to distinguish reusable official evidence, such as:
- source id
- destination/transit country
- citizenship/nationality country when the rule genuinely depends on it
- document type / issuing country when the rule genuinely depends on it
- requirement type
- travel-date or validity scope where required

It must **not** include:
- user/account/trip/traveller IDs
- passport/document numbers
- MRZ/scans/biometrics
- free-text personal data.

Do not invent a universal cache-key field if it would silently drop relevant context. Missing relevant context must remain explicit/fail-closed.

### 3.6 Version/change contract

Provide a pure deterministic contract for later persisted evidence versions:
- stable source identity
- canonical source URL
- `retrievedAt`
- content/version fingerprint/hash
- optional `validFrom` / `validUntil`
- lifecycle/status that distinguishes candidate, accepted, conflicted, superseded
- explicit link to previous/superseded version at the contract level if useful
- source change is not automatically a rule change
- unchanged content hash can short-circuit expensive later analysis
- conflicting accepted evidence may not silently overwrite older evidence.

Do not design a generic free-form JSON “truth blob” as the only contract.

## 4. Required implementation

Implement the smallest pure TypeScript foundation.

Expected files:

- `lib/readiness/source-registry.ts`
- `lib/readiness/source-router.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/source-foundation.test.ts`

You may choose a smaller internal split if materially cleaner, but stay inside the allowlist in §6.

### 4.1 Source Registry

Pure deterministic registry types/helpers:
- validate stable source ids
- normalize/validate domain names
- reject URL schemes/credentials where applicable
- distinguish source class
- represent authority name without treating provider name as authority
- no network.

Do **not** populate a broad real-world authority catalog in this slice. Tests may use clearly synthetic examples such as `gov.example`.

### 4.2 Source Router

Pure routing/planning only:
- input is reusable regulatory context, not a user identity
- output is which registered source descriptors are eligible to research/check
- no web/OpenAI/provider call
- no Official result
- no ranking that infers a “best passport”
- no silent fallback from missing source coverage to `not_required`.

### 4.3 Evidence contract

Pure versionable evidence envelope:
- provenance
- lifecycle
- change/hash metadata
- validity metadata
- non-personal reusable scope
- deterministic lookup/refresh key
- explicit candidate vs accepted boundary.

No persistence implementation in this slice. An `OfficialEvidenceStore` interface/port is acceptable if useful, but do not add a fake in-memory Production store and do not write Supabase code.

### 4.4 Tests

Meaningful tests must include:
- invalid/unregistered domains fail closed
- http/non-HTTPS or credential-bearing URLs rejected for accepted source evidence
- official authority vs licensed evidence provider remains distinct
- candidate evidence cannot be treated as accepted
- deterministic key is order-stable where order is semantically irrelevant
- key excludes user/trip/traveller identity
- multi-citizenship data is not collapsed to first/default citizenship
- transit destination scope remains distinct
- changed hash creates changed-version semantics but does not itself assert a changed rule
- conflict does not silently overwrite accepted evidence
- no source coverage yields “no eligible source” / unknown path, never `not_required`.

## 5. Architecture/documentation

Create:
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`

Update:
- `ARCHITECTURE.md`
- `DECISIONS.md` with ADR-0216 if still free

The docs must say clearly:
- existing Requirements/Official engine remains canonical;
- this is a first-party source/evidence foundation, not a Sherpa clone;
- historical compute-on-read runtime remains true until a later persistence slice;
- Product-Owner now approves future persistent global Official Evidence;
- traveller-specific evaluations remain derived;
- OpenAI later acts as constrained research/extraction, never truth authority;
- Timatic/Sherpa are optional future adapters;
- no current provider is activated;
- no current DB schema is changed.

Do not rewrite dated historical reports merely to make them look current.

## 6. Exact allowlist

Only these paths may change:

- `lib/readiness/source-registry.ts`
- `lib/readiness/source-router.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/source-foundation.test.ts`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_TASK_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_FOUNDATION_1_SELF_REVIEW_2026-10-01.md`

If a necessary implementation cannot fit this allowlist, STOP and report the exact need. Do not widen scope yourself.

## 7. Hard non-scope

No:
- Supabase migration, SQL, RLS, schema, function, trigger, cron, queue or extension change
- Development or Production DB mutation
- `requirementsProviderAus()` activation/change
- `lib/readiness/engine.ts` or `lib/readiness/official.ts` behavior change
- API route or UI change
- OpenAI SDK/API call
- web request, fetch, scraper or browser automation
- real government-domain registry population
- Sherpa/Timatic adapter
- provider contact/signup/terms/DPA/credentials
- paid/live call or spend
- Production env/config
- user/trip/traveller persistence
- passport number/MRZ/scan/biometric/DOB/health
- public indexing/launch
- #626 action
- PrivacyBee change
- follow-up slice selection by Cursor.

## 8. Supabase future target — document only

Document, do not implement:

Preferred later persistence shape:
- server-only/private-schema evidence tables rather than exposing global evidence writes to browser clients;
- no client/service-role secret exposure;
- later schema slice must explicitly decide read path, grants/RLS/private schema and migration strategy;
- later Development-only migration must run security/performance advisors and exact readback before any Production proposal;
- Production remains a separate Product-Owner gate.

A later refresh mechanism may use existing `pg_cron`, a queue, or another bounded worker only after a separate architecture/ops slice. This task does not choose/install `pgmq`.

## 9. Required validation

Before handoff:
1. `git fetch origin main`
2. re-read live main and prove merge-base / ahead / behind
3. confirm changed paths are exactly §6
4. `git diff --check`
5. `node scripts/operating-mode-guard.mjs`
6. run targeted source-foundation tests
7. run full existing required typecheck/lint/tests/build through normal CI
8. verify `requirementsProviderAus()` is still `null`
9. verify no import of OpenAI/Supabase/web fetch in the new runtime files
10. verify no real source domain catalog was introduced
11. record actual Cursor session URL and `originalModelName`
12. push final delivery head
13. record exact-head GitHub CI/Auth and Vercel Preview
14. STOP for independent Technical-Lead review.

A later commit that only records prior-head gate evidence creates a new head and must not claim the prior head gates as its own.

## 10. Deliverables

Create:
- implementation files/tests
- architecture document
- report
- handoff
- self-review

Report must explicitly include:
- baseline reconstruction
- architecture delta vs historical compute-on-read
- exact product-owner decision source (#294 comment `5928669189`)
- changed-file manifest
- validations
- things not touched
- remaining gate for Supabase persistence
- exact next step only as a **proposal**, not a dispatched slice.

## 11. Stop

Stay Draft.

Cursor does not:
- Ready
- merge
- mutate Supabase
- call OpenAI/web/provider
- activate a provider
- contact Sherpa/IATA/KAYAK
- continue #626
- change indexing/launch
- start or select the next slice.

**STOP for independent main-chat Technical-Lead exact-head review.**
