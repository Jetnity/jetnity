# U1 — Selbstprüfung und Übergabe R3

## Status und exakte Basis

**Implementierung zur unabhängigen TL-Prüfung geliefert; UI-Abnahme und Integration offen. Kein Ready-/Merge-/Aktivierungs-PASS. STOP.**

Autor: **Jetnity Official Truth V3 Visitor Cache 1 — Codex Generation 1**, tatsächliche Session `/root/v3_visitor_writer`, kein Cursor-Agent. Datum: 9. November 2026. Auftrag #1162, Draft #1165, `U1_TASK_V1.md` + `U1_TASK_R2.md` + `U1_TASK_R3.md`; Root-Kommentar 6729484014 und anschließend ausdrückliche Planbestätigung.

Worktree: `official-truth-v3-visitor`; Branch `feat/official-truth-v3-visitor-cache-1-20261109`. Root veröffentlichte R2 einschließlich des unveränderten damaligen Manifests plus R3-Task auf **`2489eb19ea16308e5d84ec96bada3edc09a76688`**, Tree `c9b91a783c6fd714e01c7cd55909bb2e9d433676`. Die jetzigen R3-Änderungen liegen uncommittet auf dieser Basis. Kein eigener Commit, Push, GitHubwrite, Ready, Merge oder Folgeslice. Jeder später von Root veröffentlichte Head braucht seine eigenen Gates. Die R2-Übergabe bleibt im veröffentlichten Basiscommit nachvollziehbar.

Gemeinsamer S0-R3-Pin: `ab26914ff01dde64020879b9e41cea8b1e1738aa`. SHA256 der unveränderten `contract.ts`: `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4`. S0 wurde nur gelesen. Root bestätigte die Weiterarbeit nach dessen eigenem Review. Diese Selbstprüfung ersetzt dieses oder ein zukünftiges TL-Review nicht.

## Konkret geliefert

`visitor/query.ts` implementiert eine server-only Projektionsvorbereitung und eine ruhende Query-Orchestrierung. Cachelesung unterscheidet echte Leere und Fehler, bindet vollständigen Kontext/Fakt/Methode, prüft aktuelle Original-/Versions-/Decision-/Evidence-Proofs und bestätigt alle positiven Kandidaten zusammen mit der Methode in einem finalen atomaren Port. Quellenstand und Quelle werden unverfälscht aus dem exakten kanonischen Pin ausgegeben. Fristablauf während Await, Withdraw, Conflict, falsche Bytes/Pointer oder widerrufene Methode entfernen positive Inhalte.

Bekannter Regel-Miss verwendet einen separaten Regelqueue-Port. Erfolgreich leere Coverage verwendet seit TASK R2 einen eigenen neutralen Discovery-Port. Letzterer erhält nur Zielland, eine Staatsangehörigkeit und Methode; kein Pass, Reisezweck oder RuleContext wird erfunden. Pending erfordert einen echten, passenden, aktiven S0-Queue-ACK. Lost ACK, vertauschte Jobart, falsches Paar/Methode und Lesefehler werden nicht als laufende Recherche ausgegeben. M1 bestätigte das identische Eingabeformat; produktive Adapter und E1-Verbindung bleiben ungebunden.

`visitor/presentation.ts` zeigt vollständige Bedingungen und Verzweigungen, Schema-2-Aufenthalt und Ereignisfristen, Originalquellenzeit, amtlichen Namen/Link, Gültigkeit und Revision. Vorhandene Länder-, Requirement-, Visa- und Aktionsbezeichnungen werden verwendet. Keine persönliche Einreisezusage, automatische Passwahl oder Kürzung von Regeln.

`visitor/controller.ts` und die echte `OfficialTruthVisitorV3` bieten Leer-/Lade-/Fehler-/Accepted-/Pending-/Conflict-/Unavailable-Zustände, getrennte Staatsangehörigkeiten, neue Auswahl mit sofortiger Leerung alter Ergebnisse, Abort-/Generation-Schutz und geplanten Fokus/Statusansagen. Es gibt keinen öffentlichen Next-Einstieg und keine produktive Transportbindung. Die Browserkomponente importiert nur reine Anzeige-/Controllerlogik und S0-Typen, keine serverseitigen Proofmodule.

