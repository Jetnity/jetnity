# Ergebnis der Production-Cron-Rehearsal – 22.11.2026

**PASS: Die exakt freigegebenen Dateien 10 und11 wurden jeweils einmal in der richtigen Reihenfolge ausgeführt.** Datei 10 bestätigte die vollständige Rücknahme der Probe; Datei 11 bestätigte unabhängig den ursprünglichen Production-Stand und BG1 `current` zum Beobachtungszeitpunkt. Kein COMMIT, keine Installation, keine zusätzliche Rolle oder Cron-Berechtigung.

**Production-Ziel:** `qscbgcdmivbbnzrcyegn`. **Freigabe:** `PROD_HTTP_ALLOCATOR_CRON_REHEARSAL_20261122`. **Quellcommit:** `33ae75f7104a434fbdd507656126fea577059f2d`.

## Die zwei vor dem Start bestätigten Bedingungen

| Bedingung | Nachweis und Ergebnis |
| --- | --- |
| Prüfbereit trotz eingefrorenem `NOT_READY_FOR_PRODUCTION_REHEARSAL` | Ja, für die eng begrenzte Rollback-Probe. Der Manifeststand war beim Ablauf der alten Supabase-Bestätigung eingefroren. Die späteren echten Dev 14/14-, Parallel- und unabhängigen Cleanup-Belege mit Ergebnismanifest `118991ba301587f416162d6f59a6869ce5b5d10a892fecd80422c07d2c52d2a7` erledigten diesen damaligen Blocker. Alle 26 Paketdateien und 40 Dev-Ergebnisbindungen wurden vor Ausführung bytegleich geprüft. Das alte Manifest wurde nicht verändert. |
| ACCESS SHARE mit bestehenden Production-Rechten | Ja. Der vorhandene Read vom 22.11.2026, 01:06:22.944557 Zürich belegte SELECT=true, MAINTAIN/UPDATE/DELETE/TRUNCATE=false. PostgreSQL 17 erlaubt ACCESS SHARE mit SELECT. Datei 10 prüfte SELECT erneut vor DDL; sie erreichte und bestand anschließend tatsächlich `LOCK TABLE cron.job IN ACCESS SHARE MODE NOWAIT`. Es gab weder einen zusätzlichen Vorabread noch eine Berechtigungserweiterung. |

