# Jetnity – Provider Readiness S3 Status

Stand: 24. August 2026
Status: **Implementierung auf Feature-Branch; lokale Nachweis-/Übernahme-Tests grün; volle Gates und Exact-Head-CI/Vercel folgen; kein Mark Ready / kein Merge**
Branch: `feat/provider-mobility-rental-evidence-s3`
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

Wird nach Commit/Push auf den Exact Head dieses Branches gesetzt.

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

## 5. Offener Residual

`reise_anlegen` und direkte `trip_items`-Writes können für `transfer` / `rental_car` weiterhin Preis, Provider, External-Ref und Booking-URL aus JSON übernehmen. Evidence wird auf `user` gesetzt. Das ist kein Provider-Übernahmeweg. S3 erfindet dafür keine Migration. Ein späterer trusted Write braucht einen eigenen Auftrag.

## 6. Nächster Schritt

Volle lokale Gates, Draft-PR, Exact-Head CI + Vercel, danach STOPP für unabhängigen Technical-Lead-Review.
