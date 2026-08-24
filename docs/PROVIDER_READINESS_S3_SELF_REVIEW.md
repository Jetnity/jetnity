# Jetnity – Provider Readiness S3 Self-Review

Stand: 24. August 2026
Branch: `feat/provider-mobility-rental-evidence-s3`
Draft-PR: `#54`
Functional Exact Head: `e284af5524e7a95bf47dca2f7b77bc4f5ed171e9`
Basis: `origin/main` @ `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267`

## Auftragstreue

S3 bleibt im Slice. Kein echter Provider, kein Secret, keine Production-Migration, kein Graph-Rewrite, keine Route-/Traveller-/Readiness-Truth, kein Universal-Offer, kein S4–S8.

## Adversarial

| Angriff | Ergebnis |
| --- | --- |
| Browser sendet volle Option + Preis + booking_url | Zod behält nur `tripId` / `optionId` |
| Unbekannte optionId | `unbekannt`, keine Persistenz |
| Tampered Katalogoption ohne Pflichtfelder | `invalid` |
| Kontext-Drift (Ort, Datum, Reisende, Währung, Klasse) | `geaendert` |
| Kein Adapter / Umgebung | `unavailable` |
| Produktionswrapper `*InKontoUebernehmen` | fail-closed, keine booking_url |
| Auto-Search bei Workspace-Render/Tab | kein Request; nur Button «Verbindungen prüfen» |
| Flight/Hotel/Activity | unveränderte S1/S2-Verträge grün |
| Secrets in Fehlern | feste Meldungen, keine Token/Keys |
| DB-/RPC-Bypass für transfer/rental Handelsfelder | Residual, bewusst keine S3-Migration |

## Residual, nicht in S3 geschlossen

`reise_anlegen` und der `authenticated`-Tabellenvertrag können für `transfer` / `rental_car` Preis/Provider/Ref/URL aus JSON schreiben und Evidence auf `user` setzen. Das ist User-Intake, kein Provider-Nachweis. Ein S2-artiges Guard wäre eine eigene DB-/RLS-/SECURITY-DEFINER-Entscheidung und wurde nicht gebaut.

## Pflichtregressionen

`npm test` 1849/1849. Flight-, Hotel-, Mobility-Suche- und S1-Cost-Guard-Tests bleiben grün. Trip-Workspace-UI-Audit 1014/1014, 0 Fehler, inkl. Nachweis dass Mobilität ohne Nutzeraktion keine Suche startet.

## Remote-Gate

GitHub Actions `32750893324` ist SUCCESS auf `e284af55`. Vercel Preview `GWiY7wxgazEfqL2PZSP2eWskoVcK` ist READY auf demselben Head. PR #54 bleibt Draft.

## Offene Review-Fragen

1. Ist fail-closed ohne Suchkontext-Speicher die richtige S3-Grenze, analog S2?
2. Soll der Residual `reise_anlegen`/direkte `trip_items`-Writes für transfer/rental_car ein eigener späterer Guard-Slice werden, oder erst mit Adapter-Gate?
3. Ist «Verbindungen prüfen» die richtige Kostengrenze, oder soll die Suche vollständig unsichtbar bleiben, bis ein Provider existiert?
