# Orts- und Länderqualität – Prüfstand 1. November 2026

PR #1103; Branch `codex/places-planning-quality-20261101`; Basis `0d813e8229f672438c59c01ffe58de53fbfbf7db`. Root einziger Writer, unabhängige Read-only Reviews für Suche/Daten und Planungsintegration. Nutzerauftrag: bestehende Ortssuche einschließlich Reiseplanung verbessern.

## Ergebnis und offene Freigabe

Implementiert: getrenntes exaktes Retrieval, lokalisierte Länderpräfixe, Länderzusätze, stabile Ranggleichstände, lesbare Verwaltungshierarchie, vollständige aktuelle Länderidentitäten, Inseln ohne Bevölkerungsschwelle, sichtbarer Auswahlkontext und sichere Fehlerbehandlung vor Gast-/Kontospeicherung. Kein neuer Provider und keine neuen laufenden Gebühren.

Noch nicht Production. Die neue Runtime benötigt die additive Migration und den geprüften Referenzdatenrefresh. Das besondere Production-Migrationsgate nach Technical-Lead-Standard bleibt offen; kein Merge vor Abschluss von CI/Preview und dieser Freigabe.

## Daten und Nachweise

- Original GeoNames-Dump: 13.483.492 Zeilen; 289.453 gültige Zielorte: 100.822 Städte, 175.037 Inseln, 13.344 Regionen, 250 aktuelle Länderidentitäten.
- Alle 252 countryInfo-Referenzen geprüft; zwei historische PCLH-Einträge ausdrücklich ausgeschlossen. Aktive Länder einschließlich Aruba, Curaçao, Jersey und Antarktis enthalten. Andere Gebiete behalten eigene Namen/IDs.
- Keine ungültigen TSV-Koordinaten und keine doppelten IDs in diesem Snapshot. 105.405 Alias-Tokens passen nicht in die bestehende 800-Zeichen-Grenze und werden vollständig ausgelassen statt mitten im Wort abgeschnitten. Daher kein Vollständigkeitsversprechen für jede Schreibweise weltweit.
- Isolierter lokaler Postgres 17 + PostgREST 16.2: vollständiger Katalog, echte Abfragen und anonymer Schreibzugriff geprüft. Nach finaler Datenkorrektur erneut zu bestätigen.
- Development `yfvbxvijcorffwxbxahl`: Migration am 01.11.2026 angewendet, versioniert als `20261101202029`; repräsentativer Bestand aus allen 250 Ländern plus ausgewählten Städten/Inseln/Gebieten. Production `qscbgcdmivbbnzrcyegn` unverändert.
- Branch-Preview gezielt an Development angeschlossen; keine Production-Variablen geändert.
- Fokussiert zuletzt 579 Tests bestanden; 11 interaktive Orts-/Planerfälle und 25 Planungs-/Erstellungsfälle bestanden, darunter Tastatur, verzögerte Antworten, Fehler vor Speicherung, 320/390/1280 und 200 % Reflow. Kein physischer Gerätetest.
- TypeScript, Lint (0 Fehler; vorhandene Warnungen), Production-Build und fünf Hygieneprüfungen bestanden. Exact-Head-CI/Preview stehen bei diesem Checkpoint noch aus.
- Lokaler erster Gesamtlauf: 7.702 bestanden, 17 fehlgeschlagen, 5 übersprungen. Darunter fehlende native Linux-PG16-Binaries, Plattform-/Font-/Audit-Voraussetzungen, ein temporärer CLI-Artefakt, ein uncommitted-Types-Guard und der Import-Vertragsvergleich. Taskbezogene Ursachen wurden korrigiert; native CI muss die vollständige Suite bestätigen. Kein globaler Security-PASS aus dem lokalen Lauf abgeleitet.

## Rollout-Reihenfolge

1. Review, Exact-Head-CI und Development-Preview abschließen.
2. Konkrete Production-Freigabe für Migration + denselben kontrollierten Referenzdatenimport einholen. Vorher Referenzbestand/Schema sichern; keine Reiseänderung oder Löschung.
3. Migration anwenden; alle GeoNames-Zeilen per Upsert und vorhandene Airport-Orte aktualisieren. Länderidentität, bekannte IDs, Rollenrechte, API-Suchen und unveränderte Reise-FKs prüfen.
4. Erst danach Runtime mergen/veröffentlichen, Main/Deployment abgleichen und Production-Suche plus Startseite→Planen erneut prüfen.
5. Code-Rollback bleibt möglich: alte Runtime ignoriert additive Spalten. Additive Spalten/Indizes und neue Referenzzeilen müssen für einen Code-Rollback nicht gelöscht werden.

Importquellen: [GeoNames-Dateiformat](https://download.geonames.org/export/dump/readme.txt), [Featurecodes](https://download.geonames.org/export/dump/featureCodes_en.txt). Referenzdaten unter CC BY 4.0; Attribution bleibt erforderlich.
