# S0 — Shared Contract 1: Selbstprüfung und Übergabe

**Logischer Autor:** Jetnity Official Truth V3 Shared Contract 1 — Codex Generation 1

**Session:** `/root/v3_contract_writer`; Modell laut Session: GPT-6 Astra Pro

**Auftrag:** `PROGRAM_V1.md`, S0 TASK V1, Programmissue #1162, Draft-PR #1163

**Branch:** `feat/official-truth-v3-shared-contract-1-20261109`

**Basemain:** `ce3366e26de73961d4682236af92347bfc3a4ca8`

**Seedhead / unveränderter Autoren-HEAD:** `7f940d5620ef194c86a82b570751b2fea94fef92`

**Stand:** R2-Korrektur, Implementierung und lokale fokussierte Prüfungen abgeschlossen; unabhängiger TL-Re-Review/Freeze offen. Die früheren 46-Test-Hashes sind historisch; diese Übergabe bindet die unten genannten R2-Bytes. Kein TL-PASS, kein Ready und kein Merge durch den Autor.

## 1. Gelieferte Bytes und Ownership

| Datei | Zweck |
| --- | --- |
| `lib/readiness/official-truth-product-v3/contract.ts` | Ruhende versionierte Runtime-Leser, Identitätsbildung, reine Quellenanzeigeauflösung und getrennte unbound Methodenautoritätsnaht |
| `lib/readiness/official-truth-product-v3/contract.test.ts` | 53 lokale synthetische Tests, ohne Netzwerk-/DB-/Provider- oder Secretbedarf |
| `docs/official-truth-product-v3/S0_IMPLEMENTATION_PLAN.md` | Vor Implementierung festgehaltener enger Plan und Grenzen |
| `docs/official-truth-product-v3/S0_CONTRACT.md` | Konkrete API, Kompatibilitätszuordnung und Integrationspflichten für I1/U1/M1 |
| `docs/official-truth-product-v3/S0_SELF_REVIEW_HANDOFF.md` | Diese tatsächlichen Prüfergebnisse und Übergabe |

Es gibt keine `fixtures.ts`; sämtliche fiktiven `.example`-Daten und die ausdrücklich synthetischen Passseiten-Fakten bleiben in der Testdatei. Kein produktiver Fallback und keine echte Visa-Aussage wurden angelegt.

Der Autor hat keine anderen Dateien geändert, keinen Git-Commit/Push und keine GitHub-Mutation ausgeführt. Root hat parallel die vier zentralen Dateien `ARCHITECTURE.md`, `DECISIONS.md`, `JETNITY_VISION.md` und `ROADMAP.md` geändert; diese Änderungen gehören nicht zum Autoren-Self-Review. `PROGRAM_V1.md` blieb unverändert. Ein UI-Rename der Session wurde nicht behauptet.

### Code-/Testidentität vor Root-Publikation

| Datei | SHA-256 | Gitblob, ohne Schreiben ermittelt |
| --- | --- | --- |
| `contract.ts` | `651bba4c771d642f9c50637f02dad80aabfeff482f6f00c4f7be8decf99f67f3` | `4b86a991cca66bcbaead25924272c0b586c36fc2` |
| `contract.test.ts` | `d6ba46d83fb24de53ca4c108014eff8100901267e236d9438b2dfe5f84270ada` | `bad6b32a8fc4c580fa9b33877dc22025e25370b4` |

Root publiziert die geprüften Bytes und stellt den tatsächlichen neuen Head fest. Dieser Autoren-HEAD enthält die uncommitteten Implementierungsdateien noch nicht; die Tabellenwerte binden exakt die geprüften Arbeitsdateien und sind keine Commit- oder Herkunftsreceipts.

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
| 8. Öffentliche Zustände/Jobs | accepted/pending/conflict/unavailable/error je Staatsangehörigkeitszelle; Quelle und Prüfstand bleiben referenziert. Originale Quellenzeit statt Cachebauzeit, abgelaufene Projektionen werden abgewiesen. Deduplizierbarer Job mit Lease/Generation/Backoff/Versuchslimit, ohne Exactly-once-Behauptung. |
| 9. Adversariale Tests | 53 Tests / 8 Suiten: Normalisierung, echte vorhandene Parser, unbekannte Länder/Keys, falsche Referenzen, Bedingungen, Konflikterhalt, historische Auflösung, Archivfortschreibung, methodengebundene Kompatibilität, Methodenwechsel, Dokumentunabhängigkeit, Uhr-/Datumsgrenzen, CAS/Recovery, Mehrfachzellen, wiederverwendbare Evidence, Getter/Zyklen/Prototypen/PII/Größen und geschlossene Bindungen. |
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

