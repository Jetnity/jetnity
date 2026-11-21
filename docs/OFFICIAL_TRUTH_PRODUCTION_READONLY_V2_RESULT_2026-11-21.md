# Production-Leseauftrag V2: abgeschlossen, offene Befunde dokumentiert

## Ergebnis

**Der einmalige genehmigte Leseauftrag ist innerhalb seines begrenzten Umfangs vollständig abgeschlossen:** drei unveränderte READ-ONLY-Transaktionen in **69,417 Sekunden**, am **21.11.2026 von18:42:30 bis18:43:40 Zürich**. Vier erforderliche ID-Pfade sind vorhanden,14 optionale Relationen wurden ausdrücklich als „nicht vorhanden“ erfasst. Ausschließlich die Kernvariante **ohne Hooks** wurde ausgeführt. Kein SQL-/Dienstfehler, kein Retry und keine Production-Änderung.

**Technischer Hauptbefund:** Der HTTP-ID-Zähler stand bei **3/called**, die gespeicherte AT-Anfragehistorie reicht bis **211**, die CH→DE-Dispatchhistorie bis **46**. Das zeigt einen hinter vorhandenen Nummern liegenden Zähler und ein Risiko erneuter Nummernvergabe. Es beweist weder tatsächlich doppelte IDs noch die Ursache der ebenfalls beobachteten fehlgeschlagenen AT-Quellenstarts.

**Fachlicher Befund im konkret gelesenen CH→AT-Visapfad:** drei Quellen im Research-Modus oder ohne Qualifikation; keine Quelle ist zugleich qualifiziert und außerhalb des Research-Modus. Drei Originale besitzen keine Legal-/Customer-Freigabe; **62 historische Fakten und 0 noch nicht abgelaufene Fakten**. Das ist keine vollständige Aussage über alle Länder, alle 50 Pässe oder andere AT-Tabellen. Abgelaufene Angaben bleiben **derzeit nicht verfügbar**.

## Ausführung und Grenzen

| Phase | Ausgeführte Datei | Datenbank-Beobachtung UTC | Ergebnis |
| --- | --- | --- | --- |
| 1 | `01-catalog.READONLY.sql` | 17:42:32.217748 | `READY_FOR_FIXED_READ_PHASES_ONLY`, alle Gates true; vier Pflichtpfade passend,14 optionale Relationen nicht vorhanden. |
| 2 | `02-bg1-at-cron.READONLY.sql` | 17:43:04.695814 | Begrenzte BG1-/Quellen-/Cron-Metadaten vollständig innerhalb der genehmigten Form- und Mengenlimits. |
| 3 | `03-core-id-maxima-without-hooks.READONLY.sql` | 17:43:40.217957 | Auswahl erneut bestätigt; genau vier Maxima und tatsächlicher Altsequenzstand gelesen. |

Die andere Kernvariante wurde nicht ausgewählt. Alle13 optionalen Einzelabfragen wurden wegen der in Phase1 bestätigten fehlenden Relationen ausgelassen. Alle17 verfügbaren Dateien waren vorher nach SHA256 und Bytes gegen den freigegebenen Git-Stand geprüft; es gab genau drei tatsächliche Aufrufe.

Die einzelnen Connectoraufrufe dauerten **1530ms /852ms /498ms**. Das gesamte Fenster einschließlich Ergebnisprüfungen betrug69,417Sekunden und blieb unter fünf Minuten. Gespeicherte Cron-Statuswerte `failed` sind Befunde der gelesenen Historie, keine Fehler der READ-ONLY-Abfragen. Es gab keine weitere Projekt-, Log-, Funktions- oder Besucherabfrage und keinen ausgelösten Quellen-/HTTP-Lauf.

## BG1-Metadaten zum Lesezeitpunkt

