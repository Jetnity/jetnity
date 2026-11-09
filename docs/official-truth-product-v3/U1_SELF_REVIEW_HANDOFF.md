# U1 — Selbstprüfung und Übergabe V1 / TASK R2

## Status und exakte Basis

**Implementierung zur unabhängigen TL-Prüfung geliefert; UI-Abnahme und Integration offen. Kein Ready-/Merge-/Aktivierungs-PASS. STOP.**

Autor: **Jetnity Official Truth V3 Visitor Cache 1 — Codex Generation 1**, tatsächliche Session `/root/v3_visitor_writer`, kein Cursor-Agent. Datum: 9. November 2026. Auftrag #1162, Draft #1165, `U1_TASK_V1.md` + `U1_TASK_R2.md`.

Worktree: `official-truth-v3-visitor`; Branch `feat/official-truth-v3-visitor-cache-1-20261109`. Von Root integrierte Basis/HEAD: `851876cafa78480fa5a405fcd7251ac827660b6b`. Alle hier beschriebenen U1-Änderungen wurden als uncommittete Dateien an Root übergeben. Kein eigener Commit, Push, GitHubwrite, Ready, Merge oder Folgeslice. Jeder später von Root veröffentlichte Head braucht seine eigenen Gates.

Gemeinsamer S0-R3-Pin: `ab26914ff01dde64020879b9e41cea8b1e1738aa`. SHA256 der unveränderten `contract.ts`: `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4`. S0 wurde nur gelesen. Root bestätigte die Weiterarbeit nach dessen eigenem Review. Diese Selbstprüfung ersetzt dieses oder ein zukünftiges TL-Review nicht.

## Konkret geliefert

`visitor/query.ts` implementiert eine server-only Projektionsvorbereitung und eine ruhende Query-Orchestrierung. Cachelesung unterscheidet echte Leere und Fehler, bindet vollständigen Kontext/Fakt/Methode, prüft aktuelle Original-/Versions-/Decision-/Evidence-Proofs und bestätigt alle positiven Kandidaten zusammen mit der Methode in einem finalen atomaren Port. Quellenstand und Quelle werden unverfälscht aus dem exakten kanonischen Pin ausgegeben. Fristablauf während Await, Withdraw, Conflict, falsche Bytes/Pointer oder widerrufene Methode entfernen positive Inhalte.

Bekannter Regel-Miss verwendet einen separaten Regelqueue-Port. Erfolgreich leere Coverage verwendet seit TASK R2 einen eigenen neutralen Discovery-Port. Letzterer erhält nur Zielland, eine Staatsangehörigkeit und Methode; kein Pass, Reisezweck oder RuleContext wird erfunden. Pending erfordert einen echten, passenden, aktiven S0-Queue-ACK. Lost ACK, vertauschte Jobart, falsches Paar/Methode und Lesefehler werden nicht als laufende Recherche ausgegeben. M1 bestätigte das identische Eingabeformat; produktive Adapter und E1-Verbindung bleiben ungebunden.

`visitor/presentation.ts` zeigt vollständige Bedingungen und Verzweigungen, Schema-2-Aufenthalt und Ereignisfristen, Originalquellenzeit, amtlichen Namen/Link, Gültigkeit und Revision. Vorhandene Länder-, Requirement-, Visa- und Aktionsbezeichnungen werden verwendet. Keine persönliche Einreisezusage, automatische Passwahl oder Kürzung von Regeln.

`visitor/controller.ts` und die echte `OfficialTruthVisitorV3` bieten Leer-/Lade-/Fehler-/Accepted-/Pending-/Conflict-/Unavailable-Zustände, getrennte Staatsangehörigkeiten, neue Auswahl mit sofortiger Leerung alter Ergebnisse, Abort-/Generation-Schutz und geplanten Fokus/Statusansagen. Es gibt keinen öffentlichen Next-Einstieg und keine produktive Transportbindung. Die Browserkomponente importiert nur reine Anzeige-/Controllerlogik und S0-Typen, keine serverseitigen Proofmodule.

