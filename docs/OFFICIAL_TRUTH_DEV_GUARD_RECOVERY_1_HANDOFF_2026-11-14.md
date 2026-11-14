# Dev Guard and Recovery 1 — lokaler Handoff

14.11.2026 · Author `/root/hosted_batch_fix_g4` (Generation 4).

Basis: #1197 `4fd6dc9e50972233288a9552f9331b915a85847f`, Baum `3da56383b57b1205925ac49566b09e59cc2d4e24`. Maßgeblich ist der versionierte Root-Auftrag `OFFICIAL_TRUTH_DEV_GUARD_RECOVERY_1_TASK_2026-11-13.md` einschließlich seiner beiden Hotpath-Ergänzungen. Dies ist ein lokaler Kandidat zur unabhängigen Prüfung, kein Installations-, Owner-, Laufzeit- oder Production-PASS.

## Enthalten

- `scripts/db/official-truth-v3-background-guard-1/upgrade-candidate.sql` ist der deterministisch aus `build.mjs` und `parts/` zusammengesetzte additive SQL-Kern. Er prüft den benutzten Vorgänger, erhält alte Journale/Originale/Baselines und ergänzt getrennte Folgebaselines, Inhaltszertifikate, vollständige Historienprüfungen, feste Prüffälligkeit und dauerhafte Incident-Sperre. Das Auditbudget bleibt 30 Sekunden einschließlich Sperrwartezeit; normale Writes verlängern den Heartbeat nicht. Gefangene Prüffehler werden außerhalb ihrer Untertransaktion gespeichert; Prozess-/Datenbankausfälle bleiben durch Frischeablauf geschlossen.
- `activate-scheduler.sql` ist ein getrennt prüfbares Artefakt desselben Pakets für den echten Dev-`pg_cron`-Takt alle fünf Minuten. Es verlangt den tatsächlichen Providerzustand und ist nicht ausgeführt. Der SQL-Kern benötigt keine erfundene lokale Cron-Extension. Ohne echten vollständigen Prüferfolg bleibt die Datenbankgrenze gesperrt.
- Die feste erste offene Importausführung erhält ausschließlich einen eigenen Abschluss `unknown_retired`. Keine Umdeutung zu Erfolg oder `settled_failure`, kein Queue-Reset. Deterministische S1-/M04-Zuordnung, abgelaufene Leases, fehlende Abschlussbelege und Originale werden unter Sperren geprüft; alte Identitäten werden dauerhaft eingezäunt. Die normale nächste Claim-Operation erzeugt erst später neue Identitäten. Allgemeines Incident-Resume bindet die aktuell geprüfte Methodenepoche; die erste Recovery bleibt eng auf Revision 1/Epoch 1 begrenzt.
- `/admin/official-truth/guard` und der feste POST `/api/internal/readiness/ch-de-owner-guard` erlauben getrennt Prüfen/Schließen und Prüfen/Wiederaufnehmen. Exaktes Preview-/Dev-Ziel, Origin und Requestform werden vor Auth-I/O geprüft; zentraler Owner/role/AAL2-Guard und unteres PG1 bleiben erforderlich. Gespeicherte Auswahl, lokale Vorgangsquittung vor dem Schreiben und unabhängiges Bestätigen derselben Operation; kein automatischer Start oder Retry. Der zusätzliche Regionseintrag erhält `fra1`; Proxy, Methodenseite/-Panel und bestehende Cron-Route bleiben bytegleich.
- Der feste CH→DE-Besucherpfad verwendet ein privates frisches MA1-Receipt und einen atomaren nur lesenden HRS-Snapshot. Methode/Epoche, aktuelle Projektion/Quellenbindung, Konflikt/Suppression und Guard werden unten geprüft; der private absolute Horizont wird nach vollständigem Drain erneut geprüft. 750 ms bleiben unverändert. `ch_de_snapshot` ist ausschließlich in der bestehenden Reader-Zulassung ergänzt.
- Ein privater Frame hält den initialen I1-Receipt nur während desselben ausgewählten Imports für fünf HRS-Aufrufe. Initialer MA1-Read, finaler Reproof, alle fünf unteren SQL-Fences, beide History-Prüfungen, S1 Read/Reserve/Finish und fünf Sekunden bleiben. Close/Abort, paralleler finaler Reproof und fremde Receipts verweigern die Verwendung. Strukturell und im Unit-Effektzähler sinkt die Zahl von 15 auf 10; dies ist noch kein tatsächlicher Laufzeitnachweis.
- Die separat geprüften Diagnose- und Alarm-Slices sind integriert. Diagnose schreibt nur erlaubte Stufen/Zähler/Zeiten/Regionen. Der Alarmchecker benutzt ausschließlich das feste Dev-Ziel und die feste kleine Statusfunktion über den Management-Read-only-Endpunkt. Keine neue externe Schlüsselkonfiguration, kein Versand und keine Aktivierung.
- Die temporäre Buildprobe liest einen fest reservierten, vom tatsächlichen CH→DE-Key verschiedenen Diagnose-Key. Nur `absent` plus echte ACK/Idle-Evidence gilt; Kennzeichnung `TRANSPORT_CATALOG_CHECK_ONLY`. Sie beweist weder den Zustand des tatsächlichen Jobs noch eine fachliche Startfreigabe. Der Guard greift auch vor dieser Probe.

