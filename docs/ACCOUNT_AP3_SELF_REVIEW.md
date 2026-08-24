# Jetnity Account AP-3 – Self-Review

Stand: 24. August 2026  
Reviewer: implementierender Agent  
Runtime-Head: `612d819ed9691f93cbab97128e301b0b7744721b`  
Ergebnis: **bereit für unabhängigen Technical-Lead-Review – kein Ready, kein Merge**

## Auftragstreue

Hält `docs/ACCOUNT_AP3_TASK.md` und ADR-0160. ADR-0158 bleibt Admin Slice A. Kein Archiv-Write, keine Migration/RLS, kein Auth-/Traveller-/Guest→Account-/Billing-Contract, kein Citizenship-Default, kein AP-4.

## Adversarial

| Risiko | Befund |
| --- | --- |
| Datenverlust | `reisenLaden()` unverändert; Fehler bleibt Alert, Empty bleibt Empty. Kein Delete. |
| Falsche Datumsableitung | Dieselben `istAktiv`/`istKommend` wie die Übersicht. Vergangen nur nach Ausschluss, undatiert nie. |
| Locale/Timezone | Gruppen erst nach `heutigesDatum()`; UTC-Mitternacht-Tests wie ADR-0153. Reisekarte bleibt `timeZone: 'UTC'` für date-only-Anzeige. |
| Doppelmodell | Eine `TripSummary`-Liste, vier abgeleitete Arrays. Kein gespeicherter Lifecycle. |
| Stale UI | Client gruppiert nach Geräte-Kalendertag; erster Paint ungruppiert, ohne falsche Lage. |
| Empty/Error | Empty-Gruppe ist Text. Suche ohne Treffer ist Text. DB-Fehler bleibt `role=alert`. |
| Navigation | `ACCOUNT_NAVIGATION` unverändert; `/reisen` bleibt das Ziel. |
| Mobile/Desktop | Bestehendes Kartenraster, eine Suchzeile, Gruppen als Abschnitte. |
| Cross-Domain | `uebernahme.test.ts` grün. Gast unverändert. Admin/Provider/Traveller nicht angefasst. |
| Archiv | Kein Write, kein Filter. Bereits gespeichertes `archived` bleibt in der Datumsgruppe sichtbar. |

## Empfehlung

Unabhängiger Technical-Lead-Review von Draft-PR #53 auf `612d819e`. Danach erst Product-Owner-Entscheidung. AP-4 nicht starten.