Der erste R2-Lauf bestand **52/52 Tests**; nach der zusätzlichen expliziten F5-Regression folgte der unten protokollierte finale Lauf. Kein bestehender kanonischer Reader oder vorhandener Test wurde abgeschwächt.

### Finale Gates auf den oben genannten Code-/Testbytes

```bash
/home/agent/.npm/_npx/361c55be1121897e/node_modules/node/bin/node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=spec lib/readiness/official-truth-product-v3/contract.test.ts
```

**Exit 0; 53 Tests, 8 Suiten, 53 bestanden, 0 fehlgeschlagen, 0 übersprungen, 0 todo.** Gemeldete gesamte Testdauer: 1953,85718 ms. Dies ist die Dauer dieses lokalen Unit-Testlaufs und kein öffentliches Cache-p95 oder SLO-Nachweis.

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

**Exit 0; 1509 Dateien geprüft, 0 unbegründete Exporte ohne Aufrufer.** Dies behebt den zuvor von Root konkret gemeldeten Exporthygienefehler ohne Ausnahme oder künstlichen Dummyimport.

`git diff --check` lief mit Exit 0; weil die Autoren-Dateien vor Root-Publikation untracked sind, bindet dies zunächst nur den getrackten Diff. Zusätzlich wurde jede der fünf neuen Dateien mit `git diff --no-index --check /dev/null <Datei>` geprüft. Dabei zunächst gefundene Markdown-Zeilenendleerzeichen in den Metadaten wurden entfernt; die finalen fünf Aufrufe lieferten jeweils Exit 1 ohne Ausgabe. Exit 1 zeigt hier den erwarteten neuen Dateiinhalt gegenüber `/dev/null`, ohne Whitespace-Diagnosen. `sha256sum` und `git hash-object` lieferten die oben dokumentierten Code-/Testidentitäten.

**Unabhängige Root-Rückmeldung:** Root hat auf denselben finalen Code-/Testbytes 53/53 Tests (gemeldete Dauer 1314 ms), tsc Exit 0 und ESLint Exit 0 reproduziert. Außerdem meldete Root 0 unerreichbare Dateien, 0 Exporte ohne Aufrufer, 0 ungenutzte Pakete, API-Schutz 12/12 sowie eine erfolgreiche lokale Prüfung der generierten DB-Typverwendung. Root hat den vollständigen Vertrag, die geänderten Tests, Vertragsdokumentation und den Plan gelesen. Dies sind ausdrücklich von Root gemeldete unabhängige Resultate; der abschließende A1-Re-Review und TL-Freeze bleiben davon getrennt.

### Nicht ausgeführt / nicht behauptet

Kein eigener `npm ci`: Root stellte den vorhandenen npm-ci-Bestand über den lokal ignorierten untracked `node_modules`-Symlink bereit. Keine Dependency- oder Lockfileänderung. Kein Production-Build, keine vollständige bestehende Testsuite und kein vollständiger Hygiene-/CI-Lauf; Root hatte fokussierte Runtime-Tests, tsc und Lint als erste Gates beauftragt. Keine Browser-, Real-Device-, Vercel-, Datenbank-, Auth-, RLS-, ACL-, Credential-, Provider- oder Production-Prüfung wurde durchgeführt. S0 besitzt dafür keinen aktiven Produktpfad.

## 4. Selbstreview: materielle Grenzen und verbleibende Risiken

**Autorität:** Diese Implementierung kann keine amtliche Regel freischalten. Die Rückgabe eines `V3SourceDecisionRecord`, einer als accepted beschriebenen Version oder eines PublicResponseRecords ist reine Datenvalidierung. I1 muss echte Originale und methodengültige Qualifikation/Vergleiche/Auflösungen getrennt nachweisen; die Methode muss einmal durch den Owner freigegeben werden. Danach soll der gebundene Dienst routinemäßig innerhalb dieser Methode arbeiten können. Es entsteht kein Ownerklick je Regel.

**Konflikte:** S0 prüft exakten normalisierten Kontext, Faktart, Rechtsgültigkeitsüberlappung, voneinander getrennte ContentItem-Referenzen und innere Referenzkonsistenz. Unbedingte Wrappergleichheit und eine eng definierte nicht exklusive optionale Erweiterung werden von Konflikten unterschieden. Außerhalb dieser engen Sicherungen beweist eine Faktabweichung noch keine rechtliche Unvereinbarkeit, ein kompatibler Datenrecord noch keine echte Kompatibilität und verschiedene IDs allein keine tatsächliche Publikationsunabhängigkeit. Der semantische Methodenprüfer muss dies später vor einer wirklichen Annahme anhand der gebundenen Vergleichs-/Auflösungsnachweise belegen. Eine neu erfundene Genesis oder ein aus JSON kopierter Vorgänger ersetzt nicht den tatsächlichen aktuellen Store-Head.

