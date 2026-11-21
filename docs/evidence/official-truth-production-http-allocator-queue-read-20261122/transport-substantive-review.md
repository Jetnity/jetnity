# Substantieller Transportreview vom 22.11.2026

**15/15 Body-/Symbolhashes und 15/15 vollständige Definitionshashes sind aufgeklärt.** Vierzehn vollständige Definitionen passen unmittelbar zu offiziellen bzw. Repository-Quellen. Die Providerfunktion hat einen ausdrücklich dokumentierten abweichenden festen Suchpfad. Dies ist ein statischer Quellen-/Hashreview, kein Runtime-PASS und keine Writer-Freigabe.

## Beleg und Methode

Einziger Production-Read: separat durch Root ausgeführte 02; beobachtet 2026-11-21T23:06:49.362212+00:00. Eingangsdatei execution.json, SHA256 4a65f43570b8f3a12a9d65ed7452106bb888ad2374b821eb1d4aad1b1adfe7cd. Native Transport-SHA256: 60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f. Für diesen Review gab es keine weiteren Projekt-/DB-Aufrufe.

[Offizielle pg_net-0.19.5-SQL](https://github.com/supabase/pg_net/blob/a7792bfd913c7859e14025d606624982706c2a7f/sql/pg_net.sql): Commit a7792bfd913c7859e14025d606624982706c2a7f, lokal bereits bytegesichert. Sieben PL/pgSQL-Bodies und fünf C-Symbolnamen wurden exakt gehasht. Vollständige Definitionen wurden anhand der [PostgreSQL-17-Implementierung](https://api.github.com/repos/postgres/postgres/git/blobs/2d3625c9b7089af6787a8ae05a3d29aa2bebd590) ausschließlich als Text rekonstruiert. Das JSON enthält jede Definition vollständig sowie alle SHA- und Quellenbindungen. Kein Parser oder PostgreSQL-Server wurde gestartet.

## Vollständiger Funktionsvergleich

| Funktion | Body/Symbol | vollständiger Definitionshash |
|---|---|---|
| extensions.grant_pg_net_access() | exakt | exakt |
| jetnity_prod_import_scheduler.tick_v1() | exakt | exakt |
| net._await_response(bigint) | exakt | exakt |
| net._encode_url_with_params_array(text,text[]) | exakt | exakt |
| net._http_collect_response(bigint,boolean) | exakt | exakt |
| net._urlencode_string(character varying) | exakt | exakt |
| net.check_worker_is_up() | exakt | exakt |
| net.http_collect_response(bigint,boolean) | exakt | exakt |
| net.http_delete(text,jsonb,jsonb,integer,jsonb) | exakt | exakt |
| net.http_get(text,jsonb,jsonb,integer) | exakt | exakt |
| net.http_post(text,jsonb,jsonb,jsonb,integer) | exakt | exakt |
| net.wait_until_running() | exakt | exakt |
| net.wake() | exakt | exakt |
| net.worker_restart() | exakt | exakt |
| official_v3_at_production_private.enqueue_v1() | exakt | exakt |

Die drei HTTP-APIs schreiben in die echte Queue, übernehmen RETURNING id, wecken den Worker und geben dieselbe ID zurück. URL-/Response-Helfer verändern keine Request-ID. Die C-Bindungen bestätigen Bibliotheks-/Symboldeklarationen, keine geladenen Binärbytes. Restart-, Warte- und Wake-Funktionen wurden nicht aufgerufen.

Der Scheduler aus scripts/db/official-truth-v3-production-import-schedule-1/core.sql speichert den unveränderten HTTP-Rückgabewert in dispatches_v1.net_request_id. Sein vollständiger Hash bestätigt das ursprüngliche lock_timeout=2s, nicht den späteren 150-ms-Kandidaten. Der AT-Installer scripts/db/official-truth-at-production-stage1/install.sql speichert net.http_get direkt in watch_requests_v1.request_id. Beide Bodies und Definitionen passen exakt.

## Providerfunktion: Headerabweichung offen ausgewiesen

extensions.grant_pg_net_access() hat denselben Body wie die [offizielle Supabase-Migration](https://github.com/supabase/postgres/blob/c85422318302fae317c8eb25d47b9abc810d61f0/migrations/db/migrations/20261016000001_search_path_for_supa_functions.sql) am Commit c85422318302fae317c8eb25d47b9abc810d61f0. Body-SHA256: 754e58111dbe32030af4d91591dfd78cb3cf8e8f4f56a5fcc199bb0cf7f4ac2b. Git-Blob 286eb69867014d90a69033f76b59fe09825fadfe wurde aus den erhaltenen Bytes nachgerechnet.

Upstream setzt search_path auf pg_catalog, pg_temp. Die beobachtete native Definition ist SECURITY INVOKER mit SET search_path TO ''. Genau diese vollständige Textdefinition ergibt e38c4060751c9695123350596f1cb0d0c943015f3267a2a455d8efe02c711184. Das ist keine Behauptung einer unverändert installierten öffentlichen Migration; Urheber und Zeitpunkt der Headeränderung sind unbekannt. Eine Providerreparatur wird nicht vorgeschlagen.

Diese Event-Triggerfunktion erzeugt keine HTTP-Anfrage. Sie prüft pg_net-Extension-DDL, erteilt bedingte Rollen-/Schema-/Funktionsrechte und enthält API-Änderungen nur für die feste ältere Versionsliste bis 0.11.0. Die beobachtete 0.19.5 ist davon ausgenommen. Kein Queue-INSERT, nextval, setval oder HTTP-Aufruf steht im Body. Seine API-Namen erklären die Aufnahme ins textbasierte Consumer-Inventar. Die tatsächlich installierte Eventtrigger-Tagregistrierung wurde durch 02 nicht separat ausgegeben und ist hier nicht als gelesen bestätigt.

## Queue und Domain

Beobachtet sind method net.http_method NOT NULL und nullable headers jsonb, exakt wie offizielles 0.19.5-DDL. Diese beiden falschen historischen Sollannahmen erklären den ursprünglichen Shape-STOP; die übrigen Spalten und Defaults passen. Die Method-Domain hat Typform d, Basis-OID 25/text, ist selbst nullable und besitzt genau ein validiertes CHECK.

Der source-abgeleitete native Ausdruck lautet:

```sql
CHECK (((VALUE ~~* 'get'::text) OR (VALUE ~~* 'post'::text) OR (VALUE ~~* 'delete'::text)))
```

SHA256 412b54e60167a01e5fe4856c3ed5cbf862b912b2f3ba01bce4a8661c5ba915de stimmt exakt mit dem beobachteten Definitionshash überein. Der Constraint-Kataloghash 63ece7f25171a578daae026a9e5501f99fbbf3e9677452ab470248e13f3ad856 ist eine beobachtete Identitätsbindung, kein aus Upstream unabhängig herleitbarer Kataloghash. Historische Readflags werden nicht überschrieben.

**Der native Transportdigest enthält die Spaltentyp-OID, aber nicht die vollständige Domain-pg_type-Zeile und nicht die contypid-Constraints.** Der geschützte Nachfolger muss Domainform, Basistyp, NULL-Eigenschaft und CHECK-Metadaten deshalb separat binden.

## Noch erforderliche Gates

Keiner der 15 Body-/Definitionshashes bleibt ungeklärt. Das beweist weder die geladenen C-Binärbytes noch Production-Trigger-/Rollback-Ausführung, neue natürliche HTTP-/Response-Zuordnung oder Crash/Neustart/Failover. Die frühere Worker-Quellenprüfung bleibt separat in docs/evidence/official-truth-production-http-allocator-20261121/pg-net-0.19.5-transport-source-review.json.

Writer-Go, tatsächlich aktuelle BG1-/Query-Cost-Kette, zusätzliche Domainbindung und vorgesehene native Prüfungen bleiben erforderlich. Alte Dateien, Originale und Belege wurden nicht geändert. AT bleibt RESEARCH_ONLY/unqualifiziert; abgelaufene Daten bleiben „derzeit nicht verfügbar“. Dieser Review begründet keine positive Erneuerung.
