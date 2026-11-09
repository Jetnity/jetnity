# U1 Guard R1 — exakte Importerinventur und Übergabe

**Autor:** Jetnity Official Truth V3 Shared Contract 1 — Codex Generation 1

**Session:** `/root/v3_contract_writer`

**Auftrag:** [TL TASK U1 Guard R1 / 6729744132](https://github.com/Jetnity/jetnity/pull/1165#issuecomment-6729744132)

**Arbeitsort:** `/workspace/scratch/e03d2839d4e5/official-truth-v3-visitor`

**Basis-HEAD:** `2489eb19ea16308e5d84ec96bada3edc09a76688`. Der ursprüngliche U1-Autor hat seine R3-Arbeitsdateien mit STOP übergeben; Root hat deren 20 Manifestpins geprüft und die vier S0-R4-Dateien aus `6b7beebd33a686d494a26cbda8a6311a51dc3450` eingespielt. Diese vorbestehenden Änderungen gehören nicht zur Guardkorrektur. I1-Dateien gehören nicht in diesen Branch.

## Vor Code gemeldeter und ausdrücklich bestätigter Plan

Die tatsächlichen Importe wurden mit `rg` und direktem Lesen geprüft. Content-Identity wird neu ausschließlich von `visitor/test-fixtures.ts` verwendet. Der isolierte server-only-Testhelfer benutzt die vorhandenen Content-Codecs; daraus entsteht keine produktive Quellen-/Custodyfreigabe. Die Anwendbarkeit verwenden `visitor/presentation.ts` nur für Typen, `visitor/query.ts` für Kalender/Kanonik und `visitor/test-fixtures.ts` für Kanonik.

1. Im endlichen Content-Identity-Inventar ausschließlich `lib/readiness/official-truth-product-v3/visitor/test-fixtures.ts` ergänzen.
2. Die eigene Anwendbarkeitsmenge und die bestehende exakte Nicht-`.test`-Sollmenge ausschließlich um `visitor/presentation.ts`, `visitor/query.ts` und `visitor/test-fixtures.ts` ergänzen. Der unveränderte Scanner zählt den `.ts`-Testhelfer in dieser Menge; dies ist keine Produktionsaktivierung.
3. Positive Exaktpfad- und negative rohe Lookalike-/Traversal-/Nachbar-/App-Pfadproben ergänzen. Alle alten Assertions, Scanner, Sicherheitsbudgets und Setgleichheiten erhalten. Keine Wildcard, dynamische Dateiexistenz-Erlaubnis, Zukunftspfade oder I1-Pfade.
4. Alle 20 U1-Dateipins, das Manifest selbst, S0-Runtime/-Tests und die übernommenen S0-Dokumente vor/nach identisch nachweisen. Vollständige S0-, drei U1-, beide Guard- und UI-CI-Vertragstestdateien unter Node 22.23.4 sowie gezieltes ESLint und Diff prüfen. Die UI-CI-Vertragstests wurden gelesen: statische Vertragsprüfung und inerte Dateiauswahl, kein Browserstart.

Root bestätigte diesen Plan ausdrücklich vor der ersten Änderung. Schreibrechte bestehen ausschließlich für die zwei Guarddateien und dieses Dokument. Keine Änderung an U1-Runtime, Tests, CI oder anderen Dokumenten; keine Writes in S0/I1 oder anderen Worktrees. Kein Commit/Push/Ready/Merge, Browser-, DB-/Auth-/SQL-/Provider-/Production-Schritt.

## Gelieferter Diff

Beide Inventare wurden genau wie bestätigt ergänzt. Der Vergleich gegen S0 R4 mit `git diff 6b7beebd33a686d494a26cbda8a6311a51dc3450 -- <beide Guarddateien>` zeigt **14 beziehungsweise 18 hinzugefügte Zeilen, keine entfernte Zeile**. Die Repository-Scanner, exakten Set-Vergleiche, Sicherheitsbudgets und sämtliche alten Assertions bleiben unverändert. Keine I1-Pfade wurden übernommen.

Der Content-Identity-Guard erhält neun Negativproben; insbesondere bleiben `visitor/query.ts` und `visitor/presentation.ts` dort abgewiesen, weil diese Dateien Content-Identity tatsächlich nicht importieren. Der Anwendbarkeitsguard prüft die drei exakten Pfade positiv und 16 rohe Varianten negativ. Traversalstrings werden nicht normalisiert. Die isolierte Fixture bleibt Testmaterial; ihre Aufnahme in ein endliches statisches Inventar schafft keine produktive Quellen-, Annahme- oder Custodyautorität.

| Guardtest | SHA-256 | Gitblob ohne Schreiben |
| --- | --- | --- |
| `lib/readiness/official-truth-content-identity.test.ts` | `15756c13386cdc173e4e09e209a8365f18d57f09397192fde380fde364d4aab6` | `83cdec456b2d26a5752a00efb1a11cbd789efe44` |
| `lib/readiness/regulierungs-anwendbarkeit.test.ts` | `834c435f619eee363657b620ac70bfde5b3290a01749d04c8a91f18c2ba91fe9` | `85d4041f3dc7bda6da5af30995197bece7a1d8a9` |

## Tatsächliche Gates

Der folgende Aufruf führte alle sieben beauftragten Dateien vollständig aus, ohne Testnamenfilter und ohne Browserstart:

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/contract.test.ts lib/readiness/official-truth-product-v3/visitor/query.test.ts lib/readiness/official-truth-product-v3/visitor/presentation.test.ts lib/readiness/official-truth-product-v3/visitor/controller.test.ts lib/readiness/official-truth-content-identity.test.ts lib/readiness/regulierungs-anwendbarkeit.test.ts scripts/official-truth-product-v3-ui/ci-contract.test.mjs
```

**Exit 0: 200 Tests, 22 Suiten, 200 bestanden, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen, 0 todo; gemeldete Dauer 1983,7068 ms.** Bereits der erste vollständige Lauf nach der Änderung bestand alle Fälle. Die zusätzlichen Pfadproben erweitern vorhandene Tests und erhöhen deren Anzahl nicht. Die vier UI-CI-Vertragstests prüfen Aggregation, statische Job-/Artefaktbedingungen und Browserauswahl ohne Launch; sie sind kein Browseraudit und kein Hosted-CI-Lauf.

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node node_modules/eslint/bin/eslint.js lib/readiness/official-truth-content-identity.test.ts lib/readiness/regulierungs-anwendbarkeit.test.ts
git diff --check
git diff --no-index --check /dev/null docs/official-truth-product-v3/U1_GUARD_REVIEW_R1.md
```

ESLint und `git diff --check` lieferten jeweils **Exit 0 ohne Diagnosen**. Der neue Dokument-Whitespace-Check lieferte **Exit 1 ohne Ausgabe**, entsprechend dem neuen Inhalt gegenüber `/dev/null` und ohne Whitespace-Diagnose. Die bekannte experimentelle `EnvHttpProxyAgent`-Warnung blieb ohne Skip oder unterdrückten Fehler.

Kein eigener zusätzlicher TypeScript-, vollständiger Hygiene-/CI-, Production-Build- oder Browserlauf in diesem engen Guardauftrag. Die vom ursprünglichen Autor oder Root zuvor ausgeführten Gates werden nicht als eigene neue Ergebnisse ausgegeben. Keine Änderung an Runtime, API, Schema, Abhängigkeiten, laufenden Kosten oder Aktivierung.

## Vorher-/Nachher-Nachweis der geschützten Bytes

Das unveränderte [U1_MANIFEST.md](U1_MANIFEST.md) besitzt SHA256 **`b891af2eed7c5e32eb4daa37128403fe4c1c2c4abda78a8ed2d7e326dbf23a84`**. Vor jeder Änderung wurden mit einem lokalen Python-/`hashlib`-Read seine genau 20 Tabellenzeilen eingelesen und für jede Datei sowohl SHA256 als auch Byteanzahl gegen den dokumentierten Pin geprüft. Die Identität des Manifests selbst wurde ebenfalls geprüft. Derselbe Read wurde nach dem vollständigen Testlauf wiederholt: **20/20 Pins stimmen weiterhin; alle 25 erfassten Dateirecords sind exakt gleich**.

Die 25 Records bestehen aus den 20 U1-Dateien einschließlich CI, Runtime, Tests, Harness und U1-Dokumentation, dem Manifest selbst sowie den folgenden vier S0-Dateien:

| Zusätzlich geschützte Datei | Unveränderter SHA-256 |
| --- | --- |
| `lib/readiness/official-truth-product-v3/contract.ts` | `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4` |
| `lib/readiness/official-truth-product-v3/contract.test.ts` | `59aa173100b9a28c05311eae745b777233aab5b0092ffa9ac516d818d2748fd9` |
| `docs/official-truth-product-v3/S0_IMPLEMENTATION_PLAN.md` | `56387f1b23016c0c41489d8c4516a657d7cb06e7b7e96d5f39d3d47ff5f70a52` |
| `docs/official-truth-product-v3/S0_SELF_REVIEW_HANDOFF.md` | `2d4c159ba3fb9345d6b3723db0ee0786ceeeade8cffdb7ba11b9bac91d2f3ed4` |

Der Vergleich erfolgte gegen die tatsächlichen übergebenen Arbeitsdateien, nicht nur gegen HEAD: U1 R3 lag bereits vor diesem Auftrag uncommittet vor. Die vom Root kopierten S0-R4-Guards wurden ausschließlich im hier autorisierten Umfang ergänzt. Keine anderen vorbestehenden Änderungen wurden angefasst.

## Handoff und STOP

**STOP nach dieser stabilen Lieferung.** Der Autor hat ausschließlich die beiden Guarddateien und dieses Dokument im U1-Worktree geändert. S0-/I1-Worktrees bleiben unberührt. Root prüft und veröffentlicht mit dem vorgesehenen S0-R4-Parent und führt neue Exact-Head-Gates aus. Browser-, vollständige CI- und Aktivierungsabnahme bleiben gesondert offen. Ein M1-Inventar wird erst nach einem eigenen exakten Auftrag bearbeitet; keine Zukunftspfade sind vorab erlaubt. Kein Agenten-Self-Review ist TL-PASS.
