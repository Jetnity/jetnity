# Production HTTP-ID – gebundenes Prüfpaket vom 22.11.2026

**Paket:** `PROD_HTTP_ALLOCATOR_BOUND_PACKAGE_20261122` · **Ziel:** `qscbgcdmivbbnzrcyegn`.

**Nur Vorbereitung zur Prüfung. Keine Datei dieses Schreibpakets wurde auf Dev oder Production ausgeführt; es liegt kein Rehearsal-, Installations- oder Fence-Go vor.** Der einmalige Queue-Leseauftrag ist abgeschlossen. Seine Erlaubnis wird weder verlängert noch auf dieses Paket übertragen. Der nächste mögliche Auftrag ist ausschließlich die ausdrücklich begrenzte Rehearsal mit separatem lesendem Rückbau-Nachweis; ein späterer COMMIT bleibt eine weitere Entscheidung.

## 1. Verwendete tatsächliche Belege

Der [einmalige Queue-Read vom 22.11., 00:06:49 Zürich](OFFICIAL_TRUTH_PRODUCTION_HTTP_ALLOCATOR_QUEUE_READ_RESULT_2026-11-22.md) bestätigt die sechs Spalten, die Text-Domain `net.http_method`, nullable `headers`, den unveränderten fremden ID-Default, vier feste ID-Pfade und weiterhin fehlende optionale Hooks. Ein Aufruf, 1.805 ms Gesamtfenster, READ ONLY mit ROLLBACK, kein weiterer Production-Zugriff. Sein geprüfter nativer Transport-SHA-256 lautet **`60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f`**.

Der Methoden-CHECK ist nach dem Read offline exakt einer lesbaren Definition zugeordnet: case-insensitive GET/POST/DELETE, Definitionshash **`412b54e60167a01e5fe4856c3ed5cbf862b912b2f3ba01bce4a8661c5ba915de`** und Constraint-Kataloghash **`63ece7f25171a578daae026a9e5501f99fbbf3e9677452ab470248e13f3ad856`**. Die rohen Ergebnisflags werden nicht umgeschrieben. Die zwölf `net`-Funktionen und drei gespeicherten Verbraucher sind anhand ihrer tatsächlichen vollständigen Definitions- und Bodyhashes substantiiert; die Quellen und abweichenden Header sind im [Transportreview](evidence/official-truth-production-http-allocator-queue-read-20261122/transport-substantive-review.md) dokumentiert.

Die frühere Diagnose 00 hat die drei festen historischen AT-Cronläufe 23758/23767/23776 als **`UNIQUE_VIOLATION_AT_REQUEST_ID`** eingeordnet. Diese alten Beobachtungen werden übernommen, nicht erneut abgefragt. Es ist weder eine dauerhaft gespeicherte Doppelzeile noch die vollständige Fehlerkausalität bewiesen. Die alte Vorlage 01 hatte zwei falsche Formannahmen; der Original-STOP bleibt erhalten. Die neue 02-Datei und ihr genehmigtes Manifest bleiben bytegleich.

## 2. Schutzkettenvorgänger: installierte BG1-Optimierung erhalten

In einem anderen, separat freigegebenen Arbeitsstrang wurde nach Vorbereitung des ersten HTTP-ID-Pakets die Query-Cost-Optimierung #1273 installiert und in #1274 dokumentiert. Dieses Paket bindet den festen Main-Commit **`d8798dc2dee0a7f2cacb4f9def0605ee347f24c4`** und archiviert die erforderlichen Quellen. Die aktuellen beiden vollständigen Funktionsdefinitionen aus 02 stimmen exakt mit diesen installierten Quellen überein:

| Gegenstand | SHA-256 |
| --- | --- |
| Aktueller `catalog_status_v1()` | `7831174f514c657fcae44d8125e517f810e6271cbc128642cdcbc1df27b2a402` |
| Aktueller `assert_catalog_v1()` | `6b71c91f8498c4001f1f81fa01ba4c440681ec6166fbb2bccaae760602c59d39` |
| Dokumentierter unmittelbarer Query-Cost-Katalog | `ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24` |
| Unveränderter früherer v3-Katalog | `7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e` |
| Query-Cost-Bindung des vollständigen normalisierten v3-Vorgängers | `a7266c41fc77ab63b8ce2878d10890c7d5b395a3a33d8fe6c5331bf68f7e2bd0` |

