# U1 Review R5 — Plan für den belegten schmalen Layoutfehler

Stand: 9. November 2026. Gleicher Autor **Jetnity Official Truth V3 Visitor Cache 1 — Codex Generation 1**, tatsächliche Session `/root/v3_visitor_writer`. Auftrag: `U1_REVIEW_R5_TASK.md` und [#1165 Kommentar 6730040798](https://github.com/Jetnity/jetnity/pull/1165#issuecomment-6730040798). Basis-HEAD **`20a4e497a4a23c7aa972d13352c155729f95a7ab`**. Vor diesem Plan war ausschließlich der von Root bereitgestellte R5-Task untracked; eigener Produktcode unverändert. **Plan vor Code persistiert, von Root vollständig gelesen und ausdrücklich freigegeben.** Die folgende enge Implementierung erfolgt nach diesem Ack; der neue tatsächliche Browsernachweis bleibt offen.

## Selbst gelesene Evidence und konkrete Ursache

Autor las den vollständigen Task, `audit.json` und `run-binding.json` in `official-truth-v3-analysis/u1-20a4-ci-ui/` und betrachtete `failure.png` selbst. Der erneut berechnete PNG-SHA256 ist `4bfc7a6c8a57b8f582db4e6a0f7ebd3b40b669eb84553b9ecbdbf71c843b3525`. Run **42545059046**, Job **128928236799**, Source-Head **20a4e497a4a23c7aa972d13352c155729f95a7ab**, sauberer Checkout **77096cfea008ee5164a834306ef9d0dcfec71293**. Der einzelne reguläre Sandbox-Launch von Google Chrome **156.0.8078.79** funktionierte. Der R4-Label-/Tastaturablauf und die erste Mixed-Antwort samt Fokus, Quelle und Bedingungen bestanden tatsächlich.

Die erste Layoutprüfung **mixed-280** scheitert mit `innerWidth: 280`, `scrollWidth: 386` und Produkt-Selectbreiten von **328,484375 px**. Der isolierte Testfall-Select bleibt mit 214 px innerhalb seines Containers. Der Screenshot zeigt, dass Produktüberschrift, Formular und Ergebnisblöcke gemeinsam zu breit sind. Daher liegt kein neuer Label-/Fokusfehler und kein Browserstartproblem vor. Null vollständige Layoutfälle sind bestanden.

Im Produktcode verwenden äußere Section, Formular, Fieldset, Staatsangehörigkeitszeilen und Ergebnisgrids `display: grid` ohne explizite Spalte mit Mindestmaß null. `min-w-0` auf dem Gridcontainer hebt nur dessen eigene Mindestbreite auf; die implizite `auto`-Spalte kann weiterhin die intrinsische Mindestbreite der Kinder annehmen. Die lange ungetrennte Überschrift trägt diese Breite in das äußere Grid. Das vorhandene `break-words` entspricht im installierten Tailwind `overflow-wrap: break-word`; es senkt diese intrinsische Mindestbreite nicht. Verschachtelte Grids und inhaltsbreite Buttons können denselben Effekt erneut erzeugen, besonders bei 200 % Textgröße.

`LandFeld.tsx`, `styles/globals.css` und vorhandene Tailwind-/Preflight-Regeln wurden gelesen: Selects haben bereits `min-w-0`, `w-full`, `max-w-full` und mobil 16-px-Text. Die übergroßen Selects folgen ihrer übergroßen Spur. Ein globaler Eingabefeldfix oder eine Änderung am gemeinsam verwendeten LandFeld ist dafür nicht erforderlich.

## Enger Fix nach Root-Ack

1. Ausschließlich in `OfficialTruthVisitorV3.tsx` alle lokalen einspaltigen Grids mit `grid-cols-1` festlegen (`minmax(0, 1fr)`). Die vorhandene zweispaltige Staatsangehörigkeitszeile ab `sm` behält ihre explizite Null-Minimum-Hauptspalte. Lokale Header-/Ergebniswrapper und die Fieldset-Legende erhalten dort, wo nötig, eine begrenzte Breite bzw. `min-w-0`. Die bestehenden shared LandFeld-Kinder dürfen innerhalb dieser begrenzten Spalten schrumpfen.
2. In derselben Produktkomponente lange deutsche Wörter, Überschriften, Bedingungen und Quelltexte durch normales, vollständiges Umbrechen innerhalb der verfügbaren Breite lesbar halten. Dafür lokal `overflow-wrap: anywhere` verwenden, statt die intrinsische Mindestbreite durch `break-word` zu erhalten. Inhaltsbreite Buttons und Quellen-/Aktionslinks auf die vorhandene Containerbreite begrenzen, normale mehrzeilige Beschriftung zulassen und weiterhin mindestens 44 px Höhe behalten. Fieldset-Legende ebenfalls vollständig umbrechen. Keine Wortkürzung, kleinere Schrift, Inhaltsänderung, Clipping oder versteckte horizontale Überläufe.
3. `run.mjs`, Mount einschließlich R4-Label, gesamte Browsermatrix, Assertions, Fristen, Launch, CI, Query, Controller, Präsentationssemantik, gemeinsamer Vertrag und shared Country-/CSS-Dateien bytegleich lassen. Kein lokaler Browserstart, Download oder Ersatzrenderer. Kein neues Klassen-Nachbildungstestinventar.
4. Bestehende 47 U1-/CI-Vertragstests, Repository- und Harness-TypeScript, gezieltes ESLint, vorhandenen Bundle-/HTTP-Smoke und Diffprüfung ausführen. Manifest und Handoff mit tatsächlichen Resultaten aktualisieren. Diese Prüfungen ersetzen nicht den neuen regulären CI-Browserlauf auf dem von Root veröffentlichten neuen Head.

## Abnahme und Grenzen

Die unveränderte Browsermatrix bleibt das responsive Regression-Gate: 280/320/360/375/390/430/768/1280 px, Landscape 844×390 und 320 px mit 200 % Text. Wortlaut, Fakten, Bedingungen, Originalquellenzeit, amtlicher Link, getrennte Staatsangehörigkeiten, Tastatur-/Fokusverhalten und Polling bleiben erhalten. Neuer tatsächlicher Browser-/PNG-/UI-Nachweis bleibt bis zur Ausführung **offen**; kein UI-PASS durch statische Analyse.

Nur lokale Produktkomponente und U1-R5-Plan/Manifest/Handoff gehören zum Fix. Kein Commit, Push, GitHubwrite, Ready, Merge, Folgeslice, öffentlicher Einstieg oder DB-/Auth-/Provider-/Production-Aufruf. Die besonderen D0-/Methoden-/#917-Gates bleiben unverändert. Nach der bestätigten engen Korrektur und Prüfungsübergabe **STOP** für Root-Review und Veröffentlichung.

## Ausführung nach ausdrücklichem Root-Ack

Der bestätigte Fix ist ausschließlich in der Produktkomponente umgesetzt: explizite Null-Minimum-Spalten, begrenzte lokale Wrapper/Legende/Buttons/Links und von der Section geerbtes `overflow-wrap: anywhere`. Frühere einzelne `break-words`-Overrides wurden entfernt, damit lange Wörter auch in Bedingungen und Quellen diese lokale Umbruchregel erben. Schriftgrößen, Abstände, vollständige Beschriftungen, Daten und Interaktionslogik sind erhalten. Keine shared Country-/CSS-Änderung.

Lokale Nachprüfung: **47/47** vorhandene U1-/CI-Vertragstests PASS, 0 Skip, **1400,253122 ms**; Repository- und Harness-TypeScript jeweils Exit 0; Komponenten-ESLint Exit 0; vorhandener Bundle-/HTTP-Smoke mit sechs Fällen PASS; Diffprüfung PASS. Harness samt R4-Label und ganzer Matrix, Workflow, gemeinsamer S0-Vertrag, U1-Controller/Query/Presenter und shared Country/CSS sind per Git-Vergleich bytegleich zur Basis. Keine neuen Testfälle oder Benchmark-/Production-Behauptungen.

Kein lokaler Browser gestartet. Das neue Layout ist erst nach Veröffentlichung und dem unveränderten tatsächlichen CI-Browserlauf samt unabhängiger PNG-Prüfung abgenommen. Manifest und Handoff sind aktualisiert. **STOP für Root.**
