# U1 — Selbstprüfung und Übergabe R5

## Aktueller Status R5

**Enger responsiver Reviewfix geliefert; neuer tatsächlicher UI-CI-Lauf und unabhängige Abnahme offen. STOP. Kein Ready-/Merge-/Aktivierungs-PASS.**

Gleicher Autor **Jetnity Official Truth V3 Visitor Cache 1 — Codex Generation 1**, tatsächliche Session `/root/v3_visitor_writer`, kein Cursor-Agent. Auftrag: `U1_REVIEW_R5_TASK.md` und [#1165 Kommentar 6730040798](https://github.com/Jetnity/jetnity/pull/1165#issuecomment-6730040798). Basis-HEAD **`20a4e497a4a23c7aa972d13352c155729f95a7ab`**, Tree **`7c0aebdc53285a31637029e8a534711b35ceefe3`**, Branch `feat/official-truth-v3-visitor-cache-1-20261109`. Vor R5 war nur der von Root bereitgestellte Task untracked. `U1_REVIEW_R5_FIX_PLAN.md` wurde vor Code persistiert, von Root gelesen und ausdrücklich freigegeben.

## Tatsächlicher R5-Befund und Korrektur

Der neue reguläre Run **42545059046**, UI-Job **128928236799**, verwendete den sauberen Checkout **77096cfea008ee5164a834306ef9d0dcfec71293** für Source **20a4e497a4a23c7aa972d13352c155729f95a7ab**. Google Chrome **156.0.8078.79** startete einmal regulär sandboxed. Der R4-Label-/Tastaturablauf und die erste Mixed-Antwort inklusive Fokus, Originalquellenzeit und Bedingungen bestanden tatsächlich. Der frühere Labelbefund ist damit konkret nachgeprüft.

Die erste responsive Prüfung **mixed-280** scheiterte anschließend: Viewport **280 px**, Dokumentbreite **386 px**, Produkt-Selectbreiten **328,484375 px**. Null vollständige Layoutfälle bestanden. Autor las Task, Audit und Runbindung selbst und betrachtete den echten Screenshot in `official-truth-v3-analysis/u1-20a4-ci-ui/`. PNG-SHA256 selbst nachgeprüft: **`4bfc7a6c8a57b8f582db4e6a0f7ebd3b40b669eb84553b9ecbdbf71c843b3525`**. Root dokumentierte für Artifact 13642773993 den ZIP-SHA256 `53f20a75b5ae91aa9191222a8ac6cb09cf8aa895d4838651a43e2ec58a2ad539`.

Die Codeursache liegt in den impliziten `auto`-Spalten der lokalen verschachtelten Grids. `min-w-0` am Container hebt deren intrinsische Mindestgröße nicht auf; die ungetrennte Überschrift zieht das äußere Grid breit. `break-words` bedeutet im installierten Tailwind `overflow-wrap: break-word` und senkt diese intrinsische Mindestgröße nicht. LandFeld selbst hat bereits minimale Breite null und volle begrenzte Breite; seine zu großen Selects folgen der zu großen Spur. Die vorhandenen Country- und globalen CSS-Dateien wurden gelesen und bleiben unverändert.

**Einzige Codeänderung:** `components/readiness/OfficialTruthVisitorV3.tsx`. Lokale einspaltige Grids definieren jetzt `minmax(0, 1fr)` über `grid-cols-1`; die vorhandene Desktop-Zeile behält ihre zweispaltige Form. Lokale Wrapper und die Legende können innerhalb der Spalte schrumpfen, Buttons und Links bleiben maximal containerbreit. Die Section vererbt `overflow-wrap: anywhere`; bisherige einzelne `break-words`-Overrides sind entfernt. Mehrzeilige Beschriftungen bleiben vollständig, Touchhöhen und sämtliche Schriftgrößen bleiben erhalten. Kein Clipping, kein versteckter Überlauf, keine Inhaltskürzung oder kleinere Schrift. Wortlaut, Fakten, Bedingungen, Quelle, Abrufzeit, Eingabe-/Fokus-/Pollinglogik sind unverändert.

## R5-Nachprüfung

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| Bestehende U1-/CI-Vertragstests | **47/47 PASS**, 6 Suites, 0 Fail/Skip/Cancel/Todo; **1400,253122 ms**. |
| Repository-TypeScript | **PASS, Exit 0**. |
| Harness-TypeScript | **PASS, Exit 0**. |
| Komponenten-ESLint | **PASS, Exit 0**. |
| Vorhandener Bundle-/Loopback-HTTP-Smoke | **PASS**, sechs vorhandene Fälle einschließlich Pending→Accepted nach synthetischer Cachebefüllung. |
| Diff-/Scopeprüfung | **PASS**. Nur lokale Produktkomponente und U1-R5-Plan/Handoff/Manifest geändert; Root-Task bleibt separat. |
| Harness, Matrix, CI, Runtime, shared Dateien | **Bytegleich zur Basis** per Git-Vergleich; R4-Label erhalten. |
| Lokaler Browser | **Nicht gestartet**. |
| Neuer vollständiger Browser-/PNG-/UI-Nachweis | **Offen**, auf dem neuen veröffentlichten Head erforderlich. |

Befehle im U1-Worktree mit Node22 (`v22.23.4`, `/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node`):

```bash
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/visitor/*.test.ts scripts/official-truth-product-v3-ui/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false
node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false -p scripts/official-truth-product-v3-ui/tsconfig.json
node node_modules/eslint/bin/eslint.js components/readiness/OfficialTruthVisitorV3.tsx
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/run.mjs --smoke
git diff --check
```

Das bestehende Tailwind-Bundle meldet unverändert alte Browserslist-Metadaten; dies führte zu keinem Fehler und wurde nicht durch eine neue Installation verändert. Der vorhandene Runtime-Proxy warnt über sein experimentelles Node-Feature. Keine Browserersatzabnahme, neue Testmatrix, neue Zeitmessung oder Production-Build-Behauptung.

## R5-Übergabe und verbleibendes Gate

`U1_MANIFEST.md` enthält die vollständigen aktuellen U1-Hashes einschließlich des R5-Plans. Vier eigene Dateien bilden den R5-Diff: Produktkomponente, R5-Plan, Handoff und Manifest. Der Root-eigene `U1_REVIEW_R5_TASK.md` wurde weder bearbeitet noch als eigene Lieferung vereinnahmt. Die S0-Vertragsdatei bleibt SHA256 **`871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4`**.

Die responsive Abnahme bleibt blockiert, bis Root einen neuen Head veröffentlicht und die **unveränderte** CI-Browsermatrix tatsächlich besteht: alle acht Breiten von 280 bis 1280 px, Landscape 844×390 und 320 px mit 200 % Text, zusätzlich vorhandene Fokus-/Privacy-/Fehler-/Pollinginteraktionen. Root prüft die echten PNGs unabhängig. Die bisherigen lokalen Prüfungen belegen nur diesen Arbeitsbaum auf Basis 20a4 und sind kein Exact-Head-TL-PASS. Ein weiterer konkreter Befund bleibt bei demselben Autor/derselben Session.

Query-/Cache-/Methoden-/Queueports bleiben ungebunden, E1-Schnittstelle unverändert. Kein öffentlicher Einstieg, Commit, Push, GitHubwrite, Ready, Merge, Folgeslice, DB-/Auth-/Provider-/Production-Aufruf oder #917-Schritt. D0-/Methodenfreigabe bleibt separat. **STOP bestätigt.**

---

## Archivierte R4-Übergabe vor dem tatsächlichen 20a4-UI-Lauf

Dieser Abschnitt ist historisch. Die damals offene Nachprüfung ist durch den oben belegten echten Lauf und den R5-Fix konkretisiert; die gesamte UI-Abnahme bleibt weiterhin offen.

### Status zum damaligen R4-Abschluss

**Enger Reviewfix geliefert; neuer tatsächlicher UI-CI-Lauf und unabhängige Abnahme offen. STOP. Kein Ready-/Merge-/Aktivierungs-PASS.**

Gleicher Autor **Jetnity Official Truth V3 Visitor Cache 1 — Codex Generation 1**, tatsächliche Session `/root/v3_visitor_writer`, kein Cursor-Agent. Auftrag [#1165 Review R4, Kommentar 6729875979](https://github.com/Jetnity/jetnity/pull/1165#issuecomment-6729875979). Basis **`b8a65f8b4d341768f69df01ba1ca96f8eba4ee14`**, Tree `e94bec8d4d987973e924053dbc77eeb7a5c250e9`, Branch `feat/official-truth-v3-visitor-cache-1-20261109`. Der Worktree war vor R4 sauber. Plan vor Code persistiert und ausdrücklich durch Root bestätigt; siehe `U1_REVIEW_R4_FIX_PLAN.md`.

### Tatsächlicher neuer Befund und Korrektur

Im regulären CI-Run **42543765403**, UI-Job **128924237021**, startete sandboxed Google Chrome **156.0.8078.79** erfolgreich. Checkout `14b2c419cf5852d21bd231e02184c8153a039584`, Source b8a65, sauber. Anschließend scheiterte der unveränderte exakte `getByLabel('Testfall', { exact: true })` nach Tab mit 30-s-Timeout. Null abgeschlossene Interaktions-/Layoutfälle; ein echter Fehlerscreenshot. Dies ist ein tatsächlicher Harnessfehler, kein Browserstartproblem.

Autor las Kommentar, Audit und Runbindung, betrachtete den Screenshot selbst und prüfte die Artefakthashes erneut. ZIP: `fe26da543c12dc7711b4fae2f3cde56efbeee97e8e1a47d1837446dc16a894f2`; PNG: `6514068dac3c65d076e0c831513a6da5530849cc135e17e12e8e375cc135722c`. Die heruntergeladene Evidence liegt bei Root unter `official-truth-v3-analysis/u1-b8a65-ci-ui/`.

Die Ursache wurde anhand des installierten Playwright-Codes bestätigt: `getElementLabels` liest die zugeordneten Labels über `elementText`; die rekursive Textsammlung nahm im bisherigen impliziten Label auch alle verschachtelten Options-Texte auf. Deshalb entsprach der vollständige Labeltext nicht exakt `Testfall`. Die Fokusgleichheit wurde wegen des fehlenden Locator-Matches noch nicht geprüft; der Screenshot zeigt den Select tatsächlich fokussiert.

**Einzige Codeänderung:** `scripts/official-truth-product-v3-ui/mount.tsx` erhält ein separates Label und Select mit gemeinsamem React-`useId`, `htmlFor` und `id`. Der zugeordnete Labelknoten enthält ausschließlich `Testfall`; Wrapper, Darstellung und Options bleiben erhalten. Keine zusätzliche ARIA-Ersatzbezeichnung. Keine Änderung an `run.mjs`, exakten Label-/Keyboard-/Fokus-/Layout-/Privacy-/Pollingassertions, Fristen, Launchoptionen, CI-Familien, Produktkomponente oder E1-Schnittstelle.

### R4-Nachprüfung

| Prüfung | Ergebnis |
| --- | --- |
| Bestehende U1-/CI-Vertragstests | **47/47 PASS**, 6 Suites, 0 Fail/Skip/Cancel/Todo, 1236,324583 ms. |
| Harness-TypeScript | **PASS, Exit 0**. |
| ESLint des geänderten Mounts | **PASS, Exit 0**. |
| Existierender Bundle-/Loopback-HTTP-Smoke | **PASS**, sechs bestehende Fälle einschließlich synthetischer Pending→Accepted-Abfolge. |
| Lokaler Browser | **Nicht gestartet**, bekannte Grenze nicht wiederholt. |
| Neuer vollständiger CI-/PNG-/UI-Beleg | **Offen; erforderlich auf dem neuen veröffentlichten Head.** |

Befehle im U1-Worktree mit Node22 (`v22.23.4`):

```bash
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/visitor/*.test.ts scripts/official-truth-product-v3-ui/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false -p scripts/official-truth-product-v3-ui/tsconfig.json
node node_modules/eslint/bin/eslint.js scripts/official-truth-product-v3-ui/mount.tsx
node --import ./scripts/server-only-test-register.mjs --import tsx scripts/official-truth-product-v3-ui/run.mjs --smoke
```

Keine neue Test- oder DOM-Ersatzprüfung wurde zur UI-Abnahme erklärt. Die echte vollständige Matrix bleibt unverändert. Der alte Screenshot zeigt die lange Produktüberschrift randnah; die schmalen Viewports wurden noch nicht geprüft. Root bestätigte ausdrücklich, weitere echte Layoutbefunde im nächsten CI-Lauf zu beurteilen und anschließend in derselben Session zu korrigieren. Kein vorgezogener Layout-PASS oder verdecktes Abschwächen von Assertions.

### Übergabe und Grenzen

`U1_MANIFEST.md` enthält die aktuellen vollständigen U1-Dateihashes einschließlich des R4-Plans. Nur Mount, R4-Plan, Handoff und Manifest bilden den R4-Diff. S0-Vertragscode, shared Guards, I1/M1/E1-Schnittstellen und Workflow bleiben unverändert. Alle Produktports bleiben ungebunden. Keine DB-/Auth-/Provider-/Production-Aktion, keine neuen Kosten, kein #917-Schritt. Kein eigener Commit/Push/GitHubwrite/Ready/Merge und keine selbstständige Folgearbeit.

Root veröffentlicht und prüft auf dem neuen Head den vollständigen CI-Lauf samt tatsächlichen Screenshots. Die lokalen R4-Prüfungen sind Arbeitsbaumbelege auf Basis b8a65 und kein veröffentlichter Exact-Head-TL-PASS. **STOP bestätigt.**

---

## Archivierte R3-Übergabe vor dem tatsächlichen b8a65-UI-Lauf

Der folgende Stand ist historisch. Seine Aussagen über damals noch nicht ausgeführte CI wurden durch den oben dokumentierten tatsächlichen Lauf und R4-Fix ersetzt. R3-Leistungsmessungen bleiben ausschließlich lokale Prozessmessungen.

### Status und exakte Basis

**Implementierung zur unabhängigen TL-Prüfung geliefert; UI-Abnahme und Integration offen. Kein Ready-/Merge-/Aktivierungs-PASS. STOP.**

Autor: **Jetnity Official Truth V3 Visitor Cache 1 — Codex Generation 1**, tatsächliche Session `/root/v3_visitor_writer`, kein Cursor-Agent. Datum: 9. November 2026. Auftrag #1162, Draft #1165, `U1_TASK_V1.md` + `U1_TASK_R2.md` + `U1_TASK_R3.md`; Root-Kommentar 6729484014 und anschließend ausdrückliche Planbestätigung.

Worktree: `official-truth-v3-visitor`; Branch `feat/official-truth-v3-visitor-cache-1-20261109`. Root veröffentlichte R2 einschließlich des unveränderten damaligen Manifests plus R3-Task auf **`2489eb19ea16308e5d84ec96bada3edc09a76688`**, Tree `c9b91a783c6fd714e01c7cd55909bb2e9d433676`. Die jetzigen R3-Änderungen liegen uncommittet auf dieser Basis. Kein eigener Commit, Push, GitHubwrite, Ready, Merge oder Folgeslice. Jeder später von Root veröffentlichte Head braucht seine eigenen Gates. Die R2-Übergabe bleibt im veröffentlichten Basiscommit nachvollziehbar.

Gemeinsamer S0-R3-Pin: `ab26914ff01dde64020879b9e41cea8b1e1738aa`. SHA256 der unveränderten `contract.ts`: `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4`. S0 wurde nur gelesen. Root bestätigte die Weiterarbeit nach dessen eigenem Review. Diese Selbstprüfung ersetzt dieses oder ein zukünftiges TL-Review nicht.

### Konkret geliefert

`visitor/query.ts` implementiert eine server-only Projektionsvorbereitung und eine ruhende Query-Orchestrierung. Cachelesung unterscheidet echte Leere und Fehler, bindet vollständigen Kontext/Fakt/Methode, prüft aktuelle Original-/Versions-/Decision-/Evidence-Proofs und bestätigt alle positiven Kandidaten zusammen mit der Methode in einem finalen atomaren Port. Quellenstand und Quelle werden unverfälscht aus dem exakten kanonischen Pin ausgegeben. Fristablauf während Await, Withdraw, Conflict, falsche Bytes/Pointer oder widerrufene Methode entfernen positive Inhalte.

Bekannter Regel-Miss verwendet einen separaten Regelqueue-Port. Erfolgreich leere Coverage verwendet seit TASK R2 einen eigenen neutralen Discovery-Port. Letzterer erhält nur Zielland, eine Staatsangehörigkeit und Methode; kein Pass, Reisezweck oder RuleContext wird erfunden. Pending erfordert einen echten, passenden, aktiven S0-Queue-ACK. Lost ACK, vertauschte Jobart, falsches Paar/Methode und Lesefehler werden nicht als laufende Recherche ausgegeben. M1 bestätigte das identische Eingabeformat; produktive Adapter und E1-Verbindung bleiben ungebunden.

`visitor/presentation.ts` zeigt vollständige Bedingungen und Verzweigungen, Schema-2-Aufenthalt und Ereignisfristen, Originalquellenzeit, amtlichen Namen/Link, Gültigkeit und Revision. Vorhandene Länder-, Requirement-, Visa- und Aktionsbezeichnungen werden verwendet. Keine persönliche Einreisezusage, automatische Passwahl oder Kürzung von Regeln.

`visitor/controller.ts` und die echte `OfficialTruthVisitorV3` bieten Leer-/Lade-/Fehler-/Accepted-/Pending-/Conflict-/Unavailable-Zustände, getrennte Staatsangehörigkeiten, neue Auswahl mit sofortiger Leerung alter Ergebnisse, Abort-/Generation-Schutz und geplanten Fokus/Statusansagen. Es gibt keinen öffentlichen Next-Einstieg und keine produktive Transportbindung. Die Browserkomponente importiert nur reine Anzeige-/Controllerlogik und S0-Typen, keine serverseitigen Proofmodule.

**R3 ergänzt automatisches Nachlesen:** Ein bestätigt laufender Rechercheauftrag löst über denselben Querypfad bis zu sechs weitere Abfragen aus, Backoff 2/4/8/16/30/45 Sekunden, harte Grenze 120 Sekunden. Keine Überlappung; Wechsel, Unmount, manuelle neue Abfrage oder terminale Ergebnisse stoppen die Serie. Alte positive Aussagen werden weder während Nachprüfung als Fallback angezeigt noch über ihren Projektionsablauf verlängert. Die Anzeige erhält dazu `generatedAt` und unverändertes `expiresAt`, zieht die gesamte Requestdauer von der serverseitigen Restdauer ab und setzt lokale Ablaufhinweise. Ergebnisrahmen/Pending bleiben stehen; automatische Wechsel stehlen keinen Fokus. Nach Budgetende ehrlicher Hinweis und vorhandene manuelle Abfragemöglichkeit. Kein S0- oder Methoden-/Queue-Vertrag wurde geändert.

Der isolierte Harness benutzt die echte Komponente, den echten Query-/Presenterpfad und ausdrücklich synthetische In-Memory-Adapter. Er bindet ausschließlich Loopback, fordert einen lokalen synthetischen Browserheader an, begrenzt JSON auf 4096 Bytes und lädt keine externen Ressourcen. Er verwendet vorhandenes esbuild aus tsx, Tailwind/PostCSS und Playwright. Keine neue Abhängigkeit, Lockfileänderung oder neue App-Route. `--smoke` prüft tatsächlich die lokale HTTP-Komposition; das ist keine visuelle Browserabnahme.

**R3 ergänzt den isolierten CI-Job:** `.github/workflows/ci.yml` erhält ausschließlich den neuen `official_truth_v3_ui`-Job plus dessen strikte Pflicht im bestehenden Aggregat. Alter `verify`, `persisted_native`, `refresh_native`, `accepted_store_native` und `auth-konfiguration` wurden byteweise gegen die Basis verglichen: unverändert. Keine Secret-/Auth-/DB-/Provideranbindung. Der Browser wird vorher aus den drei festgelegten Systempfaden gewählt und genau einmal mit `chromiumSandbox: true` gestartet; kein Launch-Fallback oder Download. Prüfberichte/PNG-Artefakte tragen Checkout-/Quell-Head und Runbindung, Fehler werden als Fehler gesichert. CI ist hier vorbereitet, noch nicht ausgeführt oder als bestanden behauptet.

### Ausgeführte Prüfungen

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

#### Tatsächliche lokale Leistungsmessung

Gemessen wurde **nur ein einzelner Node-Prozess mit einem vorbereiteten Cachetreffer für eine Zelle und synthetischen In-Memory-Ports**. 20 Warmups, 200 Messungen, keine Jobs erzeugt:

| Messwert | Ergebnis |
| --- | ---: |
| p50 | 3,483409 ms |
| p95 | 6,727277 ms |
| Maximum | 7,834758 ms |

Das belegt weder öffentliche End-to-End-Latenz noch DB-, Netzwerk-, Regionen-, Cold-Start-, Last- oder Browserrenderkosten. Das Produktziel **öffentlich p95 < 1 s bleibt unbewiesen**. Die Query begrenzt ihre Portkoordination auf 750 ms; das ist kein gemessenes öffentliches SLO. Echte Adapter müssen ihre Abortsignale/Timeouts selbst einhalten.

#### Fehlversuche und offene Browsergrenze

Während Implementierung wurden Typnarrowing, fehlende Schema-2-Darstellungstypen, eine Testfixture mit falschem Visa-Enum und eine Flaggen-sensitive Assertion korrigiert; abschließende Tests/Typechecks sind oben belegt. Der erste Harnessstart scheiterte an ESM/CJS-Interop des synthetischen Servermoduls; der Import wurde korrigiert und der echte HTTP-Smoke lief danach erfolgreich.

Im historischen R2-Lauf waren Playwrights eigener Chromium-Cache und Chrome nicht installiert. Das vorhandene `/usr/bin/chromium` wurde anschließend regulär ausprobiert; der Start scheiterte an `socket() failed: Operation not permitted` und `ptrace: Operation not permitted`. Danach keine Startvarianten zur Umgehung, keine Installation, keine Sandbox-/Rechteeskalation und keine behaupteten Screenshots. Root prüfte reguläre Browserwerkzeuge ebenfalls ohne erreichbaren Harness und beauftragte deshalb ausdrücklich R3-CI. In R3 fand kein weiterer lokaler Browserstart statt. Der neue eine Launch samt aktivierter Sandbox muss in regulärer CI erst tatsächlich ausgeführt werden.

Ein erster rein textueller Vergleich der alten Workflowblöcke meldete irrtümlich eine Änderung an `accepted_store_native`, weil der Vergleichsregex die Ziffer in `official_truth_v3_ui` nicht als Jobgrenze erkannte. Der korrigierte Regex bestätigte die vier alten Familien und Auth bytegleich; am Workflow wurde dafür nichts geändert. Root meldete getrennte alte S0-Importer-Inventarfehler in vollständiger CI; diese Dateien wurden nicht verändert und liegen beim ursprünglichen S0-Autor. Der neue synthetische Serverimport `readV3VisitorInput` wurde Root für den späteren seriellen Inventarabgleich ausdrücklich gemeldet.

Umgebungswarnungen: vorhandene Browserslist-Daten sind laut Build 14 Monate alt; der vorhandene EnvHttpProxyAgent meldet eine experimentelle API. Keine Dependencyaktualisierung außerhalb dieses Tasks. Diese Warnungen sind kein Testskip.

### Reproduzierbare Befehle

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

### Grenzen, Risiken und nächste konkrete Handlung

**Datenbank/Security/Kosten:** keine Migration, RLS, ACL, Auth, Supabase, Secrets, Provider, echte amtliche Recherche, Worker, Scheduler oder Production-Aktion. Keine neuen laufenden Kosten. #917-Readback wurde weder wiederholt noch umformuliert/delegiert/an Menschen umgeleitet. #1131 STOP, #1135 separat und #968 Preview-Sensitivität bleiben erhalten.

**P0:** kein eingeführter aktueller Live-Eingriff. **P1-Aktivierungsgates:** alle produktiven Ports und die Methode bleiben ungebunden; positive Aussagen erfordern tatsächliche Current-/Batch-Proofs und atomare M1-ACKs in E1. Ohne diese Bindungen keine automatische Freigabe/Recherche behaupten. **P2:** unabhängige UI-/Mobile-/Tastatur-/Device-Abnahme, vollständige Build-/Hygiene-/CI-/Preview-Gates, Transportdecodierung und reales öffentliches p95 fehlen. Begrenztes Polling ist implementiert und lokal kontrolliert getestet; der echte produktive M1-/E1-Abschluss bleibt ungebunden und der montierte Browserbeleg muss erst aus CI kommen. **P3:** bestehende Tooling-Warnungen wie oben.

Root soll nun die im `U1_MANIFEST.md` gehashten Dateien unabhängig reviewen, die offenen regulären UI-Gates prüfen und später E1 auf die bestätigten M1-Ports binden. Erst Root entscheidet Publish/Ready/Merge, alle besonderen Owner-Gates bleiben. Vollständige Portpflichten stehen in `U1_CONTRACT.md`.

**STOP bestätigt.** Kein Folgeslice und keine eigenständige Veröffentlichung. Unmittelbare Review-Fixes bleiben in derselben Session möglich.
