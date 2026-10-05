# Jetnity – AP-7-S1 Dual-Authority Domain Contract Task

Stand: 28. August 2026  
Status: **AUTHORIZED / IMPLEMENTATION SLICE / NO SCHEMA OR PRODUCTION MUTATION / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Workstream: Account / Traveller  
Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 12`**

## 0. Product-Owner authorization

Binding architecture approval:

`docs/AP7_DUAL_AUTHORITY_PRODUCT_OWNER_APPROVAL_2026-08-28.md`

Dual-Authority is approved. This slice does not consume the separate Production migration / Identity / RLS gate.

## 1. Live baseline

Repository: `Jetnity/jetnity`

Baseline at task creation:

`main @ bb38aef589f0cdcea1aaf8ddd87d043d0a9f0f05`

PR #144 is merged. Post-merge GitHub Actions run `33192813353` is SUCCESS on exact baseline main. Vercel Production deployment `dpl_4toVx8qL55SdJ6nAhwuYzLqZZsWw` is READY on exact baseline main. Branch Protection remains unchanged (`protected=false`).

Live evidence wins. Re-fetch `origin/main` before final handoff.

## 2. Goal

Implement the first reusable **shared domain contract** for the approved AP-7 Dual-Authority architecture without creating persistence or changing Production identity/ownership.

The slice should make it difficult for later Web, Native, API or persistence work to accidentally collapse traveller truth to one citizenship/document or to turn account identity into live trip truth.

## 3. Binding invariants

Preserve exactly:

> Account Registry = reusable current traveller identity/facts.  
> Trip Snapshot = only Current Truth for a concrete trip.

And:

> One traveller → multiple citizenships → multiple travel documents / credentials → context-dependent evaluated admissible options.

Never:

- invent a default citizenship;
- invent a default passport/document;
- use `documents[0]`, `citizenships[0]` or `evaluations[0]` as product truth;
- infer citizenship from issuing country;
- infer citizenship from residence, locale, language, domain or departure country;
- let account-registry edits mutate an existing trip snapshot;
- define a global/trip-wide `chosenCredentialOptionRef` or equivalent default credential field;
- persist or introduce passport/document numbers, scans, MRZ, biometrics, health data or equivalent sensitive payloads.

## 4. Required implementation work

First inspect the live codebase and reuse existing canonical primitives rather than creating a second traveller model. At minimum inspect:

- `types/trips.ts` and current `TripTraveller` / citizenship / document shapes;
- `lib/readiness/traveller-kontext.ts` and credential-option generation;
- current trip validation/normalization helpers;
- Foundation-E limits and client-ref conventions;
- tests around multi-citizenship, multi-document and `documents[0]` regressions.

Then implement the smallest coherent shared contract that expresses **account-registry identity + explicit projection/snapshot boundary**.

Expected shape, adapted to existing repository conventions after inspection:

1. a canonical account-registry traveller domain type/schema using stable identity (`id` and/or stable account-scoped `clientRef`) rather than positional identity;
2. first-class arrays for citizenships and documents using the same semantic fields and limits as current Foundation E unless evidence requires a narrower contract;
3. explicit document → citizenship relation via an ID/client-ref field; issuer stays separate;
4. a pure projection/snapshot helper or equivalent contract boundary that produces trip-owned traveller data **without** retaining live authority from the account record;
5. no default credential selection and no silent data derivation;
6. validation that fails closed on malformed/ambiguous relational input instead of guessing;
7. tests proving the invariants below.

Do not force filenames from this task if existing architecture provides a more canonical home. Avoid duplicate type systems.

## 5. Required tests

At minimum cover adversarial cases for:

- two or more citizenships survive normalization/projection;
- two or more documents survive normalization/projection;
- document-to-citizenship relation is explicit and issuer is not treated as citizenship;
- a document with no citizenship relation remains explicitly unlinked/unknown rather than guessed;
- account-registry source and produced trip snapshot are structurally independent (later source mutation cannot mutate the produced snapshot by shared object/array reference);
- no default/preferred/chosen credential is generated;
- positional ordering is not used as person/document identity;
- limits and country/document validation align with current canonical trip truth;
- malformed duplicate or dangling references are rejected/fail closed according to repository conventions;
- source data is not mutated by projection/normalization.

If the existing test architecture exposes stronger relevant adversarial cases, add them.

## 6. Security / privacy

Data minimization is binding. This slice must not add fields for:

- passport/document number;
- scan/image;
- MRZ;
- biometric payload;
- date of birth unless an already-approved canonical contract unexpectedly requires it (if encountered, STOP and report instead of adding it);
- health data;
- provider secrets or external identifiers that create a new tracking truth.

No service-role product path.

## 7. Persistence / RLS boundary

Hard non-scope:

- no Supabase migration;
- no new table/column/index/trigger/function;
- no RLS policy;
- no GRANT/REVOKE;
- no SECURITY DEFINER;
- no Production/Develop Supabase mutation;
- no persistence adapter or repository that assumes a not-yet-approved schema;
- no backfill;
- no trip table mutation.

If a correct shared contract cannot be implemented without settling a schema/ownership decision, STOP and report the exact blocker instead of crossing the gate.

## 8. Runtime/UI boundary

This slice may add shared pure domain code used by tests, and may perform a minimal safe refactor to reuse existing canonical types/helpers when necessary.

Do not add:

- account Traveller UI;
- account registry CRUD;
- Guest → Registry import;
- trip refresh/sync UI;
- provider/readiness behavior changes;
- Search/Homepage/Native screens;
- AP-5-S3/S4/S5;
- AP-6;
- TW-8/TW-9.

Do not create dead exported APIs merely to match this task. Integrate with existing domain modules or test surfaces in the smallest maintainable way compatible with repository quality checks.

## 9. Required evidence / deliverables

Create/update the minimum needed for this slice, including:

1. production-quality shared domain implementation;
2. adversarial unit tests;
3. `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_STATUS_2026-08-28.md`;
4. `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_HANDOFF_2026-08-28.md`;
5. `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_SELF_REVIEW_2026-08-28.md`;
6. minimal ADR/continuity updates if needed to record the Product-Owner approval and exact current state.

Status/Handoff must record:

- exact `main` baseline;
- branch / PR / exact head;
- exact logical Cursor-Agent name;
- actual visible Cursor title if easily available, but title mismatch is non-blocking;
- files changed;
- tests run and results;
- scope/non-scope confirmation;
- security/privacy review;
- unresolved risks;
- finished vs unfinished;
- exact first unfinished next step.

## 10. Quality bar

Treat this as foundation code for a security-sensitive travel product, not a prototype.

Prefer:

- small explicit types;
- fail-closed validation;
- deterministic pure functions;
- immutable/copy semantics at the registry → trip boundary;
- no magical inference;
- clear naming that distinguishes registry truth from trip truth;
- strong tests over comments alone.

Do not over-engineer persistence abstractions before the schema gate.

## 11. Hard non-scope summary

No schema/migration/Supabase/RLS/GRANT/REVOKE/SECURITY DEFINER, no sensitive document payloads, no Auth/Session/MFA/AAL change, no UI/CRUD, no provider runtime, no TW-8/TW-9, no AP-5/AP-6 implementation, no Branch Protection change, no Ready, no merge, no follow-up slice.

## 12. Independent-review stop

When finished:

1. re-fetch `origin/main`;
2. record exact head and ahead/behind;
3. run the complete relevant tests plus project quality gates appropriate for the touched code;
4. perform adversarial self-review but do not call it PASS;
5. stop on the final exact head for independent Technical-Lead review;
6. do not mark Ready;
7. do not merge;
8. do not start AP-7-S2 or any persistence work.