Die Bestätigung der Rechte vor dem Start bezog sich ausdrücklich auf den datierten heutigen Lesebeleg und die PostgreSQL-Regel, mit erneuter Prüfung im freigegebenen SQL. Sie war keine Behauptung einer zusätzlich ausgeführten aktuellen Abfrage oder einer garantierten konfliktfreien Laufzeit. Die anschließend erfolgreich ausgeführte Probe liefert nun auch den echten Production-Lock-Nachweis. [Offizielle PostgreSQL 17-Dokumentation: LOCK](https://www.postgresql.org/docs/17/sql-lock.html).

[Autorisierung und Vorprüfung](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/00-authorization-and-preflight.json) halten das bedingte Go, die spätere Dev-Evidence, den datierten Rechtebeleg, die Grenze von zwei Transaktionen und alle Stoppregeln fest. Die zuvor ausdrücklich erlaubte negative Publisher-Probe blieb eingeschlossen; jede positive Quellen-/Publisheraktion blieb ausgeschlossen.

## Tatsächlicher Ablauf und Hashes

| Datei | Aufrufe | Beginn/Ende UTC | Connectorfenster | SHA-256 |
| --- | ---: | --- | ---: | --- |
| [10-production-http-id.REHEARSAL-ROLLBACK.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/10-production-http-id.REHEARSAL-ROLLBACK.sql) | 1 | 01:46:04.963 →01:46:50.601 | 45.638ms | `2d71da79604a37f762f89a69eb399439b94d175ebc65504584533bc85259c982` |
| [11-production-http-id.POSTREHEARSAL-READONLY.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/11-production-http-id.POSTREHEARSAL-READONLY.sql) | 1 | 01:47:18.605 →01:47:20.963 | 2.358ms | `99b09948db844dc9198f5f4e4c92eeb83f41d8c87f533f009592aec13109f224` |

**Gesamtes Aufruffenster: 76.000ms**, innerhalb der Grenze von fünf Minuten. Beide Dateien enden mit `ROLLBACK`;11 lief zusätzlich in READ ONLY. Die unveränderten Datenbankgrenzen waren für10: 25s Statement,90s Transaktion,2s Lock; für11: 15s Statement,20s Transaktion,500ms Lock. Connectorfenster schließen Übertragung und gegebenenfalls technische Bestätigungszeit ein und sind keine gemessene reine SQL-Laufzeit.

Das freigegebene [Paketmanifest](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/MANIFEST.json) bleibt bytegleich: `90c439a9f818074f68c6f12c7a2716b947ebc65d9af925f97cc502613e3be024`. Seine eingefrorenen Vorbereitungsfelder sind keine aktualisierten Ausführungsbelege. [Rohantwort10](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/10-execution.json), [Auswertung10](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/10-validation.json), [Rohantwort11](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/11-execution.json) und [Auswertung11](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/11-validation.json) bilden die neue, getrennte Laufzeitevidence.

## Ergebnis von Datei 10

Der native Rückgabewert war `PROD_HTTP_QUALIFICATION_ALLOCATOR_GUARD_DDL_ROLLBACK_PASS`.

| Geprüfter Gegenstand | Tatsächliches Ergebnis |
| --- | --- |
| Frischer Höchstwert unter den Sperren | 211 |
| Verwalteter Zähler vor der Probe | 74 |
| Zwei echte, uncommittete Queue-INSERTs über den neuen Trigger | IDs 1236 und1237 statt der eingegebenen IDs 0 und 211 |
| Freier Sicherheitsabstand | 1024 Werte oberhalb 211 vor der ersten Probe-ID 1236 |
| Eigener Sequenzneustart und Rücknahme | Exakter ursprünglicher Probe-Zähler-/Allocator-/Katalogzustand wiederhergestellt |
| Entfernung des neuen Helpers und seines exakt gebundenen Triggers | Begrenzte Abhängigkeitsprobe und Rücknahme erfolgreich |
| Helper-Drift und Unveränderlichkeit der neuen Baseline | Native Verweigerungen; Ausgangszustand danach wieder exakt |
| Negative Publisher-Probe `renew_ch_v1()` | Exakt 0 durch zwingende `IS DISTINCT FROM0`-Prüfung vor PASS; geschützter Zustand unverändert |
| Vollständige Probe-Installation | Zum Savepoint vollständig zurückgerollt; Vorgängerkatalog, nativer Transport, geschützter Zustand und Inventar exakt wiederhergestellt |
| HTTP/Wake, positive Erneuerung, COMMIT | Nicht ausgeführt bzw. nicht bewiesen/freigegeben |

Die Queue-Probezeilen waren nie committet; die Queue-Sperre und Rücknahme verhinderten ihre Zustellung. Die IDs 1236/1237 sind **zurückgerollte Probe-IDs**, keine dauerhaft vergebenen IDs und keine Zusage eines späteren Installationsstartwerts. Der künftige Start muss erneut aus der dann gesperrten aktuellen Inventur berechnet werden. Die negative Publisherzahl 0 wurde nicht als eigenes Ergebnisfeld ausgegeben; der erfolgreiche native Kontrollpfad erlaubt PASS ausschließlich nach dieser exakten Prüfung und unverändertem Schutzsnapshot.

## Unabhängiger Nachread von Datei 11

Beobachtung **22.11.2026, 02:47:19.608995 Zürich / 01:47:19.608995 UTC**. Native Rückgabe: `PROD_HTTP_POSTREHEARSAL_ORIGINAL_LINEAGE_AND_OBJECT_ABSENCE_CONFIRMED`.

| Gegenstand | Ergebnis |
| --- | --- |
| Öffentlicher BG1-Status | `current` zum genannten Beobachtungszeitpunkt |
| Eigene Allocator-Namespace | Nicht vorhanden |
| Neue Production-v4-Baseline | Nicht vorhanden |
| Queue-Trigger | 0 |
| Fünf ausgewählte vollständige Cron-Zeilen | Exakt wie freigegeben |
| Originale Query-Cost-Katalogbindung | `ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24` |
| Historische v3-Katalogbindung | `7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e` |
| Nativer Transport | `60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f` |
| Verwalteter Zähler | 74, `is_called=true` |
| Installationsberechtigung | false |

Die vollständige unter Sperren geprüfte historische Wiederherstellung stammt aus der tatsächlichen10-Antwort.11 ergänzt einen separaten Snapshot und lässt natürliche Fortschritte zwischen Transaktionen zu; eine eingefrorene gesamte Cron-/Queue-/Sequenzhistorie wird nicht behauptet.

## Entscheidung und verbleibende Grenzen

**Das begrenzte Production-Rehearsal-Gate ist bestanden. Die einmalige Freigabe ist verbraucht.** Es gab genau zwei Production-Aufrufe, keinen Retry und keinen Zusatzread. Datei 20/40 sowie 30/50 wurden nicht aufgerufen. Installation und jeder weitere Production-Schritt benötigen ein separates, exakt begrenztes Go. Es wurde keine dauerhafte Production-Änderung vorgenommen.

Der Test belegt keinen erfolgreichen Betrieb einer committeten Installation, keinen neuen natürlichen Vollbeleg der zukünftigen BG1-v4-Baseline, keinen Post-COMMIT-Neustart-/Crash-/Fence-/Restore-Test und keine positive AT-Erneuerung. ACCESS SHARE verhindert keine Cron-DML; die dokumentierten Grenzen zwischen Beobachtungen bleiben bestehen. Abgelaufene Daten bleiben **„derzeit nicht verfügbar“**.

[Maschinenlesbares Gesamtergebnis](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/runtime-result.json), [unabhängiger Review](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/independent-runtime-review.json) und [Ergebnismanifest](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/execution-manifest.json) sichern die Auswertung. Der [Gesamtplan vor dieser Probe](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/overall-plan-before-cron-rehearsal-33ae75f7.md) und der [vorherige Prüfbericht](evidence/official-truth-production-http-allocator-cron-rehearsal-20261122/correction-report-before-cron-rehearsal-33ae75f7.md) sind bytegleich archiviert. Historische Hashmanifeste gelten für die darin gesicherten Fassungen; fortgeschriebene Statusdokumente werden zusätzlich im Git-Verlauf und in diesen Archiven erhalten.
