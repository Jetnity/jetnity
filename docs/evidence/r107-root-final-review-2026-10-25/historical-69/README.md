# R107 — archivierte unabhängige Root-Review-Evidenz

## Lokaler Zwischenstand und Zuständigkeit

Dieses Paket ist die lokal vorbereitete Dokumentation bereits ausgeführter unabhängiger Root-Helper-Prüfungen des bestehenden endlichen R107-Batches. Es ist kein sechster Cursor- oder Produkttask. Bei dieser Archivierung wurden keine Tests, Installationen, Laufzeitprüfungen oder externen Schreibaktionen ausgeführt.

**Die endgültige externe Veröffentlichung und inhaltliche Prüfung verbleiben bei root. Finales D/W/M-Rebinding, sämtliche endgültigen Review-/Post-Merge-Referenzen und der Abschluss des Batches werden hier noch NICHT behauptet.** Root ergänzt diese Referenzen anhand abgeschlossener Live-Evidence. Dieses Archiv erteilt weder PLAN-/Technical-Lead-PASS noch Ready oder Merge-Freigabe.

Die historischen Berichte enthalten absichtlich ihre damaligen Heads sowie Draft-, PENDING-, CHANGES-REQUIRED- und Fehlertexte. Sie bleiben unverändert. Ein späterer Erfolg ändert keinen früheren Prüfungsbefund. Die Dateien sind keine Aussage über den aktuellen Live-Stand.

## Inhalt und historische Quellen

| Paket | Historischer Bezug | Erhaltene unabhängige Evidenz |
| --- | --- | --- |
| T | RED `318fd50821be3c83aa8ec7182ad2e6cd3a4c9dec`; finaler Review-Head `fe434ae7ffcafedb0c2e9f7c528b84d96941fe13`, Runtime `669f8ec80324583adaec6dc21d5caf6d23e11c84` | Tatsächlich ausgeführter ursprünglicher Residence-only-UUID/Pass-Fall: RED und GREEN, gleiche Interaktion/Assertions, Nutzlasten, Eingabeereignisse, Logs und Quellenbindung. |
| D | `878212adf0384bba02cd1ce217041a673bfdaf84` | Fünf Fälle zu verzögerten Suchbestätigungen, Filtern/Clear, externer Navigation und nativer History; exakte lokale Helper-Extraktion. |
| W-focus | `a547366a5107e445642f980b621dff7c7b5adaa8` | Sieben Fokus-/Enter-Fälle sowie die zu diesem Head noch FEHLSCHLAGENDE Card-/Footer-Geometrie. |
| W-layout | `c68ef9e152a35fbe94f54fa753fe1f9c64ac4caa` | Korrigierte Geometrie in vier Breiten, exakte CSS-/Quellenbindung und explizite Wiederverwendung der früheren Fokus-Evidenz. |
| M-final | Kandidat `444a8c254e11688120f7f2b6e49193746932a865`, Runtime `96715e43f9c979a542a1b7bd5acc2b15ef494c5d` | 15 finale Beobachtungen, tatsächlicher Abbruch vor Tabellenzugriff bei ungültiger Adresse sowie Bindung des nachfolgenden Dokumentations-Deltas. |
| M-query-historical | Kandidat `863b7f3b879eaa1723cee57879eda521ecd223e9`, Runtime `ddd1f7eace34519996ec686223d684102a933baa` | Historische unabhängige Query-/Cursor-/Mapper-Prüfung mit 251 Zeilen, 26 ungültigen Cursor-/Parameterfällen und 30 literalen Suchfällen. Spätere Korrekturen werden dadurch nicht vorweggenommen. |
| S | `1677cd28c327e317ba8fca8becc6260faa8963ea`, damalige Main-Basis `60b8e75ece16a8640d21e460380f25d627bbe700` | Ein unabhängiger Lauf des bestehenden Evidence-Validators, 60 Quellenbindungen vor/nach dem Lauf und die Integrationsbindung. |

Die Zählungen und Ergebnisse stammen aus den archivierten früheren Aufzeichnungen. Sie wurden für dieses Archiv nicht neu erzeugt. D/W/M-Nachweise benötigen das von root noch einzutragende endgültige Rebinding. Bytegleichheit kann frühere Evidenz an unveränderte Quellen binden; sie ist kein neuer Testlauf.

## Inert abgelegte historische Quellen

Alle ausgewählten historischen Dateien mit Code-/ausführbaren Erweiterungen liegen als **byteidentische `.txt`-Anhänge** vor, beispielsweise `bounded-probe.mjs.txt`, `observe.cjs.txt` und `root-helper-extract.ts.txt`. Der zusätzliche Suffix ändert ausschließlich den Dateinamen. Diese Anhänge sind archivierte Evidenz und kein neuer kompilierter Repository-Code oder ausführbares Projektwerkzeug.

