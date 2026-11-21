# Production HTTP-ID – Rehearsal-Ergebnis vom 22.11.2026

## Entscheidung: Installation derzeit nicht freigabereif

Der einmalige Auftrag **PROD_HTTP_ALLOCATOR_REHEARSAL_20261122** wurde nach der ausdrücklichen Klarstellung zur negativen Publisher-Probe begonnen und beim ersten Datenbankfehler beendet. **Datei10 wurde genau einmal aufgerufen; Datei11 wurde nicht ausgeführt.** Es gab keinen Retry, Zusatzread oder alternativen Ausführungsweg. Der Auftrag ist damit abgeschlossen und darf nicht erneut benutzt werden.

Der tatsächliche Serverfehler lautet:

```text
ERROR: 42501: permission denied for table job
```

Der Connector kennzeichnete die Antwort als Fehler (`isError=true`; transportseitiger Code `INVALID_ARGUMENT`). Der PostgreSQL-SQLSTATE42501 stammt ausdrücklich aus der zurückgegebenen Servermeldung. Es wurde keine erfolgreiche Ergebniszeile geliefert.

## Exakter Umfang und Zeit

| Gegenstand | Tatsächlicher Befund |
| --- | --- |
| Ziel | `qscbgcdmivbbnzrcyegn` |
| Genehmigter Paketcommit | `07b1d9993ea9559e2009f9e889b5cc6bb932303f` |
| Manifest-SHA-256 | `887d334381d48513a16b611450459f64586e11733a1d70dc98e43378641f0e67` |
| Datei10-SHA-256 | `286bd06250739d91476f286ac6fa668d7e662244c81064b2172599d3230c7457` |
| Nicht ausgeführte Datei11-SHA-256 | `4a0f90f485c5241c9532994c0260659dcfeb4f3e86165232ffa003a31a0621f2` |
| Aufruffenster Zürich | 22.11.2026,00:45:22.355–00:46:05.967 |
| Aufruffenster UTC | 21.11.2026,23:45:22.355–23:46:05.967Z |
| Gesamtfenster | 43.612ms; eigentlicher Connectoraufruf43.069ms |
| Ausgaben | 239Bytes vollständige rohe Connectorantwort; keine Erfolgszeile |
| Tatsächliche Versuche | genau1; zulässiger Höchstwert2, zweite Datei nur nach vollständigem Erfolg der ersten |

Die101.801Bytes der Datei10, die24.857Bytes der Datei11 und die19.172Bytes des Manifests wurden unmittelbar davor gegen ihre vollständigen SHA-Werte und den genehmigten Commit geprüft. Sie wurden nicht verändert. Der bereits früher protokollierte Umfangswiderspruch war durch Sasas ausdrückliche Zulassung der negativen `renew_ch_v1()`-Probe mit Sollwert0 geklärt. Dieser ältere Vorprüfbeleg bleibt erhalten und ist kein ausgeführter früherer Versuch.

Die festgelegten25s Statementtimeout,90s Transaktionstimeout,30s Idle-Timeout und2s Locktimeout waren unverändert Bestandteil von Datei10. Das gesamte Aufruffenster lag unter den erlaubten fünf Minuten; die Fehlerantwort unter65.536Bytes. Aus dem gemessenen Connectorfenster wird keine einzelne SQL-Statementdauer abgeleitet.

[Originaler Ausführungsbeleg](evidence/official-truth-production-http-allocator-rehearsal-20261122/execution.json), [vor dem Aufruf gesicherte Absicht](evidence/official-truth-production-http-allocator-rehearsal-20261122/authorization-and-intent.json) und [unabhängige Ergebnisprüfung](evidence/official-truth-production-http-allocator-rehearsal-20261122/independent-execution-review.json) sind getrennt abgelegt.

## Fehlerauswertung: plausible Sperrrechte-Lücke, keine erfundene Ausführungsstufe

Die unveränderte Datei10 verlangt als erste direkte Operation auf der betroffenen Cronrelation:

```sql
LOCK TABLE cron.job IN SHARE MODE NOWAIT;
```

