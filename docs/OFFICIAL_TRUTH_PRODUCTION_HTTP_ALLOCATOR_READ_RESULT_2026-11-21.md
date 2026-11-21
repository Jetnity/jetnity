# Production-HTTP-Allocator – Ergebnis des einmaligen Leseauftrags vom 21.11.2026

**Status: Die zwei freigegebenen READ-ONLY-Dateien wurden je genau einmal ausgeführt; nach dem Stoppergebnis der zweiten Datei endete der Auftrag ohne Retry. Die Schreibdateien bleiben ungebunden und unausgeführt.**

Die drei fest ausgewählten AT-Abrufe scheiterten laut erhaltenem Fehlerprotokoll an einer Request-ID-Unique-Verletzung. Der zweite Read liefert keinen Transportfingerprint, weil seine zusammengefasste Queue-Formprüfung scheitert. Eine nachfolgende reine Prüfung der offiziellen pg_net-0.19.5-Quelle zeigt zwei falsche Annahmen in unserer Vorlage. Daraus wird keine unbeobachtete Production-Änderung abgeleitet.

## 1. Freigabe und tatsächliche Ausführung

Owner-Go: **`PROD_HTTP_ALLOCATOR_READ_20261121`**, ausschließlich Projekt **`qscbgcdmivbbnzrcyegn`**, unveränderte Dateien aus **`PROD_HTTP_ALLOCATOR_PACKAGE_20261121`**. Der neue Owner-Name dieses Leseauftrags ersetzt für diese Ausführung den früher lediglich vorgeschlagenen Namen `PROD_HTTP_ID_DIAGNOSE_BINDINGS_20261121`; er erweitert weder Dateien noch Rechte.

| Datei | SHA-256 | Ergebnis |
| --- | --- | --- |
| `00-at-enqueue-diagnosis.READONLY.sql` | `d3b3a83fd36e295978b2e670549a3bce9132402ec7ca81764b95b16a39392397` | `PROD_THREE_HISTORICAL_CRON_FAILURE_SIGNATURES_OBSERVED` |
| `01-required-bindings.READONLY.sql` | `688def1ae033992cc9f36ea26145722bd869dfe1db971e86c00b231b7aa10ce5` | `STOP_QUEUE_SHAPE_OR_LEGACY_DEFAULT_CHANGED` |

Das ursprüngliche Manifest bleibt unverändert, SHA-256 **`ef166a30a16cbb9cb6ca33702b51c659f0ce0400668b54d1e6dddbf820086d65`**. Beide SQL-Dateien wurden vor Ausführung auf ihre vollständigen SHA-Werte, Bytezahlen, Manifestbindung und Gleichheit mit dem genehmigten Vorbereitungscommit `e4bab62e6d0e4e902056d78581128c675da7391c` geprüft.

Die beiden tatsächlichen Datenbankbeobachtungen erfolgten um **21:39:51,973688** und **21:40:24,871630 Uhr Zürich**. Das gesamte Auftragsfenster bis zur zweiten Toolantwort dauerte **34,519 Sekunden**, einschließlich der lokalen Zwischensicherung und Ergebniskontrolle. Genau **zwei Transaktionen**, je `REPEATABLE READ READ ONLY`, festes abschließendes `ROLLBACK`; kein zusätzlicher Projekt-, Datenbank-, Log-, Health- oder Advisor-Read. Die Antworten bestätigen `read_only=true`.

Die unveränderten SQL-Dateien setzen ihre Grenzen selbst: 00 mit 8 Sekunden Statement-/12 Sekunden Transaktionsgrenze, 01 mit 12/20 Sekunden, beide mit 500 Millisekunden Locktimeout. Die zwei dekodierten Ergebnisarrays umfassen zusammen **12.020 Bytes**. Der Connector stellte keinen zusätzlichen separaten ROLLBACK-Receipt bereit; der Beleg besteht aus der exakt übergebenen vollständigen SQL-Datei samt `ROLLBACK`, der erfolgreichen Toolantwort ohne SQL-Fehler und dem READ-ONLY-Ergebnis. Es wurde hierfür kein unfreigegebener Bestätigungsread angehängt.