**Unmittelbarer Vorgänger ist `official_v3_guard_private.query_cost_baseline_v1`.** Der neue Allocator-Nachfolger `bg1_production_http_allocator_v4` wird darüber angehängt; die Bezeichnung v4 ersetzt keine inzwischen hinzugekommene Kante. Bestehende v3- und Query-Cost-Zeilen sowie alle alten Digestketten werden erhalten. Die aktuelle eindeutige JSON-Aggregation und schmale Dependency-Deduplizierung bleiben im Katalogprüfer bestehen. `audit_v1()` und seine beiden vollständigen Prüfungen werden nicht ersetzt.

Die drei Katalog-/Baselinepins in der Tabelle stammen aus dem separat dokumentierten Installationsbeleg. **Der aktuelle Queue-Read hat diese Baselinezeilen nicht erneut gelesen.** Deshalb muss jede spätere Rehearsal/Installation die dokumentierten Pins, die komplette ursprüngliche Kette und die aktuellen Definitionen vor DDL erneut exakt prüfen. Der Installer darf keine abweichende Live-Baseline automatisch übernehmen. Der tatsächlich committed Allocator-Nachfolger existiert noch nicht; dessen späterer kanonischer Pin bleibt ausdrücklich NULL.

## 3. Geplante Änderung und ID-Bereich

Die spätere atomare Änderung erstellt das private Schema `jetnity_pgnet_allocator_private`, eine eigene **LOGGED-BIGINT-Sequenz mit Eigentümer `postgres`**, einen engen **SECURITY-DEFINER-Helper** mit `search_path=pg_catalog` und genau einen `BEFORE INSERT FOR EACH ROW`-Trigger auf `net.http_request_queue`. Der Helper akzeptiert ausschließlich den festgelegten Queue-Trigger und normalen Sitzungsmodus. Alle regulären Queue-INSERT-Produzenten erhalten die tatsächlich gespeicherte und über RETURNING gelieferte ID aus derselben eigenen Sequenz.

Die fremde Sequenz, deren Owner und der bestehende Spalten-Default bleiben erhalten. Der alte Default kann bei normalen späteren Requests weiterhin Nummern verbrauchen; der Trigger ersetzt anschließend die einzufügende ID. Das Paket benötigt keine `supabase_admin`-Mitgliedschaft, keinen Wechsel des fremden Eigentümers und keine Rollen-/Auth-/Secretänderung. Replica-Bypass, direkte privilegierte Änderungen vorhandener IDs oder feindliche DBA-Aktionen sind außerhalb des zugesicherten normalen Queue-Vertrags.

Die erste neue ID wird **erst in einer später genehmigten Transaktion** berechnet:

`erste_neue_ID = max(211, unter Queue-/Producer-Sperren frisch gelesener Altzähler, frisch gesperrter Höchstwert aller vier ID-Pfade) + 1025`

Damit bleiben **1.024 Nummern Sicherheitsabstand**. **1236** ist nur das Mindestbeispiel, wenn der dann tatsächlich höchste Wert weiterhin 211 beträgt. Es ist kein vorab eingesetzter Live-Startwert. Größere aktuelle Werte werden einbezogen; fehlende Historie, unerwartete Pfade oder unzureichender BIGINT-Restbereich führen zum STOP.

Die bestehenden Guard-/Producer-/AT-Advisory-Sperren und die globale Queue-Sperre werden vor den MAX-Werten erworben. Ein neuer READ-COMMITTED-Statement-Snapshot folgt auf die Queue-Sperre. Feste NOWAIT-Sperren schützen die betroffenen Quellen, Ledger, Ownerbelege und Cronmetadaten. Alle vier Pflichtpfade müssen exakt passen; alle 14 vorher fehlenden optionalen Relationen müssen weiterhin fehlen. Eine inzwischen vorhandene optionale Relation ist für dieses Schreibpaket eine neue Form und führt zur erneuten Prüfung.

