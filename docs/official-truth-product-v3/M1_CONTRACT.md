# M1 — Überwachung, Jobs und Versionskoordination: Entwicklungsvertrag

Stand: TASK V1 + M1 R2 auf S0-R3 `ab26914ff01dde64020879b9e41cea8b1e1738aa`; Review-Fixes M1 R1 und Review R2. Draft #1166 / Programm #1162. Autor: Jetnity Official Truth V3 Monitoring 1 — Codex Generation 1; tatsächliche Session `/root/v3_monitor_writer`. Dies ist kein Methoden-, Ready-, Merge-, Datenbank- oder Produktions-PASS.

## 1. Ruhende Module und vorhandene Wahrheit

Alle Runtime-Module sind server-only. `officialTruthV3MonitoringRuntime()` bindet weder Storage noch Methodenautorität; Worker, Quellenmonitor, Versionscommit und Scheduler bleiben `null`. Es gibt keinen ENV-Schalter, Netzwerkfallback oder automatischen Start. Ein explizit aufgerufener Durchlauf besitzt nur einen begrenzten lokalen Abort-Timeout; er installiert keinen Hintergrundtimer oder Cron.

S0 bleibt unverändert. Kontext, Faktarten, Methode, Research-/Discoveryidentität, Jobrecords, Quellenentscheidung, Konfliktarchiv, Version und Transition werden über dessen Leser gebunden. Der bestehende Registry-/Content-Identity-Pin und `evidenceVersionenVergleichen` werden weiterverwendet. M1 führt keinen zweiten Katalog oder Factspeicher ein. Bedingte Fakten und Archive werden weder abgeflacht noch in den Legacy-Writer gecastet.

Die bestehenden Freshness- und Lifecycle-Grenzen werden als aktuelle serverseitige Proofs übergeben. M1 setzt die vorgeschlagenen stündlichen/24h-Betriebswerte nicht als neue Engine-Frische um. Die Invocation-/Lease-/Retrygrenzen sind technische Begrenzungen ruhender Aufrufe, keine Owner-Freigabe der späteren Betriebsmethode.

## 2. Queue-Vertrag für U1 und E1

Die beiden Factories verwenden dieselbe begrenzte Lifecycle-Implementierung und getrennte S0-Namespaces:

| Factory | Eingabe für `.enqueue(value, signal?)` | Identität |
|---|---|---|
| `createV3QueueCoordinator(options)` | `{ context, method, factKind, researchReason, operationId, jobId, attemptLimit }` | S0 `research-job:v3:…`, vollständiger expliziter Kontext + Faktart + Methode |
| `createV3DiscoveryQueueCoordinator(options)` | `{ destinationCountryCode, citizenshipCountryCode, method, operationId, jobId, attemptLimit }` | S0 `combination-discovery-job:v3:…`, neutrales einzelnes Paar + Methode |

`options` enthält `storage`, `methodAuthority`, `now`, `invocationMilliseconds`, `backoffBaseMilliseconds` und `backoffMaxMilliseconds`. Fehlender Storage-/Methodenanschluss bleibt geschlossen. Besucher oder Research-JSON können keinen Anschluss liefern.

Der Regeljobschlüssel dedupliziert Besucher, Operation-IDs und unterschiedliche Missing-/Recheckgründe nach S0; der Research-Key behält den konkreten Recherchegrund. Discovery erzeugt keine Regel-, Pass-, Routen-, Zweck- oder Zeitraumdefaults. Mehrere Staatsangehörigkeiten werden in U1 getrennt behandelt; M1 nimmt pro Discoveryjob genau ein Paar entgegen.

`confirmed` liefert den nach einer tatsächlichen Operationsbestätigung erneut gelesenen aktuellen S0-Record samt `replayed`. Ein alter Enqueue-Receipt darf keinen inzwischen abgeschlossenen Job als queued wiederbeleben. Falls dieselbe Jobidentität inzwischen eine neue Jobgeneration besitzt, lautet das Ergebnis `superseded`. Eine frühere Operation mit anderen Befehlsbytes ergibt `collision`.

