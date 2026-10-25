# M — begrenzter separater Integrationsnachtrag zum Root-Review-Archiv

## Cutoff und Autorität

Dieser Ordner ist ein **lokaler Vorschlag für die spätere finale Archivzusammenstellung**, nicht selbst Veröffentlichung, FINAL PASS, Ready oder Merge. Er verändert das bestehende historische Archiv und dessen Inclusion-Manifest nicht. Vorgesehener Repository-Ort: `docs/evidence/r107-root-final-review-2026-10-25/M-integration/`. Root besitzt die abschließende Zusammenstellung und Veröffentlichung.

Exakter Kandidat **dda52b660369a436fa1eb25ff69c0f076254661a**, Tree **503752c1bee097f5bba47487061415730429cc57**. Root akzeptierte die begrenzte Source-/Evidence-/Layout-Bindung in [PR-Receipt6403415810](https://github.com/Jetnity/jetnity/pull/1019#issuecomment-6403415810) am25.10.2026 um21:17:41 UTC. **FINAL/native Gates und vollständiger Autor-Handoff waren an diesem Cutoff weiterhin offen.** Keine weitere Ausführung folgt aus diesem Archiv.

Die Archivierung führte keinen Test, Build, Browserlauf, Install oder externen Schreibzugriff aus. Alle Ausführungsangaben betreffen bereits erhaltene Aufzeichnungen. Weder vollständiges CSS noch Bundle, node_modules, Source-Staging, vollständiger Git-Tree oder bereits committed Autor-Dateien werden kopiert.

## Auswahl

**31 vorhandene Artefakte, 1,724,244 Bytes:30 byteidentische Rohkopien und genau eine erklärte Projektion.** Drei Codequellen erhalten nur den Suffix `.txt`; ihre Bytes bleiben unverändert. README und Inclusion-Manifest sind neue Archivdokumentation, keine neuen historischen Beweise.

| Dateien / Gruppe | Erhaltener Zweck |
| --- | --- |
| `REVIEW.md`, `REVIEW.pre-root-layout.md` | Ursprünglicher Vor-Browser-Bericht und dessen ausschließlich additiver Root-Ausführungs-Cutoff; der Snapshot passt zum historischen Integrity-Record |
| `identity.json`, `live-before.json`, `live-after.json`, `source-proof.json` | Exakte Identität und vollständige **1330Scan+13Support=1343** Quellmetadaten, ohne Source-Dateien |
| `compile-final-css.mjs.txt`, `build-final-harness.mjs.txt`, Start-/Build-/Execution-Receipts | Ursprüngliche Pipeline, einmalige tatsächliche CSS-/Bundle-Erzeugung, Befehle/Runtime/Exit/Warnung und Outputdigests |
| `bundle-build-receipt.without-dependency-rows.json` | Alle **19 Repository-Input-Bindungen** und sämtliche übrigen Originalfelder; ausschließlich Dependency-Zeilen entfallen |
| `evidence-rebinding.json` / `.md`, `artifact-receipt.json`, `artifact-integrity.json` | Historische Quellen-/Receipt-Zuordnung und tatsächliche Artefaktprovenienz; ursprüngliche Zwischenstände bleiben unverändert |
| `M-layout-only-wrapper.mjs.txt`, Extraktion, Notes, Root-Static-Review | Unveränderter enger Layoutblock und offengelegte Extraktions-/Runtime-Grenzen; archivierter Code ist inert |
| Beide tatsächlichen Layout-Bindings, `layout-only/layout-only-receipt.json`, vier Screenshots | Getrennte Vorprüfung/Root-Autorisierung und genau eine frische begrenzte Root-Ausführung |
| Drei Root-Verifikations-/Disposition-Records | Unabhängiger Source/Build-Abgleich,128lokale/119finale Evidence-Bindungen und Metafile-Abdeckung1698 sowie visuelle Prüfung aller4Viewport-Crops |

## Genau eine Projektion; Metafile vollständig ausgeschlossen

Original `bundle-build-receipt.json`: **773,293 Bytes**, SHA256 **bf0b7676b5c716ff0c2b300c4cdda599b4c4c272a56b773e1bcc9e2b125bf175**. Entfernt wird ausschließlich `dependencyInputs` mit **1679 Zeilen**. Alle19`repositoryInputs` und alle anderen ursprünglichen Schlüssel/Werte bleiben unter `record` erhalten, einschließlich `dependencyInputCount:1679`, ursprünglicher Match-Zähler, Befehle, Runtime und Warn-/Limitangaben. Diese Zähler beschreiben weiterhin das vollständige Original. Die Projektion ist ausdrücklich keine byteidentische Rohkopie und erhält einen eigenen Digest.

`bundle-metafile.json` wird **vollständig ausgeschlossen**, nicht ein zweites Mal projiziert. Original: **1,395,160 Bytes**, SHA256 **706fb3467590e3a4a4a0e8aaffa3e293de0ceaee9991eac5e04aee3c797f930f**, **1698Inputs=19Repository+1679Dependency**. Roots vollständige Metafile-Abdeckungsprüfung bleibt raw in `root-evidence-and-layout-input-verification.json`; die19Repository-Bindungen bleiben vollständig im projizierten Bundle-Receipt. Originalpfad/-größe/-digest und Ausschluss sind im Inclusion-Manifest festgehalten.

## Tatsächliche neue Layoutbeobachtung und enge Aussage

Root autorisierte separat mit Binding-SHA256 **3927d2c68ea386ce965aae7ae9eaa2c8b5991622ce4972be4b84985202f50a05** und führte persönlich den bestehenden extrahierten Block genau einmal aus:21:15:41.259 UTC, Exit0, Node24.22.1, Chromium140.0.7339.16. Der Root-Receipt-SHA256 lautet **8880326d0876d6757ddc463be8d74e912967daa18e0f78b81853ba58db351b3c**.

48 synthetische Karten, lange erste Titel-/Herkunftstexte, Root-Schrift32px, Breiten320/390/768/1440 bei900px Höhe und die vorhandenen Assertionen bleiben unverändert. Root las alle vier Screenshots. Es sind **Viewport-Crops**, keine vollständigen Seiten- oder Kartenbilder. Keine zusätzliche Card-Bounding-Box-, Page-Error-, Network- oder Action-Assertion wurde eingeführt. Dies ist kein Author18-/Root15-/Query-Replay und keine native Node22-, Full-Next-, Hosted-, Auth-/DB-, Device-, Browserzoom- oder Screenreader-Abnahme.

Das neue tatsächliche M-CSS (SHA256ba1f5238e5afcbc42d134de5e6820f206143db8b175b5168123d83bce4207a67) entspricht dem aktuellen W-CSS. **Kein historischer M-CSS-Output/-Hash ist vorhanden.** Keine Behauptung historischer Stylesheet-Identität oder Rekonstruktion folgt daraus. Der neue Root-Lauf schließt nur die dokumentierte begrenzte finale CSS-/Layout-Lücke.

## Chronologie und False-/Pending-Felder bleiben erhalten

`artifact-receipt.json`, Build-Receipts, `M-layout-only-binding.NOT_AUTHORIZED.json` und das frühe Root-Static-/Input-Review stammen vor der separaten Ausführung. Ihre False-/Not-Authorized-/Pending-Felder werden nicht geändert. Der autorisierte Root-Binding, Layout-Receipt und `root-layout-disposition.json` dokumentieren die spätere Stufe. Auch im Layout-Receipt bleibt `formalAcceptance:false` als ursprüngliches Runnerfeld erhalten; die enge Root-Disposition und das PR-Receipt sind die spätere Entscheidung.

Das historische `artifact-integrity.json` bleibt unverändert. Sein ursprünglicher REVIEW-Digest **7acc819360267b2dfe6d80f7c5d1be9883300de8dfbbe7239b9370f68f21d1eb** ist im raw Snapshot `REVIEW.pre-root-layout.md` erhalten. `REVIEW.md` enthält ausschließlich einen additiven Cutoff. Das Integrity-Record darf weiterhin bewusst ausgeschlossene Dateien nennen; den tatsächlichen Umfang dieses separaten Nachtrags bestimmt ausschließlich `SHA256-INCLUSION-MANIFEST.json`.

Die früheren author18/independent15/Query-Ausführungen und die Vollsuite7c mit11Fehlern/5Skips bleiben historisch. Ganze-Route-Identität wird wegen der eingehenden T-Copy-Konstanten nicht behauptet. Archivcode ist inert; diese Auswahl ist kein selbstständig ausführbares Reproduktionsprojekt und erteilt keine erneute Ausführungsfreigabe.
