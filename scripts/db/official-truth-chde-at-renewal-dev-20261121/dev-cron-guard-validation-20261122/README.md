# Begrenzte native Dev-Prüfung der Cron-Korrektur

**Vorbereitet; ein grüner Lauf ist erst durch die getrennten tatsächlichen Ausführungsbelege belegt.** Ziel ist ausschließlich Dev `yfvbxvijcorffwxbxahl`. Die festgelegte API-Projektadresse und die zusätzlichen SQL-Prüfungen müssen zusammen stimmen; SQL authentifiziert keinen Supabase-Projektref.

## Was diese Prüfung abdeckt

Die bestehende Dev-Datenbank verwendet PG 17.6, pg_cron 1.6.4 und pg_net 0.20.4. Ihr vorhandener Allocator und BG1-v8-Nachfolger bleiben unverändert. Die abgelegten Produktionsmetadaten betreffen dagegen pg_net 0.19.5. Deshalb installiert dieser Test keinen Production-Nachfolger in Dev.

Der Test verwendet den vollständigen `cron-protection-core.sql` des neuen Kandidaten. Die einzige Textänderung ist die feste Ersetzung von `cron.job` durch `jetnity_dev_cron_guard_probe_20261122.jobs_v1`. Die fünf neuen Cronverträge, ihre Befehle, IDs und vollständigen Zeilenhashes sind an die tatsächlich gelesenen Production-Ergebnisse vom 22.11. gebunden. Diese Befehle werden als Zeichenketten in der eigenen Testtabelle gespeichert und niemals ausgeführt. Der Generator verifiziert zusätzlich, dass die neue dauerhafte `catalog_status_v1()`-Definition den exakt gleichen Cronausdruck enthält. Der gesamte Production-Katalog und der Installer werden dabei nicht auf Dev ausgeführt.

Auf der echten Dev-Tabelle `cron.job` werden ausschließlich Metadaten gelesen und `ACCESS SHARE` genommen. Die vorhandenen Rechte müssen weiterhin `SELECT=true` und `MAINTAIN/UPDATE/DELETE/TRUNCATE=false` sein. Kein Skript führt `GRANT`, `REVOKE`, `SET ROLE`, Rollen-/Eigentümeränderungen, Extensions-, Neustart-, Quellen-, Publisher-, Owner- oder HTTP-Aktionen aus. Beide bestehenden HTTP-Sequenzen werden ausschließlich gelesen.

## Feste Reihenfolge

| Datei | Tatsächliche Wirkung | Erfolgsgrenze |
| --- | --- | --- |
| `00-setup-private-fixture.DEV-COMMIT.sql` | Erzeugt exakt ein neues privates Schema und zwei Tabellen, prüft fünf vollständige Production-Zeilenhashes, speichert einen gehashten Vorher-Zustand. | Setup-Resultat und erfolgreicher COMMIT müssen vorliegen. Vorhandenes Schema führt zum Abbruch; kein Wiederverwenden. |
| `10-shared-core-rehearsal.DEV-ROLLBACK.sql` | 14 native Prüfgruppen mit positiver und negativer Ausführung des geteilten Kerns; alle Mutationen betreffen nur Fixture-/Temp-Objekte. | Jede Gruppe muss erfolgreich sein; abschließend ROLLBACK. Kein Überspringen. |
| `20-concurrent-writer.DEV-ROLLBACK.sql` | Zweite Sitzung hält einen tatsächlichen `RowExclusiveLock` und eine uncommittete Fixture-Änderung. | Muss die an den Reader-PID gebundene Bestätigung sehen; danach ROLLBACK. |
| `21-concurrent-reader.DEV-ROLLBACK.sql` | Parallel zu 20: hält `AccessShareLock`, beobachtet den gebundenen Writer und verlangt die native Ablehnung `PROD_HTTP_CRON_WRITER_OBSERVED`. | Nach beobachtetem Writer-Rollback müssen die ursprünglichen fünf Zeilen wieder exakt stimmen; danach ROLLBACK. |
| `30-cleanup-private-fixture.DEV-COMMIT.sql` | Entfernt nur die zwei bekannten eigenen Tabellen und das genaue eigene Schema, ohne CASCADE. | Entfernen erfolgt nur bei passenden Objekt-/Eigentümer-/Vorher-Prüfungen; erfolgreicher COMMIT und unabhängiges Nachlesen der Abwesenheit sind erforderlich. |

Root führt die SQL-Dateien aus. 20 und 21 werden gleichzeitig gestartet, beide Ergebnisse vollständig abgewartet. Anschließend wird 30 auch nach einem fehlgeschlagenen Test versucht. Ein unbekanntes Objekt, geänderter Kontext oder fremde Abhängigkeit erlaubt kein breiteres Löschen. Nach einem Fehler dürfen weder bestandene Tests behauptet noch SQL-Dateien unter gleicher Hashbindung still verändert werden. Die unabhängige abschließende READ-ONLY-Prüfung gehört als sechster Aufruf zum tatsächlichen Dev-Beleg.