U1/E1 darf ausschließlich einen passend gebundenen aktuellen `queued`, `leased` oder `backoff`-Record als pending übernehmen und muss seine eigene S0-/Identitäts-/Uhrprüfung beibehalten. `succeeded`, `exhausted`, `invalid`, `unavailable`, `unconfirmed`, `collision`, `contended`, `not_due` und `superseded` sind kein positiver Pending-ACK. Eine berechnete Job-ID allein reicht nie.

Zusätzliche Methoden sind `.read(jobKey, signal?)`, `.claim({ operationId, jobKey, leaseId, leaseMilliseconds }, signal?)`, `.complete(…, signal?)` und `.fail(…, signal?)`. Complete und Fail binden einen Fence aus `jobId`, `revision`, `leaseId` und `generation`. Complete verlangt je nach Namespace `decisionRef` oder `discoveryRef`. Es übernimmt dadurch keine Regel in einen Accepted Store.

**Review R2 — Claimoperation und Erwerb bleiben untrennbar:** Ein Claim bestätigt ausschließlich den vollständigen Erwerbsrecord, den genau diese Operation im Operationsledger gespeichert hat. Dieser Record muss mit dem aktuell gelesenen Record übereinstimmen, einschließlich Jobidentität, erworbener Revision, Leasegeneration und vollständiger Lease mit ihren Zeiten. Ein Reclaim unter einer anderen Operation ist eine neue Erwerbsgeneration, auch wenn dieselbe Lease-ID wiederverwendet wird. Die alte Operation erhält dann `superseded` und niemals den neuen Fence. Derselbe unveränderte Erwerb kann dagegen nach einem verlorenen ACK ohne zweiten Write bestätigt werden. Diese interne `exact_operation`-Bestätigung gilt nur für Claim; Enqueue behält ausdrücklich die oben beschriebene aktuelle ACK-Semantik. Es gibt keine öffentliche DTO- oder Storage-Vertragsänderung.

### Atomarer Queue-Storageport

`V3QueueStoragePort` bietet `read`, `confirm` und `compareAndSwap`. CAS muss den vollständigen alten Record einschließlich Lease vergleichen, Operation-ID und Command-Key konsumieren, Deadline und Lease mit seiner autoritativen Uhr prüfen, die aktuelle Methode am tatsächlichen Mutationspunkt nachprüfen und Record/Audit/Operationsledger atomar veröffentlichen. Ein Transportfehler darf nie als `not_attempted` oder leerer Store umgedeutet werden.

Nur ein bestätigtes CAS-Mismatch erlaubt maximal drei neue Lese-/CAS-Versuche. Unbekannter Commit wird ausschließlich durch dieselbe Operation bestätigt. Aktiv bestehende Jobs werden atomar dedupliziert; nach terminalem Zustand ist eine neue Jobgeneration mit neuer Job-ID möglich. Reclaim erhöht Revision und Leasegeneration; ein verspäteter alter Worker kann weder abschließen noch Backoff setzen. Versuche sind nach S0 auf 16 begrenzt, Lease auf 15 Minuten; Backoff ist begrenzt exponentiell. Ein Crash im letzten Versuch endet nach Ablauf in exhausted.

Die lokale `AtomicTestQueue` belegt diese Semantik mit konkurrierenden Promises und Mutex. Sie ist kein Durable-Production-Adapter und wird von keiner Runtime-Datei importiert.

## 3. Ein einzelner Recherche-/Discovery-Durchlauf

`runV3ResearchWorkerOnce(claim, dependencies, signal?)` bindet Queue, code-owned Rechercheport, getrennten Ergebnis-Custody-Port, aktuelle Methodenautorität und Uhr. Ohne einen Anschluss bleibt der Worker unavailable.

