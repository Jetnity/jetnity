# Jetnity – AP-7-S1 Dual-Authority Domain Contract Status

Stand: 28. August 2026  
Status: **AUTHORIZED / IMPLEMENTATION SLICE / DRAFT / NO SCHEMA OR PRODUCTION MUTATION / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Workstream: Account / Traveller  
Logical Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 12`**

## 0. Authorization

Binding Product-Owner architecture approval:

`docs/AP7_DUAL_AUTHORITY_PRODUCT_OWNER_APPROVAL_2026-08-28.md`

> Account Registry = reusable current traveller identity/facts.  
> Trip Snapshot = only Current Truth for a concrete trip.

This slice does **not** consume the separate Production migration / Identity / RLS gate.

## 1. Live baseline / transport

| Fakt | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Task-Baseline `main` | `bb38aef589f0cdcea1aaf8ddd87d043d0a9f0f05` (PR #144 Merge) |
| `origin/main` bei Authoring-Re-Fetch | `bb38aef589f0cdcea1aaf8ddd87d043d0a9f0f05` |
| Branch | `feat/ap7-s1-dual-authority-domain-contract-2026-08-28` |
| Draft-PR | [#145](https://github.com/Jetnity/jetnity/pull/145) |
| Reviewed Head invalidiert | `c88ac2e3` (CHANGES REQUIRED `5455673104`) und Stamp `ed8f79b4` |
| Exact Head | der Commit dieses Review-Fix-Stamps; live am PR #145 prüfen |
| Ahead / behind `origin/main` | **8 / 0** nach diesem Stamp (7 vorher: PO-Approval, Task, feat, Continuity, first stamp, review-fix, review-fix continuity) |
| Logical Cursor-Agent | `Cursor-Agent: Account plattform audit vorbereitung 12` |
| Sichtbarer Cursor-Titel | `Dual-authority domain contract` |
| Cloud-Run | https://cursor.com/agents/bc-6b3a7a55-26fe-41a9-8cf2-b599afe1eda0 |
| Rename | keine unterstützte Rename-Fähigkeit; UI nicht als umbenannt behauptet |
| Generation | 12. Gate-0 Generation 11 nicht wiederverwendet. |

Titel-Mismatch ist non-blocking nach `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md`.

## 2. What this slice implements

Shared Dual-Authority domain contract, reused from live Foundation-E primitives instead of a second traveller model:

- `TripTraveller` / `TripTravellerCitizenship` / `TripTravellerDocument` remain trip snapshot truth (`types/trips.ts`).
- `TRAVELLER_CONTEXT_GRENZEN` (8 citizenships / 12 documents) and `landescodeLesen` remain the canonical limits and country check.
- New home: `lib/traveller/account-registry.ts`.
- `AccountRegistryTraveller` is nested (`facts`) and therefore not assignable to `TripTraveller`. Compile-time regression in the test file proves direct assignment is rejected without casts.
- Registry `id` and `clientRef` (person, citizenship, document) are UUID-backed. Fact-derived refs such as `document:passport:CH` or `person:0` are rejected.
- `authority` must be exactly `account_registry`. Missing/wrong authority and flat `TripTraveller` shapes are rejected.
- Projection requires explicit `TripSnapshotMaterialisierung`: trip-owned UUIDs plus `jetzt`. Registry identity and registry timestamps are not copied. Document→citizenship refs are remapped. Identical snapshot/registry identity is rejected. No `new Date()` fallback.

Inspected and not duplicated:

- `lib/readiness/traveller-kontext.ts` (`travellerLegacyLesen`, `credentialOptionsAus`) – guest/legacy and readiness evaluation, not registry authority.
- `lib/readiness/traveller-anfrage.ts` – untrusted trip-request parser; leftover legacy singular fields stay there.
- `lib/readiness/engine.ts` `travellerNormalisieren` – readiness options, not account identity.

## 3. Files changed

Implementation:

- `lib/traveller/account-registry.ts`
- `lib/traveller/account-registry.test.ts`

Continuity / ADR (this slice):

- `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_STATUS_2026-08-28.md`
- `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_HANDOFF_2026-08-28.md`
- `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_SELF_REVIEW_2026-08-28.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
- `DECISIONS.md` (ADR-0186 Nachtrag + ADR-0187)
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `JETNITY_HANDOFF.md`
- `JETNITY_START_HERE.md`

Already on the branch before this slice body:

- `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_TASK_2026-08-28.md`
- `docs/AP7_DUAL_AUTHORITY_PRODUCT_OWNER_APPROVAL_2026-08-28.md`

No `app/`, `components/`, `supabase/migrations`, Auth/AAL, RLS, GRANT/REVOKE, SECURITY DEFINER, UI, or provider runtime files.

## 4. Tests / quality

