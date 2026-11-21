# Neuer Production-Leseauftrag V2 – optionale Tabellen korrekt behandeln

**Zur ausdrücklichen Freigabe vorbereitet; nicht ausgeführt.** Ziel ausschließlich `qscbgcdmivbbnzrcyegn`. Neuer Auftragsname: **`PROD_READONLY_BASELINE_20261121_V2`**. Die Vorbereitung verwendet nur den bereits gesicherten Katalogbefund und die Repository-Dateien; sie enthält keinen neuen Production-Zugriff.

## Was sich gegenüber dem ersten Auftrag ändert

Der [erste Auftrag](OFFICIAL_TRUTH_PRODUCTION_READONLY_RESULT_2026-11-21.md) stoppte korrekt, weil seine Kernabfrage die in Production fehlende Tabelle `supabase_functions.hooks` voraussetzte. V2 unterscheidet nun **vier konkrete Pflichtpfade** von **14 ausdrücklich optionalen Pfaden**. Eine fehlende optionale Relation wird als **„nicht vorhanden“ / `ABSENT_RELATION`** dokumentiert. Sie bekommt weder den Höchstwert0 noch einen scheinbar gelesenen NULL-Wert.

Für die Kernmaxima gibt es zwei vorab festgelegte SQL-Dateien: **mit Hooks** oder **ohne Hooks**. Nach einem neuen Katalogread wird genau eine gewählt. Die Ohne-Hooks-Datei enthält keinen direkten Tabellenzugriff auf Hooks; dadurch muss PostgreSQL keine fehlende optionale Tabelle auflösen. Beide Varianten prüfen ihre Auswahl sowie die vier Pflichtpfade und die Sequenzrechte erneut im eigenen Snapshot. Ändert sich der Befund inzwischen, gilt STOP; es wird nicht zur anderen Variante gewechselt oder wiederholt.

Vorhandene Tabellen mit fehlenden/falsch typisierten Spalten, unerwarteter Tabellenform oder fehlenden Leserechten bleiben ein Abbruchgrund. Fehlende Pflichtobjekte bleiben ebenso STOP. Die ursprünglichen Dateien, das erste Manifest und der tatsächliche STOP-Beleg bleiben unverändert erhalten.

## Konkrete Go-Formulierung

> Go für den einmaligen, eng begrenzten Production-Leseauftrag `PROD_READONLY_BASELINE_20261121_V2` auf `qscbgcdmivbbnzrcyegn`, ausschließlich mit den unveränderten SQL-Dateien und SHA-256-Werten des V2-Manifests. Erlaubt sind Katalog-/BG1-/Quellenqualifikations-/Cron-Metadaten und feste aggregierte HTTP-ID-Höchstwerte, höchstens16 READ-ONLY-Transaktionen innerhalb von fünf Minuten. Fehlende ausdrücklich optionale Relationen werden als „nicht vorhanden“ erfasst. Von den beiden festgelegten Kernvarianten wird ausschließlich die vom neuen Katalogread bestimmte Datei einmal ausgeführt. Bei Fehler, unbekannter Form, fehlendem Pflichtobjekt oder Überschreitung stoppen; kein Retry. Keine Production-Änderung, HTTP-/Quellenaktion, Owner-Aktion, Rollenänderung, Anmeldung/2FA oder Veröffentlichung ist freigegeben.

Die [SQL-Dateien](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-readonly-go-20261121-v2/) und das [V2-Manifest](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-readonly-go-20261121-v2/MANIFEST.json) binden den vollständigen Umfang. Es gibt **17 verfügbare Dateien**, aber wegen der strikt alternativen Kernabfragen **höchstens16 ausgeführte Transaktionen**. Es wird kein SQL aus dem Katalogbefund erzeugt oder nachträglich verändert.

## Pflicht und Optionalität

