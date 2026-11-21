# Production HTTP-ID – einmaliger Queue-Read vom 22.11.2026

## Ergebnis und Geltungsbereich

Der ausdrücklich freigegebene Auftrag **PROD_HTTP_ALLOCATOR_QUEUE_REVIEW_20261121** ist abgeschlossen und verbraucht. Genau **eine** unveränderte SQL-Datei wurde auf **qscbgcdmivbbnzrcyegn** ausgeführt: `02-queue-shape-and-bindings.READONLY.sql`, in `REPEATABLE READ READ ONLY` mit abschließendem `ROLLBACK`. Es gab keinen Retry, keinen zusätzlichen Production-Read und keine Wiederholung von 00/01.

Die Beobachtung stammt vom **22.11.2026, 00:06:49 Uhr Zürich** (`2026-11-21T23:06:49.362212Z`). Das gesamte Aufruffenster dauerte **1.805 ms**; die eine dekodierte Ergebniszeile als JSON-Array hat **19.595 Bytes**. Die genehmigten Grenzen von einer Transaktion, fünf Minuten, 12 Sekunden Statementtimeout, 20 Sekunden Transaktionstimeout, 500 ms Locktimeout und 1.048.576 Ergebnisbytes wurden eingehalten. Die Originalantwort, Zeitmessung und unveränderte Ausführungsabsicht sind separat erhalten.

| Bindung | Exakter SHA-256 |
| --- | --- |
| Genehmigte SQL-Datei, 27.936 Bytes | `8efb206f61498e808c49225f82dcff7f1ddd4e316e8e0a4e180927eb90a7cfb1` |
| Genehmigtes Manifest, 3.866 Bytes | `3e15e55d2f1d53444bd65df68426336de353bfb906add719c7de605e04d5e714` |
| Beobachteter nativer Transportkatalog | `60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f` |

Der tatsächliche SQL-Verdict lautet **`QUEUE_SHAPE_AND_BINDINGS_OBSERVED_REVIEW_REQUIRED_NO_WRITE_PERMISSION`**. Er liefert prüfbare Bindungen und ist weder eine Schreibfreigabe noch ein aktueller BG1-, HTTP-Betriebs- oder Erneuerungsnachweis. Der [Ausführungsbeleg](evidence/official-truth-production-http-allocator-queue-read-20261122/execution.json) bewahrt auch die zum Rückgabezeitpunkt noch offene nachgelagerte Schreibprüfung; spätere Offlinebewertungen werden daneben abgelegt.

## Queue-Form und Domain

Die reale Queue besitzt genau sechs aktive und keine gelöschte Nutzspalte. Sie entspricht der bereits archivierten offiziellen pg_net-0.19.5-SQL:

| Spalte | Beobachteter Typ | NOT NULL |
| --- | --- | --- |
| `id` | `bigint` | ja |
| `method` | `net.http_method`, Domain über `text` | ja |
| `url` | `text` | ja |
| `headers` | `jsonb` | nein |
| `body` | `bytea` | nein |
| `timeout_milliseconds` | `integer` | ja |

Damit sind die zwei falschen Annahmen der früheren Vorlage geklärt: `method` ist eine Text-Domain; `headers` darf NULL sein. Der einzige Default ist weiterhin exakt `nextval('net.http_request_queue_id_seq'::regclass)` mit SHA-256 **`fffafa169a89e0a8f0017a62f90dd0051226a9a49c231dc9e98957f990860f36`**. Die Queue hat keine eigenen Constraints, Indizes, Regeln oder Trigger. Die vier festen ID-Pfade sind unverändert; die ausdrücklich optionale Relation `supabase_functions.hooks` fehlt weiterhin. Die benötigten beobachteten Queue-Rechte einschließlich TRIGGER sind vorhanden. Diese Beobachtung ist kein Sequenz-Eigentümerrecht.

`net.http_method` besitzt genau einen validierten CHECK. Die gelesene Definition wurde nicht als Klartext ausgegeben; nach dem Read ließ sich ihr Hash lokal exakt einer lesbaren bekannten Definition zuordnen:

```sql
CHECK (((VALUE ~~* 'get'::text) OR (VALUE ~~* 'post'::text) OR (VALUE ~~* 'delete'::text)))
```

Die 91 UTF-8-Bytes ergeben exakt den beobachteten Definitionshash **`412b54e60167a01e5fe4856c3ed5cbf862b912b2f3ba01bce4a8661c5ba915de`**. Der separate Constraint-Kataloghash lautet **`63ece7f25171a578daae026a9e5501f99fbbf3e9677452ab470248e13f3ad856`**. Das belegt die bekannte Prüfung für GET/POST/DELETE ohne Groß-/Kleinschreibungsunterscheidung. Die Rohflags `constraint_semantics_verified=false` und `expected_native_constraint_hash_supplied=false` bleiben unverändert: Die semantische Zuordnung erfolgte ausdrücklich **nachgelagert und offline**, nicht durch einen weiteren Datenbankzugriff. [Eigenständiger Domainbeleg](evidence/official-truth-production-http-allocator-queue-read-20261122/method-domain-semantic-binding.json).

