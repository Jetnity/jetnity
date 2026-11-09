# E1 — tatsächliche V3-Komposition, Vertrag V1

Programm #1162, Draft #1167, [TASK V1](E1_TASK_V1.md). Autor: **Jetnity Official Truth V3 Integration 1 — Codex Generation 1**, Session `/root/v3_integration_writer`. Dieser Vertrag beschreibt ruhenden Code und synthetische Integrationstests. Er erteilt keine Methoden-, Datenbank- oder Productionfreigabe.

## Tatsächliche Module und äußere Grenzen

`createV3IntegrationCoordinator(ports)` verbindet die vorhandenen Module. Es ersetzt keines durch einen nachgebauten Coordinator.

| E1-Einstieg | Tatsächlich aufgerufene Module | Bedeutung des Ergebnisses |
| --- | --- | --- |
| `query` | U1 `createV3VisitorQuery`; M1 `createV3QueueCoordinator` und `createV3DiscoveryQueueCoordinator` | Ein echter Miss darf erst nach bestätigtem aktuellem Queue-ACK als pending erscheinen. Ein Lesefehler oder unbekannter Queueausgang wird nicht als eingereichte Recherche ausgegeben. |
| `workOnce` | M1 `runV3ResearchWorkerOnce`; anschließend tatsächliche Result-Custody und I1 `createV3ImportCoordinator` | Ein M1-Abschluss bestätigt ein Rechercheergebnis. `acceptedRule: false` bleibt unverändert; über Annahme entscheiden erst die folgenden Original-, Methoden- und Versionsprüfungen. |
| `ingest` | I1 `createV3ImportCoordinator`; M1 `commitV3PreparedTransition`; U1 `prepareV3VisitorProjection` | `prepared` ist ein noch nicht geschriebener Vorschlag. M1 muss die neue Version gemeinsam aktuell bestätigen. Eine separate atomare Cachepublikation muss anschließend bestätigt werden. |
| `monitorOnce` | M1 `runV3SourceMonitorOnce` mit derselben Regelqueue und dem gemeinsamen Zustand | Geänderte Originalbytes lösen eine Recherche aus. Der Monitor behauptet damit keine rechtliche Regeländerung. |
| `recover` | M1 `commitV3PreparedTransition` mit `action: recover`; dieselbe U1-Projektion und Publikationsgrenze | Wiederherstellung braucht frische Prüfung und eine neue fortlaufende Version. Eine historische Version wird nicht wieder zum aktuellen Head erklärt. |

Die einzigen ergänzten Ports betreffen tatsächliche äußere Result-Custody, gemeinsame atomare Cachepublikation und vollständige Eskalationspersistenz. Import-, Queue-, Monitor-, Versions- und Besucherprüfungen bleiben die echten I1/M1/U1-Funktionen. Der zentrale Methodenport, die Registry und die Uhr kommen aus derselben Import-Konfiguration. Die Monitor-Registry muss dieselbe Instanz sein.

## Unveränderte neutrale Vorschläge und Research-Custody

Ein Anbieter liefert Original-JSON-Text nach dem vorhandenen neutralen V3-Vorschlagsformat. E1 schreibt diese Bytes nicht um, bevor I1 sie liest. Der tatsächliche UTF-8-Digest wird durch `readV3ProposalUpload` ermittelt; Formatierungsunterschiede gehören zu den Originalbytes und ändern den Digest.

`V3ResearchArtifact` enthält Job-ID, stabile Joboperation, Jobkey, Resultreferenz, vollständigen Lease-Fence, Methodenreferenz und die unveränderten Textuploads. Die private Receipt bleibt separat. Sie muss aus tatsächlicher code-owned Result-Custody stammen; eine vom Anbieter gelieferte Kopie ist kein Nachweis.

E1 prüft vor jedem Import:

- kanonischen aktuellen erfolgreichen M1-Job, Resulttyp, Joboperation, Jobkey, Resultreferenz und Zeitbindung;
- ursprüngliche Lease-ID, beanspruchte Revision und Generation, passend zur Vorgängerrevision des erfolgreichen Jobs;
- Methodenidentität, mindestens einen und höchstens 16 Uploads sowie jeden einzelnen bestehenden 65.536-Byte-Vertrag;
- unveränderten Digest jedes Uploads, eindeutige Proposaloperationen und Digests, bei Discovery die vollständige Übereinstimmung der Digestmenge;
- beim neutralen Discoveryjob exakt Zielland und einzelne Staatsangehörigkeit, beim Regeljob den vollständigen tatsächlichen Kontext und Researchgrund;
- die private aktuelle Artefakt-Receipt erneut unmittelbar vor jedem I1-Aufruf.

Metadaten werden geschlossen und losgelöst gelesen. Uploadarrays werden über eigene Datendeskriptoren gelesen; Getter, Löcher, Zusatzfelder und unbekannte Schlüssel werden abgewiesen. Die bestehende Uploadprüfung bleibt pro Originaltext erhalten; ein zusätzlicher gemeinsamer 64-KiB-Verlaufscap wird nicht eingeführt.

