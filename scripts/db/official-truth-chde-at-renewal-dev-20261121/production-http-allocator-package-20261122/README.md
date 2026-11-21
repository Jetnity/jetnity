# Production HTTP-ID – neues gebundenes Prüfpaket, 22.11.2026

**PROD_HTTP_ALLOCATOR_BOUND_PACKAGE_20261122**, ausschließlich für `qscbgcdmivbbnzrcyegn`.

**Vorbereitet, nicht ausgeführt, kein Schreib-Go.** Das abgeschlossene einmalige Queue-Lese-Go deckt keine Datei dieses Ordners. Originale vom 21.11. bleiben unverändert. Dieses Paket enthält genau sechs neue Ablaufdateien 10/11/20/30/40/50; keine Wiederholung der verbrauchten Reads 00/01/02.

Die vollständige [Owner-Prüfvorlage](../../../../docs/OFFICIAL_TRUTH_PRODUCTION_HTTP_ID_BOUND_PACKAGE_2026-11-22.md) erklärt Änderung, Hashes, Rücknahme, Grenzen und den gesonderten nächsten Go-Vorschlag. Das [Manifest](MANIFEST.json) bindet die konkreten Dateien und ergänzenden Quellbelege. Ein Git-Commit oder lokaler Builderlauf installiert keine Datenbankänderung.

## Tatsächliche Bindung

- Die einzige freigegebene 02-Abfrage beobachtete am 22.11., 00:06:49 Zürich den Transport-SHA `60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f`. Sechs Spalten entsprechen pg_net0.19.5, einschließlich Domain `net.http_method` und nullable `headers`.
- Der Methoden-CHECK ist getrennt über Definition `412b54e60167a01e5fe4856c3ed5cbf862b912b2f3ba01bce4a8661c5ba915de` und beobachtete Katalogidentität `63ece7f25171a578daae026a9e5501f99fbbf3e9677452ab470248e13f3ad856` gebunden. Der rohe Transportausdruck bleibt unverändert; Domainzustand kommt als eigener Schutz hinzu.
- Alle 15 Transport-Funktionsdefinitionen sind anhand ihrer Quellen aufgeklärt. Die offengelegte Provider-Headerabweichung bleibt dokumentiert. C-Symbole sind keine nachgewiesenen geladenen Binärbytes.
- Der unmittelbare Vorgänger ist die inzwischen separat installierte `official_v3_guard_private.query_cost_baseline_v1`. Feste archivierte Main-Quellen von `d8798dc2dee0a7f2cacb4f9def0605ee347f24c4` passen exakt zu den zwei aktuell beobachteten Definitionen. Alle alten Digestkanten und die Query-Cost-Optimierung bleiben erhalten. Die Baselinezeile wurde in diesem Read nicht zusätzlich gelesen und muss künftig vor DDL exakt passen.

## Geplante Wirkung und Eintrittsgate

Eigene LOGGED-Sequenz mit Owner `postgres`, privater SECURITY-DEFINER-Helper und Queue-BEFORE-INSERT-Trigger vergeben neue IDs. Der Start ist der größere Wert aus 211, frisch unter Queue-/Producer-Sperren gelesenem Altzähler und vier gesperrten Ledger-Maxima, plus1025. Damit bleiben1024 Nummern Abstand;1236 ist nur das Mindestbeispiel. Fremde Sequenz, Owner und Default bleiben erhalten.

Die normale ID-Vergabe, früher AT-Qualifikationsstopp und neuer immutable BG1-Nachfolger sind eine gemeinsame künftige Transaktion. Die aktuelle echte Guardfreigabe ist ein Eintrittsgate, kein hier behaupteter Zustand. Eine erforderliche Ownerfreigabe wird nicht ersetzt. Positive Quellenqualifikation oder Erneuerung gehört nicht zu diesem Paket; abgelaufen bleibt „derzeit nicht verfügbar“.

## Freigabestufen

| Dateien | Zweck | Jetzt ausführbar? |
| --- | --- | --- |
| 10→11 | Tatsächliche temporäre Rehearsal mit vollständigem ROLLBACK, danach unabhängiger READ-ONLY-Rücklesenachweis | Nein; eigener exakter Rehearsal-Auftrag erforderlich. |
| 20→50 | Dauerhafte Installation und unabhängiger Commit-/BG1-Metadatenreadback | Nein; erst nach belegter Rehearsal und separatem Installations-Go. |
| 30 oder40 | Eigene Helper-Sperre erproben oder committen | Nein; tatsächlicher Commit-Pin absichtlich NULL, späterer neuer Hashsatz und eigenes Go erforderlich. |

Die zwei Rehearsal-Queuezeilen verwenden explizite eingehende IDs und werden vor Freigabe der Queue-Sperre vollständig zurückgenommen. Kein `net.http_*`, Wake oder Workerrestart wird aufgerufen. Der alte Defaultzähler muss für diese Proben nicht verbraucht werden. Nach einer späteren Installation bedeutet Rücknahme eine eigene Helper-Sperre und geprüfte Vorwärtskorrektur; kein Rückfall auf alte IDs.

## Reproduzierbarkeit und Prüfgrenze

`build-candidates.py` ist ein lokaler Textgenerator und enthält keinen SQL-Runner. Seine Eingangsdateien und Quellen sind in [source-provenance.json](source-provenance.json) und [required-production-bindings.json](required-production-bindings.json) gebunden. Den eingefrorenen alten Builder niemals zur Aktualisierung dieses neuen Pakets ausführen. Ein erneuter Generatorlauf kann die sechs Dateien verändern und verlangt dann einen neuen Hash-/Reviewstand; eine bereits genehmigte Datei darf nicht dadurch ersetzt werden.

Die neue Fassung wurde statisch geprüft. Kein nativer SQL-Parser-/Runtime-, Production-Rehearsal-, Installations-, HTTP- oder positiver Erneuerungs-PASS wird aus der Vorbereitung abgeleitet. Unbekannte Form, Drift, fehlende Pflichtbindung, gesperrter BG1, Fehler oder Grenzenüberschreitung bedeutet STOP ohne Retry oder Zusatzread. Rollen, Auth, Login/2FA, Secrets, Kosten und Veröffentlichung bleiben außerhalb jeder hier vorbereiteten nächsten Rehearsal.