**R3 ergänzt automatisches Nachlesen:** Ein bestätigt laufender Rechercheauftrag löst über denselben Querypfad bis zu sechs weitere Abfragen aus, Backoff 2/4/8/16/30/45 Sekunden, harte Grenze 120 Sekunden. Keine Überlappung; Wechsel, Unmount, manuelle neue Abfrage oder terminale Ergebnisse stoppen die Serie. Alte positive Aussagen werden weder während Nachprüfung als Fallback angezeigt noch über ihren Projektionsablauf verlängert. Die Anzeige erhält dazu `generatedAt` und unverändertes `expiresAt`, zieht die gesamte Requestdauer von der serverseitigen Restdauer ab und setzt lokale Ablaufhinweise. Ergebnisrahmen/Pending bleiben stehen; automatische Wechsel stehlen keinen Fokus. Nach Budgetende ehrlicher Hinweis und vorhandene manuelle Abfragemöglichkeit. Kein S0- oder Methoden-/Queue-Vertrag wurde geändert.

Der isolierte Harness benutzt die echte Komponente, den echten Query-/Presenterpfad und ausdrücklich synthetische In-Memory-Adapter. Er bindet ausschließlich Loopback, fordert einen lokalen synthetischen Browserheader an, begrenzt JSON auf 4096 Bytes und lädt keine externen Ressourcen. Er verwendet vorhandenes esbuild aus tsx, Tailwind/PostCSS und Playwright. Keine neue Abhängigkeit, Lockfileänderung oder neue App-Route. `--smoke` prüft tatsächlich die lokale HTTP-Komposition; das ist keine visuelle Browserabnahme.

**R3 ergänzt den isolierten CI-Job:** `.github/workflows/ci.yml` erhält ausschließlich den neuen `official_truth_v3_ui`-Job plus dessen strikte Pflicht im bestehenden Aggregat. Alter `verify`, `persisted_native`, `refresh_native`, `accepted_store_native` und `auth-konfiguration` wurden byteweise gegen die Basis verglichen: unverändert. Keine Secret-/Auth-/DB-/Provideranbindung. Der Browser wird vorher aus den drei festgelegten Systempfaden gewählt und genau einmal mit `chromiumSandbox: true` gestartet; kein Launch-Fallback oder Download. Prüfberichte/PNG-Artefakte tragen Checkout-/Quell-Head und Runbindung, Fehler werden als Fehler gesichert. CI ist hier vorbereitet, noch nicht ausgeführt oder als bestanden behauptet.

## Ausgeführte Prüfungen

Runtime: Node `v22.23.4`, konkret `/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node`. Die von Root bereitgestellte Dependencyinstallation wurde verwendet; kein eigener `npm ci`- oder Installations-PASS behauptet.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| U1-Node-Tests und isolierter CI-Vertrag | **47/47 PASS**, 6 Suites, 0 Fail/Skip/Cancel/Todo; Gesamtlauf 1444,732092 ms. Enthält 43 U1-Tests und 4 CI-/Browser-Vertragstests. |
| Repository-TypeScript `tsc --noEmit --incremental false --pretty false` | **PASS, Exit 0** nach letzten Code-/Testkorrekturen. |
| Harness-TypeScript `tsc -p scripts/official-truth-product-v3-ui/tsconfig.json --noEmit --incremental false --pretty false` | **PASS, Exit 0**. |
| ESLint auf Komponente, allen U1-TS-Dateien und Harness-TS/TSX/MJS | **PASS, Exit 0**, keine eigenen Lintbefunde. |
| Browserbundle und Tailwind-CSS | **Gebaut**; Metafileprüfung enthält keine Query-/Testfixture-/S0-Contract-/Content-Identity-Runtime im Clientbundle. |
| Loopback-HTTP-Smoke | **PASS**, sechs Fälle: bisherige Mixed-/Discovery-/Fehler-/Unbound-Fälle und echte synthetische Serverabfolge Pending→Accepted nach kontrollierter Cachebefüllung; fehlender synthetischer Header mit 403 abgewiesen. |
| YAML/striktes Aggregat | **PASS**: alle fünf Needs geprüft, Success positiv, jede der fünf Familien einzeln mit failure/cancelled/skipped negativ; 15 Negativfälle. Alte vier Jobfamilien + Auth bytegleich. |
| Chromium-UI-Audit | R2 lokal **BLOCKIERT/FAIL vor Browserstart**. In R3 bewusst **nicht erneut lokal gestartet**, 0 neue Browserinteraktionen/PNGs. Tatsächlicher CI-Lauf und visuelle Prüfung offen. |
| Production-Build, vollständige Repo-Hygiene/CI/Preview/Real Device | **Hier nicht ausgeführt**, bleiben TL-/Integrationsgates. |

