# Production: HTTP-ID-Reparatur und begrenzte AT-Fehlerdiagnose

## Entscheidung und Ausführungsgrenze

**Vorbereitet, nicht ausgeführt.** Der Owner beauftragt die Vorbereitung der in Dev bewährten Allocator-Lösung für Production und eine lesende Klärung der drei beobachteten AT-Enqueue-Fehler. Dieser Auftrag erlaubt keine neue Production-Abfrage und keine Installation. Die früheren einmaligen Leseaufträge V1/V2 sind abgeschlossen. Der feste spätere Zielkontext lautet ausschließlich `qscbgcdmivbbnzrcyegn`; ein SQL-Marker allein authentifiziert diese Projektadresse nicht.

Die Datei- und SHA-Bindung steht im [SQL-Manifest](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-package-20261121/MANIFEST.json). **Die beiden Diagnose-/Katalogdateien sind als erster separater Leseauftrag konkret vorgelegt.** Die Schreibdateien bleiben überprüfbare Kandidaten: Eine noch nicht gelesene Transport-Katalogbindung ist absichtlich `NULL` und beendet Rehearsal/Installation vor jeder Objektanlage. Sie wird erst nach dem freigegebenen Read und unabhängiger Auswertung gebunden; daraus entstehen neue, erneut zu prüfende SQL-Hashes. Die nach einem echten Commit benötigte Rücknahmesperre hat entsprechend einen noch nicht existierenden Commit-Bindungswert.

Der parallele Auftrag zur Pause des GitHub-Alarmzeitplans wird getrennt geführt. Seine Umsetzung ändert keine Production-Datenbank und erteilt keine SQL-Ausführungserlaubnis. [Auftrag und Autorisierungsgrenze](OFFICIAL_TRUTH_PRODUCTION_HTTP_ALLOCATOR_TASK_2026-11-21.md).

## 1. Tatsächliche Ausgangsbefunde

Die [angenommene V2-Lesung](OFFICIAL_TRUTH_PRODUCTION_READONLY_V2_RESULT_2026-11-21.md) vom 21. November 2026 endete um **18:43:40 Zürich**. Sie beobachtete vier ID-Pfade und 14 ausdrücklich optionale, nicht vorhandene Relationen, darunter `supabase_functions.hooks`. Der verwaltete UNLOGGED-Zähler stand bei **3/called**, die AT-Historie reichte bis **211**, die CH→DE-Dispatchhistorie bis **46**; Queue und Antworttabelle hatten keine aktuelle maximale ID. Diese getrennten Beobachtungen beweisen weder eine bereits gespeicherte doppelte ID noch einen sicheren neuen Startwert.

Die drei fehlgeschlagenen AT-Enqueue-Läufe sind **23758, 23767 und 23776**. V2 durfte ihre Fehlertexte nicht lesen. Ihre tatsächliche Fehlerursache und der Zusammenhang mit dem zurückliegenden Zähler sind deshalb weiterhin unbekannt. Die vorbereitete Diagnose bindet genau diese drei historischen Zeilen, die beobachteten Start-/Endzeiten, den festen Cronjob und dessen Command-SHA sowie die V2-Funktionsdefinition. Sie wechselt weder auf neuere Läufe noch auf andere Logs, wenn diese Zeilen nicht mehr vorhanden sind.

Production verwendete **pg_net 0.19.5**, Dev **0.20.4**. Die drei SQL-HTTP-API-Definitionen sind anhand ihrer tatsächlich beobachteten V2-Hashes den archivierten Definitionen zugeordnet. Der zusätzliche [Review der offiziellen pg_net-Quellen](evidence/official-truth-production-http-allocator-20261121/pg-net-0.19.5-transport-source-review.json) folgt in 0.19.5 der Queue-ID durch Worker und Antwort-INSERT. Das ist ein statischer Versionsnachweis, kein Nachweis des tatsächlich geladenen Hosted-Binaries, eines Production-Neustarts oder eines echten Production-HTTP-Ergebnisses.

## 2. Konkrete Reparatur

### Neue ID-Vergabe

