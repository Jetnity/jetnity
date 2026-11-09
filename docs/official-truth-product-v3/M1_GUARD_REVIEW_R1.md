# M1 Guard R1 — exakte Importerinventur und Übergabe

**Autor:** Jetnity Official Truth V3 Shared Contract 1 — Codex Generation 1

**Session:** `/root/v3_contract_writer`

**Auftrag:** [TL TASK M1 Guard R1 / 6729876318](https://github.com/Jetnity/jetnity/pull/1166#issuecomment-6729876318)

**Arbeitsort:** `/workspace/scratch/e03d2839d4e5/official-truth-v3-monitor`

**Basis-HEAD:** `c3397ffe3bace3c63a3c347a63b3671f2f818281`. Der ursprüngliche M1-Autor hat R2 mit STOP übergeben. Root hat alle 16 Manifestpins geprüft und die vier S0-R4-Dateien aus `6b7beebd33a686d494a26cbda8a6311a51dc3450` eingespielt. M1-Dateien lagen bereits untracked vor; diese Lieferung verändert sie nicht. Keine I1-/U1-Datei gehört in diesen Branch.

## Vor Code gemeldeter und bestätigter Plan

Die tatsächlichen Importstellen wurden gelesen. Content-Identity verwenden `monitor/monitor.ts` für bestehende Identitätsleser/-vergleiche und `monitor/test-support.ts` im isolierten synthetischen Helfer. Die Anwendbarkeit verwenden `monitor/internal.ts` für Kalender-/JSON-/Kanonikprimitive, `monitor/recovery.ts` für den Kalendertag, `monitor/test-support.ts` für Kanonik sowie `monitor/recovery.test.ts` im Testkorpus.

1. Das endliche Content-Identity-Inventar ausschließlich um `lib/readiness/official-truth-product-v3/monitor/monitor.ts` und `lib/readiness/official-truth-product-v3/monitor/test-support.ts` ergänzen.
2. Die eigene Anwendbarkeitsmenge ausschließlich um `monitor/internal.ts`, `monitor/recovery.ts`, `monitor/test-support.ts` und `monitor/recovery.test.ts` ergänzen. Die bestehende Nicht-`.test`-Sollmenge erhält ausschließlich die ersten drei Pfade. Der Scanner zählt den isolierten `.ts`-Testhelfer; dies erteilt keine Produktionsautorität.
3. Alle bestehenden Scanner, Setgleichheiten, Sicherheitsassertions und Budgets erhalten. Positive Exaktpfad- und negative rohe Lookalike-/Traversal-/Nachbar-/App-Pfadproben ergänzen. Keine Wildcard, dynamische Dateiexistenz-Erlaubnis, Zukunfts- oder I1-/U1-Pfade.
4. Vor/nach alle 16 Manifestpins, das Manifest selbst, die vier Aufgaben-/Vertragsanker und zusätzliche S0-Dateien prüfen. Vollständige sieben Testdateien (S0, vier M1, beide Guards), gezieltes ESLint und Diff unter Node 22.23.4 prüfen. Keine Browser-/DB-/Provider-/GitHub-/Commit-/Ready-/Mergeaktion.

Root bestätigte diesen Plan ausdrücklich vor der ersten Änderung. Schreibrechte bestehen ausschließlich für die beiden Guarddateien und dieses Dokument; alle anderen Dateien und Worktrees bleiben unverändert. Root besitzt Review, Veröffentlichung und weitere Exact-Head-Gates. Eine spätere E1-Vereinigung ist kein Teil dieses Auftrags.

## Gelieferter Diff

Die Inventare wurden ausschließlich um die beschriebenen tatsächlichen Pfade ergänzt. Der Diff gegen S0 R4 mit `git diff 6b7beebd33a686d494a26cbda8a6311a51dc3450 -- <beide Guarddateien>` zeigt **16 beziehungsweise 19 zusätzliche Zeilen, keine entfernte Zeile**. Bestehende Repository-Scanner, vollständige Setgleichheiten, Budgets und sämtliche alten Assertions bleiben erhalten. Keine I1-/U1-Pfade wurden übernommen.

Der Content-Identity-Guard prüft beide exakten neuen Pfade positiv und 14 zusätzliche Varianten negativ. Dazu gehören rohe Traversal-/Lookalike-/App-Pfade sowie tatsächlich nicht zu seinem Produktionsinventar gehörende Nachbarn. Der Anwendbarkeitsguard prüft vier exakte eigene Pfade positiv und 21 Varianten negativ. In seiner Produktions-Sollmenge bleibt `recovery.test.ts` ausgeschlossen. Die isolierten Testhelfer bleiben Testmaterial; ein statisches Inventar erteilt keine Produktions-, Quellen-, Annahme- oder Custodyautorität.

| Guardtest | SHA-256 | Gitblob ohne Schreiben |
| --- | --- | --- |
| `lib/readiness/official-truth-content-identity.test.ts` | `10adfa26090c7c3e5a80c42d3121ab534ae43d8c8b3c372f5604a003de57c55d` | `a2242570e30903f428e7e92ea06660305ca6c60f` |
| `lib/readiness/regulierungs-anwendbarkeit.test.ts` | `00c9db744ce2a409f798dfd0c76bf8fd5fd19ccf32a5e22b5e61d0f9320f8dc1` | `cd341870a6bc2ae0c94f41181fd2d4a23d538c53` |

## Tatsächliche Gates

Alle sieben beauftragten Testdateien liefen vollständig und ohne Testnamenfilter:

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/contract.test.ts lib/readiness/official-truth-product-v3/monitor/queue.test.ts lib/readiness/official-truth-product-v3/monitor/worker.test.ts lib/readiness/official-truth-product-v3/monitor/monitor.test.ts lib/readiness/official-truth-product-v3/monitor/recovery.test.ts lib/readiness/official-truth-content-identity.test.ts lib/readiness/regulierungs-anwendbarkeit.test.ts
```

**Exit 0: 223 Tests, 20 Suiten, 223 bestanden, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen, 0 todo; gemeldete Dauer 1728,876746 ms.** Der erste vollständige Lauf nach der Änderung bestand alle Fälle. Die neuen Pfadproben erweitern vorhandene Tests; ihre Anzahl ändert sich dadurch nicht. Die ursprünglichen M1-R1-/R2-Regressionen liefen im unveränderten vollständigen Dateikorpus.

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node node_modules/eslint/bin/eslint.js lib/readiness/official-truth-content-identity.test.ts lib/readiness/regulierungs-anwendbarkeit.test.ts
git diff --check
git diff --no-index --check /dev/null docs/official-truth-product-v3/M1_GUARD_REVIEW_R1.md
```

ESLint und `git diff --check` lieferten **Exit 0 ohne Diagnosen**. Die zusätzliche Whitespaceprüfung des neuen Dokuments lieferte **Exit 1 ohne Ausgabe**, entsprechend dem neuen Inhalt gegenüber `/dev/null` und ohne Whitespace-Diagnose. Die bekannte experimentelle `EnvHttpProxyAgent`-Warnung führte zu keinem Skip und unterdrückte keinen Fehler.

Kein zusätzlicher TypeScript-, vollständiger Hygiene-/Hosted-CI-, Production-Build- oder Browserlauf in diesem engen Guardauftrag. Die von Root zuvor unabhängig ausgeführte Original-Replayprobe wird nicht als eigener neuer Lauf ausgegeben. Kein Datenbank-, Auth-, SQL- oder Providerzugriff; keine API-/Runtime-/Schema-/Dependency-/Kostenänderung und keine Aktivierung.

## Nachweis der unveränderten Manifest- und Vertragsbytes

Das unveränderte [M1_FILE_MANIFEST.md](M1_FILE_MANIFEST.md) besitzt SHA256 **`bf4ace91d6e4fe20a7221ea7984109583c45b1f9f7fcba088730efd45616c6a3`**. Vor der ersten Änderung und nach dem vollständigen Testlauf wurde derselbe lokale Python-/`hashlib`-Read ausgeführt:

- Die genau 16 Lieferzeilen wurden gegen tatsächlichen SHA256, Gitblob und Zeilenzahl jeder Datei geprüft. Gitblobs wurden aus dem lokalen Dateiinhalt berechnet, ohne Gitobjekte zu schreiben.
- Die vier zusätzlichen Manifestanker — S0-Vertrag, S0-Vertragsdokument und beide M1-Aufträge — wurden gegen ihre SHA256 geprüft.
- Das Manifest selbst sowie S0-Testkorpus, S0-Plan und S0-Handoff wurden zusätzlich mit SHA256 und Byteanzahl erfasst.

Ergebnis: **16/16 Lieferpins und 4/4 Anker stimmen; alle 24 erfassten Dateirecords sind vor/nach exakt identisch.** Die Manifestprüfung bindet die tatsächlich übergebenen untracked M1-R2-Dateien, nicht nur den Seed-HEAD. Alle Queue-/Replay-/Atomic-Regressionen und sämtliche ursprünglichen M1-Dokumente bleiben unverändert.

Die S0-Runtime behält SHA256 `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4`, der S0-Testkorpus `59aa173100b9a28c05311eae745b777233aab5b0092ffa9ac516d818d2748fd9`. Der kopierte S0-R4-Plan behält `56387f1b23016c0c41489d8c4516a657d7cb06e7b7e96d5f39d3d47ff5f70a52`, der kopierte S0-R4-Handoff `2d4c159ba3fb9345d6b3723db0ee0786ceeeade8cffdb7ba11b9bac91d2f3ed4`.

## Handoff und STOP

**STOP nach dieser stabilen Lieferung.** Ausschließlich die beiden Guarddateien und dieses Dokument wurden im zugewiesenen Monitor-Worktree geändert. Keine andere Lane oder Datei wurde bearbeitet. Root prüft und veröffentlicht mit dem vorgesehenen S0-R4-Parent und führt neue Exact-Head-Gates aus. Vollständige CI, Aktivierung und eine E1-Vereinigung auf tatsächlich veröffentlichten finalen Heads bleiben getrennte Aufgaben. Kein Self-Review ist TL-PASS; kein Commit, Push, Ready oder Merge durch den Autor.
