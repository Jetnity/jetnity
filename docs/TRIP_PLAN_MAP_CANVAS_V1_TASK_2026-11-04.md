# Reiseplan Map-first Canvas V1 — Technischer Auftrag, 04.11.2026

Tracking: [#1115](https://github.com/Jetnity/jetnity/issues/1115); separater Google-API-/Privacy-/Kosten-Pilot: [#1114](https://github.com/Jetnity/jetnity/issues/1114).

- Baseline main: `9b921e523fe4d4594aeffd3fcf77b8d95fa44dc4`; Modus `NORMAL`.
- Writer: Technical Lead, direkte GitHub-Umsetzung wegen dokumentierten Cursor/Work-Kontingentgrenzen. Kein paralleler Agentenwriter.
- Branch: `feat/trip-plan-map-canvas-v1-20261104`; Draft PR. Nur der TL setzt Ready und merged.
- Ziel: Reiseplan als ruhige, zusammenhängende Arbeitsfläche. Eine kompakte Routen-/Tagesspalte und eine grosse, bei aktivierter und datenschutzrechtlich freigegebener Karte dauerhaft sichtbare interaktive Maps-Fläche. Auf schmalen Geräten Karte und Details verständlich und per Tastatur erreichbar.

## Abnahme
1. Routen-/Tagesauswahl, Bearbeiten/Anlegen/Entfernen, Mehrfachstopps, fehlende Koordinaten, verschiedene Aufenthalte am gleichen Ort, Auth/Gast und URL-Deep-Links bleiben funktionsfähig. Bestehende N12/U1B/U1C-Verträge bleiben unverändert.
2. Kein getrenntes doppeltes Rahmensystem im Desktop-Reiseplan. Kartenfläche liegt **nicht innerhalb** der ein- und ausblendbaren Route und wird beim reinen Etappen-/Tageswechsel nicht unmounted. Karte bleibt als Hauptansicht sichtbar, sofern die Freigabesperren geöffnet sind. Ohne Freigabe entsteht **kein** leeres Kartenloch, keine Fake-Map und kein funktionsloser CTA.
3. Karte bezieht Orte nur aus gespeicherten Koordinaten. Keine erfundenen Routen, Fahrzeiten, Fahrpreise oder Buchungen. Keine weiteren Google-SKUs.
4. Eine Google-Map darf maximal einmal pro **stabilem Karten-Mount** initialisiert werden; Paging, Auswahl und Kartenfokus sind interne Updates. Das ist **nicht** „nur ein externer Netzaufruf pro Besuch“, keine Monatskosten-Garantie.
5. **Autostart nur nach rechtlich wirksamer und verifizierter Karten-Einwilligung**, keine automatische Erteilung durch die UI. Bei fehlender/entzogener Einwilligung keine Google-Anfrage. Der derzeitige Maps-Source-Switch und die vorhandene PrivacyBee-CMP-Freigabe bleiben OFF.
6. Responsive bei 320/390/768/1440 und 200% Schrift; Touch, Tastatur, Fokus, reduzierte Bewegung, Screenreader, Offline/Fallback, keine Überläufe. Testberichte unterscheiden Stub von echter API-Evidence.

## Nicht im Scope
- Google Cloud API aktivieren, neue Map ID oder Keys/Secrets ändern, Consent-Policy veröffentlichen, Production-Feature starten oder Indexierung aktivieren.
- Supabase-Queries/Migrationen, RLS/Auth/Identität, Payment, Provider-Calls/-Aktivierung; #917/#968 und andere Holds bleiben.
- Neue laufende Kosten, SSO-Bypass oder Preview-Login mit potentiell produktiver DB.

## Qualität
Direkter unabhängiger Review sämtlicher geänderter Dateien, gezielte vorhandene Regressionstests, TypeScript/Lint/Build/Schutzprüfungen im Original-CI, echter Preview-Scope-Rücklesetest, gegebenenfalls geblockte Browser-Gates ausdrücklich notieren. Head nach jeder Änderung neu prüfen; alte Evidence verfällt.

**STOP:** Kein Ready/Merge, bevor exakter Head vollständig und unabhängig geprüft ist. Kein automatischer nächster Slice.