Diese Anweisung steht in Zeile169 vor der ersten temporären DDL in Zeile171 und vor dem eigenen Schema in Zeile450. Die davor aufgerufenen, über ihre exakten Hashes zugeordneten Guard-/Statusdefinitionen greifen nach der lokalen Quellprüfung nicht auf `cron.job` zu. Damit ist die verweigerte SHARE-Sperre die **sehr plausible Fehlerstelle**.

Die [PostgreSQL-17-Dokumentation zu LOCK, Abschnitt Notes](https://www.postgresql.org/docs/17/sql-lock.html) erklärt den Rechteunterschied: SELECT allein genügt für ACCESS SHARE. Für den hier angeforderten SHARE-Modus ist MAINTAIN, UPDATE, DELETE oder TRUNCATE erforderlich. Eine frühere erfolgreiche Metadatenlesung belegt daher kein ausreichendes Sperrrecht. Die konkreten aktuellen Cron-Tabellenrechte wurden in diesem Auftrag nicht zusätzlich gelesen.

Die Fehlerantwort nennt allerdings **keinen Statementkontext und keine Schema-/Zeilenangabe**. Spätere geschützte Snapshot-Prüfungen lesen ebenfalls `cron.job`. Deshalb wird nicht behauptet, die genaue Ausführungszeile oder ein Abbruch vor jeder DDL sei tatsächlich beobachtet. Diese Grenze bleibt auch nach dem lokalen Gegencheck bestehen. [Strukturierte Auswertung](evidence/official-truth-production-http-allocator-rehearsal-20261122/interpretation.json).

## Was nicht bestanden oder beobachtet wurde

Der Fehler ist **kein** bestandener negativer Publisher-Test. Ein tatsächlicher Rückgabewert0 wurde nicht bestätigt. Ebenso fehlen der erfolgreiche Rehearsal-Verdict und der vollständig bestätigte ROLLBACK-Abschluss. Weil Datei10 nicht vollständig erfolgreich war, war Datei11 nach dem Auftrag nicht mehr zulässig. Beide Restnutzungen sind im Journal auf0 gesetzt; ein separater Diagnose- oder Nachleseaufruf wurde nicht ausgeführt.

Es wurde keine COMMIT-, Installations- oder Fence-Datei aufgerufen, kein Recht erweitert und kein Owner-/Login-/2FA-/Secret-/Kosten-/Veröffentlichungsschritt vorgenommen. Datei10 enthält ausschließlich die freigegebene zurückzunehmende Probe und keinen COMMIT; der SQL-Fehler liefert keinen Installationsnachweis. Eine separate aktuelle vollständige Wiederherstellungsbestätigung wird nicht vorgetäuscht. Auch ein aktueller BG1-Status, ein tatsächlicher HTTP-Betriebsnachweis oder eine positive AT-Erneuerung ist aus diesem Fehler nicht ableitbar.

## Separat vorgelegte Installationsentscheidung

**NO-GO für Installation.** Die Voraussetzung „echte erfolgreiche10-Rehearsal plus unabhängige11-Rücklesung“ ist nicht erfüllt. Dateien20/30/40/50 bleiben unausgeführt und ohne Ausführungsfreigabe. Auch die unveränderte Datei10 darf aus diesem verbrauchten Einmal-Go nicht erneut aufgerufen werden.

Vor einem neuen Production-Versuch muss der Cron-Metadatenschutz einen unterstützten Weg mit den normalen vorhandenen Rechten erhalten oder eine erforderliche Rechteänderung separat begründet und freigegeben werden. Der Schutz darf nicht bloß entfernt und der Fehler dadurch verdeckt werden. Eine Korrektur gehört zunächst in die bestehende Dev-Prüfung; daraus entsteht ein neuer überprüfter SQL-/Manifeststand und erst danach ein neuer enger Rehearsal-Auftrag. In diesem Fehlerauswertungsschritt wurde keine solche Korrektur ausgeführt oder getestet.

Originale, bisherige Belege, genehmigte SQLs und Manifeste bleiben unverändert. Abgelaufene Angaben bleiben **„derzeit nicht verfügbar“**.
