# Neues Go zur Queue-Detailprüfung – vorbereitet, nicht ausgeführt

**Der Auftrag `PROD_HTTP_ALLOCATOR_READ_20261121` ist nach zwei genau freigegebenen Reads beendet. Seine Stop- und Kein-Retry-Regel erlaubt keinen dritten Aufruf. Dieses Dokument legt ausschließlich einen neuen einzelnen Katalogread zur gesonderten Entscheidung vor.**

Die drei historischen AT-Fehler sind als Request-ID-Unique-Verletzungen klassifiziert. Der bisherige Katalogread lieferte wegen der Queue-Formprüfung keinen Transportfingerprint. Der Default-Hash passt zur Erwartung; die offizielle pg_net-0.19.5-Quelle widerspricht zwei Annahmen der Vorlage: `method` ist eine Domain über Text, `headers` darf NULL sein. Der genaue aktuelle Hosted-Katalog wurde noch nicht auf diese Einzelbedingungen gelesen. [Ausführlicher Ergebnisbericht](OFFICIAL_TRUTH_PRODUCTION_HTTP_ALLOCATOR_READ_RESULT_2026-11-21.md).

## Festes neues Paket

**Paket-/Auftragsname:** `PROD_HTTP_ALLOCATOR_QUEUE_REVIEW_20261121`  
**Ausschließliches Ziel:** `qscbgcdmivbbnzrcyegn`  
**Status:** Vorbereitung abgeschlossen, **keine Freigabe erhalten und nicht ausgeführt**.

| Bestandteil | SHA-256 | Bytes |
| --- | --- | ---: |
| [02-queue-shape-and-bindings.READONLY.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-queue-review-20261121/02-queue-shape-and-bindings.READONLY.sql) | `8efb206f61498e808c49225f82dcff7f1ddd4e316e8e0a4e180927eb90a7cfb1` | 27.936 |
| [MANIFEST.json](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-queue-review-20261121/MANIFEST.json) | `3e15e55d2f1d53444bd65df68426336de353bfb906add719c7de605e04d5e714` | siehe Manifestdatei |

Genau **eine SQL-Datei**, höchstens **ein Aufruf/eine Transaktion innerhalb von fünf Minuten**, nur `REPEATABLE READ READ ONLY`, abschließend `ROLLBACK`. Feste Grenzen: **12 Sekunden pro Statement, 20 Sekunden Transaktion und Idle, 500 Millisekunden Locktimeout, höchstens 1.048.576 Bytes Ergebnis**. Kein Retry, kein Ersatz- oder Zusatzread und keine Wiederholung der verbrauchten Dateien 00/01.

## Was der Read liefern darf

Der feste Read betrachtet ausschließlich PostgreSQL-Kataloge und fest benannte Metadaten. Er liefert Einzelprädikate für die sechs erwarteten Queue-Spalten: Präsenz, Typ, NOT NULL, Identity/Generated/Dropped sowie Defaultanzahl und -hash. Er unterscheidet physische, aktive und gelöschte Spalten. Die Domain `net.http_method` wird über Typform, Basistyp, Null-Eigenschaft, Constraintanzahl und Hashes beschrieben.

Der alte Vergleich aus 01 bleibt sichtbar. Der getrennte Vergleich mit dem offiziellen 0.19.5-Erstellungsstand ersetzt ihn nicht stillschweigend. Insbesondere ist die Domain **kein Enum**; ihre Constraintsemantik wird weder erraten noch allein aus ihrem Namen für bestätigt erklärt.

Aus demselben Snapshot werden die begrenzten Transportmetadaten gehasht und die festen Funktionsfingerprints ausgegeben. Der interne Transportausdruck und die Fingerprintliste sind gegenüber 01 bytegleich; zusätzliche Größen- und Relationsprüfungen begrenzen ihren Aufbau. Bei sicher begrenzten Katalogen kann der Read einen Digest auch dann liefern, wenn die alte Shape-Annahme falsch ist. Das ist ausdrücklich **Beobachtung zur Prüfung**, keine Erlaubnis, diese Form ungeprüft als Reparaturgrundlage zu übernehmen.

