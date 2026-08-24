# Jetnity – Provider Readiness S3 Status

Stand: 24. August 2026
Status: **Current-Main-Sync auf `8326e72f`; Draft-PR #54; Exact-Head-Gates auf dem Sync-Tip neu beweisen; kein Mark Ready / kein Merge**
Branch: `feat/provider-mobility-rental-evidence-s3`
Draft-PR: `#54`
ADR: ADR-0161  
Basis: `origin/main` @ `8326e72f9557a8b9b200e680b0be24aefa0bdfa8`

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
- Vorheriger Sync auf Admin B: `f6b85570049a20146544e4f85503d6ff2c9703b4`
- Current-Main-Sync-Tip: aktueller Branch-HEAD / PR #54 nach Merge von `8326e72f`
- Draft-PR: https://github.com/Jetnity/jetnity/pull/54
- Basis: `origin/main` @ `8326e72f`

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
- Branch auf Current Main inkl. Admin Slice C (ADR-0162) und Account AP-3 (ADR-0160) synchronisiert

## 4. Nicht gebaut

- echter Adapter, API-Key, Vertrag, Production-Aktivierung
- Rental-Such-UI
- Graph-/Route-/Traveller-Rewrite
- Universal-Offer-Modell
- S2-artige DB-Guards für transfer/rental_car

## 5. Historische Gates

Functional S3 Runtime Head `e284af55`: lokale Gates pass, UI-Audit 1014/1014, GitHub Actions SUCCESS `32750893324`, Vercel READY `GWiY7wxgazEfqL2PZSP2eWskoVcK`.

Admin-B-Sync `f6b85570`: lokale Gates pass, `npm test` 1863/1863, GitHub Actions SUCCESS `32762113958`, Vercel SUCCESS `EreSw6u5vc1GKnojDNGbWnNtvzG5`.

Current-Main-Sync-Gates auf dem neuen Tip stehen aus.

## 6. Offener Residual

`reise_anlegen` und direkte `trip_items`-Writes können für `transfer` / `rental_car` weiterhin Preis, Provider, External-Ref und Booking-URL aus JSON übernehmen. Evidence wird auf `user` gesetzt. Das ist kein Provider-Übernahmeweg. S3 erfindet dafür keine Migration. Ein späterer trusted Write braucht einen eigenen Auftrag.

S2 Development-Migrationen `20260824160000` und `20260824180000` bleiben nicht Production-approved. Production endet bei `20260824140000`.

## 7. Nächster Schritt

1. Exact-Head-Gates auf dem Current-Main-Sync-Tip beweisen.
2. STOPP für unabhängigen Technical-Lead-Re-Review. Nicht Mark Ready, nicht mergen, nicht S4, Production nicht migrieren.
