# Auftrag: Production-HTTP-ID-Paket vorbereiten und BG1-Zeitplan pausieren

## Autorisierung und Ausgangspunkt

Owner-Auftrag vom 21. November 2026: Das angenommene Ergebnis von `PROD_READONLY_BASELINE_20261121_V2` wird in ein konkretes Production-Prüfpaket überführt. Die Ausführung dieses Pakets, einschließlich neuer Production-Diagnoseabfragen, bleibt bis zu einem separaten Go ausgeschlossen. Die Pause des störenden Fünf-Minuten-Workflows ist dagegen jetzt beauftragt; manuelle Ausführung und echte Fehlerbehandlung bleiben erhalten.

Belegbasis ist Commit `400351da45a4a208dac47d4b9ec12261166edf3f` auf `fix/official-truth-chde-at-renewal-dev-20261121`. Der zu Beginn gelesene Main ist `ff668f21510cd904dbed9aff64f50cdddeef3e9c`. V2 beobachtete HTTP-Sequenz 3/called, historische AT-ID 211 und CH→DE-ID 46. Diese Werte sind historische Beobachtungen und keine freigegebenen Reparaturparameter. V1 und V2 sind abgeschlossen; ihre Dateien und Autorisierungsmanifeste bleiben unverändert.

## Zwei getrennte Änderungen

1. **Production-Paket, nur Vorbereitung:** Begrenzte Diagnose der drei tatsächlich beobachteten fehlgeschlagenen AT-Enqueue-Läufe; aktuelle Pflichtbindungen als eigene READ-ONLY-Vorphase; eigene persistente postgres-Sequenz, enger privater SECURITY-DEFINER-Helper und Queue-Trigger; frische gesperrte ID-Inventur und mindestens 1.024 freie Nummern Abstand; atomarer Schutzanschluss, tatsächliche ROLLBACK-Probe als eigene Datei, Installations- und Rücknahmegrenzen. Kein Zurücksetzen der verwalteten Altsequenz und keine Wiederverwendung historischer IDs.
2. **Workflow, jetzt zulässiger enger Eingriff:** Nur den automatischen Zeitplan von `.github/workflows/official-truth-bg1-five-minute-integrity-alarm.yml` pausieren. `workflow_dispatch`, ARM-Variable, Zielbindung, Credentialprüfung und Alarmsemantik bleiben bestehen. Die beiden bestehenden Offline-Vertragstests müssen die beauftragte Pause statt aktiver Fünf-Minuten-Ausführung prüfen. Gesamtplan und Wiederaktivierungsbedingung werden nachgeführt.

Die automatische Freigabeprüfung lehnte die vollständige Actions-Deaktivierung ab: Sie hätte zusätzlich die manuelle Ausführung gesperrt. Dieser Versuch veränderte den Workflow nicht und wird weder wiederholt noch indirekt umgangen. Die Alternative ist der engere Zeitplan-Edit. Der bestehende Draft #1266 enthält eine zusätzliche Production-RPC-Probe bei Branch-Push sowie Änderungen am Legacy-Key-Vertrag und wird für diese Pause nicht ungeprüft verwendet.

## Technische Entscheidungen und Grenzen

