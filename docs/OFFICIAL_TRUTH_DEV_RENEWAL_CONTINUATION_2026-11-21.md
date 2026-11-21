# Official Truth – Dev-Fortsetzung nach Owner-Abschluss, 21.11.2026

## Auftrag und unveränderte Grenzen

Fortsetzung von Hauptplan 96 auf dem vorhandenen Branch
`fix/official-truth-chde-at-renewal-dev-20261121`, Ausgangshead
`b378c39bdb1d0fdc43af61ee1d0bc3261af97749`.
Zuerst wurde die Gesamtstanddatei auf `main` gelesen. Der Owner meldete den
geschützten Abschluss des abgelaufenen Dev-Quellenversuchs am 21.11. um
13:17 Uhr Europe/Zurich einschließlich getrennter UI-Lesebestätigung.
Das ist zunächst eine Owner-Beobachtung, keine in dieser Fortsetzung bereits
erfolgreich wiederholte Datenbankprüfung.

Root ist alleiniger Repository-Writer und führt die Integration aus.
Unabhängige ChatGPT-Reviewer: `verify_dev_receipts`, `at_source_guard`,
`sequence_renewal_review`; keine Cursor-Sitzung und keine Fremd-PR-Änderung.
Reviewer dürfen weder Ready setzen noch mergen oder Folgeaufgaben starten.
Dev ist genehmigt; Production-Writes, Kosten, Login und 2FA brauchen Owner-Go.
Die drei offenen PRs #1240/#1264/#1265 bleiben unberührt; kein vierter PR.

## Kleinster Umsetzungsschritt

1. Den gespeicherten Cycle5-Abschluss, sechs Vorgängerbelege, Originalbytes,
   15/53-Jobhistorie, BG1-v7 und ursprüngliche Rollenmitgliedschaft unabhängig
   mit `dev-cycle5-independent-readback.READONLY.sql` nachlesen.
2. Den wirklichen AT-Publisher bei einem echten frischen Quellenbatch zweimal
   in einer rückrollbaren Transaktion aufrufen. Ein positives Ergebnis ist
   wegen drei unqualifizierter Originale verboten. Fakten, Originale und
   ID-Folge müssen unverändert bleiben.
3. Den bislang nicht installierten Production-Sequenzentwurf korrigieren:
   zuerst den globalen Sequenzlock erwerben, erst danach Werte und Historie
   mit frischem READ-COMMITTED-Snapshot lesen. CACHE 1, INCREMENT 1, NO CYCLE,
   Wertebereich und geschützte normale AT-v4-Baseline bleiben Pflicht.
4. Rückrollen sowohl für bereits benutzte als auch unbenutzte Sequenzen
   tatsächlich nachweisen und parallele Sitzungen in isoliertem PG17 testen.
5. Erst auf diesen Belegen den separaten Production-Ausführungs- und
   Rückfallplan zur Prüfung vervollständigen. Abgelaufen bleibt unavailable.

Keine neue Anwendungsschnittstelle, keine Änderung an Reisegraph oder UI,
keine neue Datenbankrolle und kein neuer Schlüssel. Die neuen SQL-Prüfdateien
enden mit ROLLBACK. Der Production-Kandidat bleibt UNINSTALLED/ROLLBACK-only.
Das lokale Mehrsitzungsfixture darf ausschließlich im ausdrücklich benannten
ephemeren CI-Datenbankdienst laufen, niemals in Supabase.

## Unabhängig gefundene Lücken

- Der alte Production-Kandidat las `last_value` vor `ALTER SEQUENCE`. Ein
  fremder pg_net-Produzent konnte zwischenzeitlich IDs reservieren. Der
  AT-Advisory-Lock allein schützt solche Produzenten nicht.
- Der bisherige TEMP-Sequenztest zeigte vorwärts laufende Werte, aber keinen
  Vergleich nach `ROLLBACK TO SAVEPOINT`. Beide Zustände werden jetzt geprüft.
