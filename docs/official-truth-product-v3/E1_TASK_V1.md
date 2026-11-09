# E1 — tatsächliche V3-Modulkomposition, TASK V1

Programm [#1162](https://github.com/Jetnity/jetnity/issues/1162), ausdrücklich vom Owner beauftragte Code-/Test-/PR-Umsetzung ohne Datenbank- oder Production-Aktivierung. Autor **Jetnity Official Truth V3 Integration 1 — Codex Generation 1**, tatsächliche Session `/root/v3_integration_writer`. Root bleibt einziger Technical Lead und allein für Publish, unabhängiges PASS, Ready und Merge zuständig.

## Vor Implementierung geprüfte Eingangsbytes

- S0 `6b7beebd33a686d494a26cbda8a6311a51dc3450`, Runtime-SHA256 `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4`.
- I1 `ae22ea79068a4946e68b08dc5a9b101fb3f55ab5`; Root185/185 inklusive exakter Inventare und sechs zusätzliche Archiv-/Replayproben. Vollständige CI bleibt eigenes Gate.
- U1 stabile R3-Lieferung auf `2489eb19ea16308e5d84ec96bada3edc09a76688`, `U1_MANIFEST.md` SHA256 `b891af2eed7c5e32eb4daa37128403fe4c1c2c4abda78a8ed2d7e326dbf23a84`, alle20Dateipins von Root nachgerechnet, Root47/47Tests. Browser-/CI-Abnahme offen; S0-Guardautor ergänzt exakte vorhandene Importer.
- M1 stabile R1-Lieferung auf `c3397ffe3bace3c63a3c347a63b3671f2f818281`, `M1_FILE_MANIFEST.md` SHA256 `4317d097651b22e0c0afcfade9d9d4650eb9f74323049b74eac9a64faca10a75`, alle15Dateipins vonRoot nachgerechnet. Root121/121Tests und vier zusätzliche zuvor rote Await-Proben bestanden; volle CI/Inventare und unterstützendes Review offen.

Diese Pins sind Entwicklungsgrundlagen, keine Produktionsautorität oder Readyfreigabe. Root überträgt exakt diese Bytes in den separaten E1-Worktree und synchronisiert anschließend die tatsächlichen finalen Branchparents. Jeder geänderte Input braucht neue passende Gates; keine stillschweigende Übernahme eines alten PASS.

## Bestätigter Implementierungsplan und Ownership

Der Autor meldete diesen Plan vor jedem Write; Root bestätigt ihn mit diesem versionierten Auftrag. Schreibrechte ausschließlich:

- `lib/readiness/official-truth-product-v3/integration/coordinator.ts`
- `lib/readiness/official-truth-product-v3/integration/ports.ts`
- `lib/readiness/official-truth-product-v3/integration/coordinator.test.ts`
- `lib/readiness/official-truth-product-v3/integration/test-support/**` für ausdrücklich synthetische Original-/Store-/Fixtureadapter
- `docs/official-truth-product-v3/E1_IMPLEMENTATION_PLAN.md`, `E1_CONTRACT.md`, `E1_SELF_REVIEW_HANDOFF.md`, `E1_MANIFEST.md`.

S0/I1/U1/M1 und zentrale Guards/CI/Startup-/D0-/Architekturdokumente read-only. Nötige Schnittstellenkorrekturen gehen an Root und denselben ursprünglichen Autor; keine privaten Kopien oder Casts zum Umgehen.

## Konkretes Ergebnis

Baue einen wiederverwendbaren ruhenden serverseitigen Orchestrator, der die **tatsächlichen** bestehenden Module aufruft:

1. U1-Besucherquery mit echten M1 Regel- und neutralen Discoveryqueues verbinden. Nur bestätigter aktueller ACK wird pending; Fehler/unknown bleiben ehrlich. Destination und mehrere Staatsangehörigkeiten, keine Personen-/Passdaten.
2. M1 `runV3ResearchWorkerOnce` ausführen, anschließend tatsächlich aufbewahrte immutable Proposal-Textbytes über code-owned Custody öffnen. Vollständige Digest-/Job-/Operation-/Lease-/Paar-/Kontextbindung prüfen, dann I1 `createV3ImportCoordinator` benutzen. Ein Workerabschluss bleibt ein Rechercheergebnis, keine Regelannahme. Zwei synthetische Anbieter liefern dasselbe neutrale Format.
3. I1 prepared unverändert durch M1 `commitV3PreparedTransition` und dessen verpflichtende gemeinsame atomare aktuelle Bestätigung geben. Kein Schema2-zu-Legacy-Cast, kein Weglassen von Bedingungen. Anschließend echte U1-Projektion vorbereiten und über eine separate atomare Publish/Confirm-Grenze auf aktuellen Head, Methode, Originalproof, Archive und Enduhr binden. Ein M1-Erfolg ist allein kein Cache-Publikationsreceipt.
4. I1-Eskalation mit vollständiger Decision, previousDecision und archiveAppend sowie Operation/Digest atomar als Sperre, Prüfspur und deduplizierte Outbox erhalten. Keine Benachrichtigung versenden. Bekannte Konflikte wirken auch ohne vorherige Accepted-Version weiter; kein erfundener Context/kein positiver Cachefallback. Die UI darf eine erstmalig eskalierte Kombination ohne darstellbare Projektion ehrlich pending/unavailable halten; keinen angenommenen Fakt erfinden, um eine Konfliktkarte zu erzeugen.
5. Echten M1-Quellenmonitor mit derselben Queue und Sperr-/Projektionsstate verbinden; Änderungen der Quellbytes behaupten noch keine Regeländerung.
6. Recovery über echte neue geprüfte M1-Version plus neue U1-Projektion; kein Wiederanschalten eines alten Accepted-Flags.

Zusätzliche Ports sind nur für äußere tatsächliche Custody/dauerhafte Storage-/gemeinsame atomare Publikations-/Sperrgrenzen zulässig. Keine erneuten Doubles anstelle von I1/M1/U1. Positive Adapter bleiben ausschließlich synthetisch im Testunterverzeichnis; Receiptbindung und aktueller Zustand werden nach allen Waits unter derselben Sperre tatsächlich geprüft. Produktionsfactory vollständig unbound/geschlossen. Kein fertiger allgemein semantischer Rechtsparser und keine echte Quellenqualifikation vortäuschen.

## Verbindliche Testmatrix

Durchgehende echte Modulkomposition: Mehrfachstaatsbürgerschaft Miss→Discovery→Worker→I1→M1→U1/Präsentation; zwei neutrale Lieferanten; klare amtliche Pflichtquelle ohne zweiteQuelle; gefälschte Custody/Digests/fremdesPaar; LostACK/Replay ohneDoppelmutation; echte Konflikt-/Primärunklarentscheidung→Sperre+Outbox+keinpositivesPublic; stickyConflict plus positiveNeuprüfung/reaccept; vollständigerArchiv-Eskalationsreplay; Quellenhashänderung→echteM1Queue ohneRuleChangebehauptung; Refresh/Recovery mitneuerVersion; Konkurrenzhead/Methodwiderruf/Ablauf anPublish/Read; Privacy-/Unknownkey-Verweigerung und vollständig unbound Produktion.

Unbekannter Ausgang wird ausschließlich auf derselbenOperation bestätigt; keine neueID zur Umgehung. Sowohl positive echteKomposition als auch negativeAdapter-/Fencing-/Authorityfälle testen. KeineTests abschwächen oderbestehendeBudgets verlängern, nur konkreteRisiken prüfen. Node22, vollständige gezielteE1plusV3Tests, TypeScript/Lint/Hygiene und exakterManifest/Handoff; Root führt unabhängige Wiederholung/Review aus.

## Harte Grenzen und Übergabe

Keine DB/Hosted/SQL/Auth/RLS/ACL/Migration/Credentials/Provider-/Modell-/Scheduler-/Productionaktion, keine neue Infrastruktur/Kosten, keine öffentlicheNextRoute/Navigation, keinBrowserstart. Die spezifisch verweigerte #917-Prüfung weder wiederholen, umformulieren, delegieren noch über andereVerbindung oder Menschen ausführen. #1131ReadySTOP, #1135getrennt und #968Preview-/Ownergates bleiben. Datenbank-/Productionaktivierung erst nach Ownerfreigabe des tatsächlich reifen Devpakets und der konkreten Methode. Kein Ownerentscheid pro Regel.

Root publiziert; Autor macht keineCommits/Push/GitHubwrites, keinReady/Merge. Relevante Ergebnisse mit realenBefehlen, exaktenDateipins und ehrlichen unboundGrenzen in eigenemHandoff; STOP nach beauftragtemSlice. UnmittelbareReviewkorrekturen derselbeAutor/dieselbeSession. Kein automatischerFolgeslice.