Die Migration erstellt das private Schema `jetnity_pgnet_allocator_private`, eine eigene **LOGGED BIGINT-Sequenz im Eigentum von `postgres`**, den engen **SECURITY-DEFINER-Helper** `assign_request_id_v1()` und genau einen `BEFORE INSERT FOR EACH ROW`-Trigger auf `net.http_request_queue`. Der Helper ersetzt jede eingehende ID auf dem regulären Queue-INSERT-Weg durch `nextval()` der eigenen Sequenz. Er akzeptiert ausschließlich die festgelegte Tabelle, Operation, Triggerart, den Triggernamen und den normalen Sitzungsmodus; sein `search_path` ist ausschließlich `pg_catalog`. Die neuen Objekte werden auf den eigenen Eigentümer begrenzt.

Die bestehende fremde Sequenz, ihr Eigentümer und der Spalten-Default bleiben erhalten. Der alte Default läuft weiterhin vor dem Trigger und kann alte Nummern verbrauchen; die tatsächlich in der Queue gespeicherte und über `INSERT … RETURNING` gelieferte ID kommt anschließend vom neuen Zähler. Deshalb wird der erwartete alte Default ausdrücklich geprüft. Alte Zählerlücken werden weder zurückgesetzt noch versteckt. Der Weg benötigt keine Mitgliedschaft bei `supabase_admin` und keine Rollenänderung.

Die Startberechnung lautet:

`erste_neue_ID = max(211, frischer_gesperrter_ID_Höchstwert, aktueller_Altzähler) + 1025`

Damit bleiben **1.024 Nummern unbenutzt** zwischen dem höchsten zugrunde gelegten Wert und der ersten neuen ID. Wenn der tatsächliche höchste Wert weiterhin 211 ist, beginnt die eigene Sequenz bei **1236**. Dieser Wert ist ein Rechenbeispiel, kein vorab festgeschriebener Live-Start. Größere inzwischen verwendete Werte werden einbezogen; unzulässige Werte und zu wenig BIGINT-Restbereich führen zum STOP.

Die Transaktion verwendet die bestehenden Guard-/AT-Advisory-Sperren und eine globale Queue-Sperre. Erst danach liest ein neuer READ-COMMITTED-Statement-Snapshot die aktuellen MAX-Werte. Feste NOWAIT-Sperren auf den betroffenen Historien, Quellen, Owner-Belegen und Cronmetadaten schließen die normalen Producer-/Collector-Rennen. Die Inventur verlangt weiterhin genau die vier bekannten BIGINT-Pfade, gewöhnliche Tabellen/Spalten und die Abwesenheit aller 14 zuvor fehlenden optionalen Relationen. Neu vorhandene optionale Relationen werden hier nicht blind übersprungen, sondern erfordern eine neue Prüfung.

Der Vertrag umfasst normale Queue-INSERTs im Modus `origin`/`local`. Ein privilegierter DBA, ein Replica-Bypass oder direkte Änderungen vorhandener IDs sind kein durch diesen Trigger gelöstes Problem. Metadaten zu entsprechenden Rechten und Konfigurationen werden in die überprüfte Transportbindung aufgenommen.

### AT-Quellenschutz und BG1-Anschluss

Production besitzt einen anderen Schutzkettenstand als Dev. Deshalb wird kein Dev-v8-Skript umetikettiert: Die Reparatur erhält einen eigenen append-only **Production-v3→v4-Nachfolger** `bg1_production_http_allocator_v4`. Die exakten alten V2-Funktionshashes und der feste alte Katalog-SHA verankern die vorhandene Kette. Alte Baselinezeilen, Owner-Quittungen und Audit-/Control-Verfahren werden erhalten. Nur die fünf konkret erzeugten Nachfolgerdefinitionen und die ausdrücklich neu angelegten Objekte dürfen den Katalog verändern.

In derselben Transaktion bekommt `official_v3_at_production_private.renew_ch_v1()` den frühen Quellenschutz: Alle drei Quellen müssen tatsächlich qualifiziert und außerhalb des Research-Modus sein; alle drei physischen Originale müssen Legal-/Customer-Freigaben und passende echte Körper-Hashes besitzen. Andernfalls endet der Publisher vor dem bisherigen Erneuerungspfad mit `0`. Die Reparatur erzeugt keine solche Qualifikation und keine neuen positiven Fakten. Die eng gebundene negative Nachprüfung ruft den neuen Publisher auf und verlangt `0` sowie unveränderte geschützte Daten; sie ist kein isolierter Kausalbeweis für nur einen einzelnen Qualifikationsschalter.