Der nativen Transport-Hashberechnung wird kein neues Feld untergeschoben: Sie bleibt bytegleich zur genehmigten 02-Berechnung. Die Methoden-Domain erhält **zusätzlich** eine eigene exakte Vorprüfung, einen geschützten Vorher-/Nachhervergleich und eine Bindung im neuen BG1-Transportkatalog. Damit bleibt der beobachtete Transportpin nachvollziehbar, während der bisher dort nicht enthaltene Domainzustand ebenfalls geschützt wird.

Domain-Owner, Domain-Default, Typmodifikator/Dimension und Kollation wurden durch 02 nicht separat ausgegeben. Die zusätzlichen erwarteten Formbedingungen im späteren Preflight sind deshalb **künftige STOP-Gates, keine bereits bestätigten Istbefunde**. Nur die tatsächlich gelesenen Form-, Basis-, NULL- und CHECK-Merkmale werden als aktuelle Beobachtung geführt.

## 4. Quellenschutz und frischer BG1-Beleg

In derselben Transaktion bekommt `official_v3_at_production_private.renew_ch_v1()` eine frühe Quellenqualifikationsprüfung. Erst wenn alle drei Quellen tatsächlich qualifiziert und außerhalb des Research-Modus sind und alle drei physischen Originale die notwendigen Legal-/Customer-Freigaben mit passenden echten Körperhashes besitzen, darf der bisherige Erneuerungspfad erreicht werden. Andernfalls liefert die neue Funktion vor dem operativen Erneuerungspfad `0`.

Dieses Paket erzeugt **keine** solchen Freigaben. Sein Preflight verlangt genau drei Quellenpins, **keinen** Pin, der zugleich `source_qualified=true` und `research_only=false` erfüllt, keine Legal-/Customerfreigabe der drei Originale und **keine noch frischen AT-Fakten**. Er behauptet damit nicht, dass jeder Pin einzeln `research_only=true` sein muss. Jede Abweichung von diesen festen Bedingungen führt zum STOP. Die negative Nachprüfung ruft ausschließlich den neu gebundenen frühen Ablehnungspfad auf und verlangt `0` sowie unveränderte geschützte Daten. Das ist eine ausdrücklich mit zu prüfende temporäre Publisher-Funktionsprobe; keine positive AT-Erneuerung und kein Quellen-/HTTP-Abruf.

Die neue immutable Allocator-Baseline fordert einen natürlichen vollständigen BG1-Beleg nach der tatsächlichen Installation und eine höhere Generation. Bis dahin müssen öffentliche Integrität und `require_open_v1()` gesperrt bleiben. Es wird kein manueller Audit, Incident-Reset, Resume oder Ownerabschluss ausgeführt. Der Einstieg in Rehearsal und Installation verlangt schon den vorhandenen echten offenen BG1-Zustand. **Ist dieser weiterhin gesperrt oder sein Beleg abgelaufen, stoppt das Paket vor DDL; ein Owner-Schritt ist nicht implizit enthalten.** Abgelaufene Angaben bleiben „derzeit nicht verfügbar“.

## 5. Die sechs neuen SQL-Dateien

Verzeichnis: `scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-package-20261122/`. Die neuen Dateien 00/01/02 werden hier nicht erneut angeboten; ihre einmaligen Leseaufträge sind abgeschlossen.

