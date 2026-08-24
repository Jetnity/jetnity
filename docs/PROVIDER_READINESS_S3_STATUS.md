# Jetnity – Provider Readiness S3 Status

Stand: 24. August 2026
Status: **Current-Main-Sync auf `e3bad749`; Draft-PR #54; Exact-Head-Gates auf dem Sync-Tip neu beweisen; kein Mark Ready / kein Merge**
Branch: `feat/provider-mobility-rental-evidence-s3`
Draft-PR: `#54`
ADR: ADR-0161  
Basis: `origin/main` @ `e3bad749c8e03512001e7bccd5e08467f10a7134`

## 1. Was S3 ist

S3 hebt Mobility- und Rental-Nachweis auf dieselbe Trust-Grenze wie Hotel und S2 FlugNachweis:

- async `nachweisen({ optionId, kontext })`
- Browser sendet nur `tripId` + `optionId`
- Testkatalog nur injiziert
- Umgebung bleibt `null` → Übernahme fail-closed
- keine `booking_url`
- Mobility-Suche im Workspace nur nach ausdrücklicher Nutzeraktion

Kein echter Mobility- oder Rental-Provider. Keine Secrets. Keine kostenpflichtigen Calls. Keine Production-Migration. Kein S4–S8.

## 2. Runtime-Head

- Functional S3 runtime head: `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`
- ADR-0161-Umnummerierung: `2e9a1a7ff0d8ccef6945cbc70aa3833743d076f1`
- Current-Main-Sync-Tip: aktueller Branch-HEAD / PR #54 nach Merge von `e3bad749`
- Draft-PR: https://github.com/Jetnity/jetnity/pull/54
- Basis: `origin/main` @ `e3bad749`

S3-Runtime-Dateien (`lib/mobility/*`, `lib/rental-cars/*`, `components/trips/MobilitaetBereich.tsx`) wurden beim Sync nicht geändert. Konflikte betrafen nur zentrale Doku. UI-Audit daher nicht erneut; Nachweis bleibt 1014/1014 auf `e284af55`.

## 3. Umgesetzt

- `MobilityNachweis` / `RentalCarNachweis` analog Hotel/S2, mit eigener fachlicher Form
- Mobility-Kontext: Orte, Place-IDs, Datum, Modus, Reisende, Währung
- Rental-Kontext: Stationen, Zeitraum, Klasse, Getriebe, Währung
- `mobilityNachweisAusUmgebung()` / `rentalCarNachweisAusUmgebung()` bleiben `null`
- Katalog-Doubles nur für Tests
- Konto-Übernahme prüft Nachweis + serverseitigen Suchkontext; Produktionsweg fail-closed
- Workspace: kein Auto-Search mehr; Button «Verbindungen prüfen»
- keine neue Migration
- Branch auf Current Main inkl. Admin Slice B (ADR-0159) synchronisiert

## 4. Nicht gebaut

- echter Adapter, API-Key, Vertrag, Production-Aktivierung
- Rental-Such-UI
- Graph-/Route-/Traveller-Rewrite
- Universal-Offer-Modell
- S2-artige DB-Guards für transfer/rental_car

## 5. Gates auf Functional S3 Runtime Head `e284af55`

| Gate | Ergebnis |
| --- | --- |
| TypeScript | **pass** |
| Lint | **pass**, 0 warnings |
| `npm test` | **1849/1849 pass** |
| `check:dead` / `check:exports` / `check:deps` | **pass** |
| `check:api-schutz` | **pass**, 10 Admin-Routen |
| `check:schema-bezug` | **pass** |
| Production Build | **Exit 0**, 49 App-Routen inkl. `/api/mobility/search` und `/api/rental-cars/search` |
| Trip-Workspace-UI-Audit | **1014/1014, 0 Fehler, WebKit + Chromium, 8 Viewports** |
| GitHub Actions `ci.yml` | **SUCCESS** `32750893324` auf `e284af55` |
| Vercel Preview | **READY/SUCCESS** `GWiY7wxgazEfqL2PZSP2eWskoVcK` auf `e284af55` |

Auf ADR-0161-Tip `2e9a1a7f`: lokale Gates pass, `npm test` 1849/1849, GitHub Actions SUCCESS `32752931378`, Vercel SUCCESS `HErGVCe9HAKP1o9ymraV5xDd8i9P`.

Current-Main-Sync-Gates stehen auf dem neuen Tip aus.

## 6. Offener Residual

`reise_anlegen` und direkte `trip_items`-Writes können für `transfer` / `rental_car` weiterhin Preis, Provider, External-Ref und Booking-URL aus JSON übernehmen. Evidence wird auf `user` gesetzt. Das ist kein Provider-Übernahmeweg. S3 erfindet dafür keine Migration. Ein späterer trusted Write braucht einen eigenen Auftrag.

S2 Development-Migrationen `20260824160000` und `20260824180000` bleiben nicht Production-approved. Production endet bei `20260824140000`.

## 7. Nächster Schritt

1. Exact-Head-Gates auf dem Current-Main-Sync-Tip beweisen.
2. STOPP für unabhängigen Technical-Lead-Re-Review. Nicht Mark Ready, nicht mergen, nicht S4, Production nicht migrieren.