Die offizielle archivierte Datei stammt aus [pg_net-Commit a7792bfd](https://github.com/supabase/pg_net/blob/a7792bfd913c7859e14025d606624982706c2a7f/sql/pg_net.sql); ihre 9.487 Bytes hashen auf **`a87097c3b19d4583c5b0eefe28f97e34495e2acb67b8f7bde24ed75ccdead8b5`**. Die Domain ist keine Enum.

## Transportfunktionen und inzwischen installierter BG1-Nachfolger

Alle zwölf `net`-Funktionen und drei gespeicherten Verbraucher haben überprüfbare Body- und vollständige Definitionshashes. Ihre genaue Quellzuordnung, einschließlich der tatsächlich beobachteten Header von `extensions.grant_pg_net_access()` und `jetnity_prod_import_scheduler.tick_v1()`, steht im [substanziellen Transportreview](evidence/official-truth-production-http-allocator-queue-read-20261122/transport-substantive-review.md). Ein passender Versionsname allein wurde nicht als Beweis der ausführbaren Definition verwendet.

Gegenüber dem vorherigen Read 01 änderten sich ausschließlich die beiden BG1-Funktionen `catalog_status_v1()` und `assert_catalog_v1()` in den erfassten Guard-Fingerprints. Ihre aktuellen vollständigen Definitionen passen exakt zur inzwischen separat installierten **BG1-Query-Cost-Optimierung #1273**, dokumentiert und abgeschlossen in #1274, fest bezogen auf Main-Commit **`d8798dc2dee0a7f2cacb4f9def0605ee347f24c4`**. Die übrigen erfassten Guard-Funktionsmetadaten blieben identisch. Der aktuelle Read bestätigt die beiden Definitionen, liest aber **keine neue Query-Cost-Baselinezeile und keinen frischen BG1-Status**.

| Funktion | Aktueller Definitions-SHA-256 |
| --- | --- |
| `official_v3_guard_private.catalog_status_v1()` | `7831174f514c657fcae44d8125e517f810e6271cbc128642cdcbc1df27b2a402` |
| `official_v3_guard_private.assert_catalog_v1()` | `6b71c91f8498c4001f1f81fa01ba4c440681ec6166fbb2bccaae760602c59d39` |

Das neue Schreibpaket muss daher an **`query_cost_baseline_v1`** anschließen. Es darf die optimierte eindeutige JSON-Aggregation, die schmale Dependency-Deduplizierung oder bestehende Digestkanten nicht durch einen älteren v3-Funktionsstand ersetzen. Die aus der separat dokumentierten Installation stammenden Baselinepins sind als solche gekennzeichnet und müssen vor einer späteren Änderung im selben künftigen Preflight erneut exakt passen. Sie werden nicht als zusätzliche Ergebnisse dieses Reads ausgegeben.

## Was dieser Read nicht nachweist

Dieser Auftrag liest weder neue HTTP-ID-Maxima noch neue Cronfehler, Originalinhalte oder AT-Fakten. Die am 21.11. gesondert beobachteten drei historischen AT-Fehler bleiben `UNIQUE_VIOLATION_AT_REQUEST_ID`; sie wurden nicht erneut gelesen. Daraus folgt keine bereits gespeicherte Doppelzeile und keine vollständig bewiesene Sequenzkausalität. Der historische Höchstwert 211 ist kein sicherer späterer Startwert. Ein späterer Installer muss den tatsächlichen Höchstwert erst unter seinen eigenen Sperren neu bestimmen.

Es wurde keine Rehearsal, Installation, Fence, HTTP-/Quellen-/Publisher-/Owneraktion, Rollen-/Secret-/Login-/2FA-Änderung, Veröffentlichung oder kostenpflichtige Aktion ausgeführt. Production wurde durch diesen Auftrag nicht verändert. Ein zwischenzeitlicher unabhängiger Eingriff eines anderen freigegebenen Arbeitsstrangs ist davon getrennt dokumentiert. Abgelaufene Daten bleiben **„derzeit nicht verfügbar“**.

## Weitergabe zur Entscheidung

Die Bindungen werden ausschließlich lokal in einem **neuen, getrennten Schreibpaket vom 22.11.2026** verarbeitet. Das [Prüfpaket](OFFICIAL_TRUTH_PRODUCTION_HTTP_ID_BOUND_PACKAGE_2026-11-22.md) nennt die genauen neuen SQL-Dateien, SHA-Werte, unmittelbaren Schutzkettenvorgänger, Rücknahmewege und Stoppregeln. Alte SQL-Dateien, Manifeste, ursprüngliche STOP-Befunde und Ausführungsbelege bleiben unverändert. Das einmalige Lese-Go autorisiert keinen nächsten Production-Aufruf.
