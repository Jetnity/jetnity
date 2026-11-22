# Dev-Ergebnis der Cron-Schutzkorrektur – 22.11.2026

**Ergebnis: 14/14 native Prüfgruppen und der echte Zwei-Sitzungs-Paralleltest bestanden.** Die private Testfixture wurde anschließend entfernt; ein unabhängiger READ ONLY-/ROLLBACK-Aufruf bestätigt den dauerhaften Abschluss. Die gesamte Fortsetzung arbeitete ausschließlich auf Dev `yfvbxvijcorffwxbxahl`; **kein Production-Aufruf**.

Stand der abschließenden Datenbankbeobachtung: **22.11.2026, 02:35:47.649164 Zürich / 01:35:47.649164 UTC**. Ausgangscommit: `e28207ee9ce67b4faef428b92d30bb0f245fa91c`.

## Tatsächlich ausgeführte Prüfungen

| Schritt | UTC-Zeit bzw. gemessenes Connectorfenster | Ergebnis |
| --- | --- | --- |
| Setup00, dritter insgesamt bekannter Versuch | 01:25:53.400–01:26:11.657 | Fünf exakt gehashte Archivzeilen in eigener privater Dev-Fixture; bestehender Zustand/Rechte erhalten; COMMIT |
| Rückrollprüfung10 | 01:26:38.465–01:26:40.081 | 14/14 native Gruppen; Originalzustände und geprüfte Zähler erhalten; ROLLBACK |
| Parallelversuch1, zwei Aufrufe in einem Executor | Beide Clientstarts 01:27:21.830; Antworten 01:27:32.717 und01:27:43.755 | Beide Handshake-Fristen mit `P7998` abgelaufen; **kein PASS** |
| Parallelversuch2, getrennte Executor-Sitzungen | Reader 01:33:04.731–01:33:06.708; Writer 01:33:05.741–01:33:06.733 | Echte konkurrierende Datenbanksitzungen, exakte native Verweigerung und Wiederannahme nach Writer-ROLLBACK; beide ROLLBACK |
| Cleanup30 | 01:33:47.689–01:35:06.408 | Exakt zwei Testtabellen und ihre private Namespace entfernt; Vergleich zum ursprünglichen Zustand bestanden; COMMIT |
| Unabhängiger Nachread40 | Serverbeobachtung 01:35:47.649164 | Testfixture fehlt; v8 exakt; Cron-Rechte unverändert; aktive Testsitzungen 0, Testsperren 0; READ ONLY mit ROLLBACK |

Die Connectorfenster enthalten Übertragung und gegebenenfalls die technische Supabase-Bestätigung. Insbesondere die 78.719 ms bei Cleanup30 sind **keine gemessene Datenbanklaufzeit** und kein behaupteter SQL-Timeout. Die festen Datenbankgrenzen der ursprünglichen fünf Dateien wurden nicht erweitert. Der neue Nachread40 verwendet 12 s Statement-, 20 s Transaktions- und 500 ms Locktimeout.

[Setup-Rohantwort](evidence/official-truth-dev-cron-validation-20261122/00-setup-execution.json), [14er-Rohantwort](evidence/official-truth-dev-cron-validation-20261122/10-rehearsal-execution.json), [zweiter Writer](evidence/official-truth-dev-cron-validation-20261122/20-writer-attempt2-execution.json), [zweiter Reader](evidence/official-truth-dev-cron-validation-20261122/21-reader-attempt2-execution.json), [Cleanup](evidence/official-truth-dev-cron-validation-20261122/30-cleanup-execution.json) und [unabhängiger Nachread](evidence/official-truth-dev-cron-validation-20261122/40-postcleanup-read-execution.json) bleiben vollständig erhalten.

## Die 14 Prüfgruppen

