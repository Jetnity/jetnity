# Jetnity – Provider Ops S1 Status

Stand: 24. August 2026  
Status: **IMPLEMENTIERT / lokal gegatet / Draft-PR #47 / wartet auf Exact-Head CI + Vercel + unabhängigen Technical-Lead-Review**  
Branch: `feat/provider-ops-s1`  
Auftrag: `docs/PROVIDER_OPS_S1_TASK.md`

## 1. Was S1 ist

S1 führt einen **minimalen gemeinsamen Operationsvertrag** ein. Fachdomänen, Truth-Modelle und Provideradapter bleiben getrennt.

Kein Mark Ready. Kein Merge. Keine Provideraktivierung. Keine Secrets. Keine kostenpflichtigen Calls. Keine DB-/Production-Migration. Kein Start von S2.

## 2. Runtime-Head

- Implementierungs-Commit: `66413cf9`
- Dieser Status gehört zum nachfolgenden Dokumentations-Commit auf demselben Branch.
- Base: `main` @ `e4f4cca75e55028fab231c1827abf6236ae30eec`
- Draft-PR: https://github.com/Jetnity/jetnity/pull/47

## 3. Umgesetzt

- `lib/provider-ops/*`: Outcome-Taxonomie, JSON-Request-Härtung, Kill-Switch-Form, In-Memory-Cost-Guard, Observability-Typ ohne Persistenz
- dünne Domain-Wrapper in Flights, Hotels, Activities, Mobility, Rental Cars, Readiness, Safety, Seasonal
- Flights-Search auf Hotel-Request-Härtung gehoben: Content-Type 415, Content-Length 413, Stream-Cap, JSON-Parse, `Retry-After` bei 429, `cache-control: no-store`
- Seasonal-Rate-Limit-Algorithmus unverändert (nur gemeinsame IP-Kennung)

## 4. Bewusst nicht geändert

- kein `FlugNachweis` (S2)
- kein Mobility-/Rental-Nachweis-Umbau (S3)
- keine Readiness-/Safety-/Seasonal-Truth und keine neuen Flags (S4)
- keine Offer-Provenance / kein Duffel-`currency` (S5)
- kein persistenter Cost Guard (S6)
- keine Observability-Persistenz / kein Admin-Health (S7)
- Mobility-/Rental-Timeout bleibt HTTP 504 (Public-Contract-Restpunkt)
- Account AP-1 und Admin Slice A unberührt

## 5. Lokale Gates auf `66413cf9`

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **1726/1726 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** (keine Warnings) |
| `npm run check:dead` | **pass** (1 bewusste Ausnahme: CookieConsent) |
| `npm run check:exports` | **pass** (0 unbenutzte Exporte) |
| `npm run check:deps` | **pass** |
| `npm run check:schema-bezug` | **pass** |
| `npm run check:api-schutz` | **pass** (10 Admin-Routen) |
| `npm run build` | **pass** (Exit 0; vorbestehende Supabase-Edge-Warnings) |

Remote Exact-Head-Gates (GitHub Actions + Vercel READY) gehören zum Dokumentations-Head und sind in `docs/PROVIDER_OPS_S1_HANDOFF.md` nachzutragen, sobald sie verifiziert sind.

## 6. Empfehlung

Unabhängiger Technical-Lead-Review gegen den Exact Head dieses Draft-PRs. Kein Mark Ready und kein Merge ohne aktuelle Product-Owner-Freigabe.