| Datei | Inhalt und Transaktionsende | Freigabestatus |
| --- | --- | --- |
| `10-production-http-id.REHEARSAL-ROLLBACK.sql` | Temporäre echte Allocator-/Quellenschutz-/BG1-DDL, zwei Queue-ID-Proben, eigene Sequenz-Restart-/Helper-/Guard-Negativproben, Rücknahme bis zum vollständigen aktuellen Vorgänger; Ende ROLLBACK. | Nur zur gesonderten Rehearsal-Entscheidung vorbereitet. |
| `11-production-http-id.POSTREHEARSAL-READONLY.sql` | Unabhängig den wiederhergestellten Query-Cost-Vorgänger, Transport/Domain und Abwesenheit eigener neuer Objekte prüfen; READ ONLY, ROLLBACK. | Nur als ausdrücklich enthaltene zweite Transaktion eines späteren Rehearsal-Go. |
| `20-production-http-id.INSTALL-COMMIT.sql` | Dieselbe gemeinsame Installation ohne die zwei Queue-Probe-IDs; Ende COMMIT. | Erst nach echter bestandener 10+11 und separatem exakten Installations-Go. |
| `30-production-http-id.FENCE-ROLLBACK.sql` | Die spätere eigene Helper-Sperre erproben und zurücknehmen. | Absichtlich noch nicht ausführungsreif: realer Commit-Pin fehlt. |
| `40-production-http-id.FENCE-COMMIT.sql` | Neue erfasste Queue-INSERTs durch den eigenen Helper verweigern, ohne alte IDs wieder freizugeben. | Absichtlich noch nicht ausführungsreif; eigener späterer Fence-Hashsatz und eigenes Go erforderlich. |
| `50-production-http-id.POSTCOMMIT-READONLY.sql` | Nach tatsächlichem Commit unabhängig Nachfolger-/Sequenz-/BG1-Metadaten lesen und den realen Nachfolger-Pin liefern; READ ONLY, ROLLBACK. | Nur in einem späteren ausdrücklich freigegebenen Installationsabschluss. |

Der [lokale Paketindex](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-package-20261122/README.md) und das [Manifest](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-package-20261122/MANIFEST.json) enthalten den endgültigen vollständigen SHA-256-/Byte-Satz. Sie sind Bestandteil der Entscheidung, keine Ausführungsbelege. Builder, archivierte feste Inputs, erforderliche Bindungen und Quellprovenienz sind ebenfalls gehasht.

Auch der spätere Verdict `PROD_HTTP_COMMITTED_READBACK_OBSERVED` aus Datei50 ist für sich kein Betriebs-PASS: Die Datei kann einen noch gesperrten Status und null passende frische Vollprüfläufe melden. Ein Integritätsabschluss braucht den tatsächlich passenden aktuellen Guard- und Vollprüfbeleg; ein natürlicher HTTP-/Response-/Journalnachweis und eine positive Quellenfreigabe sind damit nicht erbracht.

<!-- FINAL_SQL_HASH_TABLE -->

**SHA-256 des neuen Manifests:** `887d334381d48513a16b611450459f64586e11733a1d70dc98e43378641f0e67`.

| Datei | Bytes | Vollständiger SHA-256 |
| --- | ---: | --- |
| `10-production-http-id.REHEARSAL-ROLLBACK.sql` | 101801 | `286bd06250739d91476f286ac6fa668d7e662244c81064b2172599d3230c7457` |
| `11-production-http-id.POSTREHEARSAL-READONLY.sql` | 24857 | `4a0f90f485c5241c9532994c0260659dcfeb4f3e86165232ffa003a31a0621f2` |
| `20-production-http-id.INSTALL-COMMIT.sql` | 94890 | `3efbd3186483212c575c0d3cb53e6f2c5a1e4fb34e9ab1343ecd8c0504dda539` |
| `30-production-http-id.FENCE-ROLLBACK.sql` | 29584 | `453255008bc93b39571772c8b5e6a6a6ee7a40949900918310ab3e32bae3d546` |
| `40-production-http-id.FENCE-COMMIT.sql` | 29074 | `4af27e195bb91200bab301356b341d51b1079340a7d24cfec473e9a6e651cc34` |
| `50-production-http-id.POSTCOMMIT-READONLY.sql` | 7670 | `74caf24ea8870c5ea95f82b67598427b2f2ee11aa8066250b448b12a79ab4431` |

<!-- END_FINAL_SQL_HASH_TABLE -->

## 6. Rücknahme ohne Wiederverwendung alter Nummern