## Gebündelte Korrekturen und Bindungen

Die Reviewkorrekturen betreffen die einmalige Fälligkeits-/Incident-Verknüpfung, Incident-Priorität im Status, den vollständigen PAI-Trigger-/HMT-Vorgängerbeleg, die HM04-Journalkette mit eindeutigem Head auch außerhalb `leased`, allgemeines Resume nach legitimer Epochenänderung, die finale I1-Frame-Grenze und die enge Snapshot-Transportzulassung. Historische Installer wurden nicht geändert.

Der Native-Harness verwendet getrennte `maop1_`-Methodenoperationen und `op3_`-Guardoperationen, das tatsächliche S1-Ergebnis `acquired`, vollständige HMA-Bestätigungstupel und eine CHECK-konforme S1-Tamperprobe. `fixtures.ts` leitet `proposalDisposition` aus dem kanonischen Vergleich von vorgeschlagenem und bestätigtem Fact ab; der vorhandene Snapshot-Positivtest verlangt für den tatsächlichen Producer `matched`. Die erfundenen lokalen Sourcebytes sind ausdrücklich Testdaten. Runtime-Issuer und Synthetic-/`.example`-Grenze sind unverändert.

Zwei weitere Bindungsanpassungen, ohne Vertragslockerung:

- `lib/readiness/official-truth-autonomous-producer-custody-foundation.test.ts`: genau der neue `visitor/ch-de-snapshot.ts`-Consumer darf `ownRecord` importieren. Das endliche Negativinventar prüft weiterhin Pfad und Importname; keine zusätzliche Receipt-/Issuer-Autorität.
- `lib/readiness/official-truth-product-v3/storage/retention-shape.test.ts`: aktueller Whole-file-Pin für `import/service-server.ts` nach dem separat geprüften Diagnose-Wrapper. Retentionform, kanonischer Reader und gespeicherte Bytes bleiben unverändert.

Nur aktuelle Pins der vier vorhandenen HDP/HRS/HM04/Composed-Manifeste wurden fortgeschrieben. Native-Closures enthalten zusätzlich genau `result/ch-de-import-frame.ts`, `runtime/dev-diagnostics.ts` und `visitor/ch-de-snapshot.ts` (HRS 83, Composed 81 Dateien). Historisch eingebettete Evidence und der HUI-Beleg bleiben gleich. Das bestehende Auditpaar bleibt am selben Pfad; ausschließlich der aktuelle Deployment-Nachfolgewitness berücksichtigt die vierte feste Regionbindung. Keine Änderung an #1198-Produktdateien.

## Tatsächlich gelaufen

