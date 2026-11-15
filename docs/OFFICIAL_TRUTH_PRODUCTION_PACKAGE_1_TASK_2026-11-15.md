# Official Truth Production Package 1 — Auftrag

Stand: 15. November 2026, Europe/Zurich. Autorität: Sasa genehmigt ausdrücklich die vollständige Vorbereitung und Prüfung von Punkt 1 und 2 des Dev-Abschlusses. **Kein Merge und keine Production-Ausführung in diesem Auftrag.**

## Ziel und Baseline

CH→DE erhält in #1197 einen vollständig prüfbaren Production-Anschluss einschließlich Installation, normalem Quellenimport, regelmäßigem Importplan, Hintergrundprüfung, Alarm und nichtdestruktivem Rückrollweg. Der temporäre Dev-Buildhook wird entfernt. Danach genügt eine konkrete PO-Freigabe für Merge #1197, Production-Installation und gegebenenfalls IPv4. #1198 bleibt ein späterer separater Auftrag.

- Verifizierter Main: `63544e820e912bd275556588c956a09b99b1cf90`.
- Verifizierter #1197-Head: `97c1b5824325781c8d2311eab4cb6f454c4a7774`; Tree `5f8a9bbdc7978fbc539cdb430babfe88e5d3aa60`; CI 4249 vollständig grün.
- Dev `yfvbxvijcorffwxbxahl`: bestehender abgenommener 40-Minuten-Plan bleibt angeschlossen. Keine Wiederholung der erledigten Owner-Schritte.
- Einzig zulässiges vorbereitetes Production-Ziel: `qscbgcdmivbbnzrcyegn`; tatsächliche Installation und Secrets-Einrichtung bleiben UNAPPLIED.
- #1196 bleibt zunächst Draft. Sein aktueller Head `8cf2b71863c34ee48e7d1a4bac6d3e3a0a001587` ist laut frischem GitHub-Compare vollständig in #1197 enthalten; endgültige Ablösung nach dessen genehmigtem Merge, kein doppelter Backend-Merge.

## Zuständigkeiten und Dateigrenzen

- Root / Technical Lead: Runtime-Zielauswahl, Human-Release-/Owner-Import-Bindung, Dev-Buildhook und dessen enger Importer-Permit, Deployment-Audit, Integration, Gesamttests, Live-Gates und PR-Dokumentation.
- `/root/production_plan`: eigene Production-Installer-/SQL-Artefakte, feste Vor-/Nachbedingungen und native Installationsnachweise in separatem Worktree. Keine Runtime-/Vercel-Änderungen.
- `/root/scheduler_design`: eigenes Production-Scheduler-SQL, feste POST-Route, HMAC-Vertrag, Aktivierung/Stop, unabhängige Überwachung und zugehörige Tests in separatem Worktree. Bestehende Dev-Schedulerdateien bleiben unverändert.
- `/root/scheduler_review`: Lineage-, Source-, Sicherheits- und Paketreview. Nach vollständig ausgewertetem zweiten Dev-Zyklus zusätzlich der isolierte Claim-Fix unten; dessen unabhängigen Diffreview übernimmt Root.

Agenten: do not mark Ready; do not merge; do not start a follow-up slice. Root integriert erst nach eigener Prüfung. Es werden keine Cursor-UI-Namen oder fremden Sitzungen behauptet.

### Ergänzung: zweiter Dev-Zyklus

Der zweite reguläre Zyklus auf dem unveränderten Head `97c1b582` bestätigt das Enqueue und vier Claim-CAS, erreicht aber keinen Quellen-START. Nach regulärer Erschöpfung ist er geparkt; Regelversion 4 läuft am 15. November um 01:16:15 Zürich aus. Alle Fehler des Laufs sind in #1197, Kommentar `6886383539`, dokumentiert. Historische erfolgreiche Abnahme und CI ersetzen diesen Folgezyklusnachweis nicht.

Der eng begrenzte Fix verwendet ausschliesslich die bereits fest im M04-Code gebundene Methode. Nach tatsächlichem `queue_confirm=not_attempted` löst der frische Claim innerhalb seines unveränderten 5-Sekunden-Budgets einmal MA1 auf und verwendet dieses Receipt für die weiterhin tatsächliche initiale Queue-Lesung. Der bestehende autorisierte Lesepfad prüft Binding, History und Epoche; gelesene und folgende Methodentupel müssen exakt passen. Vor CAS bleibt der tatsächliche Reproof bestehen; abschliessende echte Queue-Lesung und Reproof bleiben erhalten. Dadurch entfallen die reine `requires_authority`-Probe und eine doppelte Auflösung. Generische Adapter, Replay und unbekannte Ausgänge bleiben unverändert. Kein Cache für `resolveCurrent`, kein Receipt aus der Auswahl oder einem früheren Aufruf, keine neue Frist, kein Reset und keine Erweiterung von Quoten oder Guards. Root prüft den isolierten Diff und alle Negativnachweise vor Integration; danach folgt eine normale neue Dev-Abnahme.

### Ergänzung: belegte terminale Dev-Wiederaufnahme

Der vorhandene Sender hält nach jedem geparkten Zyklus an. Deshalb wird separat
`scripts/db/official-truth-v3-dev-terminal-cycle-review-1/` vorbereitet: ein
unveränderlicher Reviewbeleg ausschließlich für den vollständig gebundenen
Cycle 2, seine acht verarbeiteten Dispatches und den originalen terminalen
Queue-Envelope. Der eng gebundene Nachfolger ändert nur die Prüfung dieses
historischen Stopps. Jeder andere offene, unbekannte oder geparkte Vorgang
bleibt gesperrt. Alte Zyklen, Antworten, Jobs, Quoten und Katalogbelege werden
vor und nach der Transaktion exakt verglichen; kein Reset, keine Veröffentlichung,
kein Quellen-START und kein Audit während der Migration.