**Persistenz und Recovery:** CAS, Lease-Fencing, durable Queue, Transaktion, Widerruf, Commit/Confirm, atomare Cacheinvalidierung und historische Archivierung sind hier Datenobligationen, keine implementierten Datenbankoperationen. Der gebundene Archivappend erhält vollständige aufgelöste Records auf begrenzten Seiten und verlängert eine unveränderliche Pointerkette; er bestätigt keine tatsächliche Speicherung. M1/I1 müssen Archiv-Custody und aktuelle Methodenbedeutung vor beziehungsweise atomar mit der Head-Fortschreibung nachweisen; der Archivport bleibt null. Der Idempotenzhash ist keine verbrauchte Operation oder Annahmebestätigung. Recovery muss gegen die dann gültige Methode und aktuelle Pflichtquelle neu geprüft werden; ein alter Receipt erhält keine nachträgliche V3-Bedeutung.

**Kompatibilität:** Der Legacy-Store schließt Schema-1-Anwendbarkeit und Schema-2-Träger aus. Strukturierte V3-Fakten bleiben deshalb dort unbound; kein Cast oder Abflachen wurde eingeführt. I1 muss einen ausdrücklich geprüften kompatiblen Pfad anbinden. Es gibt keinen stillen Import aus #1135 und keinen zweiten Truth-Store.

**Zeit und Leistung:** Der gesetzliche Kalendertag wird getrennt übergeben, weil UTC keine amtliche Zeitzonenentscheidung ersetzt. Die tatsächliche methodengültige Berechnung von Frischefristen muss später der gebundene Produzent liefern. S0 verhindert nur widersprüchliche oder abgelaufene Datenhüllen. Stunden-/24h-Parameter bleiben Betriebsentwürfe. Kein gemessenes öffentliches p95, keine Quellenverfügbarkeitsgarantie und keine Exactly-once-Zusage.

**Pflichtquellenanzeige U1:** U1 löst die exakte gepinnte `projection.rule.subject.evidence.source` mit `resolveV3PublicSourceDisplay` gegen den bereits geladenen kanonischen Registry-Snapshot auf. Derselbe vorhandene Content-/Authority-Snapshot liefert amtlichen Namen und URL, synchron und ohne Forschung im Antwortpfad. Fehlender, gesperrter, nicht aktueller oder versionsabweichender Pin scheitert geschlossen. U1 muss einen solchen betroffenen Eintrag ehrlich nicht verfügbar darstellen; ein freier Name oder geratenes URL-Feld ist kein Fallback. Der vollständige Ablauf und die Wiederverwendung stehen in `S0_CONTRACT.md`.

**Security, Datenbank und Kosten:** Kein Auth-/Rechte-/Sessionwechsel, keine Migration, kein SQL, kein Secret, kein Modell-/Netzprovider, kein Scheduler, keine Route/Navigation und keine neue laufende Ausgabe. Private Felder, freie Payloads, Fehler-Echos und untrusted Autoritätsbehauptungen sind lokal negativ getestet. Ein Hash beziehungsweise ein serialisiertes Objekt wird niemals von einem dieser Leser als Trusted-Receipt ausgegeben.

## 5. Nächster verantwortlicher Schritt und STOP

**Root/TL:** Nach der bereits gemeldeten unabhängigen Code-/Gate-Prüfung die finale Übergabe übernehmen, den konkreten Codehead publizieren, A1-Re-Review einschließlich aller R1-/R2-Findings abschließen und erst danach S0 exakt für I1/U1/M1 einfrieren. Root hält zentrale Architektur-/Entscheidungs-/Continuity-Dokumente und GitHub-/CI-/Release-Evidence aktuell.

**Autor:** STOP nach dieser Lieferung. Kein Ready, kein Merge, kein Commit/Push und kein Folgeslice. Unmittelbare konkrete Reviewkorrekturen erfolgen bei Bedarf in derselben Session und führen zu neuen Bytes und erneuten Gates.

#917/#1139 bleiben in ihren bestehenden Nachweis-/Plattformgrenzen. Kein Retry, Umformulieren, Delegieren, Alternativoperator oder menschlicher SQL-Ersatz wurde angestoßen. #1131 bleibt eigenständiger Ready-STOP. Methode, vollständiges Dev-Paket und konkrete Aktivierung benötigen weiterhin die reservierte Ownerfreigabe.