Nach einem unterbrochenen Integrationsaufruf darf `resume` nur den exakten ursprünglichen Claim und dessen tatsächliche erfolgreiche Result-Custody bestätigen. Wiederverwendete Lease-IDs oder spätere Reclaimgenerationen reichen nicht. Unbekannter Ausgang führt nicht zu einer neuen Researchausführung. Die synthetische Testcustody belegt den ursprünglichen Queue-Operationsbeleg, die aktuelle Jobgeneration und das tatsächlich gespeicherte Workerresultat zusammen. Seit Review R1 bindet sie außerdem den **vollständigen ursprünglichen M1-Claim-Commandkey** einschließlich `leaseMilliseconds`. Der gespeicherte ursprüngliche leased Record wird mit S0 gelesen; seine Lease-Dauer, sein voller Fence und die originale Worker-Custody müssen übereinstimmen. Derselbe Operationsname mit verändertem Inhalt ist kein zulässiger Replay.

## Original- und Methodenprüfung, vollständiger Kontext

I1 liest unabhängig qualifizierte amtliche Originalbelege über seine bestehenden Codeports. Die V3-Regel bleibt: eine eindeutige amtliche Primärquelle des Ziellandes ist Pflicht; eine zusätzliche unabhängige amtliche Gegenprüfung wird versucht, soweit verfügbar. Eine fehlende oder nicht erreichbare zweite Quelle verhindert allein keine Annahme. Ein echter vergleichbarer Widerspruch oder eine unklare Primärquelle erzeugt eine Eskalation. Bereits bekannte offene Konflikte bleiben auch dann relevant, wenn die zweite Quelle später nicht erreichbar ist.

E1 stuft keine Anbieterangabe, Quellen-ID, Rolle, URL oder serialisierte Receipt zu Autorität hoch. Das vollständige Prepared-Bündel mit Decision, previousDecision, archiveAppend, Version und Transition geht durch M1. Globale Schema-2-Kontextbedingungen bleiben vollständig im V3-Vertrag und in der U1-Projektion; es gibt keinen Legacy-Cast und kein Weglassen von Bedingungen.

Die Tests verwenden ausdrücklich fiktive `.example`-Originale und den tatsächlichen bestehenden Trusted-Fact-Extractor. Der Vorschlag behauptet absichtlich eine andere Seitenzahl als das Original. Nur das Ergebnis der echten Originalextraktion gelangt in die Version. Das ist eine überprüfte Testkomposition und kein allgemein implementierter Rechtsparser oder Nachweis amtlicher Quellenqualifikation.

## Gemeinsame atomare Version und getrennte Cachepublikation

Der M1-Versionsstore braucht seine tatsächliche gemeinsame atomare Grenze. Ohne `atomicBoundary` liefert die Kette keinen positiven Abschluss. Ein bereits persistierter historischer Operationsbeleg genügt nicht: M1 bestätigt den aktuellen Head, die aktuelle Methode, private Original-/Archivproofs, Rechtsdatum, native Fristen und Enduhr gemeinsam.

Auch nach M1-Erfolg ist die Cachefreigabe separat. E1 bereitet die echte U1-Projektion vor und bindet einen stabilen Publishkey an das vollständige Prepared-Bündel und die exakten Projektionsbytes. `builtAt` stammt stabil aus `version.recordedAt`. Ablauf ist das Minimum aus erforderlicher konfigurierter maximaler Projektionsdauer und tatsächlich erneut bewiesener Quellenfrische. Ein Retry verlängert diese Frist nicht.

`V3ProjectionPublicationPort` muss nach **allen** Wartevorgängen unter derselben tatsächlichen Authority-Grenze Head, Methode, private Quellen-/Archivreceipt, Sperrzustand und Enduhr synchron kontrollieren. Zwischen dieser Kontrolle und Mutation beziehungsweise Bestätigung darf kein weiterer Yield liegen. Projektionsbytes, Coverageindex, Audit und Operationsledger werden atomar zusammengeführt. Nur `not_attempted` erlaubt den ersten Schreibversuch; bei unbekanntem Ergebnis wird dieselbe Operation bestätigt. E1 prüft die abschließende Bestätigung auf genau diese Version, Projektion, Operation, Zeit und Frische.

Die äußere Produktionsimplementierung dieser dauerhaften Grenze ist noch unbound. Eine Folge einzelner DB-Schreibaufrufe oder ein vorgelagerter Promise-Check erfüllt den Vertrag nicht.

## Eskalation, Sperre, Prüfspur und Wiederannahme

`V3EscalationPublicationPort` muss die tatsächlich abgeschlossene I1-Quarantäne und deren vollständigen Outcome samt unverändertem Proposaldigest beweisen. Decision, previousDecision und archiveAppend bleiben vollständig erhalten. Die zuständige aktuelle Methode sowie Quellen-, History- und Archivzustand werden nach Wartevorgängen erneut gemeinsam geprüft.