Adversarial tests in `lib/traveller/account-registry.test.ts` cover:

- two or more citizenships survive read/projection;
- two or more documents survive read/projection;
- explicit document→citizenship relation; issuer ≠ citizenship;
- missing relation stays `null` / unknown;
- source and snapshot share no object/array identity;
- source is not mutated;
- no chosen/preferred/default credential field is generated or accepted;
- positional and fact-derived refs (`traveller:N`, `person:0`, `document:passport:CH`) are rejected;
- two same-type/same-issuer passports remain distinct via UUID refs;
- Foundation-E limits and country/document validation;
- duplicate / dangling refs fail closed;
- missing/wrong `authority` and flat `TripTraveller` input are rejected;
- snapshot identity ≠ registry identity; child timestamps = `jetzt`;
- incomplete materialization / missing `jetzt` fail closed;
- compile-time assignment Registry→Trip is rejected;
- no citizenship inferred from residence, locale, language, issuer or departure;
- empty facts stay empty.

Verified on this branch before the final review-fix stamp (`HEAD` was `ce5b7e70379ded725a5f6492207647de035ae390`; this stamp is the review head). Prior 12/12 + `c88ac2e3` / `ed8f79b4` evidence is invalidated.

| Gate | Ergebnis |
| --- | --- |
| `node --import tsx --test lib/traveller/account-registry.test.ts` | **15/15 pass** |
| Related traveller tests (`traveller-kontext`, `traveller-anfrage`, `schema`, `traveller-zuordnung`) | **30/30 pass** |
| `npm test` | **2456/2456 pass**, 0 fail |
| `npx tsc --noEmit --pretty false` | pass (includes `@ts-expect-error` Registry↛Trip boundary) |
| `npx eslint . --max-warnings=0` | pass |
| `npm run check:dead` | pass (only justified CookieConsent orphan) |
| `npm run check:exports` | 0 unused exports |
| `npm run check:deps` | pass |
| `npm run check:api-schutz` | 12 admin routes, all `requireAdminApi()` |
| `npm run check:schema-bezug` | pass; no new schema objects |
| `npm run build` | pass (`next build`) |
| `origin/main` re-fetch | `bb38aef589f0cdcea1aaf8ddd87d043d0a9f0f05` — **0 behind** |

CI/Vercel on the final head must be live-verified by the independent reviewer. This authoring run does not claim GitHub Actions or Vercel for the stamp commit.

## 5. Scope / non-scope confirmation

In scope: shared pure domain types, fail-closed validation, immutable projection, adversarial unit tests, continuity/ADR.

Hard non-scope held:

- no Supabase migration / mutation;
- no new table/column/index/trigger/function;
- no RLS / GRANT / REVOKE / SECURITY DEFINER;
- no persistence adapter or backfill;
- no passport/document numbers, scans, MRZ, biometrics, date of birth, health data;
- no Auth/Session/MFA/AAL change;
- no account Traveller UI/CRUD;
- no Guest→Registry import;
- no provider runtime, TW-8/TW-9, AP-5/AP-6, Branch Protection;
- no Ready, no merge, no follow-up slice.

## 6. Security / privacy review

Data minimization held. The contract allowlists only Foundation-E semantic fields: label, ISO-2 residence/citizenship, document type, issuer, expiry, explicit citizenship ref, stable ids/clientRefs, timestamps.

Rejected at the boundary: sensitive keys (numbers, MRZ, scans, biometrics, DoB, health), default/chosen credential fields, legacy singular derivation fields, extra unknown keys.

No service-role path. No secrets. No new tracking identifier.

Existing `TripTraveller` has no date-of-birth field; none was added.

## 7. Unresolved risks

1. Agent self-review is not an independent Technical-Lead PASS.
2. `main` Branch Protection remains `protected=false`.
3. Persistence must still consume the explicit materialization input and must not invent a provenance/live FK from registry ids.
4. Guest→Account trip copy remains automatic and trip-scoped. A later agent could still misread that as registry import.
5. No schema is designed here. AP-7-S2 / persistence remains separately gated.
6. Production-schema live check against Supabase was not part of this slice.

## 8. Finished vs unfinished

**Finished in this slice (authoring):**

- Dual-Authority shared domain contract
- fail-closed relational validation
- independent projection to `TripTraveller`
- adversarial tests authored
- Status / Handoff / Self-Review / ADR / continuity pointers

**Unfinished / not authorized:**

- independent Technical-Lead exact-head review
- Ready / merge
- any persistence, RLS, UI, Guest→Registry import
- AP-7-S2 or later
- AP-5-S3/S4/S5, AP-6, TW-8/TW-9

## 9. Exact first unfinished next step

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #145 auf dem finalen Head. Kein Ready. Kein Merge. Kein AP-7-S2. Keine Persistence.
