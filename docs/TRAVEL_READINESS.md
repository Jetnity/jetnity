# Jetnity – Travel Readiness (Foundation C)

Stand: 22. August 2026  
Status: Draft-PR #32, nicht gemergt, kein Production-Schema  
Branch: `feat/travel-readiness-foundation`

## Ziel

Jetnity versteht nicht nur Flug, Unterkunft, Aktivitäten und Mobilität, sondern auch, ob eine Reise **vorbereitet** ist.

Foundation C liefert den belastbaren Unterbau dafür – ohne so zu tun, als seien Visa- oder Einreiseanforderungen bereits geprüft.

Verbindlicher Leitsatz:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Bei Unsicherheit gilt: `unknown` bleibt `unknown`.

## Zwei Wahrheiten

Foundation C vermischt niemals:

1. **Official Requirement Truth** – was eine vertrauenswürdige offizielle Quelle für diese Reise wirklich verlangt. Ohne Provider immer `unknown` / `unavailable` / `insufficient_context`.
2. **User Preparation Truth** – was der Nutzer selbst als offen, erledigt oder nicht relevant markiert hat. Das ist User Evidence, keine Bestätigung.

Ein Nutzer-Häkchen darf niemals als „Visum passt“ oder „Einreise geprüft“ erscheinen.

Zulässig:

> 4 von 5 Vorbereitungspunkten erledigt · Einreiseanforderungen noch nicht offiziell geprüft

Unzulässig:

> Deine Reise ist bereit

solange offizielle Anforderungen unbekannt sind.

## Was Foundation C speichert

Nur den Nutzer-Vorbereitungsstand in einer eigenen Tabelle `trip_readiness_items`.

Kein neuer `trip_items.kind`. Readiness ist kein Tagesplanpunkt und keine Buchung.

Felder:

- `client_ref` – idempotente Client-Identität
- `kind` – `entry_check`, `visa_check`, `travel_document_check`, `insurance_check`, `ticket_confirmation_check`, `booking_confirmation_check`, `preparation`
- `user_status` – `open`, `done`, `skipped`
- `evidence` – nur `user`
- `country_code` – nur ISO-3166-1-alpha-2, sonst null
- `trip_item_id` – optional, dieselbe Reise / derselbe Eigentümer
- `title` – nur bei `preparation`, max. 80 Zeichen
- `context_fingerprint` – deterministischer Reisekontext
- `created_at` / `updated_at`

Keine Spalten für Passnummer, Ausweis, Geburtsdatum, Nationalität, Wohnsitz, Visumnummer, Gesundheit oder Dateipfade.

## Context-Fingerprint

Der Server berechnet den Fingerprint aus vertrauenswürdigen Trip-Fakten. Der Browser darf ihn im Konto nicht setzen.

| Art | Felder im Fingerprint |
| --- | --- |
| `entry_check`, `visa_check`, `travel_document_check` | kind, countryCode, startDate, endDate, travellers, destinationCountries |
| `insurance_check` | kind, startDate, endDate, travellers, destinationCountries, rentalCarPresent |
| `ticket_confirmation_check`, `booking_confirmation_check` | kind, tripItemId, itemKind, bookingStatus, startsOn, endsOn, originPlaceId, destinationPlaceId |
| `preparation` | kind, normalisierter title, startDate, endDate, travellers, destinationCountries |

Wenn der gespeicherte Fingerprint nicht mehr passt: `stale` / „Erneut prüfen“.  
Wenn das Zielland oder der gebuchte Planpunkt fehlt: `not_applicable` / „Nicht mehr aktuell“.  
Solche Checks zählen nicht weiter als aktuelle Abdeckung.

## Abgeleitete Prüfaufgaben

Das System darf Aufgaben ableiten, aber keine Anforderungen erfinden.

- Bekanntes Zielland → Einreise, Visum, Reisedokument für genau dieses Land
- Zeitraum, Land oder Mietwagen vorhanden → Versicherung prüfen
- Gebuchter kommerzieller Planpunkt → Buchungsbestätigung prüfen
- Gebuchter Flug → zusätzlich Ticket prüfen

`booked` ist nicht Ticket vorhanden und nicht Bestätigung heruntergeladen.

System-Checks werden nicht ungefragt persistiert. Persistiert wird erst die Nutzeraktion. Dieselben Länder werden nicht verdoppelt.

## Offizielle Naht

`POST /api/readiness/requirements` ist geschlossen.

- kein Provider → `unavailable` / `insufficient_context`
- Ergebnis immer `unknown`
- kein Country Code allein erzeugt eine Visa-Aussage
- mehrere Reisende → keine individuelle Aussage „für alle“
- keine Fake-Regeln, kein Scraping, keine Modellantwort als Quelle
- Antworten `Cache-Control: private, no-store`

## Gast und Konto

Dieselbe fachliche Form: `Trip.readinessItems`.

- Gast: `localStorage`
- Konto: `trip_readiness_items` über RLS
- Guest → Account: nach `reise_anlegen()` idempotente Sync-Naht `readinessUebernehmen`
- Confirmation-Checks werden über Art, Daten und Titel neu zugeordnet, nicht über Gast-IDs
- `reise_aendern()` schreibt Readiness nicht und markiert nichts still als erledigt

## UX

Kein sechster Haupt-Tab. Die fünf Bereiche bleiben:

`Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`

Reisevorbereitung liegt in der Übersicht: kompakte Zusammenfassung, Zahlen offen / erledigt / erneut prüfen, Hinweis auf nicht verifizierte Einreiseanforderungen, aufklappbares Detail.

Kein Upload. Keine Felder für Pass, Geburt, Nationalität oder Gesundheit.  
Custom-Titel tragen den Hinweis: keine sensiblen Daten eintragen.

## Bewusst nicht in Foundation C

- Dokumententresor, OCR, Storage-Bucket, Verschlüsselungsprodukt
- individuelle Traveller-Profile mit Nationalität oder Geburtsdatum
- echter Visa-/Einreiseprovider
- Health-/Impfdaten
- Production-Migration oder Production-Aktivierung
- Foundation D Gesamt-Abdeckung

Die ältere Zielbild-Datei beschrieb eine spätere, personalisierte Einreiseprüfung mit belastbarer Quelle. Dieses Zielbild bleibt gültig als Zukunft, ist aber **nicht** der umgesetzte Stand von Foundation C.

## Development vs Production

- Migration `20260822010000_trip_readiness_items` nur Development
- Production unverändert
- keine neuen Secrets
- keine neuen laufenden Kosten