| Prüfung | Ergebnis |
| --- | --- |
| Fokussierter Re-Lauf, 31 Dateien | 417/417 PASS, 0 Fehler, 0 Skip |
| Vorheriger vollständiger Fokuslauf einschließlich lokaler Intake-Native-Suite | 415 PASS, 3 Fehler: zwei oben genannte Bindungen korrigiert; verbleibender Native-Start durch Socket-EPERM blockiert |
| Snapshot-/Fixture-Nachlauf nach letzter Dispositionskorrektur | 5/5 PASS, 0 Skip |
| TypeScript `--noEmit --incremental false` | PASS |
| Gezielter ESLint, 31 geänderte TS/TSX/MJS-Dateien | 0 Fehler; 4 Warnungen: drei bereits vorhandene unbenutzte Native-Typen und eine SessionStorage-Mount-Synchronisierung im neuen Panel |
| Dead code / Exports / Dependencies / Schema-Bezug / API-Schutz | PASS |
| SQL-Assembler `--check`, aktuelle Byte-/SHA256-/Git-Blob-Pins, `git diff --check` | PASS |
| Historische SQL-Installer/-Recovery-Kandidaten und fünf geschützte HUI/Methoden/Proxy/Cron-Dateien | bytegleich zur Basis |

Lokales Node ist 24.22.1; der verbindliche vollständige CI-Lauf bleibt Node 22. Das bestehende Security-Audit kann hier mit dem geteilten `node_modules`-Symlink den geladenen Sharp-Pfad nicht als checkoutlokalen Pfad sammeln und bricht vor den Assertions ab. Kein Audit-PASS und keine Ausnahme/Versionsfälschung daraus. Der Operating-Mode-Guard benötigt in diesem Checkout ohne lokale `main`-/`origin/main`-Refs seine regulären expliziten Base-/Head-SHA-Eingaben; Root erhält das Ergebnis auf dem eingefrorenen Commit separat.

## Native- und Live-Gates bleiben offen

Die echten PGDG-17.12-Binaries und `initdb` wurden unabhängig bestätigt. Der unveränderte lokale Serverstart scheitert an `Operation not permitted` beim Unix-Socket-Bind (`local_postgresql_start_failed`). Kein lokaler SQL-, TLS-, Race- oder Native-PASS; kein Runner-Override. Der neue Pflichtentry steht exakt und alphabetisch in der bestehenden Hosted-PG17-Auswahl, ohne Skip/zusätzlichen Job. Er enthält Gruppen für benutzten Upgrade/Rollback, Tamper, persistente Prüffehler und Sperrwartezeit, Owner/AAL/CAS, tatsächliche Retirement-Fences, normale neue Claims, einen positiven Zwei-Effekt-Snapshot, reale Methoden-/Lock-/Abort-Gegenproben und verspätete Fälligkeiten. Seine 700 Sekunden bleiben im vorhandenen 30-Minuten-CI-Job.

Die Native-Abdeckung wird nicht überzeichnet: Die vollständige offizielle I1-Ausführung mit zehn Effekten ist kein lokaler Fixture-Nachweis. Unit-Effektzählung und echte MA1-Custody-/SQL-Epoch-/Abort-Prüfungen sind getrennt. Die enthaltenen Gegenproben alter S1-/M04-/HRS-Identitäten sind ebenfalls kein Nachweis sämtlicher beidseitiger Commit-Rennen oder eines nachträglichen M04-Complete mit verlorenem einmaligem Runtime-Token. Keine solche Authority wird für einen grünen Test rekonstruiert oder erfunden. Diese Grenzen sind beim unabhängigen Native-Review/Gating zu berücksichtigen.

Nach Root-Review bleiben erforderlich: vollständige frische Neun-Job-CI und Preview, echtes Dev-Upgrade, tatsächlicher Cronlauf/Frische/Sperre, Management-PAT-DatabaseRead und installierter Status, tatsächliche unabhängige Alarmzustellung sowie die konkrete Owner-Recovery/Bestätigung mit dem PO. Erst danach kann ein neuer realer Import geprüft werden; dessen I1-Laufzeit und der echte positive Besucherpfad unter 750 ms sind weiterhin offene Dev-Gates. Privater Source-Scheduler, dessen Tarif/Aktivierung und Production sind nicht nachgewiesen oder aktiviert.

Keine Live-DDL, Recovery, Owneraktion, Quellenwiederholung, Secret-/ENV-/Scheduler-/Kostenänderung, Veröffentlichung, Ready-Markierung oder Merge durch diesen Author. STOPP für Root.