Vor Ausführung bestätigt er die tatsächlich aktuelle Lease und Methode. `results.lookup` muss zuerst feststellen, ob zur stabilen Joboperation bereits ein Ergebnis vorhanden ist. Bei unklarem Ergebnis startet keine blinde neue Recherche. Ein neuer Versuch ist nur nach autoritativem `not_attempted` zulässig. Ein schon gespeichertes Ergebnis kann nach einem verlorenen Write-Response bestätigt werden, ohne den Recherchelauf zu wiederholen.

Der Rechercheport muss Ergebnisse gegen dieselbe tatsächliche Lease fencen und eine unveränderliche Ergebnis-Custody führen. Der getrennte Custody-Port bestätigt den in dieser Custody gespeicherten Record; ein selbst behaupteter JSON-Receipt ist kein Nachweis. Bindungen sind `kind`, Job-ID, stabile Job-Operation, Jobschlüssel und Erstellungszeit. Discovery bestätigt eine `discoveryRef` plus 1–16 eindeutige Proposal-Digests. Regelrecherche bestätigt eine vorbereitete `decisionRef`. Anschließend darf nur der gültige aktuelle Fence die Queue abschließen.

Das Worker-Ergebnis enthält immer `acceptedRule: false`. Discovery liefert ausschließlich untrusted Vorschläge/Ergebnisreferenzen. Erst deren nachgewiesener fachlicher Inhalt kann explizite Regelkontexte bilden und I1 durchlaufen. Eine Kombination erzeugt während Discovery keine erfundenen Standardpässe oder Routen.

## 4. Quellenüberwachung und Sperren

`runV3SourceMonitorOnce(dependencies, signal?)` verarbeitet höchstens 16 serverseitig geplante Targets in einem begrenzten Durchlauf. Jedes Target bindet bestehenden Registry-/Content-Pin, expliziten Kontext/Fakt, Quellenrolle, ursprünglichen Fingerprint, nächste Prüfung, bestehende Primärquellenfrist, erwartete Version, Quellenentscheidung, betroffene Projektionsreferenzen und gegebenenfalls einen bekannten ungelösten Konflikt.

Der Planport muss zugelassene Quelle/Rolle, Originalbaseline, aktuelle Methode und tatsächlichen Versions-/Konflikt-/Archivhead beweisen. Der Quellenport liefert einen separat nachprüfbaren Original- oder Ambiguitätsreceipt. Frei übergebene URLs oder Research-Quellenlisten werden nicht als zugelassene Registry übernommen.

Veränderte normalisierte Quellenbytes erzeugen einen neuen Prüfauftrag. Der vorhandene Vergleich bleibt immer `ruleChange: 'not_asserted'`; daraus folgt weder eine bewiesene Rechtsänderung noch eine Annahme oder Frischeverlängerung. Protokoll 1 wird ausschließlich am Aufruf des vorhandenen Evidence-Vergleichs in dessen etablierte Darstellung ohne Protokollfeld projiziert; der kanonische Leser bleibt unverändert.

Eine fehlende, unklare oder unerreichbare optionale Gegenquelle sperrt für sich keine klare weiterhin gültige Pflichtquelle. Ein bekannter echter ungelöster Konflikt bleibt auch nach Abruffehlern wirksam. Bereits bekannter Konflikt oder Fristablauf wird vor einem möglicherweise hängenden Quellenaufruf zur Sperre gebracht. Nach jedem relevanten Await werden Frist und Autorität erneut geprüft.

`V3ProjectionSuppressionPort` muss aktuelle Version, unveränderliche Audit-/Entscheidungsreferenz, Operation und abhängige Projektionssperren atomar binden. Er muss Methoden-/Plan-/Quellenproof nach Locks prüfen. Eskalationen werden über einen stabilen Konflikt-/Version-/Methodenschlüssel dedupliziert. Ein unbekannter Sperrausgang wird bestätigt, nicht blind wiederholt; ein alter Bestätigungsrecord wird vor einem aktuellen Erfolgsoutcome erneut gegen Plan/Methode geprüft. Der Port ist produktiv ungebunden.

