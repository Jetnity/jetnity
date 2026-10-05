# Cursor-Auftrag – Trip Workspace Mobile UX · Iteration 3

Stand: 21. August 2026

## Status

Dieser Auftrag setzt die mobile UX-Verfeinerung aus PR #27 fort.

Iteration 1 und 2 sind bereits umgesetzt. PR #27 bleibt Draft. Kein Merge. Keine Production-Aktivierung.

Diese Iteration ist bewusst klein und visuell fokussiert. Sie verändert keine Provider-, Buchungs-, Datenbank- oder Production-Logik.

---

## 1. Pflichtlektüre

Vor der Umsetzung lesen:

- `AGENTS.md`
- `JETNITY_HANDOFF.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/REISEN.md`
- `docs/CURSOR_TRIP_WORKSPACE_MOBILE_UX_ITERATION_1.md`
- `docs/CURSOR_TRIP_WORKSPACE_MOBILE_UX_ITERATION_2.md`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspacePlan.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `components/trips/AktivitaetenBereich.tsx`
- `components/ui/scroll-row.tsx`
- bestehende Trip-Workspace- und Activities-UI-Audits

---

## 2. Produktentscheidung

Auf Mobile gehören Tagesauswahl und ausgewählter Tagesinhalt visuell zu **einem einzigen Tagesplan-Modul**.

Der Nutzer soll nicht zwei übereinanderliegende weiße Karten sehen, die fachlich denselben Plan darstellen.

Das gewünschte Muster entspricht dem bestehenden Aktivitäten-Bereich:

- ein äußerer stabiler Container
- darin eine horizontal wischbare Tagesauswahl
- darunter der Inhalt des aktuell gewählten Tages
- nur die Tageszeile scrollt horizontal
- der gesamte Kartencontainer und die Seite dürfen dabei nicht seitlich mitwandern

---

## 3. Mobile Tagesplan – ein gemeinsamer Container

Aktuell besteht der Mobile-Tagesplan optisch aus zwei getrennten weißen Karten:

1. `TAGESPLAN` + Anzahl + Tageschips
2. aktueller Tag + Datum + `Punkt hinzufügen` + Tagesinhalt

Diese beiden Karten auf Mobile zu **einer zusammenhängenden Karte** verschmelzen.

Zielstruktur innerhalb einer Karte:

- `TAGESPLAN`
- `x Punkte geplant`
- horizontal wischbare Tageschips
- dezente interne Trennung
- `TAG n`
- vollständiges Datum
- `+ Punkt hinzufügen`
- Formular, falls geöffnet
- Tagesinhalt / Empty State
- ungeplante Punkte, sofern fachlich passend, weiterhin verständlich erhalten

Keine doppelte Außenkarte und kein unnötiger großer Zwischenabstand zwischen Tagesauswahl und Tagesinhalt.

Desktop nicht aus diesem Grund redesignen. Die Änderung ist primär für `<1024px`.

---

## 4. Horizontales Wischen der Tage

Die Tageschips müssen sich wie die Tagesauswahl im Aktivitäten-Bereich verhalten.

Verbindlich:

- nur die Chip-Zeile scrollt horizontal
- der äußere Tagesplan-Container bleibt stehen
- kein horizontaler Body-/Page-Overflow
- kein horizontales Mitschieben des Tagesinhalts
- Touch-Wischen funktioniert natürlich auf iOS/WebKit und Chromium
- Mausrad/Trackpad darf auf Desktop/Tablet robust bleiben
- Tastaturbedienung und sichtbarer Fokus bleiben erhalten
- aktiver Tag klar markiert
- aktive Tagesauswahl bleibt dieselbe fachliche Wahrheit wie im Aktivitäten-Bereich
- kein neuer zweiter `activeDay`-State

Bestehenden `ScrollRow` wiederverwenden, sofern er dieses Verhalten korrekt erfüllt. Keine neue Carousel-/Slider-Library einführen.

---