| Nr. | Native Prüfgruppe | Fachlicher Schutzgegenstand | Ergebnis |
| --- | --- | --- | --- |
| 1 | `changed_active` | Änderung des Active-Status erkannt | PASS |
| 2 | `changed_command` | Geänderter Cron-Befehl erkannt | PASS |
| 3 | `changed_target` | Geändertes Verbindungsziel erkannt | PASS |
| 4 | `deleted_job` | Gelöschter relevanter Job erkannt | PASS |
| 5 | `duplicate_relevant_name` | Doppelter relevanter Jobname verweigert | PASS |
| 6 | `late_drift_never_adopted_by_sealed_fixture` | Späte Drift wird nicht in die geprüfte Baseline übernommen | PASS |
| 7 | `new_unrelated_job` | Neu hinzugefügter fremder Job erkannt | PASS |
| 8 | `null_command` | NULL-Befehl verweigert | PASS |
| 9 | `null_missing_and_malformed_capture_fail_closed` | NULL, fehlende und falsch geformte Capture-Werte verweigert | PASS |
| 10 | `row_bytes_cap` | Zeilen-Bytegrenze durchgesetzt | PASS |
| 11 | `row_cap_129` | 129. Zeile überschreitet die feste Grenze | PASS |
| 12 | `unchanged_positive` | Unveränderte Konfiguration akzeptiert | PASS |
| 13 | `unrelated_existing_job_preserved` | Bereits vorhandener fremder Job erhalten | PASS |
| 14 | `update_restore_rowversion_negative` | UPDATE und fachliche Rückänderung an der Zeilenversion erkannt | PASS |

Der Code führt die Prüfungen auf PostgreSQL17 in Dev aus. Der gemeinsame Cron-Core wird ausschließlich durch neun feste Ersetzungen von `cron.job` auf die private Testrelation abgebildet. Die geprüften Originalzeilen stammen aus dem bereits vorhandenen, separat autorisierten Archivread. In dieser Fortsetzung wurde dafür **keine neue Production-Abfrage** ausgeführt.

## Was der Paralleltest tatsächlich belegt

Writer und Reader verwendeten im zweiten Versuch **unveränderte SQL-Dateien und unveränderte Zeitgrenzen**. Geändert wurde ausschließlich die Aufteilung auf zwei getrennte Ausführungssitzungen. Der Reader musste einen anderen Backend-PID mit dem gebundenen Writer-Mutex und tatsächlichem `RowExclusiveLock` erkennen. Sein eigenes `AccessShareLock` blieb gleichzeitig möglich. Anschließend musste genau der gemeinsame Core mit SQLSTATE `P7998` und `PROD_HTTP_CRON_WRITER_OBSERVED` verweigern. Erst danach durfte der Reader den transaktionalen ACK-Mutex setzen. Der Writer bestätigte diesen gebundenen ACK und rollte zurück. Der Reader beobachtete die verschwundenen Schreibsperren und prüfte die wieder exakten fünf Originalzeilen erfolgreich.

Das ist ein tatsächlicher Zwei-Sitzungsnachweis. Die PIDs selbst wurden nicht ausgegeben; ihre Verschiedenheit und Bindungen werden im ausgeführten SQL zwingend geprüft. Der erste Versuch bleibt als gescheiterter Versuch archiviert ([Writer](evidence/official-truth-dev-cron-validation-20261122/20-writer-execution.json), [Reader](evidence/official-truth-dev-cron-validation-20261122/21-reader-execution.json)). Seine Laufzeiten passen zu nacheinander erfolgter Ausführung, belegen jedoch nicht, welche Vermittlungsschicht diese verursachte. Es wurde keine Sicherheits- oder Bestätigungsablehnung umgangen.

## Erhaltung und Abschluss

Datei10 vergleicht den bestehenden v8-Katalog und die v8-Zeile, Rollen, Mitgliedschaften, explizite ACLs, reale Cron-Konfigurationen, Fakten, tatsächliche Originalbytes, Publisher-/Allocator-Definitionen sowie den bestehenden Guardzustand und eigenen/alten Sequenzzustand innerhalb der Rückrollprüfung. Cleanup30 vergleicht die bestehenden Zustands- und Berechtigungshashes nochmals mit der vor der Fixture gespeicherten Aufnahme. Es gibt keine neue Rolle, keinen GRANT/REVOKE, keinen Ownerwechsel und keine Änderung realer Cron-Jobs.

Die Cleanup-Ausgabe allein wäre nur ein Vor-COMMIT-Beleg. Deshalb folgte der unabhängige40-Read: private Namespace und beide Testtabellen fehlen, aktive Testsitzungen und gebundene Testlocks sind0, der bestehende v8-Katalog ist exakt. Sein SHA-256 bleibt `12b69d7dec44160e611a01bedd87feaf6a17669b3f1f53b45f27239a71e3e83a`. Es wird keine globale Sequenzwertgleichheit über natürliche Cronfortschritte hinweg behauptet.

[Maschinenlesbares Gesamtergebnis](evidence/official-truth-dev-cron-validation-20261122/runtime-result.json), [unabhängiger Runtime-Review](evidence/official-truth-dev-cron-validation-20261122/independent-runtime-review.json), [zweiter Gegencheck](evidence/official-truth-dev-cron-validation-20261122/independent-dev-cron-runtime-review.json) und [Ergebnismanifest](evidence/official-truth-dev-cron-validation-20261122/execution-manifest.json) binden die tatsächlichen Rohantworten und unveränderten Eingaben. Die früher verlorene Setup-Antwort bleibt UNKNOWN; die frühere abgelaufene Bestätigung bleibt ein historischer Blocker ohne SQL-Ergebnis.

