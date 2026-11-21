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
