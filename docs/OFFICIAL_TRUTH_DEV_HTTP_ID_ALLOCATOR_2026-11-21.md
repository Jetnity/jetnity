# Technischer Dev-Nachweis: eigener HTTP-ID-Allocator und BG1-v8

## Belegstand und Zweck

Stand: **21.11.2026, 15:30:24.961198 UTC / 16:30:24 Zürich**, nach tatsächlicher v8-Installation, erfolgreicher post-COMMIT-Sperr-Rehearsal R4, natürlichen BG1-Vollbelegen und drei echten HTTP-Antworten des regulären AT-Batches 105. Dieser Nachweis betrifft ausschließlich Dev `yfvbxvijcorffwxbxahl`; Production wurde weder abgefragt noch verändert. Transport und Quellenwatch sind tatsächlich bestätigt; eine positive fachliche AT-Erneuerung ist nicht belegt.

**Tatsächlich bestanden:** R1 eigener Allocator mit Rücknahme; R2 sieben echte SQL-HTTP-/Webhookwege mit Rücknahme; R3 integriertes v8 einschließlich nativer Manipulations-Negativfälle mit vollständiger Rücknahme; tatsächliche Dev-Installation; R4 anschließende Helper-Sperrprobe mit vollständiger Wiederherstellung; natürlicher vollständiger Nach-v8-Prüflauf mit eigenem Readback. Eine Probe, eine dauerhaft installierte Änderung und ein späterer natürlicher Betriebslauf sind getrennte Belegarten.

### Tatsächliche abschließende Ergebnisse

| Feld | Aktueller Inhalt |
| --- | --- |
| Installation | `dev_owned_http_allocator_bg1_v8_20261121`, Erfolg plus unabhängiger Readback |
| Erforderliche neue BG1-Generation | **2077** |
| Zustand vor neuem Vollbeleg | **2076**, öffentliche Antwort korrekt `unavailable` |
| Vollbeleg nicht vor | **2026-11-21 15:16:50.708027 UTC** |
| Tatsächlicher neuer vollständiger Cronlauf | **20819**, erfolgreich **15:20:00.121669–15:20:08.361308 UTC**; vollständiger BG1-Beleg **15:20:00.137167–15:20:08.355385 UTC**, fällig 15:20, Generation **2077** |
| Separater Readback nach diesem Lauf | **15:20:23 UTC**: BG1 `current`, v8 exakt, 71 Fakten / 0 frisch, drei Originale exakt und gleiche Faktenhistorie |
| Abschließender natürlicher Vollbeleg | Generation **2079**, Due 15:30 UTC, Proof **15:30:00.182330–15:30:08.461908**, tatsächlicher erfolgreicher Cron **20847**, Lauf **15:30:00.168878–15:30:08.467384** |
| Natürliche HTTP-ID/Response-/Quellenkorrelation | **PASS:** normaler Batch **105**, IDs **1805–1807**, drei HTTP 200 und drei exakte Körper-/Hash-/Bytes-/Zeit-/Watch-Bindungen; 2 unverändert, 1 geändert |
| Separates Erneuerungsjournal / positive Erneuerung | **0** neue Journal-Bindungen; kein Seal oder Publisher durch diese Beobachtung; **keine positive Erneuerung** |
| Abschließender Zähler-/Faktenstand | Eigene Sequenz **1809/called**, alte Sequenz **92/called**, BG1 `current`, 71 historische / 0 frische Fakten, drei exakte Originale |
| Lieferbindung | [SHA-Manifest](evidence/official-truth-renewal-20261121/dev-owned-http-allocator-manifest-20261121.json), Eltern-Commit und enthaltender Git-Commit; CI-Livegate bleibt ausdrücklich gesperrt |

## 1. Ausgangslage und eng begrenzte DDL-Fehler

Die vorhandene `net.http_request_queue_id_seq` ist eine BIGINT-Sequenz mit Increment 1, Cache 1, No Cycle, `relpersistence='u'`, Owner `supabase_admin`. Nach dem vom Owner gemeldeten Dev-Neustart begannen neue Requests bei IDs 2–6, obwohl ältere reservierte IDs bis 1800 bestanden. Der Vorabwert 20, spätere Werte 21, 23, 49, 51, 71, 78 und 83 sind zeitlich unterschiedliche Beobachtungen; sie werden nicht als ein unveränderter Sequenzstand dargestellt.

Folgende tatsächliche Ergebnisse bleiben getrennt erhalten:

