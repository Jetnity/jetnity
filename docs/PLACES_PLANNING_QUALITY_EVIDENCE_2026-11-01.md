# Orts- und Länderqualität – Prüfstand 1. November 2026

PR #1103; Branch `codex/places-planning-quality-20261101`; Basis `0d813e8229f672438c59c01ffe58de53fbfbf7db`. Root einziger Writer, unabhängige Read-only Reviews für Suche/Daten und Planungsintegration. Nutzerauftrag: bestehende Ortssuche einschließlich Reiseplanung verbessern.

## Ergebnis und offene Freigabe

Implementiert: getrenntes exaktes Retrieval, lokalisierte Länderpräfixe, Länderzusätze, stabile Ranggleichstände, lesbare Verwaltungshierarchie, vollständige aktuelle Länderidentitäten, Inseln ohne Bevölkerungsschwelle, sichtbarer Auswahlkontext und sichere Fehlerbehandlung vor Gast-/Kontospeicherung. Kein neuer Provider und keine neuen laufenden Gebühren.

Noch nicht Production. Die neue Runtime benötigt die additive Migration und den geprüften Referenzdatenrefresh. Das besondere Production-Migrationsgate nach Technical-Lead-Standard bleibt offen; kein Merge vor Abschluss von CI/Preview und dieser Freigabe.

## Daten und Nachweise

- Original GeoNames-Dump: 13.483.492 Zeilen; 289.453 gültige Zielorte: 100.822 Städte, 175.037 Inseln, 13.344 Regionen, 250 aktuelle Länderidentitäten.
- Alle 252 countryInfo-Referenzen geprüft; zwei historische PCLH-Einträge ausdrücklich ausgeschlossen. Aktive Länder einschließlich Aruba, Curaçao, Jersey und Antarktis enthalten. Andere Gebiete behalten eigene Namen/IDs.
- Keine ungültigen TSV-Koordinaten und keine doppelten IDs in diesem Snapshot. 105.405 Alias-Tokens passen nicht in die bestehende 800-Zeichen-Grenze und werden vollständig ausgelassen statt mitten im Wort abgeschnitten. Daher kein Vollständigkeitsversprechen für jede Schreibweise weltweit.
- Isolierter lokaler Postgres 17 + PostgREST 16.2: vollständiger Katalog, echte Abfragen und anonymer Schreibzugriff geprüft. 28 Suchfälle plus 20 PostgREST-Filterprüfungen bestanden, einschließlich Australien/zugehöriger Gebiete und mehrsprachiger Länderpräfixe. [Maschinenbeleg](evidence/places-planning-quality-2026-11-01/postgrest.json).
- Development `yfvbxvijcorffwxbxahl`: Migration am 01.11.2026 angewendet, versioniert als `20261101202029`; repräsentativer Bestand aus allen 250 Ländern plus ausgewählten Städten/Inseln/Gebieten. Development-Rücklesung: 270 Referenzzeilen, 250 Länder/250 eindeutige Codes, beide neuen Spalten vorhanden, RLS aktiv. Anon und authenticated dürfen lesen, aber nicht insert/update/delete. Production `qscbgcdmivbbnzrcyegn` unverändert.
- Branch-Preview gezielt an Development angeschlossen; keine Production-Variablen geändert.
- Fokussiert zuletzt 580 Tests bestanden; 11 interaktive Orts-/Planerfälle und 25 Planungs-/Erstellungsfälle bestanden, darunter Tastatur, verzögerte Antworten, Fehler vor Speicherung, 320/390/1280 und 200 % Reflow. Kein physischer Gerätetest.
- TypeScript, Lint (0 Fehler; vorhandene Warnungen), Production-Build und fünf Hygieneprüfungen bestanden. Exact-Head-CI/Preview stehen bei diesem Checkpoint noch aus.
- Lokaler erster Gesamtlauf: 7.702 bestanden, 17 fehlgeschlagen, 5 übersprungen. Darunter fehlende native Linux-PG16-Binaries, Plattform-/Font-/Audit-Voraussetzungen, ein temporärer CLI-Artefakt, ein uncommitted-Types-Guard und der Import-Vertragsvergleich. Taskbezogene Ursachen wurden korrigiert; native CI muss die vollständige Suite bestätigen. Kein globaler Security-PASS aus dem lokalen Lauf abgeleitet.

## Rollout-Reihenfolge

1. Review, Exact-Head-CI und Development-Preview abschließen.
2. Konkrete Production-Freigabe für Migration + denselben kontrollierten Referenzdatenimport einholen. Vorher Referenzbestand/Schema sichern; keine Reiseänderung oder Löschung.
3. Migration anwenden; alle GeoNames-Zeilen per Upsert und vorhandene Airport-Orte aktualisieren. Länderidentität, bekannte IDs, Rollenrechte, API-Suchen und unveränderte Reise-FKs prüfen.
4. Erst danach Runtime mergen/veröffentlichen, Main/Deployment abgleichen und Production-Suche plus Startseite→Planen erneut prüfen.
5. Code-Rollback bleibt möglich: alte Runtime ignoriert additive Spalten. Additive Spalten/Indizes und neue Referenzzeilen müssen für einen Code-Rollback nicht gelöscht werden.