| Merkmal | Beobachtung |
| --- | --- |
| State / v3-Baseline | Je genau eine Singletonzeile. |
| Generation / Due | 1564 /17:40UTC. |
| Incident / Resume | 108 /108. |
| Gespeicherter vollständiger Beleg | 17:40:00.239144–17:40:11.782775UTC. |
| Gültigkeit | Bis17:45:30UTC; beim Metadatenread17:43:04UTC frisch. |
| State-/Run-Bindung | Genau ein vollständiger Run mit exakt passender Generation, Due, Start, Proofstart und Ende. |
| Zugehöriger erfolgreicher Cronlauf | Run23774, 17:40:00.230442–17:40:11.822555UTC; Belegintervall vollständig darin. |
| Begrenzte BG1-Historie | Vier gelesene Rows, alle `complete`; keine Behauptung lückenloser Historie außerhalb des Auszugs. |

Aktuelle und ausgeführte Job-Prüfsumme, Rolle und Datenbank stimmen überein. Der feste BG1-Command-Hash ist `8ae86f70caca6fcf890eb66de93873b0f13c49bd689e8c8cd6993c4bef561863`.

**Kein Guard-Validator, vollständiger aktueller Katalogvergleich oder öffentlicher Status-RPC wurde aufgerufen.** Die frischen gespeicherten Metadaten sind deshalb kein vollständiger BG1-PASS und keine Aussage über die Aktualität zu einem späteren Zeitpunkt.

## Cron und CH→AT-Quellen

| Einer der fünf geprüften aktiven Jobs | Drei jüngste erfasste Läufe |
| --- | --- |
| Production-BG1-Guard | 3× `succeeded` |
| AT-Quellen-Enqueue | **3× `failed`**, um17:30,17:35 und17:40UTC |
| AT-Quellen-Collector | 3× `succeeded` |
| AT-Erneuerung | 3× `succeeded` |
| CH→DE-Import-Scheduler | 3× `succeeded` |

Fehlgeschlagene Enqueue-Run-IDs: **23758,23767,23776**. Fehlertexte und Fehlercodes wurden entsprechend der Freigabe **nicht gelesen**; die Ursache ist unbekannt. Der Zusammenhang mit dem Sequenzstand oder einer bestimmten Schutzverweigerung ist nicht bewiesen.

Alle fünf Jobs sind aktiv und haben passende Datenbank-/postgres-Rollenmetadaten. Die vier vorab gebundenen Soll-Commands stimmen. Beim CH→DE-Job ist der nicht vorgegebene Sollvergleich absichtlich `NULL`; seine gelesenen Laufhashes stimmen mit dem aktuellen Job überein. Ein erfolgreicher Cronstatus beweist keinen neuen angenommenen Fakt, Quellenabruf oder Importabschluss.

| Aggregat im benannten Production-CH→AT-Pfad | Wert |
| --- | --- |
| Quellen in `source_pins_v1` | 3 |
| Qualifiziert und nicht Research / Research bzw. nicht qualifiziert | 0 /3 |
| Originale in `first_originals_v1` | 3 |
| Legal-Freigaben / Customer-Regelfreigaben | 0 /0 |
| Historische Rows in `ch_visa_facts_v1` | 62 |
| Zum Readback noch nicht abgelaufen | 0 |

Die Zählungen lagen unter den Sentinels und waren für die benannten Tabellen vollständig. Das positive Quellenaggregat zählt `source_qualified AND NOT research_only`, das andere `research_only OR NOT source_qualified`. Die beiden Flags wurden nicht einzeln gezählt; aus dem zweiten Aggregat wird daher kein einheitlicher Research-only-Flag für alle drei Quellen abgeleitet. Keine Quellenkörper, einzelnen Fakten, Owner-Zeilen oder Kundendaten wurden ausgegeben. Der Leseauftrag qualifiziert keine Quelle und ersetzt keinen fachlichen Review oder Besucher-Endtest.

## HTTP-ID-Befund