| Versuch | Tatsächliche Beobachtung | Schlussfolgerung |
| --- | --- | --- |
| Ursprüngliche Sequenzreparatur | Erstes `ALTER SEQUENCE` abgewiesen: **42501**, `must be owner of sequence http_request_queue_id_seq`. | Kein wirksamer Restart, kein Hosted-Rollback-PASS dieses ursprünglichen Versuchs. |
| Autorisierte Eigentumsübertragung | `OWNER TO postgres` ebenfalls **42501** vor wirksamer Änderung. | Keine Rollen-, Owner- oder ACL-Eskalation durchgeführt. |
| Eigene LOGGED-Sequenz plus Defaultumbindung | Eigene Sequenz/Restart/Rücknahme funktionieren; Defaultumbindung abgewiesen: **42501**, `must be owner of table http_request_queue`. | Tabellen-Ownerrecht fehlt für diesen Defaultweg. Das Ergebnis betrifft nicht die spätere reguläre TRIGGER-Berechtigung. |
| R1 erster SQL-Entwurf | **42809**, Sequenzalias hat keinen Composite-Typ; kein PASS. | Snapshot wurde auf explizite `last_value`, `is_called`, `log_cnt` korrigiert. Original erhalten. |
| R3 erster nativer Entwurf | **42725**, `operator is not unique: unknown - unknown`. | Die JSONB-Arrow-Ausdrücke wurden vor Subtraktion geklammert; Originaldatei und Fehler bleiben erhalten. |
| Abgelaufene Dienstbestätigungen | Kein SQL ausgeführt. | Weder nativer Fehler noch PASS; keine Berechtigungsumgehung. |

`current_user=session_user=postgres` ist kein Superuser und besitzt keine effektive MEMBER-/USAGE-/SET-Mitgliedschaft bei `supabase_admin`. Die vorhandene Jobs-Mitgliedschaft lautet **postgres bei `ot_v3_jobs_owner`, Grantor `supabase_admin`**. Das ist keine Mitgliedschaft bei der Grantorrolle. Der spätere Triggerweg verwendet vorhandene gewöhnliche Rechte. Der Owner hat Support ausdrücklich zurückgestellt; eine externe Anfrage wurde nicht gesendet. [Eigentümerbelege](evidence/official-truth-renewal-20261121/dev-sequence-owner-authority-20261121.json), [Allocator-Belege](evidence/official-truth-renewal-20261121/dev-owned-http-allocator-20261121.json).

## 2. Fester globaler Installationsbereich

Die Skripte prüfen Dev-Marker, PostgreSQL 17, erwarteten Benutzer und Transaktionskontext, die exakte bestehende BG1-/Quellen-/Publisherkette, relevante Rollenmitgliedschaften sowie das feste Inventar aller erfassten persistenten oder UNLOGGED-BIGINT-Request-ID-Spalten. UUID-/Text-Request-IDs gehören nicht zu diesem Nummernraum. Ein zusätzliches oder fehlendes passendes Objekt führt zum Abbruch, nicht zum stillschweigenden Ausschluss.

Die geprüfte Inventur enthält **16 konkrete ID-Pfade**. Das globale Maximum lag in R1/R2/R3 bei **1800**. Der Start der eigenen Sequenz wurde unter der globalen Queue-Sperre aus der frischen Inventur abgeleitet: **1801**. Das ist keine festgeschriebene Annahme für eine spätere Production-Ausführung. Die exakten qualifizierten Tabellen-/Spaltennamen sind Bestandteil der unverändert gehashten SQL-Dateien.

Die Transaktionen verwenden `READ COMMITTED`, begrenzte Timeouts und die vorhandenen Schutz-/Produzenten-Advisory-Locks. Die Queue-Sperre wird vor der frischen High-Water-Ermittlung gehalten; R2 sperrt zusätzlich `supabase_functions.hooks` in fester Queue→Hooks-Reihenfolge. Konflikte führen zum Abbruch. Die Queue-Sperre verhindert, dass uncommittete Probeanfragen vom Worker entnommen werden. Die nativen `net`-Funktionen dürfen während R2 ihr normales Wake-Signal auslösen; es werden keine Probezeilen committed. Ein Wake ist kein Versandbeleg.

Es wurde kein echter Mehrsession-/Lasttest dieses neuen Triggerpfads durchgeführt. Der isolierte frühere PG17-Sequenztest darf dafür nicht als Ersatzbeleg verwendet werden.

## 3. Eigene Objekte und eng begrenzter Helper

| Objekt | Definition/Eigentum |
| --- | --- |
| Schema | `jetnity_pgnet_allocator_private`, Owner `postgres`, keine neuen PUBLIC-/Callerrechte |
| Sequenz | `jetnity_pgnet_allocator_private.http_request_id_v1`, BIGINT, LOGGED, Increment 1, Cache 1, No Cycle, Owner `postgres` |
| Triggerfunktion | `jetnity_pgnet_allocator_private.assign_request_id_v1()`, `SECURITY DEFINER`, fester `search_path=pg_catalog`, private ACL |
| Trigger | `jetnity_pgnet_request_id_v1`, genau `BEFORE INSERT FOR EACH ROW` auf `net.http_request_queue`, keine Triggerargumente |
| BG1-Folgebeleg | `official_v3_guard_private.bg1_dev_http_id_allocator_v8`, append-only und in die erforderliche Schutzkette aufgenommen |

