# Cursor-Auftrag – Phase 3.3b: Activities UI-/Mobile-Abnahme

Stand: 20. August 2026

## Ausgangspunkt

Arbeite weiter auf `phase-3-3-activities-foundation` und im bestehenden Draft-PR #24. Phase 3.3 ist technisch weitgehend umgesetzt. Dieser Nachauftrag schliesst gezielt die offene Abnahmelücke aus `docs/CURSOR_PHASE_3_3_TASK.md`: Der Browser-/Mobile-Nachweis der neuen Activities-Oberfläche wurde im Abschlussbericht ausdrücklich nicht durchgeführt.

Lies vor Änderungen mindestens:

- `AGENTS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/CURSOR_PHASE_3_3_TASK.md`
- `docs/ACTIVITIES.md`
- die neue Activities-UI und vorhandene Responsive-/Browser-Testlogik
- bei Bedarf PR #7 / die dort dokumentierte WebKit-Audit-Methodik als Qualitätsreferenz

## Ziel

Belege messbar, dass die neue Activities-Oberfläche im bestehenden Trip Workspace auf kleinen Smartphones, iPhone-naher WebKit-Darstellung und Chromium sauber, bedienbar und zugänglich ist. Keine reine Codeinspektion und keine Aussage wie „Klassen sehen responsive aus“ genügt.

Dieser Auftrag darf Fehler beheben, die durch den Audit gefunden werden, aber keine neue Produktphase starten.

## Harte Grenzen

- PR #24 bleibt Draft.
- Nicht mergen.
- Keine Production-Änderung und keine Production-Migration.
- Kein echter Activity-Provider, kein Key, kein Secret.
- Keine neuen laufenden Kosten.
- Keine Fake-Aktivitäten im normalen Produkt-/Runtime-Weg.
- Test-Fixtures oder Request-Interception sind nur innerhalb des Browser-/Test-Harness erlaubt und dürfen niemals in Production ausgeliefert oder als echte Daten dargestellt werden.
- Production-Aktivitätensuche bleibt hart aus.
- Bestehende Flight-/Hotel-/Trip-Funktionen nicht regressieren.

## 1. Reale Browser-Abnahme

Nutze die vorhandene Browser-/Responsive-Audit-Infrastruktur des Projekts, soweit möglich. Falls sie die Activities-Zustände noch nicht erreicht, erweitere sie gezielt statt ein zweites paralleles Testsystem zu bauen.

Maßgeblich:

- WebKit als iPhone-nahe Engine
- Chromium als Gegenprobe

Mindestens prüfen:

- 280 px
- 320 px
- 360 px
- 390 px
- 430 px
- Landscape 667×375 und 844×390, soweit das bestehende Harness diese Referenzbreiten bereits nutzt

Die Prüfung muss belegen, dass der **tatsächliche Activities-Bereich gerendert wird**, nicht nur eine Fehlerseite oder ein anderer Workspace-Zustand.

## 2. Activities-Zustände abdecken

Mindestens folgende sichtbare Zustände prüfen:

1. Reise ohne Tage
2. Tag ohne Etappe
3. normaler Tag mit Etappe und ohne bestehende Planpunkte
4. Tag mit mehreren bestehenden Planpunkten / Uhrzeiten
5. viele Reisetage bzw. viele Tag-Chips
6. lange Etappen-/Tagtexte
7. Loading
8. `unavailable` ohne Provider – aktueller realer Preview-Zustand
9. `empty`
10. `error`
11. `timeout`
12. `rate_limited`
13. Aktivitätskarten mit langen Providerinhalten, Preis, Bewertung, Labels und Auswahlbutton – ausschließlich über Test-Harness/Request-Interception oder andere nicht ausgelieferte Fixture-Technik

Für simulierte API-Zustände niemals produktive Fake-Datenpfade einführen.

## 3. Messregeln

Nicht nur `scrollWidth === clientWidth` prüfen. Die bekannte Jetnity-Audit-Qualität aus PR #7 beibehalten:

