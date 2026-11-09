# I1 — Foundation-Importer-Guard, TL-Reviewfix R3

Autor: **Jetnity Official Truth V3 Import 1 — Codex Generation 1**, tatsächliche ursprüngliche Session `/root/v3_import_writer`. Auftrag: [TL CHANGES REQUIRED R3 / 6729953572](https://github.com/Jetnity/jetnity/pull/1164#issuecomment-6729953572), Draft #1164. Basis-HEAD vor Änderung: `ae22ea79068a4946e68b08dc5a9b101fb3f55ab5`, sauberer Worktree bestätigt.

Root hat den einzigen roten Foundation-Importer-Guard in vollständiger CI `42543222801` selbst lokal reproduziert; die bereitgestellte Evidence `i1-root-foundation-before.log` zeigt 56/57 bestandene Tests und exakt den unbekannten Importeur `lib/readiness/official-truth-product-v3/import/service-server.ts` mit `ownRecord, immutable` aus `official-truth-autonomous-provenance-artifact`. Dies ist ein fehlender expliziter Inventareintrag, keine erteilte Custody- oder Methodenautorität.

## Vor Code vorgelegter enger Plan

Der vollständige Foundation-Test, sein Repository-Scanner, exakter Set-Vergleich, alle bisherigen Assertions sowie die tatsächlich verwendeten reinen Helfer und ihre I1-Verwendung wurden gelesen. `ownRecord` prüft eigene Propertydeskriptoren vor Zugriff; `immutable` friert bereits geprüfte Daten rekursiv ein. I1 verwendet sie ausschließlich für die History-Recordform und deren unveränderlichen geprüften Rückgabewert. Keine Funktion erteilt Live-Autorität.

1. Im vorhandenen `reviewedFoundationImports` genau ein Tupel ergänzen: `lib/readiness/official-truth-product-v3/import/service-server.ts` → `official-truth-autonomous-provenance-artifact` → ausschließlich `ownRecord`, `immutable`. Kein Verzeichnis-/Namespace-/Wildcardeintrag und keine weiteren Module oder Symbole.
2. Den vorhandenen Negativtest ergänzen: exakter Pfad mit beiden Symbolen positiv; rohe Lookalike-/Traversal-/Nachbar-/App-/Testpfade, falsches Modul, Namespace-/Defaultform, fehlendes, zusätzliches oder dupliziertes Symbol negativ. Bestehende Assertions bleiben unverändert erhalten.
3. `foundationImporterAllowed`, den vollständigen AST-/Repository-Scanner, Verbotslisten, Exact-Set-Vergleich, Produktionsroot-Prüfung und alle bestehenden Zero-I/O-/Custodytests unverändert erhalten. Keine Runtimekopie, Importumbenennung oder Umgehung.
4. Vorher-/Nachher-SHA und Git-Blob nachweisen. I1-Runtime/Testdateien, S0-Vertrag/Tests, die beiden separat zugewiesenen S0-Guards und die verwendeten Foundation-Helfer bleiben bytegleich.
5. Die vollständigen fünf Testkorpora unter Node 22.23.4 ohne Namensfilter ausführen: S0-Vertrag, I1-Service, Content-Identity, Anwendbarkeit und Foundation. Zusätzlich vollständiges TypeScript, fokussiertes ESLint und Diff-/Whitespaceprüfung. Exakte Ergebnisse und Grenzen hier persistieren; Root prüft und veröffentlicht den neuen Head. Danach STOP.

Schreibrechte sind ausschließlich um `lib/readiness/official-truth-autonomous-producer-custody-foundation.test.ts` und eigene I1-Dokumentation erweitert. Die zwei S0-Guards bleiben exklusiv dem ursprünglichen S0-Autor vorbehalten. Keine DB-, Browser-, Provider-, GitHub-, Commit-, Ready- oder Mergeaktion. Root hat diesen Plan vor der Codeänderung ausdrücklich bestätigt. Der danach von Root bereitgestellte vollständige Auftrag `I1_REVIEW_R3_TASK.md` wurde ebenfalls vor der Umsetzung gelesen; der zunächst unpublizierte Plan wurde auf Roots Wunsch in diese Datei umbenannt.

## Umsetzung

Die Foundationdatei erhält ausschließlich **22 zusätzliche Zeilen, keine Löschung**: das eine geprüfte Tupel sowie zusätzliche Assertions im vorhandenen endlichen Importertest. Zwei positive Fälle belegen die exakte Symbolmenge unabhängig von ihrer Reihenfolge. 20 negative Proben verweigern acht andere Pfadschreibweisen, drei falsche Module und neun fehlende/doppelte/zusätzliche/Namespace-/Default-Symbolmengen. Traversal- und Lookalikepfade bleiben rohe Strings; keine Normalisierung verwandelt sie in erlaubte Pfade.

Der vorhandene `foundationImporterAllowed`-Predicate ist bytegleich. Ebenfalls bytegleich sind der gesamte nachfolgende Scanner mit abschließendem Exact-Set-Vergleich, die Zero-I/O-/Custodytests, die vorherigen Tests und alle alten Assertions. Dies wurde sowohl durch den Diff (22 Einfügungen, 0 Löschungen) als auch durch direkten Vorher-/Nachher-Vergleich der geschützten Quellabschnitte geprüft. Die neue Tabellenzeile ist keine Autoritätsausstellung und gibt keinen anderen Consumer frei.

## Tatsächliche Gates

Verwendete Runtime: Node **v22.23.4** über `/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node`. Alle fünf Dateien liefen vollständig, ohne Testnamenfilter oder neue Skips:

```bash
NODE22=/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node
"$NODE22" --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/contract.test.ts lib/readiness/official-truth-product-v3/import/service.test.ts lib/readiness/official-truth-content-identity.test.ts lib/readiness/regulierungs-anwendbarkeit.test.ts lib/readiness/official-truth-autonomous-producer-custody-foundation.test.ts
"$NODE22" node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false
"$NODE22" node_modules/eslint/bin/eslint.js lib/readiness/official-truth-autonomous-producer-custody-foundation.test.ts
git diff --check
```

| Prüfung | Ergebnis |
| --- | --- |
| Vollständige fünf Korpora | Exit 0; **242/242 Tests**, 21 Suites, 0 Fail/Cancel/Skip/Todo, 3328,279762 ms |
| Vollständiges TypeScript | Exit 0, keine Diagnostik |
| Fokussiertes ESLint | Exit 0, keine Lintbefunde |
| Diff-/Whitespaceprüfung | Exit 0, keine Ausgabe |
| Geschützte vorhandene Abschnitte | Predicate, vollständiger Scanner/Setvergleich, Testsuffix und vorherige Tests bytegleich; nur Einfügungen im erlaubten Bereich |
| Runtime-/Fremddateigrenze | Alle neun geschützten Baseline-Dateien bytegleich, einschließlich Root-Auftrag |

Bereits der erste vollständige Lauf nach der engen Korrektur bestand alle 242 Fälle. Die bekannten experimentellen `EnvHttpProxyAgent`-Warnungen wurden nicht unterdrückt. Es wurden keine Timeouts verlängert oder Tests entfernt. Lokale Logs: `/workspace/scratch/e03d2839d4e5/official-truth-v3-analysis/i1-tl-r3-{tests,tsc,lint}.log`.

Der historische volle CI-Lauf `42543222801` auf dem alten Head bleibt fehlgeschlagen; dieser Auftrag startet keinen Rerun. Laut Root-Evidence hatte er 8295 Tests mit 8292 PASS, einem Foundation-Leaf-Fehler und zwei geerbten Skips; andere native Familien/Auth bestanden. **Die vollständige CI auf einem neu veröffentlichten Head bleibt erforderlich.** Die lokalen fünf Korpora ersetzen keinen Hosted-CI-/Ready-/Merge-PASS.

## Manifest und Unverändertheitsnachweis

| Foundation-Testdatei | Bytes | SHA-256 | Git-Blob |
| --- | ---: | --- | --- |
| vor R3 | 48531 | `1ef474944007985a817d065401cc7bf79a7da3e8641ff422498fd6a611e5a090` | `7e6a8a34e5ff16bae5ef34360d68efb61922f64d` |
| nach R3 | 50251 | `647c8446241a206b7d22d9b6624f9420e1211366bcc43afe380b1dc70d037b3c` | `60da79b334166702715622cae23971c6a7b8a320` |

Die folgenden SHA-256 wurden vor und nach der Guardänderung tatsächlich verglichen und sind unverändert:

| Geschützte Datei | SHA-256 |
| --- | --- |
| `lib/readiness/official-truth-autonomous-provenance-artifact.ts` | `1bdf271bf078d1c46fbc0f510789129e361bfdabce7cdd6e03a27a21071f323b` |
| `lib/readiness/official-truth-product-v3/contract.ts` | `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4` |
| `lib/readiness/official-truth-product-v3/contract.test.ts` | `59aa173100b9a28c05311eae745b777233aab5b0092ffa9ac516d818d2748fd9` |
| `lib/readiness/official-truth-product-v3/import/interface.ts` | `d98772cb27275aa768541bb670f3ae0effaf866748aea6b3797c03ac49361bb6` |
| `lib/readiness/official-truth-product-v3/import/service-server.ts` | `2f88077023c0215ebfd246b0dd50b3216e45e7bc342e72eae2cac10c72758b09` |
| `lib/readiness/official-truth-product-v3/import/service.test.ts` | `68bec04bec516749153c599778393f8cdd96f97d5cd870f4552bc1d72faeca01` |
| `lib/readiness/official-truth-content-identity.test.ts` | `0b1d5233574640e1c98c0f5381c564552ec9d7d8f0c10c1bbd76dae99bc410d2` |
| `lib/readiness/regulierungs-anwendbarkeit.test.ts` | `b14b59bccd809979cdc362a2db52f4abcba4a0ce08127c50dd8efddceb899526` |

Der zusätzlich von Root bereitgestellte `I1_REVIEW_R3_TASK.md` wurde ebenfalls vor/nach dem Fix bytegleich nachgewiesen. Das vollständige abschließende Dateimanifest einschließlich Dokumentbytes und des Root-Auftrags liegt unter `/workspace/scratch/e03d2839d4e5/official-truth-v3-analysis/i1-tl-r3-final-manifest.json`; der unveränderte Vorherstand liegt in `i1-tl-r3-before.json`.

## Handoff und STOP

Eigene Änderungen sind genau die eine Foundation-Testdatei, dieser Fixplan und die Ergänzungen von `I1_IMPLEMENTATION_PLAN.md` sowie `I1_SELF_REVIEW_HANDOFF.md`. `I1_REVIEW_R3_TASK.md` stammt unverändert von Root. Keine Änderung an I1-Runtime/-Tests, S0 oder den zwei fremden Guards, Abhängigkeiten, API, Methode, Quellenautorität, Datenbank oder Production. Die bisherigen unbound/STOP-Grenzen gelten unverändert.

**STOP nach Lieferung.** Root besitzt unabhängigen Review, Veröffentlichung, vollständige neue Exact-Head-Gates und Ready-/Merge-Entscheidungen. Diese lokale Self-Review-Evidence ist kein TL-PASS. Kein weiterer Scope und kein eigener Commit/Push.