**Vor COMMIT:** Jeder Fehler bricht die Transaktion ab. In der Rehearsal erhalten die zwei Queue-INSERTs explizite eingehende IDs `0` und `211`; dadurch muss der fremde Defaultzähler nicht verbraucht werden. Der neue Trigger überschreibt beide mit den berechneten eigenen IDs. Die Queue ist gesperrt, die zwei Zeilen bleiben uncommitted und werden vor Freigabe vollständig zurückgenommen. Es gibt keine Aufrufe von `net.http_*`, `net.wake()` oder `net.worker_restart()`.

Die Rehearsal prüft den transaktionalen RESTART ausschließlich an der eigenen, erst in dieser Transaktion angelegten Sequenz. Sie erprobt den eng geprüften Drop des eigenen Helpers samt eigener Triggerabhängigkeit und dessen Savepoint-Rücknahme, eine tatsächliche Guardverweigerung bei Helperänderung sowie die Unveränderlichkeit der neuen Baseline. Anschließend werden die gesamte Installation und die Probezeilen zurückgenommen. Alte Baselines, Definitionen, Rollen-/Quellen-/Owner-/Historienzustände und bestehende Zähler müssen innerhalb der gesperrten Transaktion exakt wiederhergestellt sein. Ein Ausgabe-SELECT allein gilt nicht als Erfolg; der gesamte Aufruf inklusive abschließendem ROLLBACK muss erfolgreich abgeschlossen sein. Datei 11 liefert danach den unabhängigen Ketten-/Objekt-/Metadaten-Nachweis. Der vollständige eingefrorene Zeilen-/Zählervergleich stammt aus Datei 10; zwischen beiden Transaktionen können normale Abläufe wieder Historie und Zähler fortschreiben.

**Nach COMMIT:** Bereits vergebene IDs dürfen nicht wiederverwendet werden. Deshalb ist der vorbereitete Rückbauweg eine exakt gebundene **Helper-Sperre**, kein Drop des Triggers und keine Rückkehr zum niedrigen fremden Zähler. Die Sperre erhält beide Sequenzen, Historien, Originale und bereits eingereihte Requests. Bereits vorhandene Queueeinträge können weiterhin verarbeitet werden; der Fence ist kein vollständiger HTTP-Betriebsstopp.

Der normale Katalogprüfer erkennt die absichtliche Helperabweichung bei der nächsten Prüfung. Ein unmittelbar gleichzeitig umspringender öffentlicher Alarm wird nicht zugesichert. Eine spätere Wiederherstellung benötigt eine geprüfte Vorwärtskorrektur. Dateien 30/40 enthalten bewusst einen fehlenden `installed_successor_canonical_sha256` und stoppen vor der Änderung. Erst der tatsächlich committed und unabhängig gelesene Nachfolger kann einen neuen konkreten Fence-Hashsatz begründen.

## 7. Feste Grenzen und STOP-Regeln

Die Schreibdateien 10/20/30/40 setzen **25 s Statementtimeout**, **90 s Transaktionstimeout**, **30 s Idle-in-Transaction-Timeout** und **2 s Locktimeout**; die zusätzlichen Historiensperren sind NOWAIT. Die lesenden Dateien 11/50 setzen **15 s Statementtimeout**, **20 s Transaktionstimeout** und **500 ms Locktimeout**. Ein späterer Auftrag muss zusätzlich das gesamte Aufruffenster und die erlaubte Anzahl begrenzen.

Die erste mögliche Rehearsal-Entscheidung umfasst höchstens **zwei Transaktionen in fünf Minuten**, jede Datei genau einmal, Reihenfolge **10→11**; maximal **65.536 Ergebnisbytes pro Datei**, zusammen **131.072 Bytes**. Datei 11 folgt ausschließlich auf den bekannten vollständig erfolgreichen 10-Verdict. Der Runner muss Aufrufzahl, Restzeit, Ergebnisform und Rückgabegröße prüfen. Keine automatische Folgefreigabe entsteht aus einem Erfolg.