Der isolierte Harness benutzt die echte Komponente, den echten Query-/Presenterpfad und ausdrücklich synthetische In-Memory-Adapter. Er bindet ausschließlich Loopback, fordert einen lokalen synthetischen Browserheader an, begrenzt JSON auf 4096 Bytes und lädt keine externen Ressourcen. Er verwendet vorhandenes esbuild aus tsx, Tailwind/PostCSS und Playwright. Keine neue Abhängigkeit, Lockfileänderung oder neue App-Route. `--smoke` prüft tatsächlich die lokale HTTP-Komposition; das ist keine visuelle Browserabnahme.

## Ausgeführte Prüfungen

Runtime: Node `v22.23.4`, konkret `/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node`. Die von Root bereitgestellte Dependencyinstallation wurde verwendet; kein eigener `npm ci`- oder Installations-PASS behauptet.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| U1-Node-Tests `visitor/*.test.ts` | **34/34 PASS**, 5 Suites, 0 Fail/Skip/Cancel/Todo; letzter Gesamtlauf 1136,904717 ms. |
| Repository-TypeScript `tsc --noEmit --incremental false --pretty false` | **PASS, Exit 0** nach letzten Code-/Testkorrekturen. |
| Harness-TypeScript `tsc -p scripts/official-truth-product-v3-ui/tsconfig.json --noEmit --incremental false --pretty false` | **PASS, Exit 0**. |
| ESLint auf Komponente, allen U1-TS-Dateien und Harness-TS/TSX/MJS | **PASS, Exit 0**, keine eigenen Lintbefunde. |
| Browserbundle und Tailwind-CSS | **Gebaut**; Metafileprüfung enthält keine Query-/Testfixture-/S0-Contract-/Content-Identity-Runtime im Clientbundle. |
| Loopback-HTTP-Smoke | **PASS**: DE/CH accepted + DE/RS pending; FR/CH + FR/RS Discovery pending; Cachefehler error/error; unbound unavailable/unavailable; fehlender synthetischer Header mit 403 abgewiesen. |
| Chromium-UI-Audit | **BLOCKIERT/FAIL vor Browserstart**, 0 Layouts, 0 Browserinteraktionen, 0 Screenshots. Kein visueller PASS. |
| Production-Build, vollständige Repo-Hygiene/CI/Preview/Real Device | **Hier nicht ausgeführt**, bleiben TL-/Integrationsgates. |

Die Tests prüfen echte Orchestrierung mit separater privater Methoden-/Receiptidentität im Testadapter, Bindungs-/Hash-Manipulation, finalen Methodenwiderruf, Fristwechsel während Await, falsche Quellpins, unterschiedliche Kontexte derselben Staatsangehörigkeit, Regel- und Discovery-Dedup, Lost ACK, Fehler/Leere, PII-Abweisung sowie Abbruch und veraltete Clientantworten. Darstellungs-Konformanztests decken sämtliche Schema-2-Aufenthaltsfelder, Otherwise-Zweige, Pflicht-/Empfehlungsfristen und unabhängige Visaoptionen ab. Die Darstellungstests sind keine Authority- oder Cache-Publikationsbelege.

### Tatsächliche lokale Leistungsmessung

Gemessen wurde **nur ein einzelner Node-Prozess mit einem vorbereiteten Cachetreffer für eine Zelle und synthetischen In-Memory-Ports**. 20 Warmups, 200 Messungen, keine Jobs erzeugt:

| Messwert | Ergebnis |
| --- | ---: |
| p50 | 3,451070 ms |
| p95 | 7,004183 ms |
| Maximum | 9,297874 ms |

Das belegt weder öffentliche End-to-End-Latenz noch DB-, Netzwerk-, Regionen-, Cold-Start-, Last- oder Browserrenderkosten. Das Produktziel **öffentlich p95 < 1 s bleibt unbewiesen**. Die Query begrenzt ihre Portkoordination auf 750 ms; das ist kein gemessenes öffentliches SLO. Echte Adapter müssen ihre Abortsignale/Timeouts selbst einhalten.

### Fehlversuche und offene Browsergrenze

Während Implementierung wurden Typnarrowing, fehlende Schema-2-Darstellungstypen, eine Testfixture mit falschem Visa-Enum und eine Flaggen-sensitive Assertion korrigiert; abschließende Tests/Typechecks sind oben belegt. Der erste Harnessstart scheiterte an ESM/CJS-Interop des synthetischen Servermoduls; der Import wurde korrigiert und der echte HTTP-Smoke lief danach erfolgreich.