Die Ausführung setzt zusätzlich **null noch frische AT-Fakten** voraus. Sollte der alte Publisher zwischen V2 und einer späteren Ausführung doch frische, weiterhin unqualifizierte Fakten erzeugt haben, stoppt die Installation vor der Änderung. Eine reparierte Integritätsanzeige darf solche Altfakten nicht stillschweigend wieder sichtbar machen. Die derzeitigen negativen Qualifikations-Constraints bleiben bestehen; eine spätere positive fachliche Freigabe benötigt einen eigenen überprüften Änderungspfad.

Der neue Nachfolger verlangt eine höhere Generation und einen tatsächlichen vollständigen BG1-Beleg nach seiner Installation. Vorher müssen der öffentliche Status `unavailable` und `require_open_v1()` gesperrt bleiben. Ein Audit wird nicht künstlich gestartet; Incident-/Resume-Werte werden nicht direkt geändert. **Abgelaufene Angaben bleiben „derzeit nicht verfügbar“.**

Auch der Einstieg in Rehearsal/Installation bleibt an das unveränderte bisherige `require_open_v1()` gebunden. Ist Production-BG1 zu diesem späteren Zeitpunkt noch gesperrt oder sein Beleg abgelaufen, stoppt das Paket bereits vor DDL. Eine erforderliche echte Owner-Freigabe wird dadurch weder ersetzt noch vorweggenommen.

## 3. Dateien und genaue Verwendung

Alle SQL-Dateien liegen unter `scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-package-20261121/`. Die folgenden Zustände sind Vorbereitungszustände, keine Ausführungsbelege.

| Datei | Zweck und Ende | Zulässige nächste Einordnung |
| --- | --- | --- |
| `00-at-enqueue-diagnosis.READONLY.sql` | Genau drei feste Cronfehler klassifizieren; `REPEATABLE READ READ ONLY`, abschließend `ROLLBACK`. | Erster gesondert freizugebender Read. |
| `01-required-bindings.READONLY.sql` | Begrenzte Transport-/Producer-Katalogfingerprints und sichere Formmerkmale; keine Rohdefinitionen oder Konfigurationswerte ausgeben; `ROLLBACK`. | Zweiter Read desselben vorgelegten Leseauftrags, nur nach akzeptiertem 00-Ergebnis. |
| `10-production-http-id.REHEARSAL-ROLLBACK.sql` | Tatsächliche neue DDL, ID-Overrides, eigene Sequenz-Restart-/Helper-/Guard-Negativproben und vollständige Rücknahme bis zum Vorgänger; abschließend `ROLLBACK`. | Nach überprüfter Transportbindung neue Hashfassung und eigener Rehearsal-Auftrag. |
| `11-production-http-id.POSTREHEARSAL-READONLY.sql` | Unabhängige Rücklesung des wiederhergestellten Vorgängers und der Abwesenheit der neuen Objekte. | Muss in den späteren Rehearsal-Leseumfang aufgenommen werden. |
| `20-production-http-id.INSTALL-COMMIT.sql` | Dieselbe gemeinsame Allocator-/Quellenschutz-/BG1-Installation ohne Queue-Probe-IDs; abschließend `COMMIT`. | Erst nach real bestandener Rehearsal und ausdrücklich freigegebenem finalen Hashsatz. |
| `30-production-http-id.FENCE-ROLLBACK.sql` | Rücknahmesperre gegen den wirklich committed Nachfolger erproben und wieder zurücknehmen. | Eigene spätere Freigabe; benötigt den tatsächlich beobachteten Commit-Pin. |
| `40-production-http-id.FENCE-COMMIT.sql` | Helper verweigert neue erfasste Queue-INSERTs dauerhaft; kein unsicherer Rückfall auf den alten Zähler. | Nur mit konkretem späterem Fence-Go; kein automatischer Notfallbefehl. |
| `50-production-http-id.POSTCOMMIT-READONLY.sql` | Unabhängiger Katalog-/Nachfolger-/Sequenz-/BG1-Readback nach Commit; liefert den tatsächlichen Nachfolger-Pin. | Eigenständig freizugebender Teil des späteren Installationsabschlusses; kein HTTP-Betriebsbeweis. |

`build-candidates.py` erzeugt die Kandidaten ausschließlich lokal aus archivierten, über V2-Hashes zugeordneten Definitionen. [source-provenance.json](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-package-20261121/source-provenance.json) hält die Quellen und gezielten Transformationen fest. [required-production-bindings.json](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-package-20261121/required-production-bindings.json) benennt die tatsächlich noch fehlende externe Bindung. Der Builder ist kein Datenbankrunner und darf eine unbekannte Live-Definition nicht automatisch als vertrauenswürdig übernehmen.