Root führt sie ausschließlich in Dev nach voller grüner CI, passendem Ready-
Deployment mit den geprüften Runtimebytes und erfolgreichem normalem UI-Quellenlauf
aus. Die protokollierte Betreibererklärung ersetzt keinen technischen Nachweis
dieser externen Gates. Echter PG17-Positiv-/Negativnachweis und unabhängiger Review
gehen der Integration voraus. Anschließend muss der bestehende Minuten-Cron einen
normalen automatischen neuen Quellenzyklus und eine frische Projektion belegen.

## Konkrete Verträge

1. Zwei feste serverseitige Zielauswahlen: bestehender Dev-Preview-Branch und Production ausschließlich im selben Vercel-Projekt/Repository auf `main`. Kein request-, URL-, PGENV- oder caller-gesteuerter Datenbankwechsel, kein Fallback und kein Laufzeit-Fixture-Schalter. TLS/Hostprüfung, sechs begrenzte Login-Kanäle und bestehende Deadlines bleiben erhalten.
2. Eigene Production-Human-Auswahl mit eigenem Selection-Identifier und festem Supabase-Issuer. Fachliche Methoden-/Paketdigests bleiben unverändert; reale Production-Owner-/AAL2-Freigabe wird weder erzeugt noch aus Dev kopiert. Uninstalliertes, nicht freigegebenes oder widerrufenes Production bleibt geschlossen.
3. Installer aus überprüften Vorgängern: PAI → drei Transport-Logins → PG1/HMA/HS/HMT mit eigener Production-Bindung → **HRS vor HM04** → begrenzte SET-Kanten → eigener frischer BG1/Status/rollierende Quote. Kein Dev-Recovery-Seed, keine importierte History, keine Ownerreceipts. Bestehender Production-Profil-Cron und übriger Katalog werden erhalten.
4. Production-Import: `https://jetnity.com/api/internal/readiness/ch-de-prod-refresh`, Secret `JETNITY_PROD_IMPORT_CRON_SECRET`, Vault `jetnity_prod_import_cron_v1`, Schema `jetnity_prod_import_scheduler`, Cron `jetnity-ch-de-prod-import-v1`. Eigene Request-/Response-HMAC-Domains und feste Header; keine Preview-Cookies oder Sharelinks. Normale neue Quellenzyklen alle 40 Minuten; Original-IDs, Bestätigungen, Quoten und unbekannte Ausgänge bleiben verbindlich.
5. Hintergrundschutz prüft vollständig außerhalb des öffentlichen Lesewegs; echte Abweichung oder überfälliger Proof sperrt Veröffentlichungen. Separater Beobachtungspfad mit geprüftem Alarm-/Fehlerfall wird vorbereitet, bis zur Freigabe deaktiviert. Keine Nachricht an Dritte wird im Vorbereitungslauf gesendet.
6. Rückrollweg: Importplan stoppen, über den geprüften Widerrufs-/Sperrpfad schließen, vorheriges App-Deployment bereithalten. Datenbankhistorie und offene Originalvorgänge erhalten; kein Reset und keine destruktive Schemarücknahme nach Nutzung.

## Prüfungen und Abnahme

- Compiler/Manifest belegen exakte Quell- und Artefakthashes, Zielbindung und Installationsreihenfolge.
- Echter lokaler/CI-PG17-Nachweis des leeren Production-Installationspfads, falscher Ziele, fehlender Voraussetzungen, Rollen/RLS, atomarem Rollback, Quotenbeginn ohne Dev-Daten, Scheduler-Fortsetzung und Stop. Synthetische Providerfixtures werden als solche bezeichnet.
- Runtime-Tests prüfen die beiden festen Umgebungen, gegenseitige Ablehnung falscher Credentials/Issuer/Selections, fehlende Installation/Freigabe, Original-ID-Retry und unveränderte Dev-Funktion.
- Alle Fehler eines Testlaufs vollständig sammeln und zusammen beheben; keine partiellen PASS-Behauptungen.
- Vollständiger Typecheck, Lint, Repository-Guards, Build und alle neun bestehenden CI-Jobs auf dem endgültigen Head. Neues Paket bekommt seine tatsächlichen nativen Prüfungen im verbindlichen Lauf. Unabhängiger Review und passende Dev-Preview erforderlich.
- Production-TLS, eigene Secrets, echte Owner-/Quellen-/Automatik-/öffentliche Abnahme bleiben ausdrücklich Ausführungschecks nach der finalen Freigabe. Vorbereitungstests behaupten keine schon erfolgte Production-Abnahme.

## Kosten und STOPP

Kein neuer Tarif, Anbieter, Schedulerkauf oder Add-on wird aktiviert. Vorbereiteter Standard nutzt bestehende Infrastruktur. IPv4 nur bei tatsächlichem Bedarf nach PO-Freigabe; zuletzt offiziell 0,0055 USD/Stunde, ungefähr 4 USD/Monat zzgl. Steuern. Zusätzliche Mess-/Monitor-Nutzung wird beziffert; kein unbelegtes Nullkostenversprechen. Die 206 Ziele bleiben `RESEARCH_ONLY` und werden nicht importiert.

Deliverables: vollständiger geprüfter Kandidat in #1197, exakte Installer/Hashes/Aktivierungs-/Rollback-Schritte, aktueller Handoff und kurze einmalige Freigabeliste. STOPP vor Merge, Production-Mutation, IPv4-Aktivierung und #1198.