Der Helper akzeptiert ausschließlich den festen Queue-OID und Triggernamen, `TG_OP='INSERT'`, `TG_WHEN='BEFORE'`, `TG_LEVEL='ROW'`, `TG_NARGS=0`, Kontext `origin`/`local`. Danach erfolgt genau ein `pg_catalog.nextval` auf der vollständig qualifizierten eigenen Sequenz, dessen Ergebnis nach `NEW.id` geschrieben wird. Beide `regclass`-Casts sind ausdrücklich `pg_catalog.regclass`; auch `current_setting` ist qualifiziert. So besteht keine Abhängigkeit von einem unqualifizierten temporär überschattbaren Typ. Eine Beschränkung auf Trigger-Tiefe 1 wäre falsch und ist nicht enthalten: Der echte Webhook ist verschachtelt.

Die endgültige Helperdatei hat SHA-256:

`7a2fba345aeccef648d0c37a0092cc923a47e3e21557a98e0acc338c607a5c29`

Der genaue UTF-8-`prosrc` hat SHA-256:

`16151e29d3859b8574afcc934c2fa4cc6709c82280697e34474b41f711801afa`

Die ursprünglichen `net.http_get/post/delete`, die Supabase-Webhookfunktion, Queue-Default, verwaltete Sequenz, deren Eigentümer und bisherige Callerrechte bleiben unverändert. In der vorhandenen Umgebung hatten 43 Rollen effektive Queue-/Altsequenzrechte. Der Entwurf erweitert diese Rechte nicht und verleiht ihnen kein direktes USAGE auf die eigene Sequenz. Die privaten Objekte werden innerhalb derselben Transaktion angelegt und ihre ACLs beschränkt. [CREATE TRIGGER](https://www.postgresql.org/docs/17/sql-createtrigger.html), [SECURITY DEFINER](https://www.postgresql.org/docs/17/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY-DEFINER).

## 4. R1 – eigene Sequenz, Trigger und echte Rücknahme

Die korrigierte native R1-Datei bestand als `DEV_PGNET_OWNED_ALLOCATOR_TRIGGER_INSTALL_ROLLBACK_PASS`. Zwei Inserts mit expliziten eingehenden IDs erhielten über den temporär installierten Trigger **1801 und 1802**. Ein tatsächlicher Restart der eigenen Sequenz wurde per Savepoint zurückgenommen. Eine gezielt abgegrenzte `DROP FUNCTION … CASCADE`-Probe zeigte den zugehörigen Trigger als genau erwartete Abhängigkeit; ihre Rücknahme stellte die Objekte wieder her. Anschließend wurde die gesamte temporäre Installation zurückgerollt.

Die verwaltete Altsequenz blieb während dieser Probe bei **49**; R1 rief keine normale HTTP-Funktion auf. Der unabhängige Readback um **14:30:05.807737 UTC** fand das neue Schema nicht mehr, null Queue-Trigger und den ursprünglichen Default. Zu diesem späteren Zeitpunkt stand die natürlich fortlaufende Altsequenz bei **51/called=true**. Das ist kein Widerspruch zur Gleichheit innerhalb der vorherigen R1-Transaktion. BG1/v7 und die Quellen-/Faktenbelege waren beim Readback unverändert.

R1 beweist weder echte Netzwerkzustellung noch die endgültige SD-Callerkompatibilität, die anschließend R2 prüfte. [R1-Skript](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-pgnet-owned-allocator-trigger-rehearsal.ROLLBACK.sql).

## 5. R2 – sieben reale Aufrufwege ohne Caller-Grants

Die tatsächlich ausgeführte R2-Datei blieb nach der Ausführung bytegleich. Ihr ursprünglicher Kandidatenkommentar ist Teil dieses gehashten Artefakts; der Ausführungsstatus wird im Ergebnisdatensatz dokumentiert, nicht rückwirkend durch Umschreiben des Versuchsartefakts.

| Reihenfolge | Tatsächlicher Weg | Rückgegebene Request-ID |
| --- | --- | --- |
| 1 | `net.http_get`, aufrufender Kontext `postgres` | 1801 |
| 2 | `net.http_post`, aufrufender Kontext `postgres` | 1802 |
| 3 | `net.http_delete`, aufrufender Kontext `postgres` | 1803 |
| 4 | Tatsächlicher AFTER-INSERT-Fixturetrigger → installierte `supabase_functions.http_request` → `net.http_post` → Queue-Helper | 1804 |
| 5 | `net.http_get` unter `SET LOCAL ROLE anon` | 1805 |
| 6 | `net.http_get` unter `SET LOCAL ROLE authenticated` | 1806 |
| 7 | `net.http_get` unter `SET LOCAL ROLE service_role` | 1807 |

Die installierte Webhookfunktion hatte `pg_get_functiondef`-SHA **053080bf8c8a0b0c8daadedc700c6b857fd3ef0aa34fc2096ee7f5214389b146**. Es wurden ihre tatsächlichen Triggerargumente URL, Methode, Headers, Params, Timeout verwendet. Sie legte den tatsächlichen Eintrag in `supabase_functions.hooks` mit `hook_table_id`, `hook_name`, `request_id` an. Dieser Eintrag gehörte zur zurückgerollten Fixture, nicht zu einer simulierten Rückgabe. Alle sieben Pfade nutzten vorhandene Rechte ohne neue Schema-/Seq-/Funktionsfreigaben für Caller.

### Nicht zurückgenommene Zählereffekte

| Bestehende Sequenz | Vor R2 | Nach R2 | Ehrlicher Effekt |
| --- | --- | --- | --- |
| Verwaltete HTTP-Sequenz | `last_value=71`, `is_called=true`, `log_cnt=32` | `last_value=78`, `is_called=true`, `log_cnt=32` | Sieben `nextval`-Aufrufe. Der unveränderte Default wird vor Umschreiben der ID ausgewertet. |
| Hooks-ID-Sequenz | `last_value=1`, `is_called=false`, `log_cnt=0` | `last_value=1`, `is_called=true`, `log_cnt=32` | Ein `nextval`-Aufruf; numerische Differenz **0** wegen zuvor noch nicht aufgerufenem Startwert. |

Die eigene neue Sequenz sowie Schema, Helper, Trigger, Fixture, deren Trigger und Abhängigkeiten verschwanden mit der endgültigen Rücknahme. Ursprüngliche Queue-/Response-/Hookszeilen, Quellen, Fakten, Quittungen und v7-Katalog wurden exakt wiederhergestellt. **Bestehende Sequenzverbräuche wurden erhalten**; es gab keinen Reset oder `setval`. Das Ergebnis lautet `DEV_PGNET_OWNED_ALLOCATOR_SEVEN_API_WEBHOOK_ROLLBACK_PASS`.

R2 ist ein echter SQL-API-/Rollen-/Webhook-Beleg. Es ist kein Versand-, Quellenaktualisierungs-, Crash-, Replica-Abwehr- oder Mehrsessionbeleg. Die verwendeten Probeziele wurden nicht versandt. [R2-Skript](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-pgnet-owned-allocator-netapi-webhook-rehearsal.ROLLBACK.sql), [PostgreSQL-Sequenzfunktionen](https://www.postgresql.org/docs/17/functions-sequence.html).

## 6. R3 – v8-Integration und native Negativfälle

Der korrigierte integrierte Entwurf mit SHA **d6704599d71ca654f7a8ef1c2864ebf8f75a3a52462b83573ec4992575c76ac4** wurde tatsächlich auf Hosted Dev bestanden. Der abschließende Nachweis lautet `DEV_HTTP_ID_ALLOCATOR_V8_FULL_REHEARSAL_ROLLBACK_PASS`, High-Water **1800**, Seed **1801**, ursprünglicher Schutzkatalog/-status, Quellen und Fakten wiederhergestellt, neue Allocator-/v8-Objekte entfernt, Altsequenz unverändert, kein HTTP-Versand.

Innerhalb derselben Transaktion wurden die Negativfälle tatsächlich ausgeführt und einzeln rückgenommen: geänderte Parameter der eigenen Sequenz; zusätzliche PUBLIC-Berechtigung; geänderter Helperbody; Entfernung des Helpers samt exakt bekanntem Queue-Trigger; UPDATE/DELETE/TRUNCATE der geschützten v8-Baseline; `replica`-Kontext. Die Katalogverweigerung wurde an den jeweiligen isolierten Transportänderungen überprüft. Der zugehörige Teilnachweis lautet `DEV_HTTP_V8_NATIVE_NEGATIVES_AND_SAVEPOINT_RESTORE_PASS`.

v8 bindet den ursprünglichen v7-Stand, die neuen Objekte/Definitionen/ACLs und die bisherigen pg_net-Transportdefinitionen. Die zusätzliche Supabase-Webhookdefinition wurde in R2 exakt geprüft; sie wird dadurch nicht als eigener neuer v8-Katalogbestandteil behauptet. v8 verlangt eine neue Generation und einen nach Installation entstandenen vollständigen Beleg. Die laufende eigene `last_value` ist kein unveränderlicher Kataloghashbestandteil; Parameter, Eigentum und Rechte sind es. Eine echte neue ID darf deshalb nicht selbst als Katalogmanipulation gelten.

**Replica-Grenze:** Das gewöhnliche O-Triggerverhalten läuft im Replica-Modus nicht. R3 belegt dort die Ablehnung durch BG1-Katalog-/Öffnungsfunktionen und die geschlossene öffentliche Statusantwort. Es behauptet keine globale Verhinderung des privilegierten Moduswechsels und keine Durchsetzung des Queue-Triggers gegen diesen Modus. Die tatsächlich mögliche Supautils-Privilegierung des `postgres` wurde berücksichtigt; ein unauffälliger Parameter-ACL-Katalog allein wäre kein Gegenbeweis. Direkte UPDATEs vorhandener Queue-IDs sind ebenfalls kein BEFORE-INSERT-Schutzumfang. [R3-Skript](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-pgnet-owned-allocator-v8.REHEARSAL-ROLLBACK.sql), [Replikationskontext](https://www.postgresql.org/docs/17/runtime-config-client.html#GUC-SESSION-REPLICATION-ROLE).

## 7. Tatsächliche Installation und unabhängiger Readback

Nach R3 und der gesonderten aktuellen Vorprüfung wurde **`dev_owned_http_allocator_bg1_v8_20261121` tatsächlich erfolgreich angewandt**. Der ausgeführte Installationsinhalt hat SHA **714f088aed89d2910c503e1b2d2c615ac894a7ea27b81c51581511809bbb51f2**. Der unabhängige Readback um 15:17:18 UTC bestätigt:

- v8-Katalog exakt; keine Ersetzung der vorherigen unveränderlichen Geschichte.
- Eigene Sequenz Owner `postgres`, `relpersistence='p'`, Start 1801, noch `is_called=false`, private Owner-ACL.
- Verwaltete Sequenz 83, durch die Installation nicht verändert.
- Erforderliche Generation 2077, bisheriger Zustand 2076, `proof_not_before=15:16:50.708027 UTC`.
- BG1 korrekt `unavailable`, bis ein neuer echter vollständiger Lauf vorliegt.
- 71 historische Fakten mit unverändertem SHA **fefe812a3062bd05a84d08cc4d4ae71334cdee35f84df4c8f5eab3fca8bf2b38**, drei exakte Originale.

Der erste unabhängige Readback um **15:20:23 UTC** verbindet den vollständigen natürlichen BG1-Beleg **15:20:00.137167–15:20:08.355385 UTC** mit dem tatsächlich erfolgreichen Cronlauf **20819** (**15:20:00.121669–15:20:08.361308 UTC**). Ergebnis zu diesem Zeitpunkt: **Generation 2077, BG1 `current`, v8 exakt**, unveränderte 71 Fakten / 0 frisch, drei exakte Originale. Die eigene Sequenz war noch **1801/uncalled**. Dies war ein Schutzbeleg vor dem später gesondert nachgewiesenen HTTP-Transport.

### Normaler AT-Transport nach der Installation

Der erste natürliche Enqueue um 15:20 UTC, Cron **20818**, wurde vor Abschluss des frischen BG1-Vollbelegs mit `AT_SOURCE_WATCH_GUARD_REFUSED` verweigert. Dieser tatsächliche Fehler bleibt erhalten. Der nächste reguläre Enqueue, Cron **20832**, lief erfolgreich **15:25:00.172093–15:25:00.237111 UTC** und erzeugte Batch **105** um **15:25:00.224038 UTC**. Die Antworten entstanden um **15:25:00.479713 UTC**. Der normale Collector beobachtete sie um 15:30 UTC; weder Enqueue noch Collection wurden manuell wiederholt.

| Tatsächliche Quelle | Request-ID | HTTP / Bytes | Watch-Beobachtung UTC | Watch-Ergebnis / SHA-256 |
| --- | --- | --- | --- | --- |
| `bmeia-bern-how-to-apply` | **1805** | **200 / 172428** | **15:30:00.237429** | `changed`; `2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe` |
| `bmi-general-entry` | **1806** | **200 / 91655** | **15:30:00.245158** | `unchanged_exact`; `ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e` |
| `bmi-visa-nationality-matrix` | **1807** | **200 / 498415** | **15:30:00.261824** | `unchanged_exact`; `fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778` |

Der rein lesende abschließende Readback um **15:30:24.961198 UTC** bestätigt für alle drei Quellen `exact_response_watch_binding=true`, drei verschiedene neue IDs oberhalb des historischen Maximums 1800 und `actual_post_install_at_transport_verified=true`. Die Bindung prüft echte HTML-Antwortkörper, Hash, Bytes, Anfrage-/Antwort-/Beobachtungszeiten und tatsächlich erfolgreiche Enqueue-/Collector-Cronläufe mit exakt erwarteten Jobnamen, Befehlen, Rolle und Datenbank. Die laufende eigene Sequenz steht bei **1809/called**, der unveränderte Altgenerator bei **92/called**.

**Quellenwatch ist kein Erneuerungsjournal:** Die tatsächliche Definition von `official_v3_at_source_watch_private.collect_v1()` schreibt die Watch-Belege in `reads_v1`. Sie versiegelt keinen neuen Eintrag im separaten Erneuerungsjournal und veröffentlicht keine Fakten. Die Abfrage gibt daher ausdrücklich **0** separate Journal-Bindungen und `positive_at_renewal_proven=false` aus. Diese ehrliche Trennung ist kein fehlgeschlagener HTTP-Test. Der frühere versiegelte Batch 99 und seine reale Publisher-Verweigerung bleiben die eigenen Erneuerungsbelege.

### Exakte Zeitkorrelation des BG1-Vollbelegs

Beim abschließenden Readback ist **Generation 2079** mit dem tatsächlichen erfolgreichen Cron **20847** verbunden: Due **15:30 UTC**, Proof **15:30:00.182330–15:30:08.461908**, Cron **15:30:00.168878–15:30:08.467384 UTC**. Ergebnis `DEV_V8_CURRENT_AND_HISTORY_INDEPENDENT_READBACK_PASS`, v8 exakt, Faktenhistorie unverändert.

Die installierte Auditdefinition verwendet für `runs.started_at` das Statement-Zeitstempel-Äquivalent und für `proof_started_at` die echte Uhrzeit nach dem Schutzlock. In Generation 2078 lag der Statement-Zeitstempel **1,920 ms** vor dem zugehörigen Cron-Startdatensatz. Eine erste Readback-Fassung verlangte dafür die falsche Untergrenze und meldete null passende Cronbelege; dieser Originalbefund bleibt erhalten. Die endgültige rein lesende Abfrage bindet das tatsächliche **Proof-Intervall** an das Cron-Intervall und prüft weiterhin die exakten State-/Run-Felder, Due-Slots, Generationen, Befehle, Benutzer und Datenbank. Es gibt keine willkürliche Zeittoleranz und keine Änderung am installierten Produktguard. Der ursprüngliche Readback mit SHA `5f0232503939f8519498b917e1026b62d15a461f56d58a07f5bfd778d6c4ef53` bleibt als eigenes Artefakt archiviert.

Die Installation und ihr neuer Vollbeleg sind dauerhafter bzw. zeitlich konkret beobachteter Dev-Fortschritt. Sie sind kein positiver AT-Fakt und kein Production-Eingriff. [Installationsdatei](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-pgnet-owned-allocator-v8.INSTALL-DEV-COMMIT.sql).

## 8. R4 – tatsächlich geprüfte Sperre nach COMMIT

Die Sperr-Rehearsal wurde nach der echten Installation an die **tatsächlichen Live-Pins** gebunden. Ein expliziter Queue-Insert wurde von der vorübergehend geschlossenen Helperfunktion abgewiesen. Weil eine explizite ID verwendet wird, benötigt diese Probe keinen alten Default-`nextval` und keinen normalen `net`-Wake. Die echte v8-Katalogprüfung verweigerte den veränderten Helper mit `P7905`. Nach der Savepoint-Rücknahme waren Helper, Katalog, Schutzstatus, Sequenzen und Historie wieder exakt hergestellt.

| Live-Pin | Tatsächlich gelesener Wert |
| --- | --- |
| v8-Baseline-SHA | `0d70655bb01ab4e1516149886e1abaeff913012ebbd17b6d643848e48ed3ab87` |
| `pg_get_functiondef`-SHA des Helpers | `0b0ca64659d9884e01b66e781b54f49a6f17357352afcd3ad6eb30e44571a48c` |
| Helper-`prosrc`-SHA | `16151e29d3859b8574afcc934c2fa4cc6709c82280697e34474b41f711801afa` |

Die dauerhafte Fence-Vorlage ersetzt ausschließlich den eigenen Helper durch die feste Verweigerung `DEV_HTTP_ID_ALLOCATOR_FENCED_FORWARD_REPAIR_REQUIRED`. Sie erhält die eigene Sequenz, bereits reservierte IDs, sämtliche Historie und den Queue-Trigger. Sie kehrt nicht zum rückständigen Altgenerator zurück. Ihre Aktivierung ist ein eigener konkreter künftiger Schritt, der nicht durch einen bestandenen ROLLBACK-Test bereits ausgeführt wäre.

**Betriebsgrenzen:** Der Fence stoppt nur neue erfasste Inserts in `origin`/`local`. Bereits eingereihte Requests werden nicht gelöscht oder storniert und können nach Ende der Queue-Sperre weiterlaufen. Der Katalogassert erkennt die Helperänderung bei seinem Aufruf; die öffentliche Alarmantwort wird über den periodischen Audit fortgeschrieben. Eine sofortige öffentliche Sperrwirkung unmittelbar mit Fence-COMMIT ist nicht bewiesen. Ein späterer Wiederöffnungsweg muss vorwärtsgerichtet und als geprüfter Schutzfolger erfolgen; keine Historylöschung oder Nummernwiederverwendung.

## 9. Durabilität und nicht behauptete Garantien

Die eigene LOGGED-Sequenz vermeidet den ausdrücklich dokumentierten UNLOGGED-Resetmechanismus für diesen neuen Generator. Der vorhandene Altdefault darf trotzdem weiter Werte verbrauchen; diese Werte sind nicht die vom neuen Trigger gespeicherten Queue-IDs. Kein Versuch setzt die alte Sequenz zurück, um Lücken zu verbergen.

PostgreSQL dokumentiert, dass `nextval` atomar verschiedene Werte vergibt, verbrauchte Werte bei Rollback aber nicht freigibt. `ALTER SEQUENCE … RESTART` ist im Unterschied dazu transaktional. Bei nicht committeden Sequenzverwendungen darf aus einem Crash nicht auf eine garantierte außerhalb der Datenbank beobachtbare Identität geschlossen werden. In diesem System müssen externe Requests daher an tatsächlich committeden Queueeinträgen hängen. Die noch UNLOGGED Queue/Responses haben eigene Ausfallgrenzen. [Sequenzfunktionen](https://www.postgresql.org/docs/17/functions-sequence.html), [CREATE SEQUENCE](https://www.postgresql.org/docs/17/sql-createsequence.html), [ALTER SEQUENCE](https://www.postgresql.org/docs/17/sql-altersequence.html).

Nicht ausgeführt bzw. nicht durch R1–R4 bewiesen sind: echter Crash-/Failover-/Restoreversuch; realer Mehrsession-Lasttest; allgemeine Provider-Zusage zur Upgradebeständigkeit des benutzerdefinierten Queue-Triggers; uneingeschränkte Superuserabwehr; verlustfreie Zustellung bei Ausfall; positiver qualifizierter AT-Erneuerungspfad; irgendein Production-Gate. Natürliche neue Cron-Vollbelege und der normale HTTP-/Quellenwatch-Nachweis für Batch 105 sind inzwischen tatsächlich bestanden.

## 10. Quellenstand und CI bleiben eigenständig

Batch 99 bleibt ein tatsächlicher CHANGED-Batch mit drei echten HTTP-200-Antworten, zwei exakt unveränderten und einer geänderten Quelle. Die vorhandenen Originale bleiben `RESEARCH_ONLY`. Der reale Publisher-Negativtest hat zweimal null neue Fakten ergeben; er isoliert die Qualifikationsbarriere nicht. Die 71 historischen Fakten werden durch den neuen Nummerngeber nicht aktuell. Echte Besucher-RPC-Prüfungen für DE/PL/IT/RO/FR waren geschlossen mit „derzeit nicht verfügbar“.

Der frühere CI-Lauf 44904870027 enthielt Safety 21/21 und isolierte PG17-Fälle 11/11, insgesamt aber ein fehlgeschlagenes Hosted-Gate mit RPC-Timeout und Management-API-403. Nachfolgende Connector-PASS-Ergebnisse ändern diesen konkreten CI-Lauf nicht. Der bewusst gesperrte CI-Livejob erzeugt keine neuen Secret-/API-Aufrufe. Die Commit-spezifischen Actions-Ergebnisse sind getrennt von den nativen Hosted-Belegen zu bewerten; dieses Dokument nennt kein aktuelles Gesamtgrün. Die lokalen bestehenden Safety-Prüfungen wurden vor Abschluss mit **21/21 PASS** ausgeführt. Ein Anwendungsbuild wurde für diese Dev-SQL-/Belegänderung nicht ausgeführt; die App-Oberfläche blieb unverändert, die öffentliche BG1-Statusfunktion wurde gezielt an v8 angepasst. Allgemeine Production-Abnahmegates sind damit nicht erfüllt.

**Aktueller tatsächlicher Implementierungsnachweis:** [`d849a5f7852fb0654bba2c26401b8a55573c07db`](https://github.com/Jetnity/jetnity/commit/d849a5f7852fb0654bba2c26401b8a55573c07db), [CI44920650283](https://github.com/Jetnity/jetnity/actions/runs/44920650283): Safety und isolierter PG17-Rücknahme-/Concurrency-Job erfolgreich; gesperrter Livejob fehlgeschlagen, **Gesamt-CI FAIL**. [Exakte Jobzustände](evidence/official-truth-renewal-20261121/dev-owned-http-allocator-ci-44920650283.json). Die folgende reine Dokumentationsergänzung verändert keine ausgeführten SQL-Dateien.

## 11. Bytebindung der wesentlichen Skripte

Alle Pfade sind relativ zum vorgesehenen Dokumentationsordner. Die folgenden Hashes wurden für die vorhandenen Repo-Dateien gelesen; Änderungen erfordern eine neue Bindung und gegebenenfalls eine neue Ausführungsbewertung. Ein Dateihash allein ist kein Runtimebeleg.

| Artefakt unter `scripts/db/official-truth-chde-at-renewal-dev-20261121/` | SHA-256 | Tatsächlicher Status |
| --- | --- | --- |
| `dev-pgnet-owned-allocator-trigger-rehearsal.ROLLBACK.sql` | `001c623a1ee0ea8d10b07c83750788d8cb7916eb85ee4fd131fdf3a2d99168d7` | R1 Hosted PASS |
| `dev-pgnet-owned-allocator-netapi-webhook-rehearsal.ROLLBACK.sql` | `7cc3cb95721340722fc6a09b77c79279c266fcee3abacb7ef5f2dc2973c5de78` | R2 Hosted PASS |
| `dev-pgnet-owned-allocator-assign-request-id-v1.SD.sql` | `7a2fba345aeccef648d0c37a0092cc923a47e3e21557a98e0acc338c607a5c29` | Exakter gemeinsamer Helperinhalt |
| `dev-pgnet-owned-allocator-v8.REHEARSAL-ROLLBACK.sql` | `d6704599d71ca654f7a8ef1c2864ebf8f75a3a52462b83573ec4992575c76ac4` | Korrigiertes R3 Hosted PASS |
| `dev-pgnet-owned-allocator-v8.INSTALL-DEV-COMMIT.sql` | `714f088aed89d2910c503e1b2d2c615ac894a7ea27b81c51581511809bbb51f2` | Tatsächlich auf Dev installiert |
| `dev-pgnet-owned-allocator-fence.DEV-ROLLBACK-20261121.sql` | `0ee88537be935ac78010a7cbb518dae08000e33744b64e48e221d8ba20a930f2` | Nach Installations-COMMIT tatsächlich bestandene R4-Sperrprobe; Ergebnis im Manifest gebunden |
| `dev-pgnet-owned-allocator-v8.INDEPENDENT-READBACK.sql` | `f47305d75856c05392dd805c615369273dccf90ba1c5e829aebb1409fe44469a` | Tatsächlicher abschließender Nach-v8-/Cron-/Batch-105-HTTP-/Watch-Nachweis PASS |
| `dev-pgnet-owned-allocator-fence.DEV-COMMIT-READY-20261121.sql` | `0ab3a8cb7895a64e08963a5e6dbcb6aeb4a87a5971350ccf9e1636f7e52ff496` | Exakt an gelesene Live-Pins gebundene Sperrdatei, **nicht ausgeführt** |
| `dev-pgnet-owned-allocator-fence.PINS-READONLY.sql` | `1713156c814ca4a97ae0e8f024d54a823f7b6b04801d11078695e45c7b174ec6` | Feste Lesevorlage für die Live-Pins |
| `dev-pgnet-owned-allocator-fence.CANDIDATE-ROLLBACK.sql` | `5497bf4c27bc78c73aaccd8e44ad0134d8f513c4627437822623cd372528a496` | Ungepinnte historische Vorlage; nicht der ausgeführte R4-Byteinhalt |
| `dev-pgnet-owned-allocator-fence.CANDIDATE-DEV-COMMIT.sql` | `97b0f9013c348872555e41975776380eb6f085f9adc2b136bf7b174ea439bc46` | Ungepinnte Vorlage, keine behauptete Fence-Aktivierung |

Das [Liefermanifest](evidence/official-truth-renewal-20261121/dev-owned-http-allocator-manifest-20261121.json) erfasst auch die tatsächlich fehlgeschlagenen Originalversionen, aktuelle strukturierte Ergebnissammlung, unabhängigen Readbacks und die gepinnte, nicht ausgeführte Fence-COMMIT-Datei. Der ursprüngliche R3-Inhalt mit SHA **59f8c0a3e89c3c218e0783d893816aa057d288525ca38263c40beb33d7ceb63f** bleibt als eigener nativer Fehlerbeleg erhalten. Die Korrektur ersetzt diesen historischen Beleg nicht.

## 12. Verbleibende Entscheidung

Die beauftragte Dev-HTTP-ID-Reparatur ist installiert und mit echten Rücknahmen, normalen Cronläufen und drei tatsächlichen neuen HTTP-/Quellenwatch-Bindungen belegt. Das [Production-Prüfpaket](OFFICIAL_TRUTH_PRODUCTION_REVIEW_PACKAGE_2026-11-21.md) liegt mit diesen Ergebnissen zur Prüfung vor. Positive fachliche Erneuerung bleibt gesondert offen, bis Originale und Regelbindungen qualifiziert sind. Production bleibt ohne gesondertes Go unangetastet. Support ist für diesen Dev-Reparaturweg nicht erforderlich und wurde nicht kontaktiert. Die alten Originale, Quittungen, Fehler und Sequenzlücken bleiben erhalten.