### SHA-256 der eingefrorenen SQL-Dateien

**SHA-256 des SQL-Manifests:** `ef166a30a16cbb9cb6ca33702b51c659f0ce0400668b54d1e6dddbf820086d65`. Die folgenden Hashes binden die Vorbereitung; fehlende Ausführungspins bleiben ausdrücklich offen.

| Datei | Bytes | SHA-256 |
| --- | ---: | --- |
| `00-at-enqueue-diagnosis.READONLY.sql` | 15042 | `d3b3a83fd36e295978b2e670549a3bce9132402ec7ca81764b95b16a39392397` |
| `01-required-bindings.READONLY.sql` | 16685 | `688def1ae033992cc9f36ea26145722bd869dfe1db971e86c00b231b7aa10ce5` |
| `10-production-http-id.REHEARSAL-ROLLBACK.sql` | 92538 | `fd2d4f68c38a70b57fa758b80b6d17dc5267e9b085808dab92fc3e4132929a93` |
| `11-production-http-id.POSTREHEARSAL-READONLY.sql` | 13375 | `ad09339c8e64a55867a97edb2ebe20ba8c66429edf92c77f273c4896bc378f2f` |
| `20-production-http-id.INSTALL-COMMIT.sql` | 85627 | `2072474ac1b356f8dbd1e324a68d1d7646359611926086b964b40190a9063921` |
| `30-production-http-id.FENCE-ROLLBACK.sql` | 25994 | `0d52a4c1696fd57d727d2c50c4622f7a35e606cd83a266609d08417dd02f3818` |
| `40-production-http-id.FENCE-COMMIT.sql` | 25484 | `6a2e85ee20693cef589fe68dcc8c1ffa4f4f5b703f2a0ccaf66dcb7a1dbec9e3` |
| `50-production-http-id.POSTCOMMIT-READONLY.sql` | 4629 | `abb899e6d17b871f37af5a4532fd1021ffd55f799c9d10f6bba25727fcb04941` |

## 4. Lesende Klärung der drei AT-Fehler

Die Diagnose gibt höchstens drei feste Fehlerklassen, die SHA-256-Prüfsumme und Bytezahl der jeweiligen gespeicherten Nachricht sowie die erwarteten Laufzeiten aus. Sie gibt keine Rohfehler, SQL-Kontexte, HTTP-Inhalte oder Secrets zurück. Bekannte Klassen unterscheiden etwa einen Unique-Verstoß bei AT-Request-ID, Batch-ID oder Batch/Quelle, fehlende Rechte, Timeout, Deadlock oder die konkret bekannten BG1-Verweigerungen. Ein anderer Unique-Verstoß wird ohne Offenlegung des fremden Constraintnamens bezeichnet.

Ein `SQLSTATE`-Referenzcode in der Ausgabe ist immer nur die Referenzzuordnung zu einer bekannten Signatur. Die Datei liest und behauptet keinen ursprünglich gespeicherten SQLSTATE. Ein gemeldeter Unique-Verstoß beweist den abgewiesenen Versuch, keine dauerhaft gespeicherten doppelten Zeilen. Er beweist auch nicht allein, dass die alte Sequenz die Ursache war. Unbekannte Signaturen, fehlende Retention, abweichende Job-/Zeit-/Funktionsbindungen oder Ergebnisüberschreitung beenden den Auftrag; dann wird die verbleibende Ungewissheit berichtet.

Die zweite Datei liest ausschließlich feste Katalog-/Berechtigungs- und Formmerkmale. Der zurückgegebene `native_transport_sha256` darf erst nach Prüfung der sicheren Queue-/Default-Merkmale, bekannten Funktionsfingerprints und Producerinventur in eine neue Kandidatenfassung einfließen. Unbekannte Fingerprints oder Formen sind keine automatische Genehmigung für weitere Abfragen oder Anpassungen.

## 5. Rücknahme und Stoppregeln

**Vor einem erfolgreichen COMMIT:** Fehler führen zur Transaktionsrücknahme. Die Rehearsal prüft echte Queue-INSERTs mit expliziten eingehenden IDs, sodass der fremde Defaultzähler dabei nicht verbraucht werden muss. Die Queue ist dabei gesperrt; beide uncommitted Probezeilen verschwinden vor Freigabe der Sperre. Weder `net.http_*` noch `net.wake()` werden aufgerufen. Die vollständige Rücknahme prüft alte Kataloge, Daten, Quellen-/Owner-Belege und Zähler. Ein erfolgreiches SELECT vor dem abschließenden Transaktionsende ist noch kein Beweis des erfolgreichen Gesamtaufrufs.

