# M1 — Autorenprüfung und Handoff nach Review R1 und R2

**Status: Implementierung für unabhängiges Root-Review geliefert; STOP. Kein Technical-Lead-PASS, kein Ready, kein Merge und keine Aktivierung.** Autor: **Jetnity Official Truth V3 Monitoring 1 — Codex Generation 1**. Tatsächliche Session `/root/v3_monitor_writer`, kein Cursor-Agent. Gleiche Session für TASK V1, TASK R2 (Discovery) und die unmittelbaren Review-Fixes R1 (Versionsatomik) und R2 (Claim-Replay).

## Exakte Arbeitsbasis

| Gegenstand | Wert |
|---|---|
| Programm / Draft | #1162 / #1166 |
| Branch | `feat/official-truth-v3-monitor-jobs-1-20261109` |
| Checkout | `/workspace/scratch/e03d2839d4e5/official-truth-v3-monitor` |
| Unveränderter Seed-HEAD | `c3397ffe3bace3c63a3c347a63b3671f2f818281` |
| Gemeinsamer S0-R3 | `ab26914ff01dde64020879b9e41cea8b1e1738aa` |
| `contract.ts` SHA256 | `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4` |
| `S0_CONTRACT.md` SHA256 | `d71ecf9997778d29560ef05c6e56ce6923380aa7b5b89c8de87500c0a493bab8` |
| Lokale Merge-Base zu vorhandenem `origin/main` | `ce3366e26de73961d4682236af92347bfc3a4ca8` |
| Lokales `origin/main...HEAD` | 0 links / 5 rechts; nur lokale Ref-Auskunft, keine neue Live-GitHub-Behauptung |

Die gelieferten Dateien sind uncommitted. Die Prüfungen gelten für die Bytes in `M1_FILE_MANIFEST.md`, nicht für einen noch nicht von Root erzeugten Commit. Root veröffentlicht und verifiziert jeden neuen Head selbst. Es gab keinen Autoren-Commit, Push, GitHubwrite, Ready-/Merge-Vorgang oder Folgeslice. Frühere Exact-Head-Gates sind keine Freigabe dieser neuen Bytes.

## Ergebnis des Arbeitspakets

Gebaut wurden ruhende Servermodule für Regel- und Discoveryqueue, bounded Run-once-Worker, Quellenmonitor, Versionstransition/Recovery und eine geschlossene Standardfactory. Vier Testdateien und ein isolierter synthetischer Testhelfer führen tatsächliche Promise-Konkurrenz, Mutex/CAS/Fencing, verlorene Antworten und Await-Änderungen aus.

| Abnahmebereich | Implementierter Nachweis |
|---|---|
| Gemeinsame Datenformate | Bestehende S0-Leser für Kontext/Fakt/Methode, Regel-/Discoveryidentität, Jobrecords, Decision/Archive/Version/Transition; kein S0-Edit |
| Queue / Reclaim | Aktiver Job dedupliziert; Operationen separat konsumiert; begrenzte Attempts/Backoff; neuer Leasefence; verspäteter Worker verweigert |
| Review R2 / Claimbindung | Vollständiger ursprünglicher Erwerbsrecord bleibt an die konkrete Claimoperation gebunden; gleiche Lease-ID überträgt keine neue Generation; Lost-ACK bestätigt nur denselben Erwerb |
| Ehrlicher Pending-ACK | Tatsächlich erneut gelesener aktueller Record; alter queued-Receipt meldet inzwischen succeeded korrekt; neue Jobgeneration meldet superseded |
| Discovery | Neutrales Ziel-/Staatsangehörigkeitspaar; keine erfundenen Pass-/Route-/Zweckkontexte; Ergebnis-Custody bestätigt ausschließlich untrusted Vorschläge |
| Quellenüberwachung | Registry-Pins und code-owned Plan-/Sourceproof; vorhandener Bytevergleich; `ruleChange: not_asserted`; keine Frischeverlängerung durch unveränderte Bytes |
| Konflikt-/Ablaufverhalten | Bekannter Konflikt bleibt bei optionalem Ausfall; bekannte Sperre vor potenziell hängendem Abruf; klare gültige Primärquelle bleibt bei optionalem Ausfall verwendbar |
| Versions-/Archivprüfung | Vollständige Vorgänger-/Archiv-/Operationsbindung; neue unveränderliche Withdrawal-/Conflict-/Recovery-Versionen; kein Überschreiben alter Annahme |
| Review R1 | Gemeinsame atomare Commit- und Current-Confirmation-Grenze; tatsächliche Methode/Proof/Head/Enduhr nach Waits; ohne neuen Port unsupported vor Writes |
| Grenzen | Keine produktiven Ports gebunden; keine DB/SQL/Auth/RLS/ACL/Credentials/Provider/Modelle/Hosted/Production-Aktion |

