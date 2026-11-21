# Production-Leseauftrag PROD_READONLY_BASELINE_20261121: kontrollierter STOP

## Ergebnis

**Nach genau einer genehmigten READ-ONLY-Transaktion planmäßig gestoppt.** Die erste unveränderte Katalogabfrage wurde am **21.11.2026 um 17:27:49 Zürich / 16:27:49 UTC** auf `qscbgcdmivbbnzrcyegn` erfolgreich ausgeführt und lieferte **`STOP_REVIEW_NO_DATA_PHASE`**. Es gab keinen beobachteten SQL- oder Dienstfehler und keinen Retry. Der gesamte Aufruf dauerte **639 Millisekunden**; die Grenze von fünf Minuten und höchstens16 Transaktionen wurde eingehalten.

Die feste Vorlage setzt `supabase_functions.hooks.request_id` als Pflichtspalte voraus und verlangt mindestens fünf passende ID-Pfade. Der tatsächliche Production-Katalog enthält die Relation **`supabase_functions.hooks` nicht**; es gibt im freigegebenen Katalogsuchumfang **vier** vorhandene passende ID-Pfade. Damit greifen beide vorgesehenen Grenzen. **Diese Abweichung belegt keinen Betriebsfehler von Production.**

Die weiteren15 Dateien wurden nicht ausgeführt. **Kein BG1-Zustands-/Lauf-, Quellenqualifikations-, Cron-Lauf- oder ID-Höchstwert-Readback** erfolgte. Auch `last_value`/`is_called` der HTTP-Sequenz wurde nicht gelesen. Aus diesem abgebrochenen Paket entsteht kein aktuelles BG1-current-, Qualifikations- oder Kollisionsfreiheitsurteil.

## Verbindliche Ausführungsbindung

| Merkmal | Tatsächlicher Wert |
| --- | --- |
| Genehmigtes Paket | `PROD_READONLY_BASELINE_20261121` |
| Festes Connectorziel | `qscbgcdmivbbnzrcyegn` |
| Genehmigter Lieferstand | `a36e31a35a69e182d9991a52bd79be151ce19ed0` |
| Manifest-SHA256 | `a5966772cd006472bd38fdeae2ff80be2d970c0f3b8711e51c191b74f6fec8f9` |
| Tatsächlich ausgeführte Datei | `01-catalog.READONLY.sql` |
| Datei-SHA256 / Umfang | `be60971704fa33c3b958812878464893bb6df261e2167153c0f899e3bc70388b` / 21739 Bytes |
| Aufrufbeginn UTC | `2026-11-21T16:27:48.779Z` |
| Datenbank-Beobachtungszeit UTC | `2026-11-21T16:27:49.255986Z` |
| Rückkehr und sofortiger STOP UTC | `2026-11-21T16:27:49.418Z` |
| Datenbank-/Rollenkontext | postgres / current_user=postgres / session_user=postgres; PostgreSQL17.6 |
| Leseschutz | `transaction_read_only=on`, Kontextprüfung bestanden; unveränderte Datei mit `REPEATABLE READ READ ONLY` und abschließendem `ROLLBACK` |

Vor dem ersten Aufruf wurden **alle16 SQL-Dateien** nach Bytes und SHA256 gegen das genehmigte Manifest und die Git-Fassung geprüft. Die ausgeführte Abfrage wurde unmittelbar aus dieser unveränderten Datei übernommen. Manifest, SQL-Dateien und die genehmigte Owner-Vorlage bleiben unverändert; das vorliegende Ergebnis ist ein neuer, getrennter Beleg.

## Genau beobachtete Katalogabweichung

| Katalogprüfung | Ergebnis |
| --- | --- |
| Production-/Dev-Marker, Datenbank-/Rollen-/PG17-Kontext | Passend (`context_ok=true`) |
| Erforderliche Tabellen-/Spaltenform | **STOP:** `supabase_functions.hooks.request_id` fehlt, weil die Relation fehlt |
| Vorhandene bekannte ID-Pfade | 4, alle mit der erwarteten Form; keine unbekannten Pfade im definierten Suchumfang |
| Bekannte nicht vorhandene Relationen | 14, einschließlich Hooks und der13 Dev-spezifischen optionalen Pfade |
| Gebundene Mindestzahl | **STOP:** 4 statt mindestens5 |
| Eigentümer-/ACL-/Trigger-Ausgabegrenzen | Eingehalten |
| Bestehende Sequenz als BIGINT lesbar | Katalogseitig bestätigt; kein Sequenzwert gelesen oder verbraucht |

Die vier vorhandenen Pfade sind:

| Relation | Spalte | Speicherung |
| --- | --- | --- |
| `jetnity_prod_import_scheduler.dispatches_v1` | `net_request_id` | persistent |
| `official_v3_at_production_private.watch_requests_v1` | `request_id` | persistent |
| `net.http_request_queue` | `id` | UNLOGGED |
| `net._http_response` | `id` | UNLOGGED |

Die Abfrage liest daneben die im genehmigten Paket benannten Katalogmetadaten und Definitionshashes. Sie ruft keine Produktfunktion auf. Diese Metadaten ersetzen die wegen STOP nicht ausgeführte Phase2 oder eine vollständige Integritätsprüfung nicht.

## Grenzen und Folgearbeit

**Keine Production-Änderung durch diesen Auftrag:** keine DDL/DML, Sequenzvergabe, HTTP-/Quellenaktion, Rollenänderung, Owner-Aktion, Anmeldung/2FA oder Veröffentlichung. Es wurden keine neuen Kosten beauftragt. Normaler Hintergrundbetrieb wurde weder angehalten noch verändert.

Der einmalige Auftrag ist mit diesem STOP beendet; die verbleibende Zeit oder Aufrufzahl berechtigt nicht zu einer korrigierten Wiederholung. Eine spätere passende Lesevorlage müsste die tatsächlich fehlende Hooks-Relation ausdrücklich behandeln, die Kernabfrage entsprechend konkret neu binden und getrennt zur Freigabe vorgelegt werden. **Eine solche geänderte Vorlage wurde in diesem Auftrag nicht ausgeführt oder nachträglich in das genehmigte Paket eingeschleust.**

Der [vollständige Ausführungsbeleg](evidence/official-truth-production-readonly-20261121/execution.json) enthält die tatsächliche Connectorantwort, alle Stop-Gates, Zeiten, Dateihashes und die nicht ausgeführten Dateien. Das [Ergebnismanifest](evidence/official-truth-production-readonly-20261121/manifest.json) bindet diese neue Dokumentation. Die [genehmigte ursprüngliche Vorlage](OFFICIAL_TRUTH_PRODUCTION_READONLY_GO_2026-11-21.md) bleibt als historisch unveränderter Autorisierungsumfang erhalten. Abgelaufene fachliche Daten bleiben **derzeit nicht verfügbar**.