**Nach einem erfolgreichen COMMIT:** IDs können bereits vergeben und normale Cronrequests eingereiht sein. Ein Drop des Triggers oder Rücksetzen der Sequenzen wäre deshalb kein sicherer Rückbau. Die vorbereitete Fence-Sperre verändert ausschließlich den exakt gebundenen eigenen Helper so, dass neue erfasste Inserts fehlschlagen. Sie bewahrt die Sequenzen, Originale, Historien und schon eingereihten Requests. Solche vorhandenen Requests können nach Aufheben der Transaktionssperre weiter verarbeitet werden. Ein vollständiger Betriebsstopp oder Restore ist durch diesen Fence nicht abgedeckt.

Der Katalogprüfer erkennt die absichtliche Helperabweichung bei seinem nächsten Aufruf. Der öffentliche Alarm folgt dem bestehenden natürlichen Audit-/Frischevertrag; es wird kein unmittelbarer öffentlicher Alarmstatus im Moment des Fence-COMMIT zugesichert. Weitere Wiederherstellung geschieht durch eine überprüfte Vorwärtskorrektur, nicht durch Zählerwiederverwendung. Der wirklich committed Nachfolger-Pin wird unabhängig gelesen und erst dann in einen neuen Fence-Hashsatz übernommen.

**Gemeinsame STOP-Regeln:** falsches Projekt oder nicht passende Session; Datei-/Hashabweichung; fehlender Pin oder Pflichtgegenstand; unbekannte Funktion, Form, Relation oder Default; abweichende bestehende Schutzkette; fehlende benötigte normale Rechte; bereits vorhandener unerwarteter Allocator; belegte Katalog-/Owner-/Datenabweichung; aktiver Replica-Modus; nicht passende Quellenqualifikation; belegte oder über Timeout verweigerte Sperre; unvollständige Inventur; Überschreitung von Zeit-, Zeilen-, Byte- oder BIGINT-Grenzen; SQL-/Dienstfehler. **Kein Retry, keine spontan geänderte Datei, kein Ausweichen auf andere Rollen, Projekte, Browser, Credentials oder Quellen.** Bei unklarer Commit-Antwort gilt das Ergebnis als unbekannt; vor einem erneuten Schreibversuch ist ein eigener konkret freigegebener Readback erforderlich.

Die Schreib-/Fence-Kandidaten setzen **25 Sekunden Statementtimeout**, **90 Sekunden Transaktionstimeout** und **2 Sekunden Locktimeout**; die festen zusätzlichen Historiensperren sind `NOWAIT`. Die unabhängigen Dateien 11/50 begrenzen Statements auf **15 Sekunden** und Transaktionen auf **20 Sekunden**, mit **500 ms Locktimeout**. Diese eingebauten Obergrenzen erteilen keine Ausführungserlaubnis; der spätere konkrete Auftrag muss seinen gesamten Umfang und Ablauf zusätzlich begrenzen.

## 6. Konkreter nächster Leseauftrag zur Entscheidung

Der nachfolgende Wortlaut ist ein Vorschlag für ein **neues** Owner-Go, noch keine erhaltene Freigabe:

> Go für den einmaligen Auftrag **PROD_HTTP_ID_DIAGNOSE_BINDINGS_20261121** auf **qscbgcdmivbbnzrcyegn**, ausschließlich mit den unveränderten Dateien **00** und **01** und ihren SHA-256-Werten aus dem beigefügten Manifest. Maximal **zwei READ-ONLY-Transaktionen innerhalb von fünf Minuten**, Reihenfolge 00→01, jede Datei höchstens einmal. 01 nur nach dem vorgesehenen bekannten Diagnoseergebnis von 00. Bei Fehler, unbekannter Form/Signatur, fehlender Pflichtbindung, veränderter historischer Laufbindung oder Überschreitung sofort stoppen; kein Retry. Erlaubt sind nur die drei fest gebundenen historischen Cronfehler in sicher klassifizierter Form und die festen Katalog-/Transport-/Producerfingerprints. Keine Production-Änderung, HTTP-/Quellen-/Publisher-/Audit-/Owneraktion, Rollenänderung, Anmeldung/2FA, Kosten oder Veröffentlichung. Die übrigen Dateien und eine automatische Reparatur sind nicht freigegeben.