## Dateien und SHA-256

Das ursprüngliche [Dev-Testmanifest](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-cron-guard-validation-20261122/MANIFEST.json) bleibt unverändert: `f9ff5d7ce9c47d39e32d013a8271234e9a6c1101deec517fe54a7bea5689f5d1`. Sein damaliges `NOT_EXECUTED` ist der eingefrorene Vorbereitungsstand; die tatsächliche Ausführung steht getrennt im neuen Ergebnismanifest.

| Datei | Bytes | SHA-256 |
| --- | ---: | --- |
| [00-setup-private-fixture.DEV-COMMIT.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-cron-guard-validation-20261122/00-setup-private-fixture.DEV-COMMIT.sql) | 11,098 | `4224eea08bd583e046a5b7622752745fb05b5dc38dc23ecbd1a42f8775cc3805` |
| [10-shared-core-rehearsal.DEV-ROLLBACK.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-cron-guard-validation-20261122/10-shared-core-rehearsal.DEV-ROLLBACK.sql) | 31,897 | `fe0dd00a728804f9e7076a37302fe238ac1a35aa58039ae4d1f5fda51b2f09e7` |
| [20-concurrent-writer.DEV-ROLLBACK.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-cron-guard-validation-20261122/20-concurrent-writer.DEV-ROLLBACK.sql) | 6,788 | `e70a72a6f831c822c4af8d8c5b8ac6b1b92f704305991b4af8ea5f333f6827c5` |
| [21-concurrent-reader.DEV-ROLLBACK.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-cron-guard-validation-20261122/21-concurrent-reader.DEV-ROLLBACK.sql) | 13,811 | `e7fd7a351d3018148d69fd726d3e9c7e7c9ce0a5753f05a3649c87bad7012b7a` |
| [30-cleanup-private-fixture.DEV-COMMIT.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-cron-guard-validation-20261122/30-cleanup-private-fixture.DEV-COMMIT.sql) | 9,181 | `dc8f1769699eee1a135e3b5575f93d759d9087d9a04c1c084ea75d4c72d2b98b` |
| [40-postcleanup.READONLY.sql](evidence/official-truth-dev-cron-validation-20261122/40-postcleanup.READONLY.sql) | 3.552 | `2e21529e76e4b595f5035bbeb06d0ce8540794009566ea7571ad964573c4fe9e` |

SHA-256 des ausgewerteten [Gesamtergebnisses](evidence/official-truth-dev-cron-validation-20261122/runtime-result.json): `9fc677d0a066c5ce7c82d37fa0e9da531f84559f1c0500172825485be39be13a`.

## Bedeutung für das vorbereitete Production-Paket

Die Dev-Prüfung des gemeinsamen Cron-Schutzes ist abgeschlossen. Das [vorbereitete Korrekturpaket](OFFICIAL_TRUTH_PRODUCTION_HTTP_ALLOCATOR_CRON_CORRECTION_2026-11-22.md) bleibt in allen SQL-Bytes unverändert; sein Manifest-SHA-256 ist `90c439a9f818074f68c6f12c7a2716b947ebc65d9af925f97cc502613e3be024`. Die jetzt vorliegenden Dev-Belege ergänzen den vorher eingefrorenen Prüfstand.

Damit ist **weder der gesamte Production-Installer noch die gesamte Production-Katalogfunktion in Dev ausgeführt**. Dev hat seine eigene installierte v8-Kette und pg_net0.20.4; der vorbereitete Production-Installer bindet einen anderen Vorgänger und pg_net0.19.5. Ein späterer Production-Aufruf benötigt das separat auf seine Dateien und Hashes begrenzte Go. Es wurde hier kein solcher Auftrag ausgeführt und keine Installation freigegeben.

ACCESS SHARE ist keine physische Cron-Schreibsperre. Weder eine vollständige kurzlebige Insert/Delete-Zwischenhistorie noch das Beobachtungsfenster nach dem letzten Check wird als verhindert behauptet. Öffentliche BG1-Frische, Quellenqualifikation, positive AT-Erneuerung und Publisher0 in Production werden aus diesem Dev-Test nicht abgeleitet. Abgelaufene Daten bleiben **„derzeit nicht verfügbar“**.