Importquellen: [GeoNames-Dateiformat](https://download.geonames.org/export/dump/readme.txt), [Featurecodes](https://download.geonames.org/export/dump/featureCodes_en.txt). Referenzdaten unter CC BY 4.0; Attribution bleibt erforderlich.

## Review und verbleibende externe Prüfung

Unabhängiger Daten-/Suchreview: PASS auf `f6ad8ade93ac0d88a340f46738a72a5b4762ed64`, 75 eigene gezielte Tests und vollständiger Export unabhängig geprüft. UI-/Integrationsreview: keine verbleibenden P1/P2, 58 eigene Tests. Anschließend zusätzliche Importhärtung gegen einzelne fehlende/duplizierte countryInfo-IDs und gegen ID/Code-Widersprüche; außerdem visuell geprüfte Ausrichtung der Ortsfelder/Icons.

Vercel Preview für f6ad8ade9: `dpl_G2bL3gj3HEEBEp6bzUK99Kju1HbF`, READY, Development-Verbindung. Geschützter Fetch scheiterte am Share-Link; CLI hat keine gültige Anmeldung. Browserzugriff auf den Preview-Origin wurde durch die Browserfreigabe abgelehnt. Keine Umgehung oder weiteren Zugriffsversuche nach dieser Ablehnung. Eine tatsächliche Preview-End-to-End-Abnahme ist deshalb **offen**. Vor Production muss dieser konkrete Zugriff freigegeben und die Prüfung nachgeholt werden. Eine bestandene Build-Prüfung ersetzt sie nicht.

Die nachfolgenden Exact-Head-Statuswerte sind live in [PR #1103](https://github.com/Jetnity/jetnity/pull/1103) nachzulesen. Kein Runtime-Deployment auf Production aus diesem Entwurf. Development-Advisors zeigen keine Änderungen an den hier unveränderten Rechten; die Hinweise zur [öffentlichen Katalogsichtbarkeit](https://supabase.com/docs/guides/database/database-linter?lint=0026_pg_graphql_anon_table_exposed) sind für öffentliche Orte/Flughäfen beabsichtigt. Andere bestehende projektweite Advisor-Hinweise wurden nicht als Teil dieses Slices umkonfiguriert.

## CI-Korrekturen und Sicherung, 01.11.2026 20:57 UTC

CI auf `28662c8f652562dee9f270919a97b46373b2e05d` (Run `41347587558`): 7.832 PASS, drei Fehler, zwei übersprungen. TypeScript/Lint und separater Auth-Abgleich erfolgreich; Build wegen Testfehlern nicht ausgeführt. Die Ursachen sind konkret korrigiert:

- Native Import-Rückleseprüfung hatte neue `population`/`featureCode` noch nicht ausgewählt. Jetzt werden beide Felder vollständig verglichen, einschließlich nichtleerer Länder-/Stadtwerte und NULL bei Flughäfen/Legacy-Fixtures. Echter isolierter PostgreSQL-17-Test des kombinierten Laufs bestanden. Ein separater Mac-Umgebungscheck erkennt weiterhin die automatisch gesetzte `__CF_USER_TEXT_ENCODING`-Variable; kein globaler lokaler Native-PASS behauptet.
- Der bestehende Security-Quellinventar-Guard erkannte genau drei veränderte Server-Actions (`places`, `reiseaenderung`, `reisevorschlag`). Nur deren Hashes wurden nach unabhängiger Prüfung aktualisiert: Rollen-/Eingabeprüfungen und Auth-/Ownership-Grenzen bleiben bestehen; Ortslesefehler stoppen vor der Persistenz. Keine geschützten historischen Audits, Versionen oder Prüfregeln verändert. Alle 41 Audit-/Negativtests bestanden, einschließlich veränderter Action-Bodies.
- Ein bestehender Browsertest las den Navigationsstil direkt nach Resize, bevor React/ResizeObserver die Desktop-Anordnung wiederhergestellt hatten. Er wartet jetzt auf genau diesen Zustand; sämtliche Mount-, Request- und Stilassertionen bleiben bestehen. Unabhängiger Read-only Review bestätigte das Timingproblem; vier unveränderte fokussierte Kontrollläufe und der korrigierte Einzeltest bestanden. Gesamte Browserdatei lokal 16/17: ein separater bestehender Scrollpositionsvergleich auf Mac blieb rot; kein vollständiger lokaler Browser-PASS behauptet. Lint der Korrekturen ohne Fehler.

Production `public.places` read-only vollständig gesichert: 124.811 Zeilen, 124.811 eindeutige IDs in 73 streng nach ID geordneten JSONL-Teilen. Vollständiger Tabellen-Digest vor/nach dem Export identisch (`d779e4ebb51657f43b68268340a50634`); lokale SHA-256-Prüfsumme `b60d1cc504a5f7434d2cbb9809620dba0944737c45c3436d348087bf2affddd8`. Keine persönlichen Reise-/Kontodaten gelesen und keine Production-Schreibzugriffe. Dies ist ein auf unverändertem Tabellenstand geprüfter Export, kein transaktionaler Datenbank-Snapshot.

Der Product Owner hat den Browserzugriff ausdrücklich erlaubt. Die automatische Browserfreigabe hat den Versuch für die aktuelle Preview dennoch erneut abgelehnt. Deshalb bleiben Hosted-E2E und Production-Gate offen; keine Umgehung der Sperre. Der erneute CI-Lauf des Korrekturstands muss vor Integration erfolgreich sein.
