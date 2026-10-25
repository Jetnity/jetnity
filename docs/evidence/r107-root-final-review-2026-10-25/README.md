# R107 — Gesamtzusammenstellung der Root-Review-Evidence

## Status: fünf Produkt-Lanes abgeschlossen; eigene Docs-Gates offen

Dieses Archiv bewahrt die begrenzten unabhängigen Review-Belege des endlichen R107-Pakets. **T, S, D, W und M sind einschließlich Actual-main abgeschlossen.** Der eigene Dokumentations-PR, seine unabhängige Abnahme und spätere Actual-main-Gates bleiben PENDING. Diese Zusammenstellung verändert keine historische Evidenz und erteilt selbst keinen PASS oder Folgeauftrag.

Aktueller vollständig akzeptierter Main ist **b932d15ac99fe4bbb1f3ecc22579e5c2e9c15006**, Tree **503752c1bee097f5bba47487061415730429cc57**, Eltern 70b/dda. Root mergte M am **21:59:54 UTC** und bestätigte [POST-MERGE PASS 6404092020](https://github.com/Jetnity/jetnity/pull/1019#issuecomment-6404092020) auf Basis der tatsächlichen Main-Gates und Production-/Domain-Prüfung vom **22:13:02 UTC**. Tracking #1014 wurde danach **22:13:46 UTC** ausdrücklich completed geschlossen; Readback **22:13:54 UTC**. [V24 6404106059](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6404106059) und die aktuellen Index-/M-PR-Präfixe wurden **22:15:20 UTC** unabhängig exakt zurückgelesen. Alle ursprünglichen Sessions bleiben STOP.

Alle hier enthaltenen Ausführungs- und Review-Angaben stammen aus bereits vorhandenen Dateien. Für das Kopieren, Ordnen und Deklarieren dieser Zusammenstellung wurden keine Tests, CSS-Builds, Browserläufe, Installationen, externen Schreibaktionen oder Produktcodeänderungen ausgeführt.

## Zusammensetzung und Zählweise

| Kategorie | Artefakte | Raw / Projektionen | Umfang |
| --- | ---: | ---: | --- |
| Historischer erster Review-Satz | 69 | 63 / 6 | Alle bisherigen T/D/W/M/S-Artefaktbytes und bisherigen Artefaktpfade erhalten |
| D-Integrationsnachtrag | 3 | 3 / 0 | `D-integration/REVIEW.md`, `source-binding.json`, `root-source-verification.json` |
| T-Native-Checkout-Nachtrag | 1 | 1 / 0 | `T-native-checkout-binding.json`, Rekonstruktion ursprünglicher Log-/Commit-Metadaten |
| W-Integrationsnachtrag | 16 | 15 / 1 | Quellen-/CSS-/Applicability-/Ausführungsbindung und Root-Abgleich |
| M-Integrationsnachtrag | 31 | 30 / 1 | Gebundene Source-/CSS-/Bundle-Evidence und genau eine tatsächlich ausgeführte begrenzte Root-Layoutprüfung |
| **Historische Artefakte insgesamt** | **120** | **112 / 8** | Fünf Actual-main-Abschlüsse separat in Root-Receipts belegt |

Zusätzlich bleiben **sechs bisherige Dokumentationsdateien byteidentisch** erhalten: ursprüngliches 69er-README/-Manifest sowie W- und M-README/-Manifest. Dieses neue README und das neue Gesamtmanifest sind **zwei neue Metadatendateien**. Damit umfasst die Zusammenstellung **128 Dateien**. Metadatendateien werden nicht als zusätzliche historische Laufzeitbeweise gezählt. **17 Code-/Diff-Anhänge liegen ausschließlich als inerte `.txt`-Dateien vor**; ihre historischen Quellbytes bleiben unverändert.

## Historisches 69er-Manifest bleibt erhalten

Die 69 historischen Artefakte liegen weiterhin an ihren bisherigen Pfaden unter `T/`, `D/`, `W-focus/`, `W-layout/`, `M-final/`, `M-query-historical/` und `S/`. Keine historische Rohdatei oder bereits erklärte Projektion wurde umgeschrieben.

Das ursprüngliche [README](historical-69/README.md) und [Inclusion-Manifest](historical-69/SHA256-INCLUSION-MANIFEST.json) sind unter `historical-69/` **byteidentisch erhalten**. Ihre einzige Änderung ist der Ort in dieser neuen Zusammenstellung. Das alte Manifest bleibt die historische Beschreibung der ursprünglichen 69 Artefakte; sein früherer Root-README-Pin bezeichnet die dort archivierte ursprüngliche README-Datei und nicht dieses neue Gesamt-README. Es wird nicht als Manifest der zusätzlichen T/D/W/M-Dateien ausgegeben.

Für den tatsächlichen Umfang dieser Zusammenstellung gilt das neue [SHA256-INCLUSION-MANIFEST.json](SHA256-INCLUSION-MANIFEST.json). Es verzeichnet getrennt Artefakte, bewahrte Dokumentation, ursprüngliche und neue Pfade, Bytehashes, Raw-/Projektionsstatus und die separat offenen eigenen Docs-Gates. Sein eigener Hash wird außerhalb des Manifests berechnet, nicht selbstreferenziell eingebettet.

## Acht erklärte Projektionen

Die **sechs bestehenden Projektionen** werden vollständig byteidentisch aus dem historischen Satz übernommen. Ihre ursprünglichen Beschreibungen, Originalpfade, Originalgrößen und Originaldigests bleiben erhalten. Das neue Manifest übernimmt diese Angaben ohne neue Transformation.

Der W-Nachtrag enthält **eine siebte, gesondert deklarierte Projektion**: aus `historical-bundle-source-binding.json` werden ausschließlich die 1.689 `dependencyInputs`-Zeilen entfernt. Alle 54 `repositoryInputs`-Zeilen und alle übrigen Originalschlüssel/-werte bleiben erhalten. Originalpfad, Originalgröße, Originaldigest, entfernte Felder und Original-/Restzähler sind in der Projektionsdatei und ihrem [unveränderten W-Manifest](W-integration/SHA256-INCLUSION-MANIFEST.json) angegeben. Vollständige Metadaten der 1.324 CSS-Inputs und 57 Applicability-Inputs bleiben im W-Nachtrag raw erhalten.

Der M-Nachtrag enthält **eine achte, ebenfalls gesondert erklärte Projektion**: aus `bundle-build-receipt.json` werden ausschließlich 1.679 `dependencyInputs`-Zeilen entfernt. Alle 19 Repository-Zeilen und alle anderen Originalfelder bleiben erhalten. Das vollständige 1.395.160-Byte-Bundle-Metafile wird ausgeschlossen, nicht zusätzlich projiziert; Originaldigest und 1.698 Inputzählungen bleiben im [unveränderten M-Teilmanifest](M-integration/SHA256-INCLUSION-MANIFEST.json) dokumentiert. Das vollständige Source-Proof mit 1.330 Scan- plus 13 Support-Zeilen bleibt raw erhalten.

Eine Projektion hat ihren eigenen Archiv-Bytehash und wird niemals als byteidentisches vollständiges Original ausgegeben. Bei dieser Gesamtzusammenstellung wurde keine weitere Projektion erstellt.

## Was die Nachträge belegen

**T:** Der ursprüngliche native PR-Checkout **43ab9de4d825a9bd39d99435db545dde2f0e1e69** hat Eltern a74/fe und den akzeptierten Tree0bda. Die vorhandene Metadatenrekonstruktion ist kein neuer Testlauf und erfindet keine Run-Attempt-Zahl.

**D:** Die drei Dateien binden das f2-Integrationsdelta und unveränderte historische Inputs. Ihre damaligen Pending-Angaben bleiben erhalten. Der tatsächliche spätere [D-POST-MERGE-PASS 6402768984](https://github.com/Jetnity/jetnity/pull/1020#issuecomment-6402768984) ist die Abnahmeautorität; die Archivdateien werden nicht rückwirkend mit grünen Ausführungen überschrieben.

**W:** [Source-Receipt 6402978889](https://github.com/Jetnity/jetnity/pull/1018#issuecomment-6402978889) akzeptiert anwendbare CSS-Regelgleichheit ausschließlich für den exakt gebundenen retained dense40 / first12-visible / first-editor-open Harness einschließlich Wrappern. Vollständiges finales CSS **ba1f5238e5afcbc42d134de5e6820f206143db8b175b5168123d83bce4207a67** und historisches CSS **b1ca9a5fdfee85f34812d64c71cb7d643ff5ae7b74ce9c89e939401d7b6586cc** unterscheiden sich um sechs zusätzliche klassengebundene Regeln /383 Bytes; keine alte Regel wurde entfernt oder geändert. Kein Browser-Replay, keine frische Geometrie, keine volle CSS-Identität und keine produktionsweite Äquivalenz werden behauptet. Der spätere [W-POST-MERGE-PASS 6403228897](https://github.com/Jetnity/jetnity/pull/1018#issuecomment-6403228897) ist davon getrennt.

Root verifizierte den separaten W-Nachtrag am 20:51:44 UTC unabhängig:16 Artefakte/18 Dateien, exakte Projektion, keine Fehler. Der separate Root-Verifikationsrecord wird im Gesamtmanifest mit Pfad und Digest referenziert; er wird in dieser ausdrücklich begrenzten Zusammenstellung nicht als zusätzliche kopierte Datei mitgezählt.

**M:** Root akzeptierte die begrenzte Source-/Evidence-/CSS-/Layout-Bindung in [6403415810](https://github.com/Jetnity/jetnity/pull/1019#issuecomment-6403415810). Er prüfte 1.330+13 Source-Inputs, 19 Repository- / 1.679 Dependency- / 1.698 Metafile-Inputs sowie 128 lokale / 119 aktuelle Tree-Bindungen ohne Abweichung. Root führte am 21:15:41.259 UTC **genau den bestehenden Vierbreiten-/32-Pixel-Root-/48-Zeilen-Layoutblock einmal** aus: Node 24.22.1, Chromium 140.0.7339.16, Exit 0. Alle vier PNGs wurden visuell gelesen; sie sind Viewport-Crops. Die alten author18 / root15/Query-Suites wurden nicht neu ausgeführt. Es gibt weiterhin keinen historischen M-CSS-Output/-Hash; keine historische Stylesheet-Identität oder volle Next-/Hosted-/Device-Abnahme wird daraus abgeleitet.

Root verifizierte den separaten M-Nachtrag um 21:40:23 UTC unabhängig: 31 Artefakte / 33 Dateien, 30 raw / eine Projektion, alle19 Repository-Zeilen erhalten, keine Fehler. Der gesonderte Root-Archivrecord ist im Gesamtmanifest extern mit Digest referenziert und nicht als zusätzliche kopierte Datei gezählt.

**Kandidaten-Gates abgeschlossen, Historie bleibt erhalten:** Der erste App-Job121291522425 endet cancelled trotz erfolgreicher Schritte/TAP. Die gezielte unveränderte Wiederholung **121298926742** / Run40233993166 lief **21:38:35–21:57:55 UTC SUCCESS**; Root las7340Tests/7338pass/0fail/0TAPcancel/2Skips/0todo,Node22.23.3,181Warnungen und alleGuard-/Typecheck-/Build-/Scan-Ergebnisse. Die zuletzt sichtbare Auth-API-ID **121298927664** trägt die **ursprünglichen Zeiten21:07:31–21:08:06 UTC von Job121291522601**; es wird keine neue Auth-Ausführung behauptet. Keine Head-/Workflowänderung. [FINAL PASS6403918520](https://github.com/Jetnity/jetnity/pull/1019#issuecomment-6403918520) und normaler Merge sind erfolgt; erster cancelled Job und nicht unabhängig annotierte Timeout-Erklärung bleiben historisch unverändert.

**Actual-main abgeschlossen:** Run **40238081661**, App **121303856737 SUCCESS** (**21:59:59–22:12:16 UTC**), Auth **121303856837 SUCCESS** (**21:59:59–22:00:33 UTC**) auf tatsächlichem Checkout **b932d15ac99fe4bbb1f3ecc22579e5c2e9c15006** / push / main / Basis 70b. Root las beide vollständigen Original-Logs: Node **22.23.3**, **7.340 Tests / 7.338 bestanden / 0 fehlgeschlagen / 0 abgebrochen / 2 bekannte Skips / 0 todo**, **181 Warnungen**, alle fünf Guards, Typecheck, Build und beide Repository-Kompatibilitätsscans bestanden; Auth **55 erwartete Werte / 243 Schlüssel**, alle passend. Production **dpl_DmuuHdo12oKGCD15wepPJX4hYY2S** war **22:13:02 UTC READY / exakt b932 / main / production**, korrektes Projekt **prj_wTTVawPItEO7a4HihEmaU3PsuaXM**, aliasError null. Die separat gelesene direkte Domain `jetnity.com` band dasselbe Projekt/Deployment, redirect null. [POST-MERGE PASS 6404092020](https://github.com/Jetnity/jetnity/pull/1019#issuecomment-6404092020) bleibt von den Kandidaten- und historischen Layoutbelegen getrennt.

## Historische Fehler und offene Grenzen

Der a547-Aggregate-Exit1, damalige Layoutfehler, ältere PENDING-/False-/Draft-Angaben, Original-Ausführungsköpfe und alle Einschränkungen bleiben unverändert. Spätere Root-Receipts aktualisieren den Projektstand, nicht die historischen Bytes. Frühere M-Fälle bleiben Vorintegrations-Evidence; die neue begrenzte M-Layoutausführung ist gesondert gebunden und wird nicht rückwirkend auf alte Läufe übertragen. Ein fehlender ursprünglicher M-CSS-Output/-Hash wird nicht erfunden.

Node-24-/Chromium-/Mock-/CSS-Bindungen sind von nativer Node-22-CI und Hosted-Auth/SQL/RLS/Production-/Device-Nachweisen getrennt. S bleibt abgeschlossene Triage mit40 vorläufigen P1+2P2, ohne Remediation oder S-FIX. Bestehende Warnungen, Skips, Gast-/Unmount-/Readback-Grenzen sowie sämtliche besonderen Holds bleiben erhalten. Das Archiv verleiht keine globale Security-/V1-/Launch-Freigabe.

## Bewusst ausgeschlossene Daten und nächste Einbindung

Keine vollständigen Git-Trees, staged Implementierungsquellen, node_modules, vollständigen kompilierten CSS-/JavaScript-Bundles, Secrets, Nutzerdaten oder Autor-Duplikate werden neu aufgenommen. Historische Metadaten dürfen auf bewusst ausgelassene Dateien verweisen; sie werden deshalb nicht umgeschrieben. Die inerten Code-Anhänge sind keine neuen ausführbaren Repository-Werkzeuge.

**Nächster Schritt bleibt bei Root:** endgültige Metadaten und sechs Dokumentationsänderungen unabhängig prüfen, den endlichen Docs-PR veröffentlichen und seine eigenen Exact-Head-/Preview-/Merge-/Actual-main-Gates durchführen. Alle fünf Produkt-Lanes und Trackings sind abgeschlossen; nur der eigene Docs-Abschluss steht noch aus. Eine zukünftige Docs-Identität wird nicht behauptet, historische Metadaten werden nicht rückwirkend grün geschrieben und kein sechster Task gestartet.
