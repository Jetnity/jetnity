# Official Truth Pilot Target Guard 1 — Autorenübergabe

Stand: 7. November 2026. Tracking #1148, Draft PR #1149, parent #917. **Autorenlieferung; unabhängige Technical-Lead-Abnahme und vollständige Exact-Head-Gates stehen aus.** Kein Ready, Merge oder automatischer Folgeslice durch den Autor.

**Aktueller Korrekturstand: R2 im selben Autor/derselben Session**, ausschließlich nach [Root CHANGES REQUIRED / TASK v1 Amendment A2 auf `581af23dafc17d3cd7421105453de5a9dac0b96a`](https://github.com/Jetnity/jetnity/pull/1149#issuecomment-6706213098). Die ursprüngliche Lieferung und R1 bleiben mit ihren jeweiligen Hash-/Prüfangaben historische Evidence. Der abschließende Abschnitt „R2-Testintegration“ beschreibt die zwei A2-Teständerungen; der Laufzeitcode bleibt exakt auf R1. TASK v1 bleibt unverändert; A1 und A2 gelten im jeweiligen begrenzten Scope.

## Auftrag und Provenienz

- Autor: **Jetnity Official Truth Pilot Target Guard 1 — Codex Generation 1**.
- Tatsächliche Session: `/root/pilot_target_guard_writer`; derselbe Autor/dieselbe Session für einen unmittelbaren Review-Fix.
- Branch: `fix/official-truth-pilot-target-guard-1-20261107`.
- Unveränderte Ausgangsbasis: main `fd31251c0f63dbb8454337d1fd3b526f1893ea94`, Tree `f0757bd65f9e218ff6339c6ac9762c51d21eabe6`.
- TASK-Seed: `eee454cc685dd5f5084743f0400979fce0ae4ec5`; unveränderter TASK-Blob `421b677ed2c0fa5eb386c47b569599c207054cf9` in [TASK v1](OFFICIAL_TRUTH_PILOT_TARGET_GUARD_1_TASK_2026-11-07.md).
- [Root-Dispatch vor Umsetzung](https://github.com/Jetnity/jetnity/pull/1149#issuecomment-6705697261); [versioniertes TL-Amendment A1](https://github.com/Jetnity/jetnity/pull/1149#issuecomment-6705714971) erlaubt ausschließlich die zusätzlichen positiven Target-Testports in `cancellation.test.ts` und `mapping.test.ts` und präzisiert `VERCEL_TARGET_ENV=preview`.
- Lokaler isolierter Arbeitsbereich: `/workspace/scratch/c4c9898f6d19/pilot-target-guard-work`. Der Ausgangsspiegel enthielt 130 Dateien, deren Git-Blobs sämtlich gegen den vollständigen main-Tree mit 9.452 Einträgen geprüft wurden. Nachgeladene unveränderte Dateien wurden ebenfalls an main gebunden. Dies ist ein **Teilverzeichnis ohne vollständigen Git-Checkout**, kein lokaler Branch-/Build-Nachweis. Root veröffentlicht die Lieferung; der Autor hat keine Remote-Mutation vorgenommen. Cursor bleibt pausiert.

Maßgebliche Ausgangslage bleibt [TL-CHAT-ENTRY-20261107-V1](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6705497685). #1142/#1143/#1145/#1147 wurden wiederverwendet; kein erneuter Aufbau und keine Kopie aus gehaltenen PRs.

## Umsetzung und Verhalten

`applicationPilotTargetAllowed()` ist der einzige neue produktive Export. Er ist parameterlos und server-only. Er verlangt exakt `https://yfvbxvijcorffwxbxahl.supabase.co` sowohl vom vorhandenen read-only `getServerSupabaseUrl()` als auch aus dem aktuellen `process.env`. Hinzu kommen `VERCEL=1`, `VERCEL_ENV=preview`, `VERCEL_TARGET_ENV=preview` und `VERCEL_PROJECT_ID=prj_wTTVawPItEO7a4HihEmaU3PsuaXM`. Eine abweichende Schreibweise wird nicht normalisiert. Keine Client-Erzeugung, Cookie-/Schlüsselprüfung oder Netzwerkanfrage im Guard; keine übergebbare Environment-/URL-/Request-/Flag-Auswahl und kein Enabling-Setter.

Der lokale Alias `const env = process.env` ist absichtlich dynamisch: ein direkter `process.env.NEXT_PUBLIC_…`-Ausdruck könnte von Next beim Build eingebunden werden und damit den aktuellen Katalog-Zielwert nicht prüfen. Der SSR-Getter liefert unabhängig davon den tatsächlich erfassten Factory-Wert. Die am 07.11.2026 geprüften primären Dokumentationen sind [Vercel System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables) (`VERCEL`, `VERCEL_ENV`, `VERCEL_TARGET_ENV`, `VERCEL_PROJECT_ID`, jeweils Build und Runtime) und [Next Environment Variables](https://nextjs.org/docs/app/guides/environment-variables) (dynamische Lookups werden nicht eingebunden). Custom Environments können einen eigenen Target-Namen haben. `NODE_ENV=production` wird nicht als Production-Ziel interpretiert. Der Supabase-Skill sowie die [öffentliche SSR-Dokumentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client) und der [Changelog](https://supabase.com/changelog) wurden konsultiert; keine SDK-/Schema-/API-Änderung.

| Eintritt/Fortsetzung | Durchgesetzte Grenze |
| --- | --- |
| Request | Vor der ersten Pilot-Client-/Auth-Nutzung; nach Client, Auth, Rate-Limit, Trip-Lesen, Speichern und Prüfen erneut. |
| `saveDeclaration` | Direkter Aufruf prüft vor Client/RPC, nach Client/RPC und vor dem bestätigten Readback-Ergebnis. |
| `pilotGrant` | Reserve und Recheck prüfen direkt vor Client/RPC und nach jeder erwarteten Antwort. |
| Evaluator | Vor Authority, nach Authority/Reserve, vor und nach Katalog, vor und nach Quelle, vor und nach Requirements. |
| Finaler Recheck | Jeder einzelne parallele Aufruf prüft vor seinem Start. Eine synchrone Änderung in einem früher gestarteten Port sperrt spätere Starts. Nach dem Warten und unmittelbar vor `verified` wird erneut geprüft. |

Ein fehlgeschlagener Zielcheck liefert die bestehenden unavailable-/null-Verträge. Bei Drift nach einem möglicherweise abgeschlossenen Speichern verwendet der Request die bereits vorhandene unbestätigte 503-Antwort mit dem Hinweis, dass gestartete Speichervorgänge abgeschlossen sein können. Es wird weder Rücknahme noch Abbruch bereits gestarteter Shared-Operationen behauptet. Interne Zieladressen/-IDs erscheinen nicht in Fehlerantworten.

`applicationPilotAvailable()=false`, `applicationPilotEnabled()=false`, `contracts=[]`, Identitäts-/Quellen-/Extraktorregister, AA-Pin und Mappingfenster bleiben unverändert. Target-Match aktiviert keinen Piloten. Die gemeinsame Supabase-Factory, Browser-/Auth-Code, gewöhnliche Account-Seiten, Proxy und Katalog-API wurden nicht geändert; der Guard behauptet keinen Stopp gewöhnlicher Account-Seitenaufrufe.

## Geänderte Dateien und Git-Blobs — erste Lieferung `c87c355`

Die drei vorhandenen Testdateien erhalten ausschließlich den genehmigten positiven externen Target-Port (zweimal in `application.test.ts`, jeweils einmal in den beiden A1-Dateien). Sämtliche vorhandenen semantischen Assertions bleiben bytegleich. Die drei Leitdokumente sind ausschließlich ergänzt. Der TASK ist nicht verändert.

| Datei | Git-Blob der Autorenlieferung |
| --- | --- |
| `lib/readiness/official-truth-ch-de-application-pilot-1/target-server.ts` | `180fca83ca8014f748bcec176f1d0d4c41f68f46` |
| `lib/readiness/official-truth-ch-de-application-pilot-1/target.test.ts` | `665b29bc12cd49011bfa5ad2514a952692ec6377` |
| `lib/readiness/official-truth-ch-de-application-pilot-1/request-server.ts` | `337366f01e9ad2f83c1811a183ac2452609d7771` |
| `lib/readiness/official-truth-ch-de-application-pilot-1/database-server.ts` | `3d51626a67a99cab5a61dff357a21d08905b2dc0` |
| `lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts` | `54993100f02e82a7885ef0701d915e959e2523b0` |
| `lib/readiness/official-truth-ch-de-application-pilot-1/application.test.ts` | `01cb732753b7a4bd6d488d331d1be6ac3badebd2` |
| `lib/readiness/official-truth-ch-de-application-pilot-1/cancellation.test.ts` | `8151738a6054b7281cebfb94834354c7f52faa8a` |
| `lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.test.ts` | `9285836e6ff8b8eeec0ee3c9bd5b13d5f9068181` |
| `ARCHITECTURE.md` | `e8b931e01ded5c77aa25ba094ec896a2a68f2335` |
| `ROADMAP.md` | `a94a5b0e44dbbb69ffcb791d9727a5369e585448` |
| `DECISIONS.md` | `61baf3dda428c3dff16b85d93b19c12a02d8b7d8` |
| `docs/OFFICIAL_TRUTH_PILOT_TARGET_GUARD_1_HANDOFF_2026-11-07.md` | Eigenen Blob nach Abschluss im Root-Submission-Manifest festhalten; keine selbstreferenzielle Hash-Angabe. |

## Prüfungen des Autors und Grenzen

Lokale Laufzeit: **Node v24.22.1**, TypeScript **5.9.3** aus vorhandenen Abhängigkeiten. Das Repository verlangt Node 22.x; lokale Resultate ersetzen dessen CI nicht. Kein Install, Paket-/Workflow-/Timeout-Wechsel und keine vollständige Next-Installation. Fixtures laden tatsächlich geänderte Module; nur externe Ports sind außerhalb des Deploy-Graphen ersetzt. Alle Reise-, Authority-, Quellen- und Antwortdaten sind synthetisch.

### Neuer Target-Nachweis

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-ch-de-application-pilot-1/target.test.ts
```

Final nach der Korrektur des unbestätigten Speicherstatus: **85 Tests, 85 bestanden, 0 fehlgeschlagen, 0 übersprungen**, 2.407 s. Abgedeckt sind der echte erfasste SSR-Getter ohne SDK-/Cookie-Effekt, alle URL-/Kontextklassen, beide Mismatch-Richtungen, aktuelle Environment-Änderungen, direkte Helper, Request-Header/Query ohne Override, sämtliche asynchronen Fortsetzungen, alle vier synchronen finalen Recheck-Starts und verzögerte finale Antworten. Die positive Kontrolle führt die echte synthetische Evidence→Review→Rule→Requirements-Kette bis genau zu einer Visa-Auswertung; übrige Zellen bleiben unknown. Echte Hard-offs werden separat positiv zielgebunden geprüft und bleiben geschlossen.

### Gemeinsamer begrenzter Wiederholungslauf

Root ergänzte sieben unveränderte, gegen main geprüfte Abhängigkeitsdateien. Danach wurde ausschließlich der angeforderte begrenzte Lauf wiederholt:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-ch-de-application-pilot-1/target.test.ts lib/readiness/official-truth-ch-de-application-pilot-1/application.test.ts lib/readiness/official-truth-ch-de-application-pilot-1/cancellation.test.ts
```

**153 Tests, 151 bestanden, 2 fehlgeschlagen, 0 übersprungen**, 5.290 s. Die 85 neuen Target-, 54 unveränderten Application- und 12 direkten DB-Cancellation-Fälle bestanden. Zwei bereits vorhandene kanonische Trip-Read-Tests bleiben im Teilspiegel bei `MODULE_NOT_FOUND: @/lib/flights/nutzlast` stehen (Import über `lib/trips/handelsfelder-nutzlast.ts` → `lib/trips/abbildung.ts`). Ihre Assertions wurden nicht verändert. Dies ist kein vollständiger Suite-Erfolg und kein nachgewiesener neuer Produktfehler; die vollständige CI muss sie ausführen.

### Erster breiterer Versuch — ausdrücklich kein vollständiger Erfolg

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-skip-pattern='^full repository candidate import isolation' lib/readiness/official-truth-ch-de-application-pilot-1/application.test.ts lib/readiness/official-truth-ch-de-application-pilot-1/cancellation.test.ts lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.test.ts lib/readiness/official-truth-content-identity.test.ts lib/readiness/official-truth-content-identity-r2.test.ts lib/readiness/official-truth-aa-visa-table-identity-candidate.test.ts lib/readiness/official-truth-source-fingerprint-v2.test.ts lib/readiness/official-truth-server-owned-retrieval.test.ts
```

Der Runner zählte **267 Tests, 263 bestanden, 4 fehlgeschlagen**, zusätzlich scheiterte die Initialisierung der Suite `R2 coordinated dormant runtime`. Der ausdrückliche CLI-Ausschluss des Mapping-Gesamtrepository-Tests ist keine bestandene oder aufgehobene Schutzprüfung; der Node-Runner zählte dafür keinen Skip. Konkrete Grenzen: fehlendes vollständiges `app`-/Importer-Inventar bei AA-/Content-Identity-Isolation, fehlendes `day-stage-assignment` bei den zwei alten Trip-Read-Tests und fehlendes `official-truth-same-request-proof-server` bei R2. Die vorhandenen Tests/Assertions/Guards wurden nicht passend gemacht. Keine weitere lokale Ausweitung auf R2 oder künstliche Vervollständigung der Isolation.

### TypeScript, Lint, Build

```sh
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false
```

Der echte Compiler lief und endete mit Code 2 / **40 Diagnostikzeilen** aus fehlenden Teilspiegel-Modulen, fehlendem Next/`@supabase/ssr`/`types/supabase` und daraus folgenden impliziten any-Typen. In den geänderten Pilotpfaden wurden ausschließlich die zwei damals fehlenden unveränderten Request-Imports `rate-limit` und `trip-official-evaluations-server` gemeldet; Root hat diese Dateien später unverändert nachgeladen. Kein Typecheck-Pass wird daraus abgeleitet. ESLint/Next sind lokal nicht installiert; kein kanonischer Lint/Typegen/Build behauptet. Vollständige Isolation, Node-22-Typegen/Typecheck/Lint/Hygiene/Build/Auth und Exact-Head-CI bleiben Root-Gates.

Die vollständigen lokalen Ausgaben liegen außerhalb des Veröffentlichungsscope unter `/workspace/scratch/c4c9898f6d19/`:

| Log | SHA-256 |
| --- | --- |
| `pilot-target-guard-target-tests.log` | `fffdd873115daaa340dda3e75a237d232f87cbc35a77889044e59ad9d9aee7f0` |
| `pilot-target-guard-final-focused-tests.log` | `a81e9591cb00ff8a19c5fcc17eb72af8d2ccf6574e40eae51d7040cf2ab27bff` |
| `pilot-target-guard-preserved-tests.log` | `a6e41222b532bceaad42c19a87cf2877fa7d3f162057730a1df19d9ed276c78b` |
| `pilot-target-guard-typecheck.log` | `410012ad2402878b545bf35242edb1ecc40dff3b07ea2ed23ef2e1b17210bc72` |

## Risiken, erhaltene Gates und nächster Schritt

- **P0:** Kein neuer P0 im begrenzten Codeumfang nachgewiesen. Das ist keine Herabstufung bestehender Risiken oder gehosteter Autoritätslücken.
- **P1:** Der Zielguard ist implementiert, aber weder ein akzeptiertes Deployment noch wirksame Owner-/Account-/Session-Autorität, Key-Zuordnung oder vollständiger Quellenabruf sind bewiesen. Spätere Pilot-Aktivierung bleibt geschlossen. Kein aktiver Production-Exploit wird aus dem zuvor ebenfalls geschlossenen Piloten abgeleitet.
- **P2:** Teilspiegel und Node-24-Prüfung begrenzen lokale Aussagekraft; tatsächliche Node-22-/Next-/CI-/Preview-Nachweise sowie unabhängige Prüfung aller geänderten Dateien sind vor normaler Integration erforderlich. Der Guard ist eine notwendige Konfigurationsbedingung, keine unabhängige Plattformattestierung.
- **P3:** Keine neue Dependency, UI-Fläche, Einstellung, laufenden Kosten oder generischen Frameworks. Die Testsubstitutionen existieren nur im isolierten Testgraphen; vorhandene Semantik bleibt erhalten.

Der erste kritische offene Schritt bleibt die zulässig freigegebene Feststellung der tatsächlich installierten Development-Baseline und wirksamen #1139-Owner-/Account-/Session-Autorität sowie die Zielbindung des vorhandenen #1142-Kandidaten. Die frühere verweigerte Nachprüfung wurde nicht wiederholt, umformuliert oder umgeleitet. **Stage 1: APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING; tatsächliche neue Ledger-ID unbekannt. Stage 2: NOT_ATTEMPTED**, auch nach späterem Readback nicht unverändert anzuwenden. Keine gehostete SQL-/Auth-/Session-/Trip-/RLS-/Migrationsaktion, kein Environment-/Secret-Write, kein realer Quellenaufruf und keine gehaltene Codeintegration.

Für diese Lieferung folgt ausschließlich Root-Submission, unabhängiges Full-Diff-/Exact-Head-Review, vollständige CI und Preview-Prüfung. Nur der Technical Lead entscheidet PASS/Ready/Merge; jeder neue Head benötigt vollständiges Re-Gating. Ein späterer echter Owner-Reisetest, Production-Paket und unabhängiger End-to-End-Nachweis auf jetnity.com sowie die persistente, versionierte, aktualisierbare eigene Datenbasis und vollständige Einreise-Checkliste bleiben offen. **Autor returned / STOP; kein Folgeslice.**

## R1-Korrekturlieferung — gleicher Autor, gleiche Session

**Ausgangshead:** `c87c355ab53c86d31b7629f428bbbca039c5f28c`, Tree `4f17bc2dc5540ff19077731837b7fdd20e23cef8`. [Root-Verdict R1](https://github.com/Jetnity/jetnity/pull/1149#issuecomment-6705926637): **CHANGES REQUIRED**, kein PASS/Ready/Merge. Vor der Korrektur wurden sämtliche zwölf lokalen Veröffentlichungsdateien gegen das eingefrorene Submission-Manifest geprüft. Der frische GitHub-main-Ref blieb `fd31251c0f63dbb8454337d1fd3b526f1893ea94`; #1149 war weiterhin Draft auf dem genannten Head.

### Tatsächliche erste CI und R1.1

Die vollständige [CI 42365799902, Attempt 1](https://github.com/Jetnity/jetnity/actions/runs/42365799902) scheiterte im [App-Job 128383521976](https://github.com/Jetnity/jetnity/actions/runs/42365799902/job/128383521976) bei Lint: **vier neue Errors** für `const module` in `target.test.ts`, Regel `@next/next/no-assign-module-variable`, sowie **193 bestehende Warnings**. Die nachfolgenden Tests, Hygiene und Build waren **SKIPPED**, nicht bestanden. Laut unabhängigem Root-Readback waren Typecheck und der separate Auth-Job erfolgreich; das ersetzt keine erfolgreiche Gesamt-CI.

Die vier Bindungen heißen jetzt `targetGuard`, `requestHandler`, `database` und `evaluator`. Keine Regelunterdrückung, allgemeine Warnungsbereinigung oder Workflow-/Dependency-/Timeout-Änderung. Eine gezielte TypeScript-AST-Inspektion findet null Variable-Bindungen namens `module`; kein `eslint-disable` wurde eingeführt. Das ist kein vollständiger Lint-Nachweis; die frische kanonische CI bleibt erforderlich.

### R1.2: tatsächlicher Cleanup nach dem inneren Ergebnis

Der unveränderte `withinDeadline()`-Helfer ruft im `finally` synchron `controller.abort()` auf. Ein am begrenzten Signal registrierter Cleanup-Listener kann daher nach der inneren Endprüfung, aber vor Auflösung des äußeren Await das Laufzeitziel verändern. Der unabhängige Reviewer und anschließend Root reproduzierten mit tatsächlicher SSR-Erfassung, Guard, Deadline und Evaluator **verified / eine positive Zelle bei targetAtReturn=false**. Der tatsächliche Request mit DB-Save lieferte nach demselben Cleanup HTTP 200 mit gespeichertem Trip; der Request mit Evaluator-Check HTTP 200 mit verified. SDK-, Cookie- und reale Fetch-Aufrufe waren jeweils null. Reproduktion außerhalb des Deploy-Graphen: `review/pilot-target-finally-repro.cjs`, SHA-256 `4d12854d186cb9039a9a66ddd9711362a5ae564b71d5fca594ee399d841d6e27`. Dessen Assertions dokumentieren den fehlerhaften alten Head und sind keine Sollwerte des Fixes.

Die beiden öffentlichen Wrapper prüfen nun **nach dem vollständigen `await withinDeadline(...)`** die Zielbedingung vor bestätigter Ausgabe erneut. Ein zuvor innerlich verifiziertes Evaluator-Ergebnis wird bei Zielverlust über den bestehenden catch zu unavailable mit ausschließlich lokalen unknown-Zellen. Ein HTTP-200-Request-Ergebnis wird bei Zielverlust über den bestehenden catch zur unbestätigten 503-Antwort; ein möglicherweise beendetes Speichern wird nicht als rückgängig gemacht dargestellt. Bereits negative Evaluator-Kategorien und nicht erfolgreiche HTTP-Status bleiben erhalten. Der Deadline-Helfer, Zielguard, Datenbankhelfer, gemeinsam genutzte Factories und alle Hard-offs sind unverändert.

Die neuen Regressionen hängen Testlistener an die tatsächlich weitergegebenen begrenzten Signale. Request-Save verwendet den tatsächlichen DB-Helfer; Request-Check den tatsächlichen Evaluator und dessen kanonische synthetische Evidence-/Rule-Kette. Der echte Deadline-Helfer wird nicht substituiert. Drei positive Kontrollen beweisen den unverändert erfolgreichen Pfad einschließlich stattgefundenem Cleanup; drei Driftfälle verhindern die zuvor beobachtete bestätigte Ausgabe. Weitere Kontrollen erhalten source_not_admitted, HTTP 409 und tatsächliche Hard-off-Kategorien auf abgelehntem Ziel. Keine Produktions-Injektion und kein Livezugriff.

### Gezielt ausgeführte R1-Prüfungen

Die neu hinzugefügten Cleanup-Regressionen wurden zunächst gegen die noch unveränderten Wrapper ausgeführt:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-name-pattern='public .* after real deadline cleanup' lib/readiness/official-truth-ch-de-application-pilot-1/target.test.ts
```

Ergebnis vor dem Produktfix: **6 Tests, 3 positive Kontrollen bestanden, genau 3 Drift-Regressionen fehlgeschlagen**, 0 übersprungen, 1.324 s. Die Tests wiesen den konkreten Fehler nach.

Nach der eng begrenzten Korrektur:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-ch-de-application-pilot-1/target.test.ts lib/readiness/official-truth-ch-de-application-pilot-1/application.test.ts
```

Ergebnis: **148 Tests, 148 bestanden, 0 fehlgeschlagen, 0 übersprungen**, 5.450 s: 94 Target-Tests (85 bestehende plus 9 R1-Fälle) und 54 unveränderte Application-Tests. Tatsächliche Umgebung weiterhin Node v24.22.1 / TypeScript 5.9.3; keine Behauptung einer lokalen vollständigen Node-22-/Next-CI. Keine Wiederholung der bekannten unvollständigen Gesamtrepository-/R2-Tests und keine weiteren Implementierungen nach dem neuen Freeze.

| R1-Ausgabe unter `/workspace/scratch/c4c9898f6d19/` | SHA-256 |
| --- | --- |
| `pilot-target-guard-r1-red-cleanup-tests.log` | `36af0f22147b999d4e177d1b38dbae930770ca3d1277b17191d96b0cefebb747` |
| `pilot-target-guard-r1-focused-tests.log` | `5dc485f3be27d48e8c87cb882a9843e7d65417eff25b4eb607e691bc854b3097` |

### R1-Dateien und nächstes Gate

Nur die folgenden drei Code-/Testdateien sowie diese Übergabe unterscheiden sich gegenüber `c87c355`; das versionierte lokale R1-Manifest hält ihre SHA-256 und den vollständigen unveränderten Rest des Veröffentlichungsscope fest.

| Datei unter `lib/readiness/official-truth-ch-de-application-pilot-1/` | Neuer Git-Blob | SHA-256 |
| --- | --- | --- |
| `target.test.ts` | `d2c7abc992503c816a0da03be837de44536f0ca8` | `477ace9d16c42a4c65f41359b5a3cc086421b56686bccd7f15657d2a83016e17` |
| `request-server.ts` | `163c3b056dab647ea42a58722d124d78ebbcfb40` | `6b70f43b343b275397727f3f540fdd6040d3e455bf0ecdbbb3513100aa994ea4` |
| `evaluate-server.ts` | `975206af1755dba3282193f456d1f92d92f8d0ad` | `bf8444e4f9c326c9f52f3c047fe166087c08df98b3aa55144b017b5a2f1b7b72` |

R1.2 bleibt bis zur unabhängigen Root-Abnahme eine zu prüfende Korrektur des Veröffentlichungsschutzes; keine Herabstufung der gehosteten P0/P1-Gates. Der neue Head benötigt vollständiges Re-Gating: tatsächliche Node-22-CI einschließlich aller bisher übersprungenen Tests/Hygiene/Build, Auth, Preview, Threads/main und unabhängiges Full-Diff-/Acceptance-Review. Die erste fehlgeschlagene CI bleibt historische Evidence. Stage 1/Stage 2, #1139, gehaltene Plattformaktionen, Product-Owner-Gates und der vollständige eigene Einreise-Datenbankauftrag bleiben unverändert. **R1-Autor returned / STOP; kein Ready, Merge, Remote-Write oder Folgeslice.**

## R2-Testintegration — TASK v1 Amendment A2

**Ausgangshead:** `581af23dafc17d3cd7421105453de5a9dac0b96a`, Tree `d8ebd25294c3d81bfd2125459dfaa90c407d5204`. [Root-Verdict R2 und vorab veröffentlichtes A2](https://github.com/Jetnity/jetnity/pull/1149#issuecomment-6706213098): **CHANGES REQUIRED**, kein PASS/Ready/Merge. Autor und tatsächliche Session bleiben unverändert. Vor Bearbeitung wurden alle zwölf R1-Veröffentlichungsdateien gegen das eingefrorene Manifest geprüft. Der frische GitHub-main-Ref blieb `fd31251c0f63dbb8454337d1fd3b526f1893ea94`; #1149 war Draft auf dem genannten R1-Head.

### Tatsächliche R1-CI

Die vollständige [CI 42366713641, Attempt 1](https://github.com/Jetnity/jetnity/actions/runs/42366713641) führte im [App-Job 128386193179](https://github.com/Jetnity/jetnity/actions/runs/42366713641/job/128386193179) **8.184 Tests aus: 8.179 bestanden, 3 fehlgeschlagen, 2 unveränderte Browser-Layout-Skips**. Root hat die vollständige Originalausgabe ausgewertet. Typecheck, Lint und Auth bestanden; Hygiene und App-Build waren nach dem Testfehler **SKIPPED**. Die zwei in den früheren lokalen Teilspiegelläufen fehlenden kanonischen Trip-Tests und die vollständige Mapping-Import-Isolation bestanden im echten Checkout. Damit ist deren frühere lokale Einschränkung eingeordnet; die drei tatsächlich fehlgeschlagenen Testintegrationen bleiben zu beheben.

### Genau zwei erlaubte Teständerungen

**R2.1:** `request.test.ts` besaß noch keinen positiven externen `./target-server`-Port. Dadurch wurden die vorhandenen Auth-/Save-Fälle vorzeitig gesperrt. A2 ergänzt ausschließlich die eine Zeile `applicationPilotTargetAllowed:()=>true` im bestehenden isolierten Fixture. Die zwei betroffenen Fälle sind „fresh owned Auth/RLS trip only; missing and foreign are indistinguishable“ und „interrupted submitted save is explicitly unconfirmed, never reported rolled back“. Alle Assertions, Zähler, negativen Fälle und der tatsächliche Deployment-Hard-off bleiben unverändert. Entfernt man genau diese Zeile, entsteht wieder der ursprüngliche Git-Blob `ebe1963249c6663db45f7dfec3416411319b9f58`.

**R2.2:** Der BP1-Schutztest erkannte die autorisierte Evaluator-Änderung korrekt, weil sein erwarteter Code-Blob noch `aa3b3086394b1c30dbfd1e0ffb9604f43db8bde4` war. A2 bindet ausschließlich diesen einen statischen Erwartungswert an den unabhängig geprüften tatsächlichen R1-Blob `975206af1755dba3282193f456d1f92d92f8d0ad`, mit einer knappen A2-Provenienzzeile. Rücktausch dieses einen Pins und Entfernen genau dieser Provenienzzeile reproduziert bytegenau den ursprünglichen BP1-Test-Blob `ed1dbf5757364e1ade00b059737038416ca73d2f`.

Alle anderen vier Code-Pins, die strikte Hash-Schleife, Hard-offs, Quarantäne-, Netzwerk- und vollständige Importprüfungen bleiben unverändert. Kein dynamischer Selbstvergleich, keine zusätzlichen erlaubten Hashes, kein Skip und keine künstlichen Verzeichnisse oder Teststubs. Dies ist ausschließlich eine geprüfte Code-Integrationsbindung; **kein AA-Quellen-Pin, Mappingfenster oder Quellenzulassung wird geändert**. Der gesamte Laufzeitcode bleibt exakt auf `581af23`; die 94 unabhängigen Target-Tests bleiben unverändert.

### Gezielte R2-Prüfungen

Root ergänzte ausschließlich unveränderte, gegen main gehashte Import-Abhängigkeiten im lokalen Teilspiegel. Diese Dateien gehören nicht zur Veröffentlichung. Der erste begrenzte Versuch stoppte noch bei fehlendem `lib/trips/bezeichnungen` beziehungsweise `lib/readiness/schema`: **15 gezählte Tests, 12 bestanden, 3 fehlgeschlagen**, wobei die Request-Datei noch nicht initialisierbar war. Das war kein nachgewiesener neuer Produktfehler. Die vollständige Ausgabe bleibt erhalten.

Nach Ergänzung der tatsächlich benötigten unveränderten Importclosure wurde genau derselbe begrenzte Lauf wiederholt:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-ch-de-application-pilot-1/request.test.ts lib/readiness/official-truth-ch-de-application-pilot-1/cancellation.test.ts
```

Final: **21 Tests, 21 bestanden, 0 fehlgeschlagen, 0 übersprungen**, 1.301 s. Alle sieben bestehenden Request-Tests einschließlich der zwei R2.1-Fälle und alle vierzehn Cancellation-Tests bestanden; auch die beiden zuvor lokal fehlenden kanonischen Trip-Reads wurden tatsächlich ausgeführt. Keine künstlichen Testports außer der ausdrücklich genehmigten einen Target-Zeile, keine neuen Assertions oder Skips.

Zusätzlich wurden alle fünf festen BP1-Erwartungswerte aus dem unveränderten Pin-Block extrahiert und gegen die echten Datei-Bytes als Git-Blobs geprüft:

| Gepinnte Datei | Tatsächlicher und erwarteter Git-Blob |
| --- | --- |
| `lib/readiness/official-truth-server-owned-retrieval.ts` | `5998fdea54d3337fb68cd7111460b59e43a3cef7` |
| `lib/readiness/official-truth-content-identity.ts` | `4a4c3eea77b6e634fd83525849a4aaa6e6e50c18` |
| `scripts/official-truth-ch-de-first-visa-vertical-1/source-probe.ts` | `375adb52e2ef5ccb9045e17d830bf5d9111f6375` |
| `lib/readiness/official-truth-ch-de-application-pilot-1/contract-server.ts` | `90b9dd0108ed3e4d8049a3f8d35323c09b52e23f` |
| `lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts` | `975206af1755dba3282193f456d1f92d92f8d0ad` |

**5/5 exakt.** Der vollständige BP1-Import-Walk über `app`, `components` und `lib` wird damit nicht als lokal bestanden behauptet; er bleibt unverändert für den vollständigen CI-Checkout bestehen. Die bytegenaue Rücknormalisierung der zwei A2-Änderungen beweist zusätzlich den unveränderten Rest des Tests. Kein BP1-/AA-Quellenaufruf oder gehosteter Zugriff. Lokale Laufzeit unverändert Node v24.22.1, keine neue Abhängigkeit oder breite Wiederholung anderer Suites.

| R2-Evidence unter `/workspace/scratch/c4c9898f6d19/` | SHA-256 |
| --- | --- |
| `pilot-target-guard-r2-request-cancellation-tests.log` — erster unvollständiger Versuch | `b7d02224df112ce8522f717d9057628cd7e323c5f896fc65f7162560363e7dcb` |
| `pilot-target-guard-r2-final-request-cancellation-tests.log` — final 21/21 | `bb242da9ed5f3eda9e92c7b1c1b5b35aa3473063d3470b2890974ac04f51f710` |
| `pilot-target-guard-r2-five-code-pins.json` — echte fünf Code-Pins | `356dbc679a08fce6a1277a3891f8f1ce869b9615431ee7e03b969ad8d887bf2e` |

### R2-Dateien, Freeze und nächstes Gate

Gegenüber `581af23` ändern sich ausschließlich die beiden A2-Testdateien und diese Übergabe. Das versionierte lokale R2-Manifest enthält ihren vollständigen Hash-Nachweis und den unveränderten Rest des Veröffentlichungsscope.

| Datei | Neuer Git-Blob | SHA-256 |
| --- | --- | --- |
| `lib/readiness/official-truth-ch-de-application-pilot-1/request.test.ts` | `ce639c1143b57e2cf6debf8166d357fc9579fe2d` | `ec13cf22685f508b413de128ccfcdddc08fc87f45507bb53fd36aa104133f71b` |
| `lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts` | `39c668f0f95424c25f22e7db8448072f44052e87` | `347c31338dd79cff7b4fc5b14dca418888ce422e28ecc8f3e1ecced9c71219bd` |

R2 behebt ausschließlich die genannten Testintegrationen. Die vorherige CI bleibt fehlgeschlagen; kein grüner Teilnachweis ersetzt den neuen vollständigen Run. Nach Root-Veröffentlichung folgen vollständiges Exact-Head-Re-Gating mit allen Tests, strikter BP1-/Mapping-Isolation, Hygiene, Build, Auth, Preview, Threads/main und unabhängigem Review. Alle gehaltenen Plattform-/Product-Owner-Gates, Stage-1-/Stage-2-Status und der vollständige eigene Einreise-Datenbankauftrag bleiben unverändert. **R2-Autor returned / STOP; kein Ready, Merge, Remote-Write oder Folgeslice.**