## 5. I1-Bündel und verbindliche atomare Versionsgrenze

`commitV3PreparedTransition(value, dependencies, signal?)` nimmt genau dieses vorbereitete Bündel entgegen:

```ts
{
  proposalDigest,
  decision,
  previousDecision,
  archiveAppend,
  version,
  transition,
  proposalDisposition: 'matched' | 'superseded_by_source',
  acceptance: 'not_committed',
  reproof: 'required_before_commit'
}
```

Dies ist keine Commit-, Accepted- oder Methodenfreigabe. Jedes S0-Dokument behält seinen eigenen begrenzten Leser; die Summe aus Vorgänger und Archiv erhält keine neue künstliche Lifetime-Historiengrenze. Der Coordinator bindet Entscheidung/Vorgänger/Archiv, Version, erwarteten Vorgänger, Kontext/Fakt, Methode, Evidenz, Auflösungen und Operation miteinander. Bereits validierte Vorgänger-/Archivbytes werden vor asynchroner Arbeit vom Eingabeobjekt getrennt. Der Command-Key bindet das gesamte vorbereitete Bündel, nicht nur frei gewählte Referenzen.

`V3TransitionProofPort.inspect/reprove` muss aktuelle Originalfakten, Ziellandqualifikation, Gegenprüfung, positive Konfliktauflösungen, tatsächliche Vorgänger-/Archivcustody, historische Recovery-Basis und native Fristen beweisen. Ein S0-Parser oder ein früherer I1-Receipt implementiert diese Autorität nicht. Methode und Proof werden unabhängig über code-owned Ports bezogen.

### M1 R1: Commit und aktuelle Bestätigung teilen dieselbe Grenze

`V3VersionCommitPort.confirm` ist ausschließlich eine historische Operationsauskunft. `readHead` ist ausschließlich eine Vorprüfung. Beide zusammen mit späteren asynchronen Proof-Aufrufen reichen nicht für einen aktuellen Erfolg.

Der Pflichtanschluss `store.atomicBoundary` besitzt `commit` und `confirmCurrent`. Fehlt er, endet M1 vor jedem Write mit `unsupported`. Beide erhalten denselben `V3TransitionAtomicCommand` mit vollständigem Bündel/Operation-Key, erwartetem Head, getrennter tatsächlicher Methoden- und Proofreceipt sowie Deadline und asynchroner Vorprüffunktion.

Die konkrete Implementierung muss nach sämtlichen Waits/Locks unter einer gemeinsamen Autoritäts-/Store-Sperre die tatsächlichen aktuellen Zustände gemeinsam lesen:

1. Methodenreceipt, aktuelle Methodenrevision und Widerrufsstand;
2. Proofreceipt, Original-/Archivcustody und zugehörige aktuelle Revisionen;
3. vollständigen tatsächlichen Head und exakte Operation-/Prepared-Bindung;
4. tatsächliche Enduhr, native Frist und rechtliches Datum.

Zwischen diesem letzten gemeinsamen Punkt und Mutation beziehungsweise Bestätigungsaufnahme darf kein weiterer Yield liegen. Bei einem entfernten Store muss dieselbe Eigenschaft durch geeignete Transaktion und Epoch-Fencing belegt werden. Eine Abfolge von unabhängigen Await-Prüfungen oder die Wiederholung älterer boolescher Freigaben erfüllt den Vertrag nicht. Der Callback `command.reprove` ist ausdrücklich nur eine Vorprüfung und kein Ersatz für die gemeinsame aktuelle Autoritätslesung.