Keine Queuezeilen, Sequenzstände, Quellen-/Fakten-/Ownerdaten, rohen Fehlertexte, Defaultausdrücke, Funktionskörper oder Konfigurationswerte werden ausgegeben. Es wird keine Anwendungs-, Guard-, HTTP-, Publisher-, Audit- oder Owner-Funktion aufgerufen. Der Projektbezug wird durch das feste Connectorziel festgelegt; die SQL-Marker allein authentifizieren keine Projekt-ID.

## Ergebnis- und Stoppregeln

Die einzige vorgesehene vollständige Beobachtungsform heißt `QUEUE_SHAPE_AND_BINDINGS_OBSERVED_REVIEW_REQUIRED_NO_WRITE_PERMISSION`. Alle Pflichtobjekte, Grenzen, der ursprüngliche Kontext und das exakte Vierpfad-ID-Inventar müssen dafür passen. Fehlt eine Pflichtrelation, ist ihre Form unzulässig, wird eine Grenze überschritten, fehlen Bindungen oder tritt ein SQL-/Dienstfehler auf, endet der Read mit STOP. Jede unbekannte Ergebnisform führt ebenfalls zum Abbruch ohne Wiederholung.

Auch ein vollständig zurückgegebenes Ergebnis ist **kein sicherer Schreib-PASS**. Ein unbekannter Spaltentyp, eine nicht geprüfte Domainconstraint, ein fremder Funktionsfingerprint oder ein lediglich opaker Digest darf nicht automatisch übernommen werden. Erst die fachliche Auswertung gegen die vorhandenen lokalen und offiziellen Quellen entscheidet, welche Bindungen im späteren Schreibpaket überhaupt verwendbar sind.

## Konkreter Go-Text

> Go für den einmaligen Production-Leseauftrag **PROD_HTTP_ALLOCATOR_QUEUE_REVIEW_20261121** auf **qscbgcdmivbbnzrcyegn**, ausschließlich mit der unveränderten Datei **02-queue-shape-and-bindings.READONLY.sql**, SHA-256 **8efb206f61498e808c49225f82dcff7f1ddd4e316e8e0a4e180927eb90a7cfb1**, und Manifest-SHA-256 **3e15e55d2f1d53444bd65df68426336de353bfb906add719c7de605e04d5e714**. Genau einmal READ ONLY mit ROLLBACK, höchstens eine Transaktion innerhalb von fünf Minuten und die festen Zeit-/Ausgabegrenzen des Manifests. Erlaubt sind nur die beschriebenen Katalogdetails, Vergleiche und Hashes. Bei Fehler, unbekannter Ergebnisform, fehlendem Pflichtobjekt oder Überschreitung stoppen; kein Retry und kein Zusatzread. Keine Wiederholung von 00/01, keine Production-Änderung, Rehearsal, Installation, Fence, HTTP-/Quellen-/Owneraktion, Rollen-/Secret-/Login-/2FA-Änderung, neue Kosten oder Veröffentlichung. Anschließend nur auswerten und ein gegebenenfalls sicher bindbares Schreibpaket separat vorlegen.

## Nachweis und weiterer Ablauf

Autorenprüfung, unabhängiger lokaler Review und Root-Abgleich bestätigen den beschriebenen statischen Umfang; der Transportausdruck und die Fingerprintliste wurden bytegenau verglichen. **Kein nativer SQL-Parser-, Datenbank-, Rehearsal- oder Runtime-Erfolg wird behauptet.** Der neue Read wurde nirgendwo ausgeführt.

Die alten acht SQL-Dateien und ihr Manifest bleiben unverändert. `native_transport_sha256` und der Pin eines tatsächlich installierten Nachfolgers bleiben vorerst NULL. Ein neues gebundenes Schreibpaket kann nach diesem möglichen Read erst dann entstehen, wenn die tatsächlichen Belege und die relevanten Typ-/Funktionsbedingungen sicher geprüft sind. Rehearsal und Installation bleiben danach jeweils getrennt freigabepflichtig. Abgelaufene Daten bleiben **„derzeit nicht verfügbar“**.