| Bereich | Behandlung |
| --- | --- |
| `official_v3_at_production_private.watch_requests_v1.request_id` | Pflicht; BIGINT, gewöhnliche persistente Tabelle, passende Rechte und Form. |
| `jetnity_prod_import_scheduler.dispatches_v1.net_request_id` | Pflicht; BIGINT, gewöhnliche persistente Tabelle, passende Rechte und Form. |
| `net.http_request_queue.id` | Pflicht; BIGINT, gewöhnliche UNLOGGED-Tabelle, passende Rechte und Form. |
| `net._http_response.id` | Pflicht; BIGINT, gewöhnliche UNLOGGED-Tabelle, passende Rechte und Form. |
| `supabase_functions.hooks.request_id` | Optional. Fehlende Relation: `ABSENT_RELATION`; vorhandene passende Relation: `PRESENT_FIXED`; vorhandene falsche Form oder fehlende Schema-/Tabellenrechte: STOP. |
| Die13 weiteren benannten ID-Pfade | Optional, vollständig im Manifest aufgeführt. Nur vorhandene passende Pfade werden mit der zugeordneten festen Einzeldatei gelesen; fehlende werden ausdrücklich als „nicht vorhanden“ protokolliert. |
| BG1-State/Run/v3, Quellenqualifikations-/Original-/Faktentabellen, Cron und bestehende HTTP-Sequenz | Bisherige erforderliche Objekte und Spalten bleiben erforderlich. Ein fehlendes solches Objekt wird nicht durch die neue Optionalität freigegeben. |

Die vier Pflichtpfade werden **einzeln** anhand ihres vollständigen Namens geprüft. Eine beliebige Anzahl anderer Tabellen kann ein fehlendes Pflichtobjekt nicht ersetzen. Die Kataloginventur bleibt auf den bisherigen Suchumfang passender BIGINT-Request-ID-Spalten beschränkt und berücksichtigt alle18 vorab bekannten Pfade; neue/unbekannte passende Pfade führen zu STOP. „Nicht vorhanden“ ist eine Katalogbeobachtung dieses Zeitpunkts, keine Aussage über alle früheren Installationen.

## Feste Ausführungsreihenfolge

| Phase | Datei oder Auswahl | Bedingung |
| --- | --- | --- |
| 1 | `01-catalog.READONLY.sql` | Einmal neuer Katalogread. Nur `READY_FOR_FIXED_READ_PHASES_ONLY`, `data_phase_allowed=true`, konsistente Pflicht-/Optionalbefunde und eine bekannte `selected_core_query_file` erlauben Phase2. |
| 2 | `02-bg1-at-cron.READONLY.sql` | Unveränderte direkte, begrenzte Metadatenabfrage; keine Produktfunktion. Bestehende Mengen-/Formgrenzen gelten weiter. |
| 3a | `03-core-id-maxima-without-hooks.READONLY.sql` | Ausschließlich bei Hooks=`ABSENT_RELATION`; exakt vier `path_maxima`, Hooks gesondert „nicht vorhanden“. |
| 3b | `03-core-id-maxima-with-hooks.READONLY.sql` | Ausschließlich bei Hooks=`PRESENT_FIXED`; exakt fünf `path_maxima`. **3a und3b sind gegenseitig ausgeschlossen.** |
| 4 | `04-extra-01` bis `04-extra-13` | Je Datei höchstens einmal und nur bei genau passendem `PRESENT_FIXED` aus Phase1. Fehlende Relationen werden ohne Datenabfrage als „nicht vorhanden“ festgehalten. |

Die beiden Kernvarianten sind bereits gehasht. Eine `CASE`-Bedingung um einen direkten Zugriff auf eine fehlende Tabelle wäre kein Ersatz für die getrennte Ohne-Hooks-Datei. Eine nach Phase1 hinzugekommene oder entfernte Hooks-Relation wird durch die erneute Auswahlprüfung bzw. einen nativen Bindungsfehler erkannt und beendet den Auftrag.

## Unveränderte Zeit-, Mengen- und Sicherheitsgrenzen

