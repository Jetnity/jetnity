# Dev-Recovery und Chrome-Nachtest – 21.11.2026

Diese Fortsetzung gehört ausschliesslich zum bestehenden Draft [#1265](https://github.com/Jetnity/jetnity/pull/1265). Der Owner erlaubt eigenständige Dev-Korrekturen einschliesslich notwendiger Rechteänderungen. Production, neue Kosten sowie Login/2FA bleiben beim Owner. Kein neuer PR, kein Merge, keine Kopplung an #1264 oder an eine BG1-Production-Installation.

## Exakte Vercel-Zuordnung für Work

Für **alle drei** Einträge gilt derselbe enge Scope:

- Projekt: `jetnity-app`
- Environment: `Preview`
- Git Branch: `fix/release1260-csp-ki-wetter-logout-cancel-dev-20261120`
- QA-Origin: `https://jetnity-app-git-fix-release1260-csp-ki-b917c2-jetnity-e1b93c82.vercel.app`

| Name | Massnahme im genannten Scope | Voraussetzung |
|---|---|---|
| `DISCOVERCARS_API_KEY` | Fehlenden Eintrag mit dem bereits genehmigten gültigen Dev-Schlüssel als Sensitive-Variable ergänzen. | Bestehender Zugang, keine Rotation, kein neuer Vertrag. |
| `OPENWEATHER_API_KEY` | Den dortigen ungültigen Platzhalter durch den bereits genehmigten gültigen Dev-Schlüssel als Sensitive-Variable ersetzen. | Bestehender Zugang, keine Rotation, kein neuer Vertrag. |
| `JETNITY_DISCOVERCARS_SEARCH_ENABLED` | Den nicht geheimen Funktionsschalter von `0` auf `1` setzen, sobald der zugehörige Dev-Zugang und sein bestehender Kostenrahmen bestätigt sind. | Ohne diesen Schalter bleibt die native Stationssuche auch mit Schlüssel geschlossen. |

Die beiden vorhandenen Sensitive-Einträge wurden im älteren Preview-Branch `feat/private-travel-ux-20261113` nachgewiesen. Das ist ein Existenzbeleg, kein Nachweis ihrer aktuellen Anbieter-Gültigkeit und kein lesbarer Secret-Export: versiegelte Werte dürfen weder aus Logs rekonstruiert noch in Chat/Git übertragen werden. Eine Zuordnung darf den alten Branch nicht verschieben oder alle Previews freischalten. Falls Vercel keine sichere Mehrfachzuordnung anbietet, sind die schon sicher verwahrten vorhandenen Dev-Werte im geschützten Formular erforderlich.

Für den Wettertest werden **keine** Google-Maps-Schlüssel, Map-ID, zusätzlichen Service-Role-Schlüssel oder neue Wetteranbieter benötigt. Login/Logout und Ortsbilder brauchen für diese Korrektur keinen neuen Schlüssel. Vercel-Environment-Änderungen erreichen einen schon gebauten Snapshot nicht rückwirkend; der spätere Dev-Nachtest muss deshalb eine Vorschau mit der aktualisierten Branch-Konfiguration verwenden. Daraus folgt keine Production-Freigabe.

## CI: konkrete Ursache und Korrektur

Die Auth-Konfiguration war im bisherigen Lauf erfolgreich. Die zwei Repository-/Core-Fehler entstanden aus einer veralteten Versionsbindung der zuvor geänderten `.github/workflows/ci.yml`: Der bestehende Source-Inventarwert und seine historische Nachfolgerkette enthielten die neue Einschränkung des **lebenden Dev-BG1-Alarms** noch nicht.

Die Korrektur aktualisiert genau diese Dateiidentität im AA-Inventar und ergänzt einen einzelnen überprüften Nachfolger im Pilot-Kontext. Alle historischen Identitäten bleiben erhalten. Der neue Nachfolger prüft den Vorgänger exakt sowie die tatsächlich vorhandenen BG1-Branchbedingungen; die vollständige Byte-/SHA-Bindung hält auch die Auth-Konfiguration unverändert fest. Auth- und Offline-BG1-Prüfungen bleiben auf jedem PR; nur der lebende Dev-BG1-Aufruf ist bereits im bestehenden Workflow an Nicht-PR-Läufe bzw. die benannten Präfixe `feat/official-truth-` und `fix/bg1-` gebunden. Die AA-Ausführungsfreigabe, Laufnummer und der erlaubte Research-Branch wurden nicht geändert.

Beim abschliessenden Versionsabgleich war dieselbe fachliche Pin-Korrektur bereits durch eine parallel arbeitende Lane in #1265 eingegangen. Diese Remote-Fassung wurde unabhängig geprüft und **unverändert übernommen**. Nur die redundante eigene lokale Variante wurde verworfen; es gibt keinen doppelten Nachfolger und kein Überschreiben fremder Arbeit. Der anschliessende eigene Commit ergänzt deshalb Dev-SQL, den reproduzierbaren engen Prüfnachweis und diese Dokumentation.

Beide betroffenen bestehenden Testdateien liefen lokal erfolgreich: sechs Tests, keine Fehler und keine übersprungenen Tests. Ein unabhängiger Diff-Review hat die Versionskette und den unveränderten übrigen Scope bestätigt. Das ersetzt nicht die vollständige CI auf dem abschliessenden PR-Stand.

## Wetter/BG1: tatsächlicher Dev-Zustand

Die Wetterinstallation hatte eine zusätzliche `pg_shdepend`-ACL-Abhängigkeit von `public.reisewetter_reservieren_v1()` an `authenticated` erzeugt. Der unveränderte alte BG1-Katalog verweigerte deshalb korrekt; es lag kein blosser Cron-Aussetzer vor. Die damaligen `require_open_v1()`-Aufrufe vor und nach der Installation kontrollierten den noch frischen **vorherigen** Prüfnachweis. Sie ersetzten keine vollständige Katalogprüfung der neu installierten Struktur. Deshalb verlangt die jetzige Korrektur ausdrücklich eine neue höhere Prüfgeneration nach der Installation, bevor sie eine Wiederaufnahme zulässt.

Während dieser Fortsetzung installierte die bereits aktive separate BG1-Lane um **02:21:49 Uhr Zürich** die Dev-Migration `bg1_dev_weather_acl_v4_with_at_legal_guard_20261121`. Sie bindet die genaue Wetterberechtigung additiv an den bisherigen Katalog und ergänzt zugleich den AT-Quellenqualifikationsschutz. Ein eigener, noch nicht angewandter v3-Reparaturentwurf dieser Fortsetzung wurde durch seine exakte Vorprüfung rechtzeitig verweigert und verworfen; er wurde weder installiert noch in diesen PR aufgenommen. Es gab dadurch keinen zweiten konkurrierenden DDL-Eingriff.

Read-only-Nachweis **02:28 Uhr Zürich**: v4-Katalog exakt, regulärer Fünfminuten-Komplettlauf ab **02:25 Uhr** erfolgreich, Prüfgeneration 1919. Der alte Vorfall war aber noch offen: `incident_generation=14`, `resumed_generation=13`, öffentlicher Guard `unavailable`. Ein vollständiger Prüflauf allein ist kein Wiederaufnahmebeleg. Der letzte echte Owner-Beleg gehört zu Generation 13. Es wurden keine Owner-Identität, JWT-Claims, AAL2-Sitzung oder Owner-Quittung nachgebildet.

### Begrenzte Dev-Wartungsautorität

Der bisherige Wiederaufnahmeweg verlangt eine tatsächliche Owner-AAL2-Sitzung. Die vom Owner ausdrücklich erlaubte autonome Dev-Reparatur wird deshalb als **eigene, versionierte Datenbank-Wartungsautorität** behandelt. Sie ist kein Owner-Login und erzeugt keinen Eintrag in `owner_operations_v1`.

Der geprüfte v5-Nachfolger ergänzt zwei private Tabellen: `official_v3_guard_private.bg1_dev_maintenance_baseline_v5` bindet die unveränderte vollständige v4-Zeile und ihren Katalog; `official_v3_guard_private.bg1_dev_maintenance_receipts_v1` hält den tatsächlichen einmaligen Wartungsbeleg. Beide gehören `postgres`, haben RLS und FORCE RLS, ausschliesslich eine Postgres-Policy und Sperren gegen UPDATE, DELETE und TRUNCATE. Es gibt weder eine neue öffentliche RPC noch eine neue Rolle oder zusätzliche Kunden-/Service-Rechte.

Nur vier bestehende Funktionen werden gezielt erweitert: `assert_catalog_v1`, `require_open_v1`, `public.official_v3_guard_alarm_status_v1` und `check_control_v1`. Sämtliche alten Katalogbindungen bleiben erhalten. Wetter-RPC, AT-Qualifikationsschutz, Fünfminuten-Audit, Incident-Erfassung und Owner-/AAL2-Funktionen bleiben unverändert. Ein exakter Delta-Abgleich erlaubt ausschliesslich die vier vorab gebundenen Funktionsdefinitionen und die zwei neu angelegten Tabellen samt konkreten Supportobjekten. Er verhindert, dass eine parallele fremde DDL-Änderung beim Aufnehmen des neuen Katalogs stillschweigend akzeptiert wird.

Die Installation allein öffnet kein Gate: Sie fordert eine höhere Prüfgeneration und einen späteren tatsächlichen Prüfzeitpunkt. Erst nach einem neuen vollständigen regulären Cron darf die getrennte Wartungsoperation unter dem wirklichen Datenbankakteur `postgres` den **exakten Vorfall 14 mit Vorgänger 13 und festem Incident-Zeitpunkt** bestätigen. Sie prüft die aktuelle genehmigte Methode und den frischen Complete-Lauf, schreibt ihren eigenen unveränderlichen Beleg und ändert nur `resumed_generation` sowie `last_observed`. Prüfläufe, Proof-Zeitstempel, Gültigkeitsdauer und Owner-Belege werden nicht verändert. Der Wartungsbeleg muss auch nach einer späteren echten Owner-Wiederaufnahme erhalten bleiben; seine damalige Frische wird gegen `recorded_at` geprüft.

Vorprüfung und unabhängige Reviews sind erfolgt. Der enge native Kontrollnachweis umfasst 46 erfolgreiche synthetische PostgreSQL-17.12-Fälle, darunter manipulierte/fehlende Belege, Zeitgrenzen, spätere Vorfälle und tatsächliche verweigerte Tabellenzugriffe. Der zusätzliche native Katalognachweis akzeptierte die geplanten Änderungen und verweigerte eine fremde neue Funktion sowie eine Änderung bestehender Tabellenrechte. Verwendet wurden die tatsächlichen SQL-Bausteine; die vollständige historische Assertion wurde im synthetischen Katalognachweis nur kompiliert, nicht als Hosted-Prüfung ausgegeben. Die tatsächliche Anwendung und die regulären Folgeprüfungen werden unten gesondert protokolliert. Bei einem Fehler vor Commit rollt die ganze jeweilige Operation zurück; nach erfolgreicher Installation werden keine unveränderlichen historischen Baselines oder Belege entfernt, sondern nötigenfalls ein weiterer enger Nachfolger erstellt.

**Reproduzierbarer enger Nachweis:** `node --import tsx scripts/db/reisewetter-global-1/dev-maintenance-v5-native-proof.mjs` benötigt lokale PostgreSQL-17-Binaries und die Repository-Abhängigkeiten. Er extrahiert die Tabellen und `check_control_v1` direkt aus dem vollständigen Installer, verwendet ausschliesslich einen eigenen synthetischen lokalen Cluster und schreibt seinen Bericht standardmässig in ein temporäres Verzeichnis. Er verbindet sich mit keiner Hosted-Datenbank. Die bestehende vollständige CI wird dadurch weder ersetzt noch abgeschwächt.

**Tatsächliche Installation, 02:40 Uhr Zürich:** Migration `20261121014026 / bg1_dev_maintenance_v5_incident14_20261121` ausschliesslich in Dev angewandt. Der vollständige Katalog- und Kontrollhistorien-Readback ist erfolgreich. Wie vorgesehen bleibt der Zustand zunächst 14/13 und `unavailable`: letzte vollständige Prüfgeneration 1922 liegt vor der neuen Schranke 1923; `proof_not_before` ist 02:40:28.343631 Uhr Zürich. Wartungsbeleg und Wetterledger sind zu diesem Zeitpunkt leer. Kein manueller oder erfundener Prüflauf.

**Regulärer Vollproof und tatsächliche Wiederaufnahme, 02:45 Uhr Zürich:** Der unveränderte Fünfminuten-Cron hat Generation 1923 vollständig von 02:45:00.112696 bis 02:45:06.266582 Uhr geprüft. Erst danach wurde um 02:45:29.656518 Uhr die separate Wartungsoperation ausgeführt. Der dauerhafte Beleg nennt `postgres`, Dev-Projekt, Incident14/Vorgänger13, die genaue neue Baseline, die aktuell genehmigte Methode und den tatsächlichen Complete-Lauf. Readback 02:45:35 Uhr: **`current`, 14/14**, genau ein Wartungsbeleg, **kein** Owner-Resume14-Beleg, Wetterledger weiterhin leer. Wetter-EXECUTE bleibt für `authenticated` erlaubt, für `anon` und `service_role` verweigert.

**Regulärer Folgecron, 02:50 Uhr Zürich:** Generation 1924 ebenfalls vollständig erfolgreich, Prüfzeit 02:50:00.126016 bis 02:50:06.503728 Uhr. Readback 02:50:13 Uhr: weiterhin **`current`, 14/14**, genau ein Wartungsbeleg, keine Owner-Quittung für14 und keine Wetterreservierung. Damit ist die Wiederaufnahme auch nach dem nächsten unveränderten regulären Kontrolllauf bestätigt. Der unabhängige Review nach Installation und nach Wiederaufnahme bestätigt die alten v4-Daten, unveränderten Wetter-/AT-/Owner-/Audit-Funktionen sowie die neue private Tabellenabsicherung. Die Supabase-Health-Prüfung meldet keine Hinweise; unter den bestehenden Security-Hinweisen gibt es keinen Befund zu den neuen Tabellen.

## Offene Abnahme

Die Dev-Wiederaufnahme ist tatsächlich beobachtet und oben protokolliert. Der abschliessende CI-Status und der Chrome-Nachtest werden nur anhand beobachteter Ergebnisse als erledigt markiert. Die Provider-Endtests setzen die sichere Zuordnung der oben genannten bereits bestehenden Dev-Zugänge voraus. Logout wird nach Reload beurteilt; Mietwagen und Wetter brauchen reale freigegebene Anbieterantworten, Ortsbilder einen tatsächlich neu angelegten Dev-Reiseort. Keine Buchung, Zahlung oder Production-Kundendaten. Dieser Abschnitt hält den Stand beim Code-Commit fest; anschliessende CI-/Chrome-Ergebnisse sind im bestehenden Draft-PR nachzuführen.

Der allgemeine Dev/Live-Gleichstand ist damit nicht pauschal bewiesen: Die übrigen noch offenen Konfigurationspunkte bleiben in der [Dev/Live-Abweichungsliste](JETNITY_DEV_LIVE_KONFIGURATION_DIFF_2026-11-21.md) sichtbar. Der Website-Deploy braucht weiterhin ein neues ausdrückliches Owner-Go und erfolgt separat.