Playwrights eigener Chromium-Cache und Chrome waren nicht installiert. Das vorhandene `/usr/bin/chromium` wurde anschließend regulär ausprobiert; der Start scheiterte an `socket() failed: Operation not permitted` und `ptrace: Operation not permitted`. Danach keine Startvarianten zur Umgehung, keine Installation, keine Sandbox-/Rechteeskalation und keine behaupteten Screenshots. Root wurde informiert und bestätigte, dass die Browsergrenze offen zu dokumentieren ist. Root prüft die Verfügbarkeit über reguläre Browserwerkzeuge separat.

Umgebungswarnungen: vorhandene Browserslist-Daten sind laut Build 14 Monate alt; der vorhandene EnvHttpProxyAgent meldet eine experimentelle API. Keine Dependencyaktualisierung außerhalb dieses Tasks. Diese Warnungen sind kein Testskip.

## Reproduzierbare Befehle

Im U1-Worktree mit Node 22 im PATH:

```bash
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/visitor/*.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false
node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false -p scripts/official-truth-product-v3-ui/tsconfig.json
node node_modules/eslint/bin/eslint.js components/readiness/OfficialTruthVisitorV3.tsx lib/readiness/official-truth-product-v3/visitor/*.ts scripts/official-truth-product-v3-ui/*.tsx scripts/official-truth-product-v3-ui/*.ts scripts/official-truth-product-v3-ui/*.mjs
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/benchmark.ts
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/run.mjs --smoke
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/run.mjs --serve
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/run.mjs
```

`--serve` gibt eine zufällige `http://127.0.0.1:<port>`-Adresse aus und bleibt bis SIGINT/SIGTERM aktiv. Der Befehl ohne Flag benötigt einen regulär verfügbaren Chromium-Prozess. Kein Wechsel von Flags oder Rechten zur Umgehung der beschriebenen Umgebungsgrenze. Der Audit ist für Breiten 280/320/360/375/390/430/768/1280, Querformat 844×390 und Textvergrößerung 200 % vorbereitet. Diese Layoutfälle wurden noch nicht ausgeführt.

Lokale, ignorierte Ausgaben: `test-results/official-truth-product-v3-ui/http-smoke.json`, `audit.json`, `bundle-inputs.json`. `audit.json` enthält den tatsächlichen Browserstartfehler; keine PNGs existieren aus diesem Lauf. Das Repository persistiert Befehle, Ergebniszusammenfassung und offene Gates; diese transienten Dateien sind kein unabhängiger TL-Beleg.

## Grenzen, Risiken und nächste konkrete Handlung

**Datenbank/Security/Kosten:** keine Migration, RLS, ACL, Auth, Supabase, Secrets, Provider, echte amtliche Recherche, Worker, Scheduler oder Production-Aktion. Keine neuen laufenden Kosten. #917-Readback wurde weder wiederholt noch umformuliert/delegiert/an Menschen umgeleitet. #1131 STOP, #1135 separat und #968 Preview-Sensitivität bleiben erhalten.

**P0:** kein eingeführter aktueller Live-Eingriff. **P1-Aktivierungsgates:** alle produktiven Ports und die Methode bleiben ungebunden; positive Aussagen erfordern tatsächliche Current-/Batch-Proofs und atomare M1-ACKs in E1. Ohne diese Bindungen keine automatische Freigabe/Recherche behaupten. **P2:** unabhängige UI-/Mobile-/Tastatur-/Device-Abnahme, vollständige Build-/Hygiene-/CI-/Preview-Gates, Transportdecodierung und reales öffentliches p95 fehlen. Ein automatisch sichtbarer Abschluss-Push/Polling aus M1 ist nicht angebunden; aktuell erneute Abfrage. **P3:** bestehende Tooling-Warnungen wie oben.

Root soll nun die im `U1_MANIFEST.md` gehashten Dateien unabhängig reviewen, die offenen regulären UI-Gates prüfen und später E1 auf die bestätigten M1-Ports binden. Erst Root entscheidet Publish/Ready/Merge, alle besonderen Owner-Gates bleiben. Vollständige Portpflichten stehen in `U1_CONTRACT.md`.

**STOP bestätigt.** Kein Folgeslice und keine eigenständige Veröffentlichung. Unmittelbare Review-Fixes bleiben in derselben Session möglich.