- kein Seiten-Overflow
- kein durch clippende Vorfahren abgeschnittener Inhalt
- keine ungewollt aus Elterncontainern ragenden Elemente
- Grid-/Flex-Inhalte können schrumpfen (`min-w-0` etc.)
- kein unzugänglicher horizontaler Bereich
- keine überlappenden Bedienelemente
- Touch-Ziele entsprechend Design-System, insbesondere Tag-Chips und Aktionen
- Fokus sichtbar
- Tastaturbedienung der Tag-Auswahl und Activity-Aktionen
- keine Eingabeschrift unter 16 px, falls Eingaben betroffen sind
- keine verdeckten Fokus-/Sprungziele durch Header
- lange Titel, Labels, Preise und Hinweise brechen sauber um
- keine irreführenden Lade- oder Fehlerzustände

Falls eine bestehende Audit-Ausnahme greift, begründe sie technisch und belege, dass Inhalt erreichbar bleibt.

## 4. Interaktion und Request-Verhalten

Zusätzlich gezielt verifizieren:

- Wechsel zwischen Tag-Chips startet keine Request-Schleife.
- Ein vorheriger Request wird beim schnellen Tagwechsel sauber abgebrochen.
- Nach Tagwechsel erscheint nur die Antwort des aktuell ausgewählten Tages.
- Loading-Zustand bleibt verständlich und verursacht keinen relevanten Layout-Shift.
- `aria-pressed` der Tag-Chips stimmt mit der sichtbaren Auswahl überein.
- Fokus bleibt nach Interaktionen nachvollziehbar.
- Bei mehreren Tag-Chips bleiben alle per Touch und Tastatur erreichbar.

Wenn der Audit hier einen echten Race-/UX-Fehler findet: Ursache beheben und Regressionstest ergänzen.

## 5. Accessibility

Mindestens prüfen:

- Section-/Status-/Alert-Semantik sinnvoll
- keine rein visuelle Information ohne Textäquivalent
- Labels und Empfehlungen verständlich, interne Scores nicht sichtbar
- Keyboard-Fokus sichtbar
- Tag-Auswahl als bedienbare Gruppe nachvollziehbar
- Spinner/Icons erzeugen keine unnötigen Screenreader-Ausgaben
- Statusmeldungen werden dort angekündigt, wo es sinnvoll ist, ohne unnötige Wiederholungen

Keine übertriebene ARIA-Komplexität hinzufügen; native Semantik bevorzugen.

## 6. Performance

Belege für den neuen Bereich:

- keine unnötige Request-Schleife bei Re-Renders
- AbortController funktioniert bei Wechsel/Unmount
- keine Provider-/Ranking-Domain unnötig in den Client verschoben
- keine großen neuen Client-Abhängigkeiten
- keine auffälligen Layout-Shifts durch den Bereich

Keine synthetischen Lighthouse-Ziele erfinden, wenn die Umgebung sie nicht belastbar misst.

## 7. Tests und Abschluss

Nach eventuellen Fixes vollständig erneut ausführen:

- `npm test`
- Typecheck
- Lint
- alle Hygiene-Checks
- Production-Build
- den gezielten WebKit-Audit
- Chromium-Gegenprobe
- GitHub CI
- Vercel Preview

Kein echter Providercall.

## 8. Dokumentation

Aktualisiere `docs/ACTIVITIES.md`, `ROADMAP.md`, `JETNITY_HANDOFF.md` und ggf. `DECISIONS.md` nur, wenn der neue Nachweis oder ein echter Fix es verlangt.

Dokumentiere konkrete Audit-Zahlen: geprüfte Zustände × Breiten/Engines, Fehlerzahl und gefundene Fixes. Nicht „sieht gut aus“ schreiben.

Die PR-Beschreibung nicht eigenmächtig überschreiben; ChatGPT/Product-Review aktualisiert sie nach der Abnahme.

## Abschlussbericht

Berichte kurz und prüfbar:

1. welche echten Activities-Zustände unter WebKit/Chromium geprüft wurden
2. Breiten/Orientierungen und Anzahl Kombinationen
3. gemessene Layout-/Touch-/Focus-/Accessibility-Ergebnisse
4. gefundene Fehler und Fixes
5. Request-/Abort-/Race-Nachweis
6. Tests/Typecheck/Lint/Hygiene/Build
7. GitHub CI und Vercel Preview
8. neuer Head-Commit
9. offene Risiken
10. ausdrücklich: kein Provider, kein Secret, kein Production-Eingriff, kein Merge