- **Höchstens16 Aufrufe innerhalb von fünf Minuten** ab dem ersten tatsächlichen Aufruf; keine Wiederholung, auch nicht nach einem Dienstfehler. Eine nicht vollständig gelesene Baseline bleibt unvollständig.
- Phasen1,2 und genau eine Phase3: jeweils **8 Sekunden Statementtimeout / 12 Sekunden Transaktionstimeout**. Die optionalen Einzelabfragen: jeweils **3/5 Sekunden**. Theoretisches gesamtes Transaktionsbudget weiter maximal **101 Sekunden**.
- Pro Abfrage **500 Millisekunden Locktimeout**, keine explizite Sperre und keine Wartungsruhe. Normale Lesesperren bleiben möglich.
- Ausgabecaps unverändert: Katalog **64 KiB**, Metadaten **16 KiB**, gewählte Kernabfrage **4 KiB**, jede optionale Einzelabfrage höchstens **1 KiB**; insgesamt höchstens **99328 Bytes**.
- Quelle/Original-Sentinel unverändert bei4, Fakten-Sentinel bei1001. Bei unvollständigen Zählungen STOP. Je genau eine State- und v3-Baseline-Singletonzeile; genau fünf verschiedene erwartete Cronjobs. Kontext-, Form-, Mengen- oder Ausgabefehler stoppen den Auftrag.
- Jede Datei verwendet **`BEGIN … REPEATABLE READ READ ONLY`**, `search_path=pg_catalog,pg_temp`, lokale Zeitgrenzen und abschließend **`ROLLBACK`**. Keine DDL/DML, Rollenwechsel, Sequenzvergabe, Produktfunktion oder HTTP-/Quellenaktion.
- Kein Abruf von HTTP-Körpern, Userdaten, Owner-Quittungen, Tokens, Vaultwerten, Passwörtern, vollständigen Funktionsdefinitionen, Cronbefehlen oder Cron-Fehlertexten. Nur die bereits vorgesehenen Metadaten, Hashes und Aggregate.

Die Rolle benötigt für vorhandene Datenobjekte die tatsächlichen Schema-`USAGE`- und Tabellen-/Sequenzleserechte. Das Paket erteilt keine Rechte. Projektbindung erfolgt ausschließlich über den expliziten Connectorparameter `qscbgcdmivbbnzrcyegn`; SQL-Literale und Production-Marker sind ergänzende Prüfungen, kein eigenständiger Identitätsbeweis. Login/2FA ist nicht Bestandteil des Go.

## Ergebnisbedeutung und Prüfung der Vorbereitung

Ein vorhandener Pfad mit `MAX=NULL` wird als vorhandener Pfad ohne beobachtete Nicht-NULL-ID geführt. Das ist von einer nicht vorhandenen Relation getrennt. Erst nach Vollständigkeitsabgleich aller tatsächlich vorhandenen erlaubten Pfade darf ein zusammengefasstes beobachtetes Maximum ausgewiesen werden. Unterschiedliche Transaktionen besitzen unterschiedliche Snapshots; Sequenzwerte sind keine gewöhnlichen MVCC-Tabellenstände. Daher sind die Maxima **kein sicherer Reparaturstartwert und kein Nachweis künftiger Kollisionsfreiheit**.

BG1-Zeit-/Laufmetadaten ersetzen keinen vollständigen Katalogvalidator. Ein frischer gespeicherter Status oder positive Quellenzähler bedeuten keine neue fachliche Quellenqualifikation, Öffnung oder Veröffentlichung. Abgelaufene fachliche Daten bleiben **derzeit nicht verfügbar**.

Die Vorbereitung wurde anhand der tatsächlichen historischen Katalogantwort vom **21.11.2026, 17:27:49 Zürich** und der festen Dateien geprüft. Dieser gespeicherte Befund wird nicht als frischer V2-Readback ausgegeben. Die Auswahl und Abwesenheitsbehandlung sind unabhängig statisch geprüft; Hash-/Datei-/Grenzvergleiche ergänzen diese Durchsicht. **Keine native Parser-/Datenbankausführung und kein Runtime-PASS für V2 werden behauptet.** Die geänderte Katalogdatei und die später ausgewählte Kernvariante dürfen erst nach dem neuen Go ausgeführt werden; die nicht ausgewählte Kernvariante bleibt unausgeführt. Die übrigen14 Dateien sind bytegleich zum ursprünglichen Paket.

**Jetzt erbetene Entscheidung:** ausschließlich das oben konkret formulierte Go für `PROD_READONLY_BASELINE_20261121_V2`. Bis dahin bleibt V2 vollständig unausgeführt. Der frühere Einmalauftrag bleibt mit seinem tatsächlichen STOP abgeschlossen.
