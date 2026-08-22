# PR #31 – Real-Device-Abnahme

**Datum:** 22. August 2026  
**Foundation:** B – Mietwagen  
**Getesteter Preview-Head vor diesem Nachweis-Commit:** `1951f2badcb29a33118bb8560ec3a8f828517e0d`  
**Gerät:** echtes iPhone (Nutzerabnahme)  
**Ergebnis:** bestanden

## Geprüfter Produktweg

Der Nutzer hat den aktuellen Vercel-Preview-Stand von PR #31 auf einem echten iPhone geprüft und den Stand mit **„Alles gut“** bestätigt.

Dabei galt für die Abnahme insbesondere:

- Hauptnavigation `Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität` bleibt stabil.
- `Mobilität → Mietwagen` ist als Unterbereich integriert; kein sechster Haupt-Tab.
- Beim Öffnen wird keine Mietwagensuche automatisch mit geratenen Reisedaten gestartet.
- Ohne Provider erscheinen keine Fake-Angebote.
- Manuelle Abholung, Rückgabe und Datumsfelder starten ohne erfundene Fakten; Reiseorte dürfen nur unverbindliche Platzhalter sein.
- Ein manuell erfasster Mietwagen bleibt zunächst geplant/unbestätigt und wird nicht automatisch als gebucht behandelt.
- Buchungsstatus kann ausdrücklich als Nutzerangabe bestätigt bzw. korrigiert werden.
- Ein Mietwagen markiert keine Bewegungskante allein wegen Zeitraum- oder Ortsüberlappung als abgedeckt.
- Wechsel zwischen den Hauptbereichen und dem Mietwagen-Unterbereich führt auf dem echten Gerät zu keinem sichtbaren Stapeln, Überlagern oder Seitendrift der Seite.
- Die Übersicht zeigt Mietwagenstatus nur, wenn tatsächlich ein Mietwagen vorhanden ist.

## Vorheriger automatisierter Nachweis

Vor der Real-Device-Abnahme waren auf Head `1951f2ba…` bereits grün:

- `npm test`: 1165/1165
- Typecheck, Lint, Hygiene und Production-Build
- Trip-Workspace-Audit WebKit + Chromium: 502 Kombinationen / 0 Fehler
- Activities-Regression: 184 Kombinationen / 0 Fehler
- GitHub CI
- Vercel Preview READY

## Grenzen

Diese Abnahme ändert keine Production-Daten und aktiviert keinen Provider.

- Migration `20260821200000_trip_items_rental_car` bleibt bis zu separater ausdrücklicher Freigabe Development-only.
- Mietwagensuche bleibt auf Production aus.
- PR #31 darf erst nach finalem Head-/CI-/Preview-Review auf Ready gesetzt werden.
- Merge erst nach separater Production-Migrationsfreigabe und anschließender Verifikation.