Sperre, vollständiger Outcome, Audit, deduplizierte Outbox und Operationsbeleg entstehen atomar. Die Schnittstelle versendet keine Nachricht. Besteht bereits eine Accepted-Version, verwendet die synthetische Integration den echten M1-Übergang zu einer neuen conflicted- beziehungsweise withdrawn-Version; dieselbe atomare Mutation speichert den vollständigen Eskalationszustand. Eine bisherige Cacheprojektion kann danach keinen positiven Besucherbescheid mehr passieren.

Bei einem erstmaligen Konflikt ohne Accepted-Version wird keine angenommene Regel erfunden. Die vollständige Sperrcustody speist den Konflikt in spätere I1-Beweisprüfungen ein. Ohne vorhandene darstellbare Projektion darf die Besucherabfrage ehrlich pending oder unavailable bleiben. Ein positives Ergebnis erfordert eine neue eindeutige Originalprüfung mit tatsächlicher Konfliktauflösung. Ein alter Eskalationsreplay darf eine spätere Auflösung oder neuere Version nicht überschreiben.

## Synthetische atomare Testadapter

Alle positiven Referenzadapter liegen ausschließlich in `integration/test-support`. Eine gemeinsame lokale Mutex schützt tatsächliche Queue-, Quarantäne-, Version-, Archiv-, Methoden-, Sperr-, Publikations- und Read-Zustände. Receipts sind private WeakMap-Einträge; Inhalt und Generation werden nach Await erneut am tatsächlichen Zustand verglichen. Der letzte synchron ausgeführte Check prüft insbesondere auch Änderungen, die während der zuvor positiv zurückkehrenden Beweisfunktion eintreten.

Der Monitor bindet private Plan- und Originalbelege an den tatsächlichen Kontext, Head, Methodenstand und Originalepoch. Suppression prüft den aktuellen Zustand unter derselben Mutex und dedupliziert auch zwei konkurrierende identische Aufrufe. Der abschließende U1-Batchcheck entfernt positive Zellen, wenn Methode, Head, Projektion, Sperre oder Frist inzwischen ungültig geworden sind.

Diese Implementierungen sind flüchtige Testzustände in einem Prozess. Sie sind kein dauerhafter Writer und kein Nachweis für Atomarität über mehrere Produktionsprozesse. Zwei synthetische Researchproduzenten liefern dasselbe neutrale Format; kein reales Anbieter-SDK wird ausgeführt.

Review R1 verschärft die tatsächliche historische Recovery-Custody: Ein privater vollständiger Datensatzdigest entsteht nur beim echten atomaren Versionscommit. Recovery liest den dort gebundenen unveränderten historischen Datensatz erneut mit den vorhandenen S0-Decision-/Version-/Transitionreadern und prüft den tatsächlichen Operationsbeleg. Historische Referenz, kanonischer Kontext, Rule-Scope, Fakt, Methode, Revision, Zeit und Archivcustody müssen passen. Der synthetische Adapter verlangt identische Methode und identischen historischen Fakt; die aktuelle Originalevidence wird unabhängig neu geprüft. Eine vorhandene Version einer anderen Staatsangehörigkeit oder eines anderen Ziellandes, ein manipuliertes Subjekt, eine geänderte Methode oder ein selbst eingefügter Mapkey reichen nicht. Die neue Version erhält weiterhin den tatsächlich aktuellen Vorgänger und ersetzt keine historische Version an Ort und Stelle.

## Geschlossene Produktion und verbleibende Gates

`officialTruthV3IntegrationProduction()` hat keine positiven Bindungen. Query gibt unavailable aus; Import, Worker, Monitor und Recovery bleiben unavailable. Es gibt keine öffentliche Next-Route, Navigation, Umgebungsschalter, Scheduler, Providerverbindung, Datenbankmigration oder Aktivierung durch E1.

Die Tests verwenden eine Stunde Quellenfrische und fünf Minuten Projektionsalter als ausdrücklich synthetische Werte. E1 hat keinen Production-p95 gemessen und keine betriebliche Freshnesspolicy freigegeben. Eine konkrete Methode, amtliche Quellenqualifikation, dauerhafte Speicherung, Quelle-zu-Beleg-Custody, Betrieb und Eskalationszustellung brauchen eigene überprüfte Implementierungen und die bestehenden Ownergates.

Nur Root/TL entscheidet unabhängiges PASS, Ready und Merge. #917/#1139, der spezifische #917-STOP, #1131-Ready-STOP, #1135-Hold und #968 bleiben bestehen. Datenbank- und Productionaktivierung bleiben von der Ownerfreigabe des tatsächlich reifen Devpakets und der konkreten Methode abhängig; daraus entsteht keine Einzelfreigabe pro Regel.
