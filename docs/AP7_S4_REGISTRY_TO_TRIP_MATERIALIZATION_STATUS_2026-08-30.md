# Jetnity – AP-7-S4 Registry → Trip Snapshot Materialization Status

Stand: 30. August 2026  
Status: **IMPLEMENTED ON BRANCH / LOCAL GATES GREEN / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Issue: #222  
Draft-PR: #223  
Cursor-Agent: `Account plattform audit vorbereitung 18`

## Baseline and authorization

- Task: `docs/AP7_S4_REGISTRY_TO_TRIP_MATERIALIZATION_TASK_2026-08-30.md`
- Slice-cut baseline: `main @ b6ec2e431a3d92cc7b5fd4fdc0857d7f8fe4072e`
- `origin/main` re-fetched before this stamp: **`b6ec2e431a3d92cc7b5fd4fdc0857d7f8fe4072e`**
- Ahead / behind `origin/main`: **implementation + this evidence stamp / 0**
- Binding Dual-Authority: Account Registry = reusable current facts; Trip Snapshot = only Current Truth of a concrete trip
- Persistence/RLS authority remains AP-7-S2; this slice adds no migration

## Implemented

Authenticated owner can explicitly copy one saved Account Registry traveller into one concrete trip as a new independent snapshot.

Runtime:

- existing S2/S3 owner-only Registry read via `registryMitClientLaden` / `registryLaden`;
- existing AP-7-S1 projection `accountRegistryTravellerProjektieren` through `registryTravellerAlsFrischenTripSnapshot`;
- fresh trip-owned UUIDs/clientRefs for traveller, every citizenship and every document;
- Document→Citizenship remapped onto the new trip-owned citizenship clientRefs;
- existing atomic `party_schreiben` write path in `reisende-aktionen.ts`;
- party slot limit checked before write;
- fail-closed on invalid input, missing/unauthorized registry or trip, invalid projection, write error.

Product surface:

- smallest account-only panel in Reisendenkontext: „Gespeicherten Reisenden hinzufügen“;
- display-safe facts only (label, residence, all citizenships equally, all document metadata equally);
- no auto-select, no first-item/default credential;
- explicit per-person action plus confirmation;
- Loading / Empty / Error / Success / Limit are distinct statements;
- copy states that a trip-owned copy is created and later Registry edits/deletes do not rewrite the trip.

Guest workspace is unchanged and has no Registry→Trip control.

## Files

Runtime / UI:

- `lib/traveller/account-registry-trip.ts`
- `lib/traveller/account-registry-trip-copy.ts`
- `lib/traveller/account-registry-daten.ts` (shared owner read helper)
- `lib/readiness/reisende-aktionen.ts` (`registryTravellerInReiseUebernehmen`)
- `components/trips/RegistryReiseUebernahme.tsx`
- `components/trips/KontoArbeitsbereich.tsx`
- `components/trips/Reisevorbereitung.tsx`
- `components/trips/TripWorkspace.tsx`
- `app/(public)/reisen/[tripId]/page.tsx`

Tests:

- `lib/traveller/account-registry-trip.test.ts`
- `lib/traveller/account-registry-trip-ui.test.ts`
- `lib/readiness/p2-ta04-write-path-inventory.test.ts`

Slice docs:

- this status
- `docs/AP7_S4_REGISTRY_TO_TRIP_MATERIALIZATION_SELF_REVIEW_2026-08-30.md`
- `docs/AP7_S4_REGISTRY_TO_TRIP_MATERIALIZATION_HANDOFF_2026-08-30.md`

Not changed: migrations, RLS, grants, Auth/MFA/AAL, `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`.

## Local gates

Verified in this authoring environment on the implementation head `02fccb13e0d0d13799bcff53079423aefc538422` before this stamp:

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **2704/2704 pass, 0 fail** |
| Focused S4 + S1 + S3 UI + write-path inventory | pass |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| `npm run lint` | **0 errors** (bestehende Repo-Warnings unverändert) |
| Changed-file eslint `--max-warnings=0` excluding pre-existing TripWorkspace warnings | pass |
| `check:dead` | nur begründete CookieConsent-Ausnahme |
| `check:exports` | 0 unbegründete Exporte |
| `check:deps` | sauber |
| `check:api-schutz` | 12/12 Admin-Routen |
| `check:schema-bezug` | pass; keine neue Schema-Struktur |
| `npm run build` | pass; Route `ƒ /reisen/[tripId]` vorhanden |

Exact-head remote GitHub Actions / Vercel on the final docs stamp must be live-verified by the independent reviewer. This authoring run does not claim CI or Vercel for the stamp commit.

## Hard non-scope held

No new migration/schema/RLS/grant/ownership change. No Production/Development Supabase mutation. No Service Role / admin / support bypass. No Auth/Session/MFA/AAL change. No Guest→Registry import/dedup. No Registry→Trip live FK/provenance. No default/primary/chosen credential. No passport numbers, scans, MRZ, biometrics, DOB or health fields. No Provider/TW-8/Payments/Homepage/Collaboration/AP-8/Branch Protection/Public Launch. No follow-up slice started.

## Residuals

- No authenticated browser or real-device walkthrough in this environment. Unauthenticated `/reisen/<uuid>` and `/account/*` remain auth-gated.
- The new panel lives inside the existing Reisendenkontext / „Vorbereitung öffnen“ surface. That is the smallest correct insertion; it is not a Workspace redesign.
- Re-adding the same Registry person creates another independent snapshot by design. There is no silent dedup and no label-based warning.
- `party_schreiben` persists clientRefs and lets the database generate row IDs. S1 snapshot IDs remain the in-memory identity contract; this is the existing write path, not a new schema.

## Exact next step

Independent ChatGPT / Technical-Lead review of the exact PR head: diff, scope proof, local gates, GitHub Actions, Vercel Preview, review threads. Cursor does not mark Ready and does not merge.
