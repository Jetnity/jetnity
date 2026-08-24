# Jetnity – Provider Readiness S3 Status

Stand: 24. August 2026
Status: **ADR-0161-Umnummerierung auf dem Branch; Draft-PR #54; Exact-Head-Gates müssen auf dem neuen Tip neu bewiesen werden; kein Mark Ready / kein Merge**
Branch: `feat/provider-mobility-rental-evidence-s3`
Draft-PR: `#54`
ADR: ADR-0161  
Basis: `origin/main` @ `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267`

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

- Functional runtime head: `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`
- Vorheriger docs-only Tip: `b230104b58fd2096b0ff8c2576324cc8655d9bc4`
- Review-Tip nach ADR-0161-Umnummerierung: aktueller Branch-HEAD / PR #54
- Draft-PR: https://github.com/Jetnity/jetnity/pull/54
- Basis: `origin/main` @ `1ec93cc9`

## 3. Umgesetzt

- `MobilityNachweis` / `RentalCarNachweis` analog Hotel/S2, mit eigener fachlicher Form
- Mobility-Kontext: Orte, Place-IDs, Datum, Modus, Reisende, Währung
- Rental-Kontext: Stationen, Zeitraum, Klasse, Getriebe, Währung
- `mobilityNachweisAusUmgebung()` / `rentalCarNachweisAusUmgebung()` bleiben `null`
- Katalog-Doubles nur für Tests
- Konto-Übernahme prüft Nachweis + serverseitigen Suchkontext; Produktionsweg fail-closed
- Workspace: kein Auto-Search mehr; Button «Verbindungen prüfen»
- keine neue Migration

## 4. Nicht gebaut

- echter Adapter, API-Key, Vertrag, Production-Aktivierung
- Rental-Such-UI
- Graph-/Route-/Traveller-Rewrite
- Universal-Offer-Modell
- S2-artige DB-Guards für transfer/rental_car

## 5. Gates auf Functional Runtime Head `e284af55`

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

## 6. Offener Residual

`reise_anlegen` und direkte `trip_items`-Writes können für `transfer` / `rental_car` weiterhin Preis, Provider, External-Ref und Booking-URL aus JSON übernehmen. Evidence wird auf `user` gesetzt. Das ist kein Provider-Übernahmeweg. S3 erfindet dafür keine Migration. Ein späterer trusted Write braucht einen eigenen Auftrag.

S2 Development-Migrationen `20260824160000` und `20260824180000` bleiben nicht Production-approved. Production endet bei `20260824140000`.

## 7. Nächster Schritt

1. ADR-0161 ist die verbindliche S3-Nummer. ADR-0159 bleibt Admin Slice B / PR #46 vorbehalten.
2. Exact-Head-Gates auf dem Tip nach dieser Umnummerierung neu beweisen (lokal + GitHub Actions + Vercel READY, dieselbe SHA).
3. Danach STOPP für unabhängigen Technical-Lead-Review. Nicht Mark Ready, nicht mergen, nicht S4, Production nicht migrieren.