| Pfad oder Objekt | Beobachtung |
| --- | --- |
| `official_v3_at_production_private.watch_requests_v1.request_id` | Maximum211 |
| `jetnity_prod_import_scheduler.dispatches_v1.net_request_id` | Maximum46 |
| `net.http_request_queue.id` / `net._http_response.id` | Je `MAX=NULL`, beide Relationen vorhanden |
| Verwaltete HTTP-Sequenz | `last_value=3`, `is_called=true`; BIGINT, Schritt1, Cache1, kein Cycle |
| Speicherung / Owner | UNLOGGED / `supabase_admin` |
| Eigener persistenter Allocator / eigener Helper | Beide nicht vorhanden; keine Queue-Trigger im gelesenen Katalog |
| Aktuelle Queue-Rechte | SELECT und TRIGGER vorhanden; kein effektives Owner-USAGE/-SET zum verwalteten Owner |

`MAX=NULL` bedeutet keinen beobachteten Nicht-NULL-ID-Wert im vorhandenen Pfad; eine Zeilenzahl wurde nicht zusätzlich gemessen. Die14 optionalen Relationen einschließlich Hooks sind dagegen **nicht vorhanden**, nicht0 und keine scheinbar gelesenen NULL-Maxima.

Das zusammengefasste beobachtete Maximum der vier erfassten vorhandenen Pfade ist211. Inventur und Werte stammen aus unterschiedlichen begrenzten Snapshots; normale Produktion lief weiter und Sequenzwerte sind nicht gewöhnlich MVCC-gebunden. **211 ist kein freigegebener Reparaturstartwert.** Ebenso wenig werden eine tatsächliche Kollision oder die Ursache der Cronfehler behauptet.

Der in Dev geprüfte eigene LOGGED-Allocator mit engem Trigger ist ein Ansatz für ein separates Production-Paket. Die beobachteten Rechte ersetzen weder eine Production-Rehearsal noch eine Schutzkatalogfreigabe. Das Dev-Installationsskript bleibt wegen seiner Dev-Bindungen ungeeignet für eine direkte Production-Ausführung.

## Bindung, Aufbewahrung und nächste Grenze

Genehmigter Lieferstand **`2818b305970e34eec16f2d563ee76e2f9d70798b`**; V2-Manifest-SHA256 **`f1ae986842e67e8e2d5e9d96493d7a78b44bc0276839625d5b312210c04ae8c7`**.

| Tatsächlich ausgeführte Datei | SHA256 |
| --- | --- |
| Katalog | `fa1cd42d879210ab02eb15697748a3a065b0f0b655436a4b34971fccbd662ed4` |
| BG1-/AT-/Cron-Metadaten | `b5c959c5464e9c70f81e73fe2651c710cedd99974b19def5e28e47bda6406db9` |
| Kern ohne Hooks | `9fb016f967cc614185ee025984daec4550acf4124db8f394a1ce09ae23793086` |

[Ausführungsbeleg mit Originalantworten](evidence/official-truth-production-readonly-v2-20261121/execution.json), [getrennte Auswertung](evidence/official-truth-production-readonly-v2-20261121/interpretation.json) und [Ergebnismanifest](evidence/official-truth-production-readonly-v2-20261121/execution-manifest.json) binden die Durchführung. Rohantworten, gelesene Ergebnisobjekte und Grenzen wurden unabhängig lokal gegengeprüft; kein weiterer Production-Aufruf war nötig. Genehmigte SQL-Dateien, Manifest und Go-Text bleiben unverändert als historische Autorisierungsfassung; ihr damaliger Vorbereitungsstatus wird nicht zu einem Ausführungsbeleg umgeschrieben.

**Keine Production-Änderung, kein Neustart, keine HTTP-/Quellen-/Owneraktion, Rollenänderung, Anmeldung/2FA, Veröffentlichung oder neue Kosten.** Das Einmal-Go ist abgeschlossen und erlaubt keine weitere Diagnoseabfrage oder Reparatur. Ein späteres Paket muss Fehlerursache, eigene Production-Schutzbindungen, Sicherung und Rücknahme konkret vorbereiten und vor Ausführung zur Freigabe vorlegen. [Aktualisiertes Production-Prüfpaket](OFFICIAL_TRUTH_PRODUCTION_REVIEW_PACKAGE_2026-11-21.md).