Die Tests prüfen echte Orchestrierung mit separater privater Methoden-/Receiptidentität im Testadapter, Bindungs-/Hash-Manipulation, finalen Methodenwiderruf, Fristwechsel während Await, falsche Quellpins, unterschiedliche Kontexte derselben Staatsangehörigkeit, Regel- und Discovery-Dedup, Lost ACK, Fehler/Leere, PII-Abweisung sowie Abbruch und veraltete Clientantworten. Neun neue deterministische Polltests prüfen Pending→Accepted/Conflict, alle Backoffs, maximal sechs Folgeabfragen, Deadline während In-flight, Timeout, Wechsel/Unmount, keine Überlappung und keine verlängerte positive Anzeige. Darstellungs-Konformanztests decken sämtliche Schema-2-Aufenthaltsfelder, Otherwise-Zweige, Pflicht-/Empfehlungsfristen und unabhängige Visaoptionen ab. Die Darstellungstests sind keine Authority- oder Cache-Publikationsbelege. Browserauswahltests prüfen ausschließlich Pfad-/Ausführbarkeitsvorbedingungen und starten keinen Browser.

### Tatsächliche lokale Leistungsmessung

Gemessen wurde **nur ein einzelner Node-Prozess mit einem vorbereiteten Cachetreffer für eine Zelle und synthetischen In-Memory-Ports**. 20 Warmups, 200 Messungen, keine Jobs erzeugt:

| Messwert | Ergebnis |
| --- | ---: |
| p50 | 3,483409 ms |
| p95 | 6,727277 ms |
| Maximum | 7,834758 ms |

Das belegt weder öffentliche End-to-End-Latenz noch DB-, Netzwerk-, Regionen-, Cold-Start-, Last- oder Browserrenderkosten. Das Produktziel **öffentlich p95 < 1 s bleibt unbewiesen**. Die Query begrenzt ihre Portkoordination auf 750 ms; das ist kein gemessenes öffentliches SLO. Echte Adapter müssen ihre Abortsignale/Timeouts selbst einhalten.

### Fehlversuche und offene Browsergrenze

Während Implementierung wurden Typnarrowing, fehlende Schema-2-Darstellungstypen, eine Testfixture mit falschem Visa-Enum und eine Flaggen-sensitive Assertion korrigiert; abschließende Tests/Typechecks sind oben belegt. Der erste Harnessstart scheiterte an ESM/CJS-Interop des synthetischen Servermoduls; der Import wurde korrigiert und der echte HTTP-Smoke lief danach erfolgreich.

Im historischen R2-Lauf waren Playwrights eigener Chromium-Cache und Chrome nicht installiert. Das vorhandene `/usr/bin/chromium` wurde anschließend regulär ausprobiert; der Start scheiterte an `socket() failed: Operation not permitted` und `ptrace: Operation not permitted`. Danach keine Startvarianten zur Umgehung, keine Installation, keine Sandbox-/Rechteeskalation und keine behaupteten Screenshots. Root prüfte reguläre Browserwerkzeuge ebenfalls ohne erreichbaren Harness und beauftragte deshalb ausdrücklich R3-CI. In R3 fand kein weiterer lokaler Browserstart statt. Der neue eine Launch samt aktivierter Sandbox muss in regulärer CI erst tatsächlich ausgeführt werden.

Ein erster rein textueller Vergleich der alten Workflowblöcke meldete irrtümlich eine Änderung an `accepted_store_native`, weil der Vergleichsregex die Ziffer in `official_truth_v3_ui` nicht als Jobgrenze erkannte. Der korrigierte Regex bestätigte die vier alten Familien und Auth bytegleich; am Workflow wurde dafür nichts geändert. Root meldete getrennte alte S0-Importer-Inventarfehler in vollständiger CI; diese Dateien wurden nicht verändert und liegen beim ursprünglichen S0-Autor. Der neue synthetische Serverimport `readV3VisitorInput` wurde Root für den späteren seriellen Inventarabgleich ausdrücklich gemeldet.

Umgebungswarnungen: vorhandene Browserslist-Daten sind laut Build 14 Monate alt; der vorhandene EnvHttpProxyAgent meldet eine experimentelle API. Keine Dependencyaktualisierung außerhalb dieses Tasks. Diese Warnungen sind kein Testskip.