Jede Transaktion ist auf 30 Sekunden begrenzt; Statements auf 20 Sekunden, Lock-Warten auf 800 ms. Die beiden Handshake-Warteabschnitte haben jeweils höchstens zehn Sekunden und prüfen tatsächliche `pg_locks`-Beobachtungen. `pg_sleep(0.025)` taktet ausschließlich die erneute Zustandsabfrage; verstrichene Zeit ist kein Erfolgsbeleg. Die Schlüssel `(771122,8101..8103)` dienen nur den beiden Fixture-Sitzungen. Setup, Rehearsal und Cleanup verweigern bei belegter konkurrierender Fixture-Sitzung die Fortsetzung.

## Native Prüfgruppen

1. Unveränderter vollständiger Snapshot und gültiger Capture bestehen.
2. Geänderter Befehl wird verweigert.
3. Geänderter Host wird verweigert.
4. Geänderter Aktivstatus wird verweigert.
5. Gelöschter relevanter Job wird verweigert.
6. Nach dem Snapshot hinzugefügter unbeteiligter Job wird über den vollständigen Snapshot erkannt.
7. Doppelter relevanter Jobname wird verweigert.
8. NULL-Befehl wird verweigert.
9. 129 Zeilen überschreiten die harte 128-Zeilen-Grenze.
10. Eine Zeile oberhalb 64 KiB überschreitet die Byte-Grenze.
11. UPDATE und Rückkehr zum alten Befehl ergeben den gleichen Konfigurationshash, aber andere Tuple-Versionen; die Prüfung verweigert.
12. Ein schon vor dem Snapshot vorhandener unbeteiligter Job bleibt zulässig und unverändert. Fünf relevante Jobs sind keine behauptete Gesamtzahl aller Jobs.
13. Nach der Validierung geänderte relevante Cronkonfiguration wird nicht in die Fixture-Baseline übernommen: ausschließlich die zuvor geprüfte Variable wird gespeichert; der spätere abweichende Capture wird verweigert.
14. NULL, fehlender Capture und Objekt-/Skalar-/NULL-/leere-Array-Verträge werden sicher verweigert.

Jede negative Mutation läuft in einer eigenen PL/pgSQL-Untertransaktion; nach deren Rücknahme muss der vollständige Fixture-Snapshot wieder exakt passen. Am Ende der Rehearsal müssen vorhandener Dev-Katalog, v8-Baseline, Rollen/Mitgliedschaften und explizite ACLs, echte Cronkonfiguration, Fakten, Originale, Publisher-/Allocator-Definitionen, Guardzustand sowie beide gelesenen Sequenzzustände gleich sein. Eigene temporäre Test-ACLs sind aus dem bestehenden ACL-Abbild ausgenommen. Für die Sequenzen werden explizit `last_value`, `log_cnt` und `is_called` gelesen; Sequenzen haben keinen Composite-Zeilentyp.

## Grenzen

`ACCESS SHARE` ist mit gewöhnlichen Cron-Schreibern vereinbar und blockiert nur `ACCESS EXCLUSIVE`. Es ist keine vollständige Cron-Schreibsperre. Der Kern prüft andere PIDs einschließlich wartender Writer und Transaktionen ohne PID, beobachtete Tuple-Versionen und die vollständigen begrenzten Konfigurations-Snapshots. Die tatsächliche Zwei-Sitzungs-Prüfung belegt den gehaltenen `RowExclusiveLock`-Fall; sie ist kein Lauf aller möglichen Lockmodi oder vorbereiteten Transaktionen.

Ein vollständig zwischen zwei Beobachtungen eingefügter und wieder gelöschter fremder Job oder eine Änderung nach dem letzten Check wird dadurch nicht rückwirkend sichtbar. Die unverändert gespeicherte validierte Baseline verhindert das ungeprüfte Einlernen einer späteren relevanten Änderung. Natürliche Zähler- und Guardfortschritte außerhalb der kurzen gesperrten Rehearsal sind nicht als durch diese Tests rückgängig gemacht oder verhindert dargestellt. Die positive AT-Quellenqualifikation und der positive Erneuerungspfad bleiben offen.

Die Rechte-/Lockaussagen folgen der offiziellen PG17-Dokumentation: [LOCK](https://www.postgresql.org/docs/17/sql-lock.html) und [Explicit Locking](https://www.postgresql.org/docs/17/explicit-locking.html). Diese Unterlagen ersetzen keinen tatsächlichen Dev-Ausführungsbeleg.