Ursprüngliche Dateinamen und absolute Scratch-Pfade innerhalb der historischen Berichte oder Quellen bleiben erhalten. Das Inclusion-Manifest ordnet sie dem tatsächlichen Archivpfad zu. Für eine künftig separat autorisierte Reproduktion müssten die dort bezeichneten exakten Git-Quellen, Harnesses und deklarierten Stubs rekonstruiert werden; dieses Archiv ist kein eigenständig ausführbares Projekt.

## Sechs ausdrücklich bezeichnete Projektionen

Die übrigen ausgewählten Originale werden byteidentisch übernommen. Genau sechs JSON-Dateien sind ausdrücklich bezeichnete Dokumentationsprojektionen vorhandener Aufzeichnungen:

1. T RED und T GREEN: Aus den Bundle-Inputlisten werden ausschließlich Einträge innerhalb von `node_modules` entfernt. Vollständige Seitenbeobachtungen, Nutzlasten, Eingabeereignisse, Fehler, projektbezogene Quellen-Hashes und Bundle-Hashes bleiben erhalten.
2. D sowie W-focus und W-layout: Derselbe ausschließlich auf Dependency-Inputzeilen begrenzte Filter. Die verbleibenden Projekt-/Harness-Inputs bleiben erhalten.
3. S: Ausschließlich die vier bereits im Git-Repository verfügbaren `changedFiles.content`-Bodies werden entfernt. Das vollständige `binding`-Objekt und alle übrigen Pfad-/Blob-Metadaten bleiben erhalten.

Jede Projektion enthält die Originalgröße, den SHA256-Digest des vollständigen Originals, den Originalpfad und die Transformationsbeschreibung. Bei Bundle-Inputprojektionen bleiben ursprüngliche und erhaltene Zeilenzahl ausdrücklich erhalten. Ihr Archivdigest ist ein eigener Bytehash; es wird keine Bytegleichheit mit dem vollständigen Original behauptet. Es wurden keine Beobachtung, kein Laufzeitergebnis und keine Assertion neu berechnet oder neu ausgeführt.

## Auswahl, Bilder und ausgelassene Duplikate

Erhalten sind 69 ausgewählte Artefakte. Gesamte Repository-/Staging-Bäume, `node_modules`, kompilierte JavaScript-Bundles, kompilierte CSS-Dateien und bereits im Git-Repository vorhandene Autor-Dokumente/Beweisdateien wurden nicht erneut kopiert. Die exakten historischen Git-/SHA-Pins in den Berichten und Bindungen bleiben die Referenz für diese Quellen.

Die beiden ausgewählten W-Bilder stammen aus synthetischen Visit-Fixtures. `W-focus/screens/editor-viewport-1440.png` zeigt die historische Überdeckung im Viewport; `W-layout/screens/editor-card-1440.png` zeigt den späteren Card-Element-Capture. Die unterschiedlichen Capture-Grenzen bleiben bewusst sichtbar. Die vierbreitige Containment-Aussage stammt aus den Messwerten, nicht aus dem Bildausschnitt. Die anderen bereits committed Autor-Bilder werden über die erhaltene Download-/Blob-Verifikation referenziert.

Historische `artifact-sha256.json`-Dateien können Artefakte nennen, die dieses minimale Archiv absichtlich nicht enthält oder die hier als Projektion vorliegen. Sie werden nicht umgeschrieben. Für den tatsächlichen Umfang dieses Pakets gilt ausschließlich [SHA256-INCLUSION-MANIFEST.json](SHA256-INCLUSION-MANIFEST.json).

## Evidence- und Veröffentlichungsgrenzen

Root-PR-Receipts bleiben die Autorität für Entscheidungen, unabhängige Abnahme, Ready/Merge und tatsächliche Post-Merge-Gates. Committed Autor-Evidenz bleibt Autor-Evidenz. Die hier archivierte lokale, synthetische Node24-/Komponenten-/Query-Evidenz ersetzt weder native Node22-CI noch Hosted-/Auth-/SQL-/RLS-/Production- oder native Device-Prüfungen.

S dokumentiert Evidenzvalidierung und Triage. Daraus folgt weder eine Dependency-Behebung noch eine Aussage zu tatsächlich installierter/deployter Betroffenheit oder allgemeiner Sicherheit. Bekannte Gast-Cross-Tab-/Unmount- und Mock-Grenzen bleiben in den historischen Berichten erhalten. Besondere Holds werden durch dieses Archiv nicht verändert.

Vor einer späteren externen Veröffentlichung ergänzt root die tatsächlichen finalen Kandidaten-/Merge-/Main-Identitäten, die finalen D/W/M-Quellenbindungen und die maßgeblichen Review-/Post-Merge-Receipt-Links. Bis dahin bleibt dieses Paket ein lokaler Zwischenstand. Es wird keine weitere Aufgabe automatisch eröffnet.
