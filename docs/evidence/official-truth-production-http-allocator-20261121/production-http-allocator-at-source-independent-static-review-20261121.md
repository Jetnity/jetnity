# Unabhängiger Offline-Review: Production HTTP-Allocator und AT-Quellenschutz

**Stand:** 21. November 2026 · **Reviewer:** `/root/at_source_guard`  
**Ergebnis:** Im unten gepinnten Dateistand wurde kein zusätzlicher konkreter Blocker gefunden. Das Paket bleibt **vorbereitet, nicht ausgeführt und wegen fehlender unabhängiger Bindungen gesperrt**. Dieser Review ist weder ein PostgreSQL-Parser-/Laufzeit-PASS noch eine Ausführungsfreigabe.

## AT-Quellenschutz

Der neue `renew_ch_v1()`-Body enthält ausschließlich einen vorgeschalteten Qualifikations- und Originalidentitätsblock. Der bisherige Publisher bleibt dahinter bytegleich, einschließlich der Sperre nach einer tatsächlich geänderten Quelle. Die neue Barriere verlangt drei eindeutige Pins und Originale, ausdrücklich positive Rechts-/Kundenfreigaben, ausdrücklich ausgeschlossenen Research-only-Status sowie die Bindung von source_id, Originalhash und Bytezahl einschließlich frisch berechnetem Body-Hash. Die Flagprüfungen verwenden `IS DISTINCT FROM` und lassen NULL nicht als Zustimmung durch.

Der versionierte Production-Installer erzwingt die derzeit negative Qualifikation sogar durch NOT-NULL-/CHECK-Constraints: `research_only=true`, `source_qualified=false`, `legal_source_approved=false` und `customer_rule_approved=false`. Hash und Bytezahl der Originale sind generierte Spalten. Diese Schranken, Originale und die bestehenden Fakten werden vom neuen Paket nicht geändert. Daher kann die Transportreparatur keinen positiven AT-Erneuerungsnachweis liefern. Abgelaufene Daten bleiben „derzeit nicht verfügbar“.

Der vorhandene Catch-all mit Rückgabewert 0 bleibt bestehen. Eine 0 allein ist deshalb weder positive Erneuerungsevidenz noch eine instrumentierte Bestätigung eines einzelnen Zweigs. Der vorbereitete native Probeaufruf wird zusätzlich mit vollständig unveränderten geschützten Daten und Zählern verglichen; **er wurde in diesem Review nicht ausgeführt**.

Die letzte geprüfte Ergänzung verlangt bereits vor der Installation, dass kein AT-Fakt mehr unexpired ist. Dadurch darf wieder verfügbare BG1-Integrität keine inzwischen frisch gewordenen, weiterhin unqualifizierten Altfakten sichtbar machen. Diese eine zusätzliche Bedingung ist das gesamte SQL-Delta zum zuvor geprüften Stand; Guard-, Publisher- und Helperbodies bleiben unverändert.

## Production-Kette und ID-Vertrag

Die neue Baseline hängt an der tatsächlich belegten Production-v3-Kette. Acht Originalfunktions-Quellbodies, die zugehörigen Quelldateihashes und nativen V2-Definitionshashes wurden unabhängig byteweise verglichen und stimmen überein. Im alten Katalog sind nur fünf Definitionsänderungen erlaubt: Katalog, Assert, Open-Gate, öffentlicher Alarmstatus und AT-Publisher. Audit, Control, Retirements, Owner-Historie, alte Baselines und Zustandsdaten bleiben erhalten. Die neue Generation und der neue früheste Beweiszeitpunkt verlangen einen späteren vollständigen Nachweis.

Der globale Queue-Lock und die festen NOWAIT-Historiensperren kommen vor den veränderlichen Zähler-/MAX-Lesungen. Der erste neue Wert liegt oberhalb des größten gesperrten Legacy-/Vier-Pfade-Werts, mit 1.024 reservierten ungenutzten Nummern. Die bekannte Zahl 211 ist lediglich eine Untergrenze. Die neue Sequenz ist LOGGED, postgres-eigen und privat. Der eng begrenzte SECURITY-DEFINER-Helper hat einen festen Suchpfad, vollständig qualifizierte Typen/Funktionen und exakte Triggerbedingungen. Er ersetzt jede eingehende ID im gewöhnlichen BEFORE INSERT. Die vorhandenen net-API-Definitionen und der verwaltete Default/Eigentümer bleiben unverändert.

Der bereits gespeicherte Primärquellenbeleg zu **pg_net v0.19.5, Commit a7792bfd913c7859e14025d606624982706c2a7f**, belegt im veröffentlichten Worker die Weitergabe von Queue-ID über CurlData-ID zur Response-ID. Der gespeicherte PostgreSQL-17-Beleg erklärt `RETURNING` nach einer Zeilenänderung durch den Trigger. Hier wurden nur diese vorhandenen Belege und ihre Hashes gelesen. Das bestätigt keinen gehosteten Binärstand, Production-Lauf, Crash oder Failover. Die Zusage gilt für gewöhnliche origin/local-INSERTs; replica, direkte ID-UPDATEs und feindliche Eigentümer-/Adminänderungen sind ausdrücklich ausgeschlossen.

