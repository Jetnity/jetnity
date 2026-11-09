# E1 — Implementierungsplan vor Code

Autor: **Jetnity Official Truth V3 Integration 1 — Codex Generation 1**, Session `/root/v3_integration_writer`. Draft #1167, [TASK V1 Entwicklungsstart](https://github.com/Jetnity/jetnity/pull/1167#issuecomment-6729830085), Seed `3f8c84239e1e847af4b63be6134db34854aa3914`. Dieser Plan wurde read-only gemeldet und von Root ausdrücklich bestätigt; diese Datei entsteht vor Runtime-Code.

## Eingangsgrenze

Root bindet die tatsächlich übertragenen S0/I1/U1/M1-Dateien in `E1_INPUT_SNAPSHOT_R1.json`. S0 `6b7beebd33a686d494a26cbda8a6311a51dc3450`, I1 `ae22ea79068a4946e68b08dc5a9b101fb3f55ab5`, U1 `b8a65f8b4d341768f69df01ba1ca96f8eba4ee14`. M1 ist vorläufig R1 und **CHANGES REQUIRED R2** (alte Claimoperation darf keine neue Reclaimgeneration übernehmen). Root ersetzt die finalen M1-Dateien später. Kein E1-PASS auf alter Queuebasis, keine eigene Queuekopie oder Korrektur. Beide zentralen Importerinventare sind Root/S0-Autor-owned.

## Konkrete Arbeit

- `integration/coordinator.ts`: ruhende tatsächliche Modulkomposition. U1 mit beiden echten M1-Queues; M1-Worker mit anschließendem tatsächlichem Artefaktabruf; neutrale Original-JSON-Textbytes durch I1; Prepared-Bündel durch M1; U1-Projektion und getrennte atomare Publish/Confirm-Grenze. Echter M1-Monitor und Recovery werden mit demselben Zustand verbunden.
- `integration/ports.ts`: nur äußere Custody-, atomare Projektionspublikations- und Eskalations-/Sperrgrenzen. Exakte Operation/Digest/Job/Fence/Resultbindung, nach Await gemeinsam aktueller Head/Methode/Original-/Archivproof/Enduhr. Kein serialisierter DTO-Status wird Autorität. Unknown nur auf derselben Operation bestätigen.
- `integration/test-support/**`: ausdrücklich synthetische .example-Originale, echte vorhandene Extraktionsfunktion, getrennte WeakMap-Receipts, gemeinsame mutexgeschützte lokale Testzustände. Keine positive Runtimeimplementierung eines dauerhaften Produktionsstores.
- `integration/coordinator.test.ts`: tatsächliche Module gemeinsam ausführen, keine I1-/M1-/U1-Doubles.
- Eigene Vertrags-, Handoff- und Manifestdateien; fremde Dateien bleiben read-only.

## Tests

Mehrfachstaatsbürgerschaft Miss→Discovery→Worker→I1→M1→U1/Präsentation; zwei anbieterneutrale Lieferanten; klare Primärquelle ohne zweite Quelle; gefälschte Custody/Digests/fremdes Paar; unbekannte Antworten/Replay ohne zweite Mutation; Konflikt/unklare Primärquelle→atomare Sperre und deduplizierte Outbox; sticky conflict auch ohne vorherige Accepted-Version; positive Auflösung und Wiederannahme; vollständige Archiv-Eskalationsbindung; tatsächlicher M1-Quellenmonitor→Queue; neue Refresh-/Recoveryversionen; Headwechsel/Methodenwiderruf/Ablauf an Publish/Read; PII-/Unknownkey-Verweigerung; geschlossener Produktionseinstieg.

Bei erstmals eskalierter Kombination ohne vorherige Projektion bleibt U1 ehrlich pending/unavailable; es wird kein angenommener Fakt erzeugt, um eine Konfliktkarte darzustellen. Die tatsächliche Eskalationscustody muss den Konflikt für spätere I1-Prüfungen erhalten.

Node22, tatsächliche gezielte Tests, TypeScript, ESLint/Hygiene und Hashnachweise. Erst nach Roots M1-R2-Transplant vollständige betroffene Gates erneut. Kein Browserstart, DB/SQL/Auth/RLS/ACL/Provider/Modell/Scheduler/Credential/Production-Zugriff. Kein #917-Retry oder Umweg. Kein Commit/Push/Ready/Merge/GitHubwrite. STOP nach finaler stabiler Lieferung; allein Root entscheidet über unabhängigen Review und Veröffentlichung.

## Tatsächliche Eingangssynchronisierung während der Umsetzung

Die anfängliche M1-R1-Warnung oben bleibt historische Evidence. Root übertrug danach die korrigierten M1-R2-Dateien; alle **17** Einträge in `E1_INPUT_SNAPSHOT_R2.json` wurden vom E1-Autor mit SHA-256 nachgerechnet, **0 Abweichungen**. Die tatsächliche aktuelle Queue hat SHA-256 `7d3930b9f24975b6a2f42fe1a486914a201650f5b8f51dc3fd17813c74de3985`. Der [TL Input-Amendment-Kommentar](https://github.com/Jetnity/jetnity/pull/1167#issuecomment-6729887972) wurde vollständig gelesen. Root veröffentlichte M1 R2 anschließend als `40ca2f0348862bb763e8d42728418bda4c63405f`; der Runtime-Code blieb bei dieser Veröffentlichung unverändert.

Root synchronisierte außerdem U1 R4 aus `20a4e497a4a23c7aa972d13352c155729f95a7ab` (Testfallbeschriftung im Browserharness und Dokumente, Query-APIs unverändert) sowie I1 R3 aus `63b97e8ab6139c38746aaaa4caa4054c83219b1d` (Foundation-Guard und Dokumente, I1-Runtime unverändert). Der E1-Autor änderte keine dieser Eingangsdateien. U1-Browsergate und drei zentrale Importerinventare sind separate Root-Gates; der E1-Testkorpus ersetzt sie nicht.

Die konkrete Testmatrix wurde um verlorene Queue-ACKs auf derselben Operation, vollständige Artefakt-Fences, accessorfreie Uploadarrays, korrupte Resume-Datensätze, zwei konkurrierende echte I1-Prepareds und Änderungen im letzten Await vor atomarer Publikation ergänzt. Synthetische Monitor-Receipts binden den tatsächlichen Plan und Originalepoch; konkurrierende identische Suppressionsaufrufe werden unter derselben Sperre dedupliziert. Endgültige Ergebnisse und Dateipins stehen in `E1_SELF_REVIEW_HANDOFF.md` und `E1_MANIFEST.md`.
