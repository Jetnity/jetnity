# W — separat vorbereiteter Integrationsnachtrag zum Root-Review-Archiv

## Stand und Zuständigkeit

Dieser Ordner ist ein **lokaler Vorschlag für die spätere finale Archivzusammenstellung**. Er verändert weder das bestehende historische 69-Artefakte-Archiv noch dessen Inclusion-Manifest. Vorgesehener Repository-Ort: `docs/evidence/r107-root-final-review-2026-10-25/W-integration/`. Veröffentlichung und endgültige Einbindung verbleiben bei Root.

Der Nachtrag gehört zu Kandidat **1343f8b9e20e68166e2e12cc7880f7eb3cff980c**, Tree **d732487b09c3245c9c22e38b38bb030c8aa181cf**, Basis **30119c5affbd391cce31f2ceade2e4b068dfbcba**. Root hat die begrenzte Source-/Evidence-/CSS-Bindung in [Receipt 6402978889](https://github.com/Jetnity/jetnity/pull/1018#issuecomment-6402978889) akzeptiert und zurückgelesen; [V19](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6402918945) enthält den Source-Nachtrag um 20:41 UTC. **Dies ist kein FINAL PASS, keine Ready-/Merge-Freigabe und kein Actual-main-Abschluss.** Native App **121282274214** aus Run **40230923537** bleibt in dem für diesen Nachtrag übermittelten Stand PENDING; Auth ist erfolgreich.

Bei der Zusammenstellung dieses Ordners wurde kein Test, CSS-Build, Browserlauf, installierter Abhängigkeitssatz oder Produktcode ausgeführt oder verändert. Alle Ausführungsangaben unten bezeichnen bereits vorhandene Aufzeichnungen.

## Minimaler Inhalt

| Unterlagen | Erhaltener Zweck |
| --- | --- |
| `REVIEW.md`, `APPLICABILITY.md` | Historische Helper-Begründung, Grenzen und tatsächliche Reihenfolge der CSS- und Anwendbarkeitsprüfung |
| `identity.json`, `css-input-manifest.json` | Provenienz des exakten Baums und vollständige Metadaten aller **1.319 Scan- plus fünf Support-Inputs**; keine staged Source-Dateien |
| `historical-bundle-source-binding.without-dependency-rows.json`, `author-receipt-binding.json`, `fixture-binding.json` | Alle **54 Repository-Bindungen**, zwölf Receipt-Bindungen und Fixture-Bindung; die Dependency-Liste wird nur als unten erklärte Projektion verkürzt |
| `historical-execution-binding.json` | Historische a547-/c68-Ausführung und ihre unterschiedlichen Ergebnisse bleiben korrekt datiert |
| `compile-final-css.mjs.txt`, `execution-record.json`, `css-comparison.json` | Byteidentischer inaktiver Compiler-Anhang, tatsächlicher früherer Befehl/Runtime/Exit/Warnung und CSS-Output-Digests |
| `css-delta.json`, `css-delta.patch.txt` | Vollständiger bestehender CSS-Diff; Patch als unveränderter inaktiver Textanhang |
| `lexical-applicability.json` | Vollständige **57 Inputbindungen**, alle 310 Klassenstellen einschließlich 43 nichtliteraler Ausdrücke und deren begrenzte Inventarisierung |
| `root-source-verification.json`, `artifact-integrity.json` | Roots eigener Abgleich und das historische Artefaktintegritätsrecord |

Die Auswahl enthält **16 vorhandene Artefakte: 15 byteidentische Rohkopien und genau eine erklärte Projektion**. Zwei Rohdateien erhalten ausschließlich den zusätzlichen Suffix `.txt`; ihre Bytes bleiben unverändert. Das zusätzliche README und `SHA256-INCLUSION-MANIFEST.json` sind neue Archivdokumentation, keine neuen historischen Beweise.

## Genau eine Projektion

Vollständiges Original: `/tmp/r107-world-r1-review/integration-1343/historical-bundle-source-binding.json`, **606.612 Bytes**, SHA256 **62fe37add94c42d015a82f16cf35e05245e57cc95aecbf929c2f4a47c2a6f469**.

Entfernt wird ausschließlich das Feld **`dependencyInputs` mit 1.689 Zeilen**. **Alle 54 `repositoryInputs`-Zeilen und alle übrigen ursprünglichen Schlüssel/Werte bleiben erhalten.** Dazu gehört der ursprüngliche Zähler `dependencyInputCount: 1689`; er beschreibt weiter das vollständige Original, nicht die verkürzte Liste. Die Projektion nennt Originalpfad, Originaldigest, Originalgröße, entfernte Felder, ursprüngliche/erhaltene Zeilenzahlen und enthält die verbleibenden Originaldaten unter `record`.

Diese JSON-Projektion ist keine byteidentische Kopie des Originals. Sie hat ihren eigenen im Inclusion-Manifest ausgewiesenen Bytehash. Die Dependency-Bindung wird als bereits aufgezeichnete Prüfung referenziert; bei der Archivierung wurden keine Dependency-Dateien erneut ausgeführt oder als neuer Testnachweis geprüft. Sämtliche Repository-Inputmetadaten bleiben auch im vollständigen CSS-Inputmanifest unverändert erhalten.

## Akzeptierte Aussage und ihre enge Grenze

Historisches c68-CSS: **b1ca9a5fdfee85f34812d64c71cb7d643ff5ae7b74ce9c89e939401d7b6586cc**, 129.304 Bytes. Tatsächliches 1343-CSS: **ba1f5238e5afcbc42d134de5e6820f206143db8b175b5168123d83bce4207a67**, 129.687 Bytes. **Die vollständigen CSS-Dateien sind nicht byteidentisch.** Der bestehende Diff enthält sechs zusätzliche klassengebundene Regeln / 383 Bytes / 23 Zeilen; keine historische Regel wurde geändert oder entfernt.

Root hat die 1.324 staged Inputs, 54 Repository-Inputs, 1.689 Dependency-Inputs, zwölf Receipt-Inputs und 57 Applicability-Inputs selbst erneut gehasht. Er las alle 43 nichtliteralen Klassenausdrücke und deren feste Definitionen, den Compiler, den vollständigen CSS-Diff und `APPLICABILITY.md`. Die sechs neuen Klassen können vom **exakt gebundenen retained dense40 / first12-visible / first-editor-open Harness einschließlich seiner Wrapper** nicht erzeugt werden. Nur dafür akzeptiert Root die Gleichheit der anwendbaren Regeln und die Bindung an die frühere Geometrie-Evidence.

Es wird **kein neuer Browser-Replay, keine frische Geometrieausführung, keine vollständige CSS-Identität und keine produktionsweite Regelgleichheit** behauptet. Der frühere CSS-Compilerlauf war eine separate Node-24-Ausführung mit erhaltenem Toolchain-Warnhinweis; er ist nicht die native Node-22-CI. Keine Hosted-/Auth-/SQL-/RLS-/Device-Wirkung folgt aus dieser Bindung.

## Historische Zwischenstände bleiben unverändert

Die Rohdateien stammen aus verschiedenen Schritten. `css-delta.json` verzeichnet absichtlich noch `applicableRuleEquivalenceEstablished: false`, weil der CSS-Diff allein die spätere Anwendbarkeitsprüfung nicht enthielt. `css-comparison.json` enthält `formalAcceptance: false`; `REVIEW.md` und `APPLICABILITY.md` überlassen die Entscheidung damals Root. Diese historischen Angaben werden **nicht** umgeschrieben. Das spätere Root-Receipt ist die Autorität für die eng begrenzte Source-Entscheidung.

Ebenso bleibt der a547-Aggregate-Exit **1** erhalten: sieben Interaktionsfälle waren erfolgreich, der damalige Layoutfall schlug fehl. c68 lieferte die spätere Layoutkorrektur. Keine dieser historischen Ausführungen wird zu einem neuen 1343-Lauf umetikettiert. Offene native oder spätere Integrations-Gates bleiben offen.

## Bewusst nicht enthalten

Der vollständige Git-Tree mit 8.359 Einträgen, das Source-Staging `css-inputs/`, `node_modules`, kompilierte vollständige CSS-Dateien, JavaScript-Bundles und bereits committed Autor-Dateien werden nicht kopiert. Ihre Pfade/Digests bleiben dort erhalten, wo die historischen Records sie referenzieren. Auch `artifact-integrity.json` kann bewusst ausgelassene Dateien nennen; es wird nicht umgeschrieben. Den tatsächlichen Umfang dieses Nachtrags beschreibt ausschließlich [SHA256-INCLUSION-MANIFEST.json](SHA256-INCLUSION-MANIFEST.json).

Die inert angehängten Dateien sind archivierte Quellen, keine neuen ausführbaren Repository-Werkzeuge. Dieser Nachtrag ist kein eigenständig ausführbares Reproduktionsprojekt. Die spätere finale Archivzusammenstellung darf die ursprünglichen Fehler-, Pending- und Provenienzangaben nicht stillschweigend verändern.
