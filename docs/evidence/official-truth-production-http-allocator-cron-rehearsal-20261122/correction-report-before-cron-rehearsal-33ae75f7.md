# Cron-Schutzkorrektur des Production-HTTP-ID-Pakets

Stand: 22.11.2026. **Prüfpaket; keine Ausführung der neuen Production-Schreibdateien freigegeben.**

## Auftrag und Ausgangslage

Sasa beauftragt die Cron-Schutzkorrektur und deren vollständige Prüfung in Dev ohne Rollen- oder Rechteänderung und ohne zusätzliches Recht auf `cron.job` in Production. Zusätzlich ist eine neue, eng begrenzte rein lesende Nachprüfung des abgebrochenen Versuchs erlaubt. Dieser neue Leseauftrag ist getrennt vom verbrauchten Rehearsal-Auftrag; die alte Datei 11 wurde nicht nachträglich ausgeführt.

Die unveränderte alte Datei 10 endete einmalig mit SQLSTATE 42501, `permission denied for table job`. Der Fehlertext enthielt keinen Statementkontext. Die starke Cron-Sperre war eine plausible Ursache. Der neue Read bestätigt aktuell SELECT=true und MAINTAIN/UPDATE/DELETE/TRUNCATE=false; er erfindet dadurch keine nachträgliche genaue Fehlerposition. PostgreSQL 17 erlaubt mit SELECT die Sperre ACCESS SHARE; SHARE verlangt stärkere Rechte. [PostgreSQL 17 LOCK](https://www.postgresql.org/docs/17/sql-lock.html).

## Tatsächliche Production-Nachprüfung

Der neue Auftrag `PROD_HTTP_ALLOCATOR_POSTABORT_REVIEW_20261122` wurde **genau einmal** auf `qscbgcdmivbbnzrcyegn` ausgeführt: **22.11.2026,00:06:22.944557 UTC / 01:06:22.944557 Zürich**, Connectorlaufzeit **1,177 Sekunden**. READ ONLY / REPEATABLE READ / ROLLBACK, 12 s Statement-, 20 s Transaktions- und 500 ms Locktimeout, höchstens eine Ergebniszeile mit 262.144 Bytes. Keine App-/Guard-/Publisherfunktion wurde aufgerufen.

SQL-SHA-256: `622a3a05b2588eaa1189f0e8017463fa27af5f0eefdbe873aa67648635a8ca84` (37.402 Bytes).

| Beobachtung | Tatsächliches Ergebnis |
| --- | --- |
| Eigene Allocator-Namespace, v4-Baseline, benannter Trigger | Alle nicht vorhanden |
| Queue | 0 Zeilen, 0 synthetische Probe-URLs, 0 Trigger |
| Queue-Spalten, Methoden-Domain, Default und nativer Transport | Archivierter Stand exakt; Transporthash `60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f` |
| Bestehende Funktionsbindungen | 17/17 exakt einschließlich Owner, ACL, Konfiguration und Definition |
| Fünf bekannte Cron-Konfigurationen | 5/5 exakt zur archivierten Beobachtung; keine Schedule-/Active-/Command-/DB-/User-Abweichung |
| Bestehende v3→Query-Cost-Verknüpfung | Gespeicherte Anker und kanonische Vorgängerbindung stimmen |
| Cron-Rechte | SELECT vorhanden; MAINTAIN/UPDATE/DELETE/TRUNCATE nicht vorhanden |

Zusätzlich wurden erstmals die Job-IDs, Zielmetadaten und vollständigen Zeilenhashes dieser fünf Jobs gelesen. Alle Ziele sind localhost, Port 5432, passend zum Serverport. Diese neuen Werte binden den korrigierten Entwurf; sie werden nicht als bereits früher belegte Gleichheit ausgegeben.

Das Resultat lautet `POSTABORT_ARCHIVAL_METADATA_MATCH_OBSERVED_NO_REHEARSAL_PASS`. Es belegt den unveränderten verglichenen Zustand und das Fehlen der bekannten eigenen Rückstände. Es ersetzt keinen vollständigen Vorher/Nachher-Zeilensnapshot des fehlgeschlagenen Versuchs; ein solcher wurde von der alten10 nicht zurückgegeben. Natürliche Queue-, Cronlauf- und Zählerfortschritte sind kein behaupteter Gleichheitsbeleg. Ein aktueller BG1-, Publisher- oder positiver AT-Erneuerungs-PASS wird nicht daraus abgeleitet.

[Originalantwort](evidence/official-truth-production-http-allocator-cron-correction-20261122/02-production-postabort-execution.json), [ausgewertetes Ergebnis](evidence/official-truth-production-http-allocator-cron-correction-20261122/02-production-postabort-result.json), [unabhängiger Gegencheck](evidence/official-truth-production-http-allocator-cron-correction-20261122/02-production-postabort-independent-review-at-source-guard.json).

## Inhalt der Korrektur

Die Queue-, Producer- und Ledger-Sperren bleiben die maßgeblichen Barrieren der ID-Vergabe. Sie sichern den frischen Höchstwert und verhindern konkurrierende gewöhnliche Queue-Schreibzugriffe während der Umstellung. Hier wird kein Recht abgeschwächt oder erweitert.

Für Cron verwendet der Entwurf ausschließlich SELECT und ACCESS SHARE. Vorher-/Nachherprüfungen erkennen beobachtete fremde Schreiber, Konfigurationsänderungen und geänderte Zeilenversionen. Die zusätzlichen xmin-/ctid-Werte erkennen auch den Fall, dass eine bestehende Zeile geändert und ihr fachlicher Wert anschließend zurückgesetzt wird.

Die fünf relevanten Cron-Jobs werden über die unabhängig gelesenen vollständigen Konfigurationshashes in den neuen BG1-Transportzweig eingebunden. So werden auch spätere Änderungen an Ziel, Identität oder anderen Zeilenfeldern sichtbar. Die neue Baseline übernimmt genau einen bereits erfassten und geprüften Katalogwert. Ein weiterer ungeprüfter Katalogaufruf unmittelbar beim Speichern darf keinen zwischenzeitlich veränderten Stand einlernen.

**Grenze:** ACCESS SHARE friert Cron-Datenänderungen nicht ein. Ein spurloses Insert/Delete zwischen Beobachtungen oder eine Änderung nach der letzten Beobachtung ist kein versprochener globaler Sperrnachweis. Eine bleibende Abweichung der fünf gebundenen Jobs wird vom neuen Katalog nicht als neuer Sollzustand übernommen; die nach einer Installation erforderliche natürliche BG1-Prüfung muss mit dem fest gebundenen Zustand übereinstimmen. Fremde, nicht zu diesen fünf Jobs gehörende Cron-Konfigurationen werden nicht als dauerhaft vollständig überwacht behauptet.

Die Korrektur fordert weder `supabase_admin`, zusätzliche Cron-Rechte, eine Owner-Aktion noch einen neuen Login. Bestehende Rollen und ACLs bleiben unangetastet. Die bereits im ursprünglichen Installationsentwurf enthaltene private Zugriffsbeschränkung ausschließlich neu angelegter eigener Objekte bleibt im vorbereiteten Paket sichtbar; sie ist keine ausgeführte Production-Rechteänderung.

## Dev-Nachweise und Paketentscheidung

**Aktualisierung 22.11.2026, 02:35:47 Zürich: Die 14 nativen Prüfgruppen und der echte Zwei-Sitzungs-Paralleltest sind bestanden.** Die vorherige Blockierung durch die abgelaufene technische Bestätigung ist durch neue tatsächliche Dev-Belege abgelöst. Der damalige Bericht bleibt [bytegleich archiviert](evidence/official-truth-dev-cron-validation-20261122/cron-correction-report-before-dev-validation-e28207ee.md); verlorene und abgelaufene Aufrufe werden nicht nachträglich als erfolgreich ausgegeben.

Nach der Bestätigung durch Sasa wurde Setup00 mit exakt dem bisherigen Hash ausgeführt. Datei10 lieferte 14/14 native PASS und ROLLBACK. Der erste Parallelversuch scheiterte an beiden Handshake-Fristen und bleibt als Fehler erhalten. Derselbe Writer/Reader mit denselben Zeitgrenzen bestand danach über zwei getrennte Ausführungssitzungen: tatsächlicher fremder Writer erkannt, vom gemeinsamen Core verweigert, Rollback beobachtet und fünf exakte Fixturezeilen wieder akzeptiert. Keine SQL-Datei wurde zum Bestehen gelockert.

Cleanup30 entfernte ausschließlich die beiden Testtabellen und ihre private Namespace mit COMMIT. Ein unabhängiger READ ONLY-/ROLLBACK-Aufruf um 01:35:47.649164 UTC bestätigte ihre Abwesenheit, den exakten bestehenden v8-Katalog, unveränderte Cron-Rechte sowie null aktive Testsitzungen und null Testlocks. Rollen, ACLs, reale Cron-Jobs, Fakten und Originale wurden nicht geändert. Die in Datei10 gesicherten Sequenz-/Guardzustände wurden dort vollständig erhalten; natürliche spätere Cronfortschritte sind keine behauptete globale Zählergleichheit.

Der [vollständige Dev-Ergebnisbericht](OFFICIAL_TRUTH_DEV_CRON_VALIDATION_RESULT_2026-11-22.md), das [native Gesamtergebnis](evidence/official-truth-dev-cron-validation-20261122/runtime-result.json) und das [neue Ergebnismanifest](evidence/official-truth-dev-cron-validation-20261122/execution-manifest.json) enthalten 14 Einzelgruppen, Rohantworten, Parallelfehler/-erfolg, Cleanup, unabhängige Reviews und alle Hashbindungen. Das ursprüngliche Dev-Testmanifest `f9ff5d7ce9c47d39e32d013a8271234e9a6c1101deec517fe54a7bea5689f5d1` und das nachfolgende Production-Manifest bleiben unverändert eingefrorene Vorbereitungspakete; die Ausführungsbelege ergänzen deren damaligen Status getrennt.

**Reichweite:** Der bytegebundene gemeinsame Cron-Core wurde auf einer eigenen Dev-Fixture mit den fünf archivierten Originalzeilen geprüft; nicht der gesamte Production-Installer oder die gesamte Production-Katalogfunktion. Die letzte Fortsetzung hatte ausschließlich Dev-Freigabe und enthält **keinen Production-Aufruf**, auch keinen Read. Die historische Production-Nachprüfung oben bleibt ein separat datierter Beleg. Für jede zukünftige Production-Rehearsal oder Installation fehlt weiterhin das neue, ausdrückliche, datei- und hashgebundene Go.

### Neue Production-Dateien und SHA-256

Der neue [Paketindex](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/README.md) und das [Manifest](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/MANIFEST.json) enthalten den vollständigen Prüfumfang. **Diese Dateien sind nicht ausgeführt.**

| Datei | Zweck und Grenze | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| [10-production-http-id.REHEARSAL-ROLLBACK.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/10-production-http-id.REHEARSAL-ROLLBACK.sql) | Rehearsal; vollständiger ROLLBACK | 113.322 | `2d71da79604a37f762f89a69eb399439b94d175ebc65504584533bc85259c982` |
| [11-production-http-id.POSTREHEARSAL-READONLY.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/11-production-http-id.POSTREHEARSAL-READONLY.sql) | Unabhängiger READ ONLY-Nachread; ROLLBACK | 29.501 | `99b09948db844dc9198f5f4e4c92eeb83f41d8c87f533f009592aec13109f224` |
| [20-production-http-id.INSTALL-COMMIT.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/20-production-http-id.INSTALL-COMMIT.sql) | Installation mit COMMIT; gesondert gesperrt | 106.669 | `1c6919aa7672de029f1c3efa22f26b7d83b7d0d1fb664c5da155a8ea0f783f3f` |
| [30-production-http-id.FENCE-ROLLBACK.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/30-production-http-id.FENCE-ROLLBACK.sql) | Fence-Probe; ROLLBACK; erst nach neuer Commit-Bindung | 35.286 | `4535acf918d96f6851cebe4463ed994154fe9d220a1d073384fcb434de0efc44` |
| [40-production-http-id.FENCE-COMMIT.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/40-production-http-id.FENCE-COMMIT.sql) | Dauerhafte Fence; gesondert gesperrt | 35.020 | `0f1b65076f4fb8191fc5bff821001fe67b54e3e8b3c1dab1976f6f3fb7a85a98` |
| [50-production-http-id.POSTCOMMIT-READONLY.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-cron-correction-20261122/50-production-http-id.POSTCOMMIT-READONLY.sql) | READ ONLY nach tatsächlich erfolgtem COMMIT | 9.347 | `cc6fc3738eaf5ddfc7fdee801d96f99abcc6ddb90a10ce58052f45b48039d591` |

Manifest-SHA-256: `90c439a9f818074f68c6f12c7a2716b947ebc65d9af925f97cc502613e3be024`.

Der gemeinsame Core hat SHA-256 `6fb59e9ce1da9a43527fd0a945dd18dbfec6a14726ea1667674e14ea340fdd79`. Der deterministische lokale Zweitlauf erzeugte alle acht generierten Dateien bytegleich und bestätigte alle 22 bisherigen Manifestdateien unverändert. Das ist eine lokale Reproduktions-/Quellenprüfung, kein nativer Parser- oder SQL-Laufzeit-PASS.

### Rücknahme, Stoppregeln und spätere Entscheidung

Vor einer Production-Installation muss zuerst die vollständige Dev-Abnahme vorliegen. Danach braucht die neue Production-Rehearsal ein separates, an diese neuen SHA-256-Werte gebundenes Go. Die vorgesehene Reihenfolge bleibt10 →11, jede Datei höchstens einmal, höchstens zwei Transaktionen innerhalb fünf Minuten,10 vollständig ROLLBACK und11 READ ONLY mit ROLLBACK. Der negative Publisher-Aufruf in10 gehört nur mit ausdrücklicher Freigabe dazu und muss exakt0 ergeben. Keine positive Quellen-/Publisheraktion wird freigegeben.

Bei SQL-/Dienstfehler, unbekannter Form, fehlender oder geänderter Bindung, gesperrtem BG1, beobachtetem Cron-Schreiber, Cron-Drift, unklarem Ergebnis, falschem Publisherwert oder überschrittenen Zeit-/Ausgabegrenzen gilt STOP ohne Retry/Zusatzread. Der neue Entwurf erweitert die bisher fehlgeschlagene einmalige Freigabe nicht.

Die Rehearsal entfernt ihre neuen Objekte durch vollständigen ROLLBACK. Nach einem später separat freigegebenen echten COMMIT darf eine Rücknahme weder die laufenden IDs zurücksetzen noch den Queue-Trigger blind entfernen. Die vorbereiteten Fence-Dateien30/40 bleiben vor DDL gesperrt, bis eine unabhängig gelesene tatsächliche Commit-Bindung samt neuem Hashsatz und gesondertem Go vorliegt.50 dient nur dem späteren Nachread. Auch nach Installation bleibt ein neuer natürlicher vollständiger BG1-Beleg erforderlich; es wird kein Audit künstlich gestartet und keine Quellenfreigabe vorgetäuscht.


## Unveränderliche Historie

Die genehmigten alten SQL-Dateien, deren Manifest und alle bisherigen Belege bleiben bytegleich erhalten. Der Gesamtplan vor dieser Fortsetzung ist unter [Stand81b872bc](evidence/official-truth-production-http-allocator-cron-correction-20261122/overall-plan-before-cron-correction-81b872bc.md) archiviert. Abgelaufene Daten bleiben **„derzeit nicht verfügbar“**.

