# M1 — Überwachung, Jobs und Recovery: Umsetzungsplan

Autor: **Jetnity Official Truth V3 Monitoring 1 — Codex Generation 1**. Tatsächliche Session `/root/v3_monitor_writer`; keine Cursor-Sessionbehauptung. Auftrag: `M1_TASK_V1.md`, #1162 / Draft #1166. Seed `c07cdf624b7af90d2562885597885259f24ca65f`, gemeinsamer Vertrag `19c4736a73f639daaf5337465386155607792a4f`, main-Basis `ce3366e26de73961d4682236af92347bfc3a4ca8`.

## Ziel und konkrete Module

- `lib/readiness/official-truth-product-v3/monitor/queue.ts`: vorhandene S0-Jobrecords, deduplizierter Enqueue, begrenzte Lease-/CAS-Transitions, Backoff, Reclaim und Operation-Confirm. Ein atomarer späterer Storageport muss gleichzeitig den erwarteten Head, Lease und verbrauchte Operation prüfen. Testadapter bleiben ausschließlich in Testdateien und ihrem isolierten Testhelfer.
- `monitor.ts`: begrenzter einzelner Durchlauf über einen getrennt zugelassenen Registry-/Methodenplan. Bestehender `evidenceVersionenVergleichen` entscheidet ausschließlich über normalisierte Quellenbytes; daraus entsteht keine Rechtsänderung. Änderungen erzeugen neue Recherchearbeit; bekannte Konflikte, unklare Pflichtquelle und Ablauf verlangen bestätigte gezielte Projektionssperre mit Auditreferenz. Optionale Nichterreichbarkeit allein sperrt nicht.
- `recovery.ts`: S0-Transitions-/Versions-/Quellenentscheidungs- und Archivbindungen, aktuelle Methoden- und Origin-/History-/Head-Nachprüfung, anschließend atomarer Commit/Confirm. Ein unbekannter Ausgang führt ausschließlich zur Nachbestätigung derselben Operation, nicht zu blindem Replay oder Erfolg.
- `runtime.ts`: geschlossener Produktionsanschluss. Keine Umgebungsvariable, kein Netzwerkadapter, keine echten Timer/Cron-/Provider-/Datenbankbindungen.
- `*.test.ts`: echte lokale Zustands- und Konkurrenzprüfungen mit ausdrücklich synthetischen atomaren Speicher-/Proofports, keine Persistenz- oder Hosted-Evidence.

## Wiederverwendung und Schnittstellen

S0 bleibt unverändert und wird direkt importiert: vollständige Kontext-/Research-/Methodenidentität, Jobrecords, Transitionsplan, Versionsrecord, Quellenentscheidung und Archivseite. M1 führt keinen zweiten Fakt- oder Quellenkatalog ein. Der vorhandene Quellenvergleich bewahrt `ruleChange: not_asserted`.

U1 übergibt seinem späteren Adapter explizit serverseitig geplante Kontexte und dieselben Felder `context`, `method`, `factKind`, `researchReason`, `operationId`, `jobId`, `attemptLimit`. `pending` benötigt einen bestätigten aktiven S0-Jobrecord. I1 liefert lediglich ein vorbereitetes Bündel aus Decision/Vorgänger/Archiv/Version/Transition; M1 muss aktuelle tatsächliche Proofs und Store-Head am Commit erneut beziehen. Keine Direktimports aus gleichzeitig unfertigen I1-/U1-Branches.

## Grenzen, Risiken und Tests

Keine Datenbank-, SQL-, RLS-, ACL-, Auth-, Credential-, Infrastruktur-, API-Route-, Navigation-, Dependency-, Scheduler- oder Production-Änderung und keine neuen Kosten. Bestehende Quellenfristen werden nicht auf geplante 24h/stündlich geändert. Der Legacy-Writer kann bedingte/Schema2-Fakten noch nicht allgemein übernehmen; er bleibt ungebunden. Kein Cast und kein Weglassen von Bedingungen. Kein persönlicher Trip-/Visitor-/Passdatenweg und keine neue Reisegraph-Wahrheit.

Die wesentlichen Risiken sind Konkurrenz, verspätete Worker, mehrdeutige Commitausgänge, Methodenwechsel während Await und ausbleibende tatsächliche Persistenz. Tests prüfen dieselben Misses mit konkurrierenden Promises, Lease-Reclaim mit altem Worker, Crash/Backoff/Limit, Schema-/Privacyfehler, Quellenänderung ohne behauptete Rechtsänderung, optionalen Ausfall bei bekanntem Konflikt, falschen Vorgänger, unbekannten Commit und frische Recovery. Ein in-memory-Test beweist keine Durable-Queue oder Produktionsautorität.

Node 22.23.4, fokussierte Tests, Typecheck und Lint; reale Ergebnisse und offene Bindungen im M1-Handoff. Root besitzt zentrale Dokumente, veröffentlicht Bytes und entscheidet allein über Review, Ready und Merge. Der Autor stoppt nach Lieferung. #917 darf weder wiederholt noch umformuliert, delegiert oder an einen menschlichen Alternativoperator umgeleitet werden; #1131 STOP und #1135-Abgrenzung bleiben bestehen.

## R2 nach gemeinsamem Discovery-Vertrag

Der aktuelle Seed ist `c3397ffe3bace3c63a3c347a63b3671f2f818281`; S0-R3 `ab26914ff01dde64020879b9e41cea8b1e1738aa` ersetzt den früheren Entwicklungspin. Zusätzlich zur expliziten Regelqueue gibt es die getrennte Combination-Discoveryqueue mit ausschließlich Ziel, einer Staatsangehörigkeit und Methode. Beide benutzen dieselbe begrenzte Lifecycle-/CAS-/Lease-Implementierung, behalten jedoch getrennte S0-Namespaces und Ergebnisarten. Ein Discovery-Erfolg ist nur ein bestätigtes untrusted Ergebnis; anschließende kontextbezogene Vorschläge müssen durch I1. Jeder tatsächliche Queue-Mutationspunkt verlangt aktuelle Methoden-Nachprüfung; ein alter Enqueue-Receipt wird vor erneutem ACK gegen den wirklichen aktuellen Jobrecord gelesen.

## Review R1

Root fand vier tatsächliche späte Await-Races im Versionspfad. Der bestätigte enge Fixplan steht in `M1_REVIEW_R1_FIX_PLAN.md`; `M1_CONTRACT.md` beschreibt die neue obligatorische gemeinsame atomare Commit-/Current-Confirmation-Grenze. Historisches `confirm` und eine Vorab-Headlesung reichen ausdrücklich nicht. Der spätere Adapter muss tatsächliche Methoden-/Proof-/Headzustände und Enduhr/rechtliches Datum unter derselben Sperre prüfen; ohne ihn bleibt der Pfad vor Writes unsupported. Keine produktive Bindung wurde ergänzt.

## Review R2 — Claim-Replay

Root reproduzierte eine unzulässige Übernahme der neuen Leasegeneration durch einen alten Claim-Replay, wenn ein Reclaim dieselbe Lease-ID benutzte. Der bestätigte enge Fixplan steht in `M1_REVIEW_R2_FIX_PLAN.md`. Claim bestätigt jetzt nur seinen vollständig identischen, tatsächlich zu dieser Operation gespeicherten Erwerbsrecord. Enqueue behält aktuelle ACKs. Beide Namespaces, Lost-ACK und Reclaim vor erster ACK-Rückkehr sind regressiert; R1-Recoverycode und dessen Tests bleiben bytegleich.
