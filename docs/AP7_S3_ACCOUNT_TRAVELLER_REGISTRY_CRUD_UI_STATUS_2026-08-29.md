# Jetnity – AP-7-S3 Account Traveller Registry CRUD / UI Status

Stand: 29. August 2026  
Status: **IMPLEMENTED ON BRANCH / LOCAL GATES GREEN / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Issue: #214  
Draft-PR: #215  
Cursor-Agent: `Account plattform audit vorbereitung 17`

## Baseline and authorization

- Task: `docs/AP7_S3_ACCOUNT_TRAVELLER_REGISTRY_CRUD_UI_TASK_2026-08-29.md`
- Slice-cut baseline: `main @ b2857117741aad47a2bca3d198e5a0a88b4a0415`
- `origin/main` re-fetched before this stamp: **`b2857117741aad47a2bca3d198e5a0a88b4a0415`**
- Ahead / behind `origin/main`: **this stamp / 0**
- Binding Dual-Authority: Account Registry = reusable current facts; Trip Snapshot = only Current Truth of a concrete trip
- Persistence/RLS authority remains AP-7-S2; this slice adds no migration

## Implemented

Authenticated owner surface `/account/travellers` on the existing S2 tables:

- compact Account-Navigation now includes `Reisende` because the route exists;
- list / create / update label+residence / delete traveller;
- add/remove multiple citizenships, UI 8-limit + DB backstop, duplicate-country rejected;
- add/update/remove document metadata, UI 12-limit + DB backstop;
- issuer and citizenship independently selectable; document→citizenship relation starts empty and may stay null;
- deleting a citizenship keeps document metadata and clears only the relation;
- delete copy states that existing trip snapshots are not rewritten or deleted;
- loading / empty / error remain distinct statements;
- no Service Role, no privileged Registry API, no Registry→Trip button, no Guest import.

`types/supabase.ts` was aligned to the already-production S2 catalog so `.from('account_travellers*')` passes `check:schema-bezug`. That is not a schema change. A later `db:typen` against Development/Production should confirm the generated file.

## Files

Runtime / UI:

- `app/account/travellers/page.tsx`
- `app/account/travellers/loading.tsx`
- `components/account/AccountReisende.tsx`
- `components/account/AccountReisendeKarte.tsx`
- `components/account/AccountNavigation.tsx`
- `lib/account/navigation.ts`
- `lib/traveller/account-registry.ts` (exported existing label/land readers only)
- `lib/traveller/account-registry-copy.ts`
- `lib/traveller/account-registry-eingabe.ts`
- `lib/traveller/account-registry-abbildung.ts`
- `lib/traveller/account-registry-meldung.ts`
- `lib/traveller/account-registry-anzeige.ts`
- `lib/traveller/account-registry-daten.ts`
- `lib/traveller/account-registry-aktionen.ts`
- `types/supabase.ts` (S2 table typings only)

Tests:

- `lib/account/navigation.test.ts`
- `lib/traveller/account-registry-eingabe.test.ts`
- `lib/traveller/account-registry-abbildung.test.ts`
- `lib/traveller/account-registry-meldung.test.ts`
- `lib/traveller/account-registry-ui.test.ts`

Slice docs:

- this status
- `docs/AP7_S3_ACCOUNT_TRAVELLER_REGISTRY_CRUD_UI_SELF_REVIEW_2026-08-29.md`
- `docs/AP7_S3_ACCOUNT_TRAVELLER_REGISTRY_CRUD_UI_HANDOFF_2026-08-29.md`

Not changed: migrations, RLS, grants, trip traveller tables, Auth/MFA/AAL, `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`.

## Local gates

Verified in this authoring environment on the implementation head before this stamp, then re-checked for the unused-export date test:

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **2689/2689 pass, 0 fail** |
| Focused S3 + navigation + S1 registry tests | pass |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| `npm run lint` | **0 errors** (bestehende Repo-Warnings unverändert) |
| `check:dead` | nur begründete CookieConsent-Ausnahme |
| `check:exports` | 0 unbegründete Exporte |
| `check:deps` | sauber |
| `check:api-schutz` | 12/12 Admin-Routen |
| `check:schema-bezug` | pass; 21 Tabellen/Views inkl. S2 Registry |
| `npm run build` | pass; Route `ƒ /account/travellers` vorhanden |

GitHub Actions + Vercel Preview must be read on the **exact head of this stamp**, not on an earlier implementation commit.

## Hard non-scope held

No new migration/schema/RLS/grant/ownership change. No Service Role / admin / support bypass. No Auth/Session/MFA/AAL change. No Registry→Trip runtime. No Guest→Registry import. No `trip_traveller*` change. No default/primary/chosen credential. No passport numbers, scans, MRZ, biometrics, DOB or health fields. No Provider/TW-8/Payments/AP-8/Branch Protection/Public Launch. No follow-up slice started.

## Residuals

- No authenticated browser or real-device walkthrough in this environment. Unauthenticated `/account/*` remains proxy-gated to `/login`.
- `types/supabase.ts` is hand-aligned to live S2 tables; `db:typen --pruefen` was not run (requires DB secrets).
- Account registry has no S2 max-traveller-count; the UI lists all owner rows.
- Domain label reader and DB label check still differ slightly on substring vs word-boundary (`Reisepass`); pre-existing S1/S2 contract, not changed here.

## Exact next step

Independent ChatGPT / Technical-Lead review of the exact PR head: diff, scope proof, local gates, GitHub Actions, Vercel Preview, review threads. Cursor does not mark Ready and does not merge.
