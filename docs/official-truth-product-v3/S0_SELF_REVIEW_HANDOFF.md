# S0 — Shared Contract 1: Selbstprüfung und Übergabe

**Logischer Autor:** Jetnity Official Truth V3 Shared Contract 1 — Codex Generation 1

**Session:** `/root/v3_contract_writer`; Modell laut Session: GPT-6 Astra Pro

**Auftrag:** `PROGRAM_V1.md`, S0 TASK V1 einschließlich [TL-Amendment R3](https://github.com/Jetnity/jetnity/pull/1163#issuecomment-6729202622) und [TL CHANGES REQUIRED R4](https://github.com/Jetnity/jetnity/pull/1163#issuecomment-6729560511), Programmissue #1162, Draft-PR #1163

**Branch:** `feat/official-truth-v3-shared-contract-1-20261109`

**Basemain:** `ce3366e26de73961d4682236af92347bfc3a4ca8`

**Ursprünglicher Seedhead:** `7f940d5620ef194c86a82b570751b2fea94fef92`

**R3-Basis, historisch:** `19c4736a73f639daaf5337465386155607792a4f`

**R4-Basis / unveränderter Autoren-HEAD:** `ab26914ff01dde64020879b9e41cea8b1e1738aa`

**Stand:** R4-Testinventare korrigiert und lokal geprüft; unabhängiger TL-Review und neue vollständige CI offen. R4 ändert ausschließlich die zwei beauftragten Guardtests sowie S0-Plan/Handoff. Runtime, bestehender S0-Testkorpus und S0_CONTRACT bleiben unverändert. Kein TL-PASS, kein Ready und kein Merge durch den Autor.

## 1. Gelieferte Bytes und Ownership

| Datei | Zweck |
| --- | --- |
| `lib/readiness/official-truth-product-v3/contract.ts` | Ruhende versionierte Runtime-Leser, Identitätsbildung, reine Quellenanzeigeauflösung und getrennte unbound Methodenautoritätsnaht |
| `lib/readiness/official-truth-product-v3/contract.test.ts` | 63 lokale synthetische Tests, ohne Netzwerk-/DB-/Provider- oder Secretbedarf |
| `lib/readiness/official-truth-content-identity.test.ts` | R4: genau ein geprüfter S0-Importer im bestehenden endlichen Inventar, positive Exaktpfad- und sieben negative Pfadproben |
| `lib/readiness/regulierungs-anwendbarkeit.test.ts` | R4: derselbe exakte S0-Importer in eigener/Produktionsmenge, positive Exaktpfad- und sieben negative Pfadproben |
| `docs/official-truth-product-v3/S0_IMPLEMENTATION_PLAN.md` | Vor Implementierung festgehaltener enger Plan und Grenzen |
| `docs/official-truth-product-v3/S0_CONTRACT.md` | Konkrete API, Kompatibilitätszuordnung und Integrationspflichten für I1/U1/M1 |
| `docs/official-truth-product-v3/S0_SELF_REVIEW_HANDOFF.md` | Diese tatsächlichen Prüfergebnisse und Übergabe |

Es gibt keine `fixtures.ts`; sämtliche fiktiven `.example`-Daten und die ausdrücklich synthetischen Passseiten-Fakten bleiben in der Testdatei. Kein produktiver Fallback und keine echte Visa-Aussage wurden angelegt.

Der Autor hat keine anderen Dateien geändert, keinen Git-Commit/Push und keine GitHub-Mutation ausgeführt. Root erweiterte die Ownership für R4 ausdrücklich um genau die beiden Guarddateien; andere Lanes ändern diese nicht. Die zentralen Dokumente und `PROGRAM_V1.md` blieben unverändert. Ein UI-Rename der Session wurde nicht behauptet.

### Unveränderte Runtime- und S0-Testidentität

| Datei | SHA-256 | Gitblob, ohne Schreiben ermittelt |
| --- | --- | --- |
| `contract.ts` | `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4` | `62f73e6a01c31de48732ce378e70a2f8936f7835` |
| `contract.test.ts` | `59aa173100b9a28c05311eae745b777233aab5b0092ffa9ac516d818d2748fd9` | `864a7b163ad80e32a10c0d32da5972566ba65b17` |

Diese Runtime-/S0-Testbytes gehören bereits zum publizierten R4-Basishead und wurden vor und nach der Korrektur unverändert nachgewiesen. Die neuen Guardtest-Identitäten stehen im R4-Abschnitt. Root publiziert die Korrektur und stellt den tatsächlichen neuen Head fest; die lokalen Hashes sind keine Herkunftsreceipts.

## 2. Acceptance Criteria — tatsächlicher Stand

| Kriterium aus TASK V1 | Implementierter Nachweis |
| --- | --- |
| 1. Wiederverwendung | Vorhandene Länder-/Requirement-/Fakt-/Scope-/Content-/Evidence-/Research-Leser werden importiert. Die genaue Zuordnung steht in `S0_CONTRACT.md`; kein paralleler Quellenkatalog. |
| 2. Untrusted Proposal | Strikter `untrusted_research_proposal` mit Job-/Operation-ID, vollständigem globalen Kontext, bestehender Research-Identität, strukturiertem vorgeschlagenem Fakt und referenzierten Publikationen. Selbstbehauptete Annahme, Methode, Owner, Registry oder Schreibrechte werden abgewiesen. |
| 3. Besucherinput | Nur Zielland plus maximal fünf rohe Staatsangehörigkeitsangaben; ISO-Katalogprüfung, Normalisierung, Sortierung, Deduplizierung, keine personenbezogenen Zusatzfelder. |
| 4. Globale Bedingungen | Vorhandene V2-Prädikate; explizite Route und specified/unconditional/unresolved. Genau eine Staatsangehörigkeit je globale Zelle, getrennte öffentliche Ergebnisse/Versionen. Dokumentunabhängiges `not_applicable` ist ausdrücklich möglich. |
| 5. Methoden-/Autoritätsgrenze | Methodendrafts ausschließlich DRAFT/NOT_APPROVED; `V3MethodAuthorityPort<Receipt extends object>` als getrennte Codeschnittstelle. Kein Leser erzeugt einen Receipt. Alle produktiven Bindungen bleiben null. |
| 6. Quellenentscheid | Klare qualifizierte Pflichtquelle, unklare Primärquelle, ungeklärte Bedingungen, kompatible Aussagen und vergleichbarer Konflikt sind getrennt. Optionale Nichtverfügbarkeit allein blockiert nicht; bekannte Konflikte bleiben am Vorgänger oder an einer exakt gebundenen Archivseite erhalten. Neue methodenbezogene Auflösungen erhalten eigene Referenzen/Vorgänger und einen eigenen historischen gesetzlichen Tag. |
| 7. Versionen/CAS/Recovery | Evidence-/Decision-/Version-/Projection-Referenzen, exakter erwarteter Pointer, neue Revision, Operation-/Idempotenzbindung, explizite withdrawal/conflict/reaccept/recover-Pläne. Kein Übergang wird ausgeführt. |
| 8. Öffentliche Zustände/Jobs | accepted/pending/conflict/unavailable/error je Staatsangehörigkeitszelle; Quelle und Prüfstand bleiben referenziert. Originale Quellenzeit statt Cachebauzeit, abgelaufene Projektionen werden abgewiesen. Regeljob und getrennte neutrale Discovery besitzen deduplizierbare Identitäten, gemeinsame Lease/Generation/Backoff/Versuchslimits und unterschiedliche Ergebnisreferenzen, ohne Exactly-once-Behauptung. |
| 9. Adversariale Tests | 63 Tests / 9 Suiten: alle 53 bestehenden Fälle unverändert plus zehn R3-Fälle für neutrale Paar-/Methodenidentität, Deduplizierung, fehlende Rechtsdefaults, Discriminator-/Zellbindung, Jobartverwechslung, Lifecycle und Datenminimierung. |
| 10. Self-Review/Handoff | Reale Kommandos, Ergebnisse, frühere Fehlversuche, Checksummen, unbound Grenzen und nächster verantwortlicher Akteur sind hier dokumentiert. Root-Review ist weiterhin erforderlich. |

## 3. Reale Prüfkommandos und Ergebnisse

Arbeitsverzeichnis bei allen Läufen: `/workspace/scratch/e03d2839d4e5/official-truth-v3-contract`.

Der anfangs vorgegebene Aufruf wurde tatsächlich verwendet:

```bash
npx --yes --package=node@22.23.4 --call 'node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-product-v3/contract.test.ts'
```

Der erste Teilkorpus hatte **12 Tests, davon 4 fehlgeschlagen**. Ursache: Der bestehende `contentEvidenceLookupV3` erwartet eine exakte dreifeldige `RepresentationRef`; das zunächst übergebene siebenfeldige `ContentIdentityBinding` führte zu `invalid_ref`. Der Autor korrigierte Aufrufer und Testhelfer auf die exakte Projektion der drei bestehenden Identitätsfelder. Der vorhandene kanonische Reader wurde nicht gelockert. Root reproduzierte denselben Defekt unabhängig und veröffentlichte **TL CHANGES REQUIRED S0 R1 / A1-F1**: [Review-Kommentar](https://github.com/Jetnity/jetnity/pull/1163#issuecomment-6728861632).

Ein späterer vollständiger Lauf bestand **43/43 Tests**. Der zeitgleiche erste Typecheck der Testdatei scheiterte mit TS2339 an der durch `assert.equal` bereits eingeengten Test-Hilfsfunktion `ok`; diese wurde korrekt auf `assert.fail` im Fehlerzweig umgestellt. Der nächste Typecheck und Lint bestanden. Darauf folgten die mit Root abgestimmten zusätzlichen Fälle für dokumentunabhängige Regeln, MethodUpgrade und Quellenanzeige.

Die anschließenden **46/46 Tests** und damaligen Codehashes sind historisch. [TL CHANGES REQUIRED R2](https://github.com/Jetnity/jetnity/pull/1163#issuecomment-6728933459) verlangte weitere Korrekturen im selben Autoren-Scope. Root und A1 reproduzierten die Fälle unabhängig. Die finale Regression deckt folgende Punkte ab:

| Finding | Korrektur in dieser Lieferung |
| --- | --- |
| A1-F1 / R1 | Exakte dreifeldige RepresentationRef am unveränderten Content-Lookup |
| A1-F2 | MethodUpgrade besitzt neue verknüpfte Auflösung; historische Auflösung wird nicht still überschrieben oder gelöscht |
| A1-F3 | Historische Auflösung prüft Evidence am eigenen `legalAsOfDate`; die aktuelle Pflichtquelle bleibt separat aktuell zu prüfen |
| A1-F4 | Explizit dokumentunabhängiges `not_applicable` wird nicht pauschal als ungeklärt behandelt |
| A1-F5 | Dieselbe kanonische Evidence darf mehrere strukturierte Bedingungskontexte unterstützen; widersprüchliche Evidence-Metadaten unter derselben ID scheitern |
| A1-F6 | Begrenzte aktive Historie plus exakter append-only Archivrecord und Pointer; zehn Fortschreibungen über acht bestehende Records positiv getestet, unaufgelöste Konflikte nicht archivierbar |
| A1-F7 / F7B | Identische unbedingte Legacy/V1/V2-Aussagen können agrees sein; kompatible nicht identische Aussagen besitzen einen methodengebundenen Reproof-Record; einfache optionale Visa-Erweiterung wird nicht als Konflikt akzeptiert |
| Root-Exporthygiene | `OFFICIAL_TRUTH_V3_SCHEMA` ist kein unbenutzter öffentlicher Export mehr; die private Konstante bindet tatsächlich alle Envelope-Schemas |

Der erste R2-Lauf bestand **52/52 Tests**; nach der zusätzlichen expliziten F5-Regression folgten **53/53 Tests in 8 Suiten**, Dauer 1953,85718 ms. Root publizierte die bisherige S0-Lieferung anschließend im Head `19c4736a73f639daaf5337465386155607792a4f`. Kein bestehender kanonischer Reader oder vorhandener Test wurde abgeschwächt.

### R3-Auftrag und konkrete Erweiterung

Der vollständige [TL-Auftrag R3 / 6729202622](https://github.com/Jetnity/jetnity/pull/1163#issuecomment-6729202622) wurde vor Implementierung gelesen. Root bestätigte die kleine typisierte API; U1 bestätigte deren Kompatibilität. M1 war während der Änderung auf Root-Anweisung pausiert. Die neuen Imports werden erst nach Roots unabhängig geprüftem neuen Pin integriert.

| R3-Acceptance | Tatsächlicher Nachweis |
| --- | --- |
| 1. Neutrale bounded Hülle | `createV3CombinationDiscoveryIdentity` bindet ein normalisiertes Katalog-Länderpaar und Methoden-ID/-Revision. `readV3CombinationDiscoveryJobRecord` liest ausschließlich diese Identität, Job-/Operation-/Lifecycle-Felder und eine begrenzte eigene Ergebnisreferenz. Kein RuleContext, Dokument, Route, Zweck oder Faktdefault. |
| 2. Wiederverwendung und kompatibles Pending | Bisherige Länder-/ID-/Methoden-/Zeit-/bounded-JSON-Schemas und intern gemeinsame Lifecycle-Prüfung. Bisheriges Regelpending bleibt gültig; optional `jobKind: rule_research`. Discovery-pending benötigt `jobKind: combination_discovery`, vollständige geprüfte Identität, gleiche Jobschlüssel und exaktes Antwortzellenpaar. |
| 3. Getrennte Autorität | Jobreader erzeugt weder Enqueue-ACK noch Methodenfreigabe, Coverage oder accepted Import. `succeeded` benötigt `combination-discovery-result:v3:` statt einer Regel-/Decision-/Projektionsreferenz. U1/M1 müssen tatsächliche aktuelle Jobbestätigung separat erbringen. |
| 4. Adversariale Regressionen | Zehn neue Tests behandeln Normalisierung, Paar-/Methodendrift, Länder/PII/Unknownkeys, Getter/Zyklen/Größe, Jobart-/Discriminatorverwechslung, gültige und ungültige Leases/Backoff/Revisionen, historische Reclaim-Lesbarkeit und getrennte Pending-Zellen. Alle 53 vorhandenen Tests unverändert. |
| 5. Dokumentation und Gates | R3-Plan, API-/Anschlussdokumentation und diese Übergabe; die vier folgenden Node-22-Gates wurden auf den neuen Code-/Testbytes tatsächlich erneut ausgeführt. Keine neue Dependency oder Produktionsbindung. |

### Historische R3-Gates auf den unveränderten Runtime-/S0-Testbytes

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/contract.test.ts
```

**Exit 0; 63 Tests, 9 Suiten, 63 bestanden, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen, 0 todo.** Gemeldete gesamte Testdauer: 1953,51785 ms. Der erste vollständige R3-Lauf bestand bereits alle Fälle. Dies ist die Dauer dieses lokalen Unit-Testlaufs und kein öffentliches Cache-p95 oder SLO-Nachweis.

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false
```

**Exit 0**, keine TypeScript-Diagnosen. Dies war `tsc` gegen das vorhandene Repository-`tsconfig.json`, ohne neue Next-Typegenerierung und ohne Production-Build.

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node node_modules/eslint/bin/eslint.js lib/readiness/official-truth-product-v3/contract.ts lib/readiness/official-truth-product-v3/contract.test.ts
```

**Exit 0**, keine Lint-Diagnosen. Die Umgebung meldet bei Node-Läufen die bestehende experimentelle `EnvHttpProxyAgent`-Warnung; frühere npx-Läufe melden außerdem `Unknown env config "http-proxy"`. Es gab dadurch keinen übersprungenen Test oder unterdrückten Fehler.

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node scripts/exporte.mjs
```

**Exit 0; 1509 Dateien geprüft, 0 unbegründete Exporte ohne Aufrufer.** Beide neuen öffentlichen Funktionen und Typen werden im tatsächlichen Vertragskorpus verwendet. Keine Hygieneausnahme und kein künstlicher Dummyimport.

`git diff --check` prüfte die fünf jetzt getrackten R3-Dateien mit Exit 0 ohne Whitespace-Diagnose. `sha256sum` und `git hash-object` lieferten die oben dokumentierten Code-/Testidentitäten. Es wurde kein Gitobjekt geschrieben und kein Commit erzeugt.

**Historische unabhängige Root-Rückmeldung zu R2:** Root hatte 53/53 Tests (gemeldete Dauer 1314 ms), tsc Exit 0 und ESLint Exit 0 reproduziert. Außerdem meldete Root 0 unerreichbare Dateien, 0 Exporte ohne Aufrufer, 0 ungenutzte Pakete, API-Schutz 12/12 sowie eine erfolgreiche lokale Prüfung der generierten DB-Typverwendung. Diese früheren unabhängigen Resultate und der publizierte 19c-Freeze gelten nicht automatisch für die neuen R3-Bytes. Root muss R3 gesondert prüfen und pinnen.

### R4: CI-Befund, enge Korrektur und aktuelle Gates

Der vollständige [R4-Auftrag](https://github.com/Jetnity/jetnity/pull/1163#issuecomment-6729560511), Roots persistierte Fehlerzusammenfassung und sein lokales Fehlerlog wurden gelesen. Die vollständige CI auf `ab26914ff01dde64020879b9e41cea8b1e1738aa` (Run `42539983421`, Corejob `128912624543`) meldete **8263 Tests, 8259 bestanden, 2 fehlgeschlagen und 2 geerbte Skips**. Root reproduzierte dieselben beiden Fehler mit **90 Tests, 88 bestanden, 2 fehlgeschlagen, 0 Skips**. Die damaligen fokussierten S0-Gates hatten diese vorhandenen Repository-Inventare nicht abgedeckt; daraus wird nachträglich kein vollständiger CI-PASS.

Nach dem vor Code gemeldeten und von Root ausdrücklich bestätigten Plan wurde ausschließlich `lib/readiness/official-truth-product-v3/contract.ts` in die bestehenden endlichen Inventare aufgenommen. Der Content-Identity-Set-Vergleich und der exakte Anwendbarkeits-Produktionsvergleich bleiben erhalten. Alle bisherigen Assertions und Ablehnungen sind unverändert; die beiden Guard-Diffs enthalten ausschließlich Ergänzungen. Beide Guards prüfen sieben neue negative Varianten: Dateisuffix-Lookalike, ähnlicher Servername, Traversal zu einer ungeprüften Datei, rohe Traversalalias-Schreibweise zum erlaubten Pfad, ungeprüfte Nachbardatei, ähnlicher Ordnername und App-Pfad. Keine Wildcard, dynamische Dateiexistenz-Erlaubnis, Testausnahme oder vorab zugelassene I1-/U1-/M1-Datei.

| Geänderter Guardtest | SHA-256 | Gitblob ohne Schreiben |
| --- | --- | --- |
| `official-truth-content-identity.test.ts` | `1a944277ec49fa5ca50203def58e9fdcc9fd80009bcdacedcb0231e1dbd7ba8c` | `0e452218b7413c989a1551f4a26bd268afc502c6` |
| `regulierungs-anwendbarkeit.test.ts` | `59fb7a2a39bb2a56b1cefe18be22d0d755987acba43433ce87a026e760ea5258` | `658a7f7f2a0699920fca48a348ad1699a2f32fd0` |

Tatsächlich ausgeführter vollständiger Lauf der drei beauftragten Testdateien:

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/contract.test.ts lib/readiness/official-truth-content-identity.test.ts lib/readiness/regulierungs-anwendbarkeit.test.ts
```

**Exit 0: 153 Tests, 16 Suiten, 153 bestanden, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen, 0 todo; 1891,12112 ms.** Die bisher roten Leaf-Tests liefen erfolgreich im vollständigen jeweiligen Dateikorpus. Die zusätzlichen Gegenproben erweitern bestehende Tests und erhöhen daher nicht deren Anzahl. Kein Runtime-/S0-Test wurde geändert.

Weitere tatsächlich ausgeführte R4-Gates mit demselben Node 22.23.4:

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node node_modules/eslint/bin/eslint.js lib/readiness/official-truth-content-identity.test.ts lib/readiness/regulierungs-anwendbarkeit.test.ts
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node scripts/erreichbarkeit.mjs
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node scripts/exporte.mjs
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node scripts/pakete.mjs
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node scripts/api-schutz.mjs
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node scripts/db/verwendung.mjs --pruefen
```

| Gate | Reales Ergebnis |
| --- | --- |
| TypeScript / gezieltes ESLint | Jeweils Exit 0, keine Diagnosen |
| Erreichbarkeit | Exit 0; 1122 Startpunkte, 2069 erreichbare Module, 0 verwaist |
| Exporte | Exit 0; 1509 Dateien, 0 Exporte ohne Aufrufer |
| Pakete | Exit 0; 12 Dependencies und 2 DevDependencies geprüft, jeweils 0 ohne Verwendung; bestehende konfigurationsgebundene Ausnahmen separat vom Skript ausgewiesen |
| API-Schutz | Exit 0; 12 Admin-Routen verwenden den zentralen Gate |
| Lokaler Schema-Bezug | Exit 0; gegen 22 Tabellen/Views und 25 Funktionen der generierten Typdatei geprüft; bestehende LOCAL/UNAPPLIED-Verweise separat ausgewiesen. Ausschließlich Dateianalyse, kein Datenbankzugang und kein Live-Schemanachweis |
| Diff-/Identitätskontrolle | `git diff --check` Exit 0; exakt die zwei Guardtests und S0-Plan/Handoff geändert. Runtime, S0-Testkorpus und S0_CONTRACT unverändert |

Die bestehenden experimentellen `EnvHttpProxyAgent`-Warnungen waren vorhanden, ohne Testskip oder unterdrückte Fehler. Der erste vollständige R4-Lauf bestand alle Fälle. Ein neuer vollständiger CI-/Build-Erfolg wird hier nicht behauptet; Root führt die neuen Exact-Head-Gates nach Veröffentlichung aus.

### Nicht ausgeführt / nicht behauptet

Kein eigener `npm ci`: Root stellte den vorhandenen npm-ci-Bestand über den lokal ignorierten untracked `node_modules`-Symlink bereit. Keine Dependency- oder Lockfileänderung. Kein Production-Build, keine vollständige Repository-Testsuite und kein eigener vollständiger Hosted-CI-Lauf. Die drei vollständigen beauftragten Testdateien und lokalen Hygieneprüfungen liefen wie oben protokolliert. Keine Browser-, Real-Device-, Vercel-, Datenbank-, Auth-, RLS-, ACL-, Credential-, Provider- oder Production-Prüfung wurde durchgeführt. S0 besitzt dafür keinen aktiven Produktpfad.

## 4. Selbstreview: materielle Grenzen und verbleibende Risiken

**Autorität:** Diese Implementierung kann keine amtliche Regel freischalten. Die Rückgabe eines `V3SourceDecisionRecord`, einer als accepted beschriebenen Version oder eines PublicResponseRecords ist reine Datenvalidierung. I1 muss echte Originale und methodengültige Qualifikation/Vergleiche/Auflösungen getrennt nachweisen; die Methode muss einmal durch den Owner freigegeben werden. Danach soll der gebundene Dienst routinemäßig innerhalb dieser Methode arbeiten können. Es entsteht kein Ownerklick je Regel.

**Konflikte:** S0 prüft exakten normalisierten Kontext, Faktart, Rechtsgültigkeitsüberlappung, voneinander getrennte ContentItem-Referenzen und innere Referenzkonsistenz. Unbedingte Wrappergleichheit und eine eng definierte nicht exklusive optionale Erweiterung werden von Konflikten unterschieden. Außerhalb dieser engen Sicherungen beweist eine Faktabweichung noch keine rechtliche Unvereinbarkeit, ein kompatibler Datenrecord noch keine echte Kompatibilität und verschiedene IDs allein keine tatsächliche Publikationsunabhängigkeit. Der semantische Methodenprüfer muss dies später vor einer wirklichen Annahme anhand der gebundenen Vergleichs-/Auflösungsnachweise belegen. Eine neu erfundene Genesis oder ein aus JSON kopierter Vorgänger ersetzt nicht den tatsächlichen aktuellen Store-Head.

**Persistenz und Recovery:** CAS, Lease-Fencing, durable Queue, Transaktion, Widerruf, Commit/Confirm, atomare Cacheinvalidierung und historische Archivierung sind hier Datenobligationen, keine implementierten Datenbankoperationen. Der gebundene Archivappend erhält vollständige aufgelöste Records auf begrenzten Seiten und verlängert eine unveränderliche Pointerkette; er bestätigt keine tatsächliche Speicherung. M1/I1 müssen Archiv-Custody und aktuelle Methodenbedeutung vor beziehungsweise atomar mit der Head-Fortschreibung nachweisen; der Archivport bleibt null. Der Idempotenzhash ist keine verbrauchte Operation oder Annahmebestätigung. Recovery muss gegen die dann gültige Methode und aktuelle Pflichtquelle neu geprüft werden; ein alter Receipt erhält keine nachträgliche V3-Bedeutung.

**R3-Discovery und Pending:** Die neue Paaridentität beschreibt unbekannte Kombinationen ohne behaupteten Regelplan. Sie ersetzt weder die tatsächliche aktuelle Methodenfreigabe noch den separat besessenen Enqueue-/Reclaim-Port. Ein lesbarer Jobrecord kann synthetisch oder kopiert sein. U1 muss vor Discovery-pending einen tatsächlich bestätigten passenden aktiven Job nachweisen; `succeeded` ist keine Bestätigung noch laufender Recherche. Die opaque Ergebnisreferenz beschreibt keine gefundenen Regeln und erlaubt keine öffentliche Annahme. Spätere Discovery-Ergebnisse müssen durch die vorhandenen Qualifikations-/Original-/Proposal-/Importgrenzen. Die tatsächliche Queue, dauerhafte Deduplizierung, Ergebnisauflösung und Workerimplementierung gehören nicht zu S0. Der vollständige Anschluss für U1/M1 ist in `S0_CONTRACT.md` beschrieben.

**Kompatibilität:** Der Legacy-Store schließt Schema-1-Anwendbarkeit und Schema-2-Träger aus. Strukturierte V3-Fakten bleiben deshalb dort unbound; kein Cast oder Abflachen wurde eingeführt. I1 muss einen ausdrücklich geprüften kompatiblen Pfad anbinden. Es gibt keinen stillen Import aus #1135 und keinen zweiten Truth-Store.

**Zeit und Leistung:** Der gesetzliche Kalendertag wird getrennt übergeben, weil UTC keine amtliche Zeitzonenentscheidung ersetzt. Die tatsächliche methodengültige Berechnung von Frischefristen muss später der gebundene Produzent liefern. S0 verhindert nur widersprüchliche oder abgelaufene Datenhüllen. Stunden-/24h-Parameter bleiben Betriebsentwürfe. Kein gemessenes öffentliches p95, keine Quellenverfügbarkeitsgarantie und keine Exactly-once-Zusage.

**Pflichtquellenanzeige U1:** U1 löst die exakte gepinnte `projection.rule.subject.evidence.source` mit `resolveV3PublicSourceDisplay` gegen den bereits geladenen kanonischen Registry-Snapshot auf. Derselbe vorhandene Content-/Authority-Snapshot liefert amtlichen Namen und URL, synchron und ohne Forschung im Antwortpfad. Fehlender, gesperrter, nicht aktueller oder versionsabweichender Pin scheitert geschlossen. U1 muss einen solchen betroffenen Eintrag ehrlich nicht verfügbar darstellen; ein freier Name oder geratenes URL-Feld ist kein Fallback. Der vollständige Ablauf und die Wiederverwendung stehen in `S0_CONTRACT.md`.

**Security, Datenbank und Kosten:** Kein Auth-/Rechte-/Sessionwechsel, keine Migration, kein SQL, kein Secret, kein Modell-/Netzprovider, kein Scheduler, keine Route/Navigation und keine neue laufende Ausgabe. Private Felder, freie Payloads, Fehler-Echos und untrusted Autoritätsbehauptungen sind lokal negativ getestet. Ein Hash beziehungsweise ein serialisiertes Objekt wird niemals von einem dieser Leser als Trusted-Receipt ausgegeben.

## 5. Nächster verantwortlicher Schritt und STOP

**Root/TL:** Den engen R4-Guard-/Dokumentdiff unabhängig prüfen, den konkreten neuen Head publizieren und vollständige Exact-Head-Gates ausführen. Weitere fertige I1-/U1-/M1-Importer erst nach eigenem Review mit exakten Branchpins seriell zuweisen; R4 erlaubt davon keinen Pfad vorab. Root hält zentrale Architektur-/Entscheidungs-/Continuity-Dokumente und GitHub-/CI-/Release-Evidence aktuell.

**Autor:** STOP nach dieser Lieferung. Kein Ready, kein Merge, kein Commit/Push und kein Folgeslice. Unmittelbare konkrete Reviewkorrekturen erfolgen bei Bedarf in derselben Session und führen zu neuen Bytes und erneuten Gates.

#917/#1139 bleiben in ihren bestehenden Nachweis-/Plattformgrenzen. Kein Retry, Umformulieren, Delegieren, Alternativoperator oder menschlicher SQL-Ersatz wurde angestoßen. #1131 bleibt eigenständiger Ready-STOP. Methode, vollständiges Dev-Paket und konkrete Aktivierung benötigen weiterhin die reservierte Ownerfreigabe.