00 begrenzt Statements auf **8 Sekunden**, die Transaktion auf **12 Sekunden**, jeden einzelnen gespeicherten Fehler auf **8.192 Bytes** und das gesamte Ergebnis auf **8.192 Bytes**. 01 begrenzt Statements auf **12 Sekunden**, die Transaktion auf **20 Sekunden** und das Ergebnis auf **1.048.576 Bytes**. Beide verwenden **500 ms Locktimeout**. Das äußere Fünf-Minuten-Fenster umfasst auch Connectorlaufzeit; spätestens vor jedem weiteren Aufruf sind Restzeit, erlaubte Anzahl und Ergebnisform zu prüfen. Die Summe der beiden Ergebnisobergrenzen beträgt **1.056.768 Bytes**.

Nach diesem Leseauftrag folgt zunächst die Auswertung und ein neuer genauer Hashsatz. Eine erfolgreiche Diagnose erteilt weder Rehearsal- noch Installationsfreigabe. Vor einer späteren Installationsentscheidung müssen die tatsächlich bestandene native Rücknahme, der unabhängige Rückleser und der passende reale BG1-Ausgangszustand vorliegen. Der normale HTTP-Betriebsnachweis und ein etwaiger Neustarttest werden nicht aus statischen Quellen oder aus Dev abgeleitet.

Auch das spätere Ergebnis `PROD_HTTP_COMMITTED_READBACK_OBSERVED` aus Datei 50 ist für sich kein Betriebs-PASS: Es meldet den Status und die Anzahl passender frischer vollständiger Runs, die auch null sein kann. Für eine Integritätsabnahme werden ein passender aktueller Status und genau ein gebundener frischer Run benötigt; die zusätzliche tatsächliche Cron-/HTTP-/Journalbindung bleibt gesondert nachzuweisen. Datei 50 behauptet ausdrücklich keinen solchen HTTP-Nachweis.

## 7. Nachweisumfang

Der Review umfasst die lokalen SQL-Bytes, exakte V2-Quellzuordnung, die konservative fehlende Bindung, Sperr- und MAX-Reihenfolge, den regulären ID-Rückgabepfad, den frühen AT-Quellenschutz, die begrenzte Diagnose, die erlaubten Katalogdeltas und die Rücknahmegrenzen. Die unabhängigen Reviewberichte und das Liefermanifest werden im [Belegordner](evidence/official-truth-production-http-allocator-20261121/) erhalten. **Kein nativer SQL-Parser-, Production-Runtime-, Rehearsal-, Installations-, Neustart- oder positiver Erneuerungs-PASS wird für diese Vorbereitung behauptet.**

Der vorherige [Prüfpaketstand aus Commit 400351d](evidence/official-truth-production-http-allocator-20261121/production-review-package-prior-400351d.md) bleibt bytegleich archiviert. V1/V2-Genehmigungsdateien und Originalbelege bleiben unverändert. Die neue Dokumentation bindet diesen Vorbereitungsumfang und den tatsächlichen Stand der separat beauftragten Workflowänderung: [PR #1269](https://github.com/Jetnity/jetnity/pull/1269) ist vorbereitet, sein Merge jedoch wegen des abweichenden Dev-Passkey-Soll-/Istzustands im Pflicht-Authcheck blockiert. Die Zeitplanpause ist damit noch nicht wirksam; [Ergebnisbeleg](evidence/official-truth-production-http-allocator-20261121/bg1-schedule-pause-outcome-20261121.json).

Technische Primärgrundlagen: [PostgreSQL 17 – RETURNING und Triggerwerte](https://www.postgresql.org/docs/17/dml-returning.html), [CREATE TRIGGER](https://www.postgresql.org/docs/17/sql-createtrigger.html), [CREATE SEQUENCE](https://www.postgresql.org/docs/17/sql-createsequence.html), [ALTER SEQUENCE / transaktionaler RESTART](https://www.postgresql.org/docs/17/sql-altersequence.html), [Sequenzfunktionen und nicht zurückgenommene Verbräuche](https://www.postgresql.org/docs/17/functions-sequence.html), [pg_net 0.19.5 – fester offizieller Workerstand](https://github.com/supabase/pg_net/blob/a7792bfd913c7859e14025d606624982706c2a7f/src/core.c).