- Die Production-Version von pg_net war in V2 **0.19.5**, Dev verwendete **0.20.4**. Gleiche Dev-Ergebnisse allein beweisen deshalb keinen Production-Transportvertrag. Vorhandene Originaldefinitionen und tatsächlich beobachtete Hashes werden abgeglichen; fehlende Bindungen bleiben benannte STOP-Bedingungen.
- Der neue Start folgt einer im Paket festgelegten Formel aus dem aktuellen, unter Sperre gelesenen Höchstwert und dem historischen Mindestwert 211. Der Sicherheitsabstand ersetzt keine Sperre und keinen vollständigen Inventurabgleich. BIGINT-Überlauf, neue unbekannte Verbraucher, fehlende Pflichtobjekte, Rechte- oder Katalogabweichungen führen zum Abbruch.
- Der bestehende Production-Publisher muss den in Dev eingeführten Quellenschutz erhalten, bevor ein reparierter Transport ihn wieder versorgen kann. Keine neue Quellenqualifikation, positive Erneuerung oder Owner-Freigabe wird durch die Reparatur erzeugt. Ein hierzu notwendiger Schutznachfolger wird ausdrücklich als Teil des später zu prüfenden Pakets ausgewiesen.
- Die Diagnose bindet ausschließlich Cronläufe **23758, 23767 und 23776**, ihre Zeiten, den festen Job und Command-Hash. Sie gibt begrenzte bekannte Fehlersignaturen, Prüfsummen und Längen aus, keine ungeprüften Rohfehlertexte oder Secrets. Unbekannte Ursachen bleiben unbekannt; fehlende oder abweichende historische Zeilen beenden den Diagnoseauftrag.
- Die letzten drei gelesenen GitHub-Alarmprotokolle zeigen **credentials_invalid vor dem ersten RPC**. Das belegt eine Monitor-Voraussetzungsverweigerung, keinen aktuellen Production-BG1-Zustand. Ein offenes Monitorproblem darf nicht durch `continue-on-error` oder einen falschen Erfolg verborgen werden.
- Vor Wiederaktivierung des Zeitplans müssen BG1-Freigabe, passende Monitorkonfiguration und die ausdrücklich freigegebene manuelle Endprüfung dokumentiert sein. Erst dann wird der Fünf-Minuten-Trigger wieder hergestellt. Die spätere SQL-/Owner-/Live-Probe ist kein Teil dieses Vorbereitungsauftrags.

## Prüfung und Lieferung

Alle neuen SQL-Dateien werden vollständig gelesen, unabhängig geprüft und über SHA-256 plus Dateigröße gebunden. Native Ausführung, Parserprüfung und reine statische Prüfung werden getrennt ausgewiesen. Die begrenzte Offline-Prüfung des Alarmworkflows verwendet ausschließlich synthetische Antworten. Ein späterer Normal-Merge benötigt die geltenden Review-/CI-Gates; keine Branch-Protection-Umgehung, keine fremden PR-Änderungen und kein Production-Deploy.

Dateien, Ergebnisbericht, Gesamtplan und Originalbelege bleiben im Repository. Kein Cursor, keine Supportnachricht, keine Rollen-/Owneränderung, Anmeldung/2FA, Veröffentlichung, neue Kosten oder Production-Datenbankaktion. Fachlich abgelaufene Angaben bleiben **„derzeit nicht verfügbar“**.

Fachagenten dürfen ausschließlich ihre zugewiesenen lokalen Dateien bearbeiten: **do not mark Ready; do not merge; do not start a follow-up slice**. Der Technical Lead führt die unabhängige Gesamtprüfung und gegebenenfalls den eng begrenzten Workflow-Merge aus.

## Tatsächlicher Abschlussstand der Vorbereitung, 21.11.2026, 20:13 Zürich

Das [Production-Paket](OFFICIAL_TRUTH_PRODUCTION_HTTP_ID_PACKAGE_2026-11-21.md) mit acht SQL-Dateien und festem SHA-256-Manifest ist lokal vollständig und unabhängig statisch geprüft; keine Datei wurde in Production ausgeführt. Die Dateien 00/01 bilden den konkret vorgelegten ersten neuen Leseauftrag. Schreibkandidaten bleiben durch den absichtlich fehlenden Transport-Pin gesperrt und erhalten nach dessen freigegebener Prüfung einen neuen Hashsatz.

Die tatsächliche Zeitplanpause ist **noch offen**. [PR #1269](https://github.com/Jetnity/jetnity/pull/1269) ist eng auf fünf Dateien begrenzt, vorab vollständig grün und anschließend regulär mit Main synchronisiert. Der neue Pflicht-Authcheck findet Dev-Passkeys aktiviert, während `config.toml` deaktiviert erwartet. Der parallele #1240 sieht eine spätere Dev-Aktivierung vor; dieser Workflow-Auftrag darf dessen fachlichen Sollzustand nicht stillschweigend ersetzen. Nötig ist die Owner-Entscheidung zum Dev-Passkey-Sollzustand und dessen konsistente Umsetzung, danach aktuelle grüne Pflichtchecks sowie normaler Merge/Readback. Main hat weiterhin den Fünf-Minuten-Trigger. [Befund, genaue Heads, Logauszug und Grenzen](evidence/official-truth-production-http-allocator-20261121/bg1-schedule-pause-outcome-20261121.json).