Die Per-Call-Werte 588/526 Millisekunden messen die Connectoraufrufe. Die vollständig protokollierten Aufruffenster einschließlich vorheriger Intent-Sicherung betragen 1.583/1.128 Millisekunden. Beide Messarten sind im [Ausführungsbeleg](evidence/official-truth-production-http-allocator-read-20261121/execution.json) ausdrücklich getrennt.

## 2. Was die drei AT-Fehler tatsächlich zeigen

Die fest gebundenen historischen Runs **23758, 23767, 23776** vom 21.11. um 18:30, 18:35 und 18:40 Uhr Zürich sind vollständig wiedererkannt: Start-/Endzeit, Job, Commandbindung, Status und heutiger Enqueue-Definitionsfingerprint passen zum freigegebenen Vertrag.

Alle drei protokollieren **`UNIQUE_VIOLATION_AT_REQUEST_ID`**. Jeder erhaltene Fehlertext hat 489 Bytes; ausgegeben wurden nur die feste Klassifikation, der SHA-256 und die vorgesehenen Booleschen Bindungen. Rohe Fehlertexte, DETAIL-/CONTEXT-Inhalte oder konkrete Datensatzwerte wurden nicht zurückgegeben.

Damit ist die **protokollierte Fehlerkategorie** belegt. Es ist weder bewiesen, dass doppelte IDs als zwei Zeilen gespeichert wurden, noch ist die vollständige Kausalkette vom Sequenzzustand bis zum Fehler damit bewiesen. `23505` ist der passende Referenzcode der Klassifikation; `cron.job_run_details` lieferte keinen separat beobachteten SQLSTATE. Der aktuelle BG1-/Besucherstatus und eine positive AT-Qualifikation waren nicht Gegenstand dieses Reads.

## 3. Warum die Schreibbindung stoppt

01 bestätigt den Kontext, die begrenzte Katalogabfrage und genau die vier erwarteten ID-Pfade. Die zusammengefasste Bedingung `exact_queue_shape_and_legacy_default` ist jedoch **false**. Deshalb wurde der umfassende Transportwert innerhalb der SQL-Abfrage gar nicht aufgebaut; **`native_transport_sha256=NULL`**, keine Transportverbraucher-Fingerprintliste.

Der gelesene ID-Default-SHA **`fffafa169a89e0a8f0017a62f90dd0051226a9a49c231dc9e98957f990860f36`** entspricht exakt der vorbereiteten Erwartung `nextval('net.http_request_queue_id_seq'::regclass)`. Die Sammelbezeichnung des STOP-Codes ist daher kein Nachweis eines geänderten Defaults. Welche andere Einzelbedingung im tatsächlichen Katalog scheitert, lässt dieser Read offen.

