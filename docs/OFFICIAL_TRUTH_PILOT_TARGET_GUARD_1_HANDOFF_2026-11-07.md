# Official Truth Pilot Target Guard 1 — Autorenübergabe

Stand: 7. November 2026. Tracking #1148, Draft PR #1149, parent #917. **Autorenlieferung; unabhängige Technical-Lead-Abnahme und vollständige Exact-Head-Gates stehen aus.** Kein Ready, Merge oder automatischer Folgeslice durch den Autor.

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

## Geänderte Dateien und Git-Blobs

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