- Der alte AT-Negativtest rief nur seine selbst erzeugte TEMP-Funktion auf.
  Er ist weiterhin ein historischer Protokolltest und kein Nachweis des
  installierten Publishers. Dessen `EXCEPTION WHEN OTHERS RETURN 0` macht
  einen READ-ONLY-Aufruf ungeeignet: FOR SHARE würde scheitern und könnte als
  erfolgreiche Ablehnung fehlgedeutet werden. Der neue funktionale Test
  prüft alle vorherigen Gates und den wirklichen aktuellen Quellenbatch.
- `official_v3_guard_confirm_v1()` ist ein Lesevorgang. Der historische Klick
  erzeugt keinen zweiten Bestätigungsdatensatz. Die spätere unabhängige
  Rücklesung bestätigt den gespeicherten Abschluss, nicht den damaligen Klick.

## Belegte Ausgangsprüfungen und Zugriffsgrenze

- GitHub [44902670456](https://github.com/Jetnity/jetnity/actions/runs/44902670456):
  success auf b378c39b, **ein** Safety-Job, sieben erfolgreiche Schritte.
  Lokal dieselben **12/12** Offline-Sicherheitsverträge bestanden. Das ist
  ausdrücklich kein vollständiger Hosted-/12-Job-Endtest.
- Supabase-Branchinventar: `develop`, Projektref `yfvbxvijcorffwxbxahl`,
  Branch-ID `74809331-0243-493a-8c14-20bb78c015f5`, ACTIVE_HEALTHY.
  `get_project` findet Branches nicht; das ist keine fehlende Dev-Umgebung.
- Mehrere rein lesende Connector-Abfragen scheiterten beim Verbindungsaufbau
  mit `Connection terminated due to connection timeout`; kein SQL-PASS.
  Health-Advisory lieferte keine Warnung, Security-/Performance-Advisory
  scheiterten am gleichen Verbindungsproblem. Aggregierte Postgres-Logs im
  geprüften Fenster enthalten nur LOG/00000, keine belegte Fehlerursache.
- Die lokale Browseranbindung hat keinen originating browser context.
  Der Cloud-Browser zeigt eine Supabase-Anmeldeseite. Keine Anmeldung,
  keine 2FA, kein Wiederholen des Owner-Abschlusses und kein DB-Write.

Ein eng gebundener zusätzlicher CI-Leseweg darf den **vorhandenen**
`SUPABASE_ACCESS_TOKEN` im bestehenden Repository verwenden: feste Dev-Ref,
fest gepinnte READ-ONLY-Datei, Management-API `read_only:true`, keine frei
eingebbare Query/URL, keine Weiterleitung von Authorization und keine
Secret-/Original-/Personendaten in Ausgabe. 401/403/Timeout sind STOP,
keine neue Rechtefreigabe oder Token-Erstellung. Nur aggregierte Prüffelder.

## Quellen der technischen Entscheidung

- [PostgreSQL 17 ALTER SEQUENCE](https://www.postgresql.org/docs/17/sql-altersequence.html):
  RESTART ist transaktional, ALTER blockiert konkurrierende Sequenzzugriffe;
  vorgeladene Werte verlangen eine explizite CACHE-1-Prüfung.
- [Supabase Management API – Run a query](https://supabase.com/docs/reference/api/v1-run-a-query):
  fester Projektpfad, `query` und `read_only`.
- [Supabase pg_net](https://supabase.com/docs/guides/database/extensions/pg_net):
  asynchroner HTTP-Transport; ein erfolgreicher Aufruf ist noch kein
  geprüfter amtlicher Quellenbeleg oder rechtlicher Publikationsnachweis.

## Freigabestatus

**STOP – noch kein Production-Go anfordern.** Die tatsächliche erneute
Dev-Rücklesung, der echte frische Quellen-/Publisherlauf, die Mehrsitzungs-
und Rollbackbelege sowie aktuelle CI-Ergebnisse werden nach Ausführung
hier ergänzt. Keine vorweggenommene positive Erneuerung und kein Quelllauf.

## Tatsächlich ausgeführte CI-Prüfung – 21.11., 13:36 Uhr Zürich

[Lauf 44904622137](https://github.com/Jetnity/jetnity/actions/runs/44904622137)
auf `a78f9e97a44d76c51b231c74ac5699dce96c9312` hat drei getrennte Jobs:

- `safety`: **PASS, 21/21** Offline-Sicherheitsverträge.
- `native_sequence`: **PASS auf PostgreSQL 17.6**, wirklicher Savepoint-Rollback
  für benutzte und unbenutzte Sequenz einschließlich Historienvergleich sowie
  **11/11 Mehrsitzungsfälle**. Die alte Read-first-Variante erzeugt nachweislich
  eine Unique-Violation; die gelieferte Lock-first-Variante blockiert
  konkurrierende Produzenten und übernimmt bereits reservierte IDs korrekt.
  Kandidaten-SHA256 `c01e8bfe70684ff23357c003b2c27beb2be5fefde8c7040d7ca68b2e4aedbb2e`.
- `dev_readback`: **FAIL**. Der öffentliche Dev-Status antwortete innerhalb
  seiner festen Zehn-Sekunden-Grenze nicht (`alarm/timeout`). Die nachfolgende
  private Rücklesung wurde deshalb in diesem ersten Lauf **nicht ausgeführt**.
  Gesamt-CI bleibt rot; kein behaupteter Hosted-/Owner-Abschluss-PASS.

Das Originalartefakt `14707686236` wurde heruntergeladen und sein ZIP-SHA256
`6b4de23f9b7573d94136cad849c488d8d031f93ac138e841e34dc6c2dd839e6c` unabhängig geprüft.
Unveränderte Ergebnisse und Herkunft sind unter
[`docs/evidence/official-truth-renewal-20261121/run-44904622137/`](evidence/official-truth-renewal-20261121/run-44904622137/)
versioniert. Das isolierte Fixture ersetzt ausdrücklich keine echte
Dev-Publisherprüfung oder Production-spezifische Schutzkettenprüfung.

Der folgende Workflowstand lässt die **separate reine Management-API-Lesung**
auch nach einem öffentlichen Timeout zu Diagnosezwecken laufen. Ein Fehler
des öffentlichen Gates bleibt unverändert ein fehlgeschlagener Job; kein
`continue-on-error`, keine Abschwächung der SQL-Gates und kein Write-Fallback.

## Abschließender Zugriffsbeleg – 21.11., 13:38:56 Uhr Zürich

Der tatsächlich ausgeführte [Lauf 44904870027](https://github.com/Jetnity/jetnity/actions/runs/44904870027)
auf `1d08419470233a3663b949027b8ddd408425ef77` bestätigt erneut Safety
**21/21 PASS** und native PG17-Sequenzfälle **11/11 PASS**. Die Kandidatdatei
und ihr SHA256 sind unverändert; eine unabhängige Zweitbegutachtung hat die
Originalartefakte, alle Fälle und diese Bindung nochmals geprüft.

Die beiden wirklichen Dev-Lesewege sind nun getrennt belegt:

- Öffentlicher BG1-RPC: erneut `alarm/timeout` nach zehn Sekunden.
- Management API: feste Dev-Identitätsgates `projects/Dev = 404` und
  `branches/Dev = 200` bestanden; anschließend die gepinnte READ-ONLY-Abfrage
  mit **HTTP 403 abgewiesen**, Ausgabe `DEV_READBACK_STOP QUERY_HTTP_403`.
  Antwortkörper und Zugangsdaten wurden nicht ausgegeben. Kein Entfernen von
  `read_only`, keine Rechteausweitung und kein alternativer Token.

Der [strukturierte Befund](evidence/official-truth-renewal-20261121/run-44904870027.json)
ist dauerhaft versioniert. Damit bleibt die unabhängige Live-Bestätigung des
Owner-Abschlusses **OFFEN**; die beiden vorbereiteten echten AT-Lese-/Publisher-
Dateien wurden nicht ausgeführt. Das ist kein neuer fehlgeschlagener
Quellenlauf und kein Verlust der vom Owner gemeldeten Quittung.

**Keine automatische Wiederholung nach 403:** Der anschließende reine
Dokumentations-/Workflowstand führt keine weiteren Live-Abfragen aus. Sein
Hosted-Dev-Job bleibt ausdrücklich **FAIL/BLOCKED** mit fester Begründung;
Safety und native Sequenzprüfungen laufen unverändert. Die fertigen
Prüfskripte bleiben erhalten. Nach geklärtem Zugang müssen beide echten
Hosted-Prüfungen wieder eingesetzt und bestanden werden, bevor das Gate
jemals grün werden darf. Keine Produktionsfreigabe aus dem isolierten Test.

**Konkreter nächster geschützter Schritt:** Die vorhandene Cloud-Browserseite
für den festen Dev-SQL-Editor steht an Supabase Sign-in. Eine neue Anmeldung
oder gegebenenfalls 2FA braucht gemäß dem ausdrücklichen Owner-Auftrag sein
Go. Vor diesem Go wurde keine Authentifizierung begonnen. Auch ein solches
Go wäre ausschließlich Zugang für die noch offene Dev-Nachlesung und den
bereits vorbereiteten Dev-Test, keine Production-, Kosten- oder Quellenfreigabe.


## Owner-Anmeldung erledigt, lesende Nachprüfung technisch blockiert – 21.11., 13:57 Zürich

Der Owner hat die Dev-Anmeldung ausdrücklich freigegeben, selbst übernommen
und anschließend „angemeldet“ bestätigt. Eine frisch geöffnete Dev-Seite zeigt
den positiven angemeldeten Zustand **Jetnity / develop Preview** unter der
festen Projektref `yfvbxvijcorffwxbxahl`. Dieser Zugang ist jetzt belegt;
**keine weitere Anmeldung oder erneute Schließung des Quellenversuchs verlangen**.

Die unveränderte, nochmals unabhängig auf Spalten/JOINs und echte
READ-ONLY-Kompatibilität kontrollierte Datei
`dev-cycle5-independent-readback.READONLY.sql` (SHA256
`aa674ad533c9c99082aeb82c1255b1e53ab36654ca9ca6303a718c30235cab20`)
wurde im angemeldeten **Dev-SQL-Editor** mit `REPEATABLE READ READ ONLY` und
abschließendem `ROLLBACK` abgesetzt. Der Editor meldet:

> Failed to run sql query: Connection terminated due to connection timeout

Es gibt **kein erfolgreiches SQL-Ergebnis**, somit weiterhin keine neue
unabhängige 7/7-Quittungs-, Original-/Historien- oder BG1-Bestätigung.
Die Anmeldung hat diesen Verbindungsfehler nicht behoben. Die frühere
Management-API-Verweigerung HTTP 403 wird dadurch ebenfalls nicht aufgehoben.

Zusätzliche rein lesende Dev-Betriebsdiagnose, Fenster **12:48:00–12:55:46 UTC**:
Der vereinheitlichte Logstrom lieferte zwei `edge_logs`, beide mit HTTP **522**;
in diesem Fenster keine PostgreSQL-Logzeilen. Der Health Advisor lieferte
keine Lints. Das reicht nicht für eine konkrete Ursachenbehauptung und ist
kein Beleg einer gesunden Datenbankverbindung. Keine erneute SQL-Versuchsserie.

[Strukturierter Originalbefund](evidence/official-truth-renewal-20261121/dev-dashboard-readback-20261121T125739Z.json)
ist versioniert. Keine Jetnity-Owner-Mutation, kein Publisher-Aufruf, kein
Quellenlauf, kein Neustart, kein Reset und keine Konfigurations-/Schlüsseländerung.
Production wurde nicht aufgerufen. Nächster technischer Blocker ist die
**Dev-Datenbankverbindung**; das Live-Abnahmegate bleibt ausdrücklich gesperrt.
Die erfolgreiche persönliche Anmeldung bleibt als erledigter Schritt stehen.


## Erfolgreicher unabhängiger Dev-Readback – 21.11.2026, 14:09:20 Zürich

Der Owner meldete einen inzwischen vom separaten Arbeitsplan-Chat
ausgeführten Dev-Neustart und beauftragte ausdrücklich die erneute lesende
Nachprüfung. Diese Fortsetzung führte selbst keinen Neustart aus. Der
Supabase-Connector erreicht Dev wieder. Die **unveränderte gepinnte**
`dev-cycle5-independent-readback.READONLY.sql` wurde als
`REPEATABLE READ READ ONLY`/`ROLLBACK` erfolgreich ausgeführt.

**Tatsächlicher Befund um 13:09:20.108266 UTC / 14:09:20 Zürich:**

- `DEV_CYCLE5_RETIREMENT_AND_ARCHIVE_INDEPENDENT_READBACK_PASS`.
- Genau **ein** gespeicherter Cycle5-Abschluss vom **12:16:29.200648 UTC**
  (13:16:29 Zürich), sechs unveränderte Vorgänger und insgesamt **7/7**
  Retirement-Owner-Quittungen; exakter Receipt-/Digest-Zusammenhang.
- Geschlossener Auftrag, ursprüngliche **15 Starts / 53 Operationen**
  unverändert; originale Intake-Bytes exakt, **2/2** archivalische
  Originalbelege erneut mit tatsächlichen Bytes/Hashes bestätigt.
- **0** spätere Quellenstarts, Accepted Versions, öffentliche Projektionen,
  Ergebnisse oder Dispositionen zum zurückgezogenen Versuch.
- Originale einzige Jobs-Rollenmitgliedschaft und v7-Katalog exakt.
  **BG1 current**, Generation **2050**, Incident/Resume jeweils **14**.
  Der aktuelle echte natürliche vollständige Cron-Proof ist über
  `state_v1`, `runs_v1` und `cron.job_run_details` korreliert, Due
  **13:05 UTC / 14:05 Zürich**, genau ein passender Nachweis.

[Unverändertes Ergebnisaggregat mit Herkunft](evidence/official-truth-renewal-20261121/dev-cycle5-readback-20261121T130920Z.json).
Der gespeicherte Abschluss ist damit **jetzt unabhängig bestätigt**. Der
damalige gesonderte UI-Leseklick wird dadurch nicht rückwirkend bewiesen,
weil er keinen zweiten DB-Beleg anlegt. Kein erneuter Owner-Vorgang nötig.

Keine DB-Mutation, kein neuer Quellenlauf und kein Production-Zugriff.
**Offen bleiben** die tatsächliche frische AT-Quellen-/Publisherprüfung und
die getrennte CI-Management-API-Verweigerung HTTP 403; der erfolgreiche
Connector-Readback macht diese Prüfungen nicht automatisch grün. Die frühere
Zugriffsstörung und die erfolgreich erledigte Anmeldung bleiben als
Historie erhalten. Die Production-Ausführung bleibt ohne Owner-Go gesperrt.


## Echte AT-Erneuerungsprüfung und konkreter Sequenz-Blocker – 21.11.2026, 14:50 Zürich

Owner-Auftrag: echte AT-Erneuerungsprüfung in Dev, danach Production-Paket zur eigenen Prüfung; weiterhin kein Production-Go. Der reale frische Batch **99** (14:10 angefordert, 14:17 versiegelt) hat **2 unveränderte Quellen / 1 veränderte Quelle**. Alle drei archivierten Originale sind byte-/SHA-exakt und weiterhin unqualifiziert `RESEARCH_ONLY`. 71 historische Fakten sind sämtlich abgelaufen. Die geänderte BMEIA-Antwort hat 172428 statt 172460 Bytes; keine Schlussfolgerung auf eine bestimmte Rechtsänderung und keine Anpassung der Pins.

**Tatsächlich ausgeführter Publisher-Negativtest PASS:** `DEV_AT_REAL_CHANGED_BATCH_PUBLISHER_REFUSAL_ROLLBACK_PASS`, zwei Aufrufe des unveränderten installierten Publishers, beide **0 neue Fakten**, drei echte HTTP200-Antwortkörper über Zeitpunkt und SHA/Bytes an den realen Batch gebunden. Quellen-/Fakten-/Originalhistorie und Fact-ID-Sequenz unverändert; echter abschließender ROLLBACK. Diese Verweigerung wird vor der Research-only-Barriere ausgelöst: **kein isolierter Qualifikationsbeleg und keine positive Erneuerung**. Der vorbereitete ursprüngliche 3/3-unverändert-Test wurde deshalb nicht als bestanden ausgegeben.

Die tatsächliche HTTP-ID-Folge lag nach dem gemeldeten Neustart bei **20** hinter reservierten IDs bis **1800**; exakt **16** BIGINT-ID-Pfade inventarisiert. Die echte globale Sperr-/Savepoint-Probe scheiterte **am ersten ALTER SEQUENCE** mit **SQLSTATE 42501: must be owner of sequence http_request_queue_id_seq**. Eigentümer ist `supabase_admin`, effektive Owner-Berechtigung des Aufrufers `postgres` fehlt. Kein vorhandener legitimer Owner-Wrapper gefunden; keine Rollen-, Owner-, ACL- oder Sequenzänderung. **Kein Hosted-Rollback-PASS, kein COMMIT.** Die unverändert versuchte Originaldatei bleibt erhalten; zwei separat versionierte Folge-Kandidaten prüfen die Eigentümerberechtigung vor jeder temporären DDL und wurden nicht erneut ausgeführt. Die richtige bestehende Jobs-Mitgliedschaft ist `postgres` bei `ot_v3_jobs_owner`, Grantor `supabase_admin`; daraus folgt keine Mitgliedschaft bei `supabase_admin`.

**Unabhängiger Nachweis 13:50:24.415511 UTC / 14:50:24 Zürich:** BG1 `current`, unverändert 71 Fakten mit Historien-SHA `fefe812a3062bd05a84d08cc4d4ae71334cdee35f84df4c8f5eab3fca8bf2b38`, drei exakte Research-only-Originale. Die HTTP-Sequenz stand inzwischen auf **21 / called=true**; kein konstanter HTTP-Sequenzwert behauptet. Echte `anon`-Prüfung beider Besucher-RPCs für DE/PL/IT/RO/FR: **5/5 derzeit nicht verfügbar, 0 positive Auskunft**. Kein künstlicher Quellenlauf.

Der Live-Generator ist **UNLOGGED**. Eine einmalige Vorwärtskorrektur wäre kein Beleg dauerhafter Crashfestigkeit; genaue Neustartursache nicht bewiesen. Die vorhandene Management-CI-Verweigerung HTTP403 bleibt getrennt offen. Production wurde in diesem Schritt weder gelesen noch verändert.

[Abgeschlossenes Production-Reviewpaket mit Ausführungs-STOP](OFFICIAL_TRUTH_PRODUCTION_REVIEW_PACKAGE_2026-11-21.md), [vollständige echte Dev-Ergebnisse](evidence/official-truth-renewal-20261121/dev-at-real-renewal-20261121.json) und [exakte Datei-/SHA-Zuordnung](evidence/official-truth-renewal-20261121/dev-at-review-manifest-20261121.json). Kein erneuter Dev-Login oder Wiederholen des bestätigten Owner-Abschlusses gefordert.