Die inzwischen versionierten drei nativen net-API-Definitionen wurden zusätzlich unabhängig nachgerechnet: vollständige Definitions- und Bodyhashes stimmen jeweils mit dem tatsächlichen V2-Beleg überein. Alle drei APIs lesen die Queue-ID über `INSERT ... RETURNING id`; diese vorhandenen verwalteten Definitionen werden nicht installiert oder verändert.

## Rücknahme und Sperre nach Commit

Vor Commit prüft Datei 10 reale INSERT-RETURNING-Werte mit expliziten Eingangs-IDs. Dadurch wird der alte Default-Zähler nicht aufgerufen. Sie ruft weder net.http_* noch net.wake auf. Eigener Sequenzneustart, exakt begrenztes Entfernen des uncommitteten Helpers/Triggers, Driftverweigerung und Unveränderlichkeit liegen hinter Savepoints; anschließend wird die ganze Installation auf den zuvor gesperrten Originalzustand zurückgerollt.

Datei 20 hat denselben Installationspräfix, aber keine Queue-/Zählerproben. Sie verlangt vor Commit eine noch unaufgerufene neue Sequenz. Eine Ergebniszeile vor COMMIT wird ausdrücklich nicht als erfolgreicher COMMIT ausgegeben.

Nach Commit ist die Rücknahme eine **Sperre neuer erfasster INSERTs**, kein Rücksprung auf den alten Zähler: 30/40 ändern nur den eigenen Helper zur festen Exception. Die committed Sequenz, schon ausgegebenen IDs, Originale, Journal- und Owner-Historie sowie die Baseline bleiben bestehen. Ein expliziter Test-INSERT muss mit der genauen Fence-Exception scheitern; der echte Katalog-Assert muss die Definitionsabweichung verweigern. Datei 30 stellt den Helper anschließend wieder her, Datei 40 committet die Sperre. Bereits vorhandene Queue-Einträge dürfen weiterhin ausgeliefert werden. Der öffentliche Alarm wird nicht als sofort umgeschaltet behauptet; natürliche Beobachtung und eine spätere überprüfte Vorwärtsreparatur bleiben nötig.

## Verbleibende Gates

- `native_transport_sha256` bleibt NULL. 10/20 stoppen damit vor TEMP-Objekten und DDL. Erst ein gesondert freigegebener, fachlich geprüfter 01-Read kann eine konkrete Bindung liefern; unbekannte Producer-Definitionen bleiben STOP.
- Der tatsächlich committed v4-Digest für 30/40 bleibt NULL. Er darf erst aus dem späteren unabhängigen Commit-Readback gebunden werden.
- Native Production-Rehearsal, unabhängiger 11-Readback, Installation und Fence brauchen jeweils den ausdrücklich passenden Scope und tatsächliche Laufzeitbelege.
- 11 bestätigt die alte Kette und Objektabwesenheit; vollständige Daten-/Zählergleichheit gehört zum gesperrten 10-Vorher-/Nachherbeleg. Natürlicher Fortschritt zwischen Transaktionen wird nicht als Abweichung erfunden.
- 50 prüft die neue Katalogbindung und meldet `fresh_complete_state_run_count` sowie `public_guard_status`. Der Ergebnisname „OBSERVED“ ist selbst kein PASS; die Anzahl kann 0 sein. Die Abnahme verlangt den passenden aktuellen Status und genau einen gebundenen frischen vollständigen Run. Ein zusätzlicher natürlicher Cronbeleg über `cron.job_run_details` und ein realer AT-Response-/Journalbeleg bleiben offen; positive Quellenqualifikation ist ebenfalls nicht nachgewiesen.

## Exakter geprüfter SQL-Stand

| Datei | SHA-256 |
| --- | --- |
| 00-at-enqueue-diagnosis.READONLY.sql | `d3b3a83fd36e295978b2e670549a3bce9132402ec7ca81764b95b16a39392397` |
| 01-required-bindings.READONLY.sql | `688def1ae033992cc9f36ea26145722bd869dfe1db971e86c00b231b7aa10ce5` |
| 10-production-http-id.REHEARSAL-ROLLBACK.sql | `fd2d4f68c38a70b57fa758b80b6d17dc5267e9b085808dab92fc3e4132929a93` |
| 11-production-http-id.POSTREHEARSAL-READONLY.sql | `ad09339c8e64a55867a97edb2ebe20ba8c66429edf92c77f273c4896bc378f2f` |
| 20-production-http-id.INSTALL-COMMIT.sql | `2072474ac1b356f8dbd1e324a68d1d7646359611926086b964b40190a9063921` |
| 30-production-http-id.FENCE-ROLLBACK.sql | `0d52a4c1696fd57d727d2c50c4622f7a35e606cd83a266609d08417dd02f3818` |
| 40-production-http-id.FENCE-COMMIT.sql | `6a2e85ee20693cef589fe68dcc8c1ffa4f4f5b703f2a0ccaf66dcb7a1dbec9e3` |
| 50-production-http-id.POSTCOMMIT-READONLY.sql | `abb899e6d17b871f37af5a4532fd1021ffd55f799c9d10f6bba25727fcb04941` |

Der maschinenlesbare Begleitbeleg enthält zusätzlich alle Herkunfts-/Manifesthashes, begrenzten Feststellungen und offenen Gates. Es wurden nur diese beiden Reviewdateien geschrieben; keine SQL-/Anwendungsdatei, kein Datenbankzustand, keine Git-Refs, Commits oder Stagingbereiche wurden verändert.