Die anschließende Offline-Prüfung der [offiziellen pg_net-0.19.5-SQL-Quelle am festen Commit](https://github.com/supabase/pg_net/blob/a7792bfd913c7859e14025d606624982706c2a7f/sql/pg_net.sql) zeigt:

| Spalte | Annahme unserer unveränderten 01 | Offizielle Erstellungsdefinition 0.19.5 |
| --- | --- | --- |
| `method` | `pg_catalog.text` | `net.http_method`, eine Domain über Text |
| `headers` | `NOT NULL` | `jsonb`, NULL zulässig |

Die Domain ist **kein Enum**. Die primäre Definition begrenzt den Text auf GET/POST/DELETE ohne Unterscheidung der Groß-/Kleinschreibung. Diese Quellenprüfung belegt die falschen Vorlagenannahmen gegenüber dem offiziellen Erstellungsstand, **nicht** die vollständige derzeitige Hosted-Tabelle oder deren Upgradehistorie. Der genaue Istvergleich benötigt den nun separat vorbereiteten Katalogread.

Die [gesicherte Primärquelle](evidence/official-truth-production-http-allocator-read-20261121/pg-net-0.19.5-sql-source.txt) hat 9.487 Bytes, SHA-256 `a87097c3b19d4583c5b0eefe28f97e34495e2acb67b8f7bde24ed75ccdead8b5`. Ihr Git-Blob-SHA `09d6bc72fbf7922a7660dc0ea0261a303b5d86a2` wurde bytegenau gegen den offiziellen gepinnten Repository-Tree nachgerechnet. Die Datei ist nur Quellenbeleg und wird nicht ausgeführt.

Alle elf bereits in V2 enthaltenen und nun vergleichbaren Funktionsdefinitionen und -körper sind hashgleich. Sechs zusätzliche Funktionsfingerprints sind erstmals in diesem festen Umfang dokumentiert. Zwei abweichende Konfigurationshashes begründen keinen Driftbefund: V2 serialisierte mit `array_to_json`, 01 mit `to_jsonb`; die Textdarstellung mehrgliedriger Arrays unterscheidet sich. Diese Teilinformationen ersetzen den fehlenden Transportfingerprint nicht.

## 4. Folgepaket und Freigabegrenze

Die bisherigen Rehearsal-, Installations-, Fence- und Readback-Dateien bleiben **unverändert und unausgeführt**. Es gibt keinen sicher gelesenen Wert, mit dem `native_transport_sha256` jetzt gebunden werden dürfte. Auch der Pin eines später tatsächlich installierten Nachfolgers bleibt NULL. Ein scheinbar fertiges Schreibpaket mit erfundenen oder aus Teilhashes konstruierten Bindungen wird nicht vorgelegt.

Stattdessen liegt ein [neuer, einzelner Detailread zur gesonderten Freigabe](OFFICIAL_TRUTH_PRODUCTION_HTTP_ALLOCATOR_QUEUE_REVIEW_GO_2026-11-21.md) vor. Er soll aus demselben begrenzten READ-ONLY-Snapshot die einzelnen Spalten-/Typ-/NULL-/Default-Prädikate und die begrenzten Transportbindungen liefern. Der ursprüngliche Vergleich bleibt nachvollziehbar; der Vergleich mit dem offiziellen 0.19.5-Domaintyp wird getrennt ausgewiesen. Kein Read-Ergebnis erteilt automatisch eine Reparaturfreigabe.

Der alte Einmalauftrag ist **verbraucht und beendet**. Die Stopregel und „kein Retry“ stammen ausdrücklich aus dem Owner-Go. Der neue SQL-Text braucht deshalb ein **neues separates Go**. Nach dessen Auswertung können die Schreibdateien sachlich korrigiert, genau gebunden und mit neuen SHA-Werten als getrenntes Paket geprüft werden. Auch dann ist weder Rehearsal noch Installation durch einen Leseauftrag freigegeben.

## 5. Erhaltene Grenzen

Keine Production-Mutation, kein Queueeintrag, keine HTTP-/Quellenaktion, kein Owner-Schritt, keine Rollen-/Secretänderung, keine Anmeldung/2FA, keine Kosten und keine Veröffentlichung. Keine AT-Quellenqualifikation oder Gültigkeitserneuerung. Abgelaufene Fakten bleiben **„derzeit nicht verfügbar“**. Die durch #1269 bestätigte GitHub-Zeitplanpause und die Dev-Passkey-Entscheidung bleiben unberührt.

[Ausführungsbeleg](evidence/official-truth-production-http-allocator-read-20261121/execution.json), [Auswertung](evidence/official-truth-production-http-allocator-read-20261121/interpretation.json) und [unabhängiger Review](evidence/official-truth-production-http-allocator-read-20261121/independent-review.json) enthalten die genauen Grenzen. Die Prüfung war keine native Rehearsal-, Installations-, Neustart-, Transport- oder positive Erneuerungsabnahme.
