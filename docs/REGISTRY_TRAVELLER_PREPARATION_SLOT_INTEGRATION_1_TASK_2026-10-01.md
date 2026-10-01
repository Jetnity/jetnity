# Registry Traveller → Preparation Slot Integration 1 — Binding Task

Date: 1 October 2026
Issue: #688
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`
Logical agent: **Jetnity Registry traveller preparation slot integration 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Live reproduction

A real account-trip on Production showed:
1. saved Account Registry traveller card;
2. explicit “In diese Reise übernehmen”;
3. confirmation;
4. success message: “Die Person wurde als eigenständiger Snapshot in diese Reise übernommen.”;
5. but Vorbereitung continued to show empty `Reisende N` placeholders and missing citizenship / not-checkable official requirements.

Do not use or persist any real personal data from the reproduction. Tests are synthetic only.

## Root cause already established by TL

- `registryTravellerAlsFrischenTripSnapshot()` correctly creates a fresh trip-owned traveller `clientRef`.
- `travellerSlots()` currently binds applicability only by exact `traveller:1..N` refs.
- any other persisted `TripTraveller` is appended with `applicable:false`.
- Preparation, Requirements, Safety, status/fingerprint and attention paths filter to `slot.applicable`.
- therefore a successfully stored Registry snapshot can be ignored by the preparation/official pipeline.
- Historical audit already described this as F10 latent; live reproduction makes it reachable.

## Required product semantics

1. Keep Registry → Trip as an independent snapshot.
2. Never reuse Account Registry ids/clientRefs.
3. Do not infer/choose a citizenship, passport or credential.
4. `Trip.travellers` remains the authoritative headcount / count of applicable traveller slots.
5. A persisted trip-owned traveller whose clientRef is not `traveller:N` must be eligible to occupy an otherwise empty applicable headcount slot.
6. Preserve any exact persisted `traveller:N` match in its canonical slot.
7. Fill remaining empty applicable slots from remaining persisted trip travellers using a deterministic order that does not depend on incidental array input ordering. Prefer a stable key such as `createdAt` then `clientRef`, with explicit tests.
8. Preserve each actual traveller's own `clientRef` when it occupies a slot, so edits/deletes target the correct persisted snapshot.
9. Persisted travellers beyond the trip headcount remain non-applicable and must not influence Requirements/Safety/Official truth.
10. Registry import must fail closed when all applicable headcount slots are already occupied. It must not create another ignored/non-applicable snapshot merely because the DB cap 20 has room.
11. Existing absolute DB cap 20 remains a separate hard cap.
12. No silent merge/dedup of people by label or facts.

## Expected user-visible outcome

For a 3-person trip with empty traveller context:
- importing Sasa fills one applicable slot and the Preparation summary uses Sasa's stored citizenship/document snapshot;
- importing a second saved traveller fills a second applicable slot;
- remaining unfilled slot stays a `Reisende N` placeholder;
- after all 3 applicable slots are occupied, Registry import is disabled/fails with honest copy;
- no imported traveller is silently ignored by official/readiness evaluation.

## Files / scope

Preferred runtime files:
- `lib/readiness/party.ts`
- `lib/traveller/account-registry-trip.ts`
- `lib/traveller/account-registry-trip-copy.ts`
- `lib/readiness/reisende-aktionen.ts`
- `components/trips/KontoArbeitsbereich.tsx`

Tests may include:
- existing/new `lib/readiness/*party*.test.ts`
- `lib/traveller/account-registry-trip.test.ts`
- `lib/traveller/account-registry-trip-orchestrierung.test.ts`
- `lib/traveller/account-registry-trip-ui.test.ts`
- focused Requirements/Safety/Preparation integration tests proving the imported snapshot becomes applicable.

Lane docs only:
- this task
- `docs/REGISTRY_TRAVELLER_PREPARATION_SLOT_INTEGRATION_1_REPORT_2026-10-01.md`
- `docs/REGISTRY_TRAVELLER_PREPARATION_SLOT_INTEGRATION_1_HANDOFF_2026-10-01.md`
- `docs/REGISTRY_TRAVELLER_PREPARATION_SLOT_INTEGRATION_1_SELF_REVIEW_2026-10-01.md`

If a different runtime file is genuinely required, stop and report before widening scope.

## Parallel collision prohibition

Do NOT edit files owned by active lanes:
- #686 Source Catalog gateway, including source-catalog server files, its migration, `scripts/db/verwendung.mjs`, schema-reference tests;
- #687 Official Truth freshness/gap policy files.

Do NOT edit global continuity files in this parallel slice.

## Hard non-scope

No:
- Supabase migration/schema/RLS/grant change;
- Production or Development DB mutation;
- Official Truth source/evidence import;
- provider/OpenAI/web work;
- UI redesign unrelated to this defect;
- traveller-count auto-change;
- Account Registry mutation;
- sensitive passport numbers/MRZ/scans/biometrics/health;
- #626;
- public indexing/launch.

## Proof requirements

Add/adjust tests proving at minimum:
- canonical persisted `traveller:1` keeps slot 1;
- one random/fresh persisted trip traveller fills an empty applicable slot and keeps its own clientRef;
- multiple non-canonical snapshots fill remaining empty slots deterministically independent of input party order;
- headcount N yields exactly N applicable slots;
- extras beyond N remain non-applicable;
- imported snapshot citizenship/document facts are visible to Requirements/Preparation/Safety through applicable slots;
- empty slots still report missing nationality;
- all headcount slots occupied => Registry import stops before Registry read/write;
- absolute 20-cap still holds;
- existing travellers are never overwritten;
- no label-based merge;
- duplicate import does not silently become relevant beyond headcount;
- router refresh / current success behavior stays honest.

## Validation / stop

Run focused tests, full test suite, typecheck, lint, build, diff check.
Push one exact head, stay Draft, record session/model, wait for exact-head CI/Auth + Vercel Preview, STOP for independent TL review.
Cursor does not Ready, merge, mutate DB, or start a follow-up slice.
