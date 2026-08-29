# Jetnity – AP-7-S3 Account Traveller Registry CRUD / UI Handoff

Stand: 29. August 2026  
Status: **AUTHORING COMPLETE / LOCAL GATES GREEN / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

## What is finished

AP-7-S3 macht die bereits produktive Account Traveller Registry für den eingeloggten Owner unter `/account/travellers` benutzbar.

- Owner-CRUD über authenticated Session + bestehende S2-RLS
- mehrere Staatsbürgerschaften und Dokument-Metadaten
- expliziter `issuer ≠ citizenship`
- nullable Document→Citizenship-Relation
- ehrliche Loading/Empty/Error-Zustände
- Navigation `Reisende` nur weil die Route existiert

Binding bleibt:

> Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
> Trip Snapshot = einzige Current Truth einer konkreten Reise.

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/215 |
| Branch | `feat/ap7-s3-account-traveller-registry-crud-ui-2026-08-29` |
| Baseline / `origin/main` | `b2857117741aad47a2bca3d198e5a0a88b4a0415` |
| Behind `origin/main` | **0** |
| Cursor-Agent | `Account plattform audit vorbereitung 17` |
| Cloud-Run | https://cursor.com/agents/bc-ad2d58ae-209c-413c-875c-d817d34861e7 |
| Gated implementation head | `376023b5502be495115119adb06cb16340317f16` |
| Exact Head | live an PR #215 prüfen; Runtime/UI ist der gated head oben |

## Scope proof

Vorhanden:

- `app/account/travellers`
- Registry-owned helpers in `lib/traveller/account-registry-*.ts`
- Tests für Navigation, Empty≠Error≠Loading, CRUD-Vertrag, 8/12-Limits, Duplicate, issuer/citizenship, SET NULL, Delete-Copy, sensitive-field boundary, Auth-Prefix

Abwesend / nicht angefasst:

- `supabase/migrations/*` neu
- `trip_travellers*`
- Service Role
- Registry→Trip Materialisierung
- Guest→Registry
- Auth/MFA/AAL
- Provider/TW-8/Payments

## Tests / Build

Lokal verifiziert:

- `npm test` 2689/2689
- Typecheck, Lint (0 errors), Hygiene, `check:schema-bezug`, Production Build mit Route `/account/travellers`

Exact-head remote gates on `376023b5502be495115119adb06cb16340317f16`:

- GitHub Actions [`33276012303`](https://github.com/Jetnity/jetnity/actions/runs/33276012303) **SUCCESS**
- Vercel Preview **SUCCESS / completed** (`8K9aEMNJGGzjE5Cs4nhZT48knA12`, deployment `6160277625`)
- Preview: https://jetnity-81qw6qi0s-jetnity-e1b93c82.vercel.app

Nicht verifiziert in dieser Umgebung:

- authentifizierter Browser-/Real-Device-Durchlauf

## Review protocol

1. Exact Head / Diff / Merge-Base gegen aktuelles `origin/main` prüfen (0 behind erwartet).
2. Runtime/UI, Tests und Slice-Docs reviewen; keine Schema-/RLS-Erweiterung verlangen, wenn der CRUD ohne sie sauber ist.
3. GitHub Actions + Vercel Preview auf dem exact head prüfen.
4. 0 unresolved review threads.
5. PASS nur durch unabhängigen Technical Lead. Cursor markiert nicht Ready und merged nicht.

Jeder neue Code-Commit invalidiert frühere exact-head gates. Immediate CHANGES-REQUIRED-Fixes bleiben in derselben Agent-Session und im S3-Scope.

## Residuals / Empfehlungen

1. **Preview-Klick / Real Device** – mobile 2×2-Navigation, Focus und Delete-Dialog am echten Account prüfen.
2. **`db:typen --pruefen`** – hand-aligned S2-Typen gegen Development/Production bestätigen, sobald Secrets verfügbar sind.
3. **Kein automatischer Folgeslice.** Registry→Trip bleibt ein eigener, gegateter Slice.

Keine Production-/Supabase-Mutation durch diesen Slice.