## 5. State und Funktionalität unverändert erhalten

Nicht neu schreiben:

- Trip-Domain
- Tag-Auswahl-Logik
- Planpunkt-Anlegen
- Planpunkt-Löschen
- `ohneTag`-Verhalten
- gemeinsame Tagesauswahl mit Aktivitäten
- Guest-/Account-Persistenz

Nur die visuelle Gruppierung und das mobile Scrollverhalten verbessern.

---

## 6. Accessibility

Verbindlich:

- Tageschips mindestens 44 px Touch-Ziel
- sichtbarer Fokus
- aktiver Tag für Screenreader verständlich
- horizontale Scrollzeile vollständig per Tastatur erreichbar
- keine fokussierbaren Elemente außerhalb des sichtbaren/aktiven Kontexts
- Überschriftenhierarchie nach Zusammenführung prüfen
- kein unnötig verschachteltes `section`/Landmark-Chaos

---

## 7. Mobile-Abnahme

Mindestens WebKit + Chromium prüfen auf:

- 280
- 320
- 360
- 390
- 430
- 768
- 844x390 Landscape
- Desktop-Gegenprobe >=1280

Mindestens folgende Zustände:

- leerer Tagesplan
- viele Reisetage (15+)
- mehrere Planpunkte am aktiven Tag
- ungeplante Punkte
- Formular `Punkt hinzufügen` offen
- sehr lange Tages-/Punkttitel
- Wechsel Übersicht -> Aktivitäten -> anderer Tag -> Übersicht: derselbe aktive Tag muss erhalten bleiben

Prüfen:

- kein horizontaler Seitenoverflow
- nur Tageszeile wischt horizontal
- Container bleibt stabil
- keine Layout Shifts
- kein Doppelscrollen
- aktive Tageschips bleiben erreichbar
- letzter Tag einer langen Reise erreichbar
- Sticky Hauptnavigation bleibt unbeeinträchtigt

Bestehenden Trip-Workspace-Audit erweitern, nicht parallel neu erfinden.

---

## 8. Tests / Qualität

Erwartet:

- bestehende Tests vollständig grün
- passende Regression für die gemeinsame Mobile-Containerstruktur bzw. relevante Helper/State-Regeln, soweit sinnvoll testbar
- Activities-Regression weiter grün
- Typecheck
- Lint
- Hygiene-Checks
- Production Build
- Vercel Preview

Dokumentiere die tatsächlichen Zahlen erst nach echtem Lauf.

---

## 9. Dokumentation

Nach Umsetzung aktualisieren, soweit tatsächlich betroffen:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `DESIGN_SYSTEM.md` oder `docs/REISEN.md`, falls dort das mobile Muster beschrieben wird
- `DECISIONS.md` nur wenn eine neue dauerhafte Architektur-/Produktentscheidung dokumentationswürdig ist; keine künstliche ADR erzeugen

Dokumentation darf nur bestätigte Fakten enthalten.

---

## 10. Harte Grenzen

Nicht Teil dieser Iteration:

- `Meine Reisen` zusätzlich in der festen Bereichsleiste
- Flight Booking Status
- Hotel-Nächte-Abdeckung
- neue Buchungsstatus-Datenstruktur
- Provider-Integration
- Booking.com/HBX/Duffel/API-Key-Arbeit
- DB-Migration
- RLS-Änderung
- neue API-Route
- Startseite
- Reise-Erstellungsseite
- Desktop-Redesign
- Production-Aktivierung
- Merge

---

## 11. Abschlussbericht

Am Ende kompakt berichten:

- umgesetzt
- betroffene Dateien
- Tests / Browser-Audit mit echten Zahlen
- CI / Build / Preview
- Security / DB / Provider / Kosten
- Dokumentation
- offene Risiken
- Preview-Link

PR #27 bleibt Draft und ungemergt. Danach prüft ChatGPT den Stand unabhängig und der Nutzer testet erneut auf dem echten iPhone.
