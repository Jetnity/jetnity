# U1 Review R4 — Plan für den belegten Label-/Fokusfehler

Stand: 9. November 2026. Gleicher Autor **Jetnity Official Truth V3 Visitor Cache 1 — Codex Generation 1**, tatsächliche Session `/root/v3_visitor_writer`. Auftrag: #1165 Kommentar [6729875979](https://github.com/Jetnity/jetnity/pull/1165#issuecomment-6729875979). Basis-HEAD **`b8a65f8b4d341768f69df01ba1ca96f8eba4ee14`**, Tree `e94bec8d4d987973e924053dbc77eeb7a5c250e9`; Worktree vor Plan sauber. Der Plan wurde vor Code an Root gemeldet und von Root ausdrücklich bestätigt. Die enge Implementierung folgt diesem Ack; kein UI-PASS vor neuer CI-Evidence.

## Selbst gelesene Evidence und Ursache

Reviewkommentar, tatsächliches `audit.json` und `run-binding.json` aus `official-truth-v3-analysis/u1-b8a65-ci-ui/` wurden gelesen; `failure.png` wurde selbst betrachtet. ZIP-SHA256 erneut geprüft: `fe26da543c12dc7711b4fae2f3cde56efbeee97e8e1a47d1837446dc16a894f2`. PNG-SHA256: `6514068dac3c65d076e0c831513a6da5530849cc135e17e12e8e375cc135722c`.

Run `42543765403`, Job `128924237021`, Source `b8a65f8b4d341768f69df01ba1ca96f8eba4ee14`, sauberer Checkout `14b2c419cf5852d21bd231e02184c8153a039584`. Der einzelne reguläre Sandbox-Launch von `/usr/bin/google-chrome` funktionierte mit Version `156.0.8078.79`. Der erste Fehler ist der 30-s-Timeout von `locator.evaluate` auf `getByLabel('Testfall', { exact: true })`. Der Screenshot zeigt den tatsächlich fokussierten sichtbaren Select. Keine Layoutfälle und keine vollständigen Interaktionsfälle wurden bis dahin ausgeführt.

Die Vermutung wurde am vorhandenen Code geprüft: `mount.tsx` verschachtelt Select **und alle Options** innerhalb des Labels `Testfall`. Im installierten Playwright-Injektionscode liest `getElementLabels` bei einem Select dessen `element.labels` und reicht jeden Labelknoten an `elementText` weiter. `elementText` sammelt rekursiv die Texte aller Elementkinder, einschließlich der Options. Deshalb ist der normalisierte Labeltext nicht exakt `Testfall`. Der belegte Timeout entsteht im Label-Locator, bevor die anschließende Fokusgleichheitsprüfung ausgewertet werden kann. Der Screenshot belegt die Fokussierung, nicht einen bestandenen Tastaturablauf.

## Enger Fix nach Root-Ack

1. Nur den isolierten Mount ändern: vorhandenen Grid-Wrapper erhalten, `label` und `select` zu Geschwistern machen und mit React `useId`, `htmlFor` und `id` eindeutig verbinden. Der tatsächliche zugeordnete Labelknoten enthält dann ausschließlich `Testfall`; Options bleiben im Select. Keine zusätzliche ARIA-Ersatzbezeichnung, kein Test-Selector-Workaround.
2. `run.mjs`, exakte Label-/Tab-/Fokusassertions, Fristen, Browserlaunch, Viewport-/Textzoom-/Privacy-/Pollingmatrix, Produktkomponente und CI-Familien unverändert lassen. Keine neue Dependency oder lokale Browserausführung. Weitere tatsächliche Layoutbefunde benötigen den neuen vollständigen CI-Lauf.
3. Danach bestehende 47 Unit-/CI-Vertragstests, gezielten Harness-Typecheck, Lint auf dem geänderten Mount und den existierenden bundle-/HTTP-Smoke ausführen. Keine DOM-Ersatzprüfung und keine Behauptung, dass diese statischen Prüfungen den Browserfehler bereits abgenommen hätten.
4. Handoff und Manifest mit konkreten Befehlen/Ergebnissen aktualisieren. Root veröffentlicht einen neuen Head und führt die vollständige bestehende Browsermatrix regulär in CI aus. Erst deren tatsächliche Artefakte und unabhängige Sichtprüfung entscheiden die UI-Gates. Kein Ready/Merge oder Produktanschluss.

## Grenzen und STOP

S0, shared Guards, I1, M1, E1-Schnittstelle, Workflowfamilien, DB, Production, Provider und #917 bleiben unberührt. Nach stabiler enger Korrektur STOP; unmittelbare Review-Fixes bleiben in derselben Session.

## Ausführung nach Root-Ack

Der bestätigte Fix ist ausschließlich in `scripts/official-truth-product-v3-ui/mount.tsx` umgesetzt: `useId`, Geschwister-Label und Select mit `htmlFor`/`id`; bestehender Wrapper und Feldklassen bleiben erhalten. `run.mjs` und sämtliche bestehenden Assertions/Fristen/Browseroptionen sind bytegleich zur Basis.

Lokale Nachprüfung: bestehende 47 Unit-/CI-Vertragstests PASS, 0 Skip, 1236,324583 ms; Harness-TypeScript PASS; Mount-ESLint PASS; bestehender Bundle-/HTTP-Smoke mit sechs Fällen PASS. Kein lokaler Browserstart, keine DOM-Ersatzabnahme, kein neuer Benchmark- oder Production-Build-Claim. Die neue Browsermatrix muss Root auf einem neuen veröffentlichten Head regulär in CI ausführen. STOP nach dieser Lieferung.
