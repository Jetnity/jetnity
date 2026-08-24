# Jetnity – Provider Readiness S3 Self-Review

Stand: 24. August 2026
Branch: `feat/provider-mobility-rental-evidence-s3`
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
| Auto-Search bei Workspace-Render/Tab | kein Request; nur Button |
| Flight/Hotel/Activity | unveränderte S1/S2-Verträge grün |
| Secrets in Fehlern | feste Meldungen, keine Token/Keys |
| DB-/RPC-Bypass für transfer/rental Handelsfelder | Residual, bewusst keine S3-Migration |

## Residual, nicht in S3 geschlossen

`reise_anlegen` und der `authenticated`-Tabellenvertrag können für `transfer` / `rental_car` Preis/Provider/Ref/URL aus JSON schreiben und Evidence auf `user` setzen. Das ist User-Intake, kein Provider-Nachweis. Ein S2-artiges Guard wäre eine eigene DB-/RLS-/SECURITY-DEFINER-Entscheidung und wurde nicht gebaut.

## Pflichtregressionen

Lokale Nachweis-, Übernahme-, Schema-, Suche- und S1/S2-Contract-Tests sind grün. Volle Gates und Exact-Head CI/Vercel werden nach Commit nachgezogen und hier nicht vorweggenommen.
