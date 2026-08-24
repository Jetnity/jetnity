# Jetnity Account AP-3 – Self-Review

Stand: 24. August 2026  
Reviewer: implementierender Agent  
Gegateter Head: `c1ccfb6e02ffbf3125dced304980d1c801c4c47c`  
Runtime-Head (200-Hinweis): `ef370965`  
Ergebnis: **bereit für unabhängigen Technical-Lead-Re-Review – kein Ready, kein Merge**

## Auftragstreue

Hält `docs/ACCOUNT_AP3_TASK.md` und ADR-0160. ADR-0158 bleibt Admin Slice A. ADR-0159 bleibt Admin Slice B. Kein Archiv-Write, keine Migration/RLS, kein Auth-/Traveller-/Guest→Account-/Billing-Contract, kein Citizenship-Default, kein AP-4.

Branch `feat/account-ap3` ist auf `main` `e3bad749` rebased. Merge-Base ist genau dieser Commit.

## Adversarial

| Risiko | Befund |
| --- | --- |
| Datenverlust | `reisenLaden()` unverändert; Fehler bleibt Alert, Empty bleibt Empty. Kein Delete. |
| Falsche Datumsableitung | Dieselben `istAktiv`/`istKommend` wie die Übersicht. Vergangen nur nach Ausschluss, undatiert nie. |
| Locale/Timezone | Gruppen erst nach `heutigesDatum()`; UTC-Mitternacht-Tests wie ADR-0153. Reisekarte bleibt `timeZone: 'UTC'` für date-only-Anzeige. |
| Doppelmodell | Eine `TripSummary`-Liste, vier abgeleitete Arrays. Kein gespeicherter Lifecycle. |
| Stale UI | Client gruppiert nach Geräte-Kalendertag; erster Paint ungruppiert, ohne falsche Lage. |
| Empty/Error | Empty-Gruppe ist Text. Suche ohne Treffer ist Text. DB-Fehler bleibt `role=alert`. |
| 200-Grenze | Hinweis nur, wenn die geladene Liste die Grenze erreicht. Wortlaut behauptet keine weiteren gespeicherten Reisen. |
| Navigation | `ACCOUNT_NAVIGATION` unverändert; `/reisen` bleibt das Ziel. |
| Mobile/Desktop | Bestehendes Kartenraster, eine Suchzeile, Gruppen als Abschnitte. |
| Cross-Domain | Guest-Pfad unverändert. Admin/Provider/Traveller nicht angefasst. Zentraler Handoff behauptet Admin Slice B auf `main`, nicht zurückgespult. |
| Archiv | Kein Write, kein Filter. Bereits gespeichertes `archived` bleibt in der Datumsgruppe sichtbar. |

## Empfehlung

Unabhängiger Technical-Lead-Re-Review von Draft-PR #53 auf `c1ccfb6e`. Danach erst Product-Owner-Entscheidung. AP-4 nicht starten.
