# Verwaisten Profile-Cron stilllegen – 22.11.2026

## Freigegebene Fortsetzung nach dem UI-Release – 22.11.2026

Der Owner hat nach dem Merge von #1272 zuerst den unveränderten aktuellen
Main-Stand als Production-Release beauftragt und **danach die Fertigstellung
und den Merge von #1276 wie geplant freigegeben**. #1240 ist seit
**11:00:05 Zürich** auf `601fc38c0924b176ee1c83dedb4e42797787b15d` gemergt,
#1272 seit **11:47:41 Zürich** auf
`0ca0fb2fa3e371bfa754d4caaf074d23f2921aae`. Der frühere Reihenfolge-HOLD ist
damit für genau diesen Profilauftrag erfüllt.

Der separat gebaute Production-Build
`dpl_9qZpzGfPhrd5GarGrT9JnLMSvreF` verwendet exakt diesen Main-Stand und
wurde um **12:13:07 Zürich** auf `jetnity.com` und `www.jetnity.com`
promotet. Sein [echter Main-Push 45014153993](https://github.com/Jetnity/jetnity/actions/runs/45014153993)
bestand **12/12 Jobs** im ersten Versuch, Hosted-main **280/280**.
Öffentliche HTTP- und Browser-Rücklesung bestätigten die neuen Einstiegstexte,
den Mint-Hintergrund, vier unveränderte CMS-Inhalte und geladene Bilder sowie
das Loginformular mit sichtbarem Passkey-Button. Eine Anmeldung wurde nicht
ausgeführt. Die vorherige Production
`dpl_7vqNXqqYehgCU2FMgKN7Kbg61DKF` / `601fc38c` ist das Rückrollziel
dieses UI-Releases. Es gab keine Environment-, Supabase-Projekt- oder
Auth-Einstellungsänderung; die automatische Domain-Zuordnung bleibt aus.

**Profil-Paket: Integration freigegeben, PRODUCTION UNAPPLIED.**
Die sechs SQL-/Composer-/Runner-/Testdateien bleiben bytegenau auf dem bereits
unabhängig geprüften Stand `814c3cb81fd5b9ff06c9e88898c51dbcc58d09d6`.
Nur dieses Protokoll und der Gesamtstand erhalten neue datierte Evidence;
der Passkey-Nachtrag aus Main bleibt vollständig erhalten. Die alten
17 lokalen Native-Fälle sind historische Abnahme, keine neue Testausführung.
Die vollständige CI des resultierenden integrierten Heads ist weiterhin
vor dem normalen SHA-gebundenen Merge erforderlich.

Die erste neue READ-ONLY-Vorprüfung um **12:15:44 Zürich** bestätigt das
explizit adressierte Production-Projekt `qscbgcdmivbbnzrcyegn`, den
unveränderten aktiven Zieljob 1, sechs Cron-Zeilen, fehlende Legacy-Funktion
und die erwarteten Rollen-/C-API-/Extension-/RLS-/Trigger-/Rule-Bindungen.
Sie ist eine Integrationsvorprüfung; der Composer erhält erst nach dem Merge
einen **erneut frisch gelesenen** vollständigen Cron-Digest.

Eine ergänzende reine Kataloglesung um **12:16:40 Zürich** fand weiterhin
54 private Guard-Funktionen. Neben dem bekannten Kommentar in `audit_v1`
liest der aktuell gelesene `catalog_status_v1` ausdrücklich nur die
fünf benannten Official-Truth-/AT-/CH-DE-Crons. Der Profiljob gehört nicht
zu dieser Auswahl; die Funktion enthält weder seinen Namen noch die alte
Profilfunktion. Keine Guard-Funktion wurde aufgerufen oder geändert.

Der vorgesehene anschliessende Operationsschritt bleibt ausschliesslich
`active=true → false` für den vorhandenen Profiljob 1 mit dem unveränderten
geprüften Paket und separater frischer Rücklesung. Der Merge selbst führt
kein SQL aus. Neue CI-, Merge- und dauerhafte Production-Ergebnisse werden
mit Head, Lauf, Zeitpunkt und Fremdjob-Digest in
[#1276](https://github.com/Jetnity/jetnity/pull/1276) fortgeschrieben;
sie werden in diesem Vor-Merge-Checkpoint nicht vorweggenommen.

### Bestehende Vierstundenbeobachtung: aufgezeichneter Abschluss

Die schon vorher eingerichtete Einmalautomation ist abgeschlossen und
deaktiviert; ihr aufgezeichneter Lauf endete am **22.11., 04:21:23 Zürich**.
Die Ausgabe beschreibt das SQL-Fenster **00:15–04:20 Zürich** ohne Neustart,
Statistikreset oder Deadlock, mit 6 → 4 von maximal 90 Verbindungen.
Eine dort nicht zugeordnete Abfrage hatte 50 Aufrufe, durchschnittlich 4,6 s
und rund 306 MB temporäre Schreib-I/O. Das ist keine neue Root-Messung
und wird hier keiner Funktion nachträglich zugeschrieben.
Aktueller RAM-/Swap-Verlauf fehlte der Automation wegen fehlenden
Dashboard-Zugriffs; eine dauerhafte RAM-Zusage für Small bleibt daher offen.
Es wurde keine neue Automation oder Production-Messinfrastruktur angelegt.
Die älteren Messungen und damals noch zukünftigen Termine darunter bleiben
ausdrücklich historische Evidence ihres jeweiligen Zeitpunkts.

## Historischer Erststand: lokal und unabhängig geprüft, Production UNAPPLIED

Der Owner priorisiert zunächst die rote Main-CI `44957188431` und ihren Fix
#1275. **Danach erfolgt hier kein weiterer Merge, bevor sowohl #1240 als auch
#1272 gemergt sind.** #1275 ist regulär auf
`73bfa7dbbeb24c87fc6442f7c253487bef91b43f` gemergt; der tatsächliche
[Main-Push-Lauf 44965505093](https://github.com/Jetnity/jetnity/actions/runs/44965505093)
bestand am 22.11.2026 um **01:41:18 Europe/Zurich** vollständig im ersten
Versuch: **12/12 CI-Jobs erfolgreich**, Hosted-main **280/280**, 0 Fehler und
0 Skips. Der zuvor fehlerhafte Atomic-Test bestand in 65,147 s mit allen
40 Vektoren und drei vollständigen History-Scans. Die CI-Reparatur ist damit
abgeschlossen; die geprüfte Main-Basis dieses Profil-Pakets steht fest.
Root hat das vollständige Paket unabhängig geprüft: **PASS**. Bis zur
eigenen CI-Abnahme bleibt der Profil-PR ein zurückgehaltener Kandidat;
Production ist unverändert.
Nach Veröffentlichung darf der eigene PR vollständig geprüft werden; sein
Merge und die Production-Anwendung warten weiterhin auf **beide** fremden PRs.
Dieser Checkpoint gehört zum eingereichten Paket. Spätere CI-, Merge- und
Production-Readback-Ergebnisse werden in der Beschreibung desselben PRs mit
konkretem Commit, Lauf und Zeitstempel fortgeschrieben; sie sind hier nicht
vorweggenommen.

Die konkret fehlenden Relation-/Extension-/RLS-/Trigger-/Rule-Bindungen sind
ergänzt und gegen den von Root am **22.11.2026, 00:46:17 Europe/Zurich** frisch
gelesenen Production-Katalog abgeglichen. Ein echter lokaler Operationslauf hat
zusätzlich den bisherigen ungültigen Cast `'c'::reglanguage` entdeckt; dieser
wird jetzt korrekt über `pg_language.oid` aufgelöst. Kein Hosted-Versuch wurde
als Syntaxprobe verwendet.

Der vollständige native Operationskörper, beide READ-ONLY-SQLs und die
Refusals sind mit echtem PostgreSQL 17.12 und der unveränderten Upstream-
pg_cron-v1.6.4-C-Extension geprüft: **17 Fälle bestanden**, vollständiger
Zeilen-/Katalogzustand nach Rollback wiederhergestellt. Zwei Composer-Tests
bestanden ohne Skips; die eigenständige Typprüfung des Native-Runners bestand.
Die native Abnahme ist lokal und ersetzt weder PR-CI noch
Production-Rücklesung. Ein echter Zweitsession-Test bleibt unbelegt: Bereits
das Erstellen eines lokalen Unix-Sockets scheitert in dieser Umgebung mit
`EPERM`; keine Rechteerweiterung oder Ausweichverbindung.

Es gibt keinen generischen Dev-Mutationspfad mehr. Der Composer akzeptiert nur
das eigene lokale Testcluster und die explizite Production-Zielkennung; keine
Dev-Jobs werden angelegt oder verändert. Im eigenen Single-User-Testcluster
kann kein Scheduler laufen, `cron.launch_active_jobs=off` bleibt gesetzt.

## Auftrag, Zuständigkeit und tatsächlicher Stand

Der aktuelle Owner-Auftrag erlaubt die Profil-Cron-Korrektur über einen eigenen
PR, grüne CI und normalen Merge nach der obigen Reihenfolge. Login, 2FA,
Passkeys, zusätzliche Kosten und Official Truth/BG1 bleiben unverändert.
Der AT-/HTTP-ID-Schritt bleibt beim Hauptplan 97.

Dieses Paket ist **VORBEREITET / LOKAL GEPRÜFT / PRODUCTION UNAPPLIED**.
Branch: `fix/obsolete-profile-cron-20261122`. Der lokale Dateistand basiert auf
dem geprüften Main-Merge von #1275 (Tree
`ff6e4968b29a498def4a3a6935c02faa930fbe19`); die Veröffentlichung verwendet
dessen tatsächlichen Commit `73bfa7dbbeb24c87fc6442f7c253487bef91b43f` als Parent.
Root verantwortet nach unabhängigem Review Veröffentlichung, CI-Abnahme,
normalen Merge und die eng begrenzte Production-Ausführung. Es wird kein
Cursor beauftragt.

## Nachgewiesene Ursache und engster Eingriff

Der lesende Production-Check vom 21.11.2026 um 23:11:13 UTC bestätigt:
`sync_profile_emails_hourly` ist Job 1, aktiv, `@hourly`, Datenbank und Benutzer
`postgres`, Node `localhost:5432`. Der Command ist bytegenau
` select public.sync_creator_profile_core(); ` einschließlich der beiden
äußeren Leerzeichen. Die Funktion fehlt; der Lauf meldet
`function public.sync_creator_profile_core() does not exist`.

Die Funktion wurde bereits mit
`supabase/migrations/20260817120300_generisches_profil.sql` bewusst entfernt.
Sie und `sync_creator_profile_emails()` waren alte Batchfassungen ohne
Anwendungsaufrufer. Der heutige Insert-Trigger
`profiles_kerndaten_aus_auth` bleibt unverändert. Das ist kein Nachweis einer
allgemeinen Synchronisation späterer Auth-E-Mail-Änderungen.

Der einzige geplante persistente Eingriff ist `active=true` → `active=false`
genau dieses vorhandenen Jobs mittels der bestehenden `cron.alter_job`-API.
Job-ID, Schedule, Command, Datenbank, Benutzer und Job-Verlauf bleiben erhalten.
Kein UNSCHEDULE, kein neuer Job, keine neue oder wiederhergestellte Funktion,
keine Profildaten-, Trigger-, Rechte-, Auth- oder Guard-Änderung.
Das ältere `production-cron-owner-UNAPPLIED.sql` bleibt historische Quelle und
wird weder geändert noch zusammen mit diesem Paket ausgeführt.

## Sicherheits- und Transaktionsplan

Die Operation verlangt eine explizite Local-/Production-Zielkennung,
`postgres` als Sitzung und aktuelle Rolle, die Datenbank `postgres`, den frisch
gelesenen Digest sämtlicher sichtbarer Cron-Zeilen und die vollständige oben
genannte Metadatenform. Sie verweigert eine wieder vorhandene Legacy-Funktion,
einen abweichenden Job und eine wiederholte Stilllegung.

Production besitzt nur SELECT auf `cron.job`, jedoch EXECUTE auf die echte,
von `supabase_admin` besessene C-Funktion `cron.alter_job`. Es werden keine
direkten UPDATE-Rechte ergänzt und keine unzulässige Tabellen-Schreibsperre
verlangt. SERIALIZABLE mit kurzen lokalen Statement-/Lock-Fristen verhindert
den Update eines seit dem Transaktionssnapshot konkurrierend geänderten
Zieljobs; es gibt keinen automatischen Retry. Diese Garantie folgt aus
PostgreSQLs Isolation und ist hier mangels Sockets nicht zusätzlich durch zwei
reale Sitzungen gemessen. Kein Advisory-Lock wird als Schutz gegen fremde
Writer ausgegeben. Die zugrunde liegende Garantie ist in der
[PostgreSQL-17-Dokumentation zur Transaktionsisolation](https://www.postgresql.org/docs/17/transaction-iso.html#XACT-REPEATABLE-READ)
und [Serializable-Isolation](https://www.postgresql.org/docs/17/transaction-iso.html#XACT-SERIALIZABLE)
beschrieben; die eng begrenzte Job-Deaktivierung verwendet die
[bestehende Supabase-Cron-API](https://supabase.com/docs/guides/cron/quickstart#activatedeactivate-a-job).

Vor und nach dem API-Aufruf wird der vollständige Cron-Snapshot verglichen:
zulässig ist ausschließlich das einzelne `active`-Feld. Der Vergleich beschreibt
den eigenen Transaktionssnapshot und die eigene Schreibwirkung; parallele
unabhängige Änderungen anderer Jobs sowie spätere Änderungen werden damit
nicht ausgeschlossen. Root liest Fremdjob-Fingerprints nach dem Commit frisch
zurück und ordnet etwaigen externen Drift getrennt ein. Die Anwendung und
Rücklesung ersetzen keinen globalen Cron- oder Official-Truth-Release.

Ein weiterer begrenzter Nur-Lese-Katalogabgleich am **22.11.2026,
01:11:29 Europe/Zurich** untersuchte die 54 vorhandenen privaten Guard-
Funktionskörper auf Scheduler-/Profiljob-Referenzen. Der einzige Treffer war
ein Kommentar in `audit_v1`; es wurde kein Guard aufgerufen oder verändert.
Damit ist keine direkte Bindung des verwaisten Profiljob-Datensatzes in diesen
Funktionskörpern gefunden. Der vorgeschriebene frische Cron-Readback bleibt
unabhängig davon erforderlich.

Vor dem API-Aufruf werden zusätzlich die tatsächliche Provider-Tabelle
(`supabase_admin`, gewöhnlich/persistent, RLS an, FORCE aus, Mitglied von
`pg_cron`), **genau ein** aktivierter Standard-Statement-Trigger
`cron_job_cache_invalidate` (`tgtype=60`, keine Argumente oder Bedingung,
unveränderte C-Funktion des Extension-Owners) und **null** Rewrite-Regeln
verlangt. `session_replication_role=origin` bleibt erforderlich. Eine fremde
Triggerfunktion darf nicht andere Tabellen verändern, während ein bloßer
Cron-Zeilendigest gleich aussieht.

Die Zielkennung ist eine explizite Bedien- und Paketbindung, kein aus der
Datenbank abgeleiteter Nachweis der Supabase-Projekt-ID. Root muss die
ausführende Verbindung weiterhin ausdrücklich an `qscbgcdmivbbnzrcyegn`
binden; der SQL-Körper akzeptiert keine Verbindung.

## Tatsächliche lokale Abnahme und verbleibende Grenzen

`scripts/db/profile-cron-recovery-20261122/native-proof.ts` nimmt ausdrücklich
einen lokalen Asset-Prefix aus `JETNITY_PROFILE_CRON_PG_PREFIX`, lehnt
Verbindungsargumente ab und erzeugt ausschließlich ein neues, eigenes
temporäres Cluster. Es lädt die echte C-Extension, setzt `postgres` dort als
Nicht-Superuser mit SELECT-only-Zugang ein und verwendet den unveränderten
Operationskörper des Composers. Keine Fake-`alter_job`-Funktion und kein
ausgetauschtes Production-SQL.

Die **17 bestandenen Fälle** umfassen beide vollständigen READ-ONLY-Abfragen,
den tatsächlichen Deaktivierungs-Commit, Wiederholungsablehnung, expliziten
Rollback, folgenloses ROLLBACK-Rehearsal sowie Verweigerungen bei falschem
Digest, Superuser, falscher Isolation, direktem UPDATE-Recht, wieder vorhandener
Legacy-Funktion, abweichendem Command, Tabellenowner, FORCE RLS, deaktiviertem
Cache-Trigger, fremdem Trigger und fremder Rewrite-Regel. Bei den beiden
letzten Fällen blieb eine zusätzliche lokale Wirkungstabelle leer. Bei allen
Negativfällen blieb der vollständige erfasste Zustand gleich. Nach der
Rücknahme sind alle ursprünglichen Job-Zeilen sowie die geprüften Tabellen-/
Funktions-ACLs und Rollen-, Funktions-, Trigger-, Policy- und Rule-Metadaten
unverändert. Der Lauf des eingecheckbaren Runners endete am **22.11.2026,
00:50:55 Europe/Zurich** erfolgreich.

Die getesteten Assets stammen von Upstream-Tag `v1.6.4`, Commit
`9490f9cc9803f75105f2f7d89839a998f011f8d8`; die native Bibliothek hat SHA-256
`22590dba71b3c303771c9500900edc5163d3763938ede8f4ddcc667caaa34088`.
Upstream deklariert weiterhin SQL-Extension-Version `1.6`, während das tatsächlich
gelesene Supabase-Paket `1.6.4` meldet. Beide Kennungen bleiben unverändert und
werden im jeweiligen Ziel ausdrücklich geprüft. Der Runner gibt gemessene
PostgreSQL-/Extension-Version, Bibliotheksdigest und alle Ergebnisse aus.

Reproduktion vom Repository-Root, mit dem vorhandenen lokalen Asset-Verzeichnis
als absolutem Prefix (enthält `usr/lib/postgresql/17/bin` und die Extension):

```sh
JETNITY_PROFILE_CRON_PG_PREFIX=/absoluter/lokaler/prefix node --import tsx scripts/db/profile-cron-recovery-20261122/native-proof.ts
node --import tsx --test lib/admin/profile-cron-recovery-20261122.test.ts
```

Der eingeschränkte Rollback reaktiviert den weiterhin fehlerhaften Altjob und
ist eine technische Rücknahme, keine Fehlerbehebung. Root darf ihn nur gegen
den konkret bestätigten deaktivierten Snapshot und mit expliziter Bestätigung
erzeugen. Echte Konkurrenz zweier Sessions, tatsächliches Scheduler-Verhalten
und Production-Anwendung sind **nicht** durch diesen lokalen Lauf belegt.

Die vorhandene CI und ihre unveränderten Pflichtprüfungen bleiben verbindlich.
Dieses Paket ändert keine Workflow-Datei und keine Official-Truth-/BG1-Pins.
Der Native-Runner ist manuell ausführbar; es wird keine bereits erfolgte
CI-Ausführung dieses Pakets behauptet. Grüne CI ersetzt keinen unabhängigen
Root-Review.

## AT-Fehler: ausdrücklich fremder Arbeitsbereich

Der AT-Enqueue-Job meldet eine UNIQUE-Verletzung bei wiederverwendeten
`request_id`-Werten 41/40. Hauptplan 97 untersucht genau diese HTTP-ID-Ursache.
Dieser Job ist nicht obsolet und wird hier weder deaktiviert noch geändert.
Keine AT-Daten, Quellen, HTTP-Queue, Sequenz oder Official-Truth-/BG1-Funktion
wird durch dieses Paket geschrieben.

## Small-Beobachtung

**Alle Zeiten dieses Abschnitts: Europe/Zurich.** Für die Speicherprüfung
wurde keine neue Production-Infrastruktur angelegt. Der alte Chat speicherte
eine Baseline und erstellte am **22.11., 00:17:44** ausschließlich die
ChatGPT-Einmalautomation **«Jetnity Small Speicherprüfung»**, ID
`Automation_dac8d6ded8588191bc61edde384e96a9`, für **22.11., 04:17:23**. Sie soll
vorhandene Statistiken und den bestehenden Supabase-Metrikverlauf lesen.
Um 00:42 Uhr war noch kein ausgeführter Automationslauf aufgezeichnet.

Das lesende Production-Inventar um **00:41:55** fand genau sechs alte
Cron-Jobs (IDs **1, 2, 4, 5, 6, 7**), keinen Speicher-Cron und keine für diese
Beobachtung angelegte Speicher-Tabelle oder Speicher-Funktion. Letzte
Migrationskennung blieb `bg1_query_cost_release_20261121`; der Profiljob 1 war
weiterhin aktiv. Die Automation ist keine fortlaufende Polling-Installation.

Um **00:43** zeigte das Dashboard **Small / Healthy, 37 % RAM, 2 % CPU und
6 von 90 Verbindungen**. Der Datenbankstart blieb **21.11., 21:25:51**,
also kein neuer Neustart seit dem freigegebenen Upgrade. Der
[Dreistundenbericht 21:42–00:42](https://supabase.com/dashboard/project/qscbgcdmivbbnzrcyegn/observability/database?its=2026-11-21T20%3A42%3A45.048Z&ite=2026-11-21T23%3A42%3A45.048Z&isHelper=true&helperText=Last+3+hours)
zeigte 1,10 GB Memory und 1,41 GB Commitment mit Warnung, CPU 1,51 % sowie Swap
optisch nahe null. Keine numerischen RAM-Peaks wurden daraus abgeleitet.

Die exakt vergleichbaren PostgreSQL-Statistikdeltas reichen erst von
**00:15:03 bis 00:43:28**, also **28,42 Minuten**. Gleicher Statistikreset,
keine Eviction (`dealloc=0`) und identische Query-Identitäten wurden geprüft.
Der dominante bestehende BG1-Audit hatte sechs Aufrufe mit zusammen 27,2985 s
Ausführungszeit (durchschnittlich 4,55 s) und rund 35,02 MiB temporärer I/O.
Das ist weder eine CPU-Prozentmessung noch ein Nachweis seines Peak-RAMs.
Dieser Befund wird ausschließlich Hauptplan 97 zugeordnet; keine Änderung.

**Vorläufiges Urteil:** Small reicht für die bisher beobachtete geringe Last;
ein Speicherengpass ist nicht nachgewiesen. Die Commitment-Warnung bleibt im
Blick und die Vierstunden-Auswertung steht noch aus. Keine Kapazitätszusage
für spätere Last, kein weiteres Upgrade, keine neuen Kosten oder Einstellungen.
