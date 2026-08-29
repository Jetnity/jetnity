# Traveller / Account / Multi-Citizenship Gap Audit Task — 2026-08-29

## Objective

Perform a repository-first gap audit of Jetnity's Traveller and Account architecture, with special focus on multi-citizenship, multiple travel documents/passports, context-dependent document choice, guest-to-account transitions and downstream product integration. This is an evidence and architecture task only; do not change productive runtime behavior.

## Binding product model

1. One traveller may hold multiple citizenships.
2. One traveller may hold multiple travel documents/credentials, including multiple passports.
3. Citizenship and document are separate concepts; do not collapse them into one field.
4. The most useful/permissible document can depend on itinerary, origin/destination/transit, visa/entry rules, provider requirements and current document validity.
5. Jetnity must preserve user choice and explain recommendations; it must not silently rewrite legal identity or invent eligibility.
6. Guest, account owner and co-traveller identities/ownership must remain distinct.
7. Sensitive document data must follow least-privilege, privacy-by-design and explicit ownership boundaries.

## Required audit scope

- Current traveller/person/account data model in code, migrations, types and docs.
- Citizenship representation: cardinality, normalization, ordering/defaults and missing semantics.
- Travel document/passport representation: document type, issuing country, nationality linkage where applicable, expiry/validity, identifiers and sensitivity classification.
- Whether multiple passports/documents per traveller are technically possible and safely owned.
- Separation of account identity, traveller profile and booking/search traveller inputs.
- Guest traveller lifecycle and Guest → Account migration/claim semantics.
- Ownership/RLS expectations for account owner, traveller owner, shared trip/co-traveller scenarios.
- Trip Workspace integration points and whether itinerary context can select/recommend a document without creating a second source of truth.
- Route/transit/multi-destination implications for document choice.
- Entry/visa/requirements integration boundaries and how recommendations should consume traveller/document context while remaining evidence-based.
- Provider/search integration boundaries: which traveller/document fields belong in provider requests and which must stay out until truly required.
- UX state requirements for multiple citizenships/documents, defaults, warnings, expiry and missing data.
- Privacy/security implications of storing passport/document information; identify fields that should not be stored or should require stronger controls.
- Account Platform AP-5–AP-12 dependencies and sequencing constraints.
- Existing tests and missing coverage for multi-citizenship/multi-document/ownership/guest conversion.
- Native/mobile coherence considerations only where they affect canonical contracts; no native implementation.

## Required architecture questions

The audit must answer with repository evidence and explicit recommendations:

- What is the canonical entity graph for Account → Travellers → Citizenships → Documents?
- Which IDs are stable and which attributes are mutable?
- How should a traveller express a preferred/default document without implying universal correctness?
- How should Jetnity compute context-specific eligible/recommended document options without persisting derived legal truth as user identity truth?
- What is the safe boundary between stored traveller facts and dynamic entry/provider eligibility evidence?
- How should guest-created travellers be claimed/deduplicated into an authenticated account?
- What ownership/share model is required before co-traveller collaboration is enabled?
- Which current implementation gaps block product-wide completion of the Traveller/Passport program?

## Explicit non-scope

- No productive code changes.
- No database/Supabase mutation.
- No Vercel/Production mutation.
- No UI implementation.
- No real passport/document uploads or personal data.
- No external visa/entry provider calls.
- No provider credential/API activation.
- No legal eligibility engine implementation.
- No Account Platform implementation slice.
- No Ready/Merge and no follow-up implementation.

## Required deliverables

Create/update only audit/continuity documentation on this branch:

1. `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_GAP_AUDIT_2026-08-29.md`
2. `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_GAP_STATUS_2026-08-29.md`
3. `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_GAP_HANDOFF_2026-08-29.md`
4. `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_GAP_SELF_REVIEW_2026-08-29.md`
5. A proposed canonical entity/ownership contract and prioritized implementation backlog, mapped to current build order and AP/TW dependencies.

## Quality bar

- Cite exact repository paths/symbols/migrations/tests for claims.
- Distinguish implemented, partially implemented, documented-only and absent.
- Do not invent passport/legal/visa semantics not supported by Jetnity contracts or evidence.
- Identify privacy-sensitive fields and recommend minimum necessary storage.
- Preserve one canonical truth model; do not propose duplicate identity/document truths in Trip Workspace or provider adapters.
- Prefer future-compatible API/domain contracts that work for web, mobile and native without platform-specific identity models.
- Identify safe parallel slices versus shared-contract work that requires exclusive ownership.
- Re-check `origin/main` before handoff and document drift.

## STOP condition

After audit, architecture proposal, self-review and handoff are complete, STOP for independent ChatGPT Technical-Lead review. Do not implement fixes/features, mark Ready, merge, or start a follow-up slice.