Die genaue E1-Naht steht in `M1_CONTRACT.md`. U1 und I1 wurden über die tatsächlichen Queue- beziehungsweise Atomic-Boundary-Verträge informiert. Es bestehen keine Direktimports aus ihren parallelen Branches.

## Reviewbefunde und deren Korrektur

Im ersten Monitorlauf waren zwei Tests rot: S0 führt Fingerprintprotokoll 1 ausdrücklich, der bestehende Evidence-Vergleich codiert es durch ein fehlendes Feld. Ausschließlich die M1-Aufrufprojektion wurde berichtigt; der vorhandene Leser blieb unverändert. Der Monitor lief danach vollständig grün. Weitere lokale Entwicklungskorrekturen betrafen TypeScript-Narrowing und das Abwarten von Rückgabepromises vor dem Budget-Finally.

Root setzte **CHANGES REQUIRED M1 R1** in [#1166, Kommentar 6729597059](https://github.com/Jetnity/jetnity/pull/1166#issuecomment-6729597059). Die unabhängigen Gegenproben fanden echte späte Await-Races: Headwechsel, Widerruf und Ablauf konnten einen falschen aktuellen Erfolg ergeben; ein Widerruf während des Write-Proofs konnte noch einen Write zulassen. Das betraf neuen ruhenden Code, keine aktivierte Production.

Der von Root bestätigte Fixplan steht in `M1_REVIEW_R1_FIX_PLAN.md`. Historische Operation und Vorab-Headlesung reichen jetzt ausdrücklich nicht. Der Pflichtanschluss `atomicBoundary` prüft getrennte echte Methoden-/Proofreceipts, aktuelle Autoritäts-/Original-/Archivzustände, vollständigen Head und Enduhr/rechtliches Datum unter derselben Sperre nach allen Waits. Der synthetische Adapter führt diese gemeinsamen Checks tatsächlich über Receipt-WeakMaps und aktuelle Zustände aus. Ein fehlender Joint-Port bleibt unsupported vor Writes.

Die vier ursprünglichen Sicherheitsassertions sind dauerhaft erhalten:

- Headwechsel beim dritten Proof-Await: `committed_not_current`.
- Methodenwiderruf beim dritten Proof-Await: `committed_not_current`.
- Fristablauf beim dritten Proof-Await: `committed_not_current`.
- Methodenwiderruf beim zweiten Proof-Await vor dem Write: `unavailable`, **0 Writes**.

Zusätzlich sind Proof-/Archivepochwechsel, rechtlicher Datumswechsel beim letzten Proof, Uhr-/Datumswechsel nach der letzten Promise-Bestätigung, fehlender Joint-Port einschließlich Replay und echte conflicted→reaccept-Transitions abgedeckt. Root meldete nach Lesen der neuen Bytes auch die unabhängige Wiederholung seiner vier Gegenproben als bestanden; dessen Gesamt- und Integrationsreview bleibt getrennt.

Die erste Exportprüfung fand drei unnötige Exporte rein lokaler Testhelfer. Nur deren `export` wurde entfernt; es entstand keine neue Ausnahme im zentralen Prüfer. Die finale Wiederholung war grün.

## Review R2 — Claim-Replay und Leasegeneration

Root setzte erneut **CHANGES REQUIRED M1 Review R2 / P1** in [#1166, Kommentar 6729792116](https://github.com/Jetnity/jetnity/pull/1166#issuecomment-6729792116). Die unabhängige Probe belegte: Nach Ablauf und Reclaim unter einer anderen Operation mit gleicher Lease-ID konnte die alte Claimoperation über den allgemeinen aktuellen ACK die neue Generation erhalten. Die Kontrolle mit anderer Lease-ID wurde bereits korrekt abgewiesen.

Der vorab von Root bestätigte Plan steht in `M1_REVIEW_R2_FIX_PLAN.md`. Die Änderung ist ausschließlich eine interne Claim-Bestätigungsart: Der historische, genau zu dieser Operation gespeicherte vollständige Erwerbsrecord muss mit dem tatsächlichen aktuellen Record identisch sein. Neue Revision/Generation oder eine andere Lease ergibt superseded. Legaler Replay und verlorener ACK bestätigen weiterhin denselben Erwerb ohne zweiten Write. Enqueue behält aktuelle ACKs; DTO, S0 und Storagevertrag wurden nicht geändert.

Die zwölf neuen Queuefälle wurden vor dem Fix tatsächlich ausgeführt: **6 bestanden, 6 scheiterten** an genau diesem Fehler. Nach dem Fix: **12/12**. Je Namespace sind legaler Replay, Lost-ACK, Reclaim mit gleicher/anderer Lease-ID, alte Complete-/Fail-Versuche, gültiger Abschluss des neuen Eigentümers, Lost-ACK nach Reclaim und Reclaim vor Rückkehr des ersten Claim-ACK enthalten.

Die ursprüngliche Root-Probe `/workspace/scratch/e03d2839d4e5/official-truth-v3-analysis/m1-review-claim-replay.ts` wurde unverändert mit Node 22, `--import ./scripts/server-only-test-register.mjs --import tsx` erneut ausgeführt: Exit 0. In beiden Lease-ID-Varianten war der alte Retry superseded, erhielt keine neue Generation und ließ den aktuellen Job leased. Probe-SHA256: `5b36a4c95db3c7d88ce0b4cb6df7775fd594d2ddfa3a7d2ffc8148056c751b85`.

R1 blieb bytegleich: `recovery.ts` SHA256 `767aa7465281c7f38d8bf3b748f41d94f4204b26867b11719b77f833d259c899`; `recovery.test.ts` SHA256 `4b7e24efd00008a37417a48590f5b45e2b4f7cf824b3cb51446a494f58d11c73`. Die 22 Recoverytests wurden im neuen vollständigen Gate erneut ausgeführt. Diese Autorenprüfung ist keine Aufhebung der Root-Review-Gates. Root meldete anschließend seine eigene unveränderte Probe mit Exit 0 und unabhängig 133/133 Tests, 0 Skips (1578.511509 ms). Der Queuefix wurde damit für die Entwicklung fachlich bestätigt; vollständige CI, E1 und Aktivierung bleiben getrennte offene Gates.

## Tatsächlich ausgeführte finale Gates

Node-Executable: `/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node`. Arbeitsverzeichnis ist der oben genannte M1-Checkout. Keine neuen Dependencies.

| Befehl mit diesem Node-Executable | Ergebnis |
|---|---|
| `--import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/contract.test.ts lib/readiness/official-truth-product-v3/monitor/*.test.ts` | Exit 0; **133/133**, 13 Suites, 0 failed/cancelled/skipped/todo; finale Dauer 2091.905621 ms |
| `node_modules/typescript/bin/tsc --noEmit --incremental false` | Exit 0 |
| `node_modules/eslint/bin/eslint.js lib/readiness/official-truth-product-v3/monitor` | Exit 0 |
| `scripts/exporte.mjs` | Exit 0; 1520 Dateien geprüft, 0 unbegründete Exporte |
| `scripts/erreichbarkeit.mjs` | Exit 0; 1126 Startpunkte, 2080 erreichbare Module, 0 unbegründete Waisen |

Die 133 Tests bestehen aus S0 63, Queue 26, Worker 10, Monitor 12 und Recovery 22. Ein zusätzlicher statischer Read der sechs Runtime-Module fand 0 Fetch-/SDK-/ENV-/Testfixture-/I1-/U1-Imports. Genau ein `setTimeout` gehört zum begrenzten Aufrufbudget; kein Scheduler wird gestartet. Die geschlossene Standardfactory wurde auch durch tatsächliche Queueaufrufe im Test geprüft. Abschließende Datei-/Whitespace-/Hashprüfung steht im Manifest.

Diese Tests belegen lokale Zustandssemantik. Sie belegen weder dauerhafte Storage-/DB-Persistenz, echte amtliche Quellen, bereitgestellte Production-Methode, öffentliche p95-Latenz noch CI/Vercel-Verfügbarkeit. Keine native DB-Testfolge und kein Production-Build/-Deploy wurden durch M1 ausgeführt.

## Offene Gates, Bindungen und Risiken

**Root besitzt die zentralen Importerinventare und das unabhängige Gesamtgate.** Root reproduzierte zwei bestehende exakte Importerinventarfehler in `official-truth-content-identity.test.ts` und `regulierungs-anwendbarkeit.test.ts`. Diese wurden nicht verändert oder pauschal geöffnet. M1 bringt zusätzliche genau zu prüfende Importer mit: `monitor.ts` und der ausschließlich testseitige `test-support.ts` für Content-Identity; `internal.ts`, `recovery.ts` und derselbe Testhelfer für den kanonischen Daten-/Datumleser. Der S0-Autor beziehungsweise Root behandelt die explizite Inventarisierung seriell. Der lokale Scope-Test ist kein grünes Gesamt-CI.

| Priorität | Offener Punkt und praktische Grenze |
|---|---|
| P0 | Kein P0-Befund in diesem lokalen Scope. Keine Hosted-/Productionprüfung oder allgemeine Produktionssicherheitsbehauptung. |
| P1 | Joint-Commit-/Current-Confirmation, Methodenautorität, Original-/Archivcustody und dauerhafte Queue sind produktiv ungebunden. Ein späterer Adapter muss die tatsächliche gemeinsame Atomizität beweisen; DTOs, Self-Reviews und bloße Callback-Flags reichen nicht. |
| P1 | I1-Eskalation nach Archivappend muss bei E1 die volle Decision/Vorgänger/Archiv-Bindung erhalten. Eine Eskalation ist kein Accepted-Bündel und wird nicht in den Version-Commit gecastet. |
| P2 | Gemeinsame E1-Integration, explizite Importerinventare, vollständige CI-/Headprüfung und passende Vercel-/Dev-Gates fehlen noch. Ein beliebiges Preview ist kein isolierter Dev-Nachweis. |
| P2 | Quellen-/Methoden-/History-/Ergebnis-/Suppressionports und Invalidierungsanschluss brauchen konkrete geprüfte Implementierungen. Synthetische Mutex-Tests sind kein Distributed-/Durabilitynachweis. |
| P3 | Betriebsintervalle/Produktionsfristen und p95 benötigen gesonderte freigegebene Methode und Messung; M1 behauptet deren Erfüllung nicht. |

## Übergabe und STOP

Root kann die manifestierten Dateien unabhängig reviewen und veröffentlichen. Nach jeder Headänderung sind passende Exact-Head-Gates neu zu prüfen. Erst Root entscheidet über Ready, Merge, E1 oder weitere Arbeit. Es wurde kein Folgeslice gestartet.

Die Methoden- sowie Datenbank-/Production-Aktivierungsfreigabe des Owners bleibt offen. Für M1 ist derzeit kein menschlicher Ausführungsschritt erforderlich. #917 wurde nicht erneut ausgeführt, umformuliert, delegiert oder an einen menschlichen Alternativlauf verschoben; #1131 bleibt STOP, #1135 bleibt separat und #968 ist kein isolierter Previewbeleg. #917/#1139 liegen weiter beim Root-Arbeitspaket.

Ein Rückbau dieses ruhenden Codes ist ein normaler Code-Revert ohne Live-Datenänderung. Produkt-Recovery erzeugt neue geprüfte Versionen und ist ausdrücklich kein DB-/ACL-Rollbackplan für #1139.