STOP bei falschem Ziel/Session/Dateihash; fehlendem Pflichtobjekt oder Pin; unbekannter Form, Funktion, Domain, Relation oder Default; anderer alter Schutzkette; fehlenden normalen Rechten; unerwartet vorhandenem Allocator; Katalog-/Owner-/Datenabweichung; Replica-Modus; geänderter Quellenqualifikation/frischen AT-Fakten; fehlender tatsächlicher BG1-Freigabe; gesperrtem Objekt oder Timeout; unvollständiger Inventur; Zeit-/Zeilen-/Byte-/BIGINT-Überschreitung; SQL-/Dienstfehler oder unklarer Antwort. **Kein Retry, kein Zusatzread, kein spontanes Neugenerieren akzeptabler Pins und kein Rollen-/Projekt-/Credentialwechsel.** Eine unklare Commit-Antwort ist kein Erfolg; auch ihre spätere Klärung benötigt einen eigenen freigegebenen Read.

## 8. Konkreter nächster Auftrag ausschließlich zur Entscheidung

Der folgende Text ist **ein Vorschlag**, kein erhaltenes Go. Vor Ausführung müssen alle vollständigen Hashes des unten verlinkten Manifests feststehen und ausdrücklich mitfreigegeben sein:

> Go für den einmaligen Production-Rehearsal-Auftrag `PROD_HTTP_ALLOCATOR_REHEARSAL_20261122` auf `qscbgcdmivbbnzrcyegn`, ausschließlich mit den unveränderten Dateien 10 und 11 samt vollständigen SHA-256-Werten aus `PROD_HTTP_ALLOCATOR_BOUND_PACKAGE_20261122` und dessen genauem Manifest-SHA. Höchstens zwei Transaktionen innerhalb von fünf Minuten, jede Datei einmal, feste Zeit-/Ausgabegrenzen, Reihenfolge 10→11. Erlaubt sind nur die in 10 genau enthaltenen temporären DDL-/ID-/negativen Publisher-/Guard-Proben mit vollständigem ROLLBACK und anschließend 11 READ ONLY mit ROLLBACK. Bei Fehler, unbekannter Ergebnisform, fehlender Pflichtbindung, gesperrtem BG1, unklarer Antwort oder Überschreitung stoppen, kein Retry und kein Zusatzread. Keine COMMIT-, Fence- oder Installationsdatei, keine dauerhafte Production-Änderung, kein HTTP-/Quellen-/positiver Publisher-/Audit-/Owner-Schritt, keine Rollen-/Secret-/Login-/2FA-Änderung, neuen Kosten oder Veröffentlichung. Danach nur Ergebnisse auswerten und eine getrennte Installationsentscheidung vorlegen.

Ein aktueller BG1-Zustand wird durch diese Vorlage nicht behauptet. Der vorhandene Owner-/Frischevertrag bleibt das Eintrittsgate. Auch nach einer künftigen erfolgreichen Rehearsal muss Sasa das tatsächliche Ergebnis und den exakten Installationsumfang vor einem COMMIT prüfen.

## 9. Prüfstand und Originalerhalt

Diese Fassung entsteht ausschließlich durch lokale Auswertung, Quellvergleich, deterministische SQL-Generierung und unabhängige statische Prüfung. Ein nativer Production-Rehearsal-, Installations-, HTTP-, Neustart- oder positiver AT-Erneuerungs-PASS liegt für diese neue Fassung nicht vor. Die nativen 14/14-Tests des anderen Query-Cost-Arbeitsstrangs sind dessen Beleg und werden nicht als Test dieses HTTP-ID-Pakets übernommen.

Alle bisher genehmigten Lese-SQLs und Manifeste sowie die alten ursprünglichen Schreibkandidaten und Belege bleiben unverändert. Der bisherige Gesamtplan wird vor der neuen Ergänzung bytegleich archiviert. Der neue Abschluss verweist auf die tatsächliche Read-Antwort, die gesonderte Offlinebewertung und das neue gehashte Prüfpaket. Production wurde durch diesen Auftrag nicht verändert; es wurde kein neuer Quellenlauf, Login oder kostenpflichtiger Schritt gestartet.