Der atomare Commit veröffentlicht Archiv, neue unveränderliche Version, Audit, konsumierte Operation und Projektionsinvalidierung gemeinsam. `commit_reported` ist noch kein Erfolg. Danach bestätigt `confirmCurrent` unter derselben Grenze sowohl die tatsächliche Operation als auch den aktuellen Head und die aktuellen Autoritätszustände. Der Coordinator prüft den genau gebundenen Bestätigungsrecord und nach diesem letzten Await erneut Enduhr und rechtliches Datum. `confirmed` beschreibt diesen atomaren Bestätigungszeitpunkt; es ist kein dauerhaftes Ready-Flag und kein serialisierbarer Proof für einen späteren Cacheaufbau.

Ein verlorener Commit-Response bleibt `unconfirmed`. Ein Retry bestätigt zuerst dieselbe konsumierte Operation. Er schreibt nur nach autoritativem `not_attempted`; ein historischer Erfolg, der inzwischen überholt, widerrufen oder abgelaufen ist, wird `committed_not_current`. Der spätere öffentliche Lese-/Cachepfad braucht weiterhin seine eigene aktuelle Canonical-/Methodenprüfung.

### Wiederannahme und Rollback

Withdraw/conflict erzeugen neue Versionen und behalten frühere Versionen, Operationen und Prüfspuren. Wiederannahme aus conflicted/withdrawn ist eine neue Version mit erwartetem alten Head, aktueller Methode/Pflichtquelle und erforderlichen positiven Auflösungsbelegen. Ein bekannt ungelöster Konflikt darf weder verschwinden noch als gelöst archiviert werden. `recover` verlangt eine belegte historische Basis, erneute Prüfung und einen neuen Versionsbezug; es setzt kein altes Accepted-Flag zurück.

Der Legacy Accepted Store wird nicht automatisch verbunden; seine bestehenden Übergänge sind nicht allgemein für diese neuen vollständigen Kontexte/Archive/Transitions geeignet. Ein späterer Adapter muss die gemeinsame Grenze und sämtliche Custody-Bindungen nachweisen oder geschlossen bleiben. Das Produkt-Recovery enthält keinen Datenbank-/ACL-Rollback für #1139.

## 6. Exakte Naht für E1

E1 verbindet später U1 → Regel-/Discoveryqueue → Worker/Ergebnis-Custody → untrusted Vorschlag → I1 → M1-Versionstransition → U1-Projektion. M1 importiert derzeit keine parallel unfertigen I1-/U1-Dateien.

Bei I1-Eskalation darf E1 die vollständige Bindung aus `previousDecision` und `archiveAppend` nicht verlieren. Eine nach Archivierung eskalierte Quellenentscheidung muss diese genaue Audit-/Archivgeschichte atomar persistieren und bei Replay bestätigen. Das ist kein Accepted-Bündel und darf nicht durch einen Cast in `commitV3PreparedTransition` gelangen. Dieser Anschluss bleibt eine ausdrückliche Integrationspflicht.

Für ein belastbares E1- beziehungsweise späteres Dev-Gate fehlen noch konkrete überprüfte Anschlüsse für dauerhafte Queue/Operationsledger, zugelassene Methoden-/Registrypläne, Originalquellen-Custody, anbieterunabhängige Recherche, unveränderliche Ergebnis-Custody, atomare Suppression/Eskalation, gemeinsame atomare Version-/Autoritätsgrenze und Projektionsinvalidierung. Die in-memory-Harnesses beweisen lokale Konkurrenz-/Fehlersemantik und keine dauerhafte Persistenz, echten amtlichen Inhalt, Production-Verfügbarkeit oder öffentliche p95-Latenz.

Keine Datenbank-/Production-Aktivierung, SQL/Auth/ACL/RLS-, Provider-/Modell- oder Credential-Aktion ist Teil von M1. #917-STOP wird weder wiederholt, umformuliert, delegiert noch an einen menschlichen Alternativlauf verschoben. #1131 bleibt STOP, #1135 getrennt und #968 ist kein Beleg für isoliertes Dev. Nach Lieferung entscheidet ausschließlich Root über Review, Publish, weitere Gates oder Folgeslice.