## Reproduzierbare Befehle

Im U1-Worktree mit Node 22 im PATH:

```bash
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/visitor/*.test.ts scripts/official-truth-product-v3-ui/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false
node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false -p scripts/official-truth-product-v3-ui/tsconfig.json
node node_modules/eslint/bin/eslint.js components/readiness/OfficialTruthVisitorV3.tsx lib/readiness/official-truth-product-v3/visitor/*.ts scripts/official-truth-product-v3-ui/*.tsx scripts/official-truth-product-v3-ui/*.ts scripts/official-truth-product-v3-ui/*.mjs
node scripts/official-truth-product-v3-ui/evidence.mjs --initialize
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/benchmark.ts
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/run.mjs --smoke
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/run.mjs --serve
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/run.mjs
```

`evidence.mjs --initialize` ersetzt ausschließlich das feste ignorierte Ausgabe-Verzeichnis dieses Harness und schreibt Runbindung sowie `audit: not_started`. `--serve` gibt eine zufällige `http://127.0.0.1:<port>`-Adresse aus und bleibt bis SIGINT/SIGTERM aktiv. Der Befehl ohne Flag ist in der bekannten lokalen Umgebung nicht erneut auszuführen; regulärer Browser-/CI-Zugang ist erforderlich. Keine anderen Flags/Rechte als Umgehung. Der Audit ist für Breiten 280/320/360/375/390/430/768/1280, Querformat 844×390 und Textvergrößerung 200 % vorbereitet. Zusätzlich prüft er montiert Pending→Accepted, fehlenden erneuten Ladebildschirm und unveränderten Nutzerfokus mit kontrollierter Playwright-Uhr. Diese Browser-/Layoutfälle sind noch nicht ausgeführt und keine Gerätemessung.

Lokale, ignorierte R3-Ausgaben: `test-results/official-truth-product-v3-ui/http-smoke.json`, `benchmark.json`, `run-binding.json`, `audit.json`, `bundle-inputs.json`. Die Initialisierung schreibt `audit.json` ausdrücklich als `not_started`, da R3 lokal keinen Browser erneut startete. Die neuen Artefakte nennen Basis-HEAD `2489eb19ea16308e5d84ec96bada3edc09a76688` mit `worktreeDirty: true` und ohne CI-Run-ID; kein veröffentlichter Exact-Head-Beleg. Keine neuen PNGs. Das Repository persistiert Befehle, Ergebniszusammenfassung und offene Gates; diese transienten Dateien sind kein unabhängiger TL-Beleg.

## Grenzen, Risiken und nächste konkrete Handlung

**Datenbank/Security/Kosten:** keine Migration, RLS, ACL, Auth, Supabase, Secrets, Provider, echte amtliche Recherche, Worker, Scheduler oder Production-Aktion. Keine neuen laufenden Kosten. #917-Readback wurde weder wiederholt noch umformuliert/delegiert/an Menschen umgeleitet. #1131 STOP, #1135 separat und #968 Preview-Sensitivität bleiben erhalten.

**P0:** kein eingeführter aktueller Live-Eingriff. **P1-Aktivierungsgates:** alle produktiven Ports und die Methode bleiben ungebunden; positive Aussagen erfordern tatsächliche Current-/Batch-Proofs und atomare M1-ACKs in E1. Ohne diese Bindungen keine automatische Freigabe/Recherche behaupten. **P2:** unabhängige UI-/Mobile-/Tastatur-/Device-Abnahme, vollständige Build-/Hygiene-/CI-/Preview-Gates, Transportdecodierung und reales öffentliches p95 fehlen. Begrenztes Polling ist implementiert und lokal kontrolliert getestet; der echte produktive M1-/E1-Abschluss bleibt ungebunden und der montierte Browserbeleg muss erst aus CI kommen. **P3:** bestehende Tooling-Warnungen wie oben.

Root soll nun die im `U1_MANIFEST.md` gehashten Dateien unabhängig reviewen, die offenen regulären UI-Gates prüfen und später E1 auf die bestätigten M1-Ports binden. Erst Root entscheidet Publish/Ready/Merge, alle besonderen Owner-Gates bleiben. Vollständige Portpflichten stehen in `U1_CONTRACT.md`.

**STOP bestätigt.** Kein Folgeslice und keine eigenständige Veröffentlichung. Unmittelbare Review-Fixes bleiben in derselben Session möglich.
