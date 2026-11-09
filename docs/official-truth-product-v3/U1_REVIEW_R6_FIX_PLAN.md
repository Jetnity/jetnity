# U1 Review R6 — Enger Plan für Textzoom und CI-Inventar

Stand: 9. November 2026. Gleicher Autor **Jetnity Official Truth V3 Visitor Cache 1 — Codex Generation 1**, tatsächliche Session `/root/v3_visitor_writer`. Auftrag: `U1_REVIEW_R6_TASK.md` und [#1165 Kommentar 6730217681](https://github.com/Jetnity/jetnity/pull/1165#issuecomment-6730217681). Basis-HEAD **`ac60045bbc7566150440c48f1f538e7258766bfc`**. Vor dem Plan war nur der von Root bereitgestellte R6-Task untracked. **Plan vor Code persistiert, von Root vollständig gelesen und ausdrücklich freigegeben.** Die folgende enge Umsetzung erfolgt nach diesem Ack.

## Selbst gelesene konkrete Befunde

Task, Audit, Runbindung, Mount, Produktkomponente, vollständige `official-truth-atomic-version-refresh-1.test.ts` und relevante Workflowabschnitte wurden gelesen. Autor betrachtete das echte `failure.png` in `official-truth-v3-analysis/u1-ac600-ci-ui/`; der selbst erneut berechnete SHA256 lautet `808185d5eb353caa1be08853901690e2410ae9af8040d61a5ed15d09001d7e32`.

CI **42546439936**, UI-Job **128932438904**, Source **ac60045bbc7566150440c48f1f538e7258766bfc**, sauberer Checkout **fe5df0dd4d84489ac84081f350ac905f1e45c384**: Alle acht normalen Breiten 280–1280 px und Landscape 844×390 sind jetzt tatsächlich grün. Bei 320 px und 200 % Text scheitert der Dokumentüberlauf nur noch an Harness-Aside/Testfall-Select: Dokument 376 px, Select 310,546875 px. Das Aside und sein Feldwrapper haben noch implizite Auto-Spalten; lange Harnesswörter haben keine lokale Umbruchregel. R4-Label und bisherige Tastatur-/Fokusinteraktionen bestehen.

Der Screenshot belegt zusätzlich leseschwache Produktspalten: mit dem Text vergrößern sich mehrfach verschachtelte horizontale `rem`-Paddings. Das Formularfeld ist nur noch 174 px breit; der Submitbutton ist 384 px hoch. R5 verhindert Überlauf, löst aber diesen konkreten Platzverlust nicht.

Die vorhandene Atomic-Refresh-CI-Prüfung erwartet noch exakt vier Aggregate-Familien. Zusätzlich liest ihre `accepted_store_native`-Regex bis `required_verify` und nimmt dadurch den neuen dazwischenliegenden UI-Job samt dessen verpflichtendem `always()`-Artefaktschritt auf. Der bestehende native `no-if`-Schutz muss nur den tatsächlichen Accepted-Job umfassen, darf aber nicht abgeschwächt werden.

## Drei eng begrenzte Änderungen nach Root-Ack

1. **Mount, nur Layout:** Aside und dessen Feldwrapper auf explizite Null-Minimum-Spalten, begrenzte Breiten und lokal geerbtes `overflow-wrap: anywhere` umstellen. Select zusätzlich maximal containerbreit. R4-`useId`/Labelverbindung, Szenarien, Transport, Komponentenanschluss und Schriftgrößen bleiben erhalten. Mobile horizontale Außen-/Asideabstände auf `min(bisheriges rem-Maß, 4vw)` begrenzen; vertikale Abstände und bisherige Desktopabstände bleiben bestehen.
2. **Produktkomponente, nur mobile Abstände:** Horizontales Padding der lokalen Formular-/Ergebniskarten und Buttons auf `min(bisheriges rem-Maß, 4vw)` begrenzen. Innere Bedingungs-/Hinweisflächen auf `min(bisheriges rem-Maß, 3vw)`, Listeneinrückung auf `min(1.25rem, 6vw)` begrenzen; ab `sm` bisherige Maße erhalten. So wächst der Text bei 200 % weiter vollständig, während mehrere ineinanderliegende Rahmen nicht gleichzeitig die Textspalte aufbrauchen. Keine kleinere Schrift, keine Inhaltsänderung, keine verlorene Touchhöhe, kein Clipping. Die R5-Spalten-/Umbruchkorrektur bleibt bestehen.
3. **Bestehender Atomic-Refresh-Test, nur exakte CI-Inventur/Grenze:** Genau `verify, persisted_native, refresh_native, accepted_store_native, official_truth_v3_ui` verlangen. Die UI-Ergebnisbindung und deren zwingenden `success`-Vergleich zur vorhandenen Aggregate-Prüfung hinzufügen. Den Accepted-Block an der exakten folgenden `official_truth_v3_ui`-Jobgrenze beenden. Alle vorhandenen Befehls-/Hash-/Matrix-/Native-/`no-if`-/`no-continue-on-error`-/`always()`-Anforderungen unverändert lassen. Workflow selbst und bestehende U1-CI-Negativmatrix bleiben bytegleich.

## Prüfung und Übergabe

Danach vollständige bestehende Atomic-Refresh-Guarddatei plus alle 47 U1-/CI-Vertragstests, Repository- und Harness-TypeScript, gezieltes Lint der drei geänderten Dateien, bestehenden Bundle-/HTTP-Smoke und Diffprüfung ausführen. Keine zusätzlichen Klassen- oder Ersatzlayouttests. Manifest und Handoff erhalten die tatsächlichen Ergebnisse und Hashes.

Kein lokaler Browserstart. Root veröffentlicht den neuen Head und führt die unveränderte tatsächliche Browsermatrix samt PNG-/Interaktionsprüfung aus. Neun bestandene alte Layoutfälle sind historische Evidence auf ac60045; die neue vollständige UI-Abnahme bleibt offen. Keine Behauptung eines UI-PASS durch statische Prüfungen.

Nur die drei benannten Dateien und R6-Plan/Manifest/Handoff sind beschreibbar. `run.mjs`, Matrix, Fristen, Browserlaunch, Workflow, Query/Controller/Presenter, S0, shared Country/CSS, Produktports und besondere Aktivierungs-/#917-Gates bleiben unverändert. Kein Commit/Push/GitHubwrite/Ready/Merge/Folgeslice. **Nach enger Lieferung STOP für Root.**

## Ausführung nach ausdrücklichem Root-Ack

Die drei Änderungen sind genau im bestätigten Umfang umgesetzt. Der Mount erhält begrenzte explizite Spalten und vollständigen Wortumbruch; mobile horizontale Abstände sind begrenzt, vertikale Abstände und die bisherigen Werte ab `sm` bleiben erhalten. Die Produktkomponente ändert ausschließlich die beschriebenen horizontalen Abstände. Der bestehende Atomic-CI-Guard enthält exakt die fünfte Familie samt Pflicht-Ergebnisbindung und endet für den Accepted-Block unmittelbar vor dem UI-Job. Keine bestehende Native-Assertion wurde entfernt oder gelockert.

Lokale Nachprüfung: **57/57 PASS**, davon alle zehn vorhandenen Atomic-Refresh-Guards und alle 47 vorhandenen U1-/CI-Vertragstests; 0 Skip, **1479,960218 ms**. Beide TypeScript-Prüfungen und gezieltes Lint der drei Dateien Exit 0; bestehender Bundle-/HTTP-Smoke mit sechs Fällen PASS; Diff-/Scopeprüfung PASS. Geschützte Workflow-/Matrix-/Browser-/Runtime-/shared-Dateien sind bytegleich zur Basis. Kein Browserstart, kein neuer Leistungs- oder Production-Claim.

Manifest und Handoff enthalten die exakten Arbeitsbaumhashes und verbleibenden Gates. Der neue tatsächliche CI-/PNG-/UI-Nachweis ist weiterhin erforderlich. **STOP für unabhängiges Root-Review und Veröffentlichung.**
