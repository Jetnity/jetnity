# Jetnity – AP-10-S1 Confirmed Booking Folder Self-Review

Stand: 30. August 2026  
Autor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 23`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS  
Run: https://cursor.com/agents/bc-ec79a6cd-8076-4ec4-a130-249f9f650420

## 1. Auftrag gegen Diff

Geprüft gegen den tatsächlichen Dateisatz auf `feat/ap10-s1-confirmed-booking-folder-2026-08-30`, Merge-Base `main @ 30c0493c`, behind 0.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Zweite Booking-Truth? | Nein. `kannBuchungMarkieren` + `istGebucht` aus `lib/trips/buchung.ts`. |
| Wird `unconfirmed` als Buchung gezeigt? | Nein. Filter und Tests weisen das aus. |
| Kommen `activity`/`note` in die Liste? | Nein. Vertrag und Abbildung lassen sie aus. |
| Werden archivierte Reisen still versteckt? | Nein. Eigene Gruppe + Badge `Archiviert`. |
| Fünfter Account-Tab? | Nein. `ACCOUNT_NAVIGATION` unverändert vier Punkte. `/account/bookings` aktiviert keinen Rail-Punkt. |
| Zweites Workspace-Dashboard auf `/account`? | Nein. Nur Secondary-Link. |
| Empty = Error? | Nein. Leere Abbildung vs. `problemAus` / unvollständige Zeile. |
| Preise / Partner / Deeplinks? | Nein. Weder Select noch UI. |
| Service Role / `user_id`-Filter / Write? | Nein. |
| Traveller-/Document-PII? | Nein. Nicht gelesen. Traveller-Kontext bewusst **nicht relevant**. |
| N+1 über alle Reisen? | Nein. Eine `trip_items`-Abfrage mit `trips!inner`. |
| Stilles Abschneiden? | Nein. Limit 200 + `count` + sichtbarer Unvollständig-Hinweis. |
| DB/Migration/RLS/S5-B/Payments/AP-6–12? | Nein. |
| Globale Continuity-Dateien? | Nein. |
| Ready / Merge / Folgeslice? | Nein. |

## 3. Aggregationsbegründung

`trip_items` ist die natürliche Quelle: S1 aggregiert Items, nicht Reisen. Der bestehende `trips`-Listenpfad wäre N+1 oder ein zu breiter Graph. Der Composite-FK `trip_items_reise_fk` erlaubt ein inner Embed der benötigten Trip-Fakten (`id`, `title`, `status`) in einer Abfrage. RLS auf beiden Tabellen bleibt die Ownership-Authority.

## 4. Residuals

- Kein authentifiziertes Preview-/Production-Konto in dieser Session; Live-Datenpfad daher nur Source-/Gate-Evidence, kein eingeloggter Klick.
- 280 px Overflow auf `/login` ist vorbestehend und ausserhalb des Slices.
- `/account/bookings` hat bewusst keinen aktiven Rail-Tab, weil Übersicht kein Präfix-Match sein darf.
- Exact-Head CI/Vercel nach diesem Docs-Stamp live prüfen.

## 5. Urteil

Der Slice bleibt im autorisierten read-only Rahmen. Lokale Gates sind grün.

**Unabhängiger Technical-Lead Exact-Head-Review: ausstehend. Dieses Self-Review ist kein PASS.